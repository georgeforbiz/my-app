"use client";

import { normalizeVatMode, vatStatusLine, type VatMode } from "@/lib/agreements/vat";

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

type PaymentTotalLabels = {
  total: string;
  vatStatusIncluded: string;
  vatStatusExempt: string;
};

export function AgreementPaymentTotal({
  total,
  vatMode,
  labels
}: {
  total: number;
  vatMode?: VatMode | string | null;
  labels: PaymentTotalLabels;
}) {
  const mode = normalizeVatMode(vatMode);
  const vatLine = vatStatusLine(mode, {
    included: labels.vatStatusIncluded,
    exempt: labels.vatStatusExempt
  });

  return (
    <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#0033A0]/90 px-5 py-4 text-white shadow-md">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-white/90">{labels.total}</span>
        <span className="text-xl font-black tabular-nums sm:text-2xl">{money(total)} ֏</span>
      </div>
      <p className="mt-2 border-t border-white/20 pt-2 text-xs font-medium text-white/70">{vatLine}</p>
    </div>
  );
}
