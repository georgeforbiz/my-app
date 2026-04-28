import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | VSTAH.am",
  description:
    "Terms governing the use of VSTAH.am and the escrow flow between homeowners and contractors in Armenia."
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
