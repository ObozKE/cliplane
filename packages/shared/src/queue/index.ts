export interface QueuePositionParams {
  jobId: string;
  lane: "free" | "priority";
  createdAt: Date;
  activePriorityCountAhead: number;
  activeFreeCountAhead: number;
}

export interface EstimatedWaitParams {
  lane: "free" | "priority";
  createdAt: Date;
  queuePosition: number;
  freeLaneMinWaitHours: number;
  averageJobDurationSeconds: number;
  workerConcurrency: number;
  now?: Date;
}

export interface QueueStatusResult {
  queuePosition: number;
  totalAhead: number;
  estimatedWaitSeconds: number;
  estimatedWaitFormatted: string;
  isEligibleForClaim: boolean;
  minWaitRemainingSeconds: number;
  laneExplanation: string;
}

/**
 * Calculates the truthful, database-verified queue position.
 * Priority jobs only have other priority jobs ahead of them.
 * Free jobs have all priority queued jobs + earlier free queued jobs ahead of them.
 */
export function calculateQueuePosition(params: QueuePositionParams): number {
  if (params.lane === "priority") {
    // Only earlier priority jobs can be ahead
    return Math.max(0, params.activePriorityCountAhead);
  }

  // Free jobs must wait behind ALL active priority jobs + earlier free jobs
  return Math.max(0, params.activePriorityCountAhead + params.activeFreeCountAhead);
}

/**
 * Calculates the exact remaining free-lane minimum wait time in seconds.
 */
export function calculateRemainingMinWait(
  createdAt: Date,
  freeLaneMinWaitHours: number,
  now: Date = new Date(),
): number {
  const minWaitMs = freeLaneMinWaitHours * 60 * 60 * 1000;
  const elapsedMs = now.getTime() - createdAt.getTime();
  const remainingMs = minWaitMs - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Calculates the estimated time to completion based on concurrency and processing rate.
 * For free jobs, the wait time is bounded by the free lane minimum wait policy.
 */
export function calculateEstimatedWaitSeconds(params: EstimatedWaitParams): {
  estimatedSeconds: number;
  minWaitRemainingSeconds: number;
  isEligibleForClaim: boolean;
} {
  const now = params.now || new Date();
  const concurrency = Math.max(1, params.workerConcurrency);
  const avgJobSec = Math.max(5, params.averageJobDurationSeconds);

  // Raw processing delay based on queue depth and worker concurrency
  const processingDelay = Math.ceil((params.queuePosition * avgJobSec) / concurrency);

  if (params.lane === "priority") {
    return {
      estimatedSeconds: processingDelay,
      minWaitRemainingSeconds: 0,
      isEligibleForClaim: true,
    };
  }

  const minWaitRemainingSeconds = calculateRemainingMinWait(
    params.createdAt,
    params.freeLaneMinWaitHours,
    now,
  );

  const estimatedSeconds = Math.max(minWaitRemainingSeconds, processingDelay);
  const isEligibleForClaim = minWaitRemainingSeconds === 0;

  return {
    estimatedSeconds,
    minWaitRemainingSeconds,
    isEligibleForClaim,
  };
}

/**
 * Human-readable format for wait duration
 */
export function formatWaitDuration(seconds: number): string {
  if (seconds <= 0) return "Ready to process";
  if (seconds < 60) return `~${seconds} seconds`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `~${hours} hr`;
  return `~${hours} hr ${remainingMins} min`;
}

/**
 * Aggregates complete truthful queue state for UI presentation.
 */
export function computeQueueState(
  job: { id: string; lane: "free" | "priority"; createdAt: Date; status: string },
  activePriorityAhead: number,
  activeFreeAhead: number,
  config: {
    freeLaneMinWaitHours: number;
    averageJobDurationSeconds: number;
    workerConcurrency: number;
  },
  now: Date = new Date(),
): QueueStatusResult {
  const queuePosition = calculateQueuePosition({
    jobId: job.id,
    lane: job.lane,
    createdAt: job.createdAt,
    activePriorityCountAhead: activePriorityAhead,
    activeFreeCountAhead: activeFreeAhead,
  });

  const { estimatedSeconds, minWaitRemainingSeconds, isEligibleForClaim } =
    calculateEstimatedWaitSeconds({
      lane: job.lane,
      createdAt: job.createdAt,
      queuePosition,
      freeLaneMinWaitHours: config.freeLaneMinWaitHours,
      averageJobDurationSeconds: config.averageJobDurationSeconds,
      workerConcurrency: config.workerConcurrency,
      now,
    });

  const laneExplanation =
    job.lane === "priority"
      ? "Priority lane: Instant claim as soon as worker capacity is available."
      : `Free lane: Subject to a ${config.freeLaneMinWaitHours}-hour hold period and rate-limited worker capacity.`;

  return {
    queuePosition,
    totalAhead: queuePosition,
    estimatedWaitSeconds: estimatedSeconds,
    estimatedWaitFormatted: formatWaitDuration(estimatedSeconds),
    isEligibleForClaim,
    minWaitRemainingSeconds,
    laneExplanation,
  };
}
