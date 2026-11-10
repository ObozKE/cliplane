"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaymentProviderType } from "@clipname/shared";
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
}

export function CheckoutClient({ userCredits }: CheckoutClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const isBundle = searchParams.get("bundle") === "true" || !jobId;

  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>("stripe");
  const [phoneNumber, setPhoneNumber] = useState("");
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
      phoneNumber: selectedProvider === "mpesa" ? phoneNumber : undefined,
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
        <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
          Priority Checkout
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Instant worker processing. Truthful queue priority with zero artificial waiting window.
        </p>
      </div>

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
            <span className="font-medium text-[var(--text-primary)] block">
              {isBundle ? "Creator Pack (5 Priority Credits)" : "Single Priority Lane Upgrade"}
            </span>
            <span className="text-[var(--text-muted)] text-[11px]">
              {isBundle
                ? "5 credits deposited to account • No expiration"
                : `Instant worker claiming for Job #${jobId.slice(0, 8)}`}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            ${amount.toFixed(2)} USD
          </span>
        </div>

        <div className="flex items-center justify-between text-sm font-semibold pt-1">
          <span>Total Due</span>
          <span className="font-mono text-base text-[var(--accent-default)]">
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
          {/* 1. Stripe (Card / USD) */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "stripe"
              ? "border-[var(--accent-default)] bg-blue-50/20"
              : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
          }`}>
            <input
              type="radio"
              name="provider"
              value="stripe"
              checked={selectedProvider === "stripe"}
              onChange={() => setSelectedProvider("stripe")}
              className="mt-0.5 text-[var(--accent-default)]"
            />
            <div className="text-xs">
              <strong className="block text-[var(--text-primary)] font-medium">Credit or Debit Card (USD)</strong>
              <span className="text-[var(--text-muted)]">Visa, Mastercard, American Express via secure Stripe Checkout.</span>
            </div>
          </label>

          {/* 2. Crypto */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "crypto"
              ? "border-[var(--accent-default)] bg-blue-50/20"
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
            <div className="text-xs">
              <strong className="block text-[var(--text-primary)] font-medium">Cryptocurrency (BTC / ETH / USDT / LTC)</strong>
              <span className="text-[var(--text-muted)]">Instant crypto payments with automated confirmation.</span>
            </div>
          </label>

          {/* 3. M-Pesa */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "mpesa"
              ? "border-[var(--accent-default)] bg-blue-50/20"
              : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
          }`}>
            <input
              type="radio"
              name="provider"
              value="mpesa"
              checked={selectedProvider === "mpesa"}
              onChange={() => setSelectedProvider("mpesa")}
              className="mt-0.5 text-[var(--accent-default)]"
            />
            <div className="text-xs">
              <strong className="block text-[var(--text-primary)] font-medium">M-Pesa (East Africa Mobile Money)</strong>
              <span className="text-[var(--text-muted)]">Instant STK push to your Safaricom mobile line in KES.</span>
            </div>
          </label>

          {/* 4. Mock / Sandbox Simulator (Dev / Free-Tier Friendly) */}
          <label className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-colors ${
            selectedProvider === "mock"
              ? "border-[var(--accent-default)] bg-blue-50/20"
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
              <strong className="block text-[var(--text-primary)] font-medium">Sandbox Simulator (Test Mode)</strong>
              <span className="text-[var(--text-muted)]">Simulate instant successful payment confirmation without real funds.</span>
            </div>
          </label>
        </div>

        {/* Conditional M-Pesa Phone Field */}
        {selectedProvider === "mpesa" && (
          <div className="p-4 rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--line-paper)] space-y-2">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              Safaricom Mobile Number (07XXXXXXXX or 254...)
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678"
              className="input-paper w-full text-xs"
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              An STK push for ~KES {Math.round(amount * 130)} will be prompted on this phone.
            </p>
          </div>
        )}

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
