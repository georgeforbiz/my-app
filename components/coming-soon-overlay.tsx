"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type ComingSoonOverlayProps = {
  children: ReactNode;
};

function ComingSoonOverlayLayer() {
  const searchParams = useSearchParams();
  const enabledByEnv = process.env.NEXT_PUBLIC_COMING_SOON === "1";

  const bypassOverlay = useMemo(() => {
    const adminParam = searchParams.get("admin");
    const previewParam = searchParams.get("preview");
    const bypassParam = searchParams.get("bypassComingSoon");

    const paramBypass =
      adminParam === "1" ||
      adminParam === "true" ||
      previewParam === "1" ||
      previewParam === "true" ||
      bypassParam === "1" ||
      bypassParam === "true";

    const localAdminMode =
      typeof window !== "undefined" &&
      (window.localStorage.getItem("adminMode") === "1" || window.localStorage.getItem("adminMode") === "true");

    return paramBypass || localAdminMode;
  }, [searchParams]);

  const showOverlay = enabledByEnv && !bypassOverlay;

  if (!showOverlay) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-950/90 px-6 text-center text-white"
      style={{ zIndex: 9999 }}
    >
      <div className="max-w-xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">VSTAH</p>
        <h2 className="text-3xl font-black md:text-4xl">Coming Soon</h2>
      </div>
    </div>
  );
}

export function ComingSoonOverlay({ children }: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      {children}
      <Suspense fallback={null}>
        <ComingSoonOverlayLayer />
      </Suspense>
    </div>
  );
}
