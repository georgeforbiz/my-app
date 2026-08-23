import { NextRequest, NextResponse } from "next/server";
import { recordActivityEvent } from "@/lib/admin/activity";
import { withAdminTimeout } from "@/lib/admin/with-timeout";
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

  let raw: unknown = null;
  let fetchError: { message: string } | null = null;
  try {
    ({ data: raw, error: fetchError } = await withAdminTimeout(
      supabase.from("agreements").select("*").eq("id", agreementId).single()
    ));
  } catch {
    return NextResponse.json({ error: "Supabase is unavailable." }, { status: 503 });
  }

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

  let existing: { id: string } | null = null;
  try {
    const result = await withAdminTimeout(
      supabase
        .from("deposit_verifications")
        .select("id")
        .eq("agreement_id", agreementId)
        .eq("milestone_index", milestoneIndex)
        .eq("status", "submitted")
        .maybeSingle()
    );
    existing = result.data as { id: string } | null;
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Supabase is unavailable." }, { status: 503 });
  }

  if (existing) {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  let insertError: { message: string } | null = null;
  try {
    ({ error: insertError } = await withAdminTimeout(
      supabase.from("deposit_verifications").insert({
        agreement_id: agreementId,
        milestone_index: milestoneIndex,
        status: "submitted"
      })
    ));
  } catch {
    return NextResponse.json({ error: "Supabase is unavailable." }, { status: 503 });
  }

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
