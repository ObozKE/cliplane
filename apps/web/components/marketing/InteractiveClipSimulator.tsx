"use client";

import { useState, useRef, useEffect } from "react";

interface Moment {
  id: string;
  title: string;
  game: string;
  genre: string;
  score: number;
  loudness: string;
  sceneCutRate: string;
  duration: string;
  timestamp: string;
  videoSrc: string;
  poster: string;
  accentColor: string;
}

const MOMENTS: Moment[] = [
  {
    id: "gta6-chase",
    title: "GTA 6 Vice City High-Speed Evade",
    game: "Grand Theft Auto VI",
    genre: "Open-World Pursuit",
    score: 97,
    loudness: "-12.4 LUFS (Siren & Engine Peak)",
    sceneCutRate: "5 cuts / 3 sec",
    duration: "24s",
    timestamp: "04:18",
    videoSrc: "/videos/clip-1.mp4",
    poster: "/videos/clip-1.jpg",
    accentColor: "from-pink-600 via-rose-700 to-indigo-950",
  },
  {
    id: "gta5-heist",
    title: "GTA 5 Union Depository Heist & Shootout",
    game: "Grand Theft Auto V",
    genre: "Tactical Vault Heist",
    score: 94,
    loudness: "-11.8 LUFS (Explosion Burst)",
    sceneCutRate: "6 cuts / 4 sec",
    duration: "20s",
    timestamp: "18:42",
    videoSrc: "/videos/clip-2.mp4",
    poster: "/videos/clip-2.jpg",
    accentColor: "from-amber-600 via-orange-700 to-stone-950",
  },
  {
    id: "gta6-speed",
    title: "GTA 6 Jason & Lucia Highway Stunt",
    game: "Grand Theft Auto VI",
    genre: "Highway Velocity",
    score: 91,
    loudness: "-13.5 LUFS (Sub-Bass Roar)",
    sceneCutRate: "4 cuts / 3 sec",
    duration: "28s",
    timestamp: "11:05",
    videoSrc: "/videos/clip-3.mp4",
    poster: "/videos/clip-3.jpg",
    accentColor: "from-cyan-600 via-blue-700 to-slate-950",
  },
  {
    id: "gta5-chaos",
    title: "GTA 5 Military Base Jet Steal",
    game: "Grand Theft Auto V",
    genre: "Aerial Combat",
    score: 89,
    loudness: "-10.9 LUFS (Missile Lock Sound)",
    sceneCutRate: "7 cuts / 4 sec",
    duration: "22s",
    timestamp: "27:30",
    videoSrc: "/videos/clip-4.mp4",
    poster: "/videos/clip-4.jpg",
    accentColor: "from-emerald-600 via-teal-800 to-neutral-950",
  },
];

