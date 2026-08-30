import { isLocalAgreementId } from "./local-store";

/** Canonical production origin for agreement links sent to clients. */
export const AGREEMENT_PUBLIC_ORIGIN = "https://www.vstah.am";

export function getAgreementPublicOrigin(): string {
  if (typeof window === "undefined") return AGREEMENT_PUBLIC_ORIGIN;
  const host = window.location.hostname.replace(/^www\./, "");
  if (host === "vstah.am") return AGREEMENT_PUBLIC_ORIGIN;
  return window.location.origin;
}

export function getAgreementPublicUrl(agreementId: string): string {
  return `${getAgreementPublicOrigin()}/agreement/${encodeURIComponent(agreementId)}`;
}

export function isShareableAgreementId(id: string | undefined | null): boolean {
  return typeof id === "string" && id.length > 0 && !isLocalAgreementId(id);
}
