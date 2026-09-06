"use client";

import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Hash,
  Mail,
  PenLine,
  Phone,
  User
} from "lucide-react";
import type { Language } from "@/lib/i18n/locales";
import { formatDateDMY, formatEmbeddedDatesInTerms } from "@/lib/format-date";
import { isAgreementSigned } from "@/lib/agreements/status-rank";
import { getAgreementDocumentLabels } from "@/lib/agreements/document-labels";
import { withProviderLogoCacheBust } from "@/lib/agreements/logo-image";
import { useAgreementProviderLogo } from "@/lib/agreements/use-agreement-provider-logo";
import { NAVY } from "@/lib/brand";
import { AgreementPaymentTotal } from "@/components/agreement-payment-total";
import type { VatMode } from "@/lib/agreements/vat";

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

export type AgreementDocumentData = {
  id: string;
  provider_name?: string;
  provider_full_name?: string;
  provider_business_name?: string;
  business_name?: string;
  full_name?: string;
  client_name: string;
  provider_phone?: string;
  client_phone?: string;
  provider_email?: string;
  client_email?: string;
  project_title: string;
  service_area: string;
  custom_terms?: string;
  scope_of_work?: string;
  scope_exclusions?: string;
  estimated_completion_date?: string;
  deadline?: string;
  total_price: number;
  vat_mode?: VatMode;
  payment_type: "single" | "milestones";
  milestones: { title: string; amount: number; target_date?: string; payment_due?: string }[] | null;
  created_at: string;
  status?: "pending" | "signed" | "completed";
  client_signature?: string;
  provider_id?: string;
  provider_logo_url?: string;
};

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function resolveProviderNameFields(a: AgreementDocumentData): { business: string; full: string } {
  let business = (a.business_name ?? a.provider_business_name ?? "").trim();
  let full = (a.full_name ?? a.provider_full_name ?? "").trim();

  if (!business && !full) {
    const pn = (a.provider_name ?? "").trim();
    if (pn && !looksLikeUuid(pn)) {
      const paren = pn.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (paren) {
        business = paren[1].trim();
        full = paren[2].trim();
      } else {
        business = pn;
      }
    }
  }

  if (!business && full) business = full;
  if (!full && business) full = business;

  return { business, full };
}

type PaymentScheduleRow = {
  index: number;
  stage: string;
  amount: number;
  targetDate?: string;
  paymentDue?: string;
};

function buildPaymentScheduleRows(
  agreement: AgreementDocumentData,
  tx: ReturnType<typeof getAgreementDocumentLabels>
): PaymentScheduleRow[] {
  if (agreement.payment_type === "milestones" && (agreement.milestones?.length ?? 0) > 0) {
    return (agreement.milestones ?? []).map((m, i) => ({
      index: i + 1,
      stage: m.title,
      amount: Number(m.amount || 0),
      targetDate: m.target_date?.trim() || undefined,
      paymentDue: m.payment_due?.trim() || undefined
    }));
  }

  return [
    {
      index: 1,
      stage: tx.singlePaymentLabel,
      amount: Number(agreement.total_price || 0)
    }
  ];
}

