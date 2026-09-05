import { NextResponse } from "next/server";
import { insertAgreementWithSchemaFallback, normalizeMilestoneInput, type PaymentType } from "@/lib/agreements/row";
import { normalizeVatMode } from "@/lib/agreements/vat";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";
import { isSupabaseReachable } from "@/lib/supabase/health";
import { readProviderLogoUrl } from "@/lib/agreements/logo-image";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Save agreement for a device/mock provider when cloud DB is online but user has no Supabase JWT. */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const reachable = await isSupabaseReachable(url, anonKey);
  if (!reachable) {
    return NextResponse.json({ error: "Database is offline." }, { status: 503 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  if (!client.hasServiceRole) {
    return NextResponse.json({ error: "Server cannot save agreements without service role key." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const providerId = readString(body.providerId);
  const clientName = readString(body.clientName);
  const projectTitle = readString(body.projectTitle);
  const totalPrice = readNumber(body.totalPrice);

  if (!providerId || !clientName || !projectTitle || totalPrice <= 0) {
    return NextResponse.json(
      { error: "providerId, clientName, projectTitle, and a positive totalPrice are required." },
      { status: 400 }
    );
  }

  const paymentType: PaymentType = body.paymentType === "milestones" ? "milestones" : "single";
  const rawMilestones = Array.isArray(body.milestones) ? body.milestones : [];
  const milestones = rawMilestones.map((m) => normalizeMilestoneInput(m));

  const result = await insertAgreementWithSchemaFallback(client.supabase, {
    providerId,
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
    return NextResponse.json({ error: result.error ?? "Failed to create agreement." }, { status: 500 });
  }

  return NextResponse.json({ id: result.id });
}
