"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Calendar, Hash, FileText, User, Building2, MapPin, Briefcase, PenLine } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import {
  getLocalAgreement,
  isLocalAgreementId,
  updateLocalAgreement
} from "@/lib/agreements/local-store";
import { formatDateDMY } from "@/lib/format-date";
import { useLanguage } from "@/lib/i18n/language-context";
import { normalizeAgreementRow } from "@/lib/agreements/row";
import { NAVY, ORANGE } from "@/lib/brand";

async function postAgreementAction(
  agreementId: string,
  body: Record<string, unknown> = {}
): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  code?: string;
  alreadySigned?: boolean;
  /** Request included a valid data-URL signature string (API accepted it for `client_signature`). */
  signatureSaved?: boolean;
  /** Confirmed non-empty `client_signature` on the row returned by PostgREST after update. */
  signatureStored?: boolean;
}> {
  if (isLocalAgreementId(agreementId)) {
    return { ok: false, status: 0, error: "Local agreement" };
  }
  let res: Response;
  try {
    res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : "Request failed" };
  }
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    ok?: boolean;
    alreadySigned?: boolean;
    signatureSaved?: boolean;
    signatureStored?: boolean;
  };
  return { ok: res.ok, status: res.status, ...data };
}

type AgreementStatus = "pending" | "signed" | "completed";
type Agreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_full_name?: string;
  provider_business_name?: string;
  full_name?: string;
  business_name?: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  scope_of_work?: string;
  scope_exclusions?: string;
  estimated_completion_date?: string;
  total_price: number;
  payment_type: "single" | "milestones";
  milestones: { title: string; amount: number; status?: "pending" | "escrow_held" | "released" }[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  client_signature?: string;
  created_at: string;
};

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function resolveProviderNameFields(a: Agreement): { business: string; full: string } {
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

  // If only one name is present, mirror it so the UI doesn't show "—".
  if (!business && full) business = full;
  if (!full && business) full = business;

  return { business, full };
}

type PaymentScheduleRow = {
  index: number;
  stage: string;
  amount: number;
  condition: string;
};

function buildPaymentScheduleRows(
  agreement: Agreement,
  tx: {
    conditionStage: string;
    conditionSingle: string;
    singlePaymentLabel: string;
  }
): PaymentScheduleRow[] {
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

function AgreementSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <span className="h-7 w-1 shrink-0 rounded-full sm:h-8" style={{ backgroundColor: NAVY }} aria-hidden />
      <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-800 sm:text-sm sm:tracking-wider">{children}</h2>
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
        <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">{value}</p>
      </div>
    </div>
  );
}

