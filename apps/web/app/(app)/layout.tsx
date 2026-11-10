import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-paper)]">
      {/* App Header */}
      <header className="border-b border-[var(--line-paper)] bg-[var(--bg-paper)]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[var(--text-primary)] text-[var(--accent-on)] text-xs font-bold font-mono">
                CL
              </span>
              <span className="font-serif text-xl tracking-tight text-[var(--text-primary)]">
                ClipLane
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--text-primary)]">
              <Link
                href="/dashboard"
                className="opacity-90 font-medium hover:opacity-100 transition-opacity"
              >
                Dashboard
              </Link>
              <Link
                href="/learn"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                Tutorials
              </Link>
              <Link
                href="/pricing"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                Pricing
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-[2px] bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 transition-colors"
                >
                  Admin Console
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                {user.email}
              </span>
              <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                {user.role === "admin" ? "Administrator" : "Creator Lane"}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="button-outline text-xs !py-1.5 !px-3 !rounded-[2px]"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="border-t border-[var(--line-paper)] bg-[var(--bg-subtle)] py-6 text-center text-[11px] text-[var(--text-muted)]">
        <p>Results vary. ClipLane does not guarantee views or earnings. Not affiliated with Rockstar Games or Take-Two Interactive.</p>
      </footer>
    </div>
  );
}
