import { Suspense } from "react";
import { PaystackCheckoutClient } from "./PaystackCheckoutClient";

export default function PaystackCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono">Loading Paystack Checkout...</div>}>
      <PaystackCheckoutClient />
    </Suspense>
  );
}
