import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getClipSignedUrlsAction,
  getClipDownloadUrlAction,
  reportClipAction,
} from "./actions";

// Mock Supabase Server client and authenticated user
const mockUser = {
  id: "user-alice-1111",
  email: "alice@example.com",
};

let currentAuthenticatedUser = mockUser;

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(async () => currentAuthenticatedUser),
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "jobs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_field1: string, val1: string) => ({
              eq: vi.fn((_field2: string, val2: string) => ({
                single: vi.fn(async () => {
                  // If querying job for currentAuthenticatedUser
                  if (val1 === "job-alice-1" && val2 === currentAuthenticatedUser.id) {
                    return {
                      data: { id: "job-alice-1", user_id: currentAuthenticatedUser.id },
                      error: null,
                    };
                  }
                  // Return not found if requesting another user's job
                  return { data: null, error: { message: "Job not found" } };
                }),
              })),
            })),
          })),
        };
      }

      if (table === "clips") {
        return {
          select: vi.fn((cols: string) => {
            // Check if joining jobs
            if (cols.includes("jobs!inner")) {
              return {
                eq: vi.fn((_field: string, val: string) => ({
                  single: vi.fn(async () => {
                    if (val === "clip-alice-1") {
                      return {
                        data: {
                          id: "clip-alice-1",
                          storage_path: "user-alice-1111/job-1/clip_1.mp4",
                          job_id: "job-alice-1",
                          jobs: { id: "job-alice-1", user_id: "user-alice-1111" },
                        },
                        error: null,
                      };
                    }
                    if (val === "clip-bob-1") {
                      return {
                        data: {
                          id: "clip-bob-1",
                          storage_path: "user-bob-9999/job-2/clip_1.mp4",
                          job_id: "job-bob-1",
                          jobs: { id: "job-bob-1", user_id: "user-bob-9999" },
                        },
                        error: null,
                      };
                    }
                    return { data: null, error: { message: "Not found" } };
                  }),
                })),
              };
            }

            // Direct clips query
            return {
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [
                    {
                      id: "clip-alice-1",
                      title: "Highlight #1 (88%)",
                      start_time: 12.0,
                      end_time: 30.0,
                      duration: 18.0,
                      score: 0.88,
                      storage_path: "user-alice-1111/job-1/clip_1.mp4",
                      thumbnail_path: "user-alice-1111/job-1/thumbnail_1.jpg",
                      created_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                })),
              })),
            };
          }),
        };
      }

      if (table === "takedown_requests") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: "takedown-test-uuid-1234" },
                error: null,
              })),
            })),
          })),
        };
      }

      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async (path: string, ttl: number, options?: { download?: string }) => ({
          data: {
            signedUrl: `https://mock.supabase.co/storage/v1/object/sign/clips/${path}?token=mock_jwt&ttl=${ttl}${options?.download ? `&download=${options.download}` : ""}`,
          },
          error: null,
        })),
      })),
    },
  })),
}));

// Mock rate-limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true, remaining: 10, limit: 10, reset: 3600 })),
}));

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((header: string) => {
      if (header === "x-forwarded-for") return "198.51.100.42";
      return null;
    }),
  })),
}));

describe("Clips & Guardrails Actions", () => {
  beforeEach(() => {
    currentAuthenticatedUser = mockUser;
  });

  describe("IDOR Protection: getClipSignedUrlsAction", () => {
    it("returns signed URLs when user owns the requested job", async () => {
      currentAuthenticatedUser = mockUser;
      const result = await getClipSignedUrlsAction("job-alice-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        const first = result.data[0]!;
        expect(first.videoUrl).toContain("user-alice-1111/job-1/clip_1.mp4");
        expect(first.thumbnailUrl).toContain("user-alice-1111/job-1/thumbnail_1.jpg");
        expect(first.score).toBe(0.88);
      }
    });

    it("prevents IDOR: denies access when requesting another user's job", async () => {
      // Alice tries to request Bob's job
      currentAuthenticatedUser = mockUser;
      const result = await getClipSignedUrlsAction("job-bob-victim");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
        expect(result.error).toContain("access denied");
      }
    });
  });

  describe("IDOR Protection: getClipDownloadUrlAction", () => {
    it("generates signed download URL when user owns the clip's job", async () => {
      currentAuthenticatedUser = mockUser;
      const result = await getClipDownloadUrlAction("clip-alice-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.downloadUrl).toContain("download=cliplane_highlight_");
        expect(result.data.filename).toBe("cliplane_highlight_clip-ali.mp4");
      }
    });

    it("prevents IDOR: denies download when requesting a clip owned by another user", async () => {
      // Alice tries to download Bob's clip
      currentAuthenticatedUser = mockUser;
      const result = await getClipDownloadUrlAction("clip-bob-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN");
        expect(result.error).toContain("permission");
      }
    });
  });

  describe("Content Guardrails: reportClipAction", () => {
    it("submits valid takedown notice and returns report reference ID", async () => {
      const result = await reportClipAction({
        reporterName: "Acme Copyright Enforcement",
        reporterEmail: "legal@acme.com",
        contentUrl: "https://cliplane.tech/jobs/job-alice-1",
        clipId: "11111111-1111-1111-1111-111111111111",
        description: "This clip contains proprietary gameplay footage without publisher authorization.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reportId).toBe("takedown-test-uuid-1234");
      }
    });

    it("rejects invalid takedown submission with hostile/short descriptions", async () => {
      const result = await reportClipAction({
        reporterName: "J", // Too short (min 2)
        reporterEmail: "not-an-email",
        contentUrl: "not-a-url",
        description: "short", // Too short (min 20)
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_FAILED");
      }
    });
  });
});
