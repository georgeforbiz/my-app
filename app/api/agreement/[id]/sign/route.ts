import { NextRequest, NextResponse } from "next/server";
import { recordActivityEvent } from "@/lib/admin/activity";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  const { supabase } = client;

  const { data: existing, error: readError } = await supabase
    .from("agreements")
    .select("id,status")
    .eq("id", agreementId)
    .single();

  if (readError || !existing) {
    return NextResponse.json({ error: readError?.message ?? "Agreement not found." }, { status: 404 });
  }

  if (existing.status === "signed" || existing.status === "completed") {
    return NextResponse.json({ ok: true, alreadySigned: true });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Agreement is not in a signable state." }, { status: 409 });
  }

  let signature: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.signature === "string" && body.signature.length > 0) {
      signature = body.signature;
    }
  } catch {
    // no JSON body
  }

  const normalizedSignature =
    typeof signature === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(signature.trim())
      ? signature.trim()
      : null;

  const updatePayload: Record<string, unknown> = { status: "signed" };
  if (normalizedSignature) {
    updatePayload.client_signature = normalizedSignature;
  }

  const { data: updatedRows, error: statusError } = await supabase
    .from("agreements")
    .update(updatePayload)
    .eq("id", agreementId)
    .eq("status", "pending")
    .select("id,status,client_signature");

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      {
        error:
          "Unable to sign this agreement. The row was not updated (likely RLS policy or missing SUPABASE_SERVICE_ROLE_KEY)."
      },
      { status: 403 }
    );
  }

  const updatedRow = updatedRows[0] as { client_signature?: string | null };
  const signatureStored =
    typeof updatedRow?.client_signature === "string" && updatedRow.client_signature.length > 0;

  await recordActivityEvent(
    {
      actor_type: "user",
      action: "agreement.signed",
      agreement_id: agreementId,
      meta: { signatureSaved: Boolean(normalizedSignature) }
    },
    supabase
  );

  return NextResponse.json({
    ok: true,
    signatureSaved: Boolean(normalizedSignature),
    signatureStored
  });
}
