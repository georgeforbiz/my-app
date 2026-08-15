import { NextRequest, NextResponse } from "next/server";
import { recordActivityEvent } from "@/lib/admin/activity";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { normalizeAgreementRow, type Milestone } from "@/lib/agreements/row";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: "Agreement must be signed." }, { status: 400 });
  }

  const { data: pending } = await supabase
    .from("deposit_verifications")
    .select("id")
    .eq("agreement_id", agreementId)
    .eq("milestone_index", milestoneIndex)
    .eq("status", "submitted")
    .maybeSingle();

  if (!pending) {
    return NextResponse.json({ error: "No submitted transfer found for this payment." }, { status: 404 });
  }

  if (milestoneIndex === -1) {
    if ((row.milestones ?? []).length > 0) {
      return NextResponse.json({ error: "Use a milestone index for milestone deals." }, { status: 400 });
    }
    if (row.payment_status !== "pending") {
      return NextResponse.json({ error: "Payment is not awaiting confirmation." }, { status: 409 });
    }
    const { error: updateError } = await supabase
      .from("agreements")
      .update({ payment_status: "escrow_held" })
      .eq("id", agreementId)
      .eq("status", "signed")
      .eq("payment_status", "pending");
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const current = (row.milestones ?? []) as Milestone[];
    const target = current[milestoneIndex];
    if (!target || (target.status ?? "pending") !== "pending") {
      return NextResponse.json({ error: "Milestone is not awaiting confirmation." }, { status: 409 });
    }
    const nextMilestones = current.map((m, i) => ({
      ...m,
      status:
        i === milestoneIndex
          ? ("escrow_held" as const)
          : m.status === "released"
            ? ("released" as const)
            : m.status === "escrow_held"
              ? ("escrow_held" as const)
              : ("pending" as const)
    }));
    const { error: updateError } = await supabase
      .from("agreements")
      .update({ milestones: nextMilestones, payment_status: "escrow_held" })
      .eq("id", agreementId)
      .eq("status", "signed");
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  await supabase
    .from("deposit_verifications")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: auth.email
    })
    .eq("id", pending.id);

  await recordActivityEvent(
    {
      actor_type: "admin",
      actor_id: auth.email,
      action: "deposit.confirmed",
      agreement_id: agreementId,
      meta: { milestoneIndex }
    },
    supabase
  );

  return NextResponse.json({ ok: true });
}
