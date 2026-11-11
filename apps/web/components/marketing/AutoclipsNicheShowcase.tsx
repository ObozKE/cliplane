"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface NicheItem {
  id: number;
  style: string;
  title: string;
  views?: string;
  isNew?: boolean;
  videoSrc: string;
  posterSrc: string;
}

const NICHES: NicheItem[] = [
  {
    id: 0,
    style: "GTA 6 Vice City Neon Cruise",
    title: "Ocean Drive Sunset & Supercars",
    views: "14.2M",
    isNew: true,
    videoSrc: "/videos/clip-1.mp4",
    posterSrc: "/videos/clip-1.jpg",
  },
  {
    id: 1,
    style: "GTA 5 5-Star Police Chase",
    title: "Freeway Pursuit & Spike Strips",
    views: "22.8M",
    videoSrc: "/videos/clip-2.mp4",
    posterSrc: "/videos/clip-2.jpg",
  },
  {
    id: 2,
    style: "GTA 6 Lucia & Jason Heist",
    title: "Convenience Store Holdup & Getaway",
    views: "19.5M",
    isNew: true,
    videoSrc: "/videos/clip-3.mp4",
    posterSrc: "/images/gta/gta6-lucia.png",
  },
  {
    id: 3,
    style: "GTA 5 Trevor Stunt Chaos",
    title: "Train Collision & Skydiving Escape",
    views: "8.7M",
    videoSrc: "/videos/clip-4.mp4",
    posterSrc: "/images/gta/gta5-trevor.jpg",
  },
  {
    id: 4,
    style: "GTA 6 Everglades Airboat",
    title: "Grassrivers Wildlife & Swamp Drift",
    views: "6.4M",
    isNew: true,
    videoSrc: "/videos/clip-5.mp4",
    posterSrc: "/images/gta/gta6-beach.jpg",
  },
  {
    id: 5,
    style: "GTA 5 Paleto Bay Score",
    title: "Heavy Armor Bank Heist & Minigun",
    views: "11.1M",
    videoSrc: "/videos/clip-6.mp4",
    posterSrc: "/images/gta/gta5-heist.jpg",
  },
  {
    id: 6,
    style: "GTA 6 Vice City Nightlife",
    title: "Downtown Club Strip & Lowrider Meet",
    views: "16.8M",
    isNew: true,
    videoSrc: "/videos/clip-1.mp4",
    posterSrc: "/images/gta/gta6-vicecity.jpg",
  },
  {
    id: 7,
    style: "GTA 5 Los Santos Freeway Run",
    title: "Night Skyline High-Speed Sprint",
    views: "5.9M",
    videoSrc: "/videos/clip-2.mp4",
    posterSrc: "/images/gta/gta5-night.jpg",
  },
  {
    id: 8,
    style: "GTA 6 Ambrosia Raceway",
    title: "Port Gellhorn Supercar Time Trial",
    views: "9.3M",
    isNew: true,
    videoSrc: "/videos/clip-5.mp4",
    posterSrc: "/images/gta/gta6-raceway.png",
  },
  {
    id: 9,
    style: "GTA 5 Franklin & Chop",
    title: "Chamberlain Hills Pursuit",
    views: "7.8M",
    videoSrc: "/videos/clip-4.mp4",
    posterSrc: "/images/gta/gta5-franklin.jpg",
  },
];

export function AutoclipsNicheShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeNiche = NICHES[selectedIndex] ?? NICHES[0]!;

  return (
    <section id="niches" className="scroll-mt-16 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Section Heading */}
        <div className="lp-halo mx-auto max-w-3xl rounded-2xl text-center">
          <h2
            className="text-3xl font-extrabold tracking-[-0.02em] text-black sm:text-4xl lg:text-5xl"
            style={{ textWrap: "balance" }}
          >
            AUTHENTIC GTA 5 &amp; GTA 6 FORMATS
          </h2>
          <p className="mt-3 text-base sm:text-lg font-semibold tracking-wider text-gray-500 uppercase">
            CHOOSE YOUR FAVORITE HIGH-VELOCITY HEIST OR PURSUIT STYLE
          </p>
        </div>

        {/* 2-Column Showcase */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 items-start">
          {/* Left Column: Sticky 9:16 Video Preview Mockup */}
          <div className="sticky top-20 z-10 self-start max-lg:bg-white/95 max-lg:pb-4 max-lg:pt-2 max-lg:backdrop-blur lg:top-28">
            <div className="mx-auto w-[65%] max-w-[240px] sm:w-[70%] sm:max-w-[320px]">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-black ring-1 ring-black/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)]">
                <video
                  key={activeNiche.videoSrc + activeNiche.id}
                  src={activeNiche.videoSrc}
                  poster={activeNiche.posterSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover lp-fade-in"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Top Badge */}
                {activeNiche.isNew && (
                  <div className="absolute right-3 top-3 rounded-full bg-[#15E49E] px-2.5 py-1 text-xs font-extrabold text-black shadow-lg">
                    NEW
                  </div>
                )}

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#15E49E]">
                    Style
                  </span>
                  <p className="text-sm font-bold truncate">
                    {activeNiche.style}
                  </p>
                  <p className="text-xs text-neutral-300 truncate mt-0.5">
                    {activeNiche.title}
                  </p>
                </div>
              </div>

              <p className="lp-halo mx-auto mt-3 w-fit rounded-md text-center text-sm font-semibold text-gray-800">
                Style: {activeNiche.style}
              </p>
            </div>
          </div>

          {/* Right Column: 10 Niche Selector Items */}
          <ol className="space-y-3">
            {NICHES.map((niche, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <li key={niche.id} data-index={idx}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-black bg-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)] scale-[1.01]"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    {/* Mini Thumbnail */}
                    <span className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg bg-black">
                      <img
                        src={niche.posterSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>

                    {/* Content */}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-bold text-black text-sm sm:text-base">
                          Style: {niche.style}
                        </span>
                        {niche.isNew && (
                          <span className="rounded-full bg-[#15E49E] px-1.5 py-0.5 text-[10px] font-extrabold text-black">
                            NEW
                          </span>
                        )}
                      </span>

                      {niche.views ? (
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                          <Play className="h-3 w-3 fill-gray-400 text-gray-400" />
                          {niche.views} views
                        </span>
                      ) : (
                        <span className="mt-0.5 block truncate text-xs sm:text-sm text-gray-500">
                          {niche.title}
                        </span>
                      )}
                    </span>

                    {/* Active Indicator Dot */}
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${
                        isSelected ? "bg-[#15E49E] scale-125" : "bg-gray-200"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
