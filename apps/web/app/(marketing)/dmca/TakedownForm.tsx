"use client";

import { useState } from "react";
import { reportClipAction } from "@/app/jobs/actions";

export function TakedownForm() {
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [swornStatement, setSwornStatement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!swornStatement) {
      setErrorMsg("You must confirm that the statement is accurate under penalty of perjury.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await reportClipAction({
      reporterName,
      reporterEmail,
      contentUrl,
      description,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedId(result.data.reportId);
    } else {
      setErrorMsg(result.error);
    }
  }

  if (submittedId) {
    return (
      <div className="rounded-[4px] border border-green-500/20 bg-green-50 p-6 text-center space-y-3">
        <h4 className="font-serif text-lg text-green-900">Notice Successfully Logged</h4>
        <p className="text-xs text-green-800 leading-relaxed max-w-md mx-auto">
          Your official notice has been assigned ticket reference <code className="font-mono font-bold">#{submittedId.slice(0, 8)}</code>.
          Our copyright agent will review the submission and act expeditiously in compliance with statutory requirements.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="rounded-[2px] bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)]">
            Full Name of Copyright Owner or Agent
          </label>
          <input
            type="text"
            required
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="John Smith"
            className="input-paper mt-1 w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)]">
            Email Address for Official Correspondence
          </label>
          <input
            type="email"
            required
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            placeholder="legal@rights-holder.com"
            className="input-paper mt-1 w-full text-xs"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-primary)]">
          Allegedly Infringing Clip or Page URL
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
          Identification of Copyrighted Work & Infringement Description
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the copyrighted work, explain why the usage is unauthorized, or provide proof of rights ownership (minimum 20 characters)..."
          className="input-paper mt-1 w-full text-xs leading-relaxed"
        />
      </div>

      <div className="flex items-start gap-2.5 pt-2">
        <input
          type="checkbox"
          id="takedownSwornStatement"
          checked={swornStatement}
          onChange={(e) => setSwornStatement(e.target.checked)}
          className="mt-0.5 rounded-[2px] border-[var(--line-paper)] text-[var(--accent-default)] focus:ring-0 cursor-pointer"
        />
        <label htmlFor="takedownSwornStatement" className="text-[11px] text-[var(--text-muted)] leading-tight cursor-pointer">
          I state, under penalty of perjury, that I am the copyright owner or authorized to act on behalf of the owner, and that the information in this notice is accurate.
        </label>
      </div>

      <div className="pt-4 border-t border-[var(--line-paper)] flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="button-primary text-xs !py-2.5 !px-6"
        >
          {isSubmitting ? "Submitting Notice..." : "Submit Formal DMCA Notice"}
        </button>
      </div>
    </form>
  );
}
