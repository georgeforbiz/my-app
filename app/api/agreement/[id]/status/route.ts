import { NextResponse } from "next/server";
import { isAgreementSigned } from "@/lib/agreements/status-rank";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Lightweight status read — faster than loading the full agreement row. */
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
    .select("status, client_signature")
    .eq("id", agreementId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  const row = {
    status: data.status as string,
    client_signature: data.client_signature ?? null
  };
  const status = isAgreementSigned(row)
    ? row.status === "completed"
      ? "completed"
      : "signed"
    : row.status;

  return NextResponse.json(
    {
      status,
      client_signature: row.client_signature
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache"
      }
    }
  );
}
