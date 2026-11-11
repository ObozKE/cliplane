import Link from "next/link";
import { LpGridBackground } from "@/components/marketing/LpGridBackground";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col text-black antialiased bg-white selection:bg-[#15E49E] selection:text-black">
      {/* Interactive Dot Grid Background with Cursor Mint Glow Mask */}
      <LpGridBackground />

      {/* Top Banner Strip matching Autoclips */}
      <div className="relative z-20 border-b border-gray-200 bg-[#F6F6F4] text-[#3F3F3A] py-2 px-4 text-center text-xs font-medium">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 hover:text-black transition-colors"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#15E49E]" />
          <span>
            <strong>First video is free</strong> — Turn hours of raw footage into viral 9:16 vertical clips without credit card
          </span>
          <span className="underline decoration-dashed decoration-[#15E49E] underline-offset-2">
            Try Now →
          </span>
        </Link>
      </div>

      {/* Modern Autoclips Floating / Sticky Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-[#15E49E] font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
              CL
            </span>
            <span className="text-xl font-extrabold tracking-tight text-black">
              ClipLane
            </span>
          </Link>

          {/* Navigation Links */}
          <nav
            aria-label="Main"
            className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex"
          >
            <Link href="/#trending" className="transition-colors hover:text-black">
              Trending
            </Link>
            <Link href="/#niches" className="transition-colors hover:text-black">
              Formats
            </Link>
            <Link href="/#what-is-cliplane" className="transition-colors hover:text-black">
              How It Works
            </Link>
            <Link href="/#pricing" className="transition-colors hover:text-black">
              Pricing
            </Link>
            <Link href="/#faqs" className="transition-colors hover:text-black">
              FAQs
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-gray-700 hover:text-black transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none h-10 px-4 text-sm bg-[#15E49E] text-black shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] hover:brightness-95"
            >
              Try For Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="relative z-10 flex-1 w-full">
        {children}
      </main>

      {/* Full Autoclips 5-Column Footer */}
      <footer className="relative z-10 border-t border-gray-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 py-14 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3.2fr)] lg:gap-16">
            {/* Left Brand Column */}
            <div>
              <Link className="inline-flex items-center gap-2.5" href="/">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-[#15E49E] font-bold text-sm shadow-sm">
                  CL
                </span>
                <span className="text-lg font-bold tracking-tight text-black">
                  ClipLane
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Create faceless, trending vertical gameplay clips in minutes with ClipLane app.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none h-10 px-5 text-sm bg-[#15E49E] text-black shadow-[0_12px_30px_-12px_rgba(21,228,158,0.9)] hover:brightness-95 mt-5"
              >
                Try For Free
              </Link>
            </div>

            {/* Right Multi-Column Navigation */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Column 1: Links */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Platform
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <li>
                    <Link className="transition-colors hover:text-black" href="/dashboard">
                      Video Clipper
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/pricing">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#trending">
                      Trending Formats
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#faqs">
                      FAQs
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Formats */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Styles
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#niches">
                      3D Animated Studio
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#niches">
                      Character Explainer
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#niches">
                      Faceless Gaming Shorts
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/#niches">
                      Stickman Viral Reels
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Guides */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Guides
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <li>
                    <Link className="transition-colors hover:text-black" href="/learn">
                      Tutorial Hub
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/learn/recording-clean-gameplay">
                      OBS Recording Setup
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/learn/what-makes-a-clip-hold-attention">
                      Viral Retention Secrets
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/learn/audio-loudness-and-detection">
                      Audio Burst Logic
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: Legal & Compliance */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Legal
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                  <li>
                    <Link className="transition-colors hover:text-black" href="/terms">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/privacy">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/dmca">
                      Copyright & Takedown
                    </Link>
                  </li>
                  <li>
                    <Link className="transition-colors hover:text-black" href="/copyright">
                      DMCA Agent
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Compliance Disclaimers */}
          <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400 space-y-3">
            <p className="leading-relaxed">
              Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p>© {new Date().getFullYear()} ClipLane. All rights reserved.</p>
              <div className="flex items-center gap-4 text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#15E49E]" />
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
