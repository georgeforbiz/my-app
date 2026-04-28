import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAgreementRow, type Milestone } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

async function updateReleaseStatusWithCompatibility(
  supabase: SupabaseClient,
  agreementId: string,
  payload: Record<string, unknown>
) {
  const tryReleased = await supabase
    .from("agreements")
    .update(payload)
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "escrow_held")
    .select("id,payment_status,status");

  if (!tryReleased.error) return tryReleased;
  const msg = tryReleased.error.message?.toLowerCase() ?? "";
  if (!(msg.includes("check_payment_status") || msg.includes("payment_status"))) return tryReleased;

  // Legacy DBs use `paid` instead of `released`.
  const fallbackPayload = { ...payload, payment_status: "paid" };
  return supabase
    .from("agreements")
    .update(fallbackPayload)
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "escrow_held")
    .select("id,payment_status,status");
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

  const { data: raw, error: fetchError } = await supabase.from("agreements").select("*").eq("id", agreementId).single();
  if (fetchError || !raw) {
    return NextResponse.json({ error: fetchError?.message ?? "Agreement not found." }, { status: 404 });
  }

  const row = normalizeAgreementRow(raw as Record<string, unknown>);
  if (row.status !== "signed") {
    return NextResponse.json({ error: "Funds can only be released from a signed agreement." }, { status: 400 });
  }
  if (row.payment_status !== "escrow_held") {
    return NextResponse.json({ error: "Funds are not held in escrow for release." }, { status: 409 });
  }

  let milestoneIndex: number | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.milestoneIndex === "number" && Number.isInteger(body.milestoneIndex)) {
      milestoneIndex = body.milestoneIndex;
    }
  } catch {
    // single-payment release: no body
  }

  const isMilestones = row.payment_type === "milestones" && (row.milestones?.length ?? 0) > 0;

  if (isMilestones) {
    if (milestoneIndex === null) {
      return NextResponse.json({ error: "milestoneIndex is required for milestone agreements." }, { status: 400 });
    }
    const current = (row.milestones ?? []) as Milestone[];
    if (milestoneIndex < 0 || milestoneIndex >= current.length) {
      return NextResponse.json({ error: "Invalid milestone index." }, { status: 400 });
    }
    const target = current[milestoneIndex];
    if (!target || target.status !== "escrow_held") {
      return NextResponse.json({ error: "This milestone is not in escrow for release." }, { status: 409 });
    }

    const nextMilestones = current.map((m, i) => (i === milestoneIndex ? { ...m, status: "released" as const } : m));
    const allReleased = nextMilestones.every((m) => m.status === "released");
    const updatePayload = {
      milestones: nextMilestones,
      payment_status: allReleased ? ("released" as const) : ("escrow_held" as const),
      status: allReleased ? ("completed" as const) : ("signed" as const)
    };

    const { data: updatedRows, error: updateError } = await updateReleaseStatusWithCompatibility(
      supabase,
      agreementId,
      updatePayload
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { error: "Release was not applied. Check service role key and RLS policies." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (milestoneIndex !== null) {
    return NextResponse.json({ error: "milestoneIndex must not be sent for single-payment agreements." }, { status: 400 });
  }

  const { data: updatedRows, error: updateError } = await updateReleaseStatusWithCompatibility(
    supabase,
    agreementId,
    { payment_status: "released", status: "completed" }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      { error: "Release was not applied. Check service role key and RLS policies." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}
