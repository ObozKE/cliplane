import { Suspense } from "react";
import type { Metadata } from "next";
import { MockConfirmClient } from "./MockConfirmClient";

export const metadata: Metadata = {
  title: "Simulate Payment — ClipName Sandbox",
};

export default function MockConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-12 text-center text-xs text-[var(--text-muted)]">
          Loading simulator...
        </div>
      }
    >
      <MockConfirmClient />
    </Suspense>
  );
}
