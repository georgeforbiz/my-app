"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { NAVY, ORANGE } from "@/lib/brand";

export function OrangeButton({
  children,
  className = "",
  href = "#"
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2A800] px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition-all duration-200 hover:bg-[#0033A0] hover:text-white hover:shadow-[0_14px_36px_-6px_rgba(0,51,160,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:bg-[#002a7a] active:text-white active:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0033A0] sm:text-base ${className}`}
      style={{ boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
    >
      {children}
    </Link>
  );
}

/** Outline on navy / hero backgrounds */
export function OutlineLightButton({
  children,
  href = "/#difference",
  className = ""
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-white/10 sm:text-base ${className}`}
    >
      {children}
    </Link>
  );
}

/** Secondary outline on white cards */
export function OutlineDarkButton({
  children,
  href,
  className = ""
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl border-2 px-6 py-3 text-center text-sm font-semibold transition hover:bg-slate-50 sm:text-base ${className}`}
      style={{ borderColor: NAVY, color: NAVY }}
    >
      {children}
    </Link>
  );
}
