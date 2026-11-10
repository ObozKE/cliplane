import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import { downloadMedia } from "./downloader";
import { AppError } from "@clipname/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Downloader Pipeline & Security Controls", () => {
  const dummySupabase = {} as SupabaseClient;
  const dummyDest = path.join(os.tmpdir(), "dummy_dest.mp4");

  describe("SSRF Protection", () => {
    it("rejects private IPv4 addresses (127.0.0.1, 10.0.0.1, 192.168.1.1, 169.254.169.254)", async () => {
      const privateUrls = [
        "https://127.0.0.1/video.mp4",
        "https://10.0.0.1/video.mp4",
        "https://192.168.1.100/video.mp4",
        "https://169.254.169.254/latest/meta-data/",
        "https://localhost/video.mp4",
      ];

      for (const url of privateUrls) {
        await expect(
          downloadMedia({
            supabase: dummySupabase,
            job: {
              id: "test-job",
              user_id: "user-123",
              source_type: "url",
              storage_path: null,
              source_url: url,
            },
            destPath: dummyDest,
          }),
        ).rejects.toThrowError(AppError);

        try {
          await downloadMedia({
            supabase: dummySupabase,
            job: {
              id: "test-job",
              user_id: "user-123",
              source_type: "url",
              storage_path: null,
              source_url: url,
            },
            destPath: dummyDest,
          });
        } catch (err) {
          expect((err as AppError).code).toBe("SSRF_URL_REJECTED");
        }
      }
    });

    it("rejects non-https schemes (file://, gopher://, ftp://)", async () => {
      const nonHttpsUrls = [
        "http://example.com/video.mp4",
        "file:///etc/passwd",
        "ftp://ftp.example.com/video.mp4",
      ];

      for (const url of nonHttpsUrls) {
        await expect(
          downloadMedia({
            supabase: dummySupabase,
            job: {
              id: "test-job",
              user_id: "user-123",
              source_type: "url",
              storage_path: null,
              source_url: url,
            },
            destPath: dummyDest,
          }),
        ).rejects.toThrowError(AppError);
      }
    });
  });

  describe("Storage IDOR Protection", () => {
    it("rejects download when storage_path does not begin with user_id prefix", async () => {
      const targetUser = "user-alice-123";
      const victimStoragePath = "user-bob-999/private_footage.mp4";

      await expect(
        downloadMedia({
          supabase: dummySupabase,
          job: {
            id: "job-attack",
            user_id: targetUser,
            source_type: "upload",
            storage_path: victimStoragePath,
            source_url: null,
          },
          destPath: dummyDest,
        }),
      ).rejects.toThrowError(AppError);

      try {
        await downloadMedia({
          supabase: dummySupabase,
          job: {
            id: "job-attack",
            user_id: targetUser,
            source_type: "upload",
            storage_path: victimStoragePath,
            source_url: null,
          },
          destPath: dummyDest,
        });
      } catch (err) {
        expect((err as AppError).code).toBe("STORAGE_IDOR_VIOLATION");
      }
    });
  });
});
