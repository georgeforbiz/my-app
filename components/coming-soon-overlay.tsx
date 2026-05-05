"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type ComingSoonOverlayProps = {
  children: ReactNode;
};

export function ComingSoonOverlay({ children }: ComingSoonOverlayProps) {
  const searchParams = useSearchParams();

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

    // Supports a manual local admin flag for development sessions.
    const localAdminMode =
      typeof window !== "undefined" &&
      (window.localStorage.getItem("adminMode") === "1" || window.localStorage.getItem("adminMode") === "true");

    return paramBypass || localAdminMode;
  }, [searchParams]);

  return (
    <div className="relative">
      {children}
      {bypassOverlay ? null : (
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-950/90 px-6 text-center text-white"
          style={{ zIndex: 9999 }}
        >
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">VSTAH</p>
            <h2 className="text-3xl font-black md:text-4xl">Coming Soon</h2>
          </div>
        </div>
      )}
    </div>
  );
}
