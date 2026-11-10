"use client";

import { useState, useEffect } from "react";

interface Moment {
  id: string;
  title: string;
  genre: string;
  score: number;
  loudness: string;
  sceneCutRate: string;
  duration: string;
  timestamp: string;
  accentColor: string;
}

const MOMENTS: Moment[] = [
  {
    id: "clutch",
    title: "1v4 Pistol Clutch Defuse",
    genre: "Tactical Shooter",
    score: 96,
    loudness: "-12.8 LUFS (Peak Burst)",
    sceneCutRate: "4 cuts / 3 sec",
    duration: "24s",
    timestamp: "14:32",
    accentColor: "from-blue-600 to-indigo-900",
  },
  {
    id: "stunt",
    title: "Helicopter RPG Barrel Roll",
    genre: "Open-World Chaos",
    score: 91,
    loudness: "-14.2 LUFS (Explosion Peak)",
    sceneCutRate: "7 cuts / 4 sec",
    duration: "20s",
    timestamp: "28:15",
    accentColor: "from-amber-600 to-rose-900",
  },
  {
    id: "scream",
    title: "Squad Wipe & Victory Screams",
    genre: "Battle Royale",
    score: 87,
    loudness: "-11.4 LUFS (Mic Saturation)",
    sceneCutRate: "5 cuts / 3 sec",
    duration: "28s",
    timestamp: "09:44",
    accentColor: "from-emerald-600 to-teal-900",
  },
];

