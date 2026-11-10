import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  getAdminDashboardStatsAction,
  getAdminJobsAction,
  getAdminTakedownsAction,
  getAdminUsersAction,
  getAdminAuditLogAction,
} from "./actions";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Console — ClipName",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  await requireAdminUser();

  const [
    statsResult,
    jobsResult,
    takedownsResult,
    usersResult,
    auditResult,
  ] = await Promise.all([
    getAdminDashboardStatsAction(),
    getAdminJobsAction(),
    getAdminTakedownsAction(),
    getAdminUsersAction(),
    getAdminAuditLogAction(),
  ]);

  const defaultStats = {
    totalJobs: 0,
    queuedPriorityJobs: 0,
    queuedFreeJobs: 0,
    processingJobs: 0,
    completedJobs24h: 0,
    failedJobs24h: 0,
    pendingTakedowns: 0,
    totalUsers: 0,
    bannedUsers: 0,
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Administration Console
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor real-time queue health, inspect jobs, review DMCA takedown notices, and manage creator moderation.
        </p>
      </div>

      <AdminDashboardClient
        initialStats={statsResult.success ? statsResult.data : defaultStats}
        initialJobs={jobsResult.success ? jobsResult.data : []}
        initialTakedowns={takedownsResult.success ? takedownsResult.data : []}
        initialUsers={usersResult.success ? usersResult.data : []}
        initialAuditLog={auditResult.success ? auditResult.data : []}
      />
    </div>
  );
}
