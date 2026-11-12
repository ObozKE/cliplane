export type PaymentProviderType = "paystack" | "crypto" | "mock";

export type PaymentStatus = "pending" | "completed" | "failed" | "canceled";

export interface InitiatePaymentParams {
  jobId?: string;
  userId: string;
  amount: number;
  currency: string;
  userEmail?: string;
  phoneNumber?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  checkoutUrl?: string;
  checkoutRequestId?: string;
  status: PaymentStatus;
  instructions?: string;
}

export interface WebhookVerificationParams {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  secret?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  paymentId?: string;
  checkoutRequestId?: string;
  providerTxId?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  rawPayload?: Record<string, unknown>;
  error?: string;
}

export interface QueryStatusResult {
  paymentId: string;
  status: PaymentStatus;
  providerTxId?: string;
  amount?: number;
}

export interface PaymentProvider {
  readonly providerName: PaymentProviderType;

  /**
   * Initiates payment with the provider
   */
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse>;

  /**
   * Verifies an incoming webhook callback
   */
  verifyWebhook(params: WebhookVerificationParams): Promise<WebhookVerificationResult>;

  /**
   * Queries payment status directly from the provider
   */
  queryStatus(paymentReference: string): Promise<QueryStatusResult>;
}
