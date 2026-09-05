import type { SupabaseClient } from "@supabase/supabase-js";
import { isLocalAgreementId } from "./local-store";
import type { PaymentType, NormalizedAgreement } from "./row";
import type { VatMode } from "./vat";
import { ensureSupabaseAccessToken } from "./shareable-create";

export type CreateAgreementApiPayload = {
  clientName: string;
  projectTitle: string;
  serviceArea: string;
  providerName: string;
  full_name?: string;
  business_name?: string;
  customTerms: string;
  scopeOfWork: string;
  scopeExclusions?: string;
  estimatedCompletionDate?: string;
  deadline?: string;
  providerPhone?: string;
  clientPhone?: string;
  providerEmail?: string;
  clientEmail?: string;
  vatMode?: VatMode;
  totalPrice: number;
  paymentType: PaymentType;
  milestones: { title: string; amount: number; target_date?: string; payment_due?: string }[];
  providerLogoUrl?: string;
};

/** Creates an agreement on the server so shared links work for any client. */
export async function createAgreementViaApi(
  accessToken: string,
  payload: CreateAgreementApiPayload
): Promise<{ id?: string; error?: string }> {
  try {
    const res = await fetch("/api/agreement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) {
      return { error: data.error ?? "Failed to create agreement." };
    }
    if (!data.id) {
      return { error: "Failed to create agreement." };
    }
    return { id: data.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch" };
  }
}

export type UpdatePendingAgreementPayload = {
  customTerms: string;
  paymentType: PaymentType;
  milestones: { title: string; amount: number; target_date?: string; payment_due?: string }[];
  totalPrice: number;
  estimatedCompletionDate?: string;
  scopeOfWork?: string;
  scopeExclusions?: string;
  deadline?: string;
};

/** Updates custom terms / milestones / dates on a pending (unsigned) agreement. */
export async function updatePendingAgreementViaApi(
  accessToken: string,
  agreementId: string,
  payload: UpdatePendingAgreementPayload
): Promise<{ id?: string; agreement?: NormalizedAgreement; error?: string }> {
  try {
    const res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      agreement?: NormalizedAgreement;
      error?: string;
    };
    if (!res.ok) {
      return { error: data.error ?? "Failed to update agreement." };
    }
    if (!data.id) {
      return { error: "Failed to update agreement." };
    }
    return { id: data.id, agreement: data.agreement };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch" };
  }
}

export function localAgreementToApiPayload(local: NormalizedAgreement): CreateAgreementApiPayload {
  return {
    clientName: local.client_name,
    projectTitle: local.project_title,
    serviceArea: local.service_area,
    providerName: local.provider_name,
    full_name: local.full_name ?? local.provider_full_name,
    business_name: local.business_name ?? local.provider_business_name,
    customTerms: local.custom_terms,
    scopeOfWork: local.scope_of_work ?? "",
    scopeExclusions: local.scope_exclusions,
    estimatedCompletionDate: local.estimated_completion_date,
    deadline: local.deadline,
    providerPhone: local.provider_phone,
    clientPhone: local.client_phone,
    providerEmail: local.provider_email,
    clientEmail: local.client_email,
    vatMode: local.vat_mode,
    totalPrice: Number(local.total_price || 0),
    paymentType: local.payment_type,
    milestones: (local.milestones ?? []).map((m) => ({
      title: m.title,
      amount: Number(m.amount || 0),
      ...(m.target_date ? { target_date: m.target_date } : {}),
      ...(m.payment_due ? { payment_due: m.payment_due } : {})
    })),
    providerLogoUrl: local.provider_logo_url
  };
}

export async function publishLocalAgreementViaApi(
  accessToken: string,
  local: NormalizedAgreement
): Promise<{ id?: string; error?: string }> {
  return createAgreementViaApi(accessToken, localAgreementToApiPayload(local));
}

/** Upload a browser-only agreement to Supabase and verify the public link works. */
export async function publishLocalAgreementToCloud(
  supabase: SupabaseClient,
  local: NormalizedAgreement
): Promise<{ id?: string; error?: string }> {
  const token = await ensureSupabaseAccessToken(supabase);
  if (!token) {
    return { error: "Session expired. Please sign out and sign in again." };
  }

  const result = await createAgreementViaApi(token, localAgreementToApiPayload(local));
  if (result.error || !result.id) {
    return { error: result.error ?? "Failed to publish agreement online." };
  }

  if (isLocalAgreementId(result.id)) {
    return { error: "Agreement was not saved online." };
  }

  return { id: result.id };
}

export async function fetchDashboardAgreementsViaApi(
  accessToken: string
): Promise<{ agreements?: NormalizedAgreement[]; error?: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch("/api/dashboard/agreements", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal
    });
    const data = (await res.json().catch(() => ({}))) as {
      agreements?: NormalizedAgreement[];
      error?: string;
    };
    if (!res.ok) {
      return { error: data.error ?? "Failed to load agreements." };
    }
    return { agreements: data.agreements ?? [] };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { error: "Loading agreements timed out. Please try again." };
    }
    return { error: err instanceof Error ? err.message : "Failed to fetch" };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function mergeAgreementsById<T extends { id: string; created_at: string }>(lists: T[][]): T[] {
  const byId = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