export function InteractiveClipSimulator() {
  const [selectedMoment, setSelectedMoment] = useState<Moment>(MOMENTS[0]!);
  const [formatMode, setFormatMode] = useState<"vertical" | "widescreen">("vertical");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  function handleSimulateDownload() {
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Interactive Demo
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Experience How ClipLane Renders Video
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          Test our intelligent peak-detection engine. Switch moments or toggle between raw 16:9 stream footage and our clean 9:16 vertical blurred export.
        </p>
      </div>

      {/* Simulator Workspace Card */}
      <div className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] p-6 sm:p-8 rounded-[8px] shadow-sm space-y-6">
        {/* Top Controls: Moment Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line-paper)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-[var(--text-muted)] mr-1">
              Sample Highlights:
            </span>
            {MOMENTS.map((moment) => (
              <button
                key={moment.id}
                onClick={() => {
                  setSelectedMoment(moment);
                  setProgress(20);
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                  selectedMoment.id === moment.id
                    ? "bg-[var(--accent-default)] text-white shadow-xs"
                    : "bg-[var(--bg-card)] border border-[var(--line-paper)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {moment.title}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Toggle */}
          <div className="flex items-center gap-1 rounded-[4px] bg-[var(--bg-card)] p-1 border border-[var(--line-paper)] text-xs">
            <button
              onClick={() => setFormatMode("vertical")}
              className={`px-3 py-1 rounded-[2px] font-medium transition-all cursor-pointer ${
                formatMode === "vertical"
                  ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-2xs font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              📱 9:16 Vertical (Export)
            </button>
            <button
              onClick={() => setFormatMode("widescreen")}
              className={`px-3 py-1 rounded-[2px] font-medium transition-all cursor-pointer ${
                formatMode === "widescreen"
                  ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-2xs font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              🖥️ 16:9 Raw Stream
            </button>
          </div>
        </div>

        {/* Main Stage: Player Preview & Detection Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Center: Simulated Video Stage */}
          <div className="lg:col-span-7 flex justify-center">
            {formatMode === "vertical" ? (
              /* 9:16 Vertical Phone Shell with Blurred Background Fill */
              <div className="w-[260px] sm:w-[280px] h-[480px] sm:h-[500px] rounded-[24px] border-4 border-neutral-900 bg-black relative overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* 1. Ambient Blurred Background Fill */}
                <div
                  className={`absolute inset-0 bg-gradient-to-tr ${selectedMoment.accentColor} opacity-70 filter blur-xl scale-125 transform`}
                />

                {/* 2. Centered Crisp 16:9 Action Inset */}
                <div className="relative z-10 my-auto w-full aspect-video bg-neutral-950 border-y border-white/20 overflow-hidden flex flex-col items-center justify-center shadow-lg">
                  <div className="text-center p-3">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">
                      ● LIVE CLIP EXTRACTION ({selectedMoment.timestamp})
                    </span>
                    <p className="text-xs font-semibold text-white">
                      {selectedMoment.title}
                    </p>
                    <span className="text-[10px] text-white/60 block mt-0.5">
                      Centered action • Ambient blurred fill
                    </span>
                  </div>

                  {/* Dynamic Crosshair Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                    <div className="w-12 h-12 border border-white/60 rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Top Phone Overlay Bar */}
                <div className="relative z-10 p-4 flex items-center justify-between text-[11px] font-mono text-white/90">
                  <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-[4px] border border-white/10">
                    ClipLane 1080x1920
                  </span>
                  <span className="bg-emerald-500/80 text-white font-bold px-2 py-0.5 rounded-[4px]">
                    {selectedMoment.score}% HIGHLIGHT
                  </span>
                </div>

                {/* Bottom Overlay Controls & Progress */}
                <div className="relative z-10 p-4 space-y-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--accent-default)] h-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                    <span>00:{Math.floor((progress / 100) * 24).toString().padStart(2, "0")} / {selectedMoment.duration}</span>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:underline cursor-pointer"
                    >
                      {isPlaying ? "PAUSE" : "PLAY"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 16:9 Raw Widescreen Footage Shell */
              <div className="w-full aspect-video rounded-[8px] border-2 border-neutral-800 bg-neutral-950 relative overflow-hidden shadow-lg flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-xs font-mono text-white/80">
                  <span className="bg-neutral-800/80 px-2 py-0.5 rounded-[2px]">
                    RAW STREAM INPUT (1920x1080)
                  </span>
                  <span className="text-amber-400 font-mono">
                    Time: {selectedMoment.timestamp}
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-4xl">🎮</div>
                  <h4 className="text-sm font-semibold text-white">
                    {selectedMoment.title}
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Standard horizontal gameplay before vertical reframing
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-neutral-400 h-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Playing raw recording</span>
                    <span>16:9 Widescreen</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Technical Highlight Analysis Inspector */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div>
              <span className="text-xs font-mono uppercase text-[var(--accent-default)] font-semibold">
                AI-Free Detection Engine
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] mt-1">
                Loudness Burst & Scene Metrics
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                ClipLane parses audio decibels (`ebur128`) and visual cut density (`gt(scene,0.3)`) to calculate mathematically verified highlight scores.
              </p>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="space-y-2.5">
              <div className="p-3 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block font-mono">
                    CALCULATED HIGHLIGHT SCORE
                  </span>
                  <strong className="text-base text-[var(--text-primary)] font-serif">
                    {selectedMoment.score}% Score (Rank #1)
                  </strong>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  A+
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block font-mono">
                    AUDIO ENERGY (EBU R128)
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {selectedMoment.loudness}
                  </span>
                </div>
                <span className="text-xs text-[var(--accent-default)] font-mono font-medium">
                  Triggered
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block font-mono">
                    SCENE CUT ACCELERATION
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {selectedMoment.sceneCutRate}
                  </span>
                </div>
                <span className="text-xs text-emerald-600 font-mono font-medium">
                  Verified
                </span>
              </div>
            </div>

            {/* Interactive Audio Waveform Simulation */}
            <div className="p-3.5 bg-[var(--bg-card)] rounded-[4px] border border-[var(--line-paper)] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>MOMENTARY LOUDNESS PEAKS</span>
                <span className="text-emerald-600 font-semibold">CLIP CAPTURED HERE</span>
              </div>
              <div className="flex items-end gap-1 h-8 pt-1">
                {[35, 42, 38, 55, 48, 62, 70, 85, 98, 92, 88, 75, 60, 45, 30, 42, 68, 95, 82, 50].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-[1px] transition-all duration-300 ${
                      i >= 6 && i <= 12
                        ? "bg-[var(--accent-default)]"
                        : "bg-[var(--line-paper)]"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleSimulateDownload}
                className="button-primary text-xs !py-3 w-full font-medium cursor-pointer"
              >
                {copiedNotification
                  ? "✓ Sample 1080x1920 MP4 Download Initiated!"
                  : "Download Sample Vertical Clip (1080x1920)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
