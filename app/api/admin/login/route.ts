import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
  getAdminCredentials,
  verifyAdminCredentials
} from "@/lib/admin/session";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!getAdminCredentials()) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD." },
      { status: 503 }
    );
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
  }

  const token = createAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true, email: email.trim().toLowerCase() });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
  return res;
}
