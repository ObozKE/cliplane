import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getUserJobsAction } from "@/app/dashboard/actions";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { JobsList, type JobItem } from "@/components/dashboard/JobsList";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const jobs = (await getUserJobsAction()) as JobItem[];

  const activeQueuedCount = jobs.filter((j) => j.status === "queued" || j.status === "processing").length;
  const completedCount = jobs.filter((j) => j.status === "complete").length;

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line-paper)] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
            Creator Dashboard
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Signed in as <span className="font-mono text-[var(--text-primary)]">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pricing" className="button-outline text-xs !py-2 !px-3.5">
            Lane Pricing & Upgrade
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Active Jobs in Queue
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-[var(--text-primary)]">
            {activeQueuedCount}
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            Free lane jobs + instant priority jobs
          </span>
        </div>

        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Completed Highlights
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-[var(--text-primary)]">
            {completedCount}
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            Ready-to-download 9:16 vertical exports
          </span>
        </div>

        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Priority Lane Upgrade
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-[var(--accent-default)]">
            $2.99 / Job
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            Skip the 24h wait • Zero hold time
          </span>
        </div>
      </div>

      {/* Upload and Intake Form Component */}
      <UploadCard userId={user.id} />

      {/* Jobs Feed with Live Realtime Updates */}
      <JobsList initialJobs={jobs} userId={user.id} />
    </div>
  );
}
