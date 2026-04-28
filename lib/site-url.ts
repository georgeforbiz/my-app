/**
 * Canonical public origin for agreement links (copy/share).
 * Prefer NEXT_PUBLIC_SITE_URL in production so links stay correct when opened from the dashboard on localhost.
 */
export function getPublicSiteOrigin(): string {
  const fromEnv = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") : "";
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Full absolute URL for sharing (clipboard, WhatsApp). Call from client or set NEXT_PUBLIC_SITE_URL for SSR. */
export function buildAgreementPublicUrl(agreementId: string): string {
  const origin = getPublicSiteOrigin();
  if (origin) return `${origin}/agreement/${agreementId}`;
  if (typeof window !== "undefined") return `${window.location.origin}/agreement/${agreementId}`;
  return `https://vstah.am/agreement/${agreementId}`;
}
