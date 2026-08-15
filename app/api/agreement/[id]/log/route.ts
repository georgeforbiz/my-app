import { NextRequest, NextResponse } from "next/server";
import { recordActivityEvent, type ActivityAction } from "@/lib/admin/activity";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

const ALLOWED: ActivityAction[] = [
  "agreement.created",
  "agreement.signed",
  "deposit.submitted",
  "deposit.confirmed"
];

/** Lightweight product-side activity logger (service role). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  let action: ActivityAction = "agreement.created";
  let meta: Record<string, unknown> = {};
  try {
    const body = await request.json();
    if (typeof body?.action === "string" && ALLOWED.includes(body.action as ActivityAction)) {
      action = body.action as ActivityAction;
    }
    if (body?.meta && typeof body.meta === "object") meta = body.meta as Record<string, unknown>;
  } catch {
    // default created
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Local demo ids are not in Supabase — still record with null agreement_id.
  const isLocal = agreementId.startsWith("local-");
  if (!isLocal) {
    const { data } = await client.supabase.from("agreements").select("id").eq("id", agreementId).maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
    }
  }

  await recordActivityEvent(
    {
      actor_type: "user",
      action,
      agreement_id: isLocal ? null : agreementId,
      meta: isLocal ? { ...meta, localAgreementId: agreementId } : meta
    },
    client.supabase
  );

  return NextResponse.json({ ok: true });
}
