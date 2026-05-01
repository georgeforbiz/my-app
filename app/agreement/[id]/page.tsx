"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { normalizeAgreementRow } from "@/lib/agreements/row";

async function postAgreementAction(
  agreementId: string,
  subpath: "/sign" | "/deposit" | "/release",
  body: Record<string, unknown> = {}
): Promise<{ ok: boolean; status: number; error?: string; code?: string; alreadySigned?: boolean }> {
  const res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}${subpath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    ok?: boolean;
    alreadySigned?: boolean;
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
          loading: "Պայմանագիրը բեռնվում է...",
          notConfigured: "Supabase-ը կարգավորված չէ։",
          notFound: "Պայմանագիրը չի գտնվել։",
          offer: "VSTAH Առաջարկ",
          title: "Անվտանգ ծառայության պայմանագիր",
          subtitle: "Ստորագրելուց առաջ ստուգեք ստորև նշված բոլոր տվյալները։",
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
          signing: "Ստորագրվում է...",
          signAndAccept: "Ստորագրել և ընդունել պայմանագիրը",
          signedSuccess: "Պայմանագիրը հաջողությամբ ստորագրվեց։ Մատակարարը ծանուցվել է։",
          signedByClient: "Ստորագրել է հաճախորդը",
          signFailed: "Չհաջողվեց ստորագրել պայմանագիրը։ Փորձեք կրկին։",
          signBlocked:
            "Պահեստը թույլ չի տալիս պահել ստորագրությունը։ Սերվերում ավելացրեք SUPABASE_SERVICE_ROLE_KEY կամ թարմացրեք Supabase RLS քաղաքականությունները։",
          releaseMilestone: "Արձակել փուլը",
          releasingMilestone: "Արձակվում է...",
          depositMilestone: "Դեպոզիտ",
          depositingMilestone: "Դեպոզիտ է կատարվում...",
          escrowHeld: "Պահվում է էսկրոուում",
          releaseTotalPayment: "Արձակել ամբողջ վճարումը",
          releasingTotalPayment: "Վճարումն ընթացքի մեջ է...",
          depositEscrow: "Դեպոզիտ 100,000 ֏ էսկրոուում",
          depositingEscrow: "Դեպոզիտ է կատարվում...",
          paid: "Վճարված",
          pendingMilestone: "Սպասման մեջ",
          paymentSuccessful: "Վճարումը արձակված է։ Մատակարարը ծանուցվել է։",
          transactionComplete: "Գործարքը ավարտված է",
          transactionCompleteBody:
            "Բոլոր վճարային պարտավորությունները կատարված են։ Այս պայմանագիրը փակված է։",
          paidInFull: "ԼՐԻՎ ՎՃԱՐՎԱԾ",
          backHome: "Վերադառնալ գլխավոր",
          agreementPhase: "Պայմանագիր",
          paymentPhase: "Վճարում",
          phaseAwaitingSign: "Սպասում է ստորագրման",
          phaseSigned: "Ստորագրված",
          phaseCompleted: "Ավարտված",
          phasePayPending: "Սպասում է դեպոզիտի",
          phasePayEscrow: "Միջոցները ապահովված են",
          phasePayReleased: "Արձակված է",
          depositTotalToEscrow: "Դեպոզիտել ընդհանուրը էսկրոուում",
          agreementId: "Պայմանագրի ID",
          creationDate: "Ստեղծման ամսաթիվ",
          providerDetails: "Մատակարարի տվյալներ",
          clientDetails: "Հաճախորդի տվյալներ",
          termsAndConditions: "Պայմաններ և դրույթներ",
          name: "Անուն",
          fullName: "Ամբողջ անուն",
          businessName: "Բիզնեսի անվանում",
          providerNameLabel: "Մատակարարի անուն",
          serviceAreaLabel: "Սպասարկման տարածք",
          statusSigned: "Ստորագրված",
          statusPending: "Սպասման մեջ",
          previousMilestoneNotFinished: "Նախորդ փուլը դեռ ավարտված չէ։ Ցանկանու՞մ եք այս փուլը դեպոզիտ անել հերթից դուրս։",
          releaseMilestoneFailed: "Չհաջողվեց արձակել փուլի գումարը։ Փորձեք կրկին։",
          depositMilestoneFailed: "Չհաջողվեց դեպոզիտ կատարել այս փուլի համար։ Փորձեք կրկին։",
          releasePaymentFailed: "Չհաջողվեց արձակել վճարումը։ Փորձեք կրկին։",
          depositEscrowFailed: "Չհաջողվեց դեպոզիտ անել էսկրոուում։ Փորձեք կրկին։",
          includesProtectionFee: "Ներառում է VSTAH պաշտպանական վճարը",
          escrowLegalNote: "Էսկրոու ծառայությունները կարգավորվում են Հայաստանի Հանրապետության օրենքներով։",
          reportProblemLabel: "Հաղորդել խնդրի մասին",
          reportProblemPlaceholder: "Կարճ նկարագրեք խնդիրը (կոճակը դեռ ակտիվ չէ)...",
          reportProblemCta: "Ուղարկել (շուտով)"
        }
      : language === "ru"
        ? {
            loading: "Загрузка соглашения...",
            notConfigured: "Supabase не настроен.",
            notFound: "Соглашение не найдено.",
            offer: "Предложение VSTAH",
            title: "Безопасное сервисное соглашение",
            subtitle: "Проверьте все детали ниже перед подтверждением.",
            client: "Клиент",
            project: "Проект / Услуга",
            total: "Общая стоимость",
            status: "Статус",
            paymentType: "Тип оплаты",
            milestones: "Этапы",
            milestonesValue: "По этапам",
            singleValue: "Единовременно",
            optionalSignature: "Подпись (необязательно)",
            signatureHint: "Поставьте подпись ниже и нажмите «Подписать и принять соглашение».",
            clearSignature: "Очистить подпись",
            signing: "Подписание...",
            signAndAccept: "Подписать и принять соглашение",
            signedSuccess: "Соглашение успешно подписано! Исполнитель уведомлен.",
            signedByClient: "Подписано клиентом",
            signFailed: "Не удалось подписать соглашение. Попробуйте снова.",
            signBlocked:
              "База данных блокирует обновление. Добавьте SUPABASE_SERVICE_ROLE_KEY на сервер или настройте политики RLS в Supabase.",
            releaseMilestone: "Выплатить этап",
            releasingMilestone: "Выплата...",
            depositMilestone: "Депозит",
            depositingMilestone: "Внесение...",
            escrowHeld: "В Эскроу",
            releaseTotalPayment: "Выплатить всю сумму",
            releasingTotalPayment: "Платеж обрабатывается...",
            depositEscrow: "Депозит 100 000 ֏ в Эскроу",
            depositingEscrow: "Внесение депозита...",
            paid: "Оплачено",
            pendingMilestone: "Ожидает",
            paymentSuccessful: "Выплата отправлена! Исполнитель уведомлён.",
            transactionComplete: "Сделка завершена",
            transactionCompleteBody:
              "Все платежные обязательства выполнены. Сделка закрыта.",
            paidInFull: "ОПЛАЧЕНО ПОЛНОСТЬЮ",
            backHome: "На главную",
            agreementPhase: "Соглашение",
            paymentPhase: "Оплата",
            phaseAwaitingSign: "Ожидает подписи",
            phaseSigned: "Подписано",
            phaseCompleted: "Завершено",
            phasePayPending: "Ожидает депозита",
            phasePayEscrow: "Средства в Эскроу",
            phasePayReleased: "Выплачено",
            depositTotalToEscrow: "Внести всю сумму в Эскроу",
            agreementId: "ID соглашения",
            creationDate: "Дата создания",
            providerDetails: "Данные исполнителя",
            clientDetails: "Данные клиента",
            termsAndConditions: "Условия соглашения",
            name: "Имя",
            fullName: "Полное имя",
            businessName: "Название бизнеса",
            providerNameLabel: "Имя исполнителя",
            serviceAreaLabel: "Регион обслуживания",
            statusSigned: "Подписано",
            statusPending: "Ожидает",
            previousMilestoneNotFinished: "Предыдущий этап еще не завершен. Хотите внести депозит за этот этап вне очереди?",
            releaseMilestoneFailed: "Не удалось выплатить этап. Попробуйте снова.",
            depositMilestoneFailed: "Не удалось внести депозит за этот этап. Попробуйте снова.",
            releasePaymentFailed: "Не удалось выплатить средства. Попробуйте снова.",
            depositEscrowFailed: "Не удалось внести средства в Эскроу. Попробуйте снова.",
            includesProtectionFee: "Включает комиссию защиты VSTAH",
            escrowLegalNote: "Эскроу-услуги регулируются законодательством Республики Армения.",
            reportProblemLabel: "Сообщить о проблеме",
            reportProblemPlaceholder: "Кратко опишите проблему (кнопка пока не активна)...",
            reportProblemCta: "Отправить (скоро)"
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
            depositEscrow: "Deposit 100,000 ֏ to Escrow",
            depositingEscrow: "Depositing to escrow...",
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
            phasePayEscrow: "Funds in escrow",
            phasePayReleased: "Released",
            depositTotalToEscrow: "Deposit total to escrow",
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
            depositEscrowFailed: "Failed to deposit funds to escrow. Please try again.",
            includesProtectionFee: "Includes VSTAH Protection Fee",
            escrowLegalNote: "Escrow services are governed by the laws of the Republic of Armenia.",
            reportProblemLabel: "Report a Problem",
            reportProblemPlaceholder: "Briefly describe the issue (button is not active yet)...",
            reportProblemCta: "Submit (coming soon)"
          };

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [releasingMilestoneIndex, setReleasingMilestoneIndex] = useState<number | null>(null);
  const [depositingMilestoneIndex, setDepositingMilestoneIndex] = useState<number | null>(null);
  const [depositingEscrow, setDepositingEscrow] = useState(false);
  /** Fatal: not configured / not found (no agreement to show). */
  const [error, setError] = useState("");
  /** Non-fatal: sign / payment actions while agreement is visible. */
  const [actionError, setActionError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const downloadTriggeredRef = useRef(false);

  const fetchAgreement = useCallback(async () => {
    if (!id) return;
    if (!supabase) {
      setError(tx.notConfigured);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("agreements")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      setError(tx.notFound);
      setLoading(false);
      return;
    }

    setAgreement(normalizeAgreementRow(data as Record<string, unknown>) as Agreement);
    setError("");
    setActionError("");
    setLoading(false);
  }, [id, supabase, tx.notConfigured, tx.notFound]);

  useEffect(() => {
    setLoading(true);
    void fetchAgreement();
  }, [fetchAgreement]);

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

  const tryClientUpdate = async (
    payload: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase || !agreement) return { ok: false, error: tx.signBlocked };
    const run = async (candidatePayload: Record<string, unknown>) =>
      supabase
        .from("agreements")
        .update(candidatePayload)
        .eq("id", agreement.id)
        .select("id");

    let { data: updatedRows, error: updateError } = await run(payload);
    const paymentStatus = payload.payment_status;
    if (
      updateError &&
      paymentStatus === "released" &&
      (updateError.message?.toLowerCase().includes("check_payment_status") ||
        updateError.message?.toLowerCase().includes("payment_status"))
    ) {
      // Compatibility for DBs that still use `paid` instead of `released`.
      ({ data: updatedRows, error: updateError } = await run({ ...payload, payment_status: "paid" }));
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
    const signature = canvasRef.current?.toDataURL("image/png") ?? null;

    const res = await postAgreementAction(agreement.id, "/sign", { signature: signature ?? undefined });
    if (!res.ok && !res.alreadySigned) {
      const fallback = await tryClientUpdate({ status: "signed" });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.signBlocked);
        setSigning(false);
        return;
      }
    }

    await fetchAgreement();
    setSigning(false);
  };

  const releaseMilestone = async (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "escrow_held") return;

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

  const depositMilestone = async (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "pending") return;

    let confirmOutOfOrder = false;
    if (index > 0) {
      const previous = current[index - 1];
      if (previous?.status !== "released") {
        const payAhead = window.confirm(tx.previousMilestoneNotFinished);
        if (!payAhead) return;
        confirmOutOfOrder = true;
      }
    }

    setDepositingMilestoneIndex(index);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/deposit", { milestoneIndex: index, confirmOutOfOrder });
    if (res.status === 409 && res.code === "OUT_OF_ORDER" && !confirmOutOfOrder) {
      setDepositingMilestoneIndex(null);
      const payAhead = window.confirm(tx.previousMilestoneNotFinished);
      if (!payAhead) return;
      setDepositingMilestoneIndex(index);
      const retry = await postAgreementAction(agreement.id, "/deposit", {
        milestoneIndex: index,
        confirmOutOfOrder: true
      });
      if (!retry.ok) {
        setActionError(retry.error || tx.depositMilestoneFailed);
        setDepositingMilestoneIndex(null);
        return;
      }
      await fetchAgreement();
      setDepositingMilestoneIndex(null);
      return;
    }
    if (!res.ok) {
      const nextMilestones = current.map((m, i) => ({
        ...m,
        status: i === index ? "escrow_held" : m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
      }));
      const fallback = await tryClientUpdate({
        milestones: nextMilestones,
        payment_status: "escrow_held"
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.depositMilestoneFailed);
        setDepositingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setDepositingMilestoneIndex(null);
  };

  const releaseTotalPayment = async () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "escrow_held") return;
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

  const depositToEscrow = async () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "pending" || depositingEscrow) return;
    setDepositingEscrow(true);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/deposit", {});
    if (!res.ok) {
      const fallback = await tryClientUpdate({ payment_status: "escrow_held" });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.depositEscrowFailed);
        setDepositingEscrow(false);
        return;
      }
    }

    await fetchAgreement();
    setDepositingEscrow(false);
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
  const providerFields = resolveProviderNameFields(agreement);
  const serviceAreaDisplay = agreement.service_area?.trim() || "Armenia";
  const readableAgreementId = `VSTAH-${new Date(agreement.created_at).getFullYear()}-${agreement.id.split("-")[0].toUpperCase()}`;
  return (
    <main key={routeKey} className="min-h-screen bg-slate-100 px-3 py-6 md:px-6 md:py-10">
      <div ref={printableRef} className="relative mx-auto w-full max-w-[880px] rounded-md border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:px-10 md:py-9">
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
            <p className="mt-1 font-semibold">{new Date(agreement.created_at).toLocaleDateString()}</p>
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
                              onClick={() => void releaseMilestone(i)}
                              disabled={releasingMilestoneIndex === i}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {releasingMilestoneIndex === i ? tx.releasingMilestone : tx.releaseMilestone}
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {tx.pendingMilestone}
                          </span>
                          {agreement.status === "signed" ? (
                            <button
                              type="button"
                              onClick={() => void depositMilestone(i)}
                              disabled={depositingMilestoneIndex === i}
                              className="rounded-lg bg-[#0033A0] px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-60"
                            >
                              {depositingMilestoneIndex === i ? tx.depositingMilestone : tx.depositMilestone}
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

        {!paymentReleased && agreement.status === "signed" && agreement.payment_status === "pending" && (agreement.milestones ?? []).length === 0 ? (
          <button
            type="button"
            onClick={() => void depositToEscrow()}
            disabled={depositingEscrow}
            className="mt-6 w-full rounded-xl bg-[#0033A0] px-5 py-3 text-base font-black text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {depositingEscrow ? (
              tx.depositingEscrow
            ) : (
              <span className="flex flex-col items-center gap-0.5 leading-tight">
                <span>{tx.depositTotalToEscrow}</span>
                <span className="text-sm font-bold opacity-95">{money(Number(agreement.total_price))} ֏</span>
              </span>
            )}
          </button>
        ) : null}

        {!paymentReleased && agreement.status === "signed" && agreement.payment_status === "escrow_held" && (agreement.milestones ?? []).length === 0 ? (
          <button
            type="button"
            onClick={() => void releaseTotalPayment()}
            disabled={releasingMilestoneIndex === -1}
            className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {releasingMilestoneIndex === -1 ? tx.releasingTotalPayment : tx.releaseTotalPayment}
          </button>
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
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-sm font-semibold text-slate-800">{tx.reportProblemLabel}</p>
          <textarea
            rows={3}
            placeholder={tx.reportProblemPlaceholder}
            className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          />
          <button
            type="button"
            disabled
            className="mt-3 inline-flex cursor-not-allowed items-center rounded-lg border border-slate-300 bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-80"
          >
            {tx.reportProblemCta}
          </button>
        </div>
      </div>
    </main>
  );
}
