"use client";

import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Hourglass,
  PenLine,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import type { AgreementStatus, NormalizedAgreement } from "@/lib/agreements/row";
import { hasVerificationPending } from "@/lib/agreements/verification-pending";

export type DerivedAgreementStatus =
  | AgreementStatus
  | "in_progress"
  | "paid"
  | "funds_secured"
  | "verification_pending";

const statusStyle: Record<DerivedAgreementStatus, { pill: string; icon: LucideIcon }> = {
  pending: { pill: "border-slate-200 bg-slate-50 text-slate-600", icon: Clock },
  signed: { pill: "border-indigo-200 bg-indigo-50 text-indigo-700", icon: PenLine },
  verification_pending: { pill: "border-amber-200 bg-amber-50 text-amber-800", icon: Hourglass },
  funds_secured: { pill: "border-blue-200 bg-blue-50 text-[#0033A0]", icon: ShieldCheck },
  in_progress: { pill: "border-amber-200 bg-amber-50 text-amber-700", icon: CircleDashed },
  paid: { pill: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  completed: { pill: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 }
};

export const DEFAULT_STATUS_LABELS: Record<DerivedAgreementStatus, string> = {
  pending: "Pending",
  signed: "Signed",
  verification_pending: "Verification pending",
  funds_secured: "Funds Secured",
  in_progress: "In progress",
  paid: "Paid",
  completed: "Completed"
};

export function getDerivedAgreementStatus(
  agreement: Pick<NormalizedAgreement, "id" | "status" | "payment_status" | "milestones" | "payment_type">,
  options?: { checkVerificationPending?: boolean }
): DerivedAgreementStatus {
  if (agreement.status === "completed") return "completed";
  if (agreement.payment_status === "released") return "paid";
  if (agreement.payment_status === "escrow_held") return "funds_secured";

  const checkPending = options?.checkVerificationPending !== false;
  if (checkPending && hasVerificationPending(agreement.id)) return "verification_pending";

  if (agreement.payment_type === "milestones") {
    const milestones = agreement.milestones ?? [];
    const releasedCount = milestones.filter((m) => m.status === "released").length;
    if (milestones.length > 0 && releasedCount === milestones.length) return "completed";
    if (releasedCount > 0) return "in_progress";
  }

  if (agreement.status === "signed") return "signed";
  return "pending";
}

export function AgreementStatusPill({
  status,
  label
}: {
  status: DerivedAgreementStatus;
  label?: string;
}) {
  const { pill, icon: Icon } = statusStyle[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${pill}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      {label ?? DEFAULT_STATUS_LABELS[status]}
    </span>
  );
}
