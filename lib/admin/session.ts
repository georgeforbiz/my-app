import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin credentials are independent of customer accounts (Supabase / mock auth).
 * Set ADMIN_EMAIL + ADMIN_PASSWORD in the environment; production requires them.
 */
const DEV_DEFAULT_EMAIL = "admin@vstah.local";
const DEV_DEFAULT_PASSWORD = "VstahAdmin2026!";

export const ADMIN_COOKIE = "vstah_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type AdminCredentials = { email: string; password: string };

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) return { email, password };
  if (process.env.NODE_ENV === "production") return null;
  return { email: DEV_DEFAULT_EMAIL, password: DEV_DEFAULT_PASSWORD };
}

function signToken(email: string, password: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || password;
  return createHmac("sha256", secret).update(`admin:${email}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createAdminToken(): string | null {
  const creds = getAdminCredentials();
  if (!creds) return null;
  return signToken(creds.email, creds.password);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (!creds) return false;
  return (
    safeEqual(email.trim().toLowerCase(), creds.email) && safeEqual(password, creds.password)
  );
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = createAdminToken();
  if (!expected) return false;
  return safeEqual(token, expected);
}

export function getAdminEmail(): string {
  return getAdminCredentials()?.email ?? "";
}
