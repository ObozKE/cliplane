"use client";

import { useState } from "react";
import { reportClipAction } from "@/app/jobs/actions";

interface ReportClipModalProps {
  clipId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportClipModal({ clipId, isOpen, onClose }: ReportClipModalProps) {
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [contentUrl, setContentUrl] = useState(
    typeof window !== "undefined" ? window.location.href : "",
  );
  const [description, setDescription] = useState("");
  const [swornStatement, setSwornStatement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!swornStatement) {
      setErrorMsg("You must verify that the statement is accurate under penalty of perjury.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await reportClipAction({
      reporterName,
      reporterEmail,
      contentUrl,
      clipId: clipId || undefined,
      description,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedId(result.data.reportId);
    } else {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg card-paper bg-[var(--bg-raised)] p-6 sm:p-8 space-y-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div>
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
            Report Content or Copyright
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
            ClipName strictly enforces content ownership policies. We investigate all notices within 24 hours.
          </p>
        </div>

        {submittedId ? (
          <div className="rounded-[4px] border border-green-500/20 bg-green-50 p-5 text-center space-y-3">
            <h3 className="font-serif text-lg text-green-900">Notice Received</h3>
            <p className="text-xs text-green-800 leading-relaxed">
              Your report reference is <code className="font-mono font-bold">#{submittedId.slice(0, 8)}</code>.
              Our moderation team has received the report and will process it in accordance with our repeat-infringer policy.
            </p>
            <button
              onClick={onClose}
              className="button-primary text-xs !py-2 !px-4 mt-2"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-[2px] bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                Your Full Name / Organization
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Jane Doe or Acme Corp Legal"
                className="input-paper mt-1 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                Contact Email Address
              </label>
              <input
                type="email"
                required
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="legal@yourdomain.com"
                className="input-paper mt-1 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                Content URL
              </label>
              <input
                type="url"
                required
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://clipname.tech/jobs/..."
                className="input-paper mt-1 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                Reason & Detailed Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the copyrighted work, unauthorized footage, or terms violation (minimum 20 characters)..."
                className="input-paper mt-1 w-full text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="swornStatement"
                checked={swornStatement}
                onChange={(e) => setSwornStatement(e.target.checked)}
                className="mt-0.5 rounded-[2px] border-[var(--line-paper)] text-[var(--accent-default)] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="swornStatement" className="text-[11px] text-[var(--text-muted)] leading-tight cursor-pointer">
                I state under penalty of perjury that I am authorized to act on behalf of the owner, and that the information in this notification is accurate.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-paper)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary text-xs !py-2 !px-5"
              >
                {isSubmitting ? "Submitting..." : "Submit Notice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
