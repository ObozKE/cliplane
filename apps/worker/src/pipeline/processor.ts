import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, logger, logBusinessEvent } from "@cliplane/shared";
import { downloadMedia } from "./downloader";
import {
  probeVideo,
  analyzeAudioAndScenes,
  renderVerticalClip,
  renderThumbnail,
} from "./renderer";
import { calculateHighlightWindows } from "./scorer";
import { uploadClipAndThumbnail } from "./uploader";

export interface JobRecord {
  id: string;
  user_id: string;
  lane: "free" | "priority";
  status: "uploaded" | "queued" | "processing" | "complete" | "failed" | "canceled" | "rejected";
  source_type: "upload" | "url";
  source_url: string | null;
  source_path?: string | null;
  storage_path?: string | null;
  original_filename?: string | null;
  duration_seconds?: number | null;
  attempts?: number;
  retries?: number;
  error_code: string | null;
  error_message?: string | null;
}

export interface ProcessorOptions {
  supabase: SupabaseClient;
  job: JobRecord;
  maxDurationSeconds?: number;
  clipsPerJob?: number;
  minClipDuration?: number;
  maxClipDuration?: number;
}

export interface ProcessJobResult {
  jobId: string;
  status: "complete" | "failed";
  clipCount: number;
  durationSeconds: number;
  clips: Array<{
    id: string;
    storagePath: string;
    thumbnailPath: string;
    highlightScore: number;
    duration: number;
  }>;
}

/**
 * Executes the complete media processing pipeline for a single job.
 * Handles isolation, rendering, storage upload, DB transaction, and error resilience.
 */
