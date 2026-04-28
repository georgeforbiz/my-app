import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VSTAH.am",
  description:
    "How VSTAH.am collects, uses, and protects personal information for homeowners, contractors, and platform users."
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
