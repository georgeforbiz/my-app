"use client";

import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Hash,
  MapPin,
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
  milestones: { title: string; amount: number; target_date?: string }[] | null;
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
      targetDate: m.target_date?.trim() || undefined
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

function AgreementSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <span className="h-7 w-1 shrink-0 rounded-full sm:h-8" style={{ backgroundColor: NAVY }} aria-hidden />
      <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-800 sm:text-sm sm:tracking-wider">
        {children}
      </h2>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 p-3.5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0] sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
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
  viewerUserId
}: {
  agreement: AgreementDocumentData;
  lang: Language;
  draft?: boolean;
  /** When true, skip full-page background wrapper (modal embed). */
  embedded?: boolean;
  /** Signed-in provider id — enables saved-logo fallback in dashboard preview. */
  viewerUserId?: string;
}) {
  const tx = getAgreementDocumentLabels(lang);
  const isDraft = draft || agreement.id === "draft";
  const signed = isAgreementSigned(agreement);
  const providerFields = resolveProviderNameFields(agreement);
  const serviceAreaDisplay = agreement.service_area?.trim() || "Armenia";
  const readableAgreementId = isDraft
    ? tx.previewId
    : `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  const paymentScheduleRows = buildPaymentScheduleRows(agreement, tx);
  const showMilestoneTargetDates = paymentScheduleRows.some((row) => Boolean(row.targetDate));
  const terms = agreement.custom_terms?.trim() || "";
  const providerLogo = useAgreementProviderLogo(agreement, viewerUserId) ?? null;
  const providerLogoSrc =
    withProviderLogoCacheBust(
      providerLogo,
      agreement.provider_id ?? viewerUserId ?? agreement.id,
      agreement.created_at
    ) ?? providerLogo;
  const signatureImage =
    typeof agreement.client_signature === "string" && agreement.client_signature.startsWith("data:image/")
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

  const card = (
    <div className="mx-auto w-full min-w-0 max-w-[min(100%,55rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04]">
      {isDraft ? (
        <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-3 sm:px-8">
          <p className="text-sm font-semibold text-amber-900">{tx.draftBanner}</p>
        </div>
      ) : null}

      <header className="border-b border-slate-100 bg-gradient-to-br from-[#0033A0]/[0.08] via-white to-[#F2A800]/[0.06] px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-xs">{tx.offer}</p>
            <h1 className="mt-2 text-balance text-2xl font-black leading-tight text-[#0033A0] sm:text-3xl">{tx.title}</h1>
            <p className="mt-2 text-base font-bold text-slate-900">{agreement.project_title}</p>
            {signed ? (
              <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-emerald-800">{tx.subtitleSigned}</p>
            ) : (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{tx.subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            {providerLogo ? (
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
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetaCard icon={Hash} label={tx.agreementId} value={readableAgreementId} />
          <MetaCard icon={Calendar} label={tx.creationDate} value={formatDateDMY(agreement.created_at)} />
          <MetaCard icon={FileText} label={tx.agreementPhase} value={phaseLabel} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-5">
            <AgreementSectionTitle>{tx.providerDetails}</AgreementSectionTitle>
            <dl className="mt-4 space-y-3 text-sm text-slate-800">
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
                <User className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.providerNameLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {providerFields.full || "—"}
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
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.serviceAreaLabel}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {serviceAreaDisplay}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-5">
            <AgreementSectionTitle>{tx.clientDetails}</AgreementSectionTitle>
            <dl className="mt-4 space-y-3 text-sm text-slate-800">
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
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.project}</dt>
                  <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">
                    {agreement.project_title}
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

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
          <AgreementSectionTitle>{tx.termsAndConditions}</AgreementSectionTitle>
          <pre className="mt-4 max-h-[min(24rem,50vh)] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50/70 p-4 font-sans text-sm leading-7 text-slate-700 sm:max-h-none sm:overflow-visible sm:p-5">
            {terms ? formatEmbeddedDatesInTerms(terms) : "—"}
          </pre>
          {signed ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {tx.agreeTermsAccepted}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
          <AgreementSectionTitle>{tx.paymentSchedule}</AgreementSectionTitle>
          <p className="mt-3 text-xs leading-6 text-slate-500 sm:text-sm">{tx.paymentScheduleIntro}</p>

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
                    <td className="px-4 py-4">{milestoneStatusBadge(signed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-3 md:hidden">
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
                <div className="space-y-2.5 px-3.5 py-4">
                  <p className="font-semibold leading-snug text-slate-900">{row.stage}</p>
                  <p className="text-xl font-black tabular-nums text-[#0033A0]">{money(row.amount)} ֏</p>
                  {row.targetDate ? (
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.scheduleTargetDate}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{formatDateDMY(row.targetDate)}</p>
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

        {signatureImage && signed ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#0033A0]/[0.07] to-slate-50/80 px-4 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0033A0] sm:text-[11px]">
                  {tx.clientSignature}
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">{agreement.client_name}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                {tx.signedAndApproved}
              </span>
            </div>
            <div className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-6 sm:px-8 sm:py-8">
              <div className="relative mx-auto max-w-lg rounded-xl bg-white p-5 shadow-inner ring-1 ring-slate-200/90 sm:p-8">
                <div
                  className="pointer-events-none absolute inset-x-6 bottom-5 border-b border-slate-300/90 sm:inset-x-10 sm:bottom-8"
                  aria-hidden
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureImage}
                  alt=""
                  className="relative z-[1] mx-auto block h-auto max-h-32 w-auto max-w-full object-contain sm:max-h-40"
                />
              </div>
            </div>
          </section>
        ) : null}

        {signed && !isDraft ? (
          <div className="flex gap-4 rounded-2xl border border-emerald-200/90 bg-white p-5 shadow-sm ring-1 ring-emerald-100 sm:gap-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:h-12 sm:w-12">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">{tx.signedAndApproved}</p>
              <p className="mt-2 text-base font-semibold leading-snug text-slate-700">{tx.signedSuccessNote}</p>
              <p className="mt-2 text-sm text-slate-500">{tx.signedSuccessHint}</p>
            </div>
          </div>
        ) : null}
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
