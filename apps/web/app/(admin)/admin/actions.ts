"use server";

import { z } from "zod";
import {
  logBusinessEvent,
  successResult,
  errorResult,
  type ActionResult,
} from "@cliplane/shared";
import { requireAdminUser, createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("Invalid UUID format");

export interface AdminDashboardStats {
  totalJobs: number;
  queuedPriorityJobs: number;
  queuedFreeJobs: number;
  processingJobs: number;
  completedJobs24h: number;
  failedJobs24h: number;
  pendingTakedowns: number;
  totalUsers: number;
  bannedUsers: number;
}

export interface AdminJobRow {
  id: string;
  userId: string;
  userEmail?: string;
  lane: "free" | "priority";
  status: "queued" | "processing" | "completed" | "failed";
  sourceType: "upload" | "url";
  createdAt: string;
  durationSeconds?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retries: number;
}

export interface AdminTakedownRow {
  id: string;
  reporterName: string;
  reporterEmail: string;
  contentUrl: string;
  clipId: string | null;
  description: string;
  status: "pending" | "investigating" | "resolved" | "rejected";
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: "user" | "admin";
  priorityCredits: number;
  bannedAt: string | null;
  createdAt: string;
  jobsCount?: number;
}

export interface AdminAuditRow {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Fetches high-level metrics for the admin console.
 */
export async function getAdminDashboardStatsAction(): Promise<ActionResult<AdminDashboardStats>> {
  try {
    await requireAdminUser();
    const supabase = await createClient();

    const [
      { count: totalJobs },
      { count: queuedPriorityJobs },
      { count: queuedFreeJobs },
      { count: processingJobs },
      { count: completedJobs24h },
      { count: failedJobs24h },
      { count: pendingTakedowns },
      { count: totalUsers },
      { count: bannedUsers },
    ] = await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "queued").eq("lane", "priority"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "queued").eq("lane", "free"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "processing"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      supabase.from("takedown_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).not("banned_at", "is", null),
    ]);

    return successResult({
      totalJobs: totalJobs || 0,
      queuedPriorityJobs: queuedPriorityJobs || 0,
      queuedFreeJobs: queuedFreeJobs || 0,
      processingJobs: processingJobs || 0,
      completedJobs24h: completedJobs24h || 0,
      failedJobs24h: failedJobs24h || 0,
      pendingTakedowns: pendingTakedowns || 0,
      totalUsers: totalUsers || 0,
      bannedUsers: bannedUsers || 0,
    });
  } catch {
    return errorResult("Failed to load admin metrics", "INTERNAL_ERROR");
  }
}

/**
 * Fetches recent jobs across the system with optional lane/status filter.
 */
export async function getAdminJobsAction(filter?: {
  status?: string;
  lane?: string;
  limit?: number;
}): Promise<ActionResult<AdminJobRow[]>> {
  try {
    await requireAdminUser();
    const supabase = await createClient();

    let query = supabase
      .from("jobs")
      .select("id, user_id, lane, status, source_type, created_at, duration_seconds, error_code, error_message, retries")
      .order("created_at", { ascending: false })
      .limit(filter?.limit || 50);

    if (filter?.status) {
      query = query.eq("status", filter.status);
    }
    if (filter?.lane) {
      query = query.eq("lane", filter.lane);
    }

    const { data, error } = await query;
    if (error) {
      return errorResult("Failed to query jobs", "INTERNAL_ERROR");
    }

    const rows: AdminJobRow[] = (data || []).map((j) => ({
      id: j.id,
      userId: j.user_id,
      lane: j.lane as "free" | "priority",
      status: j.status as "queued" | "processing" | "completed" | "failed",
      sourceType: j.source_type as "upload" | "url",
      createdAt: j.created_at,
      durationSeconds: j.duration_seconds,
      errorCode: j.error_code,
      errorMessage: j.error_message,
      retries: j.retries || 0,
    }));

    return successResult(rows);
  } catch {
    return errorResult("Access denied or query failure", "INTERNAL_ERROR");
  }
}

/**
 * Re-queues a failed or stuck job.
 */
export async function requeueJobAction(jobId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const admin = await requireAdminUser();
    const parsed = uuidSchema.safeParse(jobId);
    if (!parsed.success) return errorResult("Invalid Job ID", "VALIDATION_FAILED");

    const supabase = await createClient();

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "queued",
        error_code: null,
        error_message: null,
        locked_by: null,
        locked_at: null,
        retries: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) return errorResult("Failed to requeue job", "INTERNAL_ERROR");

    // Write audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "requeue_job",
      target_type: "job",
      target_id: jobId,
      payload: { adminEmail: admin.email },
    });

    logBusinessEvent({
      event: "job_requeued" as any,
      userId: admin.id,
      jobId,
    });

    return successResult({ success: true });
  } catch {
    return errorResult("Failed to requeue job", "INTERNAL_ERROR");
  }
}

