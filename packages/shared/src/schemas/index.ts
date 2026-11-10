import { z } from "zod";

/**
 * Upload Gate: creators must confirm footage ownership / non-leaked status.
 */
export const uploadGateSchema = z.object({
  confirmOwnership: z.literal(true, {
    errorMap: () => ({
      message: "You must confirm you own this footage or have the right to use it, and that it is not leaked or pre-release material.",
    }),
  }),
});

/**
 * Job creation via direct file upload
 */
export const createJobUploadSchema = uploadGateSchema.extend({
  sourceType: z.literal("upload"),
  sourcePath: z.string().min(1, "Storage path is required").regex(/^[^/\\]+\/[^/\\]+$/, "Invalid storage path prefix format"),
});

/**
 * Job creation via direct URL
 */
export const createJobUrlSchema = uploadGateSchema.extend({
  sourceType: z.literal("url"),
  sourceUrl: z.string().url("Must be a valid URL").max(2048),
});

/**
 * Union schema for job creation
 */
export const createJobInputSchema = z.discriminatedUnion("sourceType", [
  createJobUploadSchema,
  createJobUrlSchema,
]);

export type CreateJobInput = z.infer<typeof createJobInputSchema>;

/**
 * Kenyan & International Phone Normalization
 * Standardizes Kenyan numbers to 2547XXXXXXXX / 2541XXXXXXXX
 */
export const phoneNormalizationSchema = z.string().transform((val, ctx) => {
  const cleaned = val.replace(/[\s\-\(\)\+]/g, "");

  // Kenyan number normalization
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return `254${cleaned.slice(1)}`;
  }
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^[17]\d{8}$/.test(cleaned)) {
    return `254${cleaned}`;
  }

  // General E.164 without '+'
  if (/^\d{9,15}$/.test(cleaned)) {
    return cleaned;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Invalid phone number format. Provide a valid mobile number (e.g. 0712345678 or +254712345678).",
  });
  return z.NEVER;
});

/**
 * Payment Initiation Schema
 */
export const initiatePaymentSchema = z.object({
  jobId: z.string().uuid("Invalid Job ID").optional().nullable(),
  provider: z.enum(["mock", "stripe", "crypto"]).default("mock"),
  phoneNumber: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/**
 * Takedown & Copyright Request Schema
 */
export const takedownRequestSchema = z.object({
  reporterName: z.string().min(2, "Name must be at least 2 characters").max(100),
  reporterEmail: z.string().email("Valid email address is required"),
  contentUrl: z.string().url("Must be a valid URL pointing to the content"),
  clipId: z.string().uuid().optional(),
  description: z.string().min(20, "Please provide detailed context for the takedown request").max(3000),
});

export type TakedownRequestInput = z.infer<typeof takedownRequestSchema>;

/**
 * User Profile Update Schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

/**
 * Health check response
 */
export const healthCheckSchema = z.object({
  status: z.literal("healthy"),
  timestamp: z.string(),
  version: z.string(),
  services: z.object({
    database: z.enum(["connected", "disconnected"]),
    redis: z.enum(["connected", "disconnected", "fallback-in-memory"]),
  }),
});
