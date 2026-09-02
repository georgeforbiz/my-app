import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateDMY } from "@/lib/format-date";
import type { VatMode } from "./vat";
import {
  appendPhonesToTerms,
  resolveClientPhone,
  resolveProviderPhone,
  stripPhonesFromTerms
} from "./phone-metadata";
import { appendVatModeToTerms, normalizeVatMode, resolveVatMode, stripVatModeFromTerms } from "./vat";

export type PaymentType = "single" | "milestones";
export type Milestone = {
  title: string;
  amount: number;
  status?: "pending" | "escrow_held" | "released";
  /** Optional per-milestone target completion date (`YYYY-MM-DD`). */
  target_date?: string;
};

/** @internal Shared mapper for DB / localStorage milestone JSON. */
export function mapMilestoneFromStorage(raw: unknown): Milestone {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const targetRaw = String(row.target_date ?? row.completion_date ?? "").trim();
  const isoTarget = /^\d{4}-\d{2}-\d{2}/.test(targetRaw) ? targetRaw.slice(0, 10) : undefined;
  return {
    title: String(row.title ?? ""),
    amount: Number(row.amount ?? 0),
    status:
      row.status === "released" ? "released" : row.status === "escrow_held" ? "escrow_held" : "pending",
    ...(isoTarget ? { target_date: isoTarget } : {})
  };
}

/** Normalize milestone input from API / form payloads. */
export function normalizeMilestoneInput(raw: unknown): Milestone {
  const mapped = mapMilestoneFromStorage(raw);
  return {
    title: mapped.title,
    amount: mapped.amount,
    ...(mapped.target_date ? { target_date: mapped.target_date } : {})
  };
}
export type AgreementStatus = "pending" | "signed" | "completed";

export type NormalizedAgreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  /** From agreements.full_name (or legacy provider_full_name). */
  full_name?: string;
  /** From agreements.business_name (or legacy provider_business_name). */
  business_name?: string;
  provider_full_name?: string;
  provider_business_name?: string;
  client_name: string;
  provider_phone?: string;
  client_phone?: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  scope_of_work?: string;
  scope_exclusions?: string;
  estimated_completion_date?: string;
  deadline?: string;
  total_price: number;
  vat_mode?: VatMode;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  client_signature?: string;
  provider_logo_url?: string;
  created_at: string;
};

function parseLegacyPaymentTerms(raw: unknown): { payment_type: PaymentType; milestones: Milestone[] | null } {
  if (typeof raw !== "string" || !raw.trim()) return { payment_type: "single", milestones: null };
  const t = raw.trim();
  if (t.toLowerCase() === "single") return { payment_type: "single", milestones: null };
  if (!t.startsWith("{")) return { payment_type: "single", milestones: null };
  try {
    const parsed = JSON.parse(t) as {
      vstahVersion?: number;
      payment_type?: string;
      type?: string;
      milestones?: Milestone[];
    };
    if (parsed.payment_type === "milestones" || parsed.type === "milestones") {
      return {
        payment_type: "milestones",
        milestones: Array.isArray(parsed.milestones)
          ? parsed.milestones.map(mapMilestoneFromStorage)
          : []
      };
    }
  } catch {
    // ignore
  }
  return { payment_type: "single", milestones: null };
}

/** Map DB row (modern or legacy column names) to the shape the UI expects. */
export function normalizeAgreementRow(row: Record<string, unknown>): NormalizedAgreement {
  const project_title =
    String(row.project_title ?? row.service_description ?? "").trim() || "";

  let payment_type: PaymentType = "single";
  let milestones: Milestone[] | null = null;

  if (row.payment_type === "milestones" || row.payment_type === "single") {
    payment_type = row.payment_type;
    if (payment_type === "milestones") {
      milestones = Array.isArray(row.milestones) ? row.milestones.map(mapMilestoneFromStorage) : [];
    }
  } else {
    const legacy = parseLegacyPaymentTerms(row.payment_terms);
    payment_type = legacy.payment_type;
    milestones = legacy.milestones;
  }

  const fullName = String(row.full_name ?? row.provider_full_name ?? "").trim();
  const businessName = String(row.business_name ?? row.provider_business_name ?? "").trim();
  const rawCustomTerms = String(row.custom_terms ?? "").trim();

  return {
    id: String(row.id ?? ""),
    provider_id: String(row.provider_id ?? ""),
    provider_name: String(row.provider_name ?? "").trim(),
    full_name: fullName || undefined,
    business_name: businessName || undefined,
    provider_full_name: String(row.provider_full_name ?? "").trim() || undefined,
    provider_business_name: String(row.provider_business_name ?? "").trim() || undefined,
    client_name: String(row.client_name ?? ""),
    provider_phone: resolveProviderPhone(row.provider_phone, rawCustomTerms),
    client_phone: resolveClientPhone(row.client_phone, rawCustomTerms),
    project_title,
    service_area: String(row.service_area ?? "").trim(),
    custom_terms: stripPhonesFromTerms(stripVatModeFromTerms(rawCustomTerms)),
    scope_of_work: String(row.scope_of_work ?? "").trim() || undefined,
    scope_exclusions: String(row.scope_exclusions ?? "").trim() || undefined,
    estimated_completion_date: String(row.estimated_completion_date ?? "").trim() || undefined,
    deadline: String(row.deadline ?? "").trim() || undefined,
    total_price: Number(row.total_price ?? 0),
    vat_mode: resolveVatMode(row.vat_mode, rawCustomTerms),
    payment_type,
    milestones,
    status: (() => {
      const raw = String(row.status ?? "");
      let status = (["pending", "signed", "completed"].includes(raw) ? raw : "pending") as AgreementStatus;
      const sig = String(row.client_signature ?? "").trim();
      if (status === "pending" && sig.startsWith("data:image/")) status = "signed";
      return status;
    })(),
    payment_status:
      (String(row.payment_status) === "released" || String(row.payment_status) === "paid")
        ? "released"
        : String(row.payment_status) === "escrow_held"
          ? "escrow_held"
          : "pending",
    client_signature: String(row.client_signature ?? "").trim() || undefined,
    provider_logo_url: String(row.provider_logo_url ?? "").trim() || undefined,
    created_at: String(row.created_at ?? "")
  };
}

