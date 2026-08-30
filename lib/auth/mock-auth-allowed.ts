import { getSupabaseReachable } from "@/lib/supabase/browser-client";

/** Mock auth is for local dev only — production must use Supabase so links work for clients. */
export function isMockAuthAllowed(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "vstah.am" || host === "www.vstah.am") return false;
  if (host.endsWith(".vercel.app")) return false;

  return process.env.NODE_ENV !== "production";
}

/** Device-only accounts when the cloud auth server is configured but unreachable. */
export function isLocalDeviceAuthAllowed(): boolean {
  if (isMockAuthAllowed()) return true;
  return getSupabaseReachable() === false;
}
