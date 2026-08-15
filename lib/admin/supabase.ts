import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service-role Supabase client for privileged admin routes. Never use on the client. */
export function getAdminSupabase():
  | { supabase: SupabaseClient }
  | { error: string; status: number } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      error: "Admin data API is not configured (missing Supabase service role).",
      status: 503
    };
  }
  return {
    supabase: createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  };
}
