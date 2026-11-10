"use client";

import { useState } from "react";
import {
  Activity,
  Layers,
  ShieldAlert,
  Users,
  FileText,
  RotateCcw,
  XCircle,
  CheckCircle,
  Ban,
  Check,
  Search,
  Loader2,
  Server,
  Database,
  Cpu,
} from "lucide-react";
import type {
  AdminDashboardStats,
  AdminJobRow,
  AdminTakedownRow,
  AdminUserRow,
  AdminAuditRow,
} from "./actions";
import {
  requeueJobAction,
  cancelJobAction,
  resolveTakedownAction,
  toggleUserBanAction,
} from "./actions";

interface AdminDashboardClientProps {
  initialStats: AdminDashboardStats;
  initialJobs: AdminJobRow[];
  initialTakedowns: AdminTakedownRow[];
  initialUsers: AdminUserRow[];
  initialAuditLog: AdminAuditRow[];
}

export function AdminDashboardClient({
  initialStats,
  initialJobs,
  initialTakedowns,
  initialUsers,
  initialAuditLog,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "takedowns" | "users" | "audit">("overview");

  const [stats] = useState<AdminDashboardStats>(initialStats);
  const [jobs, setJobs] = useState<AdminJobRow[]>(initialJobs);
  const [takedowns, setTakedowns] = useState<AdminTakedownRow[]>(initialTakedowns);
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [auditLog] = useState<AdminAuditRow[]>(initialAuditLog);

  const [jobFilterStatus, setJobFilterStatus] = useState<string>("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  }

  // Action: Requeue Job
  async function handleRequeue(jobId: string) {
    setActionLoadingId(jobId);
    const result = await requeueJobAction(jobId);
    setActionLoadingId(null);
    if (result.success) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "queued", errorCode: null, errorMessage: null } : j))
      );
      showNotice(`Job #${jobId.slice(0, 8)} re-queued successfully.`);
    } else {
      showNotice(result.error);
    }
  }

  // Action: Cancel Job
  async function handleCancel(jobId: string) {
    setActionLoadingId(jobId);
    const result = await cancelJobAction(jobId);
    setActionLoadingId(null);
    if (result.success) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "failed", errorCode: "CANCELLED_BY_ADMIN" } : j))
      );
      showNotice(`Job #${jobId.slice(0, 8)} cancelled.`);
    } else {
      showNotice(result.error);
    }
  }

  // Action: Resolve/Reject Takedown
  async function handleResolveTakedown(requestId: string, action: "resolved" | "rejected") {
    setActionLoadingId(requestId);
    const result = await resolveTakedownAction({ requestId, action });
    setActionLoadingId(null);
    if (result.success) {
      setTakedowns((prev) =>
        prev.map((t) => (t.id === requestId ? { ...t, status: action } : t))
      );
      showNotice(action === "resolved" ? "Takedown approved and infringing content purged." : "Takedown request rejected.");
    } else {
      showNotice(result.error);
    }
  }

  // Action: Toggle User Ban
  async function handleToggleBan(userId: string, currentBanned: boolean) {
    setActionLoadingId(userId);
    const result = await toggleUserBanAction({ userId, isBanned: !currentBanned });
    setActionLoadingId(null);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, bannedAt: result.data.bannedAt } : u))
      );
      showNotice(!currentBanned ? "User account suspended." : "User account reinstated.");
    } else {
      showNotice(result.error);
    }
  }

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    if (jobFilterStatus === "all") return true;
    return j.status === jobFilterStatus;
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery) return true;
    return u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground shadow-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "overview"
              ? "bg-[var(--accent-default)] text-[var(--accent-on)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Activity className="w-4 h-4" />
          Overview & System
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "jobs"
              ? "bg-[var(--accent-default)] text-[var(--accent-on)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Layers className="w-4 h-4" />
          Jobs Pipeline ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab("takedowns")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "takedowns"
              ? "bg-[var(--accent-default)] text-[var(--accent-on)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          DMCA / Moderation
          {stats.pendingTakedowns > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {stats.pendingTakedowns}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "users"
              ? "bg-[var(--accent-default)] text-[var(--accent-on)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Users className="w-4 h-4" />
          Users & Access ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "audit"
              ? "bg-[var(--accent-default)] text-[var(--accent-on)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Log ({auditLog.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Priority Queue</span>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">{stats.queuedPriorityJobs}</p>
              <span className="text-[11px] text-muted-foreground">Paid lane queued</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Free Queue</span>
              <p className="text-2xl font-bold font-mono text-amber-500 mt-1">{stats.queuedFreeJobs}</p>
              <span className="text-[11px] text-muted-foreground">Throttled lane queued</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">In Processing</span>
              <p className="text-2xl font-bold font-mono text-sky-400 mt-1">{stats.processingJobs}</p>
              <span className="text-[11px] text-muted-foreground">Active worker jobs</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Completed (24h)</span>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{stats.completedJobs24h}</p>
              <span className="text-[11px] text-muted-foreground">{stats.failedJobs24h} failed</span>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--accent-default)]" />
              Infrastructure & Worker Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <Database className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-semibold text-foreground">PostgreSQL / Supabase</p>
                  <p className="text-emerald-400">Connected (RLS Active)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-semibold text-foreground">FFmpeg Worker Pool</p>
                  <p className="text-emerald-400">Concurrency: 2</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <Activity className="w-4 h-4 text-sky-400" />
                <div>
                  <p className="font-semibold text-foreground">Rate Limiter</p>
                  <p className="text-sky-400">Active (Upstash / Memory)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Jobs Pipeline */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Filter status:</span>
              {["all", "queued", "processing", "completed", "failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setJobFilterStatus(status)}
                  className={`px-2.5 py-1 rounded capitalize font-medium ${
                    jobFilterStatus === status ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-mono">Job ID</th>
                  <th className="px-4 py-3">Lane</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No jobs matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-[11px] text-foreground font-medium">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            job.lane === "priority" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {job.lane}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold capitalize ${
                            job.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : job.status === "failed"
                              ? "bg-red-500/15 text-red-400"
                              : job.status === "processing"
                              ? "bg-sky-500/15 text-sky-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {job.status}
                        </span>
                        {job.errorCode && (
                          <span className="block text-[10px] text-red-400 font-mono mt-0.5">
                            {job.errorCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground uppercase">
                        {job.sourceType}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {job.durationSeconds ? `${Math.round(job.durationSeconds)}s` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {new Date(job.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {job.status === "failed" && (
                            <button
                              onClick={() => handleRequeue(job.id)}
                              disabled={actionLoadingId === job.id}
                              className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground flex items-center gap-1"
                            >
                              {actionLoadingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              Retry
                            </button>
                          )}
                          {job.status === "queued" && (
                            <button
                              onClick={() => handleCancel(job.id)}
                              disabled={actionLoadingId === job.id}
                              className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium flex items-center gap-1"
                            >
                              {actionLoadingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: DMCA / Moderation */}
      {activeTab === "takedowns" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Content / Clip</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {takedowns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No DMCA takedown or infringement notices on file.
                    </td>
                  </tr>
                ) : (
                  takedowns.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{t.reporterName}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{t.reporterEmail}</p>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        <a href={t.contentUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-default)] hover:underline">
                          {t.contentUrl}
                        </a>
                        {t.clipId && <span className="block font-mono text-[10px] text-muted-foreground">Clip: {t.clipId.slice(0, 8)}</span>}
                      </td>
                      <td className="px-4 py-3 max-w-sm truncate text-muted-foreground">
                        {t.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold capitalize ${
                            t.status === "resolved"
                              ? "bg-red-500/15 text-red-400"
                              : t.status === "rejected"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResolveTakedown(t.id, "resolved")}
                              disabled={actionLoadingId === t.id}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                            >
                              {actionLoadingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Approve & Purge
                            </button>
                            <button
                              onClick={() => handleResolveTakedown(t.id, "rejected")}
                              disabled={actionLoadingId === t.id}
                              className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-[11px] font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Users Management */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--accent-default)]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Priority Credits</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isBanned = Boolean(u.bannedAt);
                    return (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-[11px] font-medium text-foreground">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-muted text-muted-foreground"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {u.priorityCredits} credits
                        </td>
                        <td className="px-4 py-3">
                          {isBanned ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400 font-mono">
                              BANNED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 font-mono">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleBan(u.id, isBanned)}
                            disabled={actionLoadingId === u.id || u.role === "admin"}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto ${
                              isBanned
                                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {actionLoadingId === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isBanned ? (
                              <>
                                <Check className="w-3 h-3" /> Unban
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" /> Ban User
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Immutable Audit Log */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Type</th>
                  <th className="px-4 py-3">Target ID</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-sans">
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLog.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--accent-default)]">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 uppercase text-muted-foreground">
                        {log.targetType}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {log.targetId ? log.targetId.slice(0, 8) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {log.payload ? JSON.stringify(log.payload) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
