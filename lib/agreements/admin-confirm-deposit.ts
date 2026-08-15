import type { Milestone, NormalizedAgreement } from "./row";
import { getLocalAgreement, updateLocalAgreement } from "./local-store";
import { removeVerificationPendingIndex } from "./verification-pending";

/**
 * Admin confirms a submitted bank transfer for a local agreement.
 * `index === -1` confirms total/single payment; otherwise a milestone index.
 */
export function confirmLocalDeposit(
  agreementId: string,
  index: number
): { ok: true; agreement: NormalizedAgreement } | { ok: false; error: string } {
  const current = getLocalAgreement(agreementId);
  if (!current) return { ok: false, error: "Agreement not found in local store." };
  if (current.status !== "signed") {
    return { ok: false, error: "Agreement must be signed before confirming a deposit." };
  }

  if (index === -1) {
    if (current.payment_status !== "pending") {
      return { ok: false, error: "Total payment is not awaiting deposit." };
    }
    if ((current.milestones ?? []).length > 0) {
      return { ok: false, error: "Use milestone confirmation for milestone deals." };
    }
    const updated = updateLocalAgreement(agreementId, { payment_status: "escrow_held" });
    if (!updated) return { ok: false, error: "Failed to update agreement." };
    removeVerificationPendingIndex(agreementId, -1);
    return { ok: true, agreement: updated };
  }

  const milestones = current.milestones ?? [];
  const target = milestones[index];
  if (!target) return { ok: false, error: "Milestone not found." };
  if ((target.status ?? "pending") !== "pending") {
    return { ok: false, error: "Milestone is not awaiting deposit." };
  }

  const nextMilestones: Milestone[] = milestones.map((m, i) => ({
    ...m,
    status:
      i === index
        ? ("escrow_held" as const)
        : m.status === "released"
          ? ("released" as const)
          : m.status === "escrow_held"
            ? ("escrow_held" as const)
            : ("pending" as const)
  }));

  const updated = updateLocalAgreement(agreementId, {
    milestones: nextMilestones,
    payment_status: "escrow_held"
  });
  if (!updated) return { ok: false, error: "Failed to update agreement." };
  removeVerificationPendingIndex(agreementId, index);
  return { ok: true, agreement: updated };
}
