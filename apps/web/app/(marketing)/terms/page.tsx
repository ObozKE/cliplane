import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ClipName",
  description: "Terms of Service, acceptable use guidelines, and footage ownership policies for ClipName.",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 py-6">
      <header className="border-b border-[var(--line-paper)] pb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)]">
          Terms of Service
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Last revised: November 10, 2026
        </p>
      </header>

      {/* Mandatory Disclaimer Alert */}
      <div className="rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-subtle)] p-5 text-xs text-[var(--text-primary)] leading-relaxed space-y-2">
        <p className="font-semibold uppercase tracking-wider text-[11px] text-[var(--text-muted)]">
          Mandatory Platform & Earnings Disclaimer
        </p>
        <p>
          Results vary. ClipName is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
        </p>
        <p className="text-[var(--text-muted)]">
          ClipName is an independent software tool and is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
        </p>
      </div>

      <section className="space-y-4 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)]">
          1. Acceptance of Terms
        </h2>
        <p>
          By creating an account, accessing `clipname.tech`, or utilizing our video clipping services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our service.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          2. Content Ownership and Permitted Footage
        </h2>
        <p>
          You represent and warrant that you own the gameplay footage you submit or possess explicit authorization, license, or legal permission to process and edit it.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>
            <strong>No Pre-Release or Leaked Material:</strong> You must NOT upload or submit leaked, non-public, confidential, datamined, or pre-release footage subject to Non-Disclosure Agreements (NDAs).
          </li>
          <li>
            <strong>Intellectual Property:</strong> Game video clips contain intellectual property belonging to their respective game publishers and developers. You are solely responsible for ensuring that your publication of game clips complies with the respective publisher&apos;s public video policy.
          </li>
          <li>
            <strong>Prohibited Content:</strong> You may not upload material containing hate speech, harassment, malware, violence outside the scope of virtual gameplay, or unlawful depictions.
          </li>
        </ul>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          3. Real Queue Architecture & Service Lanes
        </h2>
        <p>
          ClipName provides two distinct processing tiers:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>
            <strong>Free Lane:</strong> Jobs submitted under the Free tier enter an intentionally throttled queue with honest estimated wait calculations derived directly from database concurrency state. Free queue jobs are subject to a minimum waiting window.
          </li>
          <li>
            <strong>Priority Lane:</strong> Users who purchase single Priority jobs or bundle packs are routed directly to our worker pool with zero artificial throttling, processed in the order received.
          </li>
        </ul>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          4. Media Storage & 3-Day Retention Policy
        </h2>
        <p>
          To maintain an efficient and cost-effective pipeline, uploaded media files and generated vertical clips are retained for a maximum of <strong>three (3) calendar days</strong> from the moment of processing. After this period, files are permanently purged from our private storage systems. You are solely responsible for downloading and archiving your generated clips.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          5. Repeat Infringer Policy & Account Termination
        </h2>
        <p>
          ClipName adheres strictly to the Digital Millennium Copyright Act (DMCA). In accordance with our repeat-infringer policy, we will terminate the accounts of users who are found to repeatedly infringe the intellectual property rights of copyright holders.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          6. Limitation of Liability & No Earnings Warranty
        </h2>
        <p>
          ClipName is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make zero warranties or representations regarding social media reach, audience engagement, viral performance, algorithmic favorability, platform monetization approval, or financial income.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          7. Contact Information
        </h2>
        <p>
          Questions regarding these Terms of Service or copyright inquiries should be directed to: <code className="font-mono">copyright@clipname.tech</code>.
        </p>
      </section>
    </article>
  );
}
