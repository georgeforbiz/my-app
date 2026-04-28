import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AgreementServerClient = { supabase: SupabaseClient; hasServiceRole: boolean };

/** Server-only Supabase client for agreement mutations (sign / escrow). */
export function getAgreementServerClient(): AgreementServerClient | { error: string; status: number } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = service ?? anon;
  if (!url || !key) {
    return { error: "Supabase is not configured.", status: 500 };
  }
  return { supabase: createClient(url, key), hasServiceRole: Boolean(service) };
}
