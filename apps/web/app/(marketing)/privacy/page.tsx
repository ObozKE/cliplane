import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ClipName",
  description: "Learn how ClipName protects your data, media privacy, and enforces our 3-day retention policy.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 py-6">
      <header className="border-b border-[var(--line-paper)] pb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Last revised: November 10, 2026
        </p>
      </header>

      {/* Core Privacy Principle Banner */}
      <div className="card-paper bg-[var(--bg-card)] p-5 border-l-4 border-l-[var(--accent-default)] space-y-2 text-xs text-[var(--text-primary)]">
        <h3 className="font-serif text-base font-normal">Private by Default & 3-Day Retention</h3>
        <p className="text-[var(--text-muted)] leading-relaxed">
          Your uploaded gameplay footage and rendered clips are completely private. We do not maintain a public gallery, we do not train generative models on your footage, and all media files are permanently deleted after 3 calendar days.
        </p>
      </div>

      <section className="space-y-4 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)]">
          1. Information We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>
            <strong>Account Credentials:</strong> When you register, we collect your email address and securely hashed password via Supabase Auth.
          </li>
          <li>
            <strong>Job Metadata:</strong> We store timestamps, source video duration, processing logs, and highlight scoring metrics to operate the queue and troubleshoot failures.
          </li>
          <li>
            <strong>Temporary Media Files:</strong> Source videos uploaded via TUS and generated 9:16 vertical MP4 clips and JPG thumbnails are stored in private Supabase Storage buckets accessible only through short-lived (signed) URLs.
          </li>
          <li>
            <strong>Payment Data:</strong> Payment transactions are handled directly through authorized third-party gateways (Stripe, Crypto processors, M-Pesa). ClipName never stores full credit card numbers or private crypto keys.
          </li>
        </ul>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          2. The 3-Day Media Deletion Lifecycle
        </h2>
        <p>
          Unlike platforms that retain your media indefinitely, ClipName operates a strict automated retention cleanup job:
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Every hour, our worker scans for completed or failed processing jobs older than <strong>3 calendar days</strong>. All associated raw video files in the private <code>uploads</code> bucket, rendered vertical clips in the <code>clips</code> bucket, and thumbnail files are irrevocably purged from disk and cloud storage.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          3. We Do Not Sell Your Data
        </h2>
        <p>
          We do not sell, rent, trade, or monetize your personal information or gameplay footage to third-party data brokers, advertising networks, or AI dataset aggregators.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          4. Security & Access Control
        </h2>
        <p>
          Our infrastructure enforces strict Insecure Direct Object Reference (IDOR) prevention, Row-Level Security (RLS) on all database tables, Content Security Policy (CSP) headers, and cryptographic signed URLs for all media retrieval.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          5. Your Rights & Account Erasure
        </h2>
        <p>
          You may request full deletion of your account, job history, and associated records at any time by contacting our support team at <code className="font-mono">support@clipname.tech</code>.
        </p>
      </section>
    </article>
  );
}
