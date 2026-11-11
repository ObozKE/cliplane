"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star } from "lucide-react";

export function AutoclipsPricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "passes">("passes");

  return (
    <section id="pricing" className="scroll-mt-16 py-16 sm:py-24 bg-gradient-to-b from-transparent via-[#F6F6F4]/50 to-transparent">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Choose the plan that&apos;s{" "}
            <span className="text-[#0A7A50]">right for you</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Start creating viral vertical clips today. Simple, honest pricing with 100% free unlimited clips.
          </p>

          {/* Switcher Pill */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center bg-white p-1.5 rounded-full shadow-md border border-gray-200 gap-1">
              <button
                type="button"
                onClick={() => setBillingPeriod("passes")}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingPeriod === "passes"
                    ? "bg-[#15E49E] text-black shadow-sm font-bold"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                Pay-Per-Job Passes
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">
                  Popular
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingPeriod === "monthly"
                    ? "bg-[#15E49E] text-black shadow-sm font-bold"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                Subscription
                <span className="text-[10px] bg-[#0A7A50] text-white px-2 py-0.5 rounded-full font-bold">
                  -40%
                </span>
              </button>
            </div>
          </div>

          {/* Social Proof Stars & Avatars */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  A
                </span>
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                  M
                </span>
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-purple-500 text-white font-bold text-xs flex items-center justify-center">
                  K
                </span>
                <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                  S
                </span>
              </div>
              <span className="font-semibold text-gray-800">
                4.9/5 from 10,000+ happy creators
              </span>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 items-stretch">
          {/* Plan 1: Free Forever */}
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Standard Queue
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  100% Free
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-black">$0</span>
                <span className="text-sm text-gray-500">/ forever</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Unlimited clips for creators on a budget. Zero watermarks, ever.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700 border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Unlimited video uploads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>3 vertical clips generated per video</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Full 1080x1920 (9:16) HD resolution</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Zero watermarks or branding</span>
                </li>
                <li className="flex items-center gap-2.5 text-gray-400">
                  <span>Standard queue wait window</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-full font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-black h-12 text-sm transition-colors"
            >
              Start Clipping Free
            </Link>
          </div>

          {/* Plan 2: Priority Skip Pass (Featured / Most Popular) */}
          <div className="relative rounded-3xl border-2 border-black bg-white p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] flex flex-col justify-between scale-[1.02] z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-1 text-xs font-extrabold text-white uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-[#0A7A50]">
                  Single Priority Pass
                </span>
                <span className="rounded-full bg-[#15E49E] px-2.5 py-0.5 text-xs font-bold text-black">
                  Instant Skip
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-black">$2.99</span>
                <span className="text-sm text-gray-500">/ single job</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Skip the entire line instantly. Processed right now ahead of all free queue jobs.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700 border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span className="font-semibold text-black">Instant priority lane skip</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Processed in ~10 to 15 seconds</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>3 vertical clips at 1080x1920 HD</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Zero watermarks + direct MP4 download</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Dedicated worker thread allocation</span>
                </li>
              </ul>
            </div>

            <Link
              href="/checkout"
              className="mt-8 inline-flex items-center justify-center rounded-full font-bold bg-[#15E49E] text-black hover:brightness-95 h-12 text-sm shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] transition-all"
            >
              Skip Queue for $2.99
            </Link>
          </div>

          {/* Plan 3: Creator 5-Pack */}
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Creator Bundle
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Save 33%
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-black">$9.99</span>
                <span className="text-sm text-gray-500">/ 5 passes</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                5 Priority Passes ($1.99 per job). Never expire. Keep in your pocket for clutch VODs.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700 border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>5 Instant Priority Queue Skips</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span className="font-semibold text-black">Passes never expire</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>15 vertical clips total across jobs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>Full 1080x1920 HD with blurred backdrop</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                  <span>One-click redeem whenever you upload</span>
                </li>
              </ul>
            </div>

            <Link
              href="/checkout?bundle=true"
              className="mt-8 inline-flex items-center justify-center rounded-full font-bold bg-black text-white hover:bg-neutral-800 h-12 text-sm transition-colors"
            >
              Get 5-Job Pack for $9.99
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
