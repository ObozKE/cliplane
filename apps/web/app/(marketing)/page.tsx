import Link from "next/link";

export default function HomePage() {
  return (
    <div className="py-12 sm:py-20 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--line-paper)] bg-[var(--bg-raised)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-default)] animate-pulse" />
        <span>Transparent Queues • 100% Truthful Stats</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-serif tracking-tight max-w-4xl text-[var(--text-primary)] leading-[1.12]">
        Turn Raw Gameplay Into Ready-to-Post 9:16 Vertical Highlights
      </h1>

      <p className="mt-6 text-base sm:text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
        Automated loudness energy bursts and scene-change density detection calibrated for fast-paced gameplay footage. Zero fake countdowns.
      </p>

      <div className="mt-8 flex flex-wrap gap-3.5 justify-center">
        <Link href="/auth/signup" className="button-primary text-sm !px-6 !py-3">
          Create Clips Free
        </Link>
        <Link href="/pricing" className="button-outline text-sm !px-6 !py-3">
          Compare Lanes & Pricing
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl text-left w-full">
        <div className="card-paper p-6 bg-[var(--bg-card)]">
          <div className="text-xs font-mono font-semibold text-[var(--accent-default)] mb-2">
            STEP 01
          </div>
          <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
            Audio & Scene Peak Detection
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            FFmpeg `ebur128` loudness analysis finds the highest intensity action moments without paying for costly AI APIs.
          </p>
        </div>

        <div className="card-paper p-6 bg-[var(--bg-card)]">
          <div className="text-xs font-mono font-semibold text-[var(--accent-default)] mb-2">
            STEP 02
          </div>
          <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
            Mathematically Real Queue
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            Every position and wait estimate comes straight from live database queries. Free jobs are throttled openly; Priority jobs run immediately.
          </p>
        </div>

        <div className="card-paper p-6 bg-[var(--bg-card)]">
          <div className="text-xs font-mono font-semibold text-[var(--accent-default)] mb-2">
            STEP 03
          </div>
          <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
            Vertical 1080x1920 Renders
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            Exports 9:16 vertical clips with blurred background fill, H.264 CRF 23, and JPG thumbnails ready to upload.
          </p>
        </div>
      </div>
    </div>
  );
}
