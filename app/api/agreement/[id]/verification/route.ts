import { NextRequest, NextResponse } from "next/server";
import { withAdminTimeout } from "@/lib/admin/with-timeout";
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

  let data: Array<{ milestone_index: number }> | null = [];
  try {
    const result = await withAdminTimeout(
      client.supabase
        .from("deposit_verifications")
        .select("milestone_index")
        .eq("agreement_id", agreementId)
        .eq("status", "submitted")
    );
    data = result.data as Array<{ milestone_index: number }> | null;
  } catch {
    return NextResponse.json({ indexes: [] });
  }

  const indexes = (data ?? []).map((r) => Number(r.milestone_index)).filter((n) => Number.isFinite(n));
  return NextResponse.json({ indexes });
}
