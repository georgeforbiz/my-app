/** Maps Supabase GoTrue messages to short, actionable copy for the UI. */
export function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Your account exists, but email confirmation is still required. Open your email inbox, click the confirmation link, then log in again.";
  }
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password, or your email is not confirmed yet.";
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
