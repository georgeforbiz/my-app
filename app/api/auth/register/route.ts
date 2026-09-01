import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { recordActivityEvent } from "@/lib/admin/activity";
import { humanizeAuthError, isAuthNetworkError, EMAIL_ALREADY_EXISTS_MESSAGE, isEmailAlreadyRegisteredError } from "@/lib/auth/humanize-auth-error";

type RegisterBody = {
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const metadata = body.metadata ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Auth server is not configured.", code: "NO_SERVICE_KEY" }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let data: Awaited<ReturnType<typeof admin.auth.admin.createUser>>["data"];
  let error: Awaited<ReturnType<typeof admin.auth.admin.createUser>>["error"];
  try {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    data = result.data;
    error = result.error;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach auth server.";
    return NextResponse.json({ error: message, code: "SUPABASE_UNREACHABLE" }, { status: 503 });
  }

  if (error) {
    if (isEmailAlreadyRegisteredError(error.message)) {
      return NextResponse.json({ error: EMAIL_ALREADY_EXISTS_MESSAGE }, { status: 409 });
    }
    if (isAuthNetworkError(error.message)) {
      return NextResponse.json(
        { error: error.message, code: "SUPABASE_UNREACHABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: humanizeAuthError(error.message) }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }

  await recordActivityEvent(
    {
      actor_type: "user",
      actor_id: data.user.id,
      action: "user.registered",
      meta: { email }
    },
    admin
  );

  return NextResponse.json({ ok: true, userId: data.user.id });
}
