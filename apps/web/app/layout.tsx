import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClipLane — AI Highlight Clipper for Creators, Streamers & Podcasts",
  description:
    "Turn full-length videos, podcasts, and gameplay streams into high-retention vertical clips with mathematical peak detection, genre sound design, and 1-click social upload.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen flex flex-col bg-[var(--bg-paper)] text-[var(--text-primary)] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
