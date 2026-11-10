import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@cliplane/shared";

export interface CleanupOptions {
  supabase: SupabaseClient;
  retentionDays?: number; // default 3 days
}

export interface CleanupResult {
  jobsCleanedCount: number;
  filesDeletedCount: number;
}

/**
 * Scheduled cleanup task: removes media and generated clips older than
 * retention days (default 3 days) to respect free-tier storage boundaries.
 */
export async function runRetentionCleanup(
  options: CleanupOptions,
): Promise<CleanupResult> {
  const { supabase, retentionDays = 3 } = options;
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  logger.info(
    { retentionDays, cutoffDate: cutoffDate.toISOString() },
    "Starting media retention cleanup",
  );

  // Find completed or failed jobs older than cutoffDate
  const { data: expiredJobs, error } = await supabase
    .from("jobs")
    .select("id, user_id, storage_path, status, created_at")
    .in("status", ["complete", "failed"])
    .lt("created_at", cutoffDate.toISOString())
    .limit(100);

  if (error || !expiredJobs || expiredJobs.length === 0) {
    logger.info("No expired jobs eligible for retention cleanup");
    return { jobsCleanedCount: 0, filesDeletedCount: 0 };
  }

  let filesDeleted = 0;
  let jobsCleaned = 0;

  for (const job of expiredJobs) {
    try {
      // 1. Delete upload source file if exists
      if (job.storage_path) {
        const { error: delUploadErr } = await supabase.storage
          .from("uploads")
          .remove([job.storage_path]);
        if (!delUploadErr) {
          filesDeleted++;
        }
      }

      // 2. Query clips associated with job to delete their storage files
      const { data: clips } = await supabase
        .from("clips")
        .select("id, storage_path, thumbnail_path")
        .eq("job_id", job.id);

      if (clips && clips.length > 0) {
        const pathsToDelete: string[] = [];
        for (const clip of clips) {
          if (clip.storage_path) pathsToDelete.push(clip.storage_path);
          if (clip.thumbnail_path) pathsToDelete.push(clip.thumbnail_path);
        }

        if (pathsToDelete.length > 0) {
          const { error: delClipsErr } = await supabase.storage
            .from("clips")
            .remove(pathsToDelete);
          if (!delClipsErr) {
            filesDeleted += pathsToDelete.length;
          }
        }

        // Delete clips records
        await supabase.from("clips").delete().eq("job_id", job.id);
      }

      // 3. Mark job as archived / cleaned
      await supabase
        .from("jobs")
        .update({
          storage_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      jobsCleaned++;
    } catch (jobCleanupErr) {
      logger.error(
        { jobId: job.id, err: jobCleanupErr },
        "Error cleaning up expired job assets",
      );
    }
  }

  logger.info(
    { jobsCleaned, filesDeleted },
    "Completed media retention cleanup",
  );

  return {
    jobsCleanedCount: jobsCleaned,
    filesDeletedCount: filesDeleted,
  };
}