/**
 * Cancels a job and marks it failed with an admin cancellation code.
 */
export async function cancelJobAction(jobId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const admin = await requireAdminUser();
    const parsed = uuidSchema.safeParse(jobId);
    if (!parsed.success) return errorResult("Invalid Job ID", "VALIDATION_FAILED");

    const supabase = await createClient();

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "failed",
        error_code: "CANCELLED_BY_ADMIN",
        error_message: "Job cancelled by administrator.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) return errorResult("Failed to cancel job", "INTERNAL_ERROR");

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "cancel_job",
      target_type: "job",
      target_id: jobId,
      payload: { adminEmail: admin.email },
    });

    return successResult({ success: true });
  } catch {
    return errorResult("Failed to cancel job", "INTERNAL_ERROR");
  }
}

/**
 * Fetches DMCA takedown requests for review.
 */
export async function getAdminTakedownsAction(): Promise<ActionResult<AdminTakedownRow[]>> {
  try {
    await requireAdminUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("takedown_requests")
      .select("id, reporter_name, reporter_email, content_url, clip_id, description, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return errorResult("Failed to load takedowns", "INTERNAL_ERROR");

    const rows: AdminTakedownRow[] = (data || []).map((t) => ({
      id: t.id,
      reporterName: t.reporter_name,
      reporterEmail: t.reporter_email,
      contentUrl: t.content_url,
      clipId: t.clip_id,
      description: t.description,
      status: t.status as AdminTakedownRow["status"],
      createdAt: t.created_at,
    }));

    return successResult(rows);
  } catch {
    return errorResult("Access denied", "INTERNAL_ERROR");
  }
}

/**
 * Resolves or rejects a takedown request. If resolved, purges the infringing clip.
 */
export async function resolveTakedownAction(input: {
  requestId: string;
  action: "resolved" | "rejected";
  notes?: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const admin = await requireAdminUser();
    const parsedId = uuidSchema.safeParse(input.requestId);
    if (!parsedId.success) return errorResult("Invalid Request ID", "VALIDATION_FAILED");

    const supabase = await createClient();

    // 1. Fetch request details
    const { data: request, error: reqErr } = await supabase
      .from("takedown_requests")
      .select("id, clip_id, content_url")
      .eq("id", input.requestId)
      .single();

    if (reqErr || !request) return errorResult("Takedown request not found", "NOT_FOUND");

    // 2. If approved/resolved and clipId is present, purge clip record
    if (input.action === "resolved" && request.clip_id) {
      // Find storage path
      const { data: clip } = await supabase
        .from("clips")
        .select("storage_path, thumbnail_path")
        .eq("id", request.clip_id)
        .single();

      if (clip) {
        // Delete from clips table
        await supabase.from("clips").delete().eq("id", request.clip_id);

        // Delete from storage
        const pathsToDelete = [clip.storage_path, clip.thumbnail_path].filter(Boolean) as string[];
        if (pathsToDelete.length > 0) {
          await supabase.storage.from("clips").remove(pathsToDelete);
        }
      }
    }

    // 3. Update takedown request status
    const { error: updateErr } = await supabase
      .from("takedown_requests")
      .update({
        status: input.action,
      })
      .eq("id", input.requestId);

    if (updateErr) return errorResult("Failed to update takedown status", "INTERNAL_ERROR");

    // 4. Audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: input.action === "resolved" ? "takedown_approved" : "takedown_rejected",
      target_type: "takedown_request",
      target_id: input.requestId,
      payload: {
        action: input.action,
        clipId: request.clip_id,
        notes: input.notes || null,
        adminEmail: admin.email,
      },
    });

    logBusinessEvent({
      event: "takedown_actioned" as any,
      userId: admin.id,
      details: {
        requestId: input.requestId,
        resolution: input.action,
      },
    });

    return successResult({ success: true });
  } catch {
    return errorResult("Failed to resolve takedown request", "INTERNAL_ERROR");
  }
}

