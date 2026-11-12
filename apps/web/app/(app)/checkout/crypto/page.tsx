import { Suspense } from "react";
import { CryptoCheckoutClient } from "./CryptoCheckoutClient";

export default function CryptoCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono">Loading Crypto Checkout...</div>}>
      <CryptoCheckoutClient />
    </Suspense>
  );
}
