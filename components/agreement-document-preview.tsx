
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
  scope_of_work?: string;
  scope_exclusions?: string;
  estimated_completion_date?: string;
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
    phaseAwaitingSign: string;
    providerDetails: string;
    clientDetails: string;
    businessName: string;
    providerNameLabel: string;
    serviceAreaLabel: string;
    client: string;
    project: string;
    total: string;
    termsAndConditions: string;
    scopeOfWork: string;
    scopeExclusions: string;
    estimatedCompletionDate: string;
    paymentSchedule: string;
    paymentScheduleIntro: string;
    scheduleStage: string;
    scheduleAmount: string;
    scheduleCondition: string;
    scheduleStatus: string;
    statusSigned: string;
    pendingSignature: string;
    conditionStage: string;
    conditionSingle: string;
    singlePaymentLabel: string;
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
    phaseAwaitingSign: "Awaiting signature",
    providerDetails: "Provider Details",
    clientDetails: "Client Details",
    businessName: "Business name",
    providerNameLabel: "Provider name",
    serviceAreaLabel: "Service area",
    client: "Client",
    project: "Project / Service",
    total: "Total price",
    termsAndConditions: "Terms & Conditions",
    scopeOfWork: "Scope of Work (Included)",
    scopeExclusions: "What is NOT Included",
    estimatedCompletionDate: "Estimated Completion Date",
    paymentSchedule: "Payment Schedule",
    paymentScheduleIntro:
      "The payment schedule below is accepted in full with your single signature at the bottom.",
    scheduleStage: "Stage",
    scheduleAmount: "Amount",
    scheduleCondition: "Condition / Trigger",
    scheduleStatus: "Status",
    statusSigned: "Signed",
    pendingSignature: "Pending signature",
    conditionStage: "Upon completion of: {stage}",
    conditionSingle: "Upon completion of all work under this agreement",
    singlePaymentLabel: "Full payment",
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
    phaseAwaitingSign: "Սպասում է ստորագրման",
    providerDetails: "Մատակարարի տվյալներ",
    clientDetails: "Հաճախորդի տվյալներ",
    businessName: "Բիզնեսի անվանում",
    providerNameLabel: "Մատակարարի անուն",
    serviceAreaLabel: "Տարածք",
    client: "Հաճախորդ",
    project: "Նախագիծ / Ծառայություն",
    total: "Ընդհանուր գին",
    termsAndConditions: "Պայմաններ",
    scopeOfWork: "Աշխատանքի շրջանակ (ներառված)",
    scopeExclusions: "Ինչը չի ներառվում",
    estimatedCompletionDate: "Ավարտի մոտավոր ամսաթիվ",
    paymentSchedule: "Վճարման ժամանակացույց",
    paymentScheduleIntro:
      "Ստորև նշված է վճարման ժամանակացույցը, որը դուք ընդունում եք մեկ ստորագրությամբ։",
    scheduleStage: "Փուլ",
    scheduleAmount: "Գումար",
    scheduleCondition: "Պայման / Շարժիչ",
    scheduleStatus: "Կարգավիճակ",
    statusSigned: "Ստորագրված",
    pendingSignature: "Սպասում է ստորագրության",
    conditionStage: "Այս փուլի ավարտից հետո՝ {stage}",
    conditionSingle: "Պայմանագրով ամբողջ աշխատանքի ավարտից հետո",
    singlePaymentLabel: "Լրիվ վճարում",
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
    phaseAwaitingSign: "Ожидает подписи",
    providerDetails: "Исполнитель",
    clientDetails: "Клиент",
    businessName: "Название бизнеса",
    providerNameLabel: "Имя исполнителя",
    serviceAreaLabel: "Регион",
    client: "Клиент",
    project: "Проект / услуга",
    total: "Общая стоимость",
    termsAndConditions: "Условия",
    scopeOfWork: "Объём работ (включено)",
    scopeExclusions: "Что НЕ включено",
    estimatedCompletionDate: "Ориентировочная дата завершения",
    paymentSchedule: "График платежей",
    paymentScheduleIntro: "Ниже указан график платежей, который вы принимаете одной подписью.",
    scheduleStage: "Этап",
    scheduleAmount: "Сумма",
    scheduleCondition: "Условие / триггер",
    scheduleStatus: "Статус",
    statusSigned: "Подписано",
    pendingSignature: "Ожидает подписи",
    conditionStage: "После завершения этапа: {stage}",
    conditionSingle: "После выполнения всех работ по соглашению",
    singlePaymentLabel: "Полная оплата",
    previewId: "Черновик"
  }
};

