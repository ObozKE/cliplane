"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError caught root error:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center dark:bg-neutral-950">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 max-w-md w-full">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Critical Application Error
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            A fatal error occurred. No sensitive details have been leaked.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-neutral-400 font-mono">
              Digest: {error.digest}
            </p>
          )}
          <div className="mt-6">
            <button
              onClick={() => reset()}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
