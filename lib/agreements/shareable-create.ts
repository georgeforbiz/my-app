import type { SupabaseClient } from "@supabase/supabase-js";
import { isLocalAgreementId } from "./local-store";
import { isShareableAgreementId } from "./public-url";
import {
  createAgreementViaApi,
  type CreateAgreementApiPayload
} from "./create-via-api";
import { insertAgreementWithSchemaFallback, type PaymentType, type Milestone } from "./row";
import type { VatMode } from "./vat";

export type ShareableDraft = {
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
  deadline?: string;
  providerPhone?: string;
  clientPhone?: string;
  vatMode?: VatMode;
  totalPrice: number;
  paymentType: PaymentType;
  milestones: Milestone[];
  providerLogoUrl?: string | null;
};

export async function ensureSupabaseAccessToken(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const existing = sessionData.session?.access_token;
  if (existing) return existing;

  try {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
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
    deadline: draft.deadline,
    providerPhone: draft.providerPhone,
    clientPhone: draft.clientPhone,
    vatMode: draft.vatMode,
    totalPrice: draft.totalPrice,
    paymentType: draft.paymentType,
    milestones: draft.milestones.map((m) => ({
      title: m.title,
      amount: Number(m.amount || 0),
      ...(m.target_date ? { target_date: m.target_date } : {})
    })),
    providerLogoUrl: draft.providerLogoUrl ?? undefined
  };
}

function draftToInsertParams(draft: ShareableDraft) {
  return {
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
    deadline: draft.deadline,
    providerPhone: draft.providerPhone,
    clientPhone: draft.clientPhone,
    vatMode: draft.vatMode,
    totalPrice: draft.totalPrice,
    paymentType: draft.paymentType,
    milestones: draft.milestones,
    providerLogoUrl: draft.providerLogoUrl
  };
}

export function buildCreateAgreementPayload(draft: ShareableDraft): CreateAgreementApiPayload {
  return toApiPayload(draft);
}

/** Persist to Supabase: API first, then direct client insert if the API path fails. */
export async function createShareableAgreement(
  supabase: SupabaseClient,
  draft: ShareableDraft
): Promise<{ id?: string; error?: string }> {
  const token = await ensureSupabaseAccessToken(supabase);
  if (!token) {
    return { error: "Session expired. Please sign out and sign in again." };
  }

  let result: { id?: string; error?: string } = await createAgreementViaApi(token, toApiPayload(draft));

  if (!result.id) {
    try {
      result = await insertAgreementWithSchemaFallback(supabase, draftToInsertParams(draft));
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to save agreement."
      };
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

  return { id: result.id };
}
