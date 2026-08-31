import { normalizeAgreementRow, type NormalizedAgreement } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

/** Server-side agreement read for SSR and API routes. */
export async function fetchAgreementById(agreementId: string): Promise<NormalizedAgreement | null> {
  const id = agreementId?.trim();
  if (!id) return null;

  const client = getAgreementServerClient();
  if ("error" in client) return null;

  const { data, error } = await client.supabase.from("agreements").select("*").eq("id", id).single();

  if (error || !data) return null;
  return normalizeAgreementRow(data as Record<string, unknown>);
}
