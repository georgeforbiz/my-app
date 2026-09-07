import { LOGIN_FOR_DASHBOARD, ROUTES, loginUrl } from "@/lib/routes";

/** Where providers land after signing out of the dashboard. */
export const LOGIN_AFTER_LOGOUT = LOGIN_FOR_DASHBOARD;

/** Set while sign-out is in progress so auth guards do not client-navigate to the wrong page. */
export const SIGNING_OUT_STORAGE_KEY = "vstah_signing_out";
export const SIGNING_OUT_COOKIE = "vstah_signing_out";

/** Set when Supabase fires PASSWORD_RECOVERY so the user can set a new password. */
export const PASSWORD_RECOVERY_STORAGE_KEY = "vstah_password_recovery";

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

export function markPasswordRecovery(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "1");
}

export function clearPasswordRecovery(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

export function isPasswordRecovery(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "1";
}

export function redirectToLogin(next: string = ROUTES.dashboard): void {
  if (typeof window === "undefined") return;
  window.location.replace(loginUrl(next));
}

export function redirectToLoginAfterLogout(): void {
  redirectToLogin(ROUTES.dashboard);
}
