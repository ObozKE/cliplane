import type { Metadata } from "next";
import { TakedownForm } from "./TakedownForm";

export const metadata: Metadata = {
  title: "Copyright & DMCA Takedown Policy — ClipLane",
  description: "Official DMCA takedown policy, copyright infringement notification form, and repeat-infringer policy for ClipLane.",
};

export default function DmcaPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 py-6">
      <header className="border-b border-[var(--line-paper)] pb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)]">
          Copyright & DMCA Takedowns
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Last revised: November 10, 2026 • Designated Contact: copyright@cliplane.tech
        </p>
      </header>

      {/* Overview */}
      <section className="space-y-4 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
        <p>
          ClipLane respects the intellectual property rights of game developers, content creators, and publishers. We expect our users to do the same. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512), we respond promptly to valid notices of copyright infringement.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          Repeat Infringer Policy
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          ClipLane maintains a strict repeat-infringer policy. We will terminate the accounts of users who are the subject of repeated substantiated copyright infringement notifications or who willfully upload proprietary, NDA-protected, pre-release, or leaked video footage without authorization.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] pt-4">
          Filing a DMCA Notice
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          To file a formal notice of copyright infringement, you must provide a written communication that includes the following details:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--text-muted)]">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the material that is claimed to be infringing (including specific clip or job URLs).</li>
          <li>Information reasonably sufficient to permit ClipLane to contact you (name, address, telephone number, email).</li>
          <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
          <li>A statement made under penalty of perjury that the information in the notification is accurate.</li>
        </ul>
      </section>

      {/* Interactive Takedown Submission Form */}
      <div className="card-paper bg-[var(--bg-raised)] p-6 sm:p-8 space-y-6 border border-[var(--line-paper)] shadow-xs">
        <div>
          <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
            Submit an Infringement Notice
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Fill out the official notification below or email our designated agent directly at <code className="font-mono text-[var(--text-primary)]">copyright@cliplane.tech</code>.
          </p>
        </div>

        <TakedownForm />
      </div>
    </article>
  );
}
