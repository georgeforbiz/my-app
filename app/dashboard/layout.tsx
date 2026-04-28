"use client";

import { Providers } from "../providers";

/**
 * Dashboard requires auth context, but we keep marketing routes free from auth bootstrapping.
 * Wrapping only this route prevents `useAuth` context errors.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
