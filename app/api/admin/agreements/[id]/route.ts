import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { normalizeAgreementRow } from "@/lib/agreements/row";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;

  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAdminSupabase();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }

  const { data, error } = await client.supabase
    .from("agreements")
    .select("*")
    .eq("id", agreementId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  return NextResponse.json({
    agreement: normalizeAgreementRow(data as Record<string, unknown>)
  });
}
