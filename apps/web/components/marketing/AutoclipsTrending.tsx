"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AutoclipsTrending() {
  return (
    <section id="trending" className="scroll-mt-16 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Section Heading */}
        <div className="lp-halo rounded-3xl mx-auto max-w-3xl text-center">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
            Trending right now
          </p>
          <h2
            className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] text-black sm:text-4xl lg:text-[2.75rem]"
            style={{ textWrap: "balance" }}
          >
            Two formats pulling millions of views
          </h2>
          <div className="mt-4 text-base sm:text-lg leading-relaxed text-gray-500">
            Type a topic or upload raw gameplay and ClipLane renders the entire clip, in either look.
          </div>
        </div>

        {/* Two Featured Cards */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:mt-12 lg:grid-cols-2">
          {/* Card 1: Stickman (Light Card) */}
          <article className="grid grid-cols-[42%_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-3xl border p-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-6 sm:p-6 border-gray-200 bg-white text-black shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-black shadow-[0_24px_50px_-28px_rgba(0,0,0,0.6)] ring-1 ring-black/10 sm:row-span-2 group">
              <video
                src="/videos/clip-2.mp4"
                poster="/videos/clip-2.jpg"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-black backdrop-blur">
                Stickman Format
              </span>
            </div>

            <div className="flex min-w-0 flex-col items-start gap-2 sm:gap-3 sm:self-end">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Stickman
              </p>
              <p className="text-4xl font-black leading-none tracking-[-0.035em] sm:text-5xl">
                10M+
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                views on each of the viral Stickman gaming reels we built this format from.
              </p>
            </div>

            <Link
              href="/dashboard?style=stickman"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none h-11 px-5 text-sm bg-[#15E49E] text-black shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] hover:brightness-95 col-span-2 w-full sm:col-span-1 sm:col-start-2 sm:w-auto sm:self-start"
            >
              Make a Stickman video
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </article>

          {/* Card 2: Creepy Toon (Dark Card) */}
          <article className="grid grid-cols-[42%_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-3xl border p-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-6 sm:p-6 border-[#0a0d14] bg-[#0a0d14] text-white shadow-[0_24px_50px_-28px_rgba(0,0,0,0.6)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-black shadow-[0_24px_50px_-28px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:row-span-2 group">
              <video
                src="/videos/clip-3.mp4"
                poster="/videos/clip-3.jpg"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-black backdrop-blur">
                Creepy Toon
              </span>
            </div>

            <div className="flex min-w-0 flex-col items-start gap-2 sm:gap-3 sm:self-end">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa3b2]">
                Creepy Toon
              </p>
              <p className="text-4xl font-black leading-none tracking-[-0.035em] sm:text-5xl text-white">
                7.3M
              </p>
              <p className="text-sm leading-relaxed text-[#c9d0db]">
                views on one post from @usa.true.story, a Creepy Toon cinematic channel.
              </p>
            </div>

            <Link
              href="/dashboard?style=creepy-toon"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none h-11 px-5 text-sm bg-white text-black hover:bg-gray-200 col-span-2 w-full sm:col-span-1 sm:col-start-2 sm:w-auto sm:self-start"
            >
              Make a Creepy Toon video
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
