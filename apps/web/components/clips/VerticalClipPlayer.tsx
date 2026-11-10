"use client";

import { useRef, useState, useEffect } from "react";
import { getClipDownloadUrlAction } from "@/app/jobs/actions";
import { ReportClipModal } from "./ReportClipModal";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Video playback listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setTotalDuration(video.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
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
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);

    const result = await getClipDownloadUrlAction(clip.id);
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

  return (
    <div className="card-paper bg-[var(--bg-card)] p-4 sm:p-5 flex flex-col justify-between space-y-4">
      {/* 9:16 Vertical Video Container */}
      <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto rounded-[4px] overflow-hidden bg-[var(--bg-panel)] shadow-sm group">
        {clip.videoUrl ? (
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
        {clip.videoUrl && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs hover:scale-105 transition-transform"
            aria-label="Play video"
          >
            ▶
          </button>
        )}

        {/* Video Scrubber & Bottom Controls Bar */}
        {clip.videoUrl && (
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

              <div className="flex items-center gap-2.5">
                <button
                  onClick={toggleMute}
                  className="hover:text-white"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-white"
                  aria-label="Toggle Fullscreen"
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

      {/* Clip Metadata & Actions */}
      <div className="space-y-2.5">
        <div>
          <h4 className="font-serif text-base font-normal text-[var(--text-primary)] leading-snug">
            {clip.title}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {Math.round(clip.duration)}s vertical cut • {clip.startTime.toFixed(1)}s to {clip.endTime.toFixed(1)}s
          </p>
        </div>

        {downloadError && (
          <p className="text-[11px] text-red-600">{downloadError}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[var(--line-paper)]">
          <button
            onClick={handleDownload}
            disabled={isDownloading || !clip.videoUrl}
            className="button-primary text-xs !py-1.5 !px-3 flex items-center gap-1.5"
          >
            <span>↓</span>
            <span>{isDownloading ? "Preparing..." : "Download (9:16)"}</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="text-[11px] text-[var(--text-muted)] hover:text-red-700 transition-colors"
          >
            Report
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportClipModal
        clipId={clip.id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
