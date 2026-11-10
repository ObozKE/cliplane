import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/supabase/server";

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
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-red-600 text-white text-xs font-bold font-mono">
                AD
              </span>
              <span className="font-serif text-lg tracking-tight text-[var(--text-panel)]">
                ClipName Admin
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
