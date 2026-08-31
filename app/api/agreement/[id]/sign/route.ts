import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordActivityEvent } from "@/lib/admin/activity";
import { hasStoredClientSignature, isValidSignatureDataUrl } from "@/lib/agreements/status-rank";
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
  normalizedSignature: string
): Promise<{ row: AgreementSignRow | null; lastError: string | null }> {
  const signedPayload = { status: "signed", client_signature: normalizedSignature };

  const attempts: Array<{ payload: Record<string, unknown>; requirePending: boolean }> = [
    { payload: signedPayload, requirePending: true },
    { payload: signedPayload, requirePending: false }
  ];

  let updatedRow: AgreementSignRow | null = null;
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
      updatedRow = verified;
      break;
    }
  }

  if (updatedRow && !hasStoredClientSignature(updatedRow)) {
    const patched = await patchClientSignature(supabase, agreementId, normalizedSignature);
    if (patched) updatedRow = patched;
    else lastError = lastError ?? "Unable to save client signature.";
  }

  if (!updatedRow || !hasStoredClientSignature(updatedRow)) {
    return { row: null, lastError: lastError ?? "Unable to save client signature." };
  }

  return { row: updatedRow, lastError: null };
}

async function patchClientSignature(
  supabase: SupabaseClient,
  agreementId: string,
  normalizedSignature: string
): Promise<AgreementSignRow | null> {
  const { error } = await supabase
    .from("agreements")
    .update({ client_signature: normalizedSignature })
    .eq("id", agreementId);

  if (error) return null;
  return readAgreementRow(supabase, agreementId);
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
    typeof signature === "string" && isValidSignatureDataUrl(signature.trim())
      ? signature.trim()
      : null;

  if (existing.status === "signed" || existing.status === "completed") {
    if (normalizedSignature && !hasStoredClientSignature(existing)) {
      const patched = await patchClientSignature(supabase, agreementId, normalizedSignature);
      const row = patched ?? existing;
      const signatureStored = hasStoredClientSignature(row);
      return NextResponse.json({
        ok: true,
        alreadySigned: true,
        status: row.status,
        signatureSaved: true,
        signatureStored
      });
    }
    return NextResponse.json({
      ok: true,
      alreadySigned: true,
      status: existing.status,
      signatureStored:
        hasStoredClientSignature(existing)
    });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Agreement is not in a signable state." }, { status: 409 });
  }

  if (!normalizedSignature) {
    return NextResponse.json(
      { error: "A drawn signature is required. Please sign in the box before accepting." },
      { status: 400 }
    );
  }

  const { row: updatedRow, lastError } = await persistSignedAgreement(
    supabase,
    agreementId,
    normalizedSignature
  );

  if (!updatedRow || !hasStoredClientSignature(updatedRow)) {
    return NextResponse.json(
      {
        error:
          lastError ??
          "Unable to sign this agreement. The signature could not be saved."
      },
      { status: 403 }
    );
  }

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
    signatureSaved: true,
    signatureStored: true
  });
}
