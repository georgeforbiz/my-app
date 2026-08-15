import { NextRequest, NextResponse } from "next/server";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

/** Returns pending verification milestone indexes for a cloud agreement. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId || agreementId.startsWith("local-")) {
    return NextResponse.json({ indexes: [] });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ indexes: [] });
  }

  const { data } = await client.supabase
    .from("deposit_verifications")
    .select("milestone_index")
    .eq("agreement_id", agreementId)
    .eq("status", "submitted");

  const indexes = (data ?? []).map((r) => Number(r.milestone_index)).filter((n) => Number.isFinite(n));
  return NextResponse.json({ indexes });
}
