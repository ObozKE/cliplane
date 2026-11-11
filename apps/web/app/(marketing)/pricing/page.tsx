import type { Metadata } from "next";
import { AutoclipsPricing } from "@/components/marketing/AutoclipsPricing";
import { AutoclipsFAQ } from "@/components/marketing/AutoclipsFAQ";
import { AutoclipsCTA } from "@/components/marketing/AutoclipsCTA";
import { CreditCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — ClipLane",
  description:
    "Unlimited gameplay clipping for free, or skip the queue with a Priority Pass for $2.99. No subscriptions required, no watermarks, full 1080x1920 HD.",
};

export default function PricingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Autoclips-style Interactive Pricing Grid */}
      <AutoclipsPricing />

      {/* Payment methods card */}
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#15E49E]/15 text-[#0A7A50]">
            <CreditCard className="h-6 w-6 text-[#0A7A50]" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">
            Accepted Payment Methods
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Pay safely in USD via major debit &amp; credit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, or direct cryptocurrency (Bitcoin, Ethereum, USDT).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold text-gray-500">
            <span className="rounded-full bg-gray-100 px-3 py-1">Visa</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Mastercard</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Amex</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Apple Pay</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Google Pay</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Crypto (Coinbase)</span>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory & Legal Disclaimer */}
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 space-y-2 text-xs text-gray-600 leading-relaxed">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-gray-800">
            <ShieldCheck className="h-4 w-4 text-[#0A7A50]" />
            Required Disclaimers &amp; Fair Use Notice
          </div>
          <p>
            Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
          </p>
          <p className="text-gray-500 text-[11px]">
            Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <AutoclipsFAQ />

      {/* Pre-footer CTA */}
      <AutoclipsCTA />
    </div>
  );
}
