import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobDetailAction } from "@/app/dashboard/actions";
import { getClipSignedUrlsAction, type ClipSignedUrls } from "@/app/jobs/actions";
import { VerticalClipPlayer } from "@/components/clips/VerticalClipPlayer";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id: jobId } = await params;
  const detail = await getJobDetailAction(jobId);

  // IDOR Protection: If job does not exist or user is not the owner, return 404
  if (!detail) {
    notFound();
  }

  const { job, queueState } = detail;

  // Retrieve signed URLs for clips if completed
  let clipsWithSignedUrls: ClipSignedUrls[] = [];
  if (job.status === "complete") {
    const signedClipsRes = await getClipSignedUrlsAction(job.id);
    if (signedClipsRes.success) {
      clipsWithSignedUrls = signedClipsRes.data;
    }
  }

  // Calculate 3-day retention cutoff date
  const createdDate = new Date(job.created_at);
  const expiryDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const isExpired = Date.now() > expiryDate.getTime();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-[var(--line-paper)] pb-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            ← Dashboard
          </Link>
          <span>/</span>
          <span className="font-mono text-[var(--text-primary)]">Job #{job.id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-[2px] px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
              job.lane === "priority"
                ? "bg-purple-100 text-purple-800 border border-purple-200"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--line-paper)]"
            }`}
          >
            {job.lane === "priority" ? "Priority Lane" : "Free Lane"}
          </span>
        </div>
      </div>

      {/* Main Status & Queue Card */}
      <div className="card-paper p-6 sm:p-8 bg-[var(--bg-raised)] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
              Highlight Job Status
            </h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Source: {job.source_type === "upload" ? "Uploaded File" : `Direct URL (${job.source_url})`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-[2px] px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                job.status === "complete"
                  ? "bg-green-100 text-green-800"
                  : job.status === "processing"
                  ? "bg-blue-100 text-[var(--accent-default)] animate-pulse"
                  : job.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {job.status}
            </span>
          </div>
        </div>

        {/* Real Queue Panel (When Queued) */}
        {job.status === "queued" && queueState && (
          <div className="panel-dark p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-panel)] pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-panel-muted)] block font-mono">
                  Live Queue Position
                </span>
                <span className="text-3xl font-serif font-normal text-white mt-1 block">
                  #{queueState.queuePosition}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-panel-muted)] block font-mono">
                  Truthful Estimated Wait
                </span>
                <span className="text-2xl font-serif font-normal text-[var(--accent-default)] mt-1 block">
                  {queueState.estimatedWaitFormatted}
                </span>
              </div>
            </div>

            <div className="text-xs text-[var(--text-panel-muted)] leading-relaxed space-y-1">
              <p>{queueState.laneExplanation}</p>
              {job.lane === "free" && queueState.minWaitRemainingSeconds > 0 && (
                <p className="text-amber-400">
                  Minimum wait window remaining: ~{Math.ceil(queueState.minWaitRemainingSeconds / 3600)} hours.
                </p>
              )}
            </div>

            {job.lane === "free" && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--line-panel)]">
                <div className="text-xs text-white">
                  <strong>Skip the line:</strong> Upgrade to the Priority lane for instant worker processing.
                </div>
                <Link
                  href={`/checkout?jobId=${job.id}`}
                  className="button-primary text-xs !py-2 !px-4"
                >
                  Upgrade to Priority ($2.99)
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {job.status === "processing" && (
          <div className="rounded-[4px] border border-blue-500/20 bg-blue-50 p-8 text-center space-y-3">
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-[var(--accent-default)] border-t-transparent animate-spin" />
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Worker Is Processing Footage
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Evaluating audio energy bursts (EBU R128) and visual scene dynamics (<code>gt(scene,0.3)</code>) to extract your top 3 vertical highlights.
            </p>
          </div>
        )}

        {/* Completed State with Clips */}
        {job.status === "complete" && (
          <div className="space-y-6">
            {/* 3-Day Retention Notice Banner */}
            <div className="rounded-[3px] border border-[var(--line-paper)] bg-[var(--bg-subtle)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span>⏱</span>
                <span>
                  {isExpired
                    ? "Retention period ended. Media files have been pruned per our 3-day retention policy."
                    : `Clips and footage are preserved for 3 days (until ${expiryDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}). Download your clips to your device.`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                  Ready-to-Post Multi-Format Highlights
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Extracted with 2-second action lead-in, adaptive genre sound design, and instant 5-format exports (9:16, 1:1, 16:9, 4:5, MP3).
                </p>
              </div>
            </div>

            {clipsWithSignedUrls.length === 0 ? (
              <div className="rounded-[4px] bg-[var(--bg-subtle)] p-8 text-center text-xs text-[var(--text-muted)]">
                No highlight windows satisfied the scoring threshold in this footage.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {clipsWithSignedUrls.map((clip) => (
                  <VerticalClipPlayer key={clip.id} clip={clip} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Failed State */}
        {job.status === "failed" && (
          <div className="rounded-[4px] border border-[var(--status-alert)]/20 bg-red-50 p-6 space-y-2">
            <h3 className="font-serif text-lg text-[var(--status-alert)]">
              Job Processing Failed
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {job.error_code || "The video could not be processed. Please check file format, codec, and duration (maximum 5 minutes)."}
            </p>
            <div className="pt-2">
              <Link href="/dashboard" className="button-secondary text-xs !py-1.5 !px-3">
                Try Another Video
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
