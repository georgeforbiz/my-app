import { NextRequest, NextResponse } from "next/server";
import { recordActivityEvent } from "@/lib/admin/activity";
import { normalizeAgreementRow } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

/**
 * Client reports a bank transfer was made. Does NOT secure funds —
 * creates a deposit_verifications row for admin approval.
 */
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

  let milestoneIndex = -1;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.milestoneIndex === "number" && Number.isInteger(body.milestoneIndex)) {
      milestoneIndex = body.milestoneIndex;
    }
  } catch {
    // default total
  }

  const { data: raw, error: fetchError } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", agreementId)
    .single();

  if (fetchError || !raw) {
    return NextResponse.json({ error: fetchError?.message ?? "Agreement not found." }, { status: 404 });
  }

  const row = normalizeAgreementRow(raw as Record<string, unknown>);
  if (row.status !== "signed") {
    return NextResponse.json({ error: "Agreement must be signed before depositing." }, { status: 400 });
  }

  if (milestoneIndex === -1) {
    if ((row.milestones ?? []).length > 0) {
      return NextResponse.json({ error: "Use a milestone index for milestone deals." }, { status: 400 });
    }
    if (row.payment_status !== "pending") {
      return NextResponse.json({ error: "Payment is not awaiting deposit." }, { status: 409 });
    }
  } else {
    const milestones = row.milestones ?? [];
    const target = milestones[milestoneIndex];
    if (!target || (target.status ?? "pending") !== "pending") {
      return NextResponse.json({ error: "Milestone is not awaiting deposit." }, { status: 409 });
    }
  }

  const { data: existing } = await supabase
    .from("deposit_verifications")
    .select("id")
    .eq("agreement_id", agreementId)
    .eq("milestone_index", milestoneIndex)
    .eq("status", "submitted")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  const { error: insertError } = await supabase.from("deposit_verifications").insert({
    agreement_id: agreementId,
    milestone_index: milestoneIndex,
    status: "submitted"
  });

  if (insertError) {
    return NextResponse.json(
      {
        error:
          insertError.message.includes("deposit_verifications")
            ? "Deposit verification table missing. Run the admin SQL migration in Supabase."
            : insertError.message
      },
      { status: 500 }
    );
  }

  await recordActivityEvent(
    {
      actor_type: "user",
      action: "deposit.submitted",
      agreement_id: agreementId,
      meta: { milestoneIndex }
    },
    supabase
  );

  return NextResponse.json({ ok: true });
}
