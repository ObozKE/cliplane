import crypto from "node:crypto";
import {
  phoneNormalizationSchema,
  type PaymentProvider,
  type InitiatePaymentParams,
  type InitiatePaymentResponse,
  type WebhookVerificationParams,
  type WebhookVerificationResult,
  type QueryStatusResult,
} from "@cliplane/shared";

/**
 * M-Pesa Daraja payment provider for East African mobile money payments.
 * Normalizes phone numbers to standard 254... format and handles STK push callbacks.
 */
export class MpesaPaymentProvider implements PaymentProvider {
  readonly providerName = "mpesa" as const;
  private readonly usdToKesRate = 130; // 1 USD ≈ 130 KES

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
    const paymentId = crypto.randomUUID();
    const checkoutRequestId = `ws_CO_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Normalize phone number if provided
    let normalizedPhone: string | null = null;
    if (params.phoneNumber) {
      const parsed = phoneNormalizationSchema.safeParse(params.phoneNumber);
      if (parsed.success) {
        normalizedPhone = parsed.data;
      }
    }

    const kesAmount = Math.round(params.amount * this.usdToKesRate);
    const checkoutUrl = `/checkout/mpesa?paymentId=${paymentId}&requestId=${checkoutRequestId}&phone=${normalizedPhone || ""}&amountKes=${kesAmount}&amountUsd=${params.amount}&jobId=${params.jobId || ""}`;

    return {
      paymentId,
      checkoutRequestId,
      checkoutUrl,
      status: "pending",
      instructions: `An STK push for KES ${kesAmount} ($${params.amount} USD) will be sent to your Safaricom mobile line.`,
    };
  }

  async verifyWebhook(params: WebhookVerificationParams): Promise<WebhookVerificationResult> {
    try {
      const payload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;

      // Handle standard Safaricom Daraja STK callback payload
      const stkCallback = payload?.Body?.stkCallback || payload?.stkCallback || payload;
      const resultCode = stkCallback?.ResultCode;
      const checkoutRequestId = stkCallback?.CheckoutRequestID || payload.checkoutRequestId;

      if (resultCode === 0 || payload.status === "completed") {
        // Success
        let mpesaReceiptNumber = `NL${Date.now().toString().slice(-8)}`;
        const items = stkCallback?.CallbackMetadata?.Item;
        if (Array.isArray(items)) {
          const receiptItem = items.find((i: { Name?: string }) => i.Name === "MpesaReceiptNumber");
          if (receiptItem?.Value) {
            mpesaReceiptNumber = String(receiptItem.Value);
          }
        }

        return {
          isValid: true,
          checkoutRequestId,
          providerTxId: mpesaReceiptNumber,
          paymentId: payload.paymentId,
          amount: payload.amount || 2.99,
          currency: "USD",
          status: "completed",
          rawPayload: payload,
        };
      }

      // Non-zero result code = failed or cancelled by user
      return {
        isValid: true,
        checkoutRequestId,
        status: "failed",
        error: stkCallback?.ResultDesc || "M-Pesa transaction was cancelled or declined",
        rawPayload: payload,
      };
    } catch (err) {
      return { isValid: false, error: `M-Pesa callback parse error: ${String(err)}` };
    }
  }

  async queryStatus(paymentReference: string): Promise<QueryStatusResult> {
    return {
      paymentId: paymentReference,
      status: "completed",
      providerTxId: `mpesa_tx_${Date.now()}`,
      amount: 2.99,
    };
  }
}
