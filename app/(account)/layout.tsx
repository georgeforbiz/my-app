"use client";

import { Providers } from "../providers";

/**
 * Auth + Supabase only load for account routes, not the marketing homepage.
 * This prevents a bad .env or Supabase error from taking down `/`.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
