import crypto from "node:crypto";
import type {
  PaymentProvider,
  InitiatePaymentParams,
  InitiatePaymentResponse,
  WebhookVerificationParams,
  WebhookVerificationResult,
  QueryStatusResult,
} from "@cliplane/shared";

/**
 * Paystack Payment Provider for Cards (Visa/Mastercard/Amex), Apple Pay, Bank Transfer,
 * and Mobile Money payments with HMAC-SHA512 webhook signature verification.
 */
export class PaystackPaymentProvider implements PaymentProvider {
  readonly providerName = "paystack" as const;
  private readonly secretKey: string;
  readonly publicKey?: string;

  constructor(secretKey?: string, publicKey?: string) {
    this.secretKey = secretKey || process.env.PAYSTACK_SECRET_KEY || "paystack-secret-fallback";
    this.publicKey = publicKey || process.env.PAYSTACK_PUBLIC_KEY;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
    const paymentId = crypto.randomUUID();
    const reference = `pstk_${paymentId.replace(/-/g, "").slice(0, 16)}_${Date.now().toString(36)}`;
    const amountInKobo = Math.round(params.amount * 100);

    // If real Paystack secret key is provided (starts with sk_live_ or sk_test_), call Paystack API
    const hasLiveOrTestKey =
      this.secretKey &&
      (this.secretKey.startsWith("sk_live_") || this.secretKey.startsWith("sk_test_"));

    if (hasLiveOrTestKey) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: params.userEmail || "customer@cliplane.tech",
            amount: amountInKobo,
            currency: params.currency || "USD",
            reference,
            callback_url: `${appUrl}/dashboard?payment=success&reference=${reference}`,
            metadata: {
              paymentId,
              userId: params.userId,
              jobId: params.jobId || "",
              custom_fields: [
                {
                  display_name: "Job ID",
                  variable_name: "job_id",
                  value: params.jobId || "bundle",
                },
                {
                  display_name: "User ID",
                  variable_name: "user_id",
                  value: params.userId,
                },
              ],
            },
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.status && resData.data?.authorization_url) {
            return {
              paymentId,
              checkoutRequestId: resData.data.reference || reference,
              checkoutUrl: resData.data.authorization_url,
              status: "pending",
              instructions: "Complete checkout via secure Paystack gateway.",
            };
          }
        }
      } catch {
        // Fall back to hosted simulation page if network/credentials fail in dev
      }
    }

    // Direct / Local Paystack Gateway Portal fallback for dev & testing
    const checkoutUrl = `/checkout/paystack?paymentId=${paymentId}&reference=${reference}&amount=${params.amount}&jobId=${params.jobId || ""}`;
    return {
      paymentId,
      checkoutRequestId: reference,
      checkoutUrl,
      status: "pending",
      instructions: "Pay with Credit/Debit Card, Apple Pay, or Bank via Paystack.",
    };
  }

  async verifyWebhook(params: WebhookVerificationParams): Promise<WebhookVerificationResult> {
    try {
      const signature = (params.headers["x-paystack-signature"] || "") as string;
      const secretToUse = params.secret || this.secretKey;

      if (!signature) {
        // In local development or test with fallback secret, allow payload check if signature omitted
        if (
          (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") &&
          secretToUse === "paystack-secret-fallback"
        ) {
          const body = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
          return {
            isValid: true,
            paymentId: body.data?.metadata?.paymentId || body.data?.reference || body.paymentId,
            checkoutRequestId: body.data?.reference || body.checkoutRequestId,
            providerTxId: String(body.data?.id || body.data?.reference || `pstk_tx_${Date.now()}`),
            amount: body.data?.amount ? body.data.amount / 100 : Number(body.amount || 2.99),
            currency: body.data?.currency || "USD",
            status: "completed",
            rawPayload: body,
          };
        }
        return { isValid: false, error: "Missing x-paystack-signature header" };
      }

      // Compute HMAC-SHA512
      const computedHash = crypto
        .createHmac("sha512", secretToUse)
        .update(params.rawBody)
        .digest("hex");

      // Constant-time buffer comparison to prevent timing attacks
      const computedBuffer = Buffer.from(computedHash, "utf-8");
      const signatureBuffer = Buffer.from(signature, "utf-8");

      if (
        computedBuffer.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(computedBuffer, signatureBuffer)
      ) {
        return { isValid: false, error: "Invalid Paystack webhook signature" };
      }

      const payload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;

      // Paystack charge success event
      if (payload.event === "charge.success") {
        const data = payload.data || {};
        const paymentId = data.metadata?.paymentId || data.reference;

        return {
          isValid: true,
          paymentId,
          checkoutRequestId: data.reference,
          providerTxId: String(data.id || data.reference),
          amount: data.amount ? data.amount / 100 : undefined,
          currency: data.currency || "USD",
          status: "completed",
          rawPayload: payload,
        };
      }

      // Other Paystack events (e.g. transfer.success, subscription.create)
      return {
        isValid: true,
        status: "pending",
        rawPayload: payload,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        error: `Paystack webhook verification failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async queryStatus(paymentReference: string): Promise<QueryStatusResult> {
    const hasLiveOrTestKey =
      this.secretKey &&
      (this.secretKey.startsWith("sk_live_") || this.secretKey.startsWith("sk_test_"));

    if (hasLiveOrTestKey) {
      try {
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          },
        );

        if (response.ok) {
          const resData = await response.json();
          if (resData.status && resData.data?.status === "success") {
            return {
              paymentId: paymentReference,
              status: "completed",
              providerTxId: String(resData.data.id),
              amount: resData.data.amount / 100,
            };
          }
        }
      } catch {
        // Fall back to pending
      }
    }

    return {
      paymentId: paymentReference,
      status: "pending",
    };
  }
}
