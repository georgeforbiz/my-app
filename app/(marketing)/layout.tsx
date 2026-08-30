import { ComingSoonOverlay } from "@/components/coming-soon-overlay";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <ComingSoonOverlay>{children}</ComingSoonOverlay>;
}
