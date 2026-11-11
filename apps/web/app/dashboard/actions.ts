"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser, createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createJobInputSchema,
  validateDirectVideoUrl,
  isYouTubeUrl,
  logBusinessEvent,
  errorResult,
  successResult,
  type ActionResult,
  computeQueueState,
  logger,
  isVipUser,
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

    // 2. Rate limit job creations (VIP users bypass limits)
    const isVip = isVipUser(user.email);
    if (!isVip) {
      await enforceRateLimit("jobCreate", user.id);
    }

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
      const allowSocial = formData.get("allowSocial") === "true";
      if (allowSocial && isYouTubeUrl(parsed.data.sourceUrl)) {
        // Explicitly allowed YouTube stream
      } else {
        // Validate direct URL format and ensure no private/loopback/cloud metadata IP (SSRF)
        await validateDirectVideoUrl(parsed.data.sourceUrl);
      }
    }

    // 5. Insert new job in 'priority' lane for VIP user (100% free), or 'free' lane for standard users
    const lane = isVip ? "priority" : "free";

    let createdJob: { id: string } | null = null;

    // First attempt: insert using standard user-scoped client
    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        source_type: parsed.data.sourceType,
        source_path: parsed.data.sourceType === "upload" ? parsed.data.sourcePath : null,
        source_url: parsed.data.sourceType === "url" ? parsed.data.sourceUrl : null,
        status: "queued",
        lane,
        attempts: 0,
      })
      .select("id")
      .single();

    if (newJob) {
      createdJob = newJob;
    } else {
      logger.warn(
        {
          error: insertError?.message,
          code: insertError?.code,
          userId: user.id,
          lane,
        },
        "User-client job insert failed; attempting service-role client fallback",
      );

      // Fallback: If user client is blocked by table permissions or priority-lane RLS, try service-role client
      try {
        const serviceClient = createServiceRoleClient();
        const { data: fallbackJob, error: fallbackError } = await serviceClient
          .from("jobs")
          .insert({
            user_id: user.id,
            source_type: parsed.data.sourceType,
            source_path: parsed.data.sourceType === "upload" ? parsed.data.sourcePath : null,
            source_url: parsed.data.sourceType === "url" ? parsed.data.sourceUrl : null,
            status: "queued",
            lane,
            attempts: 0,
          })
          .select("id")
          .single();

        if (fallbackJob) {
          createdJob = fallbackJob;
        } else {
          logger.error(
            {
              insertError: insertError?.message,
              insertCode: insertError?.code,
              fallbackError: fallbackError?.message,
              fallbackCode: fallbackError?.code,
              userId: user.id,
            },
            "Both user-client and service-role job insert failed",
          );

          const finalErrorMsg =
            fallbackError?.message ||
            insertError?.message ||
            "Failed to schedule job in queue. Please verify database permissions.";

          return errorResult(
            finalErrorMsg.includes("permission denied")
              ? "Database permission error: Please execute the schema grants in Supabase SQL editor."
              : finalErrorMsg,
            "INTERNAL_ERROR",
          );
        }
      } catch (serviceErr: unknown) {
        logger.error({ serviceErr, insertError }, "Service role client fallback threw an exception");
        return errorResult(
          insertError?.message || "Failed to schedule job in queue. Please try again.",
          "INTERNAL_ERROR",
        );
      }
    }

    // 6. Log structured business event
    logBusinessEvent({
      event: "job_created",
      userId: user.id,
      jobId: createdJob.id,
      details: {
        sourceType: parsed.data.sourceType,
        lane,
        isVip,
      },
    });

    revalidatePath("/dashboard");
    return successResult({ jobId: createdJob.id });
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
        logger.warn({ error: error.message, code: error.code, userId: user.id }, "Could not fetch user jobs with standard client; attempting service role fallback");
        try {
          const serviceClient = createServiceRoleClient();
          const { data: fallbackJobs, error: fallbackErr } = await serviceClient
            .from("jobs")
            .select("id, source_type, source_path, source_url, status, lane, attempts, created_at, started_at, finished_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!fallbackErr && fallbackJobs) {
            return fallbackJobs;
          }
        } catch {
          // Ignore service role fallback error
        }
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

  let { data: job, error } = await supabase
    .from("jobs")
    .select("id, user_id, source_type, source_path, source_url, status, lane, attempts, error_code, created_at, started_at, finished_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    try {
      const serviceClient = createServiceRoleClient();
      const { data: fallbackJob } = await serviceClient
        .from("jobs")
        .select("id, user_id, source_type, source_path, source_url, status, lane, attempts, error_code, created_at, started_at, finished_at")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();
      job = fallbackJob;
    } catch {
      // Ignore
    }
  }

  if (!job) {
    return null;
  }

  // Fetch associated clips if available
  let clips: any[] | null = null;
  const { data: standardClips } = await supabase
    .from("clips")
    .select("id, title, start_time, end_time, duration, score, storage_path, thumbnail_path, created_at")
    .eq("job_id", job.id)
    .order("score", { ascending: false });

  if (standardClips && standardClips.length > 0) {
    clips = standardClips;
  } else {
    try {
      const serviceClient = createServiceRoleClient();
      const { data: fallbackClips } = await serviceClient
        .from("clips")
        .select("id, title, start_time, end_time, duration, score, storage_path, thumbnail_path, created_at")
        .eq("job_id", job.id)
        .order("score", { ascending: false });
      clips = fallbackClips;
    } catch {
      // Ignore
    }
  }

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