function AgreementSectionTitle({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5 sm:gap-3"}`}>
      <span
        className={`w-1 shrink-0 rounded-full ${compact ? "h-5" : "h-7 sm:h-8"}`}
        style={{ backgroundColor: NAVY }}
        aria-hidden
      />
      <h2
        className={`font-black uppercase text-slate-800 ${
          compact ? "text-[10px] tracking-[0.12em]" : "text-xs tracking-[0.14em] sm:text-sm sm:tracking-wider"
        }`}
      >
        {children}
      </h2>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  compact = false
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 gap-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 shadow-sm ring-1 ring-slate-900/[0.03] ${
        compact ? "p-2.5" : "p-3.5 sm:p-4"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0] ${
          compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
        }`}
      >
        <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-[18px] sm:w-[18px]"} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-bold uppercase tracking-wide text-slate-500 ${compact ? "text-[9px]" : "text-[10px] sm:text-xs"}`}>
          {label}
        </p>
        <p
          className={`mt-0.5 break-words font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function AgreementDocumentView({
  agreement,
  lang,
  draft = false,
  embedded = false,
  compact = false,
  closingOnly = false,
  logoBelowBadge = false,
  viewerUserId
}: {
  agreement: AgreementDocumentData;
  lang: Language;
  draft?: boolean;
  /** When true, skip full-page background wrapper (modal embed). */
  embedded?: boolean;
  /** Tighter padding/type for narrow embeds (e.g. marketing phone demo). */
  compact?: boolean;
  /** Show only total + signature + signed confirmation (marketing phone). */
  closingOnly?: boolean;
  /** Place provider logo under the status badge (marketing example popup). */
  logoBelowBadge?: boolean;
  /** Signed-in provider id — enables saved-logo fallback in dashboard preview. */
  viewerUserId?: string;
}) {
  const tx = getAgreementDocumentLabels(lang);
  const isDraft = draft || agreement.id === "draft";
  const signed = isAgreementSigned(agreement);
  const providerFields = resolveProviderNameFields(agreement);
  const readableAgreementId = isDraft
    ? tx.previewId
    : `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  const paymentScheduleRows = buildPaymentScheduleRows(agreement, tx);
  const showMilestoneTargetDates = paymentScheduleRows.some((row) => Boolean(row.targetDate));
  const showMilestonePaymentDue = paymentScheduleRows.some((row) => Boolean(row.paymentDue));
  const terms = agreement.custom_terms?.trim() || "";
  const providerLogo = useAgreementProviderLogo(agreement, viewerUserId) ?? null;
  const providerLogoSrc =
    withProviderLogoCacheBust(
      providerLogo,
      agreement.provider_id ?? viewerUserId ?? agreement.id,
      agreement.created_at
    ) ?? providerLogo;
  const signatureImage =
    typeof agreement.client_signature === "string" &&
    (agreement.client_signature.startsWith("data:image/") ||
      agreement.client_signature.startsWith("/") ||
      /^https?:\/\//i.test(agreement.client_signature))
      ? agreement.client_signature
      : null;

  const phaseLabel =
    agreement.status === "pending" || isDraft
      ? tx.phaseAwaitingSign
      : agreement.status === "completed"
        ? tx.phaseCompleted
        : tx.signedAndApproved;

  const milestoneStatusBadge = (rowSigned: boolean) =>
    rowSigned ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {tx.statusSigned}
      </span>
    ) : (
      <span className="inline-flex rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 sm:text-xs">
        {tx.pendingSignature}
      </span>
    );

  const paymentTotal = (
    <AgreementPaymentTotal
      total={Number(agreement.total_price || 0)}
      vatMode={agreement.vat_mode}
      labels={{
        total: tx.total,
        vatStatusIncluded: tx.vatStatusIncluded,
        vatStatusExempt: tx.vatStatusExempt
      }}
    />
  );

  const signatureBlock =
    signatureImage && signed ? (
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04]">
        <div
          className={`border-b border-slate-100 bg-gradient-to-r from-[#0033A0]/[0.07] to-slate-50/80 ${
            compact || closingOnly ? "px-3 py-3" : "px-4 py-4 sm:px-6"
          }`}
        >
          <p
            className={`font-black uppercase tracking-[0.2em] text-[#0033A0] ${
              compact || closingOnly ? "text-[9px]" : "text-[10px] sm:text-[11px]"
            }`}
          >
            {tx.clientSignature}
          </p>
          <p className={`mt-1 font-bold text-slate-900 ${compact || closingOnly ? "text-sm" : "text-base"}`}>
            {agreement.client_name}
          </p>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 ${
              compact || closingOnly ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {tx.signedAndApproved}
          </span>
        </div>
        <div
          className={`bg-gradient-to-b from-slate-50/80 to-white ${
            compact || closingOnly ? "px-3 py-4" : "px-4 py-6 sm:px-8 sm:py-8"
          }`}
        >
          <div
            className={`relative mx-auto max-w-lg rounded-xl bg-white shadow-inner ring-1 ring-slate-200/90 ${
              compact || closingOnly ? "p-3" : "p-5 sm:p-8"
            }`}
          >
            <div
              className={`pointer-events-none absolute border-b border-slate-300/90 ${
                compact || closingOnly
                  ? "inset-x-4 bottom-3"
                  : "inset-x-6 bottom-5 sm:inset-x-10 sm:bottom-8"
              }`}
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureImage}
              alt=""
              className={`relative z-[1] mx-auto block h-auto w-auto max-w-full object-contain ${
                compact || closingOnly ? "max-h-16" : "max-h-32 sm:max-h-40"
              }`}
            />
          </div>
        </div>
      </section>
    ) : null;

  const signedSuccessBlock =
    signed && !isDraft ? (
      <div
        className={`flex rounded-2xl border border-emerald-200/90 bg-white shadow-sm ring-1 ring-emerald-100 ${
          compact || closingOnly ? "gap-3 p-3.5" : "gap-4 p-5 sm:gap-5 sm:p-6"
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-100 ${
            compact || closingOnly ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12"
          }`}
        >
          <CheckCircle2
            className={`text-emerald-600 ${compact || closingOnly ? "h-5 w-5" : "h-6 w-6 sm:h-7 sm:w-7"}`}
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className={`font-black leading-tight text-slate-900 ${compact || closingOnly ? "text-base" : "text-xl sm:text-2xl"}`}>
            {tx.signedAndApproved}
          </p>
          <p className={`mt-2 font-semibold leading-snug text-slate-700 ${compact || closingOnly ? "text-xs" : "text-base"}`}>
            {tx.signedSuccessNote}
          </p>
          <p className={`mt-2 text-slate-500 ${compact || closingOnly ? "text-[11px]" : "text-sm"}`}>
            {tx.signedSuccessHint}
          </p>
        </div>
      </div>
    ) : null;

  if (closingOnly) {
    const totalAmount = Number(agreement.total_price || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2
    });
    const vatLine =
      agreement.vat_mode === "exempt" ? tx.vatStatusExempt : tx.vatStatusIncluded;

    const closingCard = (
      <div className="mx-auto flex h-full min-h-full w-full min-w-0 flex-col overflow-hidden bg-white px-3 pb-7 pt-3">
        {/* Fixed-height slots — language text length must not move the signature */}
        <div className="flex h-[118px] shrink-0 flex-col justify-center rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#0033A0]/90 px-5 py-4 text-white shadow-md">
          <p className="text-sm font-semibold leading-snug text-white/90 [overflow-wrap:anywhere]">
            {tx.total}
          </p>
          <span className="mt-1.5 text-2xl font-black tabular-nums leading-none">{totalAmount} ֏</span>
          <p className="mt-2.5 border-t border-white/20 pt-2.5 text-xs font-medium leading-snug text-white/70 [overflow-wrap:anywhere]">
            {vatLine}
          </p>
        </div>

        <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04]">
          <div className="h-[78px] shrink-0 border-b border-slate-100 bg-gradient-to-r from-[#0033A0]/[0.07] to-slate-50/80 px-3 py-2.5">
            <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#0033A0]">
              {tx.clientSignature}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold leading-tight text-slate-900">
              {agreement.client_name}
            </p>
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{tx.signedAndApproved}</span>
            </span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-slate-50/80 to-white px-3 py-3">
            <div className="relative flex h-[88px] w-full max-w-[14rem] items-center justify-center rounded-xl bg-white shadow-inner ring-1 ring-slate-200/90">
              <div
                className="pointer-events-none absolute inset-x-4 bottom-2.5 border-b border-slate-300/90"
                aria-hidden
              />
              {signatureImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signatureImage}
                  alt=""
                  className="relative z-[1] h-14 w-auto max-w-[85%] object-contain"
                />
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-3 flex h-[96px] shrink-0 gap-2.5 rounded-2xl border border-emerald-200/90 bg-white p-3 shadow-sm ring-1 ring-emerald-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black leading-tight text-slate-900">{tx.signedAndApproved}</p>
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-700">
              {tx.signedSuccessNote}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{tx.signedSuccessHint}</p>
          </div>
        </div>
      </div>
    );
    if (embedded) return closingCard;
    return (
      <main className="min-h-dvh bg-gradient-to-b from-slate-100 via-[#f8fafc] to-slate-200/90 px-3 py-5 sm:px-4 sm:py-8 md:py-10">
        {closingCard}
      </main>
    );
  }

  const card = (
    <div
      className={`mx-auto w-full min-w-0 overflow-hidden bg-white ring-1 ring-slate-900/[0.04] ${
        compact
          ? "max-w-none rounded-none border-0 shadow-none"
          : "max-w-[min(100%,55rem)] rounded-2xl border border-slate-200/80 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]"
      }`}
    >
      {isDraft ? (
        <div className={`border-b border-amber-200/80 bg-amber-50 ${compact ? "px-3 py-2.5" : "px-4 py-3 sm:px-8"}`}>
          <p className={`font-semibold text-amber-900 ${compact ? "text-xs" : "text-sm"}`}>{tx.draftBanner}</p>
        </div>
      ) : null}

      <header
        className={`border-b border-slate-100 bg-gradient-to-br from-[#0033A0]/[0.08] via-white to-[#F2A800]/[0.06] ${
          compact ? "px-3 py-3" : "px-4 py-6 sm:px-8 sm:py-8"
        }`}
      >
        {compact ? (
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="pt-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">{tx.offer}</p>
              <span
                className={`inline-flex max-w-[58%] shrink-0 rounded-full px-2 py-1 text-center text-[8px] font-bold leading-tight ${
                  signed
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {phaseLabel}
              </span>
            </div>
            <h1 className="text-[13px] font-black leading-snug text-[#0033A0] [overflow-wrap:anywhere]">
              {tx.title}
            </h1>
            {signed ? (
              <p className="text-[10px] font-semibold leading-snug text-emerald-800 [overflow-wrap:anywhere]">
                {tx.subtitleSigned}
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-slate-600 [overflow-wrap:anywhere]">{tx.subtitle}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-xs">{tx.offer}</p>
              <h1 className="mt-2 text-balance text-2xl font-black leading-tight text-[#0033A0] sm:text-3xl">{tx.title}</h1>
              {signed ? (
                <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-emerald-800">{tx.subtitleSigned}</p>
              ) : (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{tx.subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              {!logoBelowBadge && providerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={agreement.id}
                  src={providerLogoSrc ?? providerLogo}
                  alt=""
                  className="h-16 w-auto max-w-[200px] rounded-lg border border-slate-200/80 bg-white object-contain p-1.5 shadow-sm"
                />
              ) : null}
              <span
                className={`inline-flex shrink-0 self-start rounded-full px-3 py-1.5 text-xs font-bold sm:self-auto ${
                  signed
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {phaseLabel}
              </span>
              {logoBelowBadge && providerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${agreement.id}-logo-below`}
                  src={providerLogoSrc ?? providerLogo}
                  alt=""
                  className="h-16 w-auto max-w-[200px] rounded-lg border border-slate-200/80 bg-white object-contain p-1.5 shadow-sm"
                />
              ) : null}
            </div>
          </div>
        )}
      </header>

      <div className={compact ? "space-y-4 px-3 py-4" : "space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8"}>
        <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
          <MetaCard compact={compact} icon={Hash} label={tx.agreementId} value={readableAgreementId} />
          <MetaCard compact={compact} icon={Calendar} label={tx.creationDate} value={formatDateDMY(agreement.created_at)} />
          <MetaCard compact={compact} icon={FileText} label={tx.agreementPhase} value={phaseLabel} />
        </div>

        <section
          className={`rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#0033A0]/[0.06] via-white to-slate-50/80 shadow-sm ring-1 ring-slate-900/[0.03] ${
            compact ? "p-3.5" : "p-5 sm:p-6"
          }`}
        >
          <div className="flex items-start gap-3">
            <Briefcase className={`mt-1 shrink-0 text-[#0033A0] ${compact ? "h-4 w-4" : "h-5 w-5"}`} aria-hidden />
            <div className="min-w-0">
              <p className={`font-bold uppercase tracking-[0.16em] text-slate-500 ${compact ? "text-[9px]" : "text-[10px] sm:text-xs"}`}>
                {tx.projectHeader}
              </p>
              <h2
                className={`mt-1.5 text-balance font-black leading-snug text-slate-900 ${
                  compact ? "text-base" : "text-xl sm:text-2xl"
                }`}
              >
                {agreement.project_title || "—"}
              </h2>
            </div>
          </div>
        </section>

        <div className={`grid grid-cols-1 ${compact ? "gap-3" : "gap-4 md:grid-cols-2"}`}>
          <section
            className={`min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/50 shadow-sm ring-1 ring-slate-900/[0.03] ${
              compact ? "p-3" : "p-4 sm:p-5"
            }`}
          >
            <AgreementSectionTitle compact={compact}>{tx.providerDetails}</AgreementSectionTitle>
            <dl className={`mt-4 space-y-3 text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
              <div className="flex gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.businessName}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {providerFields.business || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.providerPhoneLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.provider_phone?.trim() || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.providerEmailLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.provider_email?.trim() || "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section
            className={`min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/50 shadow-sm ring-1 ring-slate-900/[0.03] ${
              compact ? "p-3" : "p-4 sm:p-5"
            }`}
          >
            <AgreementSectionTitle compact={compact}>{tx.clientDetails}</AgreementSectionTitle>
            <dl className={`mt-4 space-y-3 text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
              <div className="flex gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.client}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.client_name}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.clientPhoneLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.client_phone?.trim() || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.clientEmailLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.client_email?.trim() || "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
        </div>
        {isDraft ||
        agreement.scope_of_work?.trim() ||
        agreement.scope_exclusions?.trim() ||
        agreement.estimated_completion_date?.trim() ||
        (!signed && agreement.deadline?.trim()) ? (
          <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
            {isDraft || agreement.scope_of_work?.trim() ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0033A0] sm:text-[13px]">
                  {tx.scopeOfWork}
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                  {agreement.scope_of_work?.trim() || "—"}
                </pre>
              </div>
            ) : null}
            {isDraft || agreement.scope_exclusions?.trim() ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0033A0] sm:text-[13px]">
                  {tx.scopeExclusions}
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                  {agreement.scope_exclusions?.trim() || "—"}
                </pre>
              </div>
            ) : null}
            {agreement.estimated_completion_date?.trim() ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0033A0] sm:text-[13px]">
                  {tx.estimatedCompletionDate}
                </p>
                <p className="mt-3 text-base font-semibold text-slate-800">
                  {formatDateDMY(agreement.estimated_completion_date)}
                </p>
              </div>
            ) : null}
            {!signed && (isDraft || agreement.deadline?.trim()) ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0033A0] sm:text-[13px]">
                  {tx.offerDeadline}
                </p>
                <p className="mt-3 text-base font-semibold text-slate-800">
                  {agreement.deadline?.trim() ? formatDateDMY(agreement.deadline) : "—"}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section
          className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.03] ${
            compact ? "p-3" : "p-5 sm:p-6"
          }`}
        >
          <AgreementSectionTitle compact={compact}>{tx.termsAndConditions}</AgreementSectionTitle>
          <pre
            className={`mt-4 whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50/70 font-sans leading-7 text-slate-700 ${
              compact
                ? "max-h-40 overflow-y-auto p-3 text-xs"
                : "max-h-[min(24rem,50vh)] overflow-y-auto p-4 text-sm sm:max-h-none sm:overflow-visible sm:p-5"
            }`}
          >
            {terms ? formatEmbeddedDatesInTerms(terms) : "—"}
          </pre>
          {signed ? (
            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 ${
                compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {tx.agreeTermsAccepted}
            </div>
          ) : null}
        </section>

        <section
          className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.03] ${
            compact ? "p-3" : "p-5 sm:p-6"
          }`}
        >
          <AgreementSectionTitle compact={compact}>{tx.paymentSchedule}</AgreementSectionTitle>
          <p className={`mt-3 leading-6 text-slate-500 ${compact ? "text-[11px]" : "text-xs sm:text-sm"}`}>
            {tx.paymentScheduleIntro}
          </p>

          {!compact ? (
            <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 shadow-sm md:block">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="bg-[#0033A0] text-left text-[10px] font-bold uppercase tracking-wide text-white">
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5">{tx.scheduleStage}</th>
                    <th className="px-4 py-3.5">{tx.scheduleAmount}</th>
                    {showMilestoneTargetDates ? (
                      <th className="px-4 py-3.5">{tx.scheduleTargetDate}</th>
                    ) : null}
                    {showMilestonePaymentDue ? (
                      <th className="px-4 py-3.5">{tx.schedulePaymentDue}</th>
                    ) : null}
                    <th className="px-4 py-3.5">{tx.scheduleStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentScheduleRows.map((row, i) => (
                    <tr key={`${row.index}-${row.stage}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                      <td className="px-4 py-4 font-semibold text-slate-500">{row.index}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{row.stage}</td>
                      <td className="px-4 py-4 tabular-nums text-base font-black text-[#0033A0]">{money(row.amount)} ֏</td>
                      {showMilestoneTargetDates ? (
                        <td className="px-4 py-4 text-slate-700">
                          {row.targetDate ? formatDateDMY(row.targetDate) : "—"}
                        </td>
                      ) : null}
                      {showMilestonePaymentDue ? (
                        <td className="px-4 py-4 font-medium text-slate-800">
                          {row.paymentDue || "—"}
                        </td>
                      ) : null}
                      <td className="px-4 py-4">{milestoneStatusBadge(signed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <ul className={`mt-5 space-y-3 ${compact ? "" : "md:hidden"}`}>
            {paymentScheduleRows.map((row) => (
              <li
                key={`${row.index}-${row.stage}-mobile`}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03]"
              >
                <div className="flex items-center justify-between gap-2 bg-[#0033A0] px-3.5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/90">
                    {tx.scheduleStage} {row.index}
                  </span>
                  {milestoneStatusBadge(signed)}
                </div>
                <div className={`space-y-2.5 px-3.5 ${compact ? "py-3" : "py-4"}`}>
                  <p className={`font-semibold leading-snug text-slate-900 ${compact ? "text-xs" : "text-sm"}`}>
                    {row.stage}
                  </p>
                  <p className={`font-black tabular-nums text-[#0033A0] ${compact ? "text-base" : "text-lg"}`}>
                    {money(row.amount)} ֏
                  </p>
                  {row.targetDate ? (
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.scheduleTargetDate}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{formatDateDMY(row.targetDate)}</p>
                    </div>
                  ) : null}
                  {row.paymentDue ? (
                    <div className="rounded-xl bg-[#0033A0]/[0.06] px-3 py-2.5 ring-1 ring-[#0033A0]/10">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#0033A0]">{tx.schedulePaymentDue}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{row.paymentDue}</p>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <AgreementPaymentTotal
            total={Number(agreement.total_price || 0)}
            vatMode={agreement.vat_mode}
            labels={{
              total: tx.total,
              vatStatusIncluded: tx.vatStatusIncluded,
              vatStatusExempt: tx.vatStatusExempt
            }}
          />
        </section>
        {isDraft ? (
          <section className="rounded-2xl border border-[#0033A0]/20 bg-gradient-to-br from-white via-slate-50/50 to-[#0033A0]/[0.03] p-5 shadow-sm ring-1 ring-[#0033A0]/10 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0033A0] text-white shadow-md">
                <PenLine className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">{tx.pendingSignature}</p>
                <p className="mt-1 text-xs leading-6 text-slate-600 sm:text-sm">{tx.previewSignHint}</p>
              </div>
            </div>
            <div className="mt-4 h-[180px] rounded-2xl border-2 border-dashed border-slate-300/90 bg-white shadow-inner" aria-hidden />
          </section>
        ) : null}

        {signatureBlock}
        {signedSuccessBlock}
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-100 via-[#f8fafc] to-slate-200/90 px-3 py-5 sm:px-4 sm:py-8 md:py-10">
      {card}
    </main>
  );
}
