import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/** Returns null when Supabase env vars are missing or client creation fails. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  try {
    cached = createClient(url, key);
    return cached;
  } catch {
    console.warn("[vstah] Supabase createClient failed — using mock auth.");
    cached = null;
    return null;
  }
}
