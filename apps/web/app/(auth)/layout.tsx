import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-paper)]">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-[var(--text-primary)] text-[var(--accent-on)] text-xs font-bold font-mono">
            CN
          </span>
          <span className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
            ClipLane
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md card-paper p-8 bg-[var(--bg-raised)] shadow-sm">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-[var(--text-muted)] space-x-4">
        <Link href="/terms" className="hover:underline">Terms</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <span>•</span>
        <Link href="/dmca" className="hover:underline">DMCA & Takedowns</Link>
      </div>
    </div>
  );
}
