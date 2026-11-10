import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminDashboardStatsAction,
  getAdminJobsAction,
  requeueJobAction,
  cancelJobAction,
  resolveTakedownAction,
  toggleUserBanAction,
  getAdminAuditLogAction,
} from "./actions";
import { GET as healthCheckGet } from "@/app/api/health/route";

const adminUser = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: "admin@clipname.tech",
  role: "admin" as const,
};

const regularUser = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  email: "alice@example.com",
  role: "user" as const,
};

let currentAuthenticatedUser: { id: string; email: string; role: "user" | "admin" } = adminUser;

// In-memory mock database store for admin operations
const dbStore = {
  profiles: new Map<string, { id: string; email: string; role: string; banned_at: string | null; priority_credits: number }>([
    [adminUser.id, { id: adminUser.id, email: adminUser.email, role: "admin", banned_at: null, priority_credits: 10 }],
    [regularUser.id, { id: regularUser.id, email: regularUser.email, role: "user", banned_at: null, priority_credits: 0 }],
  ]),
  jobs: new Map<string, { id: string; user_id: string; lane: "free" | "priority"; status: string; error_code?: string | null; error_message?: string | null; retries: number; created_at: string }>([
    ["11111111-1111-1111-1111-111111111111", { id: "11111111-1111-1111-1111-111111111111", user_id: regularUser.id, lane: "free", status: "failed", error_code: "CORRUPT_MEDIA", error_message: "Format error", retries: 1, created_at: new Date().toISOString() }],
    ["22222222-2222-2222-2222-222222222222", { id: "22222222-2222-2222-2222-222222222222", user_id: regularUser.id, lane: "priority", status: "queued", retries: 0, created_at: new Date().toISOString() }],
  ]),
  clips: new Map<string, { id: string; job_id: string; storage_path: string; thumbnail_path: string }>([
    ["33333333-3333-3333-3333-333333333333", { id: "33333333-3333-3333-3333-333333333333", job_id: "11111111-1111-1111-1111-111111111111", storage_path: "clips/clip1.mp4", thumbnail_path: "clips/thumb1.jpg" }],
  ]),
  takedowns: new Map<string, { id: string; reporter_name: string; reporter_email: string; content_url: string; clip_id: string | null; description: string; status: string; created_at: string }>([
    ["44444444-4444-4444-4444-444444444444", { id: "44444444-4444-4444-4444-444444444444", reporter_name: "Legal Agent", reporter_email: "legal@studio.com", content_url: "https://clipname.tech/jobs/1", clip_id: "33333333-3333-3333-3333-333333333333", description: "Infringing clip", status: "pending", created_at: new Date().toISOString() }],
  ]),
  auditLog: [] as { actor_id: string; action: string; target_type: string; target_id: string | null; payload: any; created_at: string }[],
};

