import type { NormalizedAgreement } from "@/lib/agreements/row";
import { hasStoredClientSignature, isAgreementSigned } from "@/lib/agreements/status-rank";

const CACHE_PREFIX = "vstah_agreement_cache:";
const LEGACY_SIGNED_PREFIX = "vstah_agreement_signed_cache:";

function cacheKey(agreementId: string) {
  return `${CACHE_PREFIX}${agreementId}`;
}

/** Persist agreement snapshot for instant reload on the same device. */
export function writeAgreementCache(agreement: NormalizedAgreement) {
  if (typeof window === "undefined" || !agreement?.id) return;
  try {
    const existing = readAgreementCache(agreement.id);
    const toWrite =
      hasStoredClientSignature(existing) && isAgreementSigned(existing!) && !hasStoredClientSignature(agreement)
        ? { ...agreement, client_signature: existing!.client_signature }
        : agreement;
    localStorage.setItem(cacheKey(agreement.id), JSON.stringify(toWrite));
  } catch {
    // Private mode / quota exceeded.
  }
}

export function readAgreementCache(agreementId: string): NormalizedAgreement | null {
  if (typeof window === "undefined" || !agreementId) return null;
  try {
    const raw =
      localStorage.getItem(cacheKey(agreementId)) ??
      localStorage.getItem(`${LEGACY_SIGNED_PREFIX}${agreementId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NormalizedAgreement;
    if (!parsed?.id || parsed.id !== agreementId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist a signed agreement snapshot for instant reload (same device). */
export function writeSignedCache(agreement: NormalizedAgreement) {
  if (!isAgreementSigned(agreement)) return;
  writeAgreementCache(agreement);
}

export function readSignedCache(agreementId: string): NormalizedAgreement | null {
  const cached = readAgreementCache(agreementId);
  if (!cached || !isAgreementSigned(cached)) return null;
  return cached;
}

/** Merge server payload with local cache — never downgrade signed → pending. */
/** Drop cached agreement snapshots owned by the departing provider. */
export function clearAgreementCachesForProvider(providerId: string): void {
  if (!providerId || typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith(CACHE_PREFIX) && !key.startsWith(LEGACY_SIGNED_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        keysToRemove.push(key);
        continue;
      }
      const parsed = JSON.parse(raw) as NormalizedAgreement;
      if (!parsed?.provider_id || parsed.provider_id === providerId) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function mergePreferSigned(
  server: NormalizedAgreement | null,
  cached: NormalizedAgreement | null
): NormalizedAgreement | null {
  if (!server && !cached) return null;
  if (!server) return cached;
  if (!cached || !isAgreementSigned(cached)) return server;
  if (!isAgreementSigned(server)) {
    return {
      ...server,
      status: cached.status === "completed" ? "completed" : "signed",
      client_signature: server.client_signature ?? cached.client_signature,
      provider_phone: server.provider_phone ?? cached.provider_phone,
      client_phone: server.client_phone ?? cached.client_phone
    };
  }
  return {
    ...server,
    client_signature: server.client_signature ?? cached.client_signature,
    provider_logo_url: server.provider_logo_url ?? cached.provider_logo_url,
    provider_phone: server.provider_phone ?? cached.provider_phone,
    client_phone: server.client_phone ?? cached.client_phone
  };
}
