import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJobAction, getJobDetailAction } from "./actions";
import { checkRateLimit } from "@/lib/rate-limit";

// Mock Supabase Server Client & Auth
const mockUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "creator@clipname.tech",
  role: "user",
  bannedAt: null,
};

const otherUser = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "victim@clipname.tech",
  role: "user",
  bannedAt: null,
};

let currentUser = mockUser;

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(async () => currentUser),
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "jobs") {
        return {
          insert: vi.fn((data: any) => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn(async () => ({
              data: { id: "job-new-123", ...data },
              error: null,
            })),
          })),
          select: vi.fn((_cols: any, opts?: any) => {
            if (opts?.count === "exact") {
              return {
                eq: vi.fn().mockReturnThis(),
                lt: vi.fn().mockResolvedValue({ count: 2, error: null }),
              };
            }
            return {
              eq: vi.fn(function (_col: string, val: any) {
                return {
                  eq: vi.fn(function (_col2: string, val2: any) {
                    return {
                      single: vi.fn(async () => {
                        // Job belongs to mockUser
                        if (val === "job-user-a" && val2 === mockUser.id) {
                          return {
                            data: {
                              id: "job-user-a",
                              user_id: mockUser.id,
                              source_type: "upload",
                              source_path: `${mockUser.id}/file.mp4`,
                              status: "queued",
                              lane: "free",
                              created_at: new Date().toISOString(),
                            },
                            error: null,
                          };
                        }
                        // Job belongs to otherUser
                        if (val === "job-user-b" && val2 === otherUser.id) {
                          return {
                            data: {
                              id: "job-user-b",
                              user_id: otherUser.id,
                              source_type: "upload",
                              source_path: `${otherUser.id}/file.mp4`,
                              status: "queued",
                              lane: "free",
                              created_at: new Date().toISOString(),
                            },
                            error: null,
                          };
                        }
                        // If user querying does not own the job, return null error (IDOR protection)
                        return { data: null, error: { message: "Not found" } };
                      }),
                    };
                  }),
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }),
            };
          }),
        };
      }
      if (table === "clips") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    },
  })),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map([["x-forwarded-for", "127.0.0.1"]])),
  cookies: vi.fn(async () => ({ get: vi.fn(), set: vi.fn() })),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Part 4 — Job Creation, Intake & IDOR Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  describe("Job Intake: Direct Upload", () => {
    it("successfully creates a queued job when upload gate is checked and path matches user UUID", async () => {
      const formData = new FormData();
      formData.append("sourceType", "upload");
      formData.append("confirmOwnership", "true");
      formData.append("sourcePath", `${mockUser.id}/video_fixture.mp4`);

      const result = await createJobAction(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jobId).toBe("job-new-123");
      }
    });

    it("rejects job creation if the upload gate is not confirmed", async () => {
      const formData = new FormData();
      formData.append("sourceType", "upload");
      formData.append("confirmOwnership", "false");
      formData.append("sourcePath", `${mockUser.id}/video_fixture.mp4`);

      const result = await createJobAction(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_FAILED");
      }
    });

    it("strictly prevents IDOR on storage path (rejects attempting to claim another user's file)", async () => {
      const formData = new FormData();
      formData.append("sourceType", "upload");
      formData.append("confirmOwnership", "true");
      // Malicious attempt: User A referencing User B's folder
      formData.append("sourcePath", `${otherUser.id}/stolen_video.mp4`);

      const result = await createJobAction(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN");
        expect(result.error).toContain("Path must match your user session");
      }
    });
  });

  describe("Job Intake: Direct Video URL & SSRF Guardrails", () => {
    it("accepts a valid public direct HTTPS video URL", async () => {
      const formData = new FormData();
      formData.append("sourceType", "url");
      formData.append("confirmOwnership", "true");
      formData.append("sourceUrl", "https://example.com/clips/highlight.mp4");

      const result = await createJobAction(formData);
      expect(result.success).toBe(true);
    });

    it("rejects social platform URLs (YouTube, TikTok, Twitch) with friendly error", async () => {
      const formData = new FormData();
      formData.append("sourceType", "url");
      formData.append("confirmOwnership", "true");
      formData.append("sourceUrl", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      const result = await createJobAction(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("YouTube, TikTok, and social page URLs are not supported");
      }
    });

    it("rejects internal and loopback IP addresses (SSRF Protection)", async () => {
      const formData = new FormData();
      formData.append("sourceType", "url");
      formData.append("confirmOwnership", "true");
      formData.append("sourceUrl", "http://127.0.0.1:8080/internal.mp4");

      const result = await createJobAction(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("SSRF_DETECTED");
      }
    });

    it("rejects cloud metadata IP addresses (169.254.169.254)", async () => {
      const formData = new FormData();
      formData.append("sourceType", "url");
      formData.append("confirmOwnership", "true");
      formData.append("sourceUrl", "http://169.254.169.254/latest/meta-data");

      const result = await createJobAction(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("SSRF_DETECTED");
      }
    });
  });

  describe("Strict Authorization & IDOR on Job Details", () => {
    it("allows a creator to retrieve their own job details and computed queue state", async () => {
      currentUser = mockUser;
      const detail = await getJobDetailAction("job-user-a");

      expect(detail).not.toBeNull();
      expect(detail?.job.id).toBe("job-user-a");
      expect(detail?.job.lane).toBe("free");
      expect(detail?.queueState).toBeDefined();
    });

    it("strictly prevents User A from reading User B's job details (returns null -> 404)", async () => {
      currentUser = mockUser;
      // User A requesting User B's job
      const detail = await getJobDetailAction("job-user-b");

      // IDOR blocked: must return null so page renders 404 not found
      expect(detail).toBeNull();
    });
  });

  describe("Rate Limiting on Job Creation", () => {
    it("limits job creation to 10 jobs per hour per user", async () => {
      const testUser = `rate-limit-job-${Date.now()}`;

      for (let i = 0; i < 10; i++) {
        const check = await checkRateLimit("jobCreate", testUser);
        expect(check.success).toBe(true);
      }

      // 11th job must be blocked by rate limit
      const blocked = await checkRateLimit("jobCreate", testUser);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });
  });
});
