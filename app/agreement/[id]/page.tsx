"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, Landmark, Loader2, ShieldCheck, X } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import {
  getLocalAgreement,
  isLocalAgreementId,
  updateLocalAgreement
} from "@/lib/agreements/local-store";
import {
  addVerificationPendingIndex,
  getVerificationPendingIndexes,
  hasVerificationPending
} from "@/lib/agreements/verification-pending";
import { formatDateDMY } from "@/lib/format-date";
import { useLanguage } from "@/lib/i18n/language-context";
import { normalizeAgreementRow } from "@/lib/agreements/row";

async function postAgreementAction(
  agreementId: string,
  subpath: "/sign" | "/deposit" | "/release",
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
    res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}${subpath}`, {
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
  total_price: number;
  payment_type: "single" | "milestones";
  milestones: { title: string; amount: number; status?: "pending" | "escrow_held" | "released" }[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  client_signature?: string;
  created_at: string;
};

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Window after a deposit during which release clicks are ignored. */
const RELEASE_LOCK_MS = 1_500;
const DEMO_BANK_NAME = "Ameriabank (Demo)";
const DEMO_BANK_ACCOUNT = "AM00 0000 0000 0000 0000 (DEMO)";
const DEMO_BENEFICIARY = "VSTAH LLC (Demo)";

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
          offer: "VSTAH առաջարկ",
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
          optionalSignature: "Ընտրովի ստորագրություն",
          signatureHint: "Ստորագրեք ներքևում և սեղմեք «Ստորագրել և ընդունել պայմանագիրը»։",
          clearSignature: "Մաքրել ստորագրությունը",
          signing: "Ստորագրում…",
          signAndAccept: "Ստորագրել և ընդունել պայմանագիրը",
          signedSuccess: "Պայմանագիրը ստորագրված է։ Մատակարարը ծանուցված է։",
          signedByClient: "Ստորագրել է հաճախորդը",
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
            offer: "Предложение VSTAH",
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
            optionalSignature: "Подпись (необязательно)",
            signatureHint: "Поставьте подпись ниже и нажмите «Подписать и принять».",
            clearSignature: "Очистить",
            signing: "Подписание…",
            signAndAccept: "Подписать и принять",
            signedSuccess: "Соглашение подписано. Исполнитель уведомлён.",
            signedByClient: "Подписано клиентом",
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
            offer: "VSTAH Offer",
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
            optionalSignature: "Optional Signature",
            signatureHint: "Draw your signature below and then click Sign & Accept Agreement.",
            clearSignature: "Clear Signature",
            signing: "Signing...",
            signAndAccept: "Sign & Accept Agreement",
            signedSuccess: "Agreement Signed Successfully! The provider has been notified.",
            signedByClient: "Signed by client",
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
  const [releasingMilestoneIndex, setReleasingMilestoneIndex] = useState<number | null>(null);
  /** `null` closed; `>= 0` milestone; `-1` single/total payment. */
  const [transferModalIndex, setTransferModalIndex] = useState<number | null>(null);
  /** `null` closed; `>= 0` milestone; `-1` single/total payment. */
  const [releaseConfirmIndex, setReleaseConfirmIndex] = useState<number | null>(null);
  const [verificationPendingIndexes, setVerificationPendingIndexes] = useState<number[]>([]);
  const [depositConfirmation, setDepositConfirmation] = useState("");
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  /** Fatal: not configured / not found (no agreement to show). */
  const [error, setError] = useState("");
  /** Non-fatal: sign / payment actions while agreement is visible. */
  const [actionError, setActionError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDepositAtRef = useRef(0);
  const drawing = useRef(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const downloadTriggeredRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    setVerificationPendingIndexes(getVerificationPendingIndexes(id));
  }, [id]);

  useEffect(() => {
    if (transferModalIndex === null && releaseConfirmIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTransferModalIndex(null);
        setReleaseConfirmIndex(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [transferModalIndex, releaseConfirmIndex]);

  const fetchAgreement = useCallback(async () => {
    if (!id) return;

    const loadLocal = () => {
      const local = getLocalAgreement(id) as Agreement | null;
      if (!local) return false;
      setAgreement(local);
      setVerificationPendingIndexes(getVerificationPendingIndexes(id));
      setError("");
      setActionError("");
      setLoading(false);
      return true;
    };

    if (isLocalAgreementId(id) || !supabase) {
      if (loadLocal()) return;
      setError(supabase ? tx.notFound : tx.notConfigured);
      setLoading(false);
      return;
    }

    try {
      // Includes `client_signature` when the column exists; mapped in normalizeAgreementRow.
      const { data, error: fetchError } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        if (loadLocal()) return;
        setError(tx.notFound);
        setLoading(false);
        return;
      }

      setAgreement(normalizeAgreementRow(data as Record<string, unknown>) as Agreement);
      const remote = await fetch(`/api/agreement/${encodeURIComponent(id)}/verification`)
        .then((r) => r.json())
        .catch(() => ({ indexes: [] as number[] }));
      const local = getVerificationPendingIndexes(id);
      setVerificationPendingIndexes([...new Set([...(remote.indexes ?? []), ...local])]);
      setError("");
      setActionError("");
      setLoading(false);
    } catch {
      // Supabase unreachable — fall back to an agreement saved in this browser.
      if (loadLocal()) return;
      setError(tx.notFound);
      setLoading(false);
    }
  }, [id, supabase, tx.notConfigured, tx.notFound]);

  useEffect(() => {
    setLoading(true);
    void fetchAgreement();
  }, [fetchAgreement]);

  useEffect(() => {
    const onFocus = () => {
      if (!id) return;
      void fetchAgreement();
      setVerificationPendingIndexes(getVerificationPendingIndexes(id));
    };
    const onStorage = (event: StorageEvent) => {
      if (!id) return;
      if (
        event.key === "vstah_local_agreements" ||
        event.key === "vstah_verification_pending"
      ) {
        void fetchAgreement();
        setVerificationPendingIndexes(getVerificationPendingIndexes(id));
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
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
    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchAgreement();
      }
    };
    window.addEventListener("focus", onVisibleOrFocus);
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    return () => {
      window.removeEventListener("focus", onVisibleOrFocus);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
    };
  }, [fetchAgreement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
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

  /**
   * A deposit swaps the blue deposit button for the green release button in the
   * same spot, so a second click of a double-click could release the funds
   * immediately. Ignore release clicks that arrive right after a deposit.
   */
  const isReleaseLocked = () => Date.now() - lastDepositAtRef.current < RELEASE_LOCK_MS;

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

    setSigning(true);
    setActionError("");
    const drawnSignature = canvasRef.current?.toDataURL("image/png") ?? null;
    const signature =
      typeof drawnSignature === "string" && drawnSignature.startsWith("data:image/") ? drawnSignature : null;

    const res = await postAgreementAction(agreement.id, "/sign", { signature: signature ?? undefined });
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

  const requestReleaseMilestone = (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "escrow_held") return;
    if (isReleaseLocked()) return;
    setReleaseConfirmIndex(index);
  };

  const confirmReleaseMilestone = async () => {
    if (releaseConfirmIndex === null) return;
    const index = releaseConfirmIndex;
    setReleaseConfirmIndex(null);
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "escrow_held") return;
    if (isReleaseLocked()) return;

    setReleasingMilestoneIndex(index);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/release", { milestoneIndex: index });
    if (!res.ok) {
      const nextMilestones = current.map((m, i) => (i === index ? { ...m, status: "released" as const } : m));
      const allReleased = nextMilestones.every((m) => m.status === "released");
      const fallback = await tryClientUpdate({
        milestones: nextMilestones,
        payment_status: allReleased ? "released" : "escrow_held",
        status: allReleased ? "completed" : "signed"
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.releaseMilestoneFailed);
        setReleasingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setReleasingMilestoneIndex(null);
  };

  const openMilestoneTransfer = (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || (target.status ?? "pending") !== "pending") return;
    if (verificationPendingIndexes.includes(index) || hasVerificationPending(agreement.id, index)) return;
    setDepositConfirmation("");
    setTransferModalIndex(index);
  };

  const openTotalTransfer = () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "pending") return;
    if ((agreement.milestones ?? []).length > 0) return;
    if (verificationPendingIndexes.includes(-1) || hasVerificationPending(agreement.id, -1)) return;
    setDepositConfirmation("");
    setTransferModalIndex(-1);
  };

  /** Demo-only: after the customer confirms the transfer, queue admin verification (do not secure funds yet). */
  const submitDemoTransfer = async () => {
    if (!agreement || transferModalIndex === null) return;
    const index = transferModalIndex;
    setVerifyingIndex(index);
    setTransferModalIndex(null);
    setActionError("");

    if (index === -1) {
      if (agreement.payment_status !== "pending" || (agreement.milestones ?? []).length > 0) {
        setVerifyingIndex(null);
        return;
      }
    } else {
      const target = agreement.milestones?.[index];
      if (!target || (target.status ?? "pending") !== "pending") {
        setVerifyingIndex(null);
        return;
      }
    }

    if (isLocalAgreementId(agreement.id)) {
      addVerificationPendingIndex(agreement.id, index);
      setVerificationPendingIndexes(getVerificationPendingIndexes(agreement.id));
      void fetch(`/api/agreement/${encodeURIComponent(agreement.id)}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit.submitted", meta: { milestoneIndex: index } })
      }).catch(() => {});
    } else {
      try {
        const res = await fetch(`/api/agreement/${encodeURIComponent(agreement.id)}/submit-transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneIndex: index })
        });
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          // Fall back to local queue if migration not applied yet.
          addVerificationPendingIndex(agreement.id, index);
          if (payload.error && !payload.error.toLowerCase().includes("missing")) {
            setActionError(payload.error);
          }
        }
      } catch {
        addVerificationPendingIndex(agreement.id, index);
      }
      const remote = await fetch(`/api/agreement/${encodeURIComponent(agreement.id)}/verification`)
        .then((r) => r.json())
        .catch(() => ({ indexes: [] as number[] }));
      const local = getVerificationPendingIndexes(agreement.id);
      setVerificationPendingIndexes([...new Set([...(remote.indexes ?? []), ...local])]);
    }

    setDepositConfirmation(tx.depositSubmitted);
    setVerifyingIndex(null);
  };

  const requestReleaseTotal = () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "escrow_held") return;
    if ((agreement.milestones ?? []).length > 0) return;
    if (isReleaseLocked()) return;
    setReleaseConfirmIndex(-1);
  };

  const confirmReleaseTotal = async () => {
    setReleaseConfirmIndex(null);
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "escrow_held") return;
    if (isReleaseLocked()) return;
    setReleasingMilestoneIndex(-1);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/release", {});
    if (!res.ok) {
      const fallback = await tryClientUpdate({
        payment_status: "released",
        status: "completed"
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.releasePaymentFailed);
        setReleasingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setReleasingMilestoneIndex(null);
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
  }, [agreement]);

  useEffect(() => {
    if (!shouldAutoDownload || loading || !agreement) return;
    if (downloadTriggeredRef.current) return;
    downloadTriggeredRef.current = true;
    window.setTimeout(() => {
      void downloadRenderedAgreement();
    }, 450);
  }, [shouldAutoDownload, loading, agreement, downloadRenderedAgreement]);

  if (loading) {
    return (
      <main key={routeKey} className="min-h-screen bg-[#F9FAFB] p-6 text-slate-700">
        <div className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {tx.loading}
        </div>
      </main>
    );
  }

  if (!agreement) {
    return (
      <main key={routeKey} className="min-h-screen bg-[#F9FAFB] p-6 text-red-700">
        {error || tx.notFound}
      </main>
    );
  }

  const signed = agreement.status === "signed" || agreement.status === "completed";
  const paymentReleased = agreement.payment_status === "released";
  const signatureImage =
    typeof agreement.client_signature === "string" && agreement.client_signature.startsWith("data:image/")
      ? agreement.client_signature
      : null;
  const providerFields = resolveProviderNameFields(agreement);
  const serviceAreaDisplay = agreement.service_area?.trim() || "Armenia";
  const readableAgreementId = `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  const transferMilestone =
    transferModalIndex === null || transferModalIndex < 0
      ? null
      : agreement.milestones?.[transferModalIndex] ?? null;
  const transferIsTotal = transferModalIndex === -1;
  const transferAmount = transferIsTotal
    ? Number(agreement.total_price || 0)
    : Number(transferMilestone?.amount || 0);
  const transferTitleLabel = transferIsTotal
    ? agreement.project_title
    : transferMilestone
      ? `${transferModalIndex! + 1}. ${transferMilestone.title}`
      : "";
  const releaseConfirmMilestone =
    releaseConfirmIndex === null || releaseConfirmIndex < 0
      ? null
      : agreement.milestones?.[releaseConfirmIndex] ?? null;
  const releaseConfirmIsTotal = releaseConfirmIndex === -1;
  const transferReference =
    transferModalIndex === null
      ? readableAgreementId
      : transferModalIndex < 0
        ? readableAgreementId
        : `${readableAgreementId}-M${transferModalIndex + 1}`;
  return (
    <main key={routeKey} className="min-h-screen bg-slate-100 px-3 py-6 md:px-6 md:py-10">
      <div ref={printableRef} className="relative mx-auto w-full min-w-0 max-w-[min(100%,55rem)] rounded-md border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:px-10 md:py-9">
        {paymentReleased ? (
          <div className="pointer-events-none absolute right-4 top-6 rotate-[-12deg] rounded border-4 border-emerald-600 px-3 py-1.5 text-xs font-black tracking-widest text-emerald-700 opacity-90 md:right-8 md:top-8 md:text-sm">
            {tx.paidInFull}
          </div>
        ) : null}
        {actionError ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
          >
            {actionError}
          </div>
        ) : null}

        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{tx.offer}</p>
          <h1 className="mt-2 text-2xl font-black text-[#0033A0] md:text-3xl">{tx.title}</h1>
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
            <p className="mt-1 font-bold text-slate-900">
              {agreement.status === "pending"
                ? tx.phaseAwaitingSign
                : agreement.status === "completed"
                  ? tx.phaseCompleted
                  : tx.phaseSigned}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.paymentPhase}</p>
            <p className="mt-0.5 font-bold text-slate-900">
              {agreement.payment_status === "released"
                ? tx.phasePayReleased
                : agreement.payment_status === "escrow_held"
                  ? tx.phasePayEscrow
                  : verificationPendingIndexes.length > 0
                    ? tx.phasePayVerification
                    : tx.phasePayPending}
            </p>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="min-w-0 rounded border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.providerDetails}</p>
            <div className="mt-2 space-y-2 text-sm text-slate-800">
              <p className="break-words leading-snug [overflow-wrap:anywhere]">
                <span className="font-bold text-slate-900">{tx.businessName}:</span>{" "}
                {providerFields.business || "—"}
              </p>
              <p className="break-words leading-snug [overflow-wrap:anywhere]">
                <span className="font-bold text-slate-900">{tx.providerNameLabel}:</span>{" "}
                {providerFields.full || "—"}
              </p>
              <p className="break-words leading-snug [overflow-wrap:anywhere]">
                <span className="font-bold text-slate-900">{tx.serviceAreaLabel}:</span>{" "}
                {serviceAreaDisplay}
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
                <span className="font-bold text-slate-900">{tx.total}:</span> {money(Number(agreement.total_price))} ֏
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded border border-slate-200 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.termsAndConditions}</p>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
            {agreement.custom_terms?.trim() || defaultTerms}
          </pre>
        </section>
        <div className="mt-3 border-t border-slate-200 pt-3 text-left">
          <p className="text-sm font-semibold text-slate-800">
            {tx.total}: {money(Number(agreement.total_price || 0))} ֏
          </p>
        </div>

        {signatureImage && signed ? (
          <section
            className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]"
            aria-label={tx.clientSignature}
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#0033A0]/[0.07] to-slate-50/80 px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0033A0]">{tx.clientSignature}</p>
                <p className="mt-1 text-base font-bold text-slate-900">{agreement.client_name}</p>
              </div>
            </div>
            <div className="bg-[linear-gradient(to_bottom,#f8fafc_0%,#ffffff_100%)] px-4 py-6 sm:px-8 sm:py-8">
              <div className="relative mx-auto max-w-lg rounded-xl bg-white p-6 shadow-inner ring-1 ring-slate-200/90 sm:p-8">
                <div className="pointer-events-none absolute inset-x-8 bottom-6 border-b border-slate-300/90 sm:inset-x-10 sm:bottom-8" aria-hidden />
                <img
                  src={signatureImage}
                  alt={`${agreement.client_name} — ${tx.clientSignature}`}
                  className="relative z-[1] mx-auto block h-auto max-h-36 w-auto max-w-full object-contain sm:max-h-40"
                />
              </div>
            </div>
          </section>
        ) : null}

        {depositConfirmation ? (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-black">{tx.verificationPending}</p>
              <p className="mt-0.5">{depositConfirmation}</p>
            </div>
          </div>
        ) : null}

        {agreement.payment_type === "milestones" ? (
          <section className="mt-6 rounded border border-slate-200 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.milestones}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(agreement.milestones ?? []).map((m, i) => (
                <li key={`${m.title}-${i}`} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      {i + 1}. {m.title} - {money(Number(m.amount || 0))} ֏
                    </p>
                    <div className="flex items-center gap-2">
                      {m.status === "released" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tx.paid}
                        </span>
                      ) : m.status === "escrow_held" ? (
                        <>
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#0033A0]">
                            {tx.escrowHeld}
                          </span>
                          {agreement.status === "signed" ? (
                            <button
                              type="button"
                              onClick={() => requestReleaseMilestone(i)}
                              disabled={releasingMilestoneIndex === i}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {releasingMilestoneIndex === i ? tx.releasingMilestone : tx.releaseMilestone}
                            </button>
                          ) : null}
                        </>
                      ) : verificationPendingIndexes.includes(i) ? (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          {tx.verificationPending}
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {tx.pendingMilestone}
                          </span>
                          {agreement.status === "signed" ? (
                            <button
                              type="button"
                              onClick={() => openMilestoneTransfer(i)}
                              className="rounded-lg bg-[#0033A0] px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-60"
                            >
                              {tx.depositMilestone}
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!paymentReleased &&
        agreement.status === "signed" &&
        agreement.payment_status === "pending" &&
        (agreement.milestones ?? []).length === 0 &&
        !verificationPendingIndexes.includes(-1) ? (
          <button
            type="button"
            onClick={openTotalTransfer}
            disabled={verifyingIndex === -1}
            className="mt-6 w-full rounded-xl bg-[#0033A0] px-5 py-3 text-base font-black text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-0.5 leading-tight">
              <span>{verifyingIndex === -1 ? tx.verifyingPayment : tx.depositTotalToEscrow}</span>
              <span className="text-sm font-bold opacity-95">{money(Number(agreement.total_price))} ֏</span>
            </span>
          </button>
        ) : null}

        {!paymentReleased &&
        agreement.status === "signed" &&
        agreement.payment_status === "pending" &&
        (agreement.milestones ?? []).length === 0 &&
        verificationPendingIndexes.includes(-1) ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-950">{tx.verificationPending}</p>
            <p className="mt-1 text-sm text-amber-900">{tx.depositSubmitted}</p>
          </div>
        ) : null}

        {!paymentReleased && agreement.status === "signed" && agreement.payment_status === "escrow_held" && (agreement.milestones ?? []).length === 0 ? (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-black text-[#0033A0]">{tx.fundsSecuredTitle}</p>
            <p className="mt-1 text-sm text-slate-700">{tx.fundsSecuredBody}</p>
            <button
              type="button"
              onClick={requestReleaseTotal}
              disabled={releasingMilestoneIndex === -1}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {releasingMilestoneIndex === -1 ? tx.releasingTotalPayment : tx.releaseTotalPayment}
            </button>
          </div>
        ) : null}

        {agreement.status === "pending" ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{tx.optionalSignature}</p>
            <p className="mt-1 text-xs text-slate-500">{tx.signatureHint}</p>
            <canvas
              ref={canvasRef}
              width={640}
              height={180}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDraw}
              onPointerLeave={stopDraw}
              className="mt-3 h-40 w-full touch-none rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {tx.clearSignature}
            </button>
            <button
              type="button"
              onClick={() => void signAgreement()}
              disabled={signing}
              className="mt-4 w-full rounded-xl bg-[#F2A800] px-5 py-3 text-base font-black text-slate-900 transition hover:opacity-95 disabled:opacity-60"
            >
              {signing ? tx.signing : tx.signAndAccept}
            </button>
          </div>
        ) : null}

        {signed ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <p className="inline-flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" />
              {tx.signedSuccess}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {tx.signedByClient}: {agreement.client_name}
            </p>
          </div>
        ) : null}

        {paymentReleased ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-bold">{tx.paymentSuccessful}</p>
            <p className="mt-1 text-sm font-semibold">{tx.transactionComplete}</p>
            <p className="mt-1 text-sm">{tx.transactionCompleteBody}</p>
            <div className="mt-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              >
                {tx.backHome}
              </Link>
            </div>
          </div>
        ) : null}
        <p className="mt-4 break-words text-center text-xs text-slate-500 [overflow-wrap:anywhere]">{tx.escrowLegalNote}</p>
      </div>

      {releaseConfirmIndex !== null && (releaseConfirmIsTotal || releaseConfirmMilestone) ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReleaseConfirmIndex(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="release-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 id="release-confirm-title" className="text-base font-black text-slate-900">
              {releaseConfirmIsTotal ? tx.releaseTotalPayment : tx.releaseMilestone}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {releaseConfirmIsTotal ? tx.confirmReleaseTotal : tx.confirmReleaseMilestone}
            </p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
              {releaseConfirmIsTotal
                ? `${agreement.project_title} · ${money(Number(agreement.total_price || 0))} ֏`
                : `${releaseConfirmIndex + 1}. ${releaseConfirmMilestone!.title} · ${money(
                    Number(releaseConfirmMilestone!.amount || 0)
                  )} ֏`}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReleaseConfirmIndex(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {tx.cancelRelease}
              </button>
              <button
                type="button"
                onClick={() =>
                  void (releaseConfirmIsTotal ? confirmReleaseTotal() : confirmReleaseMilestone())
                }
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                {tx.approveRelease}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {transferModalIndex !== null && (transferIsTotal || transferMilestone) ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTransferModalIndex(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-transfer-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="border-b border-slate-200 bg-gradient-to-r from-[#0033A0] to-[#0754c9] px-5 py-5 text-white sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Landmark className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                      {tx.demoOnly}
                    </p>
                    <h2 id="bank-transfer-title" className="mt-1 text-xl font-black">
                      {tx.transferTitle}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTransferModalIndex(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                  aria-label={tx.cancelTransfer}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              <p className="text-sm leading-6 text-slate-600">{tx.transferIntro}</p>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  {tx.depositAmount}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#0033A0]">
                  {money(transferAmount)} ֏
                </p>
                {transferTitleLabel ? (
                  <p className="mt-1 text-sm font-semibold text-slate-700">{transferTitleLabel}</p>
                ) : null}
              </div>

              <dl className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                {[
                  [tx.bankName, DEMO_BANK_NAME],
                  [tx.accountNumber, DEMO_BANK_ACCOUNT],
                  [tx.beneficiaryName, DEMO_BENEFICIARY],
                  [tx.paymentReference, transferReference]
                ].map(([label, value]) => (
                  <div key={label} className="px-4 py-3.5">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-black text-amber-950">{tx.transferInstructions}</p>
                  <p className="mt-1 text-sm leading-5 text-amber-900">
                    {tx.transferInstructionsBody}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTransferModalIndex(null)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {tx.cancelTransfer}
                </button>
                <button
                  type="button"
                  onClick={() => void submitDemoTransfer()}
                  disabled={verifyingIndex !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2A800] px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {verifyingIndex !== null ? tx.verifyingPayment : tx.madeTransfer}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
