import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminEmail, verifyAdminToken } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const authenticated = verifyAdminToken(token);
  return NextResponse.json({
    authenticated,
    email: authenticated ? getAdminEmail() : ""
  });
}