function buildPreviewScheduleRows(
  agreement: PreviewAgreement,
  tx: {
    conditionStage: string;
    conditionSingle: string;
    singlePaymentLabel: string;
  }
) {
  if (agreement.payment_type === "milestones" && (agreement.milestones?.length ?? 0) > 0) {
    return (agreement.milestones ?? []).map((m, i) => ({
      index: i + 1,
      stage: m.title,
      amount: Number(m.amount || 0),
      condition: tx.conditionStage.replace("{stage}", m.title)
    }));
  }

  return [
    {
      index: 1,
      stage: tx.singlePaymentLabel,
      amount: Number(agreement.total_price || 0),
      condition: tx.conditionSingle
    }
  ];
}

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
  const paymentScheduleRows = buildPreviewScheduleRows(agreement, tx);
  const isSigned = agreement.status === "signed" || agreement.status === "completed";

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

      {agreement.scope_of_work?.trim() ||
      agreement.scope_exclusions?.trim() ||
      agreement.estimated_completion_date?.trim() ? (
        <section className="mt-6 space-y-4 rounded border border-slate-200 p-4">
          {agreement.scope_of_work?.trim() ? (
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.scopeOfWork}</p>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
                {agreement.scope_of_work.trim()}
              </pre>
            </div>
          ) : null}
          {agreement.scope_exclusions?.trim() ? (
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.scopeExclusions}</p>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
                {agreement.scope_exclusions.trim()}
              </pre>
            </div>
          ) : null}
          {agreement.estimated_completion_date?.trim() ? (
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.estimatedCompletionDate}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {formatDateDMY(agreement.estimated_completion_date)}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 rounded border border-slate-200 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.termsAndConditions}</p>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
          {terms || "—"}
        </pre>
      </section>

      <section className="mt-6 rounded border border-slate-200 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.paymentSchedule}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{tx.paymentScheduleIntro}</p>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-4">{tx.scheduleStage}</th>
                <th className="pb-2 pr-4">{tx.scheduleAmount}</th>
                <th className="pb-2 pr-4">{tx.scheduleCondition}</th>
                <th className="pb-2">{tx.scheduleStatus}</th>
              </tr>
            </thead>
            <tbody>
              {paymentScheduleRows.map((row) => (
                <tr key={`${row.index}-${row.stage}`} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-3 font-semibold text-slate-700">{row.index}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{row.stage}</td>
                  <td className="py-3 pr-4 tabular-nums font-bold text-[#0033A0]">{money(row.amount)} ֏</td>
                  <td className="py-3 pr-4 text-slate-700">{row.condition}</td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {isSigned ? tx.statusSigned : tx.pendingSignature}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 space-y-3 md:hidden">
          {paymentScheduleRows.map((row) => (
            <li key={`${row.index}-${row.stage}-mobile`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tx.scheduleStage} {row.index}
                </p>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {isSigned ? tx.statusSigned : tx.pendingSignature}
                </span>
              </div>
              <p className="mt-2 font-semibold text-slate-900">{row.stage}</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-[#0033A0]">{money(row.amount)} ֏</p>
              <p className="mt-2 text-xs text-slate-500">{tx.scheduleCondition}</p>
              <p className="mt-0.5 text-sm text-slate-700">{row.condition}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-sm font-semibold text-slate-800">
            {tx.total}: {money(Number(agreement.total_price || 0))} ֏
          </p>
        </div>
      </section>
    </article>
  );
}
