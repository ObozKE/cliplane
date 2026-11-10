import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipName — Precision Gameplay Vertical Clip Generation",
  description: "Automated, highlight-scored 9:16 vertical gameplay clipping for creators. Zero false claims, 100% honest queue.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[var(--bg-paper)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
