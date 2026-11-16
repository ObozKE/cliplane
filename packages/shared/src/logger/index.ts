import pino from "pino";

export const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "authorization",
  "password",
  "serviceRoleKey",
  "apiKey",
  "secret",
  "passkey",
  "phoneNumber",
  "token",
  "*.password",
  "*.token",
  "*.secret",
  "*.phoneNumber",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.SERVICE_NAME || "cliplane-app",
    env: process.env.NODE_ENV || "development",
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export type BusinessEvent =
  | "job_created"
  | "job_claimed"
  | "job_completed"
  | "job_failed"
  | "payment_initiated"
  | "payment_confirmed"
  | "upgrade_applied"
  | "takedown_received"
  | "clip_social_published";

export interface LogEventPayload {
  event: BusinessEvent;
  userId?: string;
  jobId?: string;
  paymentId?: string;
  requestId?: string;
  clipId?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export function logBusinessEvent(payload: LogEventPayload): void {
  const { event, details, ...rest } = payload;
  logger.info({
    type: "business_event",
    businessEvent: event,
    ...rest,
    ...details,
  }, `Event: ${event}`);
}
