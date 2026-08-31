import { NextResponse } from "next/server";
import { fetchAgreementById } from "@/lib/agreements/load-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public read — used when the browser Supabase client is unavailable or RLS blocks anon reads. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const agreementId = params.id?.trim();
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const agreement = await fetchAgreementById(agreementId);

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  return NextResponse.json(
    { agreement },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache"
      }
    }
  );
}
