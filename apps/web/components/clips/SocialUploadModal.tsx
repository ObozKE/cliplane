"use client";

import { useState, useEffect } from "react";
import {
  publishClipToSocialAction,
  type ClipDownloadFormat,
  type PublishClipToSocialResult,
} from "@/app/jobs/actions";
import type { SocialPlatform } from "@cliplane/shared";

export interface SocialUploadModalProps {
  clipId: string;
  clipTitle: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  score: number;
  duration: number;
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  tag: string;
  icon: string;
  idealFormat: ClipDownloadFormat;
  maxChars: number;
  studioName: string;
  color: string;
  defaultTags: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "tiktok",
    name: "TikTok",
    tag: "9:16 Vertical Highlight",
    icon: "🎵",
    idealFormat: "9:16",
    maxChars: 2200,
    studioName: "TikTok Creator Center",
    color: "from-neutral-900 to-black hover:border-pink-500",
    defaultTags: ["#ClipLane", "#FYP", "#ForYou", "#Viral", "#GamingClips"],
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    tag: "9:16 Vertical Shorts",
    icon: "▶️",
    idealFormat: "9:16",
    maxChars: 100,
    studioName: "YouTube Studio Upload",
    color: "from-red-950 to-neutral-950 hover:border-red-500",
    defaultTags: ["#Shorts", "#YouTubeShorts", "#Viral", "#ClipLane"],
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels",
    tag: "9:16 Reels / Explore",
    icon: "📸",
    idealFormat: "9:16",
    maxChars: 2200,
    studioName: "Instagram Reels Studio",
    color: "from-pink-950 via-purple-950 to-neutral-950 hover:border-purple-500",
    defaultTags: ["#Reels", "#ExplorePage", "#Trending", "#ClipLane"],
  },
  {
    id: "x_twitter",
    name: "X (Twitter)",
    tag: "1:1 Square / Timeline",
    icon: "𝕏",
    idealFormat: "1:1",
    maxChars: 280,
    studioName: "X Video Composer",
    color: "from-neutral-900 to-neutral-950 hover:border-blue-400",
    defaultTags: ["#ClipLane", "#Highlight"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    tag: "1:1 Square / Professional",
    icon: "💼",
    idealFormat: "1:1",
    maxChars: 3000,
    studioName: "LinkedIn Video Post",
    color: "from-blue-950 to-neutral-950 hover:border-blue-500",
    defaultTags: ["#VideoContent", "#ContentCreation", "#AI", "#ClipLane"],
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    tag: "9:16 Meta Creator",
    icon: "👥",
    idealFormat: "9:16",
    maxChars: 2000,
    studioName: "Meta Creator Studio",
    color: "from-indigo-950 to-neutral-950 hover:border-indigo-400",
    defaultTags: ["#Reels", "#FacebookReels", "#ClipLane"],
  },
  {
    id: "webhook",
    name: "Webhook / API",
    tag: "Ayrshare / Buffer / Zapier",
    icon: "⚡",
    idealFormat: "9:16",
    maxChars: 5000,
    studioName: "Direct Webhook Dispatch",
    color: "from-emerald-950 to-neutral-950 hover:border-emerald-500",
    defaultTags: ["#Automated", "#ClipLane"],
  },
];

