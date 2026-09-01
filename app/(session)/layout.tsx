"use client";

import { Providers } from "../providers";

/** Single auth context for dashboard + login + register so logout does not remount mid-redirect.
 *  Clean URLs: /login, /register, /dashboard, /settings (route groups are invisible in the URL).
 */
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
