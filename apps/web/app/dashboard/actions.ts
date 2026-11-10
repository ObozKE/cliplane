"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser, createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createJobInputSchema,
  validateDirectVideoUrl,
  logBusinessEvent,
  errorResult,
  successResult,
  type ActionResult,
  computeQueueState,
  logger,
} from "@cliplane/shared";

export interface CreateJobResponse {
  jobId: string;
}

/**
 * Server Action to create a new clipping job.
 * Enforces authentication, hostile input validation, rate limiting,
 * upload gate confirmation, and path prefix ownership (IDOR prevention).
 */
export async function createJobAction(
  formData: FormData,
): Promise<ActionResult<CreateJobResponse>> {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();

    // 2. Rate limit job creations (10 jobs / hour / user)
    await enforceRateLimit("jobCreate", user.id);

    // 3. Extract and parse input data
    const sourceType = formData.get("sourceType") as "upload" | "url";
    const confirmOwnership = formData.get("confirmOwnership") === "true";
    const sourcePath = formData.get("sourcePath") as string | null;
    const sourceUrl = formData.get("sourceUrl") as string | null;

    const rawInput = {
      sourceType,
      confirmOwnership,
      ...(sourceType === "upload" ? { sourcePath: sourcePath || "" } : {}),
      ...(sourceType === "url" ? { sourceUrl: sourceUrl || "" } : {}),
    };

    const parsed = createJobInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return errorResult(
        parsed.error.errors[0]?.message || "Validation failed for job intake.",
        "VALIDATION_FAILED",
      );
    }

    const supabase = await createClient();

    // 4. Validate source intake specifics
    if (parsed.data.sourceType === "upload") {
      const storagePath = parsed.data.sourcePath;
      // Enforce that storage path is within the user's UUID folder (No IDOR)
      if (!storagePath.startsWith(`${user.id}/`)) {
        return errorResult(
          "Invalid storage object path. Path must match your user session.",
          "FORBIDDEN",
        );
      }
    } else if (parsed.data.sourceType === "url") {
      // Validate direct URL format and ensure no private/loopback/cloud metadata IP (SSRF)
      await validateDirectVideoUrl(parsed.data.sourceUrl);
    }

    // 5. Insert new job in 'free' lane with 'queued' status
    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        source_type: parsed.data.sourceType,
        source_path: parsed.data.sourceType === "upload" ? parsed.data.sourcePath : null,
        source_url: parsed.data.sourceType === "url" ? parsed.data.sourceUrl : null,
        status: "queued",
        lane: "free",
        attempts: 0,
      })
      .select("id")
      .single();

    if (insertError || !newJob) {
      return errorResult(
        "Failed to schedule job in queue. Please try again.",
        "INTERNAL_ERROR",
      );
    }

    // 6. Log structured business event
    logBusinessEvent({
      event: "job_created",
      userId: user.id,
      jobId: newJob.id,
      details: {
        sourceType: parsed.data.sourceType,
        lane: "free",
      },
    });

    revalidatePath("/dashboard");
    return successResult({ jobId: newJob.id });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "RATE_LIMITED"
    ) {
      return errorResult(
        "Job creation limit reached. Please wait before scheduling more jobs.",
        "RATE_LIMITED",
      );
    }

    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      ((err as { code: string }).code === "INVALID_URL" ||
        (err as { code: string }).code === "SSRF_DETECTED")
    ) {
      const errorObj = err as { message?: string; code?: any };
      return errorResult(
        errorObj.message || "Invalid direct video URL",
        errorObj.code,
      );
    }

    return errorResult("An unexpected error occurred while creating the job.", "INTERNAL_ERROR");
  }
}

/**
 * Retrieves all jobs for the currently authenticated user.
 */
export async function getUserJobsAction() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, source_type, source_path, source_url, status, lane, attempts, created_at, started_at, finished_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        logger.warn(
          "Supabase tables not detected (PGRST205). Please run 'supabase/migrations/20261110000000_init_schema.sql' in your Supabase project SQL Editor.",
        );
      } else {
        logger.warn({ error: error.message, code: error.code, userId: user.id }, "Could not fetch user jobs");
      }
      return [];
    }

    return jobs || [];
  } catch (err) {
    logger.error({ err }, "Error in getUserJobsAction");
    return [];
  }
}

/**
 * Retrieves a single job with computed real queue position and ETA.
 * Strictly verifies ownership (IDOR safe: returns null if not found or not owned).
 */
export async function getJobDetailAction(jobId: string) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, user_id, source_type, source_path, source_url, status, lane, attempts, error_code, created_at, started_at, finished_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return null;
  }

  // Fetch associated clips if available
  const { data: clips } = await supabase
    .from("clips")
    .select("id, title, start_time, end_time, duration, score, storage_path, thumbnail_path, created_at")
    .eq("job_id", job.id)
    .order("score", { ascending: false });

  // If the job is queued, compute its honest queue status from actual DB counts
  let queueState = null;
  if (job.status === "queued") {
    // 1. Count active queued priority jobs ahead
    const { count: priorityAhead } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued")
      .eq("lane", "priority")
      .lt("created_at", job.created_at);

    // 2. Count active queued free jobs ahead
    const { count: freeAhead } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued")
      .eq("lane", "free")
      .lt("created_at", job.created_at);

    queueState = computeQueueState(
      {
        id: job.id,
        lane: job.lane as "free" | "priority",
        createdAt: new Date(job.created_at),
        status: job.status,
      },
      priorityAhead || 0,
      freeAhead || 0,
      {
        freeLaneMinWaitHours: Number(process.env.FREE_LANE_MIN_WAIT_HOURS || 24),
        averageJobDurationSeconds: Number(process.env.AVERAGE_JOB_DURATION_SECONDS || 45),
        workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 2),
      },
    );
  }

  return {
    job,
    clips: clips || [],
    queueState,
  };
}
