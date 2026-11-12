"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaymentProviderType } from "@cliplane/shared";
import {
  initiateCheckoutAction,
  redeemPriorityCreditAction,
} from "./actions";
import {
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
} from "@/lib/payments/constants";

interface CheckoutClientProps {
  userCredits: number;
  isVip?: boolean;
}
/* payments need to be tested set up stripe env values */

export function CheckoutClient({ userCredits, isVip }: CheckoutClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const isBundle = searchParams.get("bundle") === "true" || !jobId;

  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>("paystack");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const amount = isBundle ? PRIORITY_BUNDLE_PRICE_USD : PRIORITY_JOB_PRICE_USD;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await initiateCheckoutAction({
      jobId: jobId || undefined,
      provider: selectedProvider,
      isBundle,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (result.data.checkoutUrl) {
        // Redirect to provider checkout URL (or mock confirm in dev)
        window.location.href = result.data.checkoutUrl;
      } else {
        router.push(`/dashboard?payment=initiated&ref=${result.data.paymentId}`);
      }
    } else {
      setErrorMsg(result.error);
    }
  }

  async function handleRedeemCredit() {
    if (!jobId) return;
    setIsRedeeming(true);
    setErrorMsg(null);

    const result = await redeemPriorityCreditAction(jobId);
    setIsRedeeming(false);

    if (result.success) {
      router.push(`/jobs/${jobId}?upgraded=true`);
    } else {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 py-6">
      <div className="border-b border-[var(--line-paper)] pb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#0A7A50] font-bold">
          High-Speed Express Pipeline
        </span>
        <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)] mt-0.5">
          {isBundle ? "Streamer & Agency Growth Vault" : "Viral Creator Launch Pack"}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Instant dedicated worker processing. 3 viral clips across all 5 formats with adaptive genre sound design.
        </p>
      </div>

      {/* VIP Free Access Card */}
      {isVip && (
        <div className="rounded-[4px] border-2 border-emerald-500 bg-emerald-50/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
                VIP Access Active
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)]">
                Unlimited Free Priority Upgrades Enabled
              </h3>
            </div>
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Your account has 100% free access to all priority lane processing, skipping all lines at zero cost ($0.00).
          </p>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="button-primary text-xs !py-3 w-full font-semibold bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
          >
            {isSubmitting
              ? "Activating Free Priority Pass..."
              : isBundle
              ? "Claim 10 Free Priority Credits ($0.00)"
              : `Upgrade Job #${jobId.slice(0, 8)} to Priority Free ($0.00)`}
          </button>
        </div>
      )}

      {/* Credit Redemption Option (If user already has credits) */}
      {jobId && userCredits > 0 && (
        <div className="rounded-[4px] border-2 border-[var(--accent-default)] bg-blue-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-default)] font-bold">
                Available Credits
              </span>
              <h3 className="font-serif text-lg text-[var(--text-primary)]">
                You have {userCredits} Priority Credit{userCredits > 1 ? "s" : ""}
              </h3>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            You can upgrade Job #{jobId.slice(0, 8)} to the Priority lane immediately using 1 credit without making an additional payment.
          </p>
          <button
            onClick={handleRedeemCredit}
            disabled={isRedeeming}
            className="button-primary text-xs !py-2.5 !px-4 w-full"
          >
            {isRedeeming ? "Upgrading Job..." : "Upgrade with 1 Credit"}
          </button>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="card-paper bg-[var(--bg-raised)] p-6 space-y-4 border border-[var(--line-paper)] shadow-xs">
        <h2 className="font-serif text-xl font-normal text-[var(--text-primary)]">
          Order Summary
        </h2>

        <div className="flex items-center justify-between text-xs py-2 border-b border-[var(--line-paper)]">
          <div>
            <span className="font-semibold text-[var(--text-primary)] block text-sm">
              {isBundle
                ? "Growth Vault: 5 Episode Passes (15 Viral Clips)"
                : "Viral Creator Launch Pack (3 Finished Clips)"}
            </span>
            <span className="text-[var(--text-muted)] text-[11px] block mt-0.5">
              {isBundle
                ? "5 passes deposited to account • 15 clips total • 40% OFF ($1.99/pack) • Never expires"
                : `Instant dedicated GPU worker claiming for Job #${jobId.slice(0, 8) || "new"}`}
            </span>
          </div>
          <span className="font-mono text-base font-bold text-[var(--text-primary)]">
            ${amount.toFixed(2)} USD
          </span>
        </div>

        {/* Included Value Highlights */}
        <div className="rounded-lg bg-[var(--bg-subtle)] p-3.5 space-y-2 text-[11px] text-[var(--text-muted)] border border-[var(--line-paper)]">
          <div className="font-semibold text-[var(--text-primary)] text-xs mb-1">
            What is included in this drop:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Zero queue line (ready in ~15s)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>{isBundle ? "15 Viral clips (5 drops)" : "3 Viral clips engineered for views"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>All 5 formats (9:16, 1:1, 16:9, 4:5, MP3)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Adaptive sound design mixed in</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm font-semibold pt-1">
          <span>Total Due</span>
          <span className="font-mono text-lg font-extrabold text-[#0A7A50]">
            ${amount.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Payment Selection Form */}
      <form onSubmit={handleCheckout} className="card-paper bg-[var(--bg-raised)] p-6 space-y-6 border border-[var(--line-paper)] shadow-xs">
        <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
          Select Payment Method
        </h3>

        {errorMsg && (
          <div className="rounded-[2px] bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Payment Providers Radio Grid */}
        <div className="space-y-3">
          {/* 1. Paystack (Card, Apple Pay, Bank, Mobile Money) */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "paystack"
              ? "border-[var(--accent-default)] bg-blue-50/20 shadow-2xs"
              : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
          }`}>
            <input
              type="radio"
              name="provider"
              value="paystack"
              checked={selectedProvider === "paystack"}
              onChange={() => setSelectedProvider("paystack")}
              className="mt-0.5 text-[var(--accent-default)]"
            />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <strong className="block text-[var(--text-primary)] font-medium">Paystack (Debit/Credit Card & Apple Pay)</strong>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Recommended</span>
              </div>
              <span className="text-[var(--text-muted)] block">Visa, Mastercard, Verve, Apple Pay, and Bank Transfer via encrypted Paystack checkout.</span>
            </div>
          </label>

          {/* 2. Crypto (BTC / ETH / USDT / SOL) */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "crypto"
              ? "border-[var(--accent-default)] bg-blue-50/20 shadow-2xs"
              : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
          }`}>
            <input
              type="radio"
              name="provider"
              value="crypto"
              checked={selectedProvider === "crypto"}
              onChange={() => setSelectedProvider("crypto")}
              className="mt-0.5 text-[var(--accent-default)]"
            />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <strong className="block text-[var(--text-primary)] font-medium">Cryptocurrency (BTC / ETH / USDT / SOL)</strong>
                <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">Web3</span>
              </div>
              <span className="text-[var(--text-muted)] block">Pay with Bitcoin, Ethereum, USDT or Solana with automated blockchain confirmation.</span>
            </div>
          </label>

          {/* 3. Mock / Sandbox Simulator (Dev & Testing) */}
          {process.env.NODE_ENV !== "production" && (
            <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
              selectedProvider === "mock"
                ? "border-[var(--accent-default)] bg-blue-50/20 shadow-2xs"
                : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
            }`}>
              <input
                type="radio"
                name="provider"
                value="mock"
                checked={selectedProvider === "mock"}
                onChange={() => setSelectedProvider("mock")}
                className="mt-0.5 text-[var(--accent-default)]"
              />
              <div className="text-xs">
                <strong className="block text-[var(--text-primary)] font-medium">Sandbox Simulator (Dev Mode)</strong>
                <span className="text-[var(--text-muted)]">Simulate instant successful payment confirmation without real funds.</span>
              </div>
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="button-primary text-xs !py-3 w-full font-semibold"
        >
          {isSubmitting
            ? "Preparing Secure Checkout..."
            : `Pay $${amount.toFixed(2)} USD & Upgrade`}
        </button>
      </form>
    </div>
  );
}
