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

export function readBearerToken(authHeader: string | null): string {
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

/** Supabase client that performs queries/inserts as the signed-in user (RLS as authenticated). */
export function getSupabaseClientForAccessToken(accessToken: string): SupabaseClient | { error: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { error: "Supabase is not configured." };
  }
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

/** Prefer service role; otherwise use the caller's JWT so RLS applies as that user. */
export function getAgreementMutationClient(
  server: AgreementServerClient,
  accessToken: string
): SupabaseClient | { error: string } {
  if (server.hasServiceRole) return server.supabase;
  return getSupabaseClientForAccessToken(accessToken);
}
