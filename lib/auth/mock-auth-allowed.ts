import { getSupabaseReachable } from "@/lib/supabase/browser-client";

/** True when running on localhost (diagnostics only — same auth/data as production when Supabase is configured). */
export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }

  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

/** Mock auth is a fallback for preview/dev hosts when cloud auth is not used. Production + localhost use Supabase. */
export function isMockAuthAllowed(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host === "vstah.am" || host === "www.vstah.am") return false;
  if (host.endsWith(".vercel.app")) return false;

  return process.env.NODE_ENV !== "production";
}

/** Device-only mock accounts when the cloud auth server is not confirmed online. */
export function isLocalDeviceAuthAllowed(): boolean {
  if (isMockAuthAllowed()) return true;
  return getSupabaseReachable() !== true;
}
