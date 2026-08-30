import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordActivityEvent } from "@/lib/admin/activity";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

type AgreementSignRow = {
  id: string;
  status: string;
  client_signature?: string | null;
};

async function readAgreementRow(
  supabase: SupabaseClient,
  agreementId: string
): Promise<AgreementSignRow | null> {
  const { data, error } = await supabase
    .from("agreements")
    .select("id,status,client_signature")
    .eq("id", agreementId)
    .single();

  if (error || !data) return null;
  return data as AgreementSignRow;
}

/** Apply sign update and confirm by re-reading the row (PostgREST `.select()` after update can return 0 rows under RLS). */
async function persistSignedAgreement(
  supabase: SupabaseClient,
  agreementId: string,
  normalizedSignature: string | null
): Promise<{ row: AgreementSignRow | null; lastError: string | null }> {
  const attempts: Array<{ payload: Record<string, unknown>; requirePending: boolean }> = [
    {
      payload: {
        status: "signed",
        ...(normalizedSignature ? { client_signature: normalizedSignature } : {})
      },
      requirePending: true
    },
    { payload: { status: "signed" }, requirePending: true },
    {
      payload: {
        status: "signed",
        ...(normalizedSignature ? { client_signature: normalizedSignature } : {})
      },
      requirePending: false
    },
    { payload: { status: "signed" }, requirePending: false }
  ];

  let lastError: string | null = null;

  for (const attempt of attempts) {
    let query = supabase.from("agreements").update(attempt.payload).eq("id", agreementId);
    if (attempt.requirePending) {
      query = query.eq("status", "pending");
    }

    const { error } = await query;
    if (error) {
      lastError = error.message;
      continue;
    }

    const verified = await readAgreementRow(supabase, agreementId);
    if (verified?.status === "signed" || verified?.status === "completed") {
      return { row: verified, lastError: null };
    }
  }

  return { row: null, lastError };
}

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

  const existing = await readAgreementRow(supabase, agreementId);

  if (!existing) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  if (existing.status === "signed" || existing.status === "completed") {
    return NextResponse.json({ ok: true, alreadySigned: true, status: existing.status });
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

  const { row: updatedRow, lastError } = await persistSignedAgreement(
    supabase,
    agreementId,
    normalizedSignature
  );

  if (!updatedRow) {
    return NextResponse.json(
      {
        error:
          lastError ??
          "Unable to sign this agreement. It may already be signed, or the server could not save the update."
      },
      { status: 403 }
    );
  }

  const signatureStored =
    typeof updatedRow.client_signature === "string" && updatedRow.client_signature.length > 0;

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
    status: updatedRow.status,
    signatureSaved: Boolean(normalizedSignature),
    signatureStored
  });
}
