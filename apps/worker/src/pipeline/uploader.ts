import fs from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, logger } from "@cliplane/shared";

export interface UploadClipResult {
  clipStoragePath: string;
  thumbnailStoragePath: string;
}

export interface UploadOptions {
  supabase: SupabaseClient;
  userId: string;
  jobId: string;
  clipIndex: number;
  localClipPath: string;
  localThumbnailPath: string;
}

/**
 * Uploads a rendered clip and thumbnail to Supabase Storage.
 * Ensures strict ownership isolation by prefixing paths with user_id/job_id.
 */
export async function uploadClipAndThumbnail(
  options: UploadOptions,
): Promise<UploadClipResult> {
  const {
    supabase,
    userId,
    jobId,
    clipIndex,
    localClipPath,
    localThumbnailPath,
  } = options;

  const clipStoragePath = `${userId}/${jobId}/clip_${clipIndex}.mp4`;
  const thumbnailStoragePath = `${userId}/${jobId}/thumbnail_${clipIndex}.jpg`;

  if (!fs.existsSync(localClipPath)) {
    throw new AppError({
      code: "CLIP_FILE_MISSING",
      message: `Rendered clip not found at ${localClipPath}`,
      status: 500,
    });
  }

  if (!fs.existsSync(localThumbnailPath)) {
    throw new AppError({
      code: "THUMBNAIL_FILE_MISSING",
      message: `Thumbnail not found at ${localThumbnailPath}`,
      status: 500,
    });
  }

  const clipBuffer = await fs.promises.readFile(localClipPath);
  const thumbBuffer = await fs.promises.readFile(localThumbnailPath);

  logger.info(
    { jobId, clipIndex, clipStoragePath, thumbnailStoragePath },
    "Uploading rendered clip and thumbnail to Supabase Storage",
  );

  // Upload Clip MP4
  const { error: clipError } = await supabase.storage
    .from("clips")
    .upload(clipStoragePath, clipBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (clipError) {
    throw new AppError({
      code: "CLIP_STORAGE_UPLOAD_FAILED",
      message: `Failed to upload clip to Supabase Storage: ${clipError.message}`,
      status: 500,
    });
  }

  // Upload Thumbnail JPG
  const { error: thumbError } = await supabase.storage
    .from("clips")
    .upload(thumbnailStoragePath, thumbBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (thumbError) {
    throw new AppError({
      code: "THUMBNAIL_STORAGE_UPLOAD_FAILED",
      message: `Failed to upload thumbnail to Supabase Storage: ${thumbError.message}`,
      status: 500,
    });
  }

  return { clipStoragePath, thumbnailStoragePath };
}
