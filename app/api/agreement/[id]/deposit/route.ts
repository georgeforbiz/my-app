import { NextRequest, NextResponse } from "next/server";
import { normalizeAgreementRow, type Milestone } from "@/lib/agreements/row";
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

  const { data: raw, error: fetchError } = await supabase.from("agreements").select("*").eq("id", agreementId).single();
  if (fetchError || !raw) {
    return NextResponse.json({ error: fetchError?.message ?? "Agreement not found." }, { status: 404 });
  }

  const row = normalizeAgreementRow(raw as Record<string, unknown>);
  if (row.status !== "signed") {
    return NextResponse.json({ error: "Agreement must be signed before depositing funds." }, { status: 400 });
  }

  let milestoneIndex: number | null = null;
  let confirmOutOfOrder = false;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.milestoneIndex === "number" && Number.isInteger(body.milestoneIndex)) {
      milestoneIndex = body.milestoneIndex;
    }
    if (body?.confirmOutOfOrder === true) confirmOutOfOrder = true;
  } catch {
    // empty body → single-payment deposit
  }

  const isMilestones = row.payment_type === "milestones" && (row.milestones?.length ?? 0) > 0;

  if (!isMilestones && row.payment_status !== "pending") {
    return NextResponse.json({ error: "Deposit is only allowed while payment is pending." }, { status: 409 });
  }
  if (isMilestones && row.payment_status !== "pending" && row.payment_status !== "escrow_held") {
    return NextResponse.json({ error: "Invalid payment state for milestone deposit." }, { status: 409 });
  }

  if (isMilestones) {
    if (milestoneIndex === null) {
      return NextResponse.json({ error: "milestoneIndex is required for milestone agreements." }, { status: 400 });
    }
    const current = (row.milestones ?? []) as Milestone[];
    if (milestoneIndex < 0 || milestoneIndex >= current.length) {
      return NextResponse.json({ error: "Invalid milestone index." }, { status: 400 });
    }
    const target = current[milestoneIndex];
    if (!target || target.status !== "pending") {
      return NextResponse.json({ error: "This milestone is not awaiting deposit." }, { status: 409 });
    }
    if (milestoneIndex > 0) {
      const previous = current[milestoneIndex - 1];
      const previousFinished = previous?.status === "released";
      if (!previousFinished && !confirmOutOfOrder) {
        return NextResponse.json(
          { error: "Previous milestone is not released yet.", code: "OUT_OF_ORDER" },
          { status: 409 }
        );
      }
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

    const { data: updatedRows, error: updateError } = await supabase
      .from("agreements")
      .update({ milestones: nextMilestones, payment_status: "escrow_held" })
      .eq("id", agreementId)
      .eq("status", "signed")
      .in("payment_status", ["pending", "escrow_held"])
      .select("id,payment_status");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { error: "Deposit was not applied. Check service role key and RLS policies." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Single total payment (no milestone rows)
  const { data: updatedRows, error: updateError } = await supabase
    .from("agreements")
    .update({ payment_status: "escrow_held" })
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "pending")
    .select("id,payment_status");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      { error: "Deposit was not applied. Check service role key and RLS policies." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}