/**
 * Fetches user accounts for administration.
 */
export async function getAdminUsersAction(query?: string): Promise<ActionResult<AdminUserRow[]>> {
  try {
    await requireAdminUser();
    const supabase = await createClient();

    let dbQuery = supabase
      .from("profiles")
      .select("id, email, role, priority_credits, banned_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query?.trim()) {
      dbQuery = dbQuery.ilike("email", `%${query.trim()}%`);
    }

    const { data, error } = await dbQuery;
    if (error) return errorResult("Failed to query users", "INTERNAL_ERROR");

    const rows: AdminUserRow[] = (data || []).map((u) => ({
      id: u.id,
      email: u.email || "",
      role: (u.role as "user" | "admin") || "user",
      priorityCredits: u.priority_credits || 0,
      bannedAt: u.banned_at,
      createdAt: u.created_at,
    }));

    return successResult(rows);
  } catch {
    return errorResult("Access denied", "INTERNAL_ERROR");
  }
}

/**
 * Suspends or reinstates a user account.
 */
export async function toggleUserBanAction(input: {
  userId: string;
  isBanned: boolean;
  reason?: string;
}): Promise<ActionResult<{ success: boolean; bannedAt: string | null }>> {
  try {
    const admin = await requireAdminUser();
    const parsedId = uuidSchema.safeParse(input.userId);
    if (!parsedId.success) return errorResult("Invalid User ID", "VALIDATION_FAILED");

    // Self-ban prevention
    if (input.userId === admin.id) {
      return errorResult("You cannot ban your own administrative account.", "BAD_REQUEST");
    }

    const supabase = await createClient();
    const bannedAt = input.isBanned ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        banned_at: bannedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userId);

    if (error) return errorResult("Failed to update user ban status", "INTERNAL_ERROR");

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: input.isBanned ? "user_banned" : "user_unbanned",
      target_type: "user",
      target_id: input.userId,
      payload: {
        reason: input.reason || null,
        adminEmail: admin.email,
      },
    });

    logBusinessEvent({
      event: (input.isBanned ? "user_suspended" : "user_reinstated") as any,
      userId: input.userId,
      details: {
        adminId: admin.id,
        reason: input.reason,
      },
    });

    return successResult({ success: true, bannedAt });
  } catch {
    return errorResult("Failed to toggle ban status", "INTERNAL_ERROR");
  }
}

/**
 * Fetches recent immutable audit log records.
 */
export async function getAdminAuditLogAction(): Promise<ActionResult<AdminAuditRow[]>> {
  try {
    await requireAdminUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("audit_log")
      .select("id, actor_id, action, target_type, target_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return errorResult("Failed to fetch audit log", "INTERNAL_ERROR");

    const rows: AdminAuditRow[] = (data || []).map((a) => ({
      id: a.id,
      actorId: a.actor_id,
      action: a.action,
      targetType: a.target_type,
      targetId: a.target_id,
      payload: (a.payload as Record<string, unknown>) || null,
      createdAt: a.created_at,
    }));

    return successResult(rows);
  } catch {
    return errorResult("Access denied", "INTERNAL_ERROR");
  }
}
