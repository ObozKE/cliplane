import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { PaystackPaymentProvider } from "./paystack";
import { CryptoPaymentProvider } from "./crypto";

describe("Paystack Payment Gateway & Security", () => {
  const TEST_SECRET = "sk_test_paystack_secret_key_1234567890abcdef";
  const provider = new PaystackPaymentProvider(TEST_SECRET);

  it("initiates Paystack transaction with proper reference and amount", async () => {
    const result = await provider.initiatePayment({
      userId: "user-123",
      amount: 2.99,
      currency: "USD",
      userEmail: "gamer@example.com",
    });

    expect(result.status).toBe("pending");
    expect(result.paymentId).toBeDefined();
    expect(result.checkoutRequestId).toMatch(/^pstk_/);
    expect(result.checkoutUrl).toBeDefined();
  });

  it("verifies authentic Paystack webhook with valid HMAC-SHA512 signature", async () => {
    const paymentId = "pstk_test_123";
    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        id: 99887766,
        reference: paymentId,
        amount: 299, // $2.99 in kobo
        currency: "USD",
        status: "success",
        metadata: {
          paymentId,
          userId: "user-123",
        },
      },
    });

    // Compute expected HMAC SHA-512
    const signature = crypto
      .createHmac("sha512", TEST_SECRET)
      .update(payload)
      .digest("hex");

    const verification = await provider.verifyWebhook({
      rawBody: payload,
      headers: {
        "x-paystack-signature": signature,
      },
      secret: TEST_SECRET,
    });

    expect(verification.isValid).toBe(true);
    expect(verification.status).toBe("completed");
    expect(verification.paymentId).toBe(paymentId);
    expect(verification.amount).toBe(2.99);
    expect(verification.providerTxId).toBe("99887766");
  });

  it("rejects tampered Paystack webhook payload with invalid signature", async () => {
    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        id: 99887766,
        reference: "pstk_tampered",
        amount: 299,
      },
    });

    const forgedSignature = crypto
      .createHmac("sha512", "wrong-secret-key")
      .update(payload)
      .digest("hex");

    const verification = await provider.verifyWebhook({
      rawBody: payload,
      headers: {
        "x-paystack-signature": forgedSignature,
      },
      secret: TEST_SECRET,
    });

    expect(verification.isValid).toBe(false);
    expect(verification.error).toContain("Invalid Paystack webhook signature");
  });

  it("rejects Paystack webhook missing x-paystack-signature header in production/secured mode", async () => {
    const payload = JSON.stringify({
      event: "charge.success",
      data: { id: 1 },
    });

    const verification = await provider.verifyWebhook({
      rawBody: payload,
      headers: {},
      secret: TEST_SECRET,
    });

    expect(verification.isValid).toBe(false);
    expect(verification.error).toContain("Missing x-paystack-signature header");
  });
});

describe("Crypto Payment Gateway & Security", () => {
  const CRYPTO_SECRET = "crypto_super_secret_webhook_key_987654321";
  const cryptoProvider = new CryptoPaymentProvider(undefined, CRYPTO_SECRET);

  it("initiates crypto payment with order ID and hosted invoice fallback", async () => {
    const result = await cryptoProvider.initiatePayment({
      userId: "user-crypto-1",
      amount: 9.99,
      currency: "USD",
      userEmail: "crypto@example.com",
    });

    expect(result.status).toBe("pending");
    expect(result.paymentId).toBeDefined();
    expect(result.checkoutRequestId).toMatch(/^cn_crypto_/);
    expect(result.checkoutUrl).toContain("/checkout/crypto");
  });

  it("verifies authentic crypto webhook with HMAC-SHA512 signature", async () => {
    const payload = JSON.stringify({
      payment_status: "finished",
      order_id: "crypto_order_555",
      payment_id: "tx_nowpayments_999",
      price_amount: 9.99,
      amount: 9.99,
    });

    const signature = crypto
      .createHmac("sha512", CRYPTO_SECRET)
      .update(payload)
      .digest("hex");

    const verification = await cryptoProvider.verifyWebhook({
      rawBody: payload,
      headers: {
        "x-crypto-signature": signature,
      },
    });

    expect(verification.isValid).toBe(true);
    expect(verification.status).toBe("completed");
    expect(verification.paymentId).toBe("crypto_order_555");
    expect(verification.amount).toBe(9.99);
  });

  it("rejects tampered crypto webhook payload", async () => {
    const payload = JSON.stringify({
      payment_status: "finished",
      order_id: "crypto_order_tampered",
    });

    const verification = await cryptoProvider.verifyWebhook({
      rawBody: payload,
      headers: {
        "x-crypto-signature": "invalid_forged_crypto_signature_hash_12345678",
      },
    });

    expect(verification.isValid).toBe(false);
    expect(verification.error).toContain("Invalid cryptographic signature");
  });
});
