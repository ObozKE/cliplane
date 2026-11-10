import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
} from "@/lib/payments/constants";

export const metadata: Metadata = {
  title: "Simple, Honest Pricing — ClipLane",
  description: "Unlimited gameplay clipping for free, or skip the queue with a Priority Pass for $2.99. No subscriptions, no watermarks, full 1080x1920 HD.",
};

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Simple & Transparent
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
          Clip for Free.
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          No monthly subscription traps. No watermarks. Every tier gives you full 1080x1920 HD vertical clips formatted for TikTok, Reels, and Shorts.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Free Community Lane */}
        <div className="card-paper bg-[var(--bg-raised)] p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-[var(--line-paper)]">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Community
              </span>
              <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-1">
                Free Lane
              </h2>
              <p className="text-xs font-medium text-[var(--accent-default)] mt-0.5">
                Unlimited clips. Zero cost.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">$0</span>
              <span className="text-xs text-[var(--text-muted)]">/ forever</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Upload as much gameplay as you want for free. Your video waits in our public queue and renders in order. You get the exact same HD quality and zero watermarks as paid users.
            </p>

            <ul className="space-y-2.5 text-xs text-[var(--text-primary)] pt-3 border-t border-[var(--line-paper)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Unlimited clips</strong> — upload whenever you play</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Full 1080x1920 HD</strong> (crisp 9:16 vertical format)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Zero watermarks</strong> — 100% clean video</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Top 3 highlights per video</strong> (audio & action peaks)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>9:16 blurred background fill</strong> (no black bars)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>3-day cloud retention</strong> to download your files</span>
              </li>
            </ul>
          </div>

          <Link href="/dashboard" className="button-secondary text-xs !py-2.5 text-center">
            Start Clipping Free
          </Link>
        </div>

        {/* Tier 2: Single Priority Upgrade (Popular) */}
        <div className="card-paper bg-[var(--bg-raised)] p-6 sm:p-8 flex flex-col justify-between space-y-6 border-2 border-[var(--accent-default)] relative shadow-md">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent-default)] text-[var(--accent-on)] text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-0.5 rounded-[2px]">
            Most Popular
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-default)] font-bold">
                Instant Processing
              </span>
              <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-1">
                Single Priority
              </h2>
              <p className="text-xs font-medium text-[var(--accent-default)] mt-0.5">
                Skip the line right now.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">
                ${PRIORITY_JOB_PRICE_USD.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ 1 job</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Got an insane clutch match you need to post immediately? Pay once to jump to the front of the queue. Renders start instantly with zero artificial delays.
            </p>

            <ul className="space-y-2.5 text-xs text-[var(--text-primary)] pt-3 border-t border-[var(--line-paper)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Instant queue skip</strong> — jumps ahead of free jobs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Zero waiting window</strong> — worker starts immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Full 1080x1920 HD quality</strong> with blurred background</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Top 3 highlights + instant cover thumbnails</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Zero watermarks</strong> — publish straight to feeds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>No recurring subscription</strong> — one-time checkout</span>
              </li>
            </ul>
          </div>

          <Link href="/checkout" className="button-primary text-xs !py-2.5 text-center">
            Upgrade a Job (${PRIORITY_JOB_PRICE_USD.toFixed(2)})
          </Link>
        </div>

        {/* Tier 3: 5-Job Creator Pack */}
        <div className="card-paper bg-[var(--bg-raised)] p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-[var(--line-paper)]">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Best Value
              </span>
              <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-1">
                5-Job Pack
              </h2>
              <p className="text-xs font-medium text-[var(--accent-default)] mt-0.5">
                Only ~$2.00 per clip. Passes never expire.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">
                ${PRIORITY_BUNDLE_PRICE_USD.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ 5 priority passes</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Designed for daily streamers and creators. 5 Priority Passes deposited to your account. Use 1 today and save the rest for later—they never expire.
            </p>

            <ul className="space-y-2.5 text-xs text-[var(--text-primary)] pt-3 border-t border-[var(--line-paper)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Save ~33%</strong> vs single upgrades</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>5 Priority Passes</strong> added to your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Passes never expire</strong> — use whenever you play</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>1-click activation</strong> on any upload in dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Full 1080x1920 HD</strong> + blurred backdrops + thumbnails</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent-default)] font-bold mt-0.5">✓</span>
                <span><strong>Zero watermarks</strong> on every single export</span>
              </li>
            </ul>
          </div>

          <Link href="/checkout?bundle=true" className="button-secondary text-xs !py-2.5 text-center">
            Buy 5-Job Pack (${PRIORITY_BUNDLE_PRICE_USD.toFixed(2)})
          </Link>
        </div>
      </div>

      {/* Accepted Payment Methods Banner */}
      <div className="panel-dark p-6 sm:p-8 text-center space-y-3">
        <h3 className="font-serif text-lg text-white">Accepted Payment Methods</h3>
        <p className="text-xs text-[var(--text-panel-muted)] max-w-xl mx-auto leading-relaxed">
          Pay in USD using major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, or direct cryptocurrency (Bitcoin, Ethereum, USDT, Litecoin).
        </p>
      </div>

      {/* Mandatory Regulatory & Legal Disclaimer */}
      <div className="rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-subtle)] p-6 space-y-2 text-xs text-[var(--text-primary)] leading-relaxed">
        <p className="font-semibold uppercase tracking-wider text-[11px] text-[var(--text-muted)]">
          Required Disclaimers & Fair Use Notice
        </p>
        <p>
          Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
        </p>
        <p className="text-[var(--text-muted)]">
          Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
        </p>
      </div>
    </div>
  );
}
