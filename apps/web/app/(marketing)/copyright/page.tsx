import type { Metadata } from "next";
import DmcaPage from "../dmca/page";

export const metadata: Metadata = {
  title: "Copyright Policy & Takedowns — ClipName",
  description: "Official copyright takedown policy, infringement notification form, and repeat-infringer policy for ClipName.",
};

export default function CopyrightPage() {
  return <DmcaPage />;
}
