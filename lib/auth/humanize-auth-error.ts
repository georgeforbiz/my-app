/** Maps Supabase GoTrue messages to short, actionable copy for the UI. */
import { SUPABASE_OFFLINE_MESSAGE } from "@/lib/supabase/health";

export const EMAIL_ALREADY_EXISTS_MESSAGE =
  "An account with this email already exists. Please log in instead.";

export function isEmailAlreadyRegisteredError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("user already") ||
    m.includes("email address has already been registered") ||
    m.includes("user_already_exists") ||
    (m.includes("duplicate") && m.includes("email")) ||
    (m.includes("unique") && m.includes("email"))
  );
}

export function isAuthNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("networkerror") ||
    m.includes("econnrefused") ||
    m.includes("enotfound") ||
    m.includes("timed out") ||
    m.includes("timeout") ||
    m.includes("aborted") ||
    m.includes("could not reach") ||
    m.includes("not configured") ||
    m.includes("supabase unreachable")
  );
}

export function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (isAuthNetworkError(message)) {
    return SUPABASE_OFFLINE_MESSAGE;
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Your account exists, but email confirmation is still required. Open your email inbox, click the confirmation link, then log in again.";
  }
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password, or your email is not confirmed yet.";
  }
  if (isEmailAlreadyRegisteredError(message)) {
    return EMAIL_ALREADY_EXISTS_MESSAGE;
  }
  if (m.includes("email rate limit") || (m.includes("rate limit") && m.includes("email"))) {
    return (
      "Too many confirmation emails were sent recently (Supabase security limit). " +
      "Wait about an hour and try again, or use another Wi‑Fi/mobile data. " +
      "Project owners: Supabase Dashboard → Authentication → Emails — adjust rate limits or SMTP, " +
      "or turn off “Confirm email” while testing."
    );
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return message;
}
