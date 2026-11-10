import { describe, it, expect, vi } from "vitest";
import { runRetentionCleanup } from "./cleanup";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Retention Cleanup Task", () => {
  it("deletes storage files and cleans expired job references", async () => {
    const mockUploadsRemove = vi.fn().mockResolvedValue({ error: null });
    const mockClipsRemove = vi.fn().mockResolvedValue({ error: null });
    const mockClipsDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockJobsUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "job-old-1",
                        user_id: "user-1",
                        storage_path: "user-1/old_upload.mp4",
                        status: "complete",
                        created_at: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockJobsUpdate,
          };
        }
        if (table === "clips") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "clip-1",
                    storage_path: "user-1/job-old-1/clip_1.mp4",
                    thumbnail_path: "user-1/job-old-1/thumbnail_1.jpg",
                  },
                ],
                error: null,
              }),
            }),
            delete: mockClipsDelete,
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockImplementation((bucket: string) => {
          if (bucket === "uploads") {
            return { remove: mockUploadsRemove };
          }
          if (bucket === "clips") {
            return { remove: mockClipsRemove };
          }
          return {};
        }),
      },
    } as unknown as SupabaseClient;

    const result = await runRetentionCleanup({
      supabase: mockSupabase,
      retentionDays: 3,
    });

    expect(result.jobsCleanedCount).toBe(1);
    expect(result.filesDeletedCount).toBe(3); // 1 upload + 1 clip + 1 thumb
    expect(mockUploadsRemove).toHaveBeenCalledWith(["user-1/old_upload.mp4"]);
    expect(mockClipsRemove).toHaveBeenCalledWith([
      "user-1/job-old-1/clip_1.mp4",
      "user-1/job-old-1/thumbnail_1.jpg",
    ]);
  });
});
