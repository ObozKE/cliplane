"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createJobAction } from "@/app/dashboard/actions";

interface UploadCardProps {
  userId: string;
  onJobCreated?: (jobId: string) => void;
}

export function UploadCard({ userId, onJobCreated }: UploadCardProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directUrl, setDirectUrl] = useState("");
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_MIME_TYPES = [
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "video/webm",
  ];
  const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

  function handleFileSelect(file: File) {
    setErrorMessage(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported file type. Please select an MP4, MOV, MKV, or WebM video.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("File exceeds the 200 MB maximum size limit.");
      return;
    }

    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!confirmOwnership) {
      setErrorMessage("You must confirm footage ownership before creating a clipping job.");
      return;
    }

    startTransition(async () => {
      try {
        let storagePath: string | null = null;

        if (activeTab === "upload") {
          if (!selectedFile) {
            setErrorMessage("Please select a video file to upload.");
            return;
          }

          setUploadProgress(10);
          const supabase = createClient();
          const fileExt = selectedFile.name.split(".").pop() || "mp4";
          // Path prefix is strictly UUID-based; never use user filenames
          const safeFileName = `${crypto.randomUUID()}.${fileExt}`;
          storagePath = `${userId}/${safeFileName}`;

          setUploadProgress(40);
          const { error: uploadError } = await supabase.storage
            .from("uploads")
            .upload(storagePath, selectedFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            setUploadProgress(null);
            setErrorMessage(`Upload failed: ${uploadError.message}`);
            return;
          }

          setUploadProgress(90);
        }

        const formData = new FormData();
        formData.append("sourceType", activeTab);
        formData.append("confirmOwnership", "true");
        if (storagePath) {
          formData.append("sourcePath", storagePath);
        }
        if (activeTab === "url") {
          formData.append("sourceUrl", directUrl.trim());
        }

        const result = await createJobAction(formData);
        setUploadProgress(100);

        if (!result.success) {
          setErrorMessage(result.error);
        } else {
          // Reset form
          setSelectedFile(null);
          setDirectUrl("");
          setConfirmOwnership(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (onJobCreated) onJobCreated(result.data.jobId);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred during job creation.");
      } finally {
        setTimeout(() => setUploadProgress(null), 1000);
      }
    });
  }

  return (
    <div className="card-paper p-6 sm:p-8 bg-[var(--bg-raised)] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line-paper)] pb-4 mb-6">
        <div>
          <h2 className="font-serif text-xl font-normal text-[var(--text-primary)]">
            Create Clipping Job
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Submit gameplay highlights to generate 9:16 vertical clips
          </p>
        </div>

        {/* Tab switchers styled with Carefront rounded-xs buttons */}
        <div className="inline-flex rounded-[2px] bg-[var(--bg-button-secondary)] p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setErrorMessage(null);
            }}
            className={`rounded-[2px] px-3.5 py-1.5 font-medium transition-colors ${
              activeTab === "upload"
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Direct Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setErrorMessage(null);
            }}
            className={`rounded-[2px] px-3.5 py-1.5 font-medium transition-colors ${
              activeTab === "url"
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Direct Video URL
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-[4px] border border-[var(--status-alert)]/20 bg-red-50 p-3 text-xs text-[var(--status-alert)] flex items-start justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[var(--status-alert)] hover:opacity-80 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "upload" ? (
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--line-paper)] hover:border-[var(--accent-default)] rounded-[4px] p-8 text-center cursor-pointer transition-colors bg-[var(--bg-card)]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-button-secondary)] text-[var(--text-muted)] mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Drag and drop your video file here, or click to browse
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    MP4, MOV, MKV, or WebM (Max 200 MB • Up to 5 minutes duration)
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="directUrl"
              className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
            >
              Direct Video Media URL
            </label>
            <input
              id="directUrl"
              type="url"
              required={activeTab === "url"}
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              placeholder="https://cdn.example.com/gameplay_highlight.mp4"
              className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Must be a direct HTTPS link pointing to a video file. Social page URLs (YouTube, TikTok, Twitch) are not supported.
            </p>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Uploading footage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[var(--line-paper)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[var(--accent-default)] h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mandatory Upload Gate Checkbox */}
        <div className="pt-2 border-t border-[var(--line-paper)]">
          <label className="flex items-start gap-3 text-xs text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              id="confirmOwnership"
              checked={confirmOwnership}
              onChange={(e) => setConfirmOwnership(e.target.checked)}
              className="mt-0.5 rounded-[2px] border-[var(--line-paper)] text-[var(--accent-default)] focus:ring-0 cursor-pointer"
            />
            <span className="leading-relaxed">
              <strong className="text-[var(--text-primary)] font-medium">Footage Rights Confirmation:</strong> I own this footage or have the right to use it, and it is not pre-release or leaked material.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || !confirmOwnership || (activeTab === "upload" && !selectedFile) || (activeTab === "url" && !directUrl)}
          className="button-primary w-full !py-2.5 text-sm !rounded-[2px] disabled:opacity-50"
        >
          {isPending ? "Queuing Job..." : "Enqueue Job (Free Lane)"}
        </button>
      </form>
    </div>
  );
}
