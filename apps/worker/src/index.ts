import http from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@cliplane/shared";
import { workerEnv } from "./env";
import { processJob, type JobRecord } from "./pipeline/processor";
import { runRetentionCleanup } from "./cleanup";

export const supabase: SupabaseClient = createClient(
  workerEnv.NEXT_PUBLIC_SUPABASE_URL,
  workerEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

let isRunning = true;
let isProcessing = false;
let currentJobId: string | null = null;
let pollCounter = 0;

export function getWorkerStatus() {
  return {
    workerId: workerEnv.WORKER_ID,
    status: isProcessing ? "busy" : "idle",
    currentJobId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Atomically claims the next job according to queue fairness rules:
 * 1. Priority lane first (ordered by created_at)
 * 2. Free lane next (ordered by created_at, respecting free lane throttle)
 */
export async function claimNextJob(client: SupabaseClient): Promise<JobRecord | null> {
  try {
    // Attempt atomic RPC call first
    const { data, error } = await client.rpc("claim_next_job", {
      p_worker_id: workerEnv.WORKER_ID,
    });

    if (!error && data && data.length > 0) {
      return data[0] as JobRecord;
    }

    if (error && error.code !== "PGRST202") {
      // If RPC doesn't exist yet, fall back to atomic direct query
      logger.debug({ rpcError: error.message }, "claim_next_job RPC fallback to query");
    }

    // Direct claim fallback:
    // First priority lane
    const { data: priorityJobs } = await client
      .from("jobs")
      .select("*")
      .eq("status", "queued")
      .eq("lane", "priority")
      .order("created_at", { ascending: true })
      .limit(1);

    if (priorityJobs && priorityJobs.length > 0) {
      const candidate = priorityJobs[0];
      const { data: claimed } = await client
        .from("jobs")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", candidate.id)
        .eq("status", "queued")
        .select();

      if (claimed && claimed.length > 0) {
        return claimed[0] as JobRecord;
      }
    }

    // Next free lane
    const { data: freeJobs } = await client
      .from("jobs")
      .select("*")
      .eq("status", "queued")
      .eq("lane", "free")
      .order("created_at", { ascending: true })
      .limit(1);

    if (freeJobs && freeJobs.length > 0) {
      const candidate = freeJobs[0];
      const { data: claimed } = await client
        .from("jobs")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", candidate.id)
        .eq("status", "queued")
        .select();

      if (claimed && claimed.length > 0) {
        return claimed[0] as JobRecord;
      }
    }

    return null;
  } catch (err) {
    logger.error({ err }, "Error claiming next job");
    return null;
  }
}

/**
 * Worker polling and processing main loop.
 */
export async function startWorkerLoop(): Promise<void> {
  logger.info(
    {
      service: "cliplane-worker",
      workerId: workerEnv.WORKER_ID,
      concurrency: workerEnv.WORKER_CONCURRENCY,
      pollIntervalMs: workerEnv.POLL_INTERVAL_MS,
    },
    "🚀 ClipLane Worker loop started",
  );

  while (isRunning) {
    try {
      const job = await claimNextJob(supabase);

      if (job) {
        isProcessing = true;
        currentJobId = job.id;
        logger.info({ jobId: job.id, lane: job.lane }, "Job claimed, starting processing");

        await processJob({
          supabase,
          job,
          maxDurationSeconds: workerEnv.MAX_VIDEO_DURATION_SECONDS,
          clipsPerJob: workerEnv.CLIPS_PER_JOB,
          minClipDuration: workerEnv.MIN_CLIP_DURATION_SECONDS,
          maxClipDuration: workerEnv.MAX_CLIP_DURATION_SECONDS,
        });

        isProcessing = false;
        currentJobId = null;
      } else {
        // Sleep poll interval
        await new Promise((resolve) => setTimeout(resolve, workerEnv.POLL_INTERVAL_MS));
      }

      // Run retention cleanup periodically (every 720 polls = ~1 hour at 5s poll)
      pollCounter++;
      if (pollCounter >= 720) {
        pollCounter = 0;
        await runRetentionCleanup({
          supabase,
          retentionDays: workerEnv.RESULT_RETENTION_DAYS,
        });
      }
    } catch (loopErr) {
      logger.error({ err: loopErr }, "Unhandled error in worker loop; sleeping 5s");
      isProcessing = false;
      currentJobId = null;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.info("Worker loop shut down cleanly");
}

/**
 * Lightweight HTTP server for Render / Cloud health checks
 * Allows running on Render's 100% Free Plan ($0/mo) as a Web Service.
 */
export function startHealthServer(port = Number(process.env.PORT) || 10000): http.Server {
  const server = http.createServer((req, res) => {
    const url = req.url || "/";
    if (url === "/health" || url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          worker: getWorkerStatus(),
        }),
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Worker health server listening for cloud health checks");
  });

  return server;
}

function handleShutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, gracefully closing worker");
  isRunning = false;
  if (!isProcessing) {
    process.exit(0);
  }
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// If run directly via node / tsx, start the health server and worker loop
if (require.main === module || process.env.RUN_WORKER_IMMEDIATELY === "true") {
  startHealthServer();
  startWorkerLoop().catch((err) => {
    logger.fatal({ err }, "Fatal crash in worker daemon");
    process.exit(1);
  });
}