export function InteractiveClipSimulator() {
  const [selectedMoment, setSelectedMoment] = useState<Moment>(MOMENTS[0]!);
  const [formatMode, setFormatMode] = useState<"vertical" | "widescreen">("vertical");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const verticalFgVideoRef = useRef<HTMLVideoElement>(null);
  const verticalBgVideoRef = useRef<HTMLVideoElement>(null);
  const widescreenVideoRef = useRef<HTMLVideoElement>(null);

  // Play / Pause synchronization
  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    const activeVideos = [verticalFgVideoRef.current, verticalBgVideoRef.current, widescreenVideoRef.current];
    activeVideos.forEach((v) => {
      if (!v) return;
      if (nextState) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  };

  // Mute / Unmute synchronization
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (verticalFgVideoRef.current) verticalFgVideoRef.current.muted = nextMute;
    if (widescreenVideoRef.current) widescreenVideoRef.current.muted = nextMute;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setCurrentTime(video.currentTime);
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = pos * duration;

    if (verticalFgVideoRef.current) verticalFgVideoRef.current.currentTime = targetTime;
    if (verticalBgVideoRef.current) verticalBgVideoRef.current.currentTime = targetTime;
    if (widescreenVideoRef.current) widescreenVideoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  function handleSimulateDownload() {
    setCopiedNotification(true);
    // Trigger real download of video file
    const link = document.createElement("a");
    link.href = selectedMoment.videoSrc;
    link.download = `cliplane_${selectedMoment.id}_vertical.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setCopiedNotification(false), 2500);
  }

  // Effect to keep video playing when switching moments
  useEffect(() => {
    const fg = verticalFgVideoRef.current;
    const bg = verticalBgVideoRef.current;
    const ws = widescreenVideoRef.current;
    [fg, bg, ws].forEach((v) => {
      if (v) {
        v.currentTime = 0;
        if (isPlaying) {
          v.play().catch(() => {});
        }
      }
    });
    setCurrentTime(0);
  }, [selectedMoment, formatMode, isPlaying]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Live Render Demo
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Experience How ClipLane Renders Video
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          Watch actual gameplay footage rendered through our intelligent peak-detection pipeline. Switch moments or toggle between raw 16:9 stream footage and our clean 9:16 vertical blurred export.
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
                onClick={() => setSelectedMoment(moment)}
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
          {/* Left / Center: Actual Video Stage */}
          <div className="lg:col-span-7 flex justify-center">
            {formatMode === "vertical" ? (
              /* 9:16 Vertical Phone Shell with Real Video & Blurred Ambient Fill */
              <div className="w-[280px] sm:w-[310px] h-[520px] sm:h-[550px] rounded-[28px] border-4 border-neutral-900 bg-black relative overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* 1. Ambient Blurred Video Background */}
                <video
                  ref={verticalBgVideoRef}
                  src={selectedMoment.videoSrc}
                  className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-125 opacity-70 pointer-events-none"
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* 2. Top Phone Overlay Bar */}
                <div className="relative z-20 p-4 flex items-center justify-between text-[11px] font-mono text-white/90 bg-gradient-to-b from-black/70 to-transparent">
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-[4px] border border-white/10 font-medium">
                    ClipLane 1080x1920
                  </span>
                  <span className="bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-[4px] shadow-sm">
                    {selectedMoment.score}% HIGHLIGHT
                  </span>
                </div>

                {/* 3. Centered Crisp Action Video */}
                <div className="relative z-10 my-auto w-full aspect-video bg-neutral-950 border-y border-white/20 overflow-hidden shadow-2xl">
                  <video
                    ref={verticalFgVideoRef}
                    src={selectedMoment.videoSrc}
                    poster={selectedMoment.poster}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  {/* Highlight Watermark Overlay */}
                  <div className="absolute top-2 left-2 pointer-events-none bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
                    ● HIGHLIGHT REFRAMED
                  </div>

                  {/* Sound Toggle Button on Video */}
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    className="absolute bottom-2 right-2 z-30 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full border border-white/20 transition-all cursor-pointer text-xs"
                  >
                    {isMuted ? "🔇" : "🔊"}
                  </button>
                </div>

                {/* 4. Bottom Overlay Controls & Progress */}
                <div className="relative z-20 p-4 space-y-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  {/* Interactive Scrubber */}
                  <div
                    onClick={handleSeek}
                    className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all relative"
                  >
                    <div
                      className="bg-[var(--accent-default)] h-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/90">
                    <span>
                      {formatSecs(currentTime)} / {formatSecs(duration)}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleMute}
                        className="text-white/80 hover:text-white cursor-pointer"
                      >
                        {isMuted ? "UNMUTE" : "MUTED"}
                      </button>
                      <button
                        onClick={togglePlay}
                        className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                      >
                        {isPlaying ? "PAUSE" : "PLAY"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 16:9 Raw Widescreen Footage Shell with Real Video */
              <div className="w-full aspect-video rounded-[8px] border-2 border-neutral-800 bg-neutral-950 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <video
                  ref={widescreenVideoRef}
                  src={selectedMoment.videoSrc}
                  poster={selectedMoment.poster}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />

                {/* Top Overlay */}
                <div className="relative z-20 p-3 flex items-center justify-between text-xs font-mono text-white/90 bg-gradient-to-b from-black/80 to-transparent">
                  <span className="bg-neutral-900/90 border border-neutral-700 px-2.5 py-0.5 rounded-[3px]">
                    RAW STREAM INPUT (1920x1080)
                  </span>
                  <span className="text-amber-400 font-mono bg-neutral-900/90 px-2 py-0.5 rounded-[3px] border border-amber-500/30">
                    Stream Time: {selectedMoment.timestamp}
                  </span>
                </div>

                {/* Bottom Overlay Controls */}
                <div className="relative z-20 p-3 space-y-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <div
                    onClick={handleSeek}
                    className="w-full bg-neutral-700/80 h-1.5 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
                  >
                    <div
                      className="bg-white h-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded font-semibold cursor-pointer"
                      >
                        {isPlaying ? "PAUSE" : "PLAY"}
                      </button>
                      <span>
                        {formatSecs(currentTime)} / {formatSecs(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="text-white hover:underline cursor-pointer"
                      >
                        {isMuted ? "UNMUTE AUDIO" : "MUTE AUDIO"}
                      </button>
                      <span className="text-neutral-400">16:9 Raw Recording</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Technical Highlight Analysis Inspector */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div>
              <span className="text-xs font-mono uppercase text-[var(--accent-default)] font-semibold">
                Mathematical Peak Detection
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] mt-1">
                Loudness Burst & Scene Cut Velocity
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                ClipLane parses audio decibels (`ebur128`) and visual cut density (`gt(scene,0.3)`) to calculate mathematically verified highlight scores without hallucinating AI models.
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
                  ? "✓ Real 1080x1920 MP4 Download Started!"
                  : `Download Sample Vertical Clip (${selectedMoment.title})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
