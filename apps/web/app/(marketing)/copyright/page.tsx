import type { Metadata } from "next";
import DmcaPage from "../dmca/page";

export const metadata: Metadata = {
  title: "Copyright Policy & Takedowns — ClipLane",
  description: "Official copyright takedown policy, infringement notification form, and repeat-infringer policy for ClipLane.",
};

export default function CopyrightPage() {
  return <DmcaPage />;
}
