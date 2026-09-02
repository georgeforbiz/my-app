export type AgreementLifecycleStatus = "pending" | "signed" | "completed";

/** Real canvas signatures are several KB; tiny placeholders are not valid. */
export const MIN_SIGNATURE_DATA_URL_LENGTH = 1000;

const STATUS_RANK: Record<AgreementLifecycleStatus, number> = {
  pending: 0,
  signed: 1,
  completed: 2
};

export function pickAdvancedStatus(
  a: AgreementLifecycleStatus,
  b: AgreementLifecycleStatus
): AgreementLifecycleStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

export function isSignedOrCompleted(status: string | undefined | null): boolean {
  return status === "signed" || status === "completed";
}

/** Signed if status says so, or a stored client signature exists (status column may lag). */
export function isAgreementSigned(agreement: {
  status?: string | null;
  client_signature?: string | null;
}): boolean {
  if (isSignedOrCompleted(agreement.status)) return true;
  const sig = String(agreement.client_signature ?? "").trim();
  return sig.startsWith("data:image/");
}

export function isValidSignatureDataUrl(value: string | null | undefined): boolean {
  const sig = String(value ?? "").trim();
  return sig.startsWith("data:image/") && sig.length >= MIN_SIGNATURE_DATA_URL_LENGTH;
}

/** Any stored data-URL — used for display (signature block). */
export function hasSignatureDataUrl(value: string | null | undefined): boolean {
  const sig = String(value ?? "").trim();
  return sig.startsWith("data:image/");
}

export function hasStoredClientSignature(agreement: {
  client_signature?: string | null;
} | null | undefined): boolean {
  return isValidSignatureDataUrl(agreement?.client_signature);
}

export function isSignedWithoutSignature(agreement: {
  status?: string | null;
  client_signature?: string | null;
}): boolean {
  return isSignedOrCompleted(agreement.status) && !hasStoredClientSignature(agreement);
}

/** Pending & unsigned — creator may still change terms / milestones / dates. */
export function isAgreementEditable(agreement: {
  status?: string | null;
  client_signature?: string | null;
}): boolean {
  if (isAgreementSigned(agreement)) return false;
  return (agreement.status ?? "pending") === "pending";
}

export function statusRank(status: string | undefined | null): number {
  if (status === "completed") return 2;
  if (status === "signed") return 1;
  return 0;
}
