"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is ClipLane and how does it work?",
    answer:
      "ClipLane is an automated AI video engine built specifically for gaming and faceless creators. You upload gameplay footage or paste a video link, and ClipLane automatically analyzes audio loudness spikes (shouts, explosions, clutches), detects visual scene cuts, and crops your 16:9 widescreen footage into 9:16 vertical shorts formatted with clean blurred ambient backgrounds ready for TikTok, Shorts, and Reels.",
  },
  {
    question: "How does the highlight detection find my clutch moments?",
    answer:
      "ClipLane implements professional broadcast audio analysis using the EBU R128 loudness standard combined with visual scene transition detection. When your audio volume bursts (screaming, celebratory shouts, sudden gunfire) and the screen action changes rapidly, the engine identifies that exact time-window, applies smart pre-roll padding, and renders 3 top non-overlapping clips.",
  },
  {
    question: "Is the Free tier really 100% free?",
    answer:
      "Yes. You can upload gameplay and receive 9:16 vertical clips in full 1080x1920 HD with zero watermarks for free. Free jobs enter our transparent queue and process as worker capacity becomes available.",
  },
  {
    question: "What is the $2.99 Priority Pass?",
    answer:
      "If you just had an incredible clutch match and want to post it immediately to catch the viral wave, a Priority Pass skips the free queue entirely. Your job jumps to the front of the line and renders in approximately 10 to 15 seconds.",
  },
  {
    question: "Do Priority Passes expire?",
    answer:
      "Never. If you buy the $9.99 5-Job Pack, your passes stay in your account balance permanently. You can use them whenever you drop fresh footage.",
  },
  {
    question: "Are there any watermarks on exported clips?",
    answer:
      "Zero. Neither Free nor Priority clips ever have watermarks, logos, or branding. Your content belongs 100% to you.",
  },
  {
    question: "Can I use direct video links instead of uploading files?",
    answer:
      "Yes. You can paste direct video URLs (MP4/MOV) or upload raw footage up to 500MB from OBS, ShadowPlay, or GeForce Experience.",
  },
];

export function AutoclipsFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="scroll-mt-16 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Everything you need to know about ClipLane and viral vertical video clipping
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 bg-white ${
                  isOpen
                    ? "border-black shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex items-center justify-between w-full p-5 sm:p-6 text-left transition-colors hover:bg-gray-50/50"
                >
                  <span className="font-bold text-base sm:text-lg pr-4 text-gray-900">
                    {faq.question}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-[#15E49E] text-black rotate-180"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
