import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAgreementRow, type NormalizedAgreement } from "@/lib/agreements/row";
import { PROVIDER_LOGO_METADATA_KEY, readProviderLogoUrl } from "@/lib/agreements/logo-image";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

/** Prefer row logo; if missing, try provider auth metadata (HTTP logos only). */
async function enrichProviderLogo(
  agreement: NormalizedAgreement,
  supabase: SupabaseClient,
  hasServiceRole: boolean
): Promise<NormalizedAgreement> {
  if (readProviderLogoUrl(agreement.provider_logo_url)) return agreement;
  if (!hasServiceRole || !agreement.provider_id) return agreement;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(agreement.provider_id);
    if (error || !data.user) return agreement;
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const fromMeta = readProviderLogoUrl(meta[PROVIDER_LOGO_METADATA_KEY]);
    if (!fromMeta) return agreement;

    // Best-effort backfill so future public reads include the logo on the row.
    void supabase
      .from("agreements")
      .update({ provider_logo_url: fromMeta })
      .eq("id", agreement.id);

    return { ...agreement, provider_logo_url: fromMeta };
  } catch {
    return agreement;
  }
}

/** Server-side agreement read for SSR and API routes. */
export async function fetchAgreementById(agreementId: string): Promise<NormalizedAgreement | null> {
  const id = agreementId?.trim();
  if (!id) return null;

  const client = getAgreementServerClient();
  if ("error" in client) return null;

  const { data, error } = await client.supabase.from("agreements").select("*").eq("id", id).single();

  if (error || !data) return null;
  const normalized = normalizeAgreementRow(data as Record<string, unknown>);
  return enrichProviderLogo(normalized, client.supabase, client.hasServiceRole);
}
