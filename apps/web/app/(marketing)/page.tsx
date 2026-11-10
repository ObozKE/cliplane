import Link from "next/link";
import { HeroCinematicBackground } from "@/components/marketing/HeroCinematicBackground";
import { InteractiveClipSimulator } from "@/components/marketing/InteractiveClipSimulator";
import { InteractiveQueueCalculator } from "@/components/marketing/InteractiveQueueCalculator";
import { InteractiveNichesFilter } from "@/components/marketing/InteractiveNichesFilter";
import { InteractiveComparisonMatrix } from "@/components/marketing/InteractiveComparisonMatrix";
import { InteractiveFAQ } from "@/components/marketing/InteractiveFAQ";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center space-y-24 sm:space-y-32 pb-16">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. CINEMATIC GAMING HERO SECTION                                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative w-full min-h-[580px] sm:min-h-[660px] flex flex-col items-center justify-center pt-16 pb-20 px-4 sm:px-6">
        {/* Ambient Looped Cinematic Gaming Video Background */}
        <HeroCinematicBackground />

        {/* Hero Content Container */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-white/90 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">BUILT FOR GAMEPLAY CREATORS • ZERO WATERMARKS • 100% FREE TIER</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-white leading-[1.1] drop-shadow-md">
            Turn 1-Hour Gameplay Into Viral-Ready 9:16 Clips In Seconds.
          </h1>

          <p className="text-base sm:text-xl text-neutral-200 max-w-2xl leading-relaxed drop-shadow-sm">
            Stop scrubbing through hours of raw VODs. ClipLane listens for your screaming clutch moments, detects intense action cuts, and renders clean 1080x1920 vertical clips formatted for TikTok, Shorts, and Reels.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="button-primary text-sm !px-8 !py-4 font-semibold shadow-xl hover:scale-105 transition-transform"
            >
              Start Clipping Free
            </Link>
            <Link
              href="/pricing"
              className="button-outline text-sm !px-6 !py-4 font-medium bg-black/40 text-white border-white/25 hover:border-white hover:bg-black/60 transition-all backdrop-blur-md"
            >
              Compare Processing Lanes
            </Link>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5">
              <strong className="text-emerald-400 font-bold">✓</strong> Unlimited free clips
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-emerald-400 font-bold">✓</strong> Full 1080x1920 HD
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-emerald-400 font-bold">✓</strong> Zero watermarks, ever
            </span>
            <span className="flex items-center gap-1.5">
              <strong className="text-emerald-400 font-bold">✓</strong> No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE HIGHLIGHT & ASPECT RATIO SIMULATOR                      */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full px-4 sm:px-6">
        <InteractiveClipSimulator />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. TRANSFORMATION WALKTHROUGH (Widescreen -> Smart -> Mobile 9:16)     */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full max-w-5xl px-4 sm:px-6 text-left space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
            How It Transforms Your Footage
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
            From Widescreen Chaos to Mobile Gold
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Never crop manually or fight black bars in Premiere again.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-paper p-6 bg-[var(--bg-card)] border border-[var(--line-paper)] space-y-3">
            <div className="text-xs font-mono font-semibold text-[var(--text-muted)]">
              01 • RAW FOOTAGE IN
            </div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              16:9 Widescreen Gameplay
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Upload up to 500MB of raw MP4/MOV footage from OBS, GeForce Experience, or stream recordings. Or simply paste a direct video link.
            </p>
            <div className="mt-4 p-3 bg-[var(--bg-subtle)] rounded-[4px] border border-[var(--line-paper)] text-[11px] font-mono text-[var(--text-muted)]">
              Input: 1920x1080 Widescreen • Any FPS • Up to 500MB
            </div>
          </div>

          <div className="card-paper p-6 bg-[var(--bg-card)] border border-[var(--line-paper)] space-y-3">
            <div className="text-xs font-mono font-semibold text-[var(--accent-default)]">
              02 • SMART ANALYSIS
            </div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Audio Peak & Scene Hunter
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Our analyzer measures momentary audio loudness bursts and fast-paced visual cuts. It automatically extracts the 3 highest-energy moments.
            </p>
            <div className="mt-4 p-3 bg-[var(--bg-subtle)] rounded-[4px] border border-[var(--line-paper)] text-[11px] font-mono text-[var(--accent-default)]">
              EBU R128 Loudness + Scene Cut Score (0% – 100%)
            </div>
          </div>

          <div className="card-paper p-6 bg-[var(--bg-card)] border border-[var(--line-paper)] space-y-3">
            <div className="text-xs font-mono font-semibold text-emerald-600">
              03 • READY TO POST
            </div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              9:16 Vertical HD Export
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Action stays centered while an ambient blurred background fills top and bottom. Exported as standard H.264 MP4 with custom cover thumbnails.
            </p>
            <div className="mt-4 p-3 bg-[var(--bg-subtle)] rounded-[4px] border border-[var(--line-paper)] text-[11px] font-mono text-emerald-600">
              Output: 1080x1920 Vertical HD • Clean Cover JPG
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. INTERACTIVE GENRE & NICHE CALIBRATOR                                */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full px-4 sm:px-6">
        <InteractiveNichesFilter />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. CORE BENEFITS (Why Creators Choose ClipLane)                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full max-w-5xl px-4 sm:px-6 text-left space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
            Built Different
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
            Why Creators Use ClipLane Over Generic Clippers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card-paper p-6 bg-[var(--bg-raised)] border border-[var(--line-paper)] space-y-3">
            <div className="text-2xl">⏳</div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Never Scrub Another 3-Hour Stream
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Don’t waste your evening re-watching VODs. Drop your video in, take a break or queue for the next match, and come back to your top 3 highlights scored, trimmed, and rendered.
            </p>
          </div>

          <div className="card-paper p-6 bg-[var(--bg-raised)] border border-[var(--line-paper)] space-y-3">
            <div className="text-2xl">✨</div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              True 1080x1920 HD (Zero Watermarks)
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Generic clipping apps slap ugly watermarks over your game or force you down to 720p. ClipLane gives you crisp 1080p full-res vertical video with 100% clean branding on every tier.
            </p>
          </div>

          <div className="card-paper p-6 bg-[var(--bg-raised)] border border-[var(--line-paper)] space-y-3">
            <div className="text-2xl">📱</div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Blurred Background Fill (No Black Bars)
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Widescreen gameplay looks terrible when squished into portrait mode. ClipLane generates a smooth, blurred ambient backdrop behind your action to fill the phone screen naturally.
            </p>
          </div>

          <div className="card-paper p-6 bg-[var(--bg-raised)] border border-[var(--line-paper)] space-y-3">
            <div className="text-2xl">⚡</div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Unlimited Free Lane or $2.99 Skip
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              No sneaky $30/month subscriptions. Process unlimited clips for free in our honest community queue, or jump straight to the front of the line for $2.99 when you need to post right now.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 6. INTERACTIVE COMPARISON MATRIX                                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full px-4 sm:px-6">
        <InteractiveComparisonMatrix />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 7. LIVE SPEED & QUEUE ESTIMATOR (Interactive Slider)                   */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full px-4 sm:px-6">
        <InteractiveQueueCalculator />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 8. DEAD-SIMPLE 3-STEP PROCESS BANNER                                   */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full max-w-5xl px-4 sm:px-6">
        <div className="panel-dark p-8 sm:p-12 text-left rounded-[8px] space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-hover)]">
              Effortless Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif text-white">
              Three Steps From Footage to Feed
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="font-mono text-2xl font-bold text-[var(--accent-hover)]">01</div>
              <h4 className="font-serif text-base text-white">Drop Your Footage</h4>
              <p className="text-xs text-[var(--text-panel-muted)] leading-relaxed">
                Drag & drop up to 500MB of gameplay, or paste a public video URL. Confirm rights with one click.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-2xl font-bold text-[var(--accent-hover)]">02</div>
              <h4 className="font-serif text-base text-white">We Find the Hype</h4>
              <p className="text-xs text-[var(--text-panel-muted)] leading-relaxed">
                Our automated pipeline scores audio peaks and action cuts to pinpoint your top 3 highlight moments.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-2xl font-bold text-[var(--accent-hover)]">03</div>
              <h4 className="font-serif text-base text-white">Download & Post</h4>
              <p className="text-xs text-[var(--text-panel-muted)] leading-relaxed">
                Preview your 9:16 vertical clip in our player and download with one click. Ready for TikTok, Reels, and Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 9. INTERACTIVE FAQ ACCORDION                                           */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full px-4 sm:px-6">
        <InteractiveFAQ />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 10. BOTTOM CALL TO ACTION BANNER                                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="w-full max-w-4xl px-4 sm:px-6">
        <div className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] p-8 sm:p-14 text-center space-y-6 rounded-[8px] shadow-sm">
          <h2 className="text-3xl sm:text-5xl font-serif text-[var(--text-primary)] tracking-tight">
            Ready to Post Your Best Plays?
          </h2>
          <p className="text-xs sm:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Upload your footage now and get your top 3 vertical highlights in minutes. No credit card required, unlimited free community queue.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link
              href="/dashboard"
              className="button-primary text-sm !px-8 !py-3.5 font-semibold shadow-md"
            >
              Start Clipping Free
            </Link>
            <Link
              href="/pricing"
              className="button-outline text-sm !px-6 !py-3.5 font-medium"
            >
              View Pricing & Lanes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
