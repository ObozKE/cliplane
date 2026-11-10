import { describe, it, expect } from "vitest";
import {
  calculateQueuePosition,
  calculateRemainingMinWait,
  calculateEstimatedWaitSeconds,
  computeQueueState,
  formatWaitDuration,
} from "./index";

describe("Queue Engine — Product Integrity & Honest Computation", () => {
  it("calculates priority job position considering ONLY earlier priority jobs", () => {
    const position = calculateQueuePosition({
      jobId: "job-1",
      lane: "priority",
      createdAt: new Date(),
      activePriorityCountAhead: 3,
      activeFreeCountAhead: 15, // should be ignored for priority
    });

    expect(position).toBe(3);
  });

  it("calculates free job position considering ALL priority jobs + earlier free jobs", () => {
    const position = calculateQueuePosition({
      jobId: "job-2",
      lane: "free",
      createdAt: new Date(),
      activePriorityCountAhead: 4,
      activeFreeCountAhead: 6,
    });

    // 4 priority + 6 free ahead = 10 total ahead
    expect(position).toBe(10);
  });

  it("calculates remaining free-lane minimum wait accurately", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const createdJustNow = new Date("2026-11-10T12:00:00Z");
    const created12HoursAgo = new Date("2026-11-10T00:00:00Z");
    const created25HoursAgo = new Date("2026-11-09T11:00:00Z");

    // 24 hours min wait = 86400 seconds
    expect(calculateRemainingMinWait(createdJustNow, 24, now)).toBe(86400);

    // 12 hours passed = 12 hours remaining = 43200 seconds
    expect(calculateRemainingMinWait(created12HoursAgo, 24, now)).toBe(43200);

    // 25 hours passed = 0 seconds remaining (eligible for claim)
    expect(calculateRemainingMinWait(created25HoursAgo, 24, now)).toBe(0);
  });

  it("computes estimated seconds respecting the free lane throttle bound", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const createdJustNow = new Date("2026-11-10T12:00:00Z");

    const result = calculateEstimatedWaitSeconds({
      lane: "free",
      createdAt: createdJustNow,
      queuePosition: 2,
      freeLaneMinWaitHours: 24,
      averageJobDurationSeconds: 45,
      workerConcurrency: 2,
      now,
    });

    // Processing delay is 2 * 45 / 2 = 45s, but free lane min wait is 86400s
    // Estimated wait MUST be max(86400, 45) = 86400s
    expect(result.estimatedSeconds).toBe(86400);
    expect(result.isEligibleForClaim).toBe(false);
  });

  it("formats wait durations honestly without deceptive countdowns", () => {
    expect(formatWaitDuration(0)).toBe("Ready to process");
    expect(formatWaitDuration(45)).toBe("~45 seconds");
    expect(formatWaitDuration(180)).toBe("~3 min");
    expect(formatWaitDuration(3600)).toBe("~1 hr");
    expect(formatWaitDuration(86400)).toBe("~24 hr");
  });

  it("generates truthful queue state for UI presentation", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const job = {
      id: "test-uuid",
      lane: "free" as const,
      createdAt: new Date("2026-11-10T10:00:00Z"), // 2 hours ago
      status: "queued",
    };

    const state = computeQueueState(
      job,
      2, // 2 priority jobs ahead
      3, // 3 free jobs ahead
      {
        freeLaneMinWaitHours: 24,
        averageJobDurationSeconds: 60,
        workerConcurrency: 1,
      },
      now,
    );

    expect(state.queuePosition).toBe(5);
    // 22 hours remaining = 79200 seconds
    expect(state.minWaitRemainingSeconds).toBe(79200);
    expect(state.isEligibleForClaim).toBe(false);
    expect(state.laneExplanation).toContain("Free lane: Subject to a 24-hour hold");
  });
});
