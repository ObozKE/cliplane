import { pgTable, uuid, text, timestamp, numeric, integer, jsonb } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  priorityCredits: integer("priority_credits").default(0).notNull(),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  sourceType: text("source_type", { enum: ["upload", "url"] }).notNull(),
  sourcePath: text("source_path"),
  sourceUrl: text("source_url"),
  status: text("status", {
    enum: ["uploaded", "queued", "processing", "complete", "failed", "canceled", "rejected"],
  }).default("uploaded").notNull(),
  lane: text("lane", { enum: ["free", "priority"] }).default("free").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  errorCode: text("error_code"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clips = pgTable("clips", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startTime: numeric("start_time", { precision: 8, scale: 2 }).notNull(),
  endTime: numeric("end_time", { precision: 8, scale: 2 }).notNull(),
  duration: numeric("duration", { precision: 8, scale: 2 }).notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  provider: text("provider").default("mock").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed", "canceled"] }).default("pending").notNull(),
  checkoutRequestId: text("checkout_request_id").unique(),
  mpesaReceipt: text("mpesa_receipt").unique(),
  providerTxId: text("provider_tx_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tutorialProgress = pgTable("tutorial_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  tutorialSlug: text("tutorial_slug").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const takedownRequests = pgTable("takedown_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterName: text("reporter_name").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  clipId: uuid("clip_id").references(() => clips.id, { onDelete: "set null" }),
  contentUrl: text("content_url").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "investigating", "resolved", "rejected"] }).default("pending").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  payload: jsonb("payload"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Clip = typeof clips.$inferSelect;
export type InsertClip = typeof clips.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type TakedownRequest = typeof takedownRequests.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
