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
 * Mock payment provider for zero-cost local development and automated CI testing.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly providerName = "mock" as const;

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
    const paymentId = crypto.randomUUID();
    const checkoutRequestId = `mock_req_${crypto.randomBytes(8).toString("hex")}`;
    const checkoutUrl = `/checkout/mock-confirm?paymentId=${paymentId}&requestId=${checkoutRequestId}&jobId=${params.jobId || ""}&amount=${params.amount}`;

    return {
      paymentId,
      checkoutRequestId,
      checkoutUrl,
      status: "pending",
      instructions: "Simulated sandbox payment environment.",
    };
  }

  async verifyWebhook(params: WebhookVerificationParams): Promise<WebhookVerificationResult> {
    try {
      const payload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;

      // In mock mode, check for test token or simulate success
      const isValid = Boolean(payload && payload.paymentId);
      if (!isValid) {
        return { isValid: false, error: "Missing mock paymentId" };
      }

      return {
        isValid: true,
        paymentId: payload.paymentId,
        checkoutRequestId: payload.checkoutRequestId,
        providerTxId: `mock_tx_${Date.now()}`,
        amount: payload.amount,
        currency: payload.currency || "USD",
        status: payload.status || "completed",
        rawPayload: payload,
      };
    } catch (err) {
      return { isValid: false, error: `Invalid JSON payload: ${String(err)}` };
    }
  }

  async queryStatus(paymentReference: string): Promise<QueryStatusResult> {
    return {
      paymentId: paymentReference,
      status: "completed",
      providerTxId: `mock_tx_${Date.now()}`,
      amount: 2.99,
    };
  }
}
