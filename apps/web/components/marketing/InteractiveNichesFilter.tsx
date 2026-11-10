"use client";

import { useState } from "react";

interface Niche {
  id: string;
  name: string;
  icon: string;
  headline: string;
  detectionStrategy: string;
  typicalDuration: string;
  viralHook: string;
}

const NICHES: Niche[] = [
  {
    id: "fps",
    name: "Tactical Shooters",
    icon: "🎯",
    headline: "Aces, 1vX Clutch Plays & Reaction Screams",
    detectionStrategy: "FFmpeg audio analysis detects the sudden decibel spike of team comms screaming 'HE'S DEFUSING!' combined with rapid weapon fire and elimination killfeed visual cuts.",
    typicalDuration: "18 – 24 seconds",
    viralHook: "Start directly 2 seconds before the first kill; hook viewer in first 3 seconds.",
  },
  {
    id: "br",
    name: "Battle Royale",
    icon: "🪂",
    headline: "Final Circle Chaos & Squad Wipes",
    detectionStrategy: "Monitors sustained high-energy audio during chaotic final-zone firefights and rapid scene transitions as you rotate between enemies.",
    typicalDuration: "20 – 30 seconds",
    viralHook: "Keep center-crop centered on the reticle so mobile viewers can see every bullet connect.",
  },
  {
    id: "openworld",
    name: "Open-World Action",
    icon: "🏎️",
    headline: "High-Speed Chases, Explosions & Sandbox Stunts",
    detectionStrategy: "Identifies heavy bass explosions and sudden vehicle collision sound transients alongside high scene-change velocity across dynamic camera angles.",
    typicalDuration: "15 – 22 seconds",
    viralHook: "Blurred vertical backdrop gives depth to the environment without cutting off vehicle speedometer or mini-map.",
  },
  {
    id: "horror",
    name: "Horror & Survival",
    icon: "👻",
    headline: "Jump Scares, Panic Moments & Laughs",
    detectionStrategy: "Extreme mic saturation bursts (> -10 LUFS) trigger instant highlight captures. Catches genuine terror and hilarious creator reactions flawlessly.",
    typicalDuration: "15 – 20 seconds",
    viralHook: "Immediate audio jump keeps retention high on TikTok and YouTube Shorts algorithms.",
  },
  {
    id: "fighting",
    name: "Fighting & Speedrunning",
    icon: "🥊",
    headline: "Perfect Combos, Counter Hits & PB Runs",
    detectionStrategy: "Detects rapid flurry inputs, super move visual flashes, and sudden victory theme music surges.",
    typicalDuration: "15 – 25 seconds",
    viralHook: "High-frame-rate centered framing captures frame-perfect timing for technical gaming audiences.",
  },
];

export function InteractiveNichesFilter() {
  const [activeNiche, setActiveNiche] = useState<Niche>(NICHES[0]!);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Calibrated For Every Game
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Optimized Highlight Detection Across Genres
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          Different games have different peak moments. See how ClipLane’s detection algorithm adapts to what you play.
        </p>
      </div>

      <div className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] p-6 sm:p-8 rounded-[8px] space-y-6">
        {/* Genre Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[var(--line-paper)] pb-5">
          {NICHES.map((niche) => (
            <button
              key={niche.id}
              onClick={() => setActiveNiche(niche)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                activeNiche.id === niche.id
                  ? "bg-[var(--accent-default)] text-white shadow-xs font-semibold"
                  : "bg-[var(--bg-card)] border border-[var(--line-paper)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{niche.icon}</span>
              <span>{niche.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Niche Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase text-[var(--accent-default)] font-semibold">
                {activeNiche.name} Mode
              </span>
              <h3 className="font-serif text-2xl text-[var(--text-primary)] mt-1">
                {activeNiche.headline}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              {activeNiche.detectionStrategy}
            </p>

            <div className="p-4 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] space-y-2">
              <span className="text-[11px] font-mono uppercase text-[var(--accent-default)] font-bold block">
                💡 Creator Posting Strategy:
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                {activeNiche.viralHook}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div className="p-4 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                RECOMMENDED CLIP DURATION
              </span>
              <span className="text-xl font-serif font-bold text-[var(--text-primary)] block">
                {activeNiche.typicalDuration}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] block">
                Optimized for high viewer retention & completion rate
              </span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                EXPORT FORMATTING
              </span>
              <span className="text-xl font-serif font-bold text-emerald-600 block">
                1080x1920 (9:16)
              </span>
              <span className="text-[11px] text-[var(--text-muted)] block">
                Centered gameplay + ambient blurred fill
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
