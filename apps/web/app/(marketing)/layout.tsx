import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header styled after Carefront navigation */}
      <header className="border-b border-[var(--line-paper)] bg-[var(--bg-paper)]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[var(--text-primary)] text-[var(--accent-on)] text-xs font-bold font-mono">
              CL
            </span>
            <span className="font-serif text-xl tracking-tight text-[var(--text-primary)]">
              ClipLane
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-[var(--text-primary)]">
            <Link
              href="/pricing"
              className="opacity-75 hover:opacity-100 transition-opacity"
            >
              Pricing
            </Link>
            <Link
              href="/learn"
              className="opacity-75 hover:opacity-100 transition-opacity"
            >
              Tutorials
            </Link>
            <Link
              href="/auth/login"
              className="opacity-75 hover:opacity-100 font-medium transition-opacity"
            >
              Sign In
            </Link>
            <Link href="/auth/signup" className="button-primary text-xs !py-2 !px-3.5">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>

      {/* Footer with mandatory compliance disclaimers */}
      <footer className="border-t border-[var(--line-paper)] bg-[var(--bg-subtle)] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-xs text-[var(--text-muted)] space-y-4">
          <p className="leading-relaxed">
            Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
          </p>
          <p>
            Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
          </p>
          <div className="flex flex-wrap gap-5 pt-4 border-t border-[var(--line-paper)]">
            <span>© {new Date().getFullYear()} ClipLane. Precision clipping.</span>
            <Link href="/learn" className="hover:underline">Tutorials</Link>
            <Link href="/pricing" className="hover:underline">Pricing</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/dmca" className="hover:underline">Copyright & Takedowns</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
