import { NextResponse } from "next/server";
import { isSupabaseReachable } from "@/lib/supabase/health";

/** Public Supabase client config — anon key is safe to expose; loaded at runtime for Vercel. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { configured: false, reachable: false, error: "Auth server is not configured." },
      { status: 503 }
    );
  }

  const reachable = await isSupabaseReachable(url, anonKey);

  return NextResponse.json({
    configured: true,
    reachable,
    url,
    anonKey,
    ...(reachable
      ? {}
      : {
          error:
            "Supabase project URL does not exist or is offline. Replace it with a live project from supabase.com."
        })
  });
}
