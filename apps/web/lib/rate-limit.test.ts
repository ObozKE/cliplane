import { describe, it, expect } from "vitest";
import { checkRateLimit, enforceRateLimit } from "./rate-limit";
import { AppError } from "@cliplane/shared";

describe("Rate Limiter — Hostile Traffic Protection", () => {
  const testIp = "192.0.2.42";

  it("permits requests within rate limit thresholds", async () => {
    const res = await checkRateLimit("auth", `${testIp}:test-user`);
    expect(res.success).toBe(true);
    expect(res.remaining).toBeLessThanOrEqual(res.limit);
  });

  it("blocks and rejects with 429 when threshold is exceeded", async () => {
    const burstIdentifier = `burst-test-${Date.now()}`;

    // Config for auth is 5 requests per 1 min
    for (let i = 0; i < 5; i++) {
      await enforceRateLimit("auth", burstIdentifier);
    }

    // 6th attempt MUST throw rate limited AppError
    await expect(enforceRateLimit("auth", burstIdentifier)).rejects.toThrow(
      /Too many requests. Please try again/,
    );

    try {
      await enforceRateLimit("auth", burstIdentifier);
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(429);
      expect(appErr.code).toBe("RATE_LIMITED");
    }
  });
});
