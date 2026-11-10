"use client";

import { useEffect, useRef, useState } from "react";

export function HeroCinematicBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted by low-power mode or browser policies
        setIsPlaying(false);
      });
    }
  }, []);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden select-none pointer-events-none">
      {/* Background Video */}
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/videos/hero-poster.jpg"
          onError={() => setHasError(true)}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30 transform scale-105 filter saturate-125"
        >
          <source src="/videos/hero-cinematic.mp4" type="video/mp4" />
        </video>
      ) : (
        /* Ambient dynamic gradient fallback if video format not supported */
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#1d1f26]/40 to-transparent" />
      )}

      {/* Cyber Grid & Atmospheric Glow */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Dark Gradient Vignette for 100% Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#17191e]/85 via-[#1d1f26]/75 to-[var(--bg-paper)]" />

      {/* Subtle Interactive Ambient Control Pill in corner */}
      <div className="absolute bottom-6 right-6 pointer-events-auto z-10 hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-mono text-white/70 shadow-sm hover:border-white/20 transition-all">
        <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`} />
        <span>CINEMATIC ENGINE</span>
        <button
          onClick={togglePlay}
          className="text-white/60 hover:text-white underline ml-1 cursor-pointer"
          title={isPlaying ? "Pause cinematic background" : "Play cinematic background"}
        >
          {isPlaying ? "pause" : "play"}
        </button>
      </div>
    </div>
  );
}