export default function AgreementClientPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const shouldAutoDownload = searchParams.get("download") === "1";
  /** Remount when navigating between agreement IDs so state and effects match the URL. */
  const routeKey = typeof id === "string" && id.length > 0 ? id : "pending";
  const supabase = getSupabaseBrowser();
  const { language } = useLanguage();
  const tx =
    language === "hy"
      ? {
          loading: "Բեռնում…",
          notConfigured: "Supabase-ը կարգավորված չէ։",
          notFound: "Պայմանագիրը չի գտնվել։",
          localLinkNotFound:
            "Այս հղումը հասանելի է միայն ստեղծողի սարքում։ Խնդրեք մատակարարին նոր հղում ուղարկել վահանակից։",
          offer: "Առաջարկ",
          title: "Անվտանգ պայմանագիր",
          subtitle: "Ստուգեք տվյալները ստորագրելուց առաջ։",
          client: "Հաճախորդ",
          project: "Նախագիծ / Ծառայություն",
          total: "Ընդհանուր գին",
          status: "Կարգավիճակ",
          paymentType: "Վճարման տեսակ",
          milestones: "Փուլեր",
          milestonesValue: "Փուլային",
          singleValue: "Մեկանգամյա",
          paymentSchedule: "Վճարման ժամանակացույց",
          paymentScheduleIntro:
            "Ստորև նշված է վճարման ժամանակացույցը, որը դուք ընդունում եք մեկ ստորագրությամբ։",
          scheduleStage: "Փուլ",
          scheduleAmount: "Գումար",
          scheduleCondition: "Պայման / Շարժիչ",
          scheduleStatus: "Կարգավիճակ",
          pendingSignature: "Սպասում է ստորագրության",
          conditionStage: "Այս փուլի ավարտից հետո՝ {stage}",
          conditionSingle: "Պայմանագրով ամբողջ աշխատանքի ավարտից հետո",
          singlePaymentLabel: "Լրիվ վճարում",
          optionalSignature: "Ձեր ստորագրությունը",
          signatureHint:
            "Ստորագրելով ներքևում, դուք ընդունում եք ամբողջ շրջանակը, պայմանները և վճարման ժամանակացույցը։",
          clearSignature: "Մաքրել ստորագրությունը",
          signing: "Ստորագրում…",
          signAndAccept: "Ստորագրել և ընդունել պայմանագիրը",
            signedSuccess: "Պայմանագիրը ստորագրված է",
            signedSuccessNote: "Մատակարարը ծանուցված է։",
            signedSuccessHint: "Հաշիվ պարտադիր չէ։",
            signedAndApproved: "Ստորագրված և հաստատված",
            agreeTerms: "Կարդացել և համաձայն եմ Պայմաններին",
            agreeTermsRequired: "Ստորագրելուց առաջ համաձայնեք Պայմաններին։",
            agreeTermsAccepted: "Պայմաններն ընդունված են",
            clientSignature: "Հաճախորդի ստորագրություն",
          signFailed: "Չհաջողվեց ստորագրել պայմանագիրը։ Փորձեք կրկին։",
          signBlocked:
            "Պահեստը թույլ չի տալիս պահել ստորագրությունը։ Սերվերում ավելացրեք SUPABASE_SERVICE_ROLE_KEY կամ թարմացրեք Supabase RLS քաղաքականությունները։",
          releaseMilestone: "Արձակել փուլը",
          releasingMilestone: "Արձակում…",
          depositMilestone: "Դեպոզիտ",
          depositingMilestone: "Դեպոզիտ…",
          escrowHeld: "Պահվում է",
          releaseTotalPayment: "Արձակել ամբողջ վճարումը",
          releasingTotalPayment: "Վճարում…",
          depositEscrow: "Դեպոզիտ 100,000 ֏",
          depositingEscrow: "Դեպոզիտ…",
          paid: "Վճարված",
          pendingMilestone: "Սպասում",
          paymentSuccessful: "Վճարումը արձակված է։ Մատակարարը ծանուցվել է։",
          transactionComplete: "Գործարքը ավարտված է",
          transactionCompleteBody:
            "Բոլոր վճարային պարտավորությունները կատարված են։ Այս պայմանագիրը փակված է։",
          paidInFull: "ԼՐԻՎ ՎՃԱՐՎԱԾ",
          backHome: "Գլխավոր",
          agreementPhase: "Պայմանագիր",
          paymentPhase: "Վճարում",
          phaseAwaitingSign: "Սպասում է ստորագրման",
          phaseSigned: "Ստորագրված",
          phaseCompleted: "Ավարտված",
          phasePayPending: "Սպասում է դեպոզիտի",
          phasePayVerification: "Վճարման ստուգումը սպասման մեջ է",
          phasePayEscrow: "Գումարը պահվում է",
          phasePayReleased: "Արձակված է",
          depositTotalToEscrow: "Դեպոզիտել ընդհանուր գումարը",
          agreementId: "ID",
          creationDate: "Ստեղծման ամսաթիվ",
          providerDetails: "Մատակարարի տվյալներ",
          clientDetails: "Հաճախորդի տվյալներ",
          termsAndConditions: "Պայմաններ",
          scopeOfWork: "Աշխատանքի շրջանակ (ներառված)",
          scopeExclusions: "Ինչը չի ներառվում",
          estimatedCompletionDate: "Ավարտի մոտավոր ամսաթիվ",
          name: "Անուն",
          fullName: "Ամբողջ անուն",
          businessName: "Բիզնեսի անվանում",
          providerNameLabel: "Մատակարարի անուն",
          serviceAreaLabel: "Տարածք",
          statusSigned: "Ստորագրված",
          statusPending: "Սպասում",
          previousMilestoneNotFinished:
            "Նախորդ փուլը բաց է։ Դեպոզիտ անե՞լ այս փուլը հերթից շուտ։",
          releaseMilestoneFailed: "Չհաջողվեց արձակել փուլի գումարը։ Փորձեք կրկին։",
          depositMilestoneFailed: "Չհաջողվեց դեպոզիտ կատարել այս փուլի համար։ Փորձեք կրկին։",
          releasePaymentFailed: "Չհաջողվեց արձակել վճարումը։ Փորձեք կրկին։",
          depositEscrowFailed: "Չհաջողվեց դեպոզիտ կատարել։ Փորձեք կրկին։",
          fundsSecuredTitle: "Գումարը ապահովված է",
          fundsSecuredBody:
            "Գումարը պահվում է և չի փոխանցվի մատակարարին, քանի դեռ դուք չեք հաստատել աշխատանքի ավարտը։",
          confirmReleaseTotal:
            "Հաստատե՞լ, որ աշխատանքը ավարտված է։ Գումարը կփոխանցվի մատակարարին։",
          confirmReleaseMilestone:
            "Հաստատե՞լ այս փուլը։ Փուլի գումարը կփոխանցվի մատակարարին։",
          approveRelease: "Հաստատել",
          cancelRelease: "Չեղարկել",
          transferTitle: "Բանկային փոխանցում",
          demoOnly: "ԴԵՄՈ — իրական գումար մի փոխանցեք",
          transferIntro:
            "Կատարեք բանկային փոխանցում ստորև նշված տվյալներով։ Պարտադիր նշեք վճարման հղումը։",
          depositAmount: "Դեպոզիտի գումար",
          bankName: "Բանկ",
          accountNumber: "Հաշվեհամար",
          beneficiaryName: "Շահառու",
          paymentReference: "Վճարման հղում / Գործարքի ID",
          transferInstructions: "Փոխանցման հրահանգներ",
          transferInstructionsBody:
            "Ձեր բանկի հավելվածում ստեղծեք փոխանցում, ճշգրիտ պատճենեք տվյալները և նշանակության դաշտում գրեք վճարման հղումը։",
          madeTransfer: "Փոխանցումը կատարել եմ",
          cancelTransfer: "Չեղարկել",
          verificationPending: "Վճարման ստուգումը սպասման մեջ է",
          depositSubmitted:
            "Փոխանցումը ներկայացված է և սպասում է ստուգման։ Գումարը կապահովվի ադմինի հաստատումից հետո։",
          confirmPaymentReceived: "Հաստատել վճարումը (դեմո)",
          verifyingPayment: "Ստուգում…",
          escrowLegalNote: "Վճարումների պահպանումը՝ ՀՀ օրենքով։"
        }
      : language === "ru"
        ? {
            loading: "Загрузка соглашения…",
            notConfigured: "Supabase не настроен.",
            notFound: "Соглашение не найдено.",
            localLinkNotFound:
              "Эта ссылка работает только на устройстве создателя. Попросите исполнителя отправить новую ссылку из панели.",
            offer: "Предложение",
            title: "Сервисное соглашение с защитой",
            subtitle: "Проверьте детали ниже перед принятием.",
            client: "Клиент",
            project: "Проект / услуга",
            total: "Общая стоимость",
            status: "Статус",
            paymentType: "Тип оплаты",
            milestones: "Этапы",
            milestonesValue: "По этапам",
            singleValue: "Единовременно",
            paymentSchedule: "График платежей",
            paymentScheduleIntro:
              "Ниже указан график платежей, который вы принимаете одной подписью.",
            scheduleStage: "Этап",
            scheduleAmount: "Сумма",
            scheduleCondition: "Условие / триггер",
            scheduleStatus: "Статус",
            pendingSignature: "Ожидает подписи",
            conditionStage: "После завершения этапа: {stage}",
            conditionSingle: "После выполнения всех работ по соглашению",
            singlePaymentLabel: "Полная оплата",
            optionalSignature: "Ваша подпись",
            signatureHint:
              "Подписывая ниже, вы принимаете полный объём работ, условия и график платежей.",
            clearSignature: "Очистить",
            signing: "Подписание…",
            signAndAccept: "Подписать и принять",
            signedSuccess: "Соглашение подписано",
            signedSuccessNote: "Исполнитель уведомлён.",
            signedSuccessHint: "Регистрация не требуется.",
            signedAndApproved: "Подписано и одобрено",
            agreeTerms: "Я прочитал(а) и согласен(на) с Условиями",
            agreeTermsRequired: "Примите Условия перед подписанием.",
            agreeTermsAccepted: "Условия приняты",
            clientSignature: "Подпись клиента",
            signFailed: "Не удалось подписать. Попробуйте снова.",
            signBlocked:
              "Не удалось сохранить подпись (ограничение в базе). Добавьте SUPABASE_SERVICE_ROLE_KEY на сервер или настройте RLS в Supabase.",
            releaseMilestone: "Выплатить этап",
            releasingMilestone: "Выплата…",
            depositMilestone: "Депозит по этапу",
            depositingMilestone: "Внесение…",
            escrowHeld: "Удерживается",
            releaseTotalPayment: "Выплатить всё",
            releasingTotalPayment: "Обработка…",
            depositEscrow: "Депозит 100 000 ֏",
            depositingEscrow: "Внесение…",
            paid: "Оплачено",
            pendingMilestone: "Ожидает",
            paymentSuccessful: "Выплата отправлена. Исполнитель уведомлён.",
            transactionComplete: "Сделка завершена",
            transactionCompleteBody:
              "Все платежи закрыты. Соглашение закрыто.",
            paidInFull: "ОПЛАЧЕНО ПОЛНОСТЬЮ",
            backHome: "На главную",
            agreementPhase: "Соглашение",
            paymentPhase: "Оплата",
            phaseAwaitingSign: "Ждём подписи",
            phaseSigned: "Подписано",
            phaseCompleted: "Завершено",
            phasePayPending: "Ждём депозит",
            phasePayVerification: "Проверка платежа ожидается",
            phasePayEscrow: "Средства удерживаются",
            phasePayReleased: "Выплачено",
            depositTotalToEscrow: "Внести всю сумму",
            agreementId: "ID соглашения",
            creationDate: "Дата создания",
            providerDetails: "Исполнитель",
            clientDetails: "Клиент",
            termsAndConditions: "Условия",
            scopeOfWork: "Объём работ (включено)",
            scopeExclusions: "Что НЕ включено",
            estimatedCompletionDate: "Ориентировочная дата завершения",
            name: "Имя",
            fullName: "ФИО",
            businessName: "Компания",
            providerNameLabel: "Исполнитель",
            serviceAreaLabel: "Регион",
            statusSigned: "Подписано",
            statusPending: "Ожидает",
            previousMilestoneNotFinished:
              "Предыдущий этап ещё не закрыт. Внести депозит по этому этапу вне очереди?",
            releaseMilestoneFailed: "Не удалось выплатить этап. Попробуйте снова.",
            depositMilestoneFailed: "Не удалось внести депозит по этапу. Попробуйте снова.",
            releasePaymentFailed: "Не удалось выполнить выплату. Попробуйте снова.",
            depositEscrowFailed: "Не удалось внести средства. Попробуйте снова.",
            fundsSecuredTitle: "Средства защищены",
            fundsSecuredBody:
              "Деньги удерживаются и не уйдут исполнителю, пока вы не подтвердите, что работа выполнена.",
            confirmReleaseTotal:
              "Подтвердить, что работа выполнена? Средства будут переведены исполнителю.",
            confirmReleaseMilestone:
              "Подтвердить этот этап? Сумма этапа будет переведена исполнителю.",
            approveRelease: "Подтвердить",
            cancelRelease: "Отмена",
            transferTitle: "Банковский перевод",
            demoOnly: "ДЕМО — не переводите реальные деньги",
            transferIntro:
              "Сделайте банковский перевод по реквизитам ниже. Обязательно укажите назначение платежа.",
            depositAmount: "Сумма депозита",
            bankName: "Банк",
            accountNumber: "Номер счёта",
            beneficiaryName: "Получатель",
            paymentReference: "Назначение платежа / ID сделки",
            transferInstructions: "Инструкция по переводу",
            transferInstructionsBody:
              "Создайте перевод в приложении банка, точно скопируйте реквизиты и укажите назначение платежа в соответствующем поле.",
            madeTransfer: "Я совершил перевод",
            cancelTransfer: "Отмена",
            verificationPending: "Проверка платежа ожидается",
            depositSubmitted:
              "Перевод отправлен и ожидает проверки. Средства будут защищены после подтверждения администратором.",
            confirmPaymentReceived: "Подтвердить платёж (демо)",
            verifyingPayment: "Проверка…",
            escrowLegalNote: "Удержание платежей — по законодательству Республики Армения."
          }
        : {
            loading: "Loading agreement...",
            notConfigured: "Supabase is not configured.",
            notFound: "Agreement not found.",
            localLinkNotFound:
              "This link only works on the provider's device. Ask them to copy a new link from their dashboard.",
            offer: "Offer",
            title: "Safe Service Agreement",
            subtitle: "Review all details below before accepting this offer.",
            client: "Client",
            project: "Project / Service",
            total: "Total Price",
            status: "Status",
            paymentType: "Payment Type",
            milestones: "Milestones",
            milestonesValue: "Milestones",
            singleValue: "Single",
            paymentSchedule: "Payment Schedule",
            paymentScheduleIntro:
              "The payment schedule below is accepted in full with your single signature at the bottom.",
            scheduleStage: "Stage",
            scheduleAmount: "Amount",
            scheduleCondition: "Condition / Trigger",
            scheduleStatus: "Status",
            pendingSignature: "Pending signature",
            conditionStage: "Upon completion of: {stage}",
            conditionSingle: "Upon completion of all work under this agreement",
            singlePaymentLabel: "Full payment",
            optionalSignature: "Your signature",
            signatureHint:
              "By signing below, you accept the full scope, terms, and payment schedule above.",
            clearSignature: "Clear Signature",
            signing: "Signing...",
            signAndAccept: "Sign & Accept Agreement",
            signedSuccess: "Agreement signed",
            signedSuccessNote: "The provider has been notified.",
            signedSuccessHint: "No account required.",
            signedAndApproved: "Signed & Approved",
            agreeTerms: "I have read and agree to the Terms and Conditions",
            agreeTermsRequired: "Please agree to the Terms and Conditions before signing.",
            agreeTermsAccepted: "Terms accepted",
            clientSignature: "Client signature",
            signFailed: "Failed to sign agreement. Please try again.",
            signBlocked:
              "Signing could not be saved (database blocked the update). Add SUPABASE_SERVICE_ROLE_KEY to your server env, or adjust Supabase RLS policies for agreements.",
            releaseMilestone: "Release Milestone",
            releasingMilestone: "Releasing...",
            depositMilestone: "Deposit Funds",
            depositingMilestone: "Depositing...",
            escrowHeld: "In Vault",
            releaseTotalPayment: "Release Total Payment",
            releasingTotalPayment: "Processing payment...",
            depositEscrow: "Deposit 100,000 ֏",
            depositingEscrow: "Depositing...",
            paid: "Paid",
            pendingMilestone: "Pending",
            paymentSuccessful: "Payment Released! The provider has been notified.",
            transactionComplete: "Transaction Complete",
            transactionCompleteBody: "All payment obligations have been fulfilled. This agreement is now closed.",
            paidInFull: "PAID IN FULL",
            backHome: "Back to Home",
            agreementPhase: "Agreement",
            paymentPhase: "Payment",
            phaseAwaitingSign: "Awaiting signature",
            phaseSigned: "Signed",
            phaseCompleted: "Completed",
            phasePayPending: "Awaiting deposit",
            phasePayVerification: "Payment verification pending",
            phasePayEscrow: "Funds held",
            phasePayReleased: "Released",
            depositTotalToEscrow: "Deposit total",
            agreementId: "Agreement ID",
            creationDate: "Creation Date",
            providerDetails: "Provider Details",
            clientDetails: "Client Details",
            termsAndConditions: "Terms and Conditions",
            scopeOfWork: "Scope of Work (Included)",
            scopeExclusions: "What is NOT Included",
            estimatedCompletionDate: "Estimated Completion Date",
            name: "Name",
            fullName: "Full Name",
            businessName: "Business Name",
            providerNameLabel: "Provider Name",
            serviceAreaLabel: "Service Area",
            statusSigned: "Signed",
            statusPending: "Pending",
            previousMilestoneNotFinished: "Previous milestone is not finished yet. Do you want to deposit this milestone ahead of schedule?",
            releaseMilestoneFailed: "Failed to release milestone. Please try again.",
            depositMilestoneFailed: "Failed to deposit funds for this milestone. Please try again.",
            releasePaymentFailed: "Failed to release payment. Please try again.",
            depositEscrowFailed: "Failed to deposit funds. Please try again.",
            fundsSecuredTitle: "Funds secured",
            fundsSecuredBody:
              "The money is held safely and will not reach the provider until you approve that the work is complete.",
            confirmReleaseTotal:
              "Approve that the work is complete? The funds will be paid out to the provider.",
            confirmReleaseMilestone:
              "Approve this milestone? Its amount will be paid out to the provider.",
            approveRelease: "Approve",
            cancelRelease: "Cancel",
            transferTitle: "Bank transfer",
            demoOnly: "DEMO ONLY — do not transfer real money",
            transferIntro:
              "Make a bank transfer using the details below. Include the payment reference exactly as shown.",
            depositAmount: "Deposit amount",
            bankName: "Bank name",
            accountNumber: "Bank account number",
            beneficiaryName: "Beneficiary name",
            paymentReference: "Payment reference / Deal ID",
            transferInstructions: "Transfer instructions",
            transferInstructionsBody:
              "Create a transfer in your banking app, copy the details exactly, and enter the payment reference in the transfer description.",
            madeTransfer: "I've made the transfer",
            cancelTransfer: "Cancel",
            verificationPending: "Payment verification pending",
            depositSubmitted:
              "Your deposit has been submitted and is awaiting verification. Funds will be secured after admin confirmation.",
            confirmPaymentReceived: "Confirm payment received (demo)",
            verifyingPayment: "Verifying…",
            escrowLegalNote: "Payment holding is governed by the laws of the Republic of Armenia."
          };

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  /** Fatal: not configured / not found (no agreement to show). */
  const [error, setError] = useState("");
  /** Non-fatal: sign actions while agreement is visible. */
  const [actionError, setActionError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureWrapRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const downloadTriggeredRef = useRef(false);
  const fetchSeqRef = useRef(0);

  const fetchAgreement = useCallback(async () => {
    if (!id) return;
    const seq = ++fetchSeqRef.current;
    const isStale = () => seq !== fetchSeqRef.current;

    const loadLocal = () => {
      if (isStale()) return false;
      const local = getLocalAgreement(id) as Agreement | null;
      if (!local) return false;
      setAgreement(local);
      setError("");
      setActionError("");
      setLoading(false);
      return true;
    };

    const loadFromApi = async () => {
      try {
        const res = await fetch(`/api/agreement/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) return false;
        const payload = (await res.json()) as { agreement?: Agreement };
        if (!payload.agreement) return false;
        if (isStale()) return true;
        setAgreement(payload.agreement);
        setError("");
        setActionError("");
        setLoading(false);
        return true;
      } catch {
        return false;
      }
    };

    if (isLocalAgreementId(id)) {
      if (await loadFromApi()) return;
      if (loadLocal()) return;
      if (isStale()) return;
      setError(tx.localLinkNotFound);
      setLoading(false);
      return;
    }

    if (await loadFromApi()) return;

    if (!supabase) {
      if (loadLocal()) return;
      if (isStale()) return;
      setError(tx.notFound);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        if (await loadFromApi()) return;
        if (loadLocal()) return;
        if (isStale()) return;
        setError(tx.notFound);
        setLoading(false);
        return;
      }

      if (isStale()) return;
      setAgreement(normalizeAgreementRow(data as Record<string, unknown>) as Agreement);
      setError("");
      setActionError("");
      setLoading(false);
    } catch {
      if (await loadFromApi()) return;
      if (loadLocal()) return;
      if (isStale()) return;
      setError(tx.notFound);
      setLoading(false);
    }
  }, [id, supabase, tx.notFound]);

  useEffect(() => {
    setTermsAccepted(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void fetchAgreement();
  }, [fetchAgreement]);

  useEffect(() => {
    const refresh = () => {
      if (!id) return;
      void fetchAgreement();
    };
    const onStorage = (event: StorageEvent) => {
      if (!id) return;
      if (event.key === "vstah_local_agreements") {
        refresh();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [id, fetchAgreement]);

  useEffect(() => {
    if (!supabase || !id) return;
    const channel = supabase
      .channel(`agreement-public-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agreements", filter: `id=eq.${id}` }, (payload) => {
        if (payload.new || payload.old) {
          void fetchAgreement();
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, id, fetchAgreement]);

  useEffect(() => {
    const wrap = signatureWrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || agreement?.status !== "pending") return;

    const resize = () => {
      const w = Math.max(280, wrap.clientWidth);
      const h = Math.max(132, Math.min(196, Math.round(w * 0.32)));
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f172a";
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [agreement?.status, agreement?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const tryClientUpdate = async (
    payload: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!agreement) return { ok: false, error: tx.signBlocked };

    const updateLocally = () => {
      const next = updateLocalAgreement(agreement.id, payload as Partial<Agreement>);
      return next ? { ok: true } : { ok: false, error: tx.signBlocked };
    };

    if (isLocalAgreementId(agreement.id) || !supabase) return updateLocally();

    const run = async (candidatePayload: Record<string, unknown>) =>
      supabase
        .from("agreements")
        .update(candidatePayload)
        .eq("id", agreement.id)
        .select("id");

    let updatedRows: { id: unknown }[] | null = null;
    let updateError: { message?: string } | null = null;
    try {
      ({ data: updatedRows, error: updateError } = await run(payload));
    } catch {
      return updateLocally();
    }
    const paymentStatus = payload.payment_status;
    if (
      updateError &&
      paymentStatus === "released" &&
      (updateError.message?.toLowerCase().includes("check_payment_status") ||
        updateError.message?.toLowerCase().includes("payment_status"))
    ) {
      // Compatibility for DBs that still use `paid` instead of `released`.
      try {
        ({ data: updatedRows, error: updateError } = await run({ ...payload, payment_status: "paid" }));
      } catch {
        return updateLocally();
      }
    }

    if (updateError || !updatedRows?.length) {
      return { ok: false, error: updateError?.message || tx.signBlocked };
    }

    return { ok: true };
  };

  const signAgreement = async () => {
    if (!agreement || signing || agreement.status === "signed" || agreement.status === "completed") return;
    if (!termsAccepted) {
      setActionError(tx.agreeTermsRequired);
      return;
    }

    setSigning(true);
    setActionError("");
    const drawnSignature = canvasRef.current?.toDataURL("image/png") ?? null;
    const signature =
      typeof drawnSignature === "string" && drawnSignature.startsWith("data:image/") ? drawnSignature : null;

    const res = await postAgreementAction(agreement.id, { signature: signature ?? undefined });
    if (!res.ok && !res.alreadySigned) {
      const fallback = await tryClientUpdate({
        status: "signed",
        client_signature: signature
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.signBlocked);
        setSigning(false);
        return;
      }
    }

    await fetchAgreement();
    setSigning(false);
  };

  const defaultTerms = [
    "SERVICE AGREEMENT",
    "",
    `This Agreement is made between ${agreement?.provider_name || "Service Provider"} (\"Provider\") and ${agreement?.client_name || "Client"} (\"Client\").`,
    `Service Area: ${agreement?.service_area || "As agreed by the parties"}.`,
    `Total Price: ${money(Number(agreement?.total_price || 0))} ֏.`,
    "",
    "Provider agrees to deliver services professionally and within the agreed scope and timeline.",
    "Client agrees to cooperate, provide access where required, and review delivered work in good faith.",
    "",
    "Funds will be released only upon client approval."
  ].join("\n");

  const downloadRenderedAgreement = useCallback(async () => {
    const node = printableRef.current;
    if (!node || !agreement) return;

    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`agreement-${agreement.id}.pdf`);
    } catch {
      setActionError("Could not generate PDF. Try again or use Print.");
    }
  }, [agreement]);

  useEffect(() => {
    if (!shouldAutoDownload || loading || !agreement) return;
    if (downloadTriggeredRef.current) return;
    downloadTriggeredRef.current = true;
    const timerId = window.setTimeout(() => {
      void downloadRenderedAgreement();
    }, 450);
    return () => window.clearTimeout(timerId);
  }, [shouldAutoDownload, loading, agreement, downloadRenderedAgreement]);

  if (loading) {
    return (
      <main key={routeKey} className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-8 py-10 shadow-lg ring-1 ring-slate-900/5">
          <Loader2 className="h-8 w-8 animate-spin text-[#0033A0]" aria-hidden />
          <p className="text-sm font-semibold text-slate-600">{tx.loading}</p>
        </div>
      </main>
    );
  }

  if (!agreement) {
    return (
      <main key={routeKey} className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white px-6 py-8 text-center shadow-lg ring-1 ring-red-100">
          <p className="text-sm font-semibold text-red-700">{error || tx.notFound}</p>
        </div>
      </main>
    );
  }

  const signed = agreement.status === "signed" || agreement.status === "completed";
  const signatureImage =
    typeof agreement.client_signature === "string" && agreement.client_signature.startsWith("data:image/")
      ? agreement.client_signature
      : null;
  const providerFields = resolveProviderNameFields(agreement);
  const serviceAreaDisplay = agreement.service_area?.trim() || "Armenia";
  const readableAgreementId = `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  const paymentScheduleRows = buildPaymentScheduleRows(agreement, tx);

  const milestoneStatusBadge = (isSigned: boolean) =>
    isSigned ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {tx.statusSigned}
      </span>
    ) : (
      <span className="inline-flex rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 sm:text-xs">
        {tx.pendingSignature}
      </span>
    );

  const phaseLabel =
    agreement.status === "pending"
      ? tx.phaseAwaitingSign
      : agreement.status === "completed"
        ? tx.phaseCompleted
        : tx.signedAndApproved;

  return (
    <main key={routeKey} className="min-h-dvh bg-gradient-to-b from-slate-100 via-[#f8fafc] to-slate-200/90 px-3 py-5 sm:px-4 sm:py-8 md:py-10">
      <div
        ref={printableRef}
        className="vstah-animate-in mx-auto w-full min-w-0 max-w-[min(100%,55rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04]"
      >
        {actionError ? (
          <div role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:mx-6 sm:mt-6">
            {actionError}
          </div>
        ) : null}

        <header className="border-b border-slate-100 bg-gradient-to-br from-[#0033A0]/[0.08] via-white to-[#F2A800]/[0.06] px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-xs">{tx.offer}</p>
              <h1 className="mt-2 text-balance text-2xl font-black leading-tight text-[#0033A0] sm:text-3xl">{tx.title}</h1>
              <p className="mt-2 text-base font-bold text-slate-900">{agreement.project_title}</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{tx.subtitle}</p>
            </div>
            <span
              className={`inline-flex shrink-0 self-start rounded-full px-3 py-1.5 text-xs font-bold ${
                signed
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {phaseLabel}
            </span>
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
                    <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">{providerFields.business || "—"}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.providerNameLabel}</dt>
                    <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">{providerFields.full || "—"}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.serviceAreaLabel}</dt>
                    <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">{serviceAreaDisplay}</dd>
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
                    <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">{agreement.client_name}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.project}</dt>
                    <dd className="mt-0.5 break-words font-semibold leading-snug [overflow-wrap:anywhere]">{agreement.project_title}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#0033A0]/70" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.total}</dt>
                    <dd className="mt-0.5 text-base font-black tabular-nums text-[#0033A0]">{money(Number(agreement.total_price))} ֏</dd>
                  </div>
                </div>
              </dl>
            </section>
          </div>

          {agreement.scope_of_work?.trim() ||
          agreement.scope_exclusions?.trim() ||
          agreement.estimated_completion_date?.trim() ? (
            <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
              {agreement.scope_of_work?.trim() ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#0033A0]">{tx.scopeOfWork}</p>
                  <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">{agreement.scope_of_work.trim()}</pre>
                </div>
              ) : null}
              {agreement.scope_exclusions?.trim() ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#0033A0]">{tx.scopeExclusions}</p>
                  <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">{agreement.scope_exclusions.trim()}</pre>
                </div>
              ) : null}
              {agreement.estimated_completion_date?.trim() ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#0033A0]">{tx.estimatedCompletionDate}</p>
                  <p className="mt-3 text-base font-semibold text-slate-800">{formatDateDMY(agreement.estimated_completion_date)}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
            <AgreementSectionTitle>{tx.termsAndConditions}</AgreementSectionTitle>
            <pre className="mt-4 max-h-[min(24rem,50vh)] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50/70 p-4 font-sans text-sm leading-7 text-slate-700 sm:max-h-none sm:overflow-visible sm:p-5">
              {agreement.custom_terms?.trim() || defaultTerms}
            </pre>
            {agreement.status === "pending" ? (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-[#0033A0]/30 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setActionError("");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/30"
                />
                <span className="text-sm font-medium leading-relaxed text-slate-700">{tx.agreeTerms}</span>
              </label>
            ) : signed ? (
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
                    <th className="px-4 py-3.5">{tx.scheduleCondition}</th>
                    <th className="px-4 py-3.5">{tx.scheduleStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentScheduleRows.map((row, i) => (
                    <tr key={`${row.index}-${row.stage}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                      <td className="px-4 py-4 font-semibold text-slate-500">{row.index}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{row.stage}</td>
                      <td className="px-4 py-4 tabular-nums text-base font-black text-[#0033A0]">{money(row.amount)} ֏</td>
                      <td className="px-4 py-4 leading-snug text-slate-700">{row.condition}</td>
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
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tx.scheduleCondition}</p>
                      <p className="mt-1 text-sm leading-snug text-slate-700">{row.condition}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#0033A0]/90 px-5 py-4 text-white shadow-md">
              <span className="text-sm font-semibold text-white/90">{tx.total}</span>
              <span className="text-xl font-black tabular-nums sm:text-2xl">{money(Number(agreement.total_price || 0))} ֏</span>
            </div>
          </section>

          {agreement.status === "pending" ? (
            <section className="rounded-2xl border border-[#0033A0]/20 bg-gradient-to-br from-white via-slate-50/50 to-[#0033A0]/[0.03] p-5 shadow-sm ring-1 ring-[#0033A0]/10 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0033A0] text-white shadow-md">
                  <PenLine className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-900">{tx.optionalSignature}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600 sm:text-sm">{tx.signatureHint}</p>
                </div>
              </div>
              <div ref={signatureWrapRef} className="mt-5 w-full">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={180}
                  aria-label={tx.optionalSignature}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={stopDraw}
                  onPointerLeave={stopDraw}
                  className="touch-none rounded-2xl border-2 border-dashed border-slate-300/90 bg-white shadow-inner"
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                >
                  {tx.clearSignature}
                </button>
                <button
                  type="button"
                  onClick={() => void signAgreement()}
                  disabled={signing || !termsAccepted}
                  className="w-full rounded-xl px-6 py-4 text-base font-black text-slate-900 shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[16rem]"
                  style={{ backgroundColor: ORANGE, boxShadow: `0 12px 32px -10px ${ORANGE}cc` }}
                >
                  {signing ? tx.signing : tx.signAndAccept}
                </button>
              </div>
            </section>
          ) : null}

          {signatureImage && signed ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04]" aria-label={tx.clientSignature}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#0033A0]/[0.07] to-slate-50/80 px-4 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0033A0] sm:text-[11px]">{tx.clientSignature}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{agreement.client_name}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  {tx.signedAndApproved}
                </span>
              </div>
              <div className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-6 sm:px-8 sm:py-8">
                <div className="relative mx-auto max-w-lg rounded-xl bg-white p-5 shadow-inner ring-1 ring-slate-200/90 sm:p-8">
                  <div className="pointer-events-none absolute inset-x-6 bottom-5 border-b border-slate-300/90 sm:inset-x-10 sm:bottom-8" aria-hidden />
                  <Image
                    src={signatureImage}
                    alt={`${agreement.client_name}, ${tx.clientSignature}`}
                    width={640}
                    height={180}
                    unoptimized
                    className="relative z-[1] mx-auto block h-auto max-h-32 w-auto max-w-full object-contain sm:max-h-40"
                  />
                </div>
              </div>
            </section>
          ) : null}

          {signed ? (
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
    </main>
  );
}