export function isMissingColumnOrSchemaCacheError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    (m.includes("column") && (m.includes("does not exist") || m.includes("schema cache"))) ||
    (m.includes("could not find") && m.includes("column"))
  );
}

function extractMissingColumnName(message: string | undefined): string | null {
  if (!message) return null;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" (?:of relation )?does not exist/i,
    /column agreements\.([^\s]+) does not exist/i
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function insertAgreementRowAdaptive(
  supabase: SupabaseClient,
  initial: Record<string, unknown>,
  params: { full_name?: string | null; business_name?: string | null }
): Promise<{ id?: string; error?: string; payload?: Record<string, unknown> }> {
  let payload = { ...initial };
  const stripped = new Set<string>();

  for (let attempt = 0; attempt < 16; attempt++) {
    const { data, error } = await supabase.from("agreements").insert(payload).select("id").single();
    if (!error && data?.id) {
      return { id: data.id as string, payload };
    }

    const message = error?.message;
    if (!isMissingColumnOrSchemaCacheError(message)) {
      return { error: message ?? "Failed to create agreement." };
    }

    const missing = extractMissingColumnName(message);
    if (!missing || !(missing in payload) || stripped.has(missing)) {
      return { error: message ?? "Failed to create agreement." };
    }

    stripped.add(missing);
    const { [missing]: _removed, ...rest } = payload;
    payload = { ...rest };

    if (missing === "full_name" && params.full_name && !("provider_full_name" in payload)) {
      payload.provider_full_name = params.full_name;
    }
    if (missing === "business_name" && params.business_name && !("provider_business_name" in payload)) {
      payload.provider_business_name = params.business_name;
    }
  }

  return { error: "Failed to create agreement after schema fallbacks." };
}

function patchLogoInBackground(supabase: SupabaseClient, agreementId: string, logoUrl: string | null | undefined) {
  const logo = logoUrl?.trim();
  if (!logo) return;
  void supabase
    .from("agreements")
    .update({ provider_logo_url: logo })
    .eq("id", agreementId)
    .then(({ error }) => {
      if (error && !isMissingColumnOrSchemaCacheError(error.message)) {
        console.warn("[vstah] provider_logo_url patch failed:", error.message);
      }
    });
}

/** Embeds scope fields in contract text when dedicated DB columns are unavailable. */
export function augmentCustomTermsWithScope(
  customTerms: string,
  scope: {
    scopeOfWork: string;
    scopeExclusions?: string;
    estimatedCompletionDate?: string;
    deadline?: string;
  }
): string {
  const blocks: string[] = [];
  const base = customTerms.trim();
  if (base) blocks.push(base);

  const included = scope.scopeOfWork.trim();
  if (included) blocks.push(`SCOPE OF WORK (INCLUDED):\n${included}`);

  const excluded = scope.scopeExclusions?.trim();
  if (excluded) blocks.push(`WHAT IS NOT INCLUDED:\n${excluded}`);

  const completion = scope.estimatedCompletionDate?.trim();
  if (completion) {
    blocks.push(`ESTIMATED COMPLETION DATE:\n${formatDateDMY(completion) || completion}`);
  }

  const deadline = scope.deadline?.trim();
  if (deadline) {
    blocks.push(`OFFER DEADLINE:\n${formatDateDMY(deadline) || deadline}`);
  }

  return blocks.join("\n\n");
}

function withAgreementTermsMetadata(
  customTerms: string,
  opts: { vatMode: VatMode; providerPhone?: string; clientPhone?: string }
): string {
  return appendPhonesToTerms(appendVatModeToTerms(customTerms, opts.vatMode), {
    providerPhone: opts.providerPhone,
    clientPhone: opts.clientPhone
  });
}

/**
 * Inserts using the modern column set first; if the DB is an older agreements table
 * (no project_title / payment_type / milestones), falls back to legacy columns.
 */
export async function insertAgreementWithSchemaFallback(
  supabase: SupabaseClient,
  params: {
    providerId: string;
    clientName: string;
    projectTitle: string;
    serviceArea: string;
    providerName: string;
    /** agreements.full_name — from signup / profile metadata */
    full_name?: string | null;
    /** agreements.business_name — from signup / profile metadata */
    business_name?: string | null;
    customTerms: string;
    scopeOfWork: string;
    scopeExclusions?: string;
    estimatedCompletionDate?: string;
    deadline?: string;
    providerPhone?: string;
    clientPhone?: string;
    vatMode?: VatMode;
    totalPrice: number;
    paymentType: PaymentType;
    milestones: Milestone[];
    providerLogoUrl?: string | null;
  }
): Promise<{ id?: string; error?: string }> {
  const scopeColumns = {
    scope_of_work: params.scopeOfWork.trim(),
    scope_exclusions: params.scopeExclusions?.trim() || null,
    estimated_completion_date: params.estimatedCompletionDate?.trim() || null,
    deadline: params.deadline?.trim() || null
  };
  const logoUrl = params.providerLogoUrl?.trim() || null;
  const logoColumn = logoUrl ? { provider_logo_url: logoUrl } : {};
  const vatMode = normalizeVatMode(params.vatMode);
  const termsMetadata = {
    vatMode,
    providerPhone: params.providerPhone,
    clientPhone: params.clientPhone
  };
  const customTermsWithScope = withAgreementTermsMetadata(
    augmentCustomTermsWithScope(params.customTerms, {
      scopeOfWork: params.scopeOfWork,
      scopeExclusions: params.scopeExclusions,
      estimatedCompletionDate: params.estimatedCompletionDate,
      deadline: params.deadline
    }),
    termsMetadata
  );
  const customTermsWithVat = withAgreementTermsMetadata(params.customTerms, termsMetadata);

  const modernBaseCore = {
    provider_id: params.providerId,
    client_name: params.clientName,
    provider_phone: params.providerPhone?.trim() || null,
    client_phone: params.clientPhone?.trim() || null,
    project_title: params.projectTitle,
    service_area: params.serviceArea,
    provider_name: params.providerName,
    total_price: params.totalPrice,
    vat_mode: vatMode,
    payment_type: params.paymentType,
    milestones:
      params.paymentType === "milestones"
        ? params.milestones.map((m) => mapMilestoneFromStorage({ ...m, status: m.status ?? "pending" }))
        : [],
    status: "pending" as const
  };

  const modernWithScope: Record<string, unknown> = {
    ...modernBaseCore,
    custom_terms: customTermsWithVat,
    ...scopeColumns,
    ...logoColumn,
    full_name: params.full_name ?? null,
    business_name: params.business_name ?? null
  };

  let modernResult = await insertAgreementRowAdaptive(supabase, modernWithScope, params);
  if (modernResult.id) {
    if (!("provider_logo_url" in (modernResult.payload ?? {}))) {
      patchLogoInBackground(supabase, modernResult.id, logoUrl);
    }
    return { id: modernResult.id };
  }

  if (modernResult.error && !isMissingColumnOrSchemaCacheError(modernResult.error)) {
    return { error: modernResult.error };
  }

  const modernWithoutScopeColumns: Record<string, unknown> = {
    ...modernBaseCore,
    custom_terms: customTermsWithScope,
    ...logoColumn,
    full_name: params.full_name ?? null,
    business_name: params.business_name ?? null
  };

  modernResult = await insertAgreementRowAdaptive(supabase, modernWithoutScopeColumns, params);
  if (modernResult.id) {
    if (!("provider_logo_url" in (modernResult.payload ?? {}))) {
      patchLogoInBackground(supabase, modernResult.id, logoUrl);
    }
    return { id: modernResult.id };
  }

  if (modernResult.error && !isMissingColumnOrSchemaCacheError(modernResult.error)) {
    return { error: modernResult.error };
  }

  const legacy = {
    provider_id: params.providerId,
    client_name: params.clientName,
    service_description: params.projectTitle,
    total_price: params.totalPrice,
    payment_terms:
      params.paymentType === "milestones"
        ? JSON.stringify({
            vstahVersion: 1,
            payment_type: "milestones",
            milestones: params.milestones.map((m) =>
              mapMilestoneFromStorage({ ...m, status: m.status ?? "pending" })
            )
          })
        : "single",
    status: "pending" as const
  };

  const { data: legacyData, error: legacyError } = await supabase
    .from("agreements")
    .insert(legacy)
    .select("id")
    .single();

  if (!legacyError && legacyData?.id) {
    patchLogoInBackground(supabase, legacyData.id as string, logoUrl);
    return { id: legacyData.id as string };
  }

  return {
    error:
      legacyError?.message ??
      modernResult.error ??
      "Failed to create agreement. Run the SQL migration in Supabase to add project_title and milestones."
  };
}
