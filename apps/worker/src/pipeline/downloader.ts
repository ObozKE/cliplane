import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, validateDirectVideoUrl, logger } from "@cliplane/shared";

export interface DownloadOptions {
  supabase: SupabaseClient;
  job: {
    id: string;
    user_id: string;
    source_type: "upload" | "url";
    storage_path?: string | null;
    source_path?: string | null;
    source_url: string | null;
  };
  destPath: string;
  maxSizeBytes?: number; // default 200MB
  timeoutMs?: number; // default 60s
}

/**
 * Downloads a job's media file to a local destination path.
 * Supports both private Supabase Storage uploads and SSRF-validated direct URLs.
 */
export async function downloadMedia(options: DownloadOptions): Promise<{ sizeBytes: number }> {
  const {
    supabase,
    job,
    destPath,
    maxSizeBytes = 200 * 1024 * 1024,
    timeoutMs = 60_000,
  } = options;

  if (job.source_type === "upload") {
    const rawPath = job.source_path || job.storage_path;
    if (!rawPath) {
      throw new AppError({
        code: "MISSING_STORAGE_PATH",
        message: "Job marked as upload but storage_path / source_path is missing",
        status: 400,
      });
    }

    // IDOR safety check on path prefix: must belong to the job's user_id
    if (!rawPath.startsWith(`${job.user_id}/`)) {
      throw new AppError({
        code: "STORAGE_IDOR_VIOLATION",
        message: "Storage path does not match user ownership prefix",
        status: 403,
      });
    }

    logger.info(
      { jobId: job.id, storagePath: rawPath },
      "Downloading upload from Supabase Storage",
    );

    const { data, error } = await supabase.storage
      .from("uploads")
      .download(rawPath);

    if (error || !data) {
      throw new AppError({
        code: "STORAGE_DOWNLOAD_FAILED",
        message: `Failed to download file from Supabase Storage: ${error?.message || "unknown error"}`,
        status: 500,
      });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > maxSizeBytes) {
      throw new AppError({
        code: "FILE_TOO_LARGE",
        message: `File size (${buffer.length} bytes) exceeds limit (${maxSizeBytes} bytes)`,
        status: 413,
      });
    }

    await fs.promises.writeFile(destPath, buffer);
    return { sizeBytes: buffer.length };
  }

  if (job.source_type === "url") {
    if (!job.source_url) {
      throw new AppError({
        code: "MISSING_SOURCE_URL",
        message: "Job marked as url but source_url is missing",
        status: 400,
      });
    }

    // SSRF Validation: resolves DNS, blocks private/loopback/link-local/metadata ranges
    try {
      await validateDirectVideoUrl(job.source_url);
    } catch (err) {
      if (err instanceof AppError) {
        if (err.code === "SSRF_DETECTED" || err.code === "INVALID_URL") {
          throw new AppError({
            code: "SSRF_URL_REJECTED",
            message: `Direct URL rejected: ${err.message}`,
            status: 400,
          });
        }
        throw err;
      }
      throw new AppError({
        code: "SSRF_URL_REJECTED",
        message: "Direct URL rejected by security policy",
        status: 400,
      });
    }

    logger.info(
      { jobId: job.id, sourceUrl: job.source_url },
      "Streaming direct video URL with SSRF protection",
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(job.source_url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ClipLane-Worker/1.0",
        },
      });

      if (!response.ok) {
        throw new AppError({
          code: "URL_FETCH_FAILED",
          message: `Direct URL returned HTTP ${response.status}`,
          status: 400,
        });
      }

      // Check Content-Type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("video/")) {
        throw new AppError({
          code: "INVALID_CONTENT_TYPE",
          message: `Expected video/* Content-Type, got ${contentType || "none"}`,
          status: 400,
        });
      }

      // Check Content-Length if provided
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const declaredLength = parseInt(contentLengthHeader, 10);
        if (declaredLength > maxSizeBytes) {
          throw new AppError({
            code: "FILE_TOO_LARGE",
            message: `Declared file size (${declaredLength} bytes) exceeds limit (${maxSizeBytes} bytes)`,
            status: 413,
          });
        }
      }

      if (!response.body) {
        throw new AppError({
          code: "EMPTY_RESPONSE_BODY",
          message: "Video URL returned empty body",
          status: 400,
        });
      }

      // Stream to file enforcing byte cap during download
      let totalBytes = 0;
      const fileStream = fs.createWriteStream(destPath);
      // Convert web readable stream to Node stream
      // @ts-expect-error Node fetch stream conversion
      const nodeStream = Readable.fromWeb(response.body);

      nodeStream.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxSizeBytes) {
          controller.abort();
          fileStream.destroy();
          throw new AppError({
            code: "FILE_TOO_LARGE",
            message: `Downloaded size exceeded ${maxSizeBytes} bytes limit`,
            status: 413,
          });
        }
      });

      await pipeline(nodeStream, fileStream);
      return { sizeBytes: totalBytes };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError({
        code: "URL_DOWNLOAD_FAILED",
        message: `Failed to download media URL: ${message}`,
        status: 400,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError({
    code: "UNSUPPORTED_SOURCE_TYPE",
    message: `Unknown source type: ${(job as { source_type: string }).source_type}`,
    status: 400,
  });
}
