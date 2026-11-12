"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmMockPaymentAction } from "../actions";

export function PaystackCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") || "";
  const reference = searchParams.get("reference") || paymentId;
  const jobId = searchParams.get("jobId") || "";
  const amount = searchParams.get("amount") || "2.99";

  const [activeTab, setActiveTab] = useState<"card" | "bank" | "apple_pay">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCompletePayment() {
    setIsProcessing(true);
    setErrorMsg(null);

    const result = await confirmMockPaymentAction(paymentId);
    setIsProcessing(false);

    if (result.success) {
      if (jobId) {
        router.push(`/jobs/${jobId}?upgraded=true`);
      } else {
        router.push(`/dashboard?payment=success&ref=${reference}`);
      }
    } else {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      {/* Paystack Official Header */}
      <div className="card-paper bg-[var(--bg-raised)] p-6 rounded-lg border border-[var(--line-paper)] shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--line-paper)] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00C3F7] text-white flex items-center justify-center font-bold text-sm">
              P
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                Paystack Checkout
              </h2>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Secured by Paystack
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-[var(--text-muted)] block">AMOUNT</span>
            <strong className="text-lg font-bold text-[#0A7A50] font-mono">
              ${amount} USD
            </strong>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--bg-card)] p-1 rounded-md border border-[var(--line-paper)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`py-1.5 font-medium rounded transition-all cursor-pointer ${
              activeTab === "card"
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-2xs font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            💳 Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("apple_pay")}
            className={`py-1.5 font-medium rounded transition-all cursor-pointer ${
              activeTab === "apple_pay"
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-2xs font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            🍏 Apple Pay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-1.5 font-medium rounded transition-all cursor-pointer ${
              activeTab === "bank"
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-2xs font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            🏦 Transfer
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "card" && (
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">CARD NUMBER</label>
              <div className="border border-[var(--line-paper)] rounded px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono flex items-center justify-between">
                <span>4084 •••• •••• 9284</span>
                <span className="text-[10px] text-emerald-600 font-bold">VISA</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">EXPIRY</label>
                <div className="border border-[var(--line-paper)] rounded px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono">
                  09 / 28
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">CVV</label>
                <div className="border border-[var(--line-paper)] rounded px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono">
                  •••
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "apple_pay" && (
          <div className="text-center py-4 space-y-2 text-xs">
            <div className="text-3xl">🍏</div>
            <p className="font-medium text-[var(--text-primary)]">Pay with Apple Pay</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Double-click side button to confirm authorization on your Apple device.
            </p>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-2 text-xs bg-[var(--bg-card)] p-3 rounded border border-[var(--line-paper)]">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Bank Name:</span>
              <span className="font-medium text-[var(--text-primary)]">Paystack Titan Bank</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Account Number:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">9928174921</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Beneficiary:</span>
              <span className="font-medium text-[var(--text-primary)]">ClipLane Express</span>
            </div>
          </div>
        )}

        {/* Transaction Reference & Security */}
        <div className="space-y-1 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--line-paper)] pt-3">
          <div className="flex justify-between">
            <span>Reference:</span>
            <span className="text-[var(--text-primary)]">{reference.slice(0, 20)}...</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-sans pt-1">
            <span>🔒</span>
            <span>256-Bit SSL Encrypted & PCI-DSS Level 1 Certified</span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleCompletePayment}
          disabled={isProcessing}
          className="button-primary text-xs !py-3 w-full font-semibold cursor-pointer bg-[#00C3F7] hover:bg-[#00aee0]"
        >
          {isProcessing ? "Processing via Paystack..." : `Pay $${amount} USD with Paystack`}
        </button>
      </div>
    </div>
  );
}
