import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export function AutoclipsCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="lp-cta-card relative overflow-hidden rounded-[2rem] p-8 sm:p-14 text-center shadow-lg border border-[#15E49E]/30">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            {/* Pill */}
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#15E49E] animate-pulse" />
              START POSTING DAILY SHORTS TODAY
            </span>

            {/* Heading */}
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-black sm:text-5xl leading-tight">
              Ready to grow every social account on autopilot?
            </h2>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
              Turn your raw gameplay into high-retention 9:16 vertical clips in seconds. First video is completely free.
            </p>

            {/* CTA Button */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all duration-200 active:scale-[0.98] focus:outline-none h-13 px-8 text-base bg-[#15E49E] text-black shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] hover:brightness-95 w-full sm:w-auto"
              >
                Create Video Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                First video free
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                Zero watermarks
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#15E49E] stroke-[3]" />
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
