import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/supabase/server";
import { ClipLaneIcon } from "@/components/brand/ClipLaneLogo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    // Non-admins get 404 to prevent administrative route discovery
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-paper)]">
      <header className="border-b border-[var(--line-paper)] bg-[var(--bg-panel)] text-[var(--text-panel)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <ClipLaneIcon className="w-6 h-6" />
              <span className="font-serif text-lg tracking-tight text-[var(--text-panel)]">
                ClipLane <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">Admin</span>
              </span>
            </Link>

            <nav className="flex items-center gap-4 text-xs">
              <Link href="/admin" className="text-[var(--text-panel-muted)] hover:text-white transition-colors">
                Overview
              </Link>
              <Link href="/dashboard" className="text-[var(--text-panel-muted)] hover:text-white transition-colors">
                ← Exit to App
              </Link>
            </nav>
          </div>

          <div className="text-xs text-[var(--text-panel-muted)]">
            Admin: <span className="text-[var(--text-panel)] font-mono">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
