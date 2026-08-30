import { NextResponse } from "next/server";

/** Public Supabase client config — anon key is safe to expose; loaded at runtime for Vercel. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { configured: false, error: "Auth server is not configured." },
      { status: 503 }
    );
  }

  return NextResponse.json({ configured: true, url, anonKey });
}
