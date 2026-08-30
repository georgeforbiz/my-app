import { NextResponse } from "next/server";
import { normalizeAgreementRow } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public read — used when the browser Supabase client is unavailable or RLS blocks anon reads. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const agreementId = params.id?.trim();
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }

  const { data, error } = await client.supabase
    .from("agreements")
    .select("*")
    .eq("id", agreementId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      agreement: normalizeAgreementRow(data as Record<string, unknown>)
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache"
      }
    }
  );
}
