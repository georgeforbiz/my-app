/** Central registry of browser storage keys used by the app. */

export const MOCK_USERS_KEY = "vstah_mock_users";
export const MOCK_SESSION_KEY = "vstah_mock_session";
export const LOCAL_AGREEMENTS_KEY = "vstah_local_agreements";
export const VERIFICATION_PENDING_KEY = "vstah_verification_pending";
export const AGREEMENT_CACHE_PREFIX = "vstah_agreement_cache:";
export const LEGACY_AGREEMENT_SIGNED_CACHE_PREFIX = "vstah_agreement_signed_cache:";
export const AGREEMENT_SIGNED_SESSION_PREFIX = "vstah_agreement_signed:";
export const LEGACY_PROVIDER_LOGO_KEY = "vstah_last_provider_logo";
export const LEGACY_MOCK_PLAN_KEY = "vstah_mock_subscription_plan";
export const LANGUAGE_KEY = "vstah-language";
export const LEGACY_LANGUAGE_KEY = "vstah-lang";

export function providerLogoStorageKey(userId: string): string {
  return `vstah_provider_logo:${userId}`;
}

export function mockPlanStorageKey(userId: string): string {
  return `vstah_mock_subscription_plan_${userId}`;
}

/** Persists across logout — used to show a loading state when cloud agreements are expected. */
export function hasAgreementsHintStorageKey(userId: string): string {
  return `vstah_has_agreements:${userId}`;
}

export function readHasAgreementsHint(userId: string | undefined | null): boolean {
  if (!userId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(hasAgreementsHintStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeHasAgreementsHint(userId: string, hasAgreements: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const key = hasAgreementsHintStorageKey(userId);
    if (hasAgreements) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function isVstahLocalStorageKey(key: string): boolean {
  return (
    key.startsWith("vstah_") ||
    key.startsWith(AGREEMENT_CACHE_PREFIX) ||
    key.startsWith(LEGACY_AGREEMENT_SIGNED_CACHE_PREFIX)
  );
}

export function isVstahSessionStorageKey(key: string): boolean {
  return key.startsWith("vstah_");
}

export function isSupabaseAuthStorageKey(key: string): boolean {
  return key.startsWith("sb-") && key.includes("-auth-token");
}
