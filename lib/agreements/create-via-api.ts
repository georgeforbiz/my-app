import type { PaymentType } from "./row";
import type { NormalizedAgreement } from "./row";

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
  totalPrice: number;
  paymentType: PaymentType;
  milestones: { title: string; amount: number }[];
};

/** Creates an agreement on the server (service role) so shared links work for any client. */
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
    totalPrice: Number(local.total_price || 0),
    paymentType: local.payment_type,
    milestones: (local.milestones ?? []).map((m) => ({
      title: m.title,
      amount: Number(m.amount || 0)
    }))
  };
}

export async function publishLocalAgreementViaApi(
  accessToken: string,
  local: NormalizedAgreement
): Promise<{ id?: string; error?: string }> {
  return createAgreementViaApi(accessToken, localAgreementToApiPayload(local));
}
