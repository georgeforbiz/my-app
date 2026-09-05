import { NextRequest, NextResponse } from "next/server";
import { insertAgreementWithSchemaFallback, normalizeMilestoneInput, type PaymentType } from "@/lib/agreements/row";
import { normalizeVatMode } from "@/lib/agreements/vat";
import {
  getAgreementMutationClient,
  getAgreementServerClient,
  readBearerToken
} from "@/lib/supabase/agreement-server";
import { readProviderLogoUrl } from "@/lib/agreements/logo-image";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Authenticated create — persists to Supabase with service role so client links work everywhere. */
export async function POST(request: NextRequest) {
  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }

  const authHeader = request.headers.get("authorization");
  const token = readBearerToken(authHeader);
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

  const insertClient = getAgreementMutationClient(client, token);
  if ("error" in insertClient) {
    return NextResponse.json({ error: insertClient.error }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clientName = readString(body.clientName);
  const projectTitle = readString(body.projectTitle);
  const totalPrice = readNumber(body.totalPrice);

  if (!clientName || !projectTitle || totalPrice <= 0) {
    return NextResponse.json(
      { error: "clientName, projectTitle, and a positive totalPrice are required." },
      { status: 400 }
    );
  }

  const paymentType: PaymentType = body.paymentType === "milestones" ? "milestones" : "single";
  const rawMilestones = Array.isArray(body.milestones) ? body.milestones : [];
  const milestones = rawMilestones.map((m) => normalizeMilestoneInput(m));

  const result = await insertAgreementWithSchemaFallback(insertClient, {
    providerId: user.id,
    providerName: readString(body.providerName) || "Service Provider",
    full_name: readString(body.full_name) || null,
    business_name: readString(body.business_name) || null,
    clientName,
    projectTitle,
    serviceArea: readString(body.serviceArea),
    customTerms: readString(body.customTerms),
    scopeOfWork: readString(body.scopeOfWork),
    scopeExclusions: readString(body.scopeExclusions) || undefined,
    estimatedCompletionDate: readString(body.estimatedCompletionDate) || undefined,
    deadline: readString(body.deadline) || undefined,
    providerPhone: readString(body.providerPhone) || undefined,
    clientPhone: readString(body.clientPhone) || undefined,
    providerEmail: readString(body.providerEmail) || undefined,
    clientEmail: readString(body.clientEmail) || undefined,
    vatMode: normalizeVatMode(body.vatMode),
    totalPrice,
    paymentType,
    milestones: paymentType === "milestones" ? milestones : [],
    providerLogoUrl: readProviderLogoUrl(body.providerLogoUrl)
  });

  if (result.error || !result.id) {
    return NextResponse.json(
      { error: result.error ?? "Failed to create agreement." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: result.id });
}
