"use client";

import { Providers } from "../providers";

/** Single auth context for dashboard + login + register so logout does not remount mid-redirect. */
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
