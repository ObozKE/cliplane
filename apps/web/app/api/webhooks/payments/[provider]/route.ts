import { NextRequest, NextResponse } from "next/server";
import { type PaymentProviderType, logger } from "@cliplane/shared";
import { getPaymentProvider, executePaymentConfirmation } from "@/lib/payments";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  const providerType = providerParam as PaymentProviderType;

  if (!["mock", "crypto", "stripe", "mpesa"].includes(providerType)) {
    return NextResponse.json({ error: `Unsupported payment provider: ${providerParam}` }, { status: 400 });
  }

  const rawBody = await request.text();
  const headersObj: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const provider = getPaymentProvider(providerType);

  try {
    // 1. Verify cryptographic or signature integrity
    const verification = await provider.verifyWebhook({
      rawBody,
      headers: headersObj,
    });

    if (!verification.isValid) {
      logger.warn(
        { provider: providerType, error: verification.error },
        "Rejected invalid webhook callback",
      );
      return NextResponse.json(
        { error: verification.error || "Invalid webhook signature" },
        { status: 400 },
      );
    }

    if (verification.status === "completed") {
      // 2. Execute atomic payment confirmation & priority upgrade
      await executePaymentConfirmation({
        paymentId: verification.paymentId,
        checkoutRequestId: verification.checkoutRequestId,
        providerTxId: verification.providerTxId,
        status: "completed",
        rawPayload: verification.rawPayload,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { provider: providerType, err: message },
      "Error processing payment webhook event",
    );

    // Return 200 for known duplicate or idempotency events so provider doesn't endlessly retry
    if (message.includes("already confirmed") || message.includes("duplicate")) {
      return NextResponse.json({ received: true, note: "Already processed" });
    }

    return NextResponse.json(
      { error: "Webhook processing encountered an error" },
      { status: 500 },
    );
  }
}
