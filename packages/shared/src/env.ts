import { z } from "zod";

/**
 * Common Environment Schema
 */
export const commonEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("ClipName"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),

  // Queue Configuration
  FREE_LANE_MIN_WAIT_HOURS: z.coerce.number().int().min(0).default(24),
  FREE_LANE_MAX_JOBS_PER_HOUR: z.coerce.number().int().min(1).default(10),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(2),
  AVERAGE_JOB_DURATION_SECONDS: z.coerce.number().int().min(5).default(45),
  RESULT_RETENTION_DAYS: z.coerce.number().int().min(1).default(3),

  // Media Limits
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(209715200), // 200MB
  MAX_VIDEO_DURATION_SECONDS: z.coerce.number().int().positive().default(300), // 5 min
  CLIPS_PER_JOB: z.coerce.number().int().min(1).max(10).default(3),
  MIN_CLIP_DURATION_SECONDS: z.coerce.number().int().min(5).default(15),
  MAX_CLIP_DURATION_SECONDS: z.coerce.number().int().max(120).default(30),

  // Pricing
  PRIORITY_JOB_PRICE_USD: z.coerce.number().positive().default(2.99),
  PRIORITY_BUNDLE_PRICE_USD: z.coerce.number().positive().default(9.99),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe", "crypto", "mpesa"]).default("mock"),

  // Admin & Compliance
  ADMIN_EMAIL: z.string().email().default("admin@clipname.tech"),
  COPYRIGHT_CONTACT_EMAIL: z.string().email().default("copyright@clipname.tech"),
});

/**
 * Next.js Web Server Environment Schema
 */
export const webEnvSchema = commonEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Only for server actions / trusted server side
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CRYPTO_COMMERCE_API_KEY: z.string().optional(),
  CRYPTO_WEBHOOK_SECRET: z.string().optional(),
  MPESA_CALLBACK_SECRET: z.string().min(16).optional().default("local_dev_mpesa_secret_test_key_32chars"),
});

/**
 * Worker Environment Schema
 */
export const workerEnvSchema = commonEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  WORKER_ID: z.string().default("worker-1"),
  POLL_INTERVAL_MS: z.coerce.number().int().min(500).default(3000),
});

export type CommonEnv = z.infer<typeof commonEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

/**
 * Validate Web environment at runtime
 */
export function validateWebEnv(env: Record<string, string | undefined>): WebEnv {
  const result = webEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.format();
    console.error("❌ Invalid Web Environment Variables:", JSON.stringify(issues, null, 2));
    throw new Error("Invalid web environment variables. Check .env against .env.example");
  }
  return result.data;
}

/**
 * Validate Worker environment at runtime
 */
export function validateWorkerEnv(env: Record<string, string | undefined>): WorkerEnv {
  const result = workerEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.format();
    console.error("❌ Invalid Worker Environment Variables:", JSON.stringify(issues, null, 2));
    throw new Error("Invalid worker environment variables. Check .env against .env.example");
  }
  return result.data;
}
