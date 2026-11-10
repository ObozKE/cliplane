import { describe, it, expect, vi } from "vitest";
import { processJob, type JobRecord } from "./processor";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Worker Processor Pipeline Resilience", () => {
  it("marks job as failed with safe error code when input media is corrupt", async () => {
    let updatedStatus = "";
    let updatedErrorCode = "";

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((fields: Record<string, unknown>) => {
          if (fields.status) updatedStatus = String(fields.status);
          if (fields.error_code) updatedErrorCode = String(fields.error_code);
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({
            data: {
              arrayBuffer: async () => Buffer.from("NOT_A_VALID_MP4_FILE"),
            },
            error: null,
          }),
        }),
      },
    } as unknown as SupabaseClient;

    const testJob: JobRecord = {
      id: "job-corrupt-1",
      user_id: "user-1",
      lane: "free",
      status: "queued",
      source_type: "upload",
      source_url: null,
      storage_path: "user-1/corrupt.mp4",
      original_filename: "corrupt.mp4",
      duration_seconds: null,
      retries: 0,
      error_code: null,
      error_message: null,
    };

    const result = await processJob({
      supabase: mockSupabase,
      job: testJob,
    });

    expect(result.status).toBe("failed");
    expect(result.clipCount).toBe(0);
    expect(updatedStatus).toBe("failed");
    expect(updatedErrorCode).toBe("INVALID_VIDEO_FORMAT");
  });

  it("marks job as failed immediately on fatal SSRF URL rejection without retrying", async () => {
    let updatedStatus = "";
    let updatedErrorCode = "";

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((fields: Record<string, unknown>) => {
          if (fields.status) updatedStatus = String(fields.status);
          if (fields.error_code) updatedErrorCode = String(fields.error_code);
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      }),
    } as unknown as SupabaseClient;

    const testJob: JobRecord = {
      id: "job-ssrf-1",
      user_id: "user-1",
      lane: "free",
      status: "queued",
      source_type: "url",
      source_url: "https://127.0.0.1/malicious.mp4",
      storage_path: null,
      original_filename: null,
      duration_seconds: null,
      retries: 0,
      error_code: null,
      error_message: null,
    };

    const result = await processJob({
      supabase: mockSupabase,
      job: testJob,
    });

    expect(result.status).toBe("failed");
    expect(updatedStatus).toBe("failed");
    expect(updatedErrorCode).toBe("SSRF_URL_REJECTED");
  });
});
