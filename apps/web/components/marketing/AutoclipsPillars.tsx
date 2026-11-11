import { Zap, DollarSign, TrendingUp, Users, Film, Video } from "lucide-react";

export function AutoclipsPillars() {
  return (
    <section id="what-is-cliplane" className="scroll-mt-16 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Section Heading */}
        <div className="lp-halo rounded-3xl mx-auto max-w-3xl text-center">
          <h2
            className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] text-black sm:text-4xl lg:text-[2.75rem]"
            style={{ textWrap: "balance" }}
          >
            What is ClipLane?
          </h2>
          <div className="mt-4 text-base sm:text-lg leading-relaxed text-gray-500">
            ClipLane is an automated AI video engine that helps you{" "}
            <strong className="text-black font-semibold">create viral videos</strong> and{" "}
            <strong className="text-black font-semibold">grow audiences</strong> on YouTube Shorts, TikTok, Instagram Reels, and Facebook — without showing your face, without complex editing software, and without spending hours scrubbing raw timelines.
          </div>
        </div>

        {/* 4 Feature Pills Row */}
        <div className="lp-halo mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 rounded-2xl">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Zap className="h-5 w-5 text-[#15E49E] shrink-0" />
            <span>Create vertical clips in under 15 seconds</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="h-5 w-5 text-[#15E49E] shrink-0" />
            <span>Monetize on YouTube, TikTok, Instagram & Facebook</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <TrendingUp className="h-5 w-5 text-[#15E49E] shrink-0" />
            <span>Join 100,000+ creators going viral</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-5 w-5 text-[#15E49E] shrink-0" />
            <span>No camera, no editing skills needed</span>
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Card 1: GTA 6 Vice City Cinematics (Most Popular) */}
          <div className="rounded-2xl border bg-white p-6 sm:p-7 border-black shadow-[0_30px_60px_-35px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#15E49E]">
                  <Film className="h-5 w-5 text-black" />
                </span>
                <span className="rounded-full bg-black px-2.5 py-1 text-xs font-bold text-white">
                  Trending
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-black">GTA 6 Vice City Cinematics</h3>
              <p className="mt-1 text-sm font-semibold text-[#0A7A50]">
                Next-gen neon aesthetics &amp; story trailers
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Transform raw GTA 6 footage, Vice City neon strip cruises, and Lucia &amp; Jason story moments into viral 9:16 vertical clips with dynamic blurred background fills.
              </p>
            </div>
            <p className="mt-6 text-sm font-semibold text-gray-500 pt-4 border-t border-gray-100">
              Unlimited on Free Lane • Instant on Priority
            </p>
          </div>

          {/* Card 2: GTA 5 Heists & Escapes */}
          <div className="rounded-2xl border bg-white p-6 sm:p-7 border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#15E49E]">
                  <Zap className="h-5 w-5 text-black" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-black">GTA 5 Heists &amp; Pursuits</h3>
              <p className="mt-1 text-sm font-semibold text-[#0A7A50]">
                5-Star police chases &amp; bank jobs
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Turn intense Los Santos 5-star police pursuits, high-velocity highway weaving, and Paleto Bay bank heists into algorithm-ready vertical Shorts and TikToks.
              </p>
            </div>
            <p className="mt-6 text-sm font-semibold text-gray-500 pt-4 border-t border-gray-100">
              Full 1080x1920 HD • 60 FPS Export
            </p>
          </div>

          {/* Card 3: FiveM & Roleplay Highlights */}
          <div className="rounded-2xl border bg-white p-6 sm:p-7 border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#15E49E]">
                  <Video className="h-5 w-5 text-black" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-black">FiveM &amp; Gameplay Highlights</h3>
              <p className="mt-1 text-sm font-semibold text-[#0A7A50]">
                Streamer VODs into top 3 clutch moments
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Turn your long Twitch/YouTube stream recordings into 3 curated, highest-clutch highlights scored by voice reaction bursts and visual scene switches.
              </p>
            </div>
            <p className="mt-6 text-sm font-semibold text-gray-500 pt-4 border-t border-gray-100">
              Zero Watermarks • 100% Rights Kept
            </p>
          </div>
        </div>

        {/* Creator Trust Endorsement */}
        <p className="lp-halo mx-auto mt-10 w-fit rounded-xl text-center text-sm font-medium text-gray-500">
          Trusted by <strong className="text-black font-semibold">100,000+</strong> content creators earning money from viral vertical videos
        </p>
      </div>
    </section>
  );
}
