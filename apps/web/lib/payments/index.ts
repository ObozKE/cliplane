import type {
  PaymentProvider,
  PaymentProviderType,
  PaymentStatus,
} from "@cliplane/shared";
import { logBusinessEvent, logger } from "@cliplane/shared";
import { createClient } from "@/lib/supabase/server";
import { MockPaymentProvider } from "./mock";
import { CryptoPaymentProvider } from "./crypto";
import { PaystackPaymentProvider } from "./paystack";

import {
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
  BUNDLE_CREDITS_COUNT,
} from "./constants";

export {
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
  BUNDLE_CREDITS_COUNT,
};

const providers: Record<PaymentProviderType, PaymentProvider> = {
  paystack: new PaystackPaymentProvider(),
  crypto: new CryptoPaymentProvider(),
  mock: new MockPaymentProvider(),
};

/**
 * Resolves the payment provider instance.
 */
export function getPaymentProvider(
  providerType: PaymentProviderType = (process.env.PAYMENT_PROVIDER as PaymentProviderType) || "paystack",
): PaymentProvider {
  return providers[providerType] || providers.paystack || providers.mock;
}

export interface PaymentConfirmationParams {
  paymentId?: string;
  checkoutRequestId?: string;
  providerTxId?: string;
  status?: PaymentStatus;
  rawPayload?: Record<string, unknown>;
}

export interface PaymentConfirmationResult {
  success: boolean;
  paymentId: string;
  jobId: string | null;
  userId: string;
  laneUpdated: boolean;
  creditsAdded: number;
  alreadyProcessed: boolean;
  error?: string;
}

/**
 * Executes atomic confirmation of a payment:
 * 1. Checks if payment is already completed (idempotency guard).
 * 2. Updates `payments` status to 'completed'.
 * 3. If tied to a specific `job_id`, promotes `jobs.lane` to 'priority'.
 * 4. If bundle purchase (`job_id` is null), adds 5 credits to `profiles.priority_credits`.
 * 5. Logs audit and business events.
 */
export async function executePaymentConfirmation(
  params: PaymentConfirmationParams,
): Promise<PaymentConfirmationResult> {
  const supabase = await createClient();

  // Find payment record
  let query = supabase.from("payments").select("*");
  if (params.paymentId) {
    query = query.eq("id", params.paymentId);
  } else if (params.checkoutRequestId) {
    query = query.eq("checkout_request_id", params.checkoutRequestId);
  } else {
    throw new Error("Either paymentId or checkoutRequestId must be provided");
  }

  const { data: payments, error } = await query.limit(1);

  if (error || !payments || payments.length === 0) {
    logger.warn({ params }, "Payment record not found for webhook confirmation");
    throw new Error("Payment record not found");
  }

  const payment = payments[0]!;

  // 1. Idempotency Check: if already completed, return immediately without re-applying
  if (payment.status === "completed") {
    logger.info({ paymentId: payment.id }, "Payment already confirmed, ignoring duplicate event");
    return {
      success: true,
      paymentId: payment.id,
      jobId: payment.job_id,
      userId: payment.user_id,
      laneUpdated: false,
      creditsAdded: 0,
      alreadyProcessed: true,
    };
  }

  const newStatus = params.status || "completed";

  // 2. Update payment status
  const { error: updatePayErr } = await supabase
    .from("payments")
    .update({
      status: newStatus,
      provider_tx_id: params.providerTxId || payment.provider_tx_id,
      metadata: params.rawPayload ? { ...payment.metadata, ...params.rawPayload } : payment.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (updatePayErr) {
    logger.error({ err: updatePayErr, paymentId: payment.id }, "Failed to update payment status");
    throw new Error("Failed to update payment status");
  }

  if (newStatus !== "completed") {
    return {
      success: true,
      paymentId: payment.id,
      jobId: payment.job_id,
      userId: payment.user_id,
      laneUpdated: false,
      creditsAdded: 0,
      alreadyProcessed: false,
    };
  }

  let laneUpdated = false;
  let creditsAdded = 0;

  // 3. If payment was for a specific job: atomically promote job to Priority lane
  if (payment.job_id) {
    const { error: jobUpdateErr } = await supabase
      .from("jobs")
      .update({
        lane: "priority",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.job_id);

    if (jobUpdateErr) {
      logger.error({ err: jobUpdateErr, jobId: payment.job_id }, "Failed to promote job lane");
    } else {
      laneUpdated = true;
      logBusinessEvent({
        event: "upgrade_applied",
        userId: payment.user_id,
        jobId: payment.job_id,
        paymentId: payment.id,
        details: { lane: "priority", method: "direct_purchase" },
      });
    }
  } else {
    // 4. Bundle purchase (no specific job_id): increment priority_credits on profiles table
    creditsAdded = BUNDLE_CREDITS_COUNT;
    const { data: profile } = await supabase
      .from("profiles")
      .select("priority_credits")
      .eq("id", payment.user_id)
      .single();

    const currentCredits = profile?.priority_credits || 0;
    await supabase
      .from("profiles")
      .update({
        priority_credits: currentCredits + creditsAdded,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.user_id);

    logBusinessEvent({
      event: "upgrade_applied",
      userId: payment.user_id,
      paymentId: payment.id,
      details: { creditsAdded, newTotal: currentCredits + creditsAdded },
    });
  }

  // 5. Log business event
  logBusinessEvent({
    event: "payment_confirmed",
    userId: payment.user_id,
    paymentId: payment.id,
    jobId: payment.job_id || undefined,
    details: {
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      providerTxId: params.providerTxId,
    },
  });

  return {
    success: true,
    paymentId: payment.id,
    jobId: payment.job_id,
    userId: payment.user_id,
    laneUpdated,
    creditsAdded,
    alreadyProcessed: false,
  };
}
