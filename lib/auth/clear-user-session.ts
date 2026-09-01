import { clearSigningOut } from "@/lib/auth/constants";
import {
  isSupabaseAuthStorageKey,
  isVstahSessionStorageKey,
  LEGACY_MOCK_PLAN_KEY,
  LEGACY_PROVIDER_LOGO_KEY,
  MOCK_SESSION_KEY,
  mockPlanStorageKey,
  providerLogoStorageKey
} from "@/lib/auth/storage-keys";
import { clearStoredProviderLogo } from "@/lib/agreements/logo-image";
import { clearLocalAgreementsForProvider, listLocalAgreements } from "@/lib/agreements/local-store";
import { clearAgreementCachesForProvider } from "@/lib/agreements/signed-cache";
import { clearVerificationPendingForAgreementIds } from "@/lib/agreements/verification-pending";
import { mockLogout } from "@/lib/auth/mock-storage";

function removeLocalStorageKeysMatching(predicate: (key: string) => boolean): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && predicate(key)) keys.push(key);
  }
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

function removeSessionStorageKeysMatching(predicate: (key: string) => boolean): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && predicate(key)) keys.push(key);
  }
  for (const key of keys) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/** Remove browser-local data tied to the departing authenticated user. */
export function clearUserSessionData(userId: string): void {
  if (!userId || typeof window === "undefined") return;

  const localAgreementIds = listLocalAgreements(userId).map((row) => row.id);

  clearStoredProviderLogo(userId);
  clearVerificationPendingForAgreementIds(localAgreementIds);
  clearLocalAgreementsForProvider(userId);
  clearAgreementCachesForProvider(userId);

  try {
    localStorage.removeItem(LEGACY_PROVIDER_LOGO_KEY);
    localStorage.removeItem(providerLogoStorageKey(userId));
    localStorage.removeItem(`${providerLogoStorageKey(userId)}:ts`);
    localStorage.removeItem(mockPlanStorageKey(userId));
    localStorage.removeItem(LEGACY_MOCK_PLAN_KEY);
  } catch {
    // private mode / disabled storage
  }
}

/**
 * Full browser purge on logout: localStorage, sessionStorage, Supabase auth keys,
 * and per-user caches. Preserves global preferences (language).
 */
export function purgeBrowserSessionState(userId?: string): void {
  if (typeof window === "undefined") return;

  if (userId) {
    clearUserSessionData(userId);
  }

  mockLogout();

  removeLocalStorageKeysMatching(
    (key) =>
      key === MOCK_SESSION_KEY ||
      key === LEGACY_PROVIDER_LOGO_KEY ||
      key === LEGACY_MOCK_PLAN_KEY ||
      isSupabaseAuthStorageKey(key)
  );

  removeSessionStorageKeysMatching(isVstahSessionStorageKey);

  clearSigningOut();
}
