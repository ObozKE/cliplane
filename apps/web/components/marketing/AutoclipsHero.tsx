"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check, Volume2, VolumeX } from "lucide-react";

export function AutoclipsHero() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard?prompt=${encodeURIComponent(idea.trim())}`);
  };

  const toggleSound = () => {
    setMuted(!muted);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setIdea(suggestion);
  };

  return (
    <section className="relative pb-12 sm:pb-16 pt-10 sm:pt-16">
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Top Pill Status Badge */}
          <div className="lp-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#15E49E] animate-pulse" />
              For anyone who wants to post daily without the daily grind
            </span>
          </div>

          {/* High-Impact Headline with Inline Social Badges */}
          <h1
            className="lp-rise lp-halo mt-6 rounded-3xl text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-black sm:text-6xl max-w-4xl lg:text-7xl"
            style={{ textWrap: "balance" }}
          >
            Grow Every{" "}
            <span
              role="img"
              aria-label="TikTok, YouTube, Instagram, Facebook"
              className="inline-flex align-[-0.14em] mx-[0.08em]"
            >
              {/* TikTok */}
              <span
                className="inline-flex items-center justify-center rounded-[0.24em] bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden h-[0.92em] w-[0.92em]"
                style={{ zIndex: 4 }}
              >
                <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden="true">
                  <path
                    d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                    fill="#000000"
                  />
                </svg>
              </span>
              {/* YouTube */}
              <span
                className="inline-flex items-center justify-center rounded-[0.24em] bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden h-[0.92em] w-[0.92em] -ml-[0.3em]"
                style={{ zIndex: 3 }}
              >
                <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden="true">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    fill="#FF0000"
                  />
                </svg>
              </span>
              {/* Instagram */}
              <span
                className="inline-flex items-center justify-center rounded-[0.24em] bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden h-[0.92em] w-[0.92em] -ml-[0.3em]"
                style={{ zIndex: 2 }}
              >
                <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden="true">
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
                    fill="#E1306C"
                  />
                </svg>
              </span>
              {/* Facebook */}
              <span
                className="inline-flex items-center justify-center rounded-[0.24em] bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden h-[0.92em] w-[0.92em] -ml-[0.3em]"
                style={{ zIndex: 1 }}
              >
                <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden="true">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    fill="#1877F2"
                  />
                </svg>
              </span>
            </span>{" "}
            Account on{" "}
            <span className="underline decoration-dashed decoration-[#15E49E] decoration-[0.05em] underline-offset-[0.16em]">
              Autopilot
            </span>
          </h1>

          {/* Subtitle */}
          <p className="lp-fade-up lp-halo mt-6 rounded-2xl text-lg leading-relaxed text-gray-500 sm:text-xl max-w-2xl">
            One prompt or gameplay link becomes a month of viral 9:16 vertical clips, written, voiced, captioned, and scheduled to TikTok, YouTube, Instagram and Facebook. You just watch the numbers.
          </p>

          {/* Interactive Input Form Container */}
          <div className="lp-fade-up mt-8 flex w-full flex-col items-center">
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:rounded-full sm:border sm:border-gray-200 sm:bg-white sm:p-1.5 sm:pl-3 sm:shadow-[0_14px_40px_-16px_rgba(0,0,0,0.25)] sm:transition-colors sm:focus-within:border-gray-400"
            >
              <label htmlFor="lp-grow-idea" className="sr-only">
                Your video idea
              </label>
              <div className="flex flex-1 items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 sm:border-0 sm:px-3 sm:shadow-none">
                <Sparkles className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  id="lp-grow-idea"
                  type="text"
                  required
                  placeholder="Your video idea or gameplay link..."
                  autoComplete="off"
                  className="h-12 w-full bg-transparent text-base text-black outline-none placeholder:text-gray-400 sm:h-11"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none h-12 px-6 text-base bg-[#15E49E] text-black shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] hover:brightness-95 w-full sm:w-auto shrink-0"
              >
                Create video
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="mt-3 flex flex-wrap justify-center items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-400">Try:</span>
              {[
                "Minecraft Parkour & Peter Griffin",
                "GTA V Impossible Stunts",
                "Call of Duty 1v4 Clutch",
                "Subway Surfers True Crime Story",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="lp-fade-up mt-5">
            <ul className="lp-halo flex flex-wrap gap-x-5 gap-y-2 rounded-xl text-sm text-gray-600 justify-center">
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                First video is free
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                No credit card required
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                Cancel anytime
              </li>
            </ul>
          </div>
        </div>

        {/* 3x 9:16 Vertical Card Showcase Stack */}
        <div className="lp-rise mt-14 sm:mt-16">
          <div className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="relative group overflow-hidden bg-black aspect-[9/16] rounded-[1.25rem] ring-1 ring-black/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <video
                ref={videoRef}
                src="/videos/clip-1.mp4"
                poster="/videos/clip-1.jpg"
                autoPlay
                loop
                muted={muted}
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur shadow-sm">
                3D Animated Studio 2.0
              </span>
              <button
                type="button"
                onClick={toggleSound}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                title="Toggle Mute"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#15E49E]" />}
              </button>
            </div>

            {/* Card 2 */}
            <div className="relative group overflow-hidden bg-black aspect-[9/16] rounded-[1.25rem] ring-1 ring-black/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
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
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur shadow-sm">
                Character Explainer
              </span>
            </div>

            {/* Card 3 */}
            <div className="relative group overflow-hidden bg-black aspect-[9/16] rounded-[1.25rem] ring-1 ring-black/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <video
                src="/videos/clip-3.mp4"
                poster="/videos/clip-3.jpg"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur shadow-sm">
                ClipLane Faceless
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
