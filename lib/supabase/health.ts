/** Quick check that the configured Supabase host responds (DNS + HTTP). */
export async function isSupabaseReachable(url: string, apiKey: string): Promise<boolean> {
  const base = url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/auth/v1/health`, {
      headers: { apikey: apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
    return res.status > 0;
  } catch {
    return false;
  }
}

export const SUPABASE_OFFLINE_MESSAGE =
  "Your online database is not connected. Create a free project at supabase.com, then add the URL and keys to Vercel. Until then, accounts work on this device only.";
