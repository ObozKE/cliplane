"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface JobItem {
  id: string;
  source_type: "upload" | "url";
  source_path?: string | null;
  source_url?: string | null;
  status: "uploaded" | "queued" | "processing" | "complete" | "failed" | "canceled" | "rejected";
  lane: "free" | "priority";
  attempts: number;
  created_at: string;
}

interface JobsListProps {
  initialJobs: JobItem[];
  userId: string;
}

export function JobsList({ initialJobs, userId }: JobsListProps) {
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Supabase Realtime Subscription for Live Updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`jobs-feed-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newJob = payload.new as JobItem;
            setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as JobItem;
            setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setJobs((prev) => prev.filter((j) => j.id !== deleted.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function renderStatusChip(status: JobItem["status"]) {
    switch (status) {
      case "queued":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Queued
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-[var(--accent-default)] border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-default)] animate-ping" />
            Processing
          </span>
        );
      case "complete":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Complete
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            {status}
          </span>
        );
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="card-paper p-10 bg-[var(--bg-card)] text-center">
        <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
          No Video Jobs Yet
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
          Upload a gameplay highlight video above or provide a direct video media URL to start generating vertical clips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
          Your Video Jobs
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>

      <div className="card-paper overflow-hidden bg-[var(--bg-raised)] shadow-xs">
        <div className="divide-y divide-[var(--line-paper)]">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[var(--bg-card)] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    #{job.id.slice(0, 8)}
                  </span>
                  {renderStatusChip(job.status)}
                  <span
                    className={`rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      job.lane === "priority"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                    }`}
                  >
                    {job.lane === "priority" ? "Priority Lane" : "Free Lane"}
                  </span>
                </div>

                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                  <span>
                    Source: {job.source_type === "upload" ? "Direct File Upload" : "Direct Media URL"}
                  </span>
                  <span>•</span>
                  <span>
                    Created {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/jobs/${job.id}`}
                  className="button-outline text-xs !py-1.5 !px-3.5 !rounded-[2px]"
                >
                  View Job & Queue →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