export function SocialUploadModal({
  clipId,
  clipTitle,
  videoUrl,
  thumbnailUrl,
  score,
  duration,
  isOpen,
  onClose,
}: SocialUploadModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("tiktok");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSharingDevice, setIsSharingDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishClipToSocialResult | null>(null);
  const [canDeviceShare, setCanDeviceShare] = useState(false);

  const activePlatform = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0]!;

  // Check Web Share API capability
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && "share" in navigator) {
      setCanDeviceShare(true);
    }
  }, []);

  // Initialize or re-populate caption when switching platforms
  useEffect(() => {
    const scorePct = Math.round((score || 0) * 100);
    const platformTags = activePlatform.defaultTags;
    setHashtags(platformTags);

    if (activePlatform.id === "youtube_shorts") {
      setCaption(`${clipTitle} 🔥 (${scorePct}% Peak Moment)`);
    } else if (activePlatform.id === "x_twitter") {
      setCaption(`Can't believe this moment happened live 🤯 Top ${Math.round(duration)}s highlight clipped with @ClipLane (${scorePct}% peak score)`);
    } else if (activePlatform.id === "linkedin") {
      setCaption(`Excited to share this video breakdown. Using AI and automated audio burst detection with ClipLane to surface high-engagement key moments from full streams.`);
    } else {
      setCaption(`Wait for the drop 🤯 ${clipTitle} — clipped automatically with @ClipLane! (${scorePct}% highlight score)`);
    }
  }, [selectedPlatform, clipTitle, score, duration, activePlatform]);

  if (!isOpen) return null;

  const fullText = `${caption}\n\n${hashtags.join(" ")}`;
  const charsRemaining = activePlatform.maxChars - fullText.length;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setErrorMsg("Could not access clipboard. Please copy manually.");
    }
  }

  // 1. One-Tap Device Share (Web Share API Level 2 with Blob file)
  async function handleDeviceShare() {
    if (!videoUrl) {
      setErrorMsg("Video source unavailable for device share.");
      return;
    }

    setIsSharingDevice(true);
    setErrorMsg(null);

    try {
      // Fetch media blob
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Could not fetch clip video");
      const blob = await response.blob();

      const filename = `cliplane_${clipId.slice(0, 8)}_${activePlatform.id}.mp4`;
      const file = new File([blob], filename, { type: "video/mp4" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: clipTitle,
          text: fullText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: clipTitle,
          text: fullText,
          url: videoUrl,
        });
      } else {
        throw new Error("Web Share is not supported on this browser.");
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(`Device share failed: ${msg}. Try opening Studio upload directly.`);
      }
    } finally {
      setIsSharingDevice(false);
    }
  }

  // 2. Direct Studio Upload Intent or Webhook Post
  async function handleDirectStudioUpload() {
    setIsSubmitting(true);
    setErrorMsg(null);

    // Copy caption automatically for user convenience
    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Non-fatal if clipboard is blocked
    }

    const res = await publishClipToSocialAction({
      clipId,
      platform: selectedPlatform,
      customCaption: caption,
      customHashtags: hashtags,
      format: activePlatform.idealFormat,
      webhookUrl: selectedPlatform === "webhook" ? webhookUrl : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setPublishResult(res.data);
      if (selectedPlatform !== "webhook") {
        // Open platform Studio / Upload portal in a new tab
        window.open(res.data.studioUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      setErrorMsg(res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl card-paper bg-[var(--bg-raised)] p-5 sm:p-7 space-y-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 border border-[var(--line-paper)] rounded-xl">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between border-b border-[var(--line-paper)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)]">
                Direct Social Media Upload
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Post highlights directly to TikTok, YouTube Shorts, Reels, and X with 1-click.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Clip Preview Strip */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--line-paper)]">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={clipTitle}
              className="w-12 h-16 object-cover rounded bg-neutral-900 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-16 rounded bg-neutral-900 flex items-center justify-center text-xl flex-shrink-0">
              🎬
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {clipTitle}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {Math.round(duration)}s highlight • {Math.round((score || 0) * 100)}% algorithm score
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-[4px] bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-900 font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Platform Selector Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            1. Select Target Social Platform
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(platform.id);
                    setPublishResult(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[var(--accent-default)] bg-black text-white dark:bg-white dark:text-black shadow-md ring-1 ring-[var(--accent-default)]"
                      : "border-[var(--line-paper)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-default)]/60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{platform.icon}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                          : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {platform.idealFormat}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold block leading-tight">{platform.name}</span>
                    <span
                      className={`text-[10px] block mt-0.5 truncate ${
                        isSelected ? "opacity-80" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {platform.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Webhook Configuration Field (When Webhook Selected) */}
        {selectedPlatform === "webhook" && (
          <div className="space-y-1.5 p-3.5 rounded-lg bg-[var(--bg-card)] border border-[var(--line-paper)]">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              Automated Social Publisher Webhook URL (Make, Zapier, Ayrshare, Buffer, n8n)
            </label>
            <input
              type="url"
              placeholder="https://hook.eu2.make.com/your-endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full text-xs p-2 rounded border border-[var(--line-paper)] bg-[var(--bg-raised)] font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-default)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              ClipLane will POST the high-definition signed video URL, thumbnail, caption, and metadata payload directly to your automation workflow.
            </p>
          </div>
        )}

        {/* Viral Caption & Hashtags Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              2. Viral Caption &amp; Hashtags ({activePlatform.name})
            </label>
            <span
              className={`text-[10px] font-mono ${
                charsRemaining < 0
                  ? "text-red-600 font-bold"
                  : charsRemaining < 20
                  ? "text-amber-600 font-semibold"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {charsRemaining} chars remaining
            </span>
          </div>

          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a catchy hook for this clip..."
            className="w-full text-xs p-2.5 rounded-lg border border-[var(--line-paper)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-default)] resize-none"
          />

          {/* Hashtag Editor Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[var(--text-muted)] mr-1">Hashtags:</span>
            {hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--line-paper)] text-[var(--text-primary)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setHashtags(hashtags.filter((_, i) => i !== idx))}
                  className="hover:text-red-600 ml-0.5 text-xs font-bold leading-none cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                const tag = prompt("Enter hashtag (e.g. #fyp or #gaming):");
                if (tag) {
                  const formatted = tag.startsWith("#") ? tag : `#${tag}`;
                  if (!hashtags.includes(formatted)) {
                    setHashtags([...hashtags, formatted]);
                  }
                }
              }}
              className="text-[10px] font-semibold text-[var(--accent-default)] hover:underline ml-1 cursor-pointer"
            >
              + Add Tag
            </button>
          </div>
        </div>

        {/* Publishing Actions & Native Share Buttons */}
        <div className="pt-3 border-t border-[var(--line-paper)] space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="button-secondary text-xs !py-2 !px-3.5 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isCopied ? "✓" : "📋"}</span>
              <span>{isCopied ? "Caption Copied!" : "Copy Caption & Tags"}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* One-Tap Native Device Share (Opens TikTok / IG / YT app on phone / supported desktop) */}
              {canDeviceShare && selectedPlatform !== "webhook" && (
                <button
                  type="button"
                  disabled={isSharingDevice}
                  onClick={handleDeviceShare}
                  className="px-3.5 py-2 rounded-[4px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Directly opens TikTok, Instagram, YouTube or Messages on your device"
                >
                  <span>📲</span>
                  <span>{isSharingDevice ? "Preparing Video..." : "Share to Phone / App"}</span>
                </button>
              )}

              {/* Direct Web Upload Studio Intent */}
              <button
                type="button"
                disabled={isSubmitting || (selectedPlatform === "webhook" && !webhookUrl)}
                onClick={handleDirectStudioUpload}
                className="button-primary text-xs !py-2 !px-4 flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
              >
                <span>{selectedPlatform === "webhook" ? "⚡" : "🌐"}</span>
                <span>
                  {isSubmitting
                    ? "Dispatching..."
                    : selectedPlatform === "webhook"
                    ? "Trigger Webhook Auto-Post"
                    : `Upload to ${activePlatform.name}`}
                </span>
              </button>
            </div>
          </div>

          {/* Instant feedback instructions */}
          <div className="rounded-lg bg-[var(--bg-subtle)] p-3 text-[11px] text-[var(--text-muted)] space-y-1">
            <p className="font-semibold text-[var(--text-primary)]">
              💡 How Direct Social Uploading Works:
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <strong>On Mobile:</strong> Tap <strong>&quot;Share to Phone / App&quot;</strong> to directly attach the video file into TikTok, Instagram Reels, or YouTube Shorts via your system share sheet.
              </li>
              <li>
                <strong>On Desktop:</strong> Clicking <strong>&quot;Upload to {activePlatform.name}&quot;</strong> copies your viral caption to clipboard and immediately launches the {activePlatform.studioName}.
              </li>
              {selectedPlatform === "webhook" && (
                <li>
                  <strong>Automations:</strong> Webhook payloads include pre-signed, unexpired direct download URLs ready for buffer queues or Zapier zaps.
                </li>
              )}
            </ul>
          </div>

          {publishResult && (
            <div className="rounded-[4px] bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1">
              <p className="font-bold">
                ✓ {selectedPlatform === "webhook" ? "Webhook Delivered Successfully!" : `Launched ${activePlatform.name} Upload Portal`}
              </p>
              <p className="text-[11px]">
                Caption has been copied to your clipboard. Paste it directly in your social post composer!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
