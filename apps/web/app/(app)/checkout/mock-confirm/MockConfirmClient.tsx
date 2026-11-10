"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmMockPaymentAction } from "../actions";

export function MockConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") || "";
  const jobId = searchParams.get("jobId") || "";
  const amount = searchParams.get("amount") || "2.99";

  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setIsConfirming(true);
    setErrorMsg(null);

    const result = await confirmMockPaymentAction(paymentId);
    setIsConfirming(false);

    if (result.success) {
      if (jobId) {
        router.push(`/jobs/${jobId}?upgraded=true`);
      } else {
        router.push(`/dashboard?payment=success`);
      }
    } else {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="card-paper bg-[var(--bg-raised)] p-6 sm:p-8 space-y-4 border border-[var(--line-paper)] text-center shadow-md">
        <span className="text-3xl">🧪</span>
        <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Sandbox Payment Simulator
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Simulating a successful <strong>${amount} USD</strong> checkout transaction in test mode.
        </p>

        {errorMsg && (
          <div className="rounded-[2px] bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={isConfirming || !paymentId}
          className="button-primary text-xs !py-3 w-full font-semibold"
        >
          {isConfirming ? "Confirming..." : "Simulate Payment Success"}
        </button>
      </div>
    </div>
  );
}
