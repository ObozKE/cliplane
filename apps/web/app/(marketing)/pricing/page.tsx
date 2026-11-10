import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
} from "@/lib/payments/constants";

export const metadata: Metadata = {
  title: "Pricing & Processing Lanes — ClipLane",
  description: "Transparent pricing for gameplay highlight clipping. Free community lane or Priority processing with USD, Crypto, or M-Pesa.",
};

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Real Queue Pricing
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
          Transparent, No-Nonsense Clipping
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Clip for free in our community queue, or upgrade to Priority lane to skip the wait. No hidden recurring subscriptions. Pay only when you need clips.
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
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">$0</span>
              <span className="text-xs text-[var(--text-muted)]">/ forever</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Standard low-priority queue. We compute real queue positions and honest wait estimates directly from worker concurrency.
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-primary)] pt-2 border-t border-[var(--line-paper)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Low-priority community queue</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Full 1080x1920 (9:16) vertical formatting</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Audio loudness & scene-cut detection</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Top 3 highlight clips per footage</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>3-day media retention</span>
              </li>
            </ul>
          </div>

          <Link href="/dashboard" className="button-secondary text-xs !py-2.5 text-center">
            Clip for Free
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
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">
                ${PRIORITY_JOB_PRICE_USD.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ 1 job</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Worker pool claims Priority jobs first. Zero artificial delay or throttles. Clips ready as fast as the worker finishes encoding.
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-primary)] pt-2 border-t border-[var(--line-paper)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <strong>Zero artificial waiting window</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Claimed ahead of all free queue jobs</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Full 1080x1920 (9:16) with blurred background</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Top 3 highlight clips + JPG thumbnails</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Pay via Cards, Crypto (BTC/ETH/USDT), or M-Pesa</span>
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
                Creator Bundle
              </span>
              <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-1">
                5-Job Pack
              </h2>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-normal text-[var(--text-primary)]">
                ${PRIORITY_BUNDLE_PRICE_USD.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ 5 priority credits</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Only ~$2.00 per job. 5 priority credits deposited to your account with no expiration. Redeem with 1 click on any upload.
            </p>

            <ul className="space-y-2 text-xs text-[var(--text-primary)] pt-2 border-t border-[var(--line-paper)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <strong>Save ~33% vs single purchases</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>5 Priority Credits deposited to account</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Credits never expire</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>1-click upgrade on any queued job</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent-default)] font-bold">✓</span>
                <span>Cards, Crypto & M-Pesa accepted</span>
              </li>
            </ul>
          </div>

          <Link href="/checkout?bundle=true" className="button-secondary text-xs !py-2.5 text-center">
            Buy 5-Job Pack (${PRIORITY_BUNDLE_PRICE_USD.toFixed(2)})
          </Link>
        </div>
      </div>

      {/* Payment Methods Supported Banner */}
      <div className="panel-dark p-6 sm:p-8 text-center space-y-3">
        <h3 className="font-serif text-lg text-white">Accepted Payment Methods</h3>
        <p className="text-xs text-[var(--text-panel-muted)] max-w-xl mx-auto leading-relaxed">
          Pay in USD using major credit and debit cards, transfer cryptocurrency directly (Bitcoin, Ethereum, USDT), or use mobile money (M-Pesa).
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
