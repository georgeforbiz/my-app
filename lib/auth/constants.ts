/** Where providers land after signing out of the dashboard. */
export const LOGIN_AFTER_LOGOUT = "/login?next=%2Fdashboard";

/** Set while sign-out is in progress so auth guards do not client-navigate to the wrong page. */
export const SIGNING_OUT_STORAGE_KEY = "vstah_signing_out";
export const SIGNING_OUT_COOKIE = "vstah_signing_out";

export function markSigningOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SIGNING_OUT_STORAGE_KEY, "1");
  document.cookie = `${SIGNING_OUT_COOKIE}=1; path=/; max-age=15; samesite=lax`;
}

export function clearSigningOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNING_OUT_STORAGE_KEY);
  document.cookie = `${SIGNING_OUT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function isSigningOut(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SIGNING_OUT_STORAGE_KEY) === "1";
}

export function redirectToLoginAfterLogout(): void {
  if (typeof window === "undefined") return;
  window.location.replace(LOGIN_AFTER_LOGOUT);
}
