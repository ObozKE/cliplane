"use client";

import { useState } from "react";
import Link from "next/link";
import { PRIORITY_JOB_PRICE_USD } from "@/lib/payments/constants";

export function InteractiveQueueCalculator() {
  const [videoMinutes, setVideoMinutes] = useState(15);
  const [lane, setLane] = useState<"free" | "priority">("free");

  // Real formula approximation matching worker pipeline
  const estimatedFreeWaitMins = Math.max(8, Math.round(videoMinutes * 0.9 + 5));
  const estimatedPrioritySeconds = Math.max(25, Math.round(videoMinutes * 2.8));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Live Speed & Queue Estimator
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Calculate Your Exact Turnaround Time
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          ClipLane runs real, server-side worker queues. No artificial countdown timers. See how fast your gameplay renders right now.
        </p>
      </div>

      <div className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] p-6 sm:p-8 rounded-[8px] space-y-8">
        {/* Controls Row: Video Length Slider & Lane Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-[var(--line-paper)] pb-8">
          {/* Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-mono uppercase text-[var(--text-muted)]">
                Footage Length to Process:
              </label>
              <span className="text-base font-serif font-bold text-[var(--text-primary)]">
                {videoMinutes} Minutes
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={videoMinutes}
              onChange={(e) => setVideoMinutes(Number(e.target.value))}
              className="w-full h-2 bg-[var(--line-paper)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-default)]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>2 min (Quick match)</span>
              <span>30 min</span>
              <span>60 min (Full stream VOD)</span>
            </div>
          </div>

          {/* Lane Toggle */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase text-[var(--text-muted)] block">
              Choose Processing Lane:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLane("free")}
                className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer ${
                  lane === "free"
                    ? "border-[var(--accent-default)] bg-blue-50/30"
                    : "border-[var(--line-paper)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]"
                }`}
              >
                <span className="block text-xs font-bold text-[var(--text-primary)]">
                  Free Community
                </span>
                <span className="block text-[11px] text-[var(--accent-default)] font-mono mt-0.5">
                  $0 / Forever
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLane("priority")}
                className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer ${
                  lane === "priority"
                    ? "border-[var(--accent-default)] bg-blue-50/30"
                    : "border-[var(--line-paper)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]"
                }`}
              >
                <span className="block text-xs font-bold text-[var(--text-primary)]">
                  ⚡ Priority Lane
                </span>
                <span className="block text-[11px] text-[var(--accent-default)] font-mono mt-0.5">
                  ${PRIORITY_JOB_PRICE_USD.toFixed(2)} USD
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Calculation Output Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--line-paper)] rounded-[4px] space-y-1">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
              ESTIMATED TURNAROUND
            </span>
            <span className="text-2xl font-serif text-[var(--text-primary)] font-bold block">
              {lane === "priority" ? `< ${estimatedPrioritySeconds}s` : `~${estimatedFreeWaitMins} mins`}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block">
              {lane === "priority" ? "Instant worker claiming" : "Public queue backlog"}
            </span>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--line-paper)] rounded-[4px] space-y-1">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
              VERTICAL CLIPS EXTRACTED
            </span>
            <span className="text-2xl font-serif text-[var(--text-primary)] font-bold block">
              3 Highlights
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block">
              Top scored action moments
            </span>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--line-paper)] rounded-[4px] space-y-1">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
              RESOLUTION & CODEC
            </span>
            <span className="text-2xl font-serif text-[var(--text-primary)] font-bold block">
              1080x1920
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block">
              60 FPS H.264 MP4
            </span>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--line-paper)] rounded-[4px] space-y-1">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block">
              WATERMARK
            </span>
            <span className="text-2xl font-serif text-emerald-600 font-bold block">
              None (0%)
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block">
              100% clean video export
            </span>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
            {lane === "priority"
              ? "Priority jobs skip all free jobs in queue and begin processing immediately upon upload."
              : "Free jobs render sequentially without artificial delays. Upgrade to Priority anytime."}
          </p>
          <Link
            href={lane === "priority" ? "/checkout" : "/dashboard"}
            className="button-primary text-xs !py-3 !px-6 whitespace-nowrap"
          >
            {lane === "priority"
              ? `Get Priority Pass ($${PRIORITY_JOB_PRICE_USD.toFixed(2)})`
              : "Start Free Processing"}
          </Link>
        </div>
      </div>
    </div>
  );
}
