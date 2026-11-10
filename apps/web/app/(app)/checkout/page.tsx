import { Suspense } from "react";
import type { Metadata } from "next";
import { getAuthenticatedUser, createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — Priority Lane Upgrade",
  description: "Upgrade your gameplay highlight jobs to the Priority lane with cards, crypto, or mobile money.",
};

export default async function CheckoutPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Load user priority credit balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("priority_credits")
    .eq("id", user.id)
    .single();

  const userCredits = profile?.priority_credits || 0;

  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-12 text-center text-xs text-[var(--text-muted)]">
          <div className="mx-auto h-6 w-6 rounded-full border-2 border-[var(--accent-default)] border-t-transparent animate-spin mb-3" />
          Loading checkout...
        </div>
      }
    >
      <CheckoutClient userCredits={userCredits} />
    </Suspense>
  );
}
