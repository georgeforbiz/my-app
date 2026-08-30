import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { humanizeAuthError, isAuthNetworkError } from "@/lib/auth/humanize-auth-error";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Auth server is not configured.", code: "NO_SUPABASE" },
      { status: 503 }
    );
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const status = isAuthNetworkError(error.message) ? 503 : 401;
      return NextResponse.json({ error: humanizeAuthError(error.message) }, { status });
    }

    if (!data.session?.access_token || !data.session.refresh_token || !data.user) {
      return NextResponse.json(
        {
          error:
            "Your account exists but is not ready to sign in yet. Confirm your email, then try again."
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email ?? email
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach auth server.";
    return NextResponse.json({ error: humanizeAuthError(message) }, { status: 503 });
  }
}