export async function processJob(
  options: ProcessorOptions,
): Promise<ProcessJobResult> {
  const {
    supabase,
    job,
    maxDurationSeconds = 300,
    clipsPerJob = 3,
    minClipDuration = 15,
    maxClipDuration = 30,
  } = options;

  logger.info(
    { jobId: job.id, userId: job.user_id, lane: job.lane, source: job.source_type },
    "Starting worker pipeline for job",
  );

  // 1. Mark job as processing
  await supabase
    .from("jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  // 2. Create isolated temporary working directory
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `cliplane_job_${job.id}_`),
  );

  const downloadedMediaFile = path.join(tempDir, "input_media.mp4");
  const startTime = Date.now();

  try {
    // 3. Download source media
    await downloadMedia({
      supabase,
      job,
      destPath: downloadedMediaFile,
    });

    // 4. Validate & inspect media container via FFprobe
    const probe = await probeVideo(downloadedMediaFile, maxDurationSeconds);

    // Update job timestamp in database
    await supabase
      .from("jobs")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 5. Analyze audio loudness bursts (ebur128) & visual scene cuts
    const { loudnessPoints, sceneTimestamps } = await analyzeAudioAndScenes(
      downloadedMediaFile,
      probe.hasAudio,
    );

    // 6. Calculate top non-overlapping highlight windows
    const highlightWindows = calculateHighlightWindows({
      duration: probe.duration,
      loudnessPoints,
      sceneTimestamps,
      targetClipDuration: 20,
      minClipDuration,
      maxClipDuration,
      clipCount: clipsPerJob,
      preRollSeconds: 2,
    });

    if (highlightWindows.length === 0) {
      throw new AppError({
        code: "NO_HIGHLIGHTS_DETECTED",
        message: "No suitable highlight segments could be extracted from video",
        status: 400,
      });
    }

    // 7. Render clips & thumbnails, upload to storage, and insert clips rows
    const generatedClips: Array<{
      id: string;
      storagePath: string;
      thumbnailPath: string;
      highlightScore: number;
      duration: number;
    }> = [];

    for (let i = 0; i < highlightWindows.length; i++) {
      const window = highlightWindows[i];
      if (!window) continue;
      const clipIndex = i + 1;
      const localClipPath = path.join(tempDir, `clip_${clipIndex}.mp4`);
      const localThumbPath = path.join(tempDir, `thumb_${clipIndex}.jpg`);

      // Render 9:16 vertical clip with blurred background fill
      await renderVerticalClip({
        inputPath: downloadedMediaFile,
        outputPath: localClipPath,
        startTime: window.startTime,
        duration: window.duration,
      });

      // Render thumbnail at 1s into the clip or midpoint
      const thumbTimestamp = Math.min(
        window.startTime + window.duration,
        window.startTime + 1,
      );
      await renderThumbnail({
        inputPath: downloadedMediaFile,
        outputPath: localThumbPath,
        timestamp: thumbTimestamp,
      });

      // Upload to private Supabase Storage 'clips' bucket
      const { clipStoragePath, thumbnailStoragePath } =
        await uploadClipAndThumbnail({
          supabase,
          userId: job.user_id,
          jobId: job.id,
          clipIndex,
          localClipPath,
          localThumbnailPath: localThumbPath,
        });

      // Insert record into clips table
      const clipId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("clips").insert({
        id: clipId,
        job_id: job.id,
        title: `Highlight #${clipIndex} (${Math.round(window.highlightScore * 100)}%)`,
        storage_path: clipStoragePath,
        thumbnail_path: thumbnailStoragePath,
        duration: window.duration,
        score: window.highlightScore,
        start_time: window.startTime,
        end_time: window.endTime,
      });

      if (insertError) {
        throw new AppError({
          code: "CLIP_INSERT_FAILED",
          message: `Failed to insert clip record: ${insertError.message}`,
          status: 500,
        });
      }

      generatedClips.push({
        id: clipId,
        storagePath: clipStoragePath,
        thumbnailPath: thumbnailStoragePath,
        highlightScore: window.highlightScore,
        duration: window.duration,
      });
    }

    // 8. Mark job as complete
    await supabase
      .from("jobs")
      .update({
        status: "complete",
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    logBusinessEvent({
      event: "job_completed",
      jobId: job.id,
      userId: job.user_id,
      details: {
        lane: job.lane,
        clipCount: generatedClips.length,
        durationSeconds: elapsedSeconds,
      },
    });

    return {
      jobId: job.id,
      status: "complete",
      clipCount: generatedClips.length,
      durationSeconds: elapsedSeconds,
      clips: generatedClips,
    };
  } catch (err: unknown) {
    const isAppError = err instanceof AppError;
    const errorCode = isAppError ? err.code : "PROCESSING_ERROR";

    logger.error(
      {
        jobId: job.id,
        userId: job.user_id,
        errorCode,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
      "Job processing failed",
    );

    const isFatal = [
      "INVALID_VIDEO_FORMAT",
      "NO_VIDEO_STREAM",
      "CORRUPT_VIDEO_DURATION",
      "DURATION_EXCEEDED",
      "UNSUPPORTED_CODEC",
      "RESOLUTION_EXCEEDED",
      "SSRF_URL_REJECTED",
      "INVALID_CONTENT_TYPE",
      "STORAGE_IDOR_VIOLATION",
      "NO_HIGHLIGHTS_DETECTED",
      "MISSING_STORAGE_PATH",
    ].includes(errorCode);

    const currentAttempts = job.attempts ?? job.retries ?? 0;
    if (!isFatal && currentAttempts < 3) {
      // Retryable error: re-queue with backoff
      await supabase
        .from("jobs")
        .update({
          status: "queued",
          attempts: currentAttempts + 1,
          error_code: errorCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } else {
      // Fatal or retries exhausted: mark failed
      await supabase
        .from("jobs")
        .update({
          status: "failed",
          attempts: currentAttempts + 1,
          error_code: errorCode,
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      logBusinessEvent({
        event: "job_failed",
        jobId: job.id,
        userId: job.user_id,
        details: {
          errorCode,
          attempts: currentAttempts + 1,
        },
      });
    }

    return {
      jobId: job.id,
      status: "failed",
      clipCount: 0,
      durationSeconds: Math.round((Date.now() - startTime) / 1000),
      clips: [],
    };
  } finally {
    // 9. Always clean up temporary directory and media files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      logger.warn(
        { tempDir, err: cleanupErr },
        "Failed to clean up temporary directory",
      );
    }
  }
}
