import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminEmail, verifyAdminToken } from "@/lib/admin/session";

export type AdminAuth =
  | { ok: true; email: string }
  | { ok: false; response: NextResponse };

/** Require a valid admin session cookie. Call at the top of every /api/admin/* data route. */
export function requireAdmin(): AdminAuth {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin authentication required." }, { status: 401 })
    };
  }
  return { ok: true, email: getAdminEmail() };
}
