import { AutoclipsHero } from "@/components/marketing/AutoclipsHero";
import { AutoclipsPlatformBar } from "@/components/marketing/AutoclipsPlatformBar";
import { AutoclipsTrending } from "@/components/marketing/AutoclipsTrending";
import { AutoclipsNicheShowcase } from "@/components/marketing/AutoclipsNicheShowcase";
import { AutoclipsPillars } from "@/components/marketing/AutoclipsPillars";
import { InteractiveClipSimulator } from "@/components/marketing/InteractiveClipSimulator";
import { AutoclipsPricing } from "@/components/marketing/AutoclipsPricing";
import { AutoclipsFAQ } from "@/components/marketing/AutoclipsFAQ";
import { AutoclipsCTA } from "@/components/marketing/AutoclipsCTA";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section with Input Form & 3x 9:16 Video Showcase */}
      <AutoclipsHero />

      {/* 2. Platform Optimization & Creator Stats Bar */}
      <AutoclipsPlatformBar />

      {/* 3. Trending Right Now (Stickman & Creepy Toon 9:16 Showcase) */}
      <AutoclipsTrending />

      {/* 4. Unique Videos Each Time - Interactive Sticky 9:16 Niche Selector */}
      <AutoclipsNicheShowcase />

      {/* 5. What is ClipLane? 3 Pillar Feature Cards */}
      <AutoclipsPillars />

      {/* 6. Interactive Clip Simulator (Widescreen to 9:16 Vertical Live Preview) */}
      <section className="py-16 sm:py-20 border-t border-gray-100 bg-white/70">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <InteractiveClipSimulator />
        </div>
      </section>

      {/* 7. Pricing Section with Toggle & Transparent Cards */}
      <AutoclipsPricing />

      {/* 8. Frequently Asked Questions Accordion */}
      <AutoclipsFAQ />

      {/* 9. High-Impact Bottom Pre-Footer CTA Card */}
      <AutoclipsCTA />
    </div>
  );
}
