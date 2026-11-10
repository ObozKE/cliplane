"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Will my clips have a watermark on the free tier?",
    answer: "Never. Whether you process clips in the Free Community Lane or upgrade to Priority, your clips are 100% watermark-free. You made the play; your content belongs entirely to you.",
  },
  {
    question: "What resolution and aspect ratio do I get?",
    answer: "Every clip is rendered in full 1080x1920 (9:16 vertical HD) at 60 FPS using standard H.264 MP4. The action stays centered, while a blurred ambient copy of your gameplay fills the top and bottom so your video fits mobile screens naturally without awkward black bars.",
  },
  {
    question: "How does the highlight detection actually work without AI fees?",
    answer: "We run multi-pass FFmpeg audio and video analysis. Our engine measures momentary audio loudness bursts (EBU R128) to find where your squad screams or weapons fire, combined with scene cut density (gt(scene,0.3)) to locate fast action. The top 3 windows are extracted with clean 15 to 30-second trims.",
  },
  {
    question: "How does the queue work? Are the wait times real?",
    answer: "Yes, 100% real. We calculate your queue position directly from active database rows and worker concurrency. We never use fake countdown timers, fake scarcity, or artificial delays. Free jobs run sequentially; Priority jobs skip immediately to the front of the line.",
  },
  {
    question: "Do Priority Credits expire?",
    answer: "No. Priority Passes purchased via the Single Upgrade ($2.99) or 5-Job Creator Pack ($9.99) remain deposited in your account indefinitely. You can use one today and save the rest for next week or next month.",
  },
  {
    question: "How long are my files kept?",
    answer: "Both raw uploads and rendered clips are safely stored in private cloud storage for 3 days. This gives you plenty of time to preview, test, and download your MP4 files and JPG cover thumbnails to your computer or phone.",
  },
  {
    question: "What games work best with ClipLane?",
    answer: "Any game with energetic audio or fast camera action: tactical shooters (CS2, Valorant), battle royales (Apex, Warzone), open-world action (GTA, Cyberpunk), fighting games, horror streams, and speedruns. If you have intense moments, ClipLane will find them.",
  },
];

export function InteractiveFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Got Questions?
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Everything you need to know about clipping, formats, and queue priority.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] rounded-[6px] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
              >
                <span className="font-serif text-base font-normal text-[var(--text-primary)]">
                  {faq.question}
                </span>
                <span className="font-mono text-sm text-[var(--accent-default)] font-bold">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--line-paper)] bg-[var(--bg-card)]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