vi.mock("@/lib/supabase/server", () => ({
  requireAdminUser: vi.fn(async () => {
    if (currentAuthenticatedUser.role !== "admin") {
      throw { statusCode: 404, message: "Not Found" };
    }
    return currentAuthenticatedUser;
  }),
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "jobs") {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            const jobsArr = Array.from(dbStore.jobs.values());
            if (opts?.count === "exact" && opts?.head) {
              const chain: any = {
                eq: vi.fn((col: string, val: string) => {
                  const filtered = jobsArr.filter((j: any) => j[col] === val);
                  const innerChain: any = {
                    eq: vi.fn((col2: string, val2: string) => ({
                      count: filtered.filter((j: any) => j[col2] === val2).length,
                    })),
                    gte: vi.fn(() => ({ count: filtered.length })),
                    count: filtered.length,
                  };
                  return innerChain;
                }),
                gte: vi.fn(() => ({ count: jobsArr.length })),
                count: jobsArr.length,
              };
              return chain;
            }
            return {
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: jobsArr, error: null })),
              })),
            };
          }),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const job = dbStore.jobs.get(val);
              if (job) {
                Object.assign(job, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            const profilesArr = Array.from(dbStore.profiles.values());
            if (opts?.count === "exact" && opts?.head) {
              return {
                not: vi.fn(() => ({
                  count: profilesArr.filter((p) => p.banned_at !== null).length,
                })),
                count: profilesArr.length,
              };
            }
            return {
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: profilesArr, error: null })),
              })),
            };
          }),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const prof = dbStore.profiles.get(val);
              if (prof) {
                Object.assign(prof, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      if (table === "takedown_requests") {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            const takedownsArr = Array.from(dbStore.takedowns.values());
            if (opts?.count === "exact" && opts?.head) {
              return {
                eq: vi.fn(() => ({ count: takedownsArr.filter((t) => t.status === "pending").length })),
                count: takedownsArr.length,
              };
            }
            return {
              eq: vi.fn((_col: string, val: string) => ({
                single: vi.fn(async () => {
                  const item = dbStore.takedowns.get(val);
                  return { data: item || null, error: item ? null : { message: "Not found" } };
                }),
              })),
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: takedownsArr, error: null })),
              })),
            };
          }),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const item = dbStore.takedowns.get(val);
              if (item) {
                Object.assign(item, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      if (table === "clips") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, val: string) => ({
              single: vi.fn(async () => {
                const clip = dbStore.clips.get(val);
                return { data: clip || null, error: clip ? null : { message: "Not found" } };
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async (_col: string, val: string) => {
              dbStore.clips.delete(val);
              return { error: null };
            }),
          })),
        };
      }

      if (table === "audit_log") {
        return {
          insert: vi.fn(async (fields: any) => {
            dbStore.auditLog.push({ ...fields, created_at: new Date().toISOString() });
            return { error: null };
          }),
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: dbStore.auditLog, error: null })),
            })),
          })),
        };
      }

      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(async () => ({ data: [], error: null })),
      })),
    },
  })),
}));

