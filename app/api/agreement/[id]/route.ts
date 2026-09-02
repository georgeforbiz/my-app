import { NextRequest, NextResponse } from "next/server";
import { fetchAgreementById } from "@/lib/agreements/load-server";
import {
  isMissingColumnOrSchemaCacheError,
  mapMilestoneFromStorage,
  normalizeMilestoneInput,
  type PaymentType
} from "@/lib/agreements/row";
import { appendPhonesToTerms } from "@/lib/agreements/phone-metadata";
import { isAgreementEditable } from "@/lib/agreements/status-rank";
import { appendVatModeToTerms, normalizeVatMode } from "@/lib/agreements/vat";
import {
  getAgreementMutationClient,
  getAgreementServerClient,
  readBearerToken
} from "@/lib/supabase/agreement-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Public read — used when the browser Supabase client is unavailable or RLS blocks anon reads. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const agreementId = params.id?.trim();
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const agreement = await fetchAgreementById(agreementId);

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  return NextResponse.json(
    { agreement },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache"
      }
    }
  );
}

/**
 * Provider-only update for unsigned (pending) deals.
 * Editable: custom_terms, milestones (+ target dates), estimated_completion_date, payment_type, total_price.
 * Locked once signed / active.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id?.trim();
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }

  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError
  } = await client.supabase.auth.getUser(token);

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const mutationClient = getAgreementMutationClient(client, token);
  if ("error" in mutationClient) {
    return NextResponse.json({ error: mutationClient.error }, { status: 500 });
  }

  const existing = await fetchAgreementById(agreementId);
  if (!existing) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  if (existing.provider_id !== user.id) {
    return NextResponse.json({ error: "Only the deal creator can edit this agreement." }, { status: 403 });
  }

  if (!isAgreementEditable(existing)) {
    return NextResponse.json(
      { error: "Signed or active agreements cannot be edited." },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const customTerms = readString(body.customTerms);
  const paymentType: PaymentType = body.paymentType === "milestones" ? "milestones" : "single";
  const rawMilestones = Array.isArray(body.milestones) ? body.milestones : [];
  const milestones = rawMilestones.map((m) => normalizeMilestoneInput(m));
  const totalPrice = readNumber(body.totalPrice);
  const estimatedCompletionDate = readString(body.estimatedCompletionDate) || null;

  if (paymentType === "milestones") {
    if (milestones.length === 0 || milestones.some((m) => !m.title || m.amount <= 0)) {
      return NextResponse.json({ error: "Each milestone needs a title and positive amount." }, { status: 400 });
    }
    const milestonesTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(milestonesTotal - totalPrice) > 0.0001) {
      return NextResponse.json({ error: "Milestone amounts must equal the total price." }, { status: 400 });
    }
  } else if (totalPrice <= 0) {
    return NextResponse.json({ error: "A positive totalPrice is required." }, { status: 400 });
  }

  const vatMode = normalizeVatMode(existing.vat_mode);
  const customTermsStored = appendPhonesToTerms(appendVatModeToTerms(customTerms, vatMode), {
    providerPhone: existing.provider_phone,
    clientPhone: existing.client_phone
  });

  const normalizedMilestones =
    paymentType === "milestones"
      ? milestones.map((m) => mapMilestoneFromStorage({ ...m, status: "pending" }))
      : [];

  const payload: Record<string, unknown> = {
    custom_terms: customTermsStored,
    payment_type: paymentType,
    milestones: normalizedMilestones,
    total_price: totalPrice,
    estimated_completion_date: estimatedCompletionDate
  };

  const attempts: Record<string, unknown>[] = [
    payload,
    // Older schemas may lack estimated_completion_date
    {
      custom_terms: customTermsStored,
      payment_type: paymentType,
      milestones: normalizedMilestones,
      total_price: totalPrice
    },
    // Legacy payment_terms JSON blob
    {
      custom_terms: customTermsStored,
      total_price: totalPrice,
      payment_terms:
        paymentType === "milestones"
          ? JSON.stringify({
              vstahVersion: 1,
              payment_type: "milestones",
              milestones: normalizedMilestones
            })
          : "single"
    }
  ];

  let lastError: string | undefined;
  for (const attempt of attempts) {
    const { data, error } = await mutationClient
      .from("agreements")
      .update(attempt)
      .eq("id", agreementId)
      .eq("provider_id", user.id)
      .eq("status", "pending")
      .select("id,status")
      .maybeSingle();

    if (!error && data?.id) {
      const agreement = await fetchAgreementById(agreementId);
      return NextResponse.json({ id: data.id, agreement: agreement ?? undefined });
    }

    lastError = error?.message;
    if (error && !isMissingColumnOrSchemaCacheError(error.message)) {
      // Concurrent sign / ownership race
      if (/0 rows|no rows|PGRST116/i.test(error.message ?? "")) {
        return NextResponse.json(
          { error: "Signed or active agreements cannot be edited." },
          { status: 409 }
        );
      }
      break;
    }
  }

  // Re-check lock in case the deal was signed during the request
  const refreshed = await fetchAgreementById(agreementId);
  if (refreshed && !isAgreementEditable(refreshed)) {
    return NextResponse.json(
      { error: "Signed or active agreements cannot be edited." },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { error: lastError ?? "Failed to update agreement." },
    { status: 500 }
  );
}
