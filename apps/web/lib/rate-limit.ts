import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "@cliplane/shared";

// In-memory fallback map for local development or when Upstash Redis is not configured
interface MemoryRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryRecord>();

function memoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const record = memoryStore.get(key);

  if (!record || now >= record.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt };
}

let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn("⚠️ Failed to initialize Upstash Redis, using in-memory rate limiter fallback:", err);
  }
}

export type RateLimitType = "auth" | "jobCreate" | "paymentInitiate" | "takedown" | "apiDefault";

const LIMIT_CONFIGS: Record<RateLimitType, { limit: number; windowSec: number }> = {
  auth: { limit: 5, windowSec: 60 }, // 5 per 1 min per IP
  jobCreate: { limit: 10, windowSec: 3600 }, // 10 per 1 hour per user
  paymentInitiate: { limit: 5, windowSec: 60 }, // 5 per 1 min per user
  takedown: { limit: 3, windowSec: 3600 }, // 3 per 1 hour per IP
  apiDefault: { limit: 60, windowSec: 60 }, // 60 per 1 min per IP
};

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const config = LIMIT_CONFIGS[type];
  const prefix = `ratelimit:${type}`;

  if (redisClient) {
    try {
      const ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSec} s`),
        prefix,
      });
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (err) {
      console.warn("⚠️ Upstash Redis error, falling back to in-memory rate limit:", err);
    }
  }

  // Fallback to in-memory limiter
  const windowMs = config.windowSec * 1000;
  return memoryRateLimit(`${prefix}:${identifier}`, config.limit, windowMs);
}

/**
 * Enforces rate limit and throws AppError(429) if exceeded
 */
export async function enforceRateLimit(type: RateLimitType, identifier: string): Promise<void> {
  const result = await checkRateLimit(type, identifier);
  if (!result.success) {
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    throw AppError.rateLimited(
      retryAfterSec,
      `Too many requests. Please try again in ${retryAfterSec} seconds.`,
    );
  }
}
