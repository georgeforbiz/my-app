
import type { Language } from "@/lib/i18n/locales";
import { formatDateDMY } from "@/lib/format-date";

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

type PreviewAgreement = {
  id: string;
  provider_name?: string;
  provider_full_name?: string;
  provider_business_name?: string;
  business_name?: string;
  full_name?: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms?: string;
  total_price: number;
  payment_type: "single" | "milestones";
  milestones: { title: string; amount: number }[] | null;
  created_at: string;
  status?: "pending" | "signed" | "completed";
  payment_status?: "pending" | "escrow_held" | "released";
};

function resolveProviderNameFields(a: PreviewAgreement): { business: string; full: string } {
  let business = (a.business_name ?? a.provider_business_name ?? "").trim();
  let full = (a.full_name ?? a.provider_full_name ?? "").trim();
  if (!business && !full) {
    const pn = (a.provider_name ?? "").trim();
    if (pn) {
      const paren = pn.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (paren) {
        business = paren[1].trim();
        full = paren[2].trim();
      } else {
        business = pn;
      }
    }
  }
  // Mirror so neither line shows "—" when only one name is known.
  if (!business && full) business = full;
  if (!full && business) full = business;
  return { business, full };
}

const labels: Record<
  Language,
  {
    offer: string;
    title: string;
    subtitle: string;
    draftBanner: string;
    agreementId: string;
    creationDate: string;
    agreementPhase: string;
    paymentPhase: string;
    phaseAwaitingSign: string;
    phasePayPending: string;
    providerDetails: string;
    clientDetails: string;
    businessName: string;
    providerNameLabel: string;
    serviceAreaLabel: string;
    client: string;
    project: string;
    total: string;
    termsAndConditions: string;
    milestones: string;
    previewId: string;
  }
> = {
  en: {
    offer: "VSTAH Offer",
    title: "Secure Service Agreement",
    subtitle: "Review the details below before signing.",
    draftBanner: "Preview — not yet saved. Share link appears after you create the agreement.",
    agreementId: "Agreement ID",
    creationDate: "Creation Date",
    agreementPhase: "Agreement",
    paymentPhase: "Payment",
    phaseAwaitingSign: "Awaiting signature",
    phasePayPending: "Awaiting deposit",
    providerDetails: "Provider Details",
    clientDetails: "Client Details",
    businessName: "Business name",
    providerNameLabel: "Provider name",
    serviceAreaLabel: "Service area",
    client: "Client",
    project: "Project / Service",
    total: "Total price",
    termsAndConditions: "Terms & Conditions",
    milestones: "Milestones",
    previewId: "Draft preview"
  },
  hy: {
    offer: "VSTAH առաջարկ",
    title: "Անվտանգ պայմանագիր",
    subtitle: "Ստուգեք տվյալները ստորագրելուց առաջ։",
    draftBanner: "Նախադիտում — դեռ չի պահպանվել։ Հղումը հասանելի կլինի ստեղծելուց հետո։",
    agreementId: "ID",
    creationDate: "Ստեղծման ամսաթիվ",
    agreementPhase: "Պայմանագիր",
    paymentPhase: "Վճարում",
    phaseAwaitingSign: "Սպասում է ստորագրման",
    phasePayPending: "Սպասում է դեպոզիտի",
    providerDetails: "Մատակարարի տվյալներ",
    clientDetails: "Հաճախորդի տվյալներ",
    businessName: "Բիզնեսի անվանում",
    providerNameLabel: "Մատակարարի անուն",
    serviceAreaLabel: "Տարածք",
    client: "Հաճախորդ",
    project: "Նախագիծ / Ծառայություն",
    total: "Ընդհանուր գին",
    termsAndConditions: "Պայմաններ",
    milestones: "Փուլեր",
    previewId: "Նախադիտում"
  },
  ru: {
    offer: "Предложение VSTAH",
    title: "Сервисное соглашение с защитой",
    subtitle: "Проверьте детали ниже перед принятием.",
    draftBanner: "Предпросмотр — ещё не сохранено. Ссылка появится после создания.",
    agreementId: "ID соглашения",
    creationDate: "Дата создания",
    agreementPhase: "Соглашение",
    paymentPhase: "Оплата",
    phaseAwaitingSign: "Ожидает подписи",
    phasePayPending: "Ожидает депозита",
    providerDetails: "Исполнитель",
    clientDetails: "Клиент",
    businessName: "Название бизнеса",
    providerNameLabel: "Имя исполнителя",
    serviceAreaLabel: "Регион",
    client: "Клиент",
    project: "Проект / услуга",
    total: "Общая стоимость",
    termsAndConditions: "Условия",
    milestones: "Этапы",
    previewId: "Черновик"
  }
};

export function AgreementDocumentPreview({
  agreement,
  lang,
  draft = false
}: {
  agreement: PreviewAgreement;
  lang: Language;
  draft?: boolean;
}) {
  const tx = labels[lang] ?? labels.en;
  const providerFields = resolveProviderNameFields(agreement);
  const serviceAreaDisplay = agreement.service_area?.trim() || "Armenia";
  const isDraft = draft || agreement.id === "draft";
  const readableAgreementId = isDraft
    ? tx.previewId
    : `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  const terms = agreement.custom_terms?.trim() || "";

  return (
    <article className="relative w-full rounded-md border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:px-10 md:py-9">
      {isDraft ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          {tx.draftBanner}
        </p>
      ) : null}

      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{tx.offer}</p>
        <h2 className="mt-2 text-2xl font-black text-[#0033A0] md:text-3xl">{tx.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{tx.subtitle}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.agreementId}</p>
          <p className="mt-1 font-semibold">{readableAgreementId}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.creationDate}</p>
          <p className="mt-1 font-semibold">{formatDateDMY(agreement.created_at)}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.agreementPhase}</p>
          <p className="mt-1 font-bold text-slate-900">{tx.phaseAwaitingSign}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.paymentPhase}</p>
          <p className="mt-0.5 font-bold text-slate-900">{tx.phasePayPending}</p>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="min-w-0 rounded border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.providerDetails}</p>
          <div className="mt-2 space-y-2 text-sm text-slate-800">
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.businessName}:</span> {providerFields.business || "—"}
            </p>
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.providerNameLabel}:</span> {providerFields.full || "—"}
            </p>
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.serviceAreaLabel}:</span> {serviceAreaDisplay}
            </p>
          </div>
        </div>
        <div className="min-w-0 rounded border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.clientDetails}</p>
          <div className="mt-2 space-y-2 text-sm text-slate-800">
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.client}:</span> {agreement.client_name}
            </p>
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.project}:</span> {agreement.project_title}
            </p>
            <p className="break-words leading-snug [overflow-wrap:anywhere]">
              <span className="font-bold text-slate-900">{tx.total}:</span> {money(Number(agreement.total_price || 0))} ֏
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded border border-slate-200 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.termsAndConditions}</p>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
          {terms || "—"}
        </pre>
      </section>

      <div className="mt-3 border-t border-slate-200 pt-3 text-left">
        <p className="text-sm font-semibold text-slate-800">
          {tx.total}: {money(Number(agreement.total_price || 0))} ֏
        </p>
      </div>

      {agreement.payment_type === "milestones" && (agreement.milestones?.length ?? 0) > 0 ? (
        <section className="mt-6 rounded border border-slate-200 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.milestones}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {(agreement.milestones ?? []).map((m, i) => (
              <li key={`${m.title}-${i}`} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                {i + 1}. {m.title} — {money(Number(m.amount || 0))} ֏
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
