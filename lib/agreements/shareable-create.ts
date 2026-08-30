import type { SupabaseClient } from "@supabase/supabase-js";
import { isLocalAgreementId } from "./local-store";
import { isShareableAgreementId } from "./public-url";
import {
  createAgreementViaApi,
  type CreateAgreementApiPayload
} from "./create-via-api";
import {
  insertAgreementWithSchemaFallback,
  type PaymentType,
  type Milestone
} from "./row";

export async function ensureSupabaseAccessToken(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    await supabase.auth.refreshSession();
  } catch {
    // refresh optional — getSession may still return a valid token
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function verifyAgreementIsPublic(agreementId: string): Promise<boolean> {
  if (!isShareableAgreementId(agreementId)) return false;
  try {
    const res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}`, {
      cache: "no-store"
    });
    if (!res.ok) return false;
    const payload = (await res.json()) as { agreement?: { id?: string } };
    return payload.agreement?.id === agreementId;
  } catch {
    return false;
  }
}

type ShareableDraft = {
  providerId: string;
  providerName: string;
  full_name?: string | null;
  business_name?: string | null;
  clientName: string;
  projectTitle: string;
  serviceArea: string;
  customTerms: string;
  scopeOfWork: string;
  scopeExclusions?: string;
  estimatedCompletionDate?: string;
  totalPrice: number;
  paymentType: PaymentType;
  milestones: Milestone[];
};

function toApiPayload(draft: ShareableDraft): CreateAgreementApiPayload {
  return {
    clientName: draft.clientName,
    projectTitle: draft.projectTitle,
    serviceArea: draft.serviceArea,
    providerName: draft.providerName,
    full_name: draft.full_name ?? undefined,
    business_name: draft.business_name ?? undefined,
    customTerms: draft.customTerms,
    scopeOfWork: draft.scopeOfWork,
    scopeExclusions: draft.scopeExclusions,
    estimatedCompletionDate: draft.estimatedCompletionDate,
    totalPrice: draft.totalPrice,
    paymentType: draft.paymentType,
    milestones: draft.milestones.map((m) => ({
      title: m.title,
      amount: Number(m.amount || 0)
    }))
  };
}

/** Save to Supabase and confirm the public agreement URL will work for anyone. */
export async function createShareableAgreement(
  supabase: SupabaseClient,
  draft: ShareableDraft
): Promise<{ id?: string; error?: string }> {
  const token = await ensureSupabaseAccessToken(supabase);
  if (!token) {
    return { error: "Session expired. Please sign out and sign in again." };
  }

  let result: { id?: string; error?: string } = await createAgreementViaApi(
    token,
    toApiPayload(draft)
  );

  if (!result.id) {
    try {
      result = await insertAgreementWithSchemaFallback(supabase, {
        providerId: draft.providerId,
        providerName: draft.providerName,
        full_name: draft.full_name,
        business_name: draft.business_name,
        clientName: draft.clientName,
        projectTitle: draft.projectTitle,
        serviceArea: draft.serviceArea,
        customTerms: draft.customTerms,
        scopeOfWork: draft.scopeOfWork,
        scopeExclusions: draft.scopeExclusions,
        estimatedCompletionDate: draft.estimatedCompletionDate,
        totalPrice: draft.totalPrice,
        paymentType: draft.paymentType,
        milestones: draft.milestones
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save agreement." };
    }
  }

  if (result.error || !result.id) {
    return { error: result.error ?? "Failed to save agreement to the cloud." };
  }

  if (isLocalAgreementId(result.id)) {
    return {
      error: "Agreement was not saved online. Shared links require a cloud account."
    };
  }

  const verified = await verifyAgreementIsPublic(result.id);
  if (!verified) {
    return {
      error:
        "Agreement was saved but the public link is not ready yet. Wait a moment and copy the link from Overview."
    };
  }

  return { id: result.id };
}
