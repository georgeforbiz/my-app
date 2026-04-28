import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentType = "single" | "milestones";
export type Milestone = { title: string; amount: number; status?: "pending" | "escrow_held" | "released" };
export type AgreementStatus = "pending" | "signed" | "completed";

export type NormalizedAgreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  total_price: number;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
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
          ? (parsed.milestones as Milestone[]).map((m) => ({
              title: String(m?.title ?? ""),
              amount: Number(m?.amount ?? 0),
              status: m?.status === "released" ? "released" : m?.status === "escrow_held" ? "escrow_held" : "pending"
            }))
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
      milestones = Array.isArray(row.milestones)
        ? (row.milestones as Milestone[]).map((m) => ({
            title: String(m?.title ?? ""),
            amount: Number(m?.amount ?? 0),
            status: m?.status === "released" ? "released" : m?.status === "escrow_held" ? "escrow_held" : "pending"
          }))
        : [];
    }
  } else {
    const legacy = parseLegacyPaymentTerms(row.payment_terms);
    payment_type = legacy.payment_type;
    milestones = legacy.milestones;
  }

  return {
    id: String(row.id ?? ""),
    provider_id: String(row.provider_id ?? ""),
    provider_name: String(row.provider_name ?? "").trim(),
    client_name: String(row.client_name ?? ""),
    project_title,
    service_area: String(row.service_area ?? "").trim(),
    custom_terms: String(row.custom_terms ?? "").trim(),
    total_price: Number(row.total_price ?? 0),
    payment_type,
    milestones,
    status: (["pending", "signed", "completed"].includes(String(row.status))
      ? row.status
      : "pending") as AgreementStatus,
    payment_status:
      (String(row.payment_status) === "released" || String(row.payment_status) === "paid")
        ? "released"
        : String(row.payment_status) === "escrow_held"
          ? "escrow_held"
          : "pending",
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
    customTerms: string;
    totalPrice: number;
    paymentType: PaymentType;
    milestones: Milestone[];
  }
): Promise<{ id?: string; error?: string }> {
  const modern = {
    provider_id: params.providerId,
    client_name: params.clientName,
    project_title: params.projectTitle,
    service_area: params.serviceArea,
    provider_name: params.providerName,
    custom_terms: params.customTerms,
    total_price: params.totalPrice,
    payment_type: params.paymentType,
    milestones:
      params.paymentType === "milestones"
        ? params.milestones.map((m) => ({
            ...m,
            status: m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
          }))
        : [],
    status: "pending" as const
  };

  const { data: modernData, error: modernError } = await supabase
    .from("agreements")
    .insert(modern)
    .select("id")
    .single();

  if (!modernError && modernData?.id) {
    return { id: modernData.id as string };
  }

  if (!isMissingColumnOrSchemaCacheError(modernError?.message)) {
    return { error: modernError?.message ?? "Failed to create agreement." };
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
            milestones: params.milestones.map((m) => ({
              ...m,
              status: m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
            }))
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
    return { id: legacyData.id as string };
  }

  return {
    error:
      legacyError?.message ??
      modernError?.message ??
      "Failed to create agreement. Run the SQL migration in Supabase to add project_title and milestones."
  };
}
