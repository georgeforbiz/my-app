import { Suspense } from "react";
import { ComingSoonOverlay } from "@/components/coming-soon-overlay";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <ComingSoonOverlay>{children}</ComingSoonOverlay>
    </Suspense>
  );
}
