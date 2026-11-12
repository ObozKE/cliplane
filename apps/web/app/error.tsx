"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log full error details for debugging
    console.error("ErrorBoundary caught error:", {
      message: error?.message || "Unknown error",
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  const isNetworkOrActionError =
    error?.message?.includes("unexpected response") ||
    error?.message?.includes("fetchServerAction");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 max-w-md w-full">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {isNetworkOrActionError ? "Connection or Session Out of Sync" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {isNetworkOrActionError
            ? "Your browser session or request connection was interrupted. Please refresh the page or try again."
            : "We encountered an error while processing your request. Please try again later."}
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-neutral-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Try again
          </button>
          {isNetworkOrActionError && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Refresh page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
