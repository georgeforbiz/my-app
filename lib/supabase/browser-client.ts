import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let cachedReachable: boolean | null = null;
let runtimeChecked = false;
let runtimePromise: Promise<SupabaseClient | null> | null = null;

/** null = not checked yet; false = configured but offline/missing. */
export function getSupabaseReachable(): boolean | null {
  return cachedReachable;
}

function createBrowserClient(url: string, key: string): SupabaseClient | null {
  try {
    return createClient(url, key);
  } catch {
    console.warn("[vstah] Supabase createClient failed.");
    return null;
  }
}

function fromBuildEnv(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

/** Sync client when build-time env vars are present. May be null until ensureSupabaseBrowser runs. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  const fromEnv = fromBuildEnv();
  if (fromEnv) {
    cached = fromEnv;
    return cached;
  }
  return null;
}

/** Loads Supabase config from the server and caches reachability (always once per page load). */
export async function ensureSupabaseBrowser(): Promise<SupabaseClient | null> {
  if (runtimeChecked) return getSupabaseBrowser();

  if (!runtimePromise) {
    runtimePromise = (async () => {
      try {
        const res = await fetch("/api/auth/config", { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as {
          configured?: boolean;
          reachable?: boolean;
          url?: string;
          anonKey?: string;
        };
        if (res.ok && payload.url && payload.anonKey) {
          if (!cached) {
            cached = createBrowserClient(payload.url, payload.anonKey);
          }
          cachedReachable = payload.reachable ?? false;
        } else {
          cachedReachable = false;
        }
      } catch {
        cachedReachable = false;
      } finally {
        runtimeChecked = true;
        runtimePromise = null;
      }
      return getSupabaseBrowser();
    })();
  }

  return runtimePromise;
}
