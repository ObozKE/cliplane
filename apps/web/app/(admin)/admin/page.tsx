import { requireAdminUser } from "@/lib/supabase/server";

export default async function AdminPage() {
  await requireAdminUser();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--line-paper)] pb-4">
        <h1 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          System Administration Console
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Manage system throughput, compliance takedown notices, and review moderation logs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Worker State
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-green-600">
            Active
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            Concurrency: 2 workers
          </span>
        </div>

        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Takedown Requests
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-[var(--text-primary)]">
            0 Pending
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            DMCA / Infringement notices
          </span>
        </div>

        <div className="card-paper p-5 bg-[var(--bg-card)]">
          <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Audit Events
          </span>
          <span className="mt-2 block font-serif text-2xl font-normal text-[var(--text-primary)]">
            Immutable
          </span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            All administrative actions logged
          </span>
        </div>
      </div>
    </div>
  );
}