describe("Part 9 — Admin Console, Moderation & Observability", () => {
  beforeEach(() => {
    currentAuthenticatedUser = adminUser;
    dbStore.auditLog = [];
    dbStore.profiles.set(regularUser.id, { id: regularUser.id, email: regularUser.email, role: "user", banned_at: null, priority_credits: 0 });
    dbStore.jobs.set("11111111-1111-1111-1111-111111111111", { id: "11111111-1111-1111-1111-111111111111", user_id: regularUser.id, lane: "free", status: "failed", error_code: "CORRUPT_MEDIA", error_message: "Format error", retries: 1, created_at: new Date().toISOString() });
    dbStore.jobs.set("22222222-2222-2222-2222-222222222222", { id: "22222222-2222-2222-2222-222222222222", user_id: regularUser.id, lane: "priority", status: "queued", retries: 0, created_at: new Date().toISOString() });
    dbStore.clips.set("33333333-3333-3333-3333-333333333333", { id: "33333333-3333-3333-3333-333333333333", job_id: "11111111-1111-1111-1111-111111111111", storage_path: "clips/clip1.mp4", thumbnail_path: "clips/thumb1.jpg" });
    dbStore.takedowns.set("44444444-4444-4444-4444-444444444444", { id: "44444444-4444-4444-4444-444444444444", reporter_name: "Legal Agent", reporter_email: "legal@studio.com", content_url: "https://clipname.tech/jobs/1", clip_id: "33333333-3333-3333-3333-333333333333", description: "Infringing clip", status: "pending", created_at: new Date().toISOString() });
  });

  describe("RBAC & Security: requireAdminUser", () => {
    it("denies access to regular users with 404 (conceals admin route existence)", async () => {
      currentAuthenticatedUser = regularUser;

      const stats = await getAdminDashboardStatsAction();
      expect(stats.success).toBe(false);

      const jobs = await getAdminJobsAction();
      expect(jobs.success).toBe(false);
    });

    it("allows full access to authenticated admin", async () => {
      currentAuthenticatedUser = adminUser;

      const stats = await getAdminDashboardStatsAction();
      expect(stats.success).toBe(true);
      if (stats.success) {
        expect(stats.data.totalJobs).toBeGreaterThan(0);
      }
    });
  });

  describe("Jobs Control & Retry Operations", () => {
    it("requeues a failed job and writes to audit_log", async () => {
      const jobId = "11111111-1111-1111-1111-111111111111";
      const result = await requeueJobAction(jobId);

      expect(result.success).toBe(true);

      const job = dbStore.jobs.get(jobId);
      expect(job?.status).toBe("queued");
      expect(job?.error_code).toBeNull();
      expect(job?.retries).toBe(0);

      // Verify audit log
      expect(dbStore.auditLog.some((l) => l.action === "requeue_job" && l.target_id === jobId)).toBe(true);
    });

    it("cancels a queued job and writes to audit_log", async () => {
      const jobId = "22222222-2222-2222-2222-222222222222";
      const result = await cancelJobAction(jobId);

      expect(result.success).toBe(true);

      const job = dbStore.jobs.get(jobId);
      expect(job?.status).toBe("failed");
      expect(job?.error_code).toBe("CANCELLED_BY_ADMIN");

      // Verify audit log
      expect(dbStore.auditLog.some((l) => l.action === "cancel_job" && l.target_id === jobId)).toBe(true);
    });
  });

  describe("DMCA Takedown & Moderation Operations", () => {
    it("approves takedown, purges the infringing clip, and writes to audit_log", async () => {
      const requestId = "44444444-4444-4444-4444-444444444444";
      const clipId = "33333333-3333-3333-3333-333333333333";

      const result = await resolveTakedownAction({
        requestId,
        action: "resolved",
        notes: "Copyright holder claim verified",
      });

      expect(result.success).toBe(true);

      // Takedown marked resolved
      const takedown = dbStore.takedowns.get(requestId);
      expect(takedown?.status).toBe("resolved");

      // Clip purged from database
      expect(dbStore.clips.has(clipId)).toBe(false);

      // Verify audit log
      expect(dbStore.auditLog.some((l) => l.action === "takedown_approved" && l.target_id === requestId)).toBe(true);
    });

    it("rejects takedown and keeps clip intact", async () => {
      const requestId = "44444444-4444-4444-4444-444444444444";
      const clipId = "33333333-3333-3333-3333-333333333333";

      const result = await resolveTakedownAction({
        requestId,
        action: "rejected",
        notes: "Claim lacks legitimate standing",
      });

      expect(result.success).toBe(true);

      const takedown = dbStore.takedowns.get(requestId);
      expect(takedown?.status).toBe("rejected");

      // Clip remains untouched
      expect(dbStore.clips.has(clipId)).toBe(true);

      // Verify audit log
      expect(dbStore.auditLog.some((l) => l.action === "takedown_rejected" && l.target_id === requestId)).toBe(true);
    });
  });

  describe("User Moderation & Account Bans", () => {
    it("bans an abusive user and records audit_log", async () => {
      const result = await toggleUserBanAction({
        userId: regularUser.id,
        isBanned: true,
        reason: "Repeat copyright infringement",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bannedAt).not.toBeNull();
      }

      const profile = dbStore.profiles.get(regularUser.id);
      expect(profile?.banned_at).not.toBeNull();

      expect(dbStore.auditLog.some((l) => l.action === "user_banned" && l.target_id === regularUser.id)).toBe(true);
    });

    it("prevents self-ban by administrator", async () => {
      const result = await toggleUserBanAction({
        userId: adminUser.id,
        isBanned: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("BAD_REQUEST");
        expect(result.error).toContain("cannot ban your own");
      }
    });

    it("unbans a suspended user", async () => {
      // First ban
      dbStore.profiles.set(regularUser.id, { ...regularUser, role: "user", banned_at: new Date().toISOString(), priority_credits: 0 });

      // Unban
      const result = await toggleUserBanAction({
        userId: regularUser.id,
        isBanned: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bannedAt).toBeNull();
      }

      const profile = dbStore.profiles.get(regularUser.id);
      expect(profile?.banned_at).toBeNull();
    });
  });

  describe("Audit Log & Observability Endpoint", () => {
    it("retrieves immutable audit log entries", async () => {
      await requeueJobAction("11111111-1111-1111-1111-111111111111");

      const auditResult = await getAdminAuditLogAction();
      expect(auditResult.success).toBe(true);
      if (auditResult.success) {
        expect(auditResult.data.length).toBeGreaterThan(0);
        expect(auditResult.data[0]?.action).toBe("requeue_job");
      }
    });

    it("health check endpoint (/api/health) returns 200 and healthy status", async () => {
      const response = await healthCheckGet();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("healthy");
      expect(json.timestamp).toBeTruthy();
      expect(json.version).toBe("1.0.0");
      expect(json.services).toBeDefined();
    });
  });
});
