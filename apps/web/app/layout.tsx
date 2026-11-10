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
  title: "ClipLane — Precision Gameplay Vertical Clip Generation",
  description: "Automated, highlight-scored 9:16 vertical gameplay clipping for creators. Zero false claims, 100% honest queue.",
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
