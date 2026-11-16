"use client";

import { useRef, useState, useEffect } from "react";
import {
  getClipDownloadUrlAction,
  type ClipDownloadFormat,
} from "@/app/jobs/actions";
import { ReportClipModal } from "./ReportClipModal";
import { SocialUploadModal } from "./SocialUploadModal";

export interface ClipProps {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export function VerticalClipPlayer({ clip }: { clip: ClipProps }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(clip.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ClipDownloadFormat>("9:16");

  // Video playback listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setTotalDuration(video.duration);
      }
      video.muted = isMuted;
      video.volume = volume;
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [isMuted, volume]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
      videoRef.current.play().catch(() => {
        // Fallback for browsers that block unmuted autoplay
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const targetTime = parseFloat(e.target.value);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && (volume === 0 || videoRef.current.volume === 0)) {
      videoRef.current.volume = 1;
      setVolume(1);
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const isZero = val === 0;
      videoRef.current.muted = isZero;
      setIsMuted(isZero);
    }
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }

  async function handleDownload(formatToDownload: ClipDownloadFormat = selectedFormat) {
    setIsDownloading(true);
    setDownloadError(null);

    const result = await getClipDownloadUrlAction(clip.id, formatToDownload);
    setIsDownloading(false);

    if (result.success) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setDownloadError(result.error);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const highlightPercentage = Math.round((clip.score || 0) * 100);

  // Dynamic container framing according to selected aspect ratio
  const containerClass =
    selectedFormat === "1:1"
      ? "aspect-square max-w-[300px]"
      : selectedFormat === "16:9"
      ? "aspect-video max-w-[340px]"
      : selectedFormat === "4:5"
      ? "aspect-[4/5] max-w-[280px]"
      : "aspect-[9/16] max-w-[280px]";

  const formatLabels: Record<ClipDownloadFormat, { name: string; tag: string }> = {
    "9:16": { name: "Vertical (9:16)", tag: "TikTok / Reels / Shorts" },
    "1:1": { name: "Square (1:1)", tag: "Instagram Feed / X" },
    "16:9": { name: "Landscape (16:9)", tag: "YouTube / Discord" },
    "4:5": { name: "Portrait (4:5)", tag: "Facebook / IG Feed" },
    audio: { name: "Audio (MP3)", tag: "Soundbite / Podcast" },
  };

  return (
    <div className="card-paper bg-[var(--bg-card)] p-4 sm:p-5 flex flex-col justify-between space-y-4">
      {/* Format Selector Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Select Format</span>
          <span className="font-mono text-[10px] text-[var(--accent-default)]">
            {formatLabels[selectedFormat].tag}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg border border-[var(--line-paper)] text-[10px] font-semibold text-center">
          {(["9:16", "1:1", "16:9", "4:5", "audio"] as ClipDownloadFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`py-1 rounded transition-colors ${
                selectedFormat === fmt
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {fmt === "audio" ? "MP3" : fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Video Container with Dynamic Framing */}
      <div
        className={`relative ${containerClass} w-full mx-auto rounded-[6px] overflow-hidden bg-[var(--bg-panel)] shadow-sm group transition-all duration-300`}
      >
        {selectedFormat === "audio" ? (
          <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 to-black text-white space-y-3">
            <span className="text-4xl animate-bounce">🎙️</span>
            <div>
              <p className="font-bold text-sm">Podcast &amp; Speech Master</p>
              <p className="text-[11px] text-neutral-400 mt-1">High-bitrate dialogue extract</p>
            </div>
            {clip.videoUrl && (
              <audio controls src={clip.videoUrl} className="w-full max-w-[240px] mt-2 h-8" />
            )}
          </div>
        ) : clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl || undefined}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-[var(--text-panel-muted)]">
            <span className="text-xl mb-1">🎬</span>
            Media expired or unavailable.
          </div>
        )}

        {/* Big Center Play Overlay Button */}
        {selectedFormat !== "audio" && clip.videoUrl && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs hover:scale-105 transition-transform"
            aria-label="Play video"
          >
            ▶
          </button>
        )}

        {/* Video Scrubber & Bottom Controls Bar */}
        {selectedFormat !== "audio" && clip.videoUrl && (
          <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            {/* Scrubber */}
            <input
              type="range"
              min="0"
              max={totalDuration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[var(--accent-default)]"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-white/90">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="hover:text-white"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </button>
                <span>
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Volume slider & mute button */}
                <div className="flex items-center gap-1 group/vol">
                  <button
                    onClick={toggleMute}
                    className="hover:text-white p-0.5 cursor-pointer"
                    aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                    title={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-12 sm:w-16 h-1 bg-white/40 rounded appearance-none cursor-pointer accent-[var(--accent-default)] opacity-75 group-hover/vol:opacity-100 transition-opacity"
                    aria-label="Volume control"
                    title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  />
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-white p-0.5 cursor-pointer ml-1"
                  aria-label="Toggle Fullscreen"
                  title="Fullscreen"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Highlight Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="rounded-[2px] bg-[var(--accent-default)] text-[var(--accent-on)] text-[10px] font-mono font-semibold px-2 py-0.5 shadow-xs">
            Highlight: {highlightPercentage}%
          </span>
        </div>
      </div>

      {/* Adaptive Sound Design Badge */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
        <span className="text-xs">🔊</span>
        <span className="leading-tight">
          <strong>Dynamic Sound Effects Included:</strong> Sub-bass punch &amp; vocal stinger mixed in.
        </span>
      </div>

      {/* Clip Metadata & Actions */}
      <div className="space-y-2.5">
        <div>
          <h4 className="font-serif text-base font-normal text-[var(--text-primary)] leading-snug">
            {clip.title}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {Math.round(clip.duration)}s highlight • {clip.startTime.toFixed(1)}s to {clip.endTime.toFixed(1)}s
          </p>
        </div>

        {downloadError && (
          <p className="text-[11px] text-red-600">{downloadError}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line-paper)]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsSocialModalOpen(true)}
              disabled={!clip.videoUrl}
              className="px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-[var(--accent-default)] text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Upload directly to TikTok, YouTube Shorts, Reels, and X"
            >
              <span>🚀</span>
              <span>Post to Socials</span>
            </button>

            <button
              onClick={() => handleDownload(selectedFormat)}
              disabled={isDownloading || !clip.videoUrl}
              className="button-secondary text-xs !py-1.5 !px-2.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>↓</span>
              <span>
                {isDownloading
                  ? "Preparing..."
                  : `Download (${formatLabels[selectedFormat].name})`}
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="text-[11px] text-[var(--text-muted)] hover:text-red-700 transition-colors p-1"
          >
            Report
          </button>
        </div>
      </div>

      {/* Direct Social Media Upload Studio Modal */}
      <SocialUploadModal
        clipId={clip.id}
        clipTitle={clip.title}
        videoUrl={clip.videoUrl}
        thumbnailUrl={clip.thumbnailUrl}
        score={clip.score}
        duration={clip.duration}
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
      />

      {/* Report Modal */}
      <ReportClipModal
        clipId={clip.id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
