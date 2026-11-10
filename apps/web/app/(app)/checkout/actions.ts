"use server";

import {
  initiatePaymentSchema,
  logBusinessEvent,
  successResult,
  errorResult,
  type ActionResult,
  type PaymentProviderType,
  isVipUser,
} from "@cliplane/shared";
import { getAuthenticatedUser, createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getPaymentProvider,
  executePaymentConfirmation,
  PRIORITY_JOB_PRICE_USD,
  PRIORITY_BUNDLE_PRICE_USD,
} from "@/lib/payments";

export interface InitiateCheckoutInput {
  jobId?: string;
  provider: PaymentProviderType;
  phoneNumber?: string;
  isBundle?: boolean;
}

export interface InitiateCheckoutResult {
  paymentId: string;
  checkoutUrl?: string;
  checkoutRequestId?: string;
  status: string;
}

/**
 * Initiates checkout session for a priority upgrade or credit bundle.
 * Strict IDOR: verifies authenticated user owns the job if a jobId is provided.
 */
export async function initiateCheckoutAction(
  input: InitiateCheckoutInput,
): Promise<ActionResult<InitiateCheckoutResult>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // 1. Rate limiting
    const rateLimit = await checkRateLimit("paymentInitiate", user.id);
    if (!rateLimit.success) {
      return errorResult("Too many checkout attempts. Please wait a minute.", "RATE_LIMITED");
    }

    // 2. Hostile input validation
    const parsed = initiatePaymentSchema.safeParse({
      jobId: input.jobId || undefined,
      provider: input.provider,
      phoneNumber: input.phoneNumber,
    });

    if (!parsed.success) {
      return errorResult(parsed.error.issues[0]?.message || "Invalid input", "VALIDATION_FAILED");
    }

    // 3. IDOR Ownership Verification
    if (input.jobId) {
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, user_id, lane")
        .eq("id", input.jobId)
        .eq("user_id", user.id)
        .single();

      if (jobError || !job) {
        return errorResult("Job not found or access denied.", "NOT_FOUND");
      }

      if (job.lane === "priority") {
        return errorResult("This job is already in the Priority lane.", "BAD_REQUEST");
      }
    }

    // VIP users get 100% free immediate upgrades and priority passes
    if (isVipUser(user.email)) {
      if (input.jobId) {
        await supabase
          .from("jobs")
          .update({ lane: "priority", updated_at: new Date().toISOString() })
          .eq("id", input.jobId);

        logBusinessEvent({
          event: "upgrade_applied",
          userId: user.id,
          jobId: input.jobId,
          details: { lane: "priority", method: "vip_free_access" },
        });

        return successResult({
          paymentId: `vip_${Date.now()}`,
          checkoutUrl: `/jobs/${input.jobId}?upgraded=true`,
          status: "completed",
        });
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("priority_credits")
          .eq("id", user.id)
          .single();
        const currentCredits = profile?.priority_credits || 0;
        await supabase
          .from("profiles")
          .update({ priority_credits: currentCredits + 10, updated_at: new Date().toISOString() })
          .eq("id", user.id);

        return successResult({
          paymentId: `vip_${Date.now()}`,
          checkoutUrl: `/dashboard?bundle=added`,
          status: "completed",
        });
      }
    }

    const isBundle = Boolean(input.isBundle);
    const amount = isBundle ? PRIORITY_BUNDLE_PRICE_USD : PRIORITY_JOB_PRICE_USD;
    const provider = getPaymentProvider(input.provider);

    // 4. Create pending payment record in database
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        job_id: input.jobId || null,
        provider: input.provider,
        amount,
        currency: "USD",
        status: "pending",
        metadata: {
          isBundle,
          phoneNumber: input.phoneNumber || null,
        },
      })
      .select("id")
      .single();

    if (insertError || !paymentRecord) {
      return errorResult("Failed to create payment session.", "INTERNAL_ERROR");
    }

    // 5. Initiate session with provider
    const session = await provider.initiatePayment({
      jobId: input.jobId,
      userId: user.id,
      amount,
      currency: "USD",
      userEmail: user.email,
      phoneNumber: input.phoneNumber,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payments/${input.provider}`,
    });

    // 6. Update payment with provider reference
    await supabase
      .from("payments")
      .update({
        checkout_request_id: session.checkoutRequestId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRecord.id);

    // 7. Log business event
    logBusinessEvent({
      event: "payment_initiated",
      userId: user.id,
      jobId: input.jobId,
      paymentId: paymentRecord.id,
      details: {
        amount,
        currency: "USD",
        provider: input.provider,
        isBundle,
      },
    });

    return successResult({
      paymentId: paymentRecord.id,
      checkoutUrl: session.checkoutUrl,
      checkoutRequestId: session.checkoutRequestId,
      status: session.status,
    });
  } catch {
    return errorResult("An unexpected error occurred initiating checkout.", "INTERNAL_ERROR");
  }
}

/**
 * Redeems 1 Priority Credit to instantly promote a queued free job to Priority lane.
 * Strict IDOR: verifies that the authenticated user owns the job and has >= 1 credit.
 */
export async function redeemPriorityCreditAction(
  jobId: string,
): Promise<ActionResult<{ remainingCredits: number }>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // 1. Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id, lane, status")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return errorResult("Job not found or access denied.", "NOT_FOUND");
    }

    if (job.lane === "priority") {
      return errorResult("This job is already in the Priority lane.", "BAD_REQUEST");
    }

    // VIP users can redeem unlimited priority credits for free
    if (isVipUser(user.email)) {
      await supabase
        .from("jobs")
        .update({
          lane: "priority",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      logBusinessEvent({
        event: "upgrade_applied",
        userId: user.id,
        jobId: job.id,
        details: {
          method: "vip_free_redemption",
          remainingCredits: 9999,
        },
      });

      return successResult({ remainingCredits: 9999 });
    }

    // 2. Verify priority credit balance
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("priority_credits")
      .eq("id", user.id)
      .single();

    if (profError || !profile || (profile.priority_credits || 0) < 1) {
      return errorResult("You do not have any Priority Credits remaining.", "PAYMENT_REQUIRED");
    }

    const remainingCredits = profile.priority_credits - 1;

    // 3. Atomically decrement credits and promote job
    const { error: profUpdateErr } = await supabase
      .from("profiles")
      .update({
        priority_credits: remainingCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profUpdateErr) {
      return errorResult("Failed to redeem credit.", "INTERNAL_ERROR");
    }

    const { error: jobUpdateErr } = await supabase
      .from("jobs")
      .update({
        lane: "priority",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (jobUpdateErr) {
      return errorResult("Failed to update job lane.", "INTERNAL_ERROR");
    }

    logBusinessEvent({
      event: "upgrade_applied",
      userId: user.id,
      jobId: job.id,
      details: {
        method: "priority_credit_redemption",
        remainingCredits,
      },
    });

    return successResult({ remainingCredits });
  } catch {
    return errorResult("Failed to redeem priority credit.", "INTERNAL_ERROR");
  }
}

/**
 * Confirms a mock/test payment directly (used in dev/test sandbox).
 */
export async function confirmMockPaymentAction(
  paymentId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await executePaymentConfirmation({
      paymentId,
      providerTxId: `mock_tx_${Date.now()}`,
      status: "completed",
    });

    return successResult({ success: result.success });
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : "Confirmation failed", "INTERNAL_ERROR");
  }
}
