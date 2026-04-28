"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, Copy, Download, ExternalLink, FilePlus2, LayoutDashboard, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { insertAgreementWithSchemaFallback, normalizeAgreementRow } from "@/lib/agreements/row";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type Lang = Language;
type View = "overview" | "create" | "archive";
type AgreementStatus = "pending" | "signed" | "completed";
type DerivedAgreementStatus = AgreementStatus | "in_progress" | "paid" | "funds_secured";
type PaymentType = "single" | "milestones";
type Milestone = { title: string; amount: number; status?: "pending" | "escrow_held" | "released" };
type MilestoneDraft = { id: string; title: string; amount: string };

type Agreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  total_price: number;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  created_at: string;
};

type Tx = {
  dashboardTitle: string;
  dashboardSubtitle: string;
  overview: string;
  createNewAgreement: string;
  archive: string;
  signedInAs: string;
  logout: string;
  language: string;
  agreementsTitle: string;
  archivedTitle: string;
  totalAgreementValue: string;
  signedAgreements: string;
  loading: string;
  emptyTitle: string;
  emptySubtitle: string;
  clientName: string;
  projectTitle: string;
  price: string;
  status: string;
  copyLink: string;
  viewLink: string;
  download: string;
  searchClientPlaceholder: string;
  noSearchResults: string;
  copied: string;
  createSafeAgreement: string;
  totalPrice: string;
  milestones: string;
  milestonesHint: string;
  singlePayment: string;
  addMilestone: string;
  milestoneTitle: string;
  milestoneAmount: string;
  milestonesMismatch: string;
  create: string;
  creating: string;
  completeRequired: string;
  completeMilestones: string;
  completedAgreements: string;
  noCompleted: string;
  successTitle: string;
  successSubtitle: string;
  publicLink: string;
  copyToClipboard: string;
  close: string;
  toastCreated: string;
  pending: string;
  signed: string;
  completed: string;
  inProgress: string;
  paid: string;
  fundsSecured: string;
  signatureSigned: string;
  paymentReleasedBanner: string;
  releaseProgress: string;
  vault: string;
  waiting: string;
  releasedOfTotal: string;
};

const t: Record<Lang, Tx> = {
  en: {
    dashboardTitle: "Service Provider Dashboard",
    dashboardSubtitle: "Manage your agreements professionally.",
    overview: "Overview",
    createNewAgreement: "Create New Agreement",
    archive: "Archive",
    signedInAs: "Signed in as",
    logout: "Log out",
    language: "Language",
    agreementsTitle: "Agreements",
    archivedTitle: "Archived Agreements",
    totalAgreementValue: "Total Agreement Value",
    signedAgreements: "Signed Agreements",
    loading: "Loading agreements...",
    emptyTitle: "Create your first deal to get started",
    emptySubtitle: "You can create a safe agreement and instantly share it with your client.",
    clientName: "Client Name",
    projectTitle: "Project Title",
    price: "Price",
    status: "Status",
    copyLink: "Copy Link",
    viewLink: "View Link",
    download: "Download",
    searchClientPlaceholder: "Search by client name...",
    noSearchResults: "No agreements match your search.",
    copied: "Copied!",
    createSafeAgreement: "Create Safe Agreement",
    totalPrice: "Total Price (AMD ֏)",
    milestones: "Milestones",
    milestonesHint: "Split payment into milestone amounts.",
    singlePayment: "Single payment selected.",
    addMilestone: "Add milestone",
    milestoneTitle: "Milestone title",
    milestoneAmount: "Amount (֏)",
    milestonesMismatch: "Milestones total must match total price.",
    create: "Create",
    creating: "Creating...",
    completeRequired: "Please complete all required fields.",
    completeMilestones: "Please fill all milestone titles and amounts.",
    completedAgreements: "Completed Agreements",
    noCompleted: "No completed agreements yet.",
    successTitle: "Agreement Created Successfully!",
    successSubtitle: "Share this public agreement link with your client.",
    publicLink: "Public Link",
    copyToClipboard: "Copy to Clipboard",
    close: "Close",
    toastCreated: "Agreement created successfully.",
    pending: "Pending",
    signed: "Signed",
    completed: "Completed",
    inProgress: "In Progress",
    paid: "Paid",
    fundsSecured: "Funds Secured",
    signatureSigned: "✍️ Signed",
    paymentReleasedBanner: "🎉 Payment released by client.",
    releaseProgress: "Release Progress",
    vault: "Vault",
    waiting: "Waiting",
    releasedOfTotal: "Released"
  },
  hy: {
    dashboardTitle: "Մատակարարի վահանակ",
    dashboardSubtitle: "Կառավարեք ձեր պայմանագրերը պրոֆեսիոնալ ձևով։",
    overview: "Ընդհանուր",
    createNewAgreement: "Ստեղծել նոր պայմանագիր",
    archive: "Արխիվ",
    signedInAs: "Մուտք գործած է",
    logout: "Դուրս գալ",
    language: "Լեզու",
    agreementsTitle: "Պայմանագրեր",
    archivedTitle: "Արխիվացված պայմանագրեր",
    totalAgreementValue: "Պայմանագրերի ընդհանուր արժեք",
    signedAgreements: "Ստորագրված պայմանագրեր",
    loading: "Պայմանագրերը բեռնվում են...",
    emptyTitle: "Ստեղծեք ձեր առաջին գործարքը սկսելու համար",
    emptySubtitle: "Ստեղծեք անվտանգ պայմանագիր և անմիջապես կիսվեք հաճախորդի հետ։",
    clientName: "Հաճախորդի անուն",
    projectTitle: "Նախագծի վերնագիր",
    price: "Գին",
    status: "Կարգավիճակ",
    copyLink: "Պատճենել հղումը",
    viewLink: "Բացել հղումը",
    download: "Ներբեռնել",
    searchClientPlaceholder: "Փնտրել ըստ հաճախորդի անվան...",
    noSearchResults: "Ձեր որոնմամբ պայմանագիր չի գտնվել։",
    copied: "Պատճենված է!",
    createSafeAgreement: "Ստեղծել անվտանգ պայմանագիր",
    totalPrice: "Ընդհանուր գին (AMD ֏)",
    milestones: "Փուլեր",
    milestonesHint: "Բաժանեք վճարումը փուլային գումարների։",
    singlePayment: "Ընտրված է մեկանգամյա վճարում։",
    addMilestone: "Ավելացնել փուլ",
    milestoneTitle: "Փուլի անվանում",
    milestoneAmount: "Գումար (֏)",
    milestonesMismatch: "Փուլերի գումարը պետք է հավասար լինի ընդհանուր գնին։",
    create: "Ստեղծել",
    creating: "Ստեղծվում է...",
    completeRequired: "Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը։",
    completeMilestones: "Խնդրում ենք լրացնել բոլոր փուլերի անվանումներն ու գումարները։",
    completedAgreements: "Ավարտված պայմանագրեր",
    noCompleted: "Ավարտված պայմանագրեր դեռ չկան։",
    successTitle: "Պայմանագիրը հաջողությամբ ստեղծվեց։",
    successSubtitle: "Կիսվեք այս հանրային հղումով ձեր հաճախորդի հետ։",
    publicLink: "Հանրային հղում",
    copyToClipboard: "Պատճենել",
    close: "Փակել",
    toastCreated: "Պայմանագիրը հաջողությամբ ստեղծվեց։",
    pending: "Սպասման մեջ",
    signed: "Ստորագրված",
    completed: "Ավարտված",
    inProgress: "Ընթացքում",
    paid: "Վճարված",
    fundsSecured: "Միջոցները ապահովված են",
    signatureSigned: "✍️ Ստորագրված",
    paymentReleasedBanner: "🎉 Հաճախորդը արձակել է վճարումը։",
    releaseProgress: "Արձակման առաջընթաց",
    vault: "Էսկրոու",
    waiting: "Սպասում",
    releasedOfTotal: "Արձակված"
  },
  ru: {
    dashboardTitle: "Панель поставщика услуг",
    dashboardSubtitle: "Профессионально управляйте своими сделками.",
    overview: "Обзор",
    createNewAgreement: "Создать новую сделку",
    archive: "Архив",
    signedInAs: "В системе",
    logout: "Выйти",
    language: "Язык",
    agreementsTitle: "Сделки",
    archivedTitle: "Архив сделок",
    totalAgreementValue: "Общая стоимость сделок",
    signedAgreements: "Подписанные сделки",
    loading: "Загрузка сделок...",
    emptyTitle: "Создайте первую сделку, чтобы начать",
    emptySubtitle: "Создайте безопасную сделку и сразу отправьте клиенту.",
    clientName: "Имя клиента",
    projectTitle: "Название проекта",
    price: "Цена",
    status: "Статус",
    copyLink: "Копировать ссылку",
    viewLink: "Открыть ссылку",
    download: "Скачать",
    searchClientPlaceholder: "Поиск по имени клиента...",
    noSearchResults: "По вашему запросу соглашения не найдены.",
    copied: "Скопировано!",
    createSafeAgreement: "Создать безопасную сделку",
    totalPrice: "Общая цена (AMD ֏)",
    milestones: "Этапы",
    milestonesHint: "Разделите оплату на этапы.",
    singlePayment: "Выбран единый платеж.",
    addMilestone: "Добавить этап",
    milestoneTitle: "Название этапа",
    milestoneAmount: "Сумма (֏)",
    milestonesMismatch: "Сумма этапов должна совпадать с общей ценой.",
    create: "Создать",
    creating: "Создание...",
    completeRequired: "Пожалуйста, заполните все обязательные поля.",
    completeMilestones: "Пожалуйста, заполните названия и суммы всех этапов.",
    completedAgreements: "Завершённые сделки",
    noCompleted: "Завершённых сделок пока нет.",
    successTitle: "Сделка успешно создана!",
    successSubtitle: "Поделитесь этой публичной ссылкой с клиентом.",
    publicLink: "Публичная ссылка",
    copyToClipboard: "Копировать",
    close: "Закрыть",
    toastCreated: "Сделка успешно создана.",
    pending: "Ожидание",
    signed: "Подписано",
    completed: "Завершено",
    inProgress: "В процессе",
    paid: "Оплачено",
    fundsSecured: "Средства обеспечены",
    signatureSigned: "✍️ Подписано",
    paymentReleasedBanner: "🎉 Клиент выплатил платеж.",
    releaseProgress: "Прогресс выплат",
    vault: "Эскроу",
    waiting: "Ожидает",
    releasedOfTotal: "Выплачено"
  }
};

const statusBadge: Record<DerivedAgreementStatus, string> = {
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  signed: "border-emerald-200 bg-emerald-100 text-emerald-800",
  completed: "border-blue-200 bg-blue-100 text-[#0033A0]",
  in_progress: "border-orange-200 bg-orange-100 text-orange-800",
  paid: "border-emerald-200 bg-emerald-100 text-emerald-800",
  funds_secured: "border-blue-200 bg-blue-100 text-[#0033A0]"
};

const createMilestone = (): MilestoneDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  amount: ""
});

const formatAMD = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ֏`;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { language: lang, setLanguage: setLang } = useLanguage();
  const supabase = getSupabaseBrowser();

  const [view, setView] = useState<View>("overview");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copiedAgreementId, setCopiedAgreementId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [successAgreementId, setSuccessAgreementId] = useState("");

  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [totalPriceInput, setTotalPriceInput] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("single");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const lastPaymentStatusByIdRef = useRef<Record<string, Agreement["payment_status"]>>({});

  const tx = t[lang];
  const statusText: Record<DerivedAgreementStatus, string> = {
    pending: tx.pending,
    signed: tx.signed,
    completed: tx.completed,
    in_progress: tx.inProgress,
    paid: tx.paid,
    funds_secured: tx.fundsSecured
  };

  const getReleasedMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + (m.status === "released" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getEscrowHeldMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + (m.status === "escrow_held" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getPendingMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + ((m.status ?? "pending") === "pending" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getReleaseProgress = (agreement: Agreement): { pct: number; released: number; escrow: number; pending: number } => {
    const total = Number(agreement.total_price || 0);
    if (agreement.payment_type === "milestones") {
      const released = getReleasedMilestoneAmount(agreement);
      const escrow = getEscrowHeldMilestoneAmount(agreement);
      const pending = Math.max(0, total - released - escrow);
      const pct = total > 0 ? Math.max(0, Math.min(100, (released / total) * 100)) : 0;
      return { pct, released, escrow, pending };
    }

    const released = agreement.payment_status === "released" ? total : 0;
    const escrow = agreement.payment_status === "escrow_held" ? total : 0;
    const pending = agreement.payment_status === "pending" ? total : 0;
    const pct = agreement.payment_status === "released" ? 100 : agreement.payment_status === "escrow_held" ? 50 : 0;
    return { pct, released, escrow, pending };
  };

  const getDerivedStatus = (agreement: Agreement): DerivedAgreementStatus => {
    if (agreement.payment_status === "released") return "paid";
    if (agreement.payment_status === "escrow_held") return "funds_secured";
    if (agreement.status === "completed") return "completed";
    if (agreement.payment_type === "milestones") {
      const milestones = agreement.milestones ?? [];
      const releasedCount = milestones.filter((m) => m.status === "released").length;
      if (milestones.length > 0 && releasedCount === milestones.length) return "completed";
      if (releasedCount > 0) return "in_progress";
    }
    if (agreement.status === "signed") return "signed";
    return "pending";
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/register?next=%2Fdashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!toast) return;
    const tm = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(tm);
  }, [toast]);

  useEffect(() => {
    if (!copiedAgreementId) return;
    const tm = window.setTimeout(() => setCopiedAgreementId(""), 1200);
    return () => window.clearTimeout(tm);
  }, [copiedAgreementId]);

  useEffect(() => {
    const prev = lastPaymentStatusByIdRef.current;
    let releasedDetected = false;
    for (const a of agreements) {
      if (prev[a.id] && prev[a.id] !== "released" && a.payment_status === "released") {
        releasedDetected = true;
      }
      prev[a.id] = a.payment_status;
    }
    if (releasedDetected) {
      setToast(tx.paymentReleasedBanner);
    }
  }, [agreements, tx.paymentReleasedBanner]);

  const totalPrice = useMemo(() => {
    const normalized = totalPriceInput.replaceAll(",", ".").replace(/[^0-9.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [totalPriceInput]);

  const milestonesParsed = useMemo(
    () =>
      milestones.map((m) => ({
        title: m.title.trim(),
        amount: Number(m.amount.replaceAll(",", ".").replace(/[^0-9.]/g, "")) || 0
      })),
    [milestones]
  );

  const milestonesTotal = useMemo(() => milestonesParsed.reduce((sum, item) => sum + item.amount, 0), [milestonesParsed]);
  const milestonesValid = paymentType === "single" || Math.abs(milestonesTotal - totalPrice) < 0.0001;

  const fetchAgreements = useCallback(async () => {
    if (!supabase || !user?.id) {
      setLoadingAgreements(false);
      return;
    }
    setLoadingAgreements(true);
    const { data, error: fetchError } = await supabase
      .from("agreements")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoadingAgreements(false);
      return;
    }

    setAgreements((data ?? []).map((row) => normalizeAgreementRow(row as Record<string, unknown>)) as Agreement[]);
    setLoadingAgreements(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    void fetchAgreements();
  }, [fetchAgreements]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase
      .channel(`agreements-dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agreements", filter: `provider_id=eq.${user.id}` },
        (payload) => {
          // Apply realtime row updates immediately so Signed/Paid badges change without refresh.
          if (payload.eventType === "DELETE" && payload.old?.id) {
            const deletedId = String(payload.old.id);
            setAgreements((prev) => prev.filter((a) => a.id !== deletedId));
            return;
          }

          if (payload.new) {
            const next = normalizeAgreementRow(payload.new as Record<string, unknown>) as Agreement;
            setAgreements((prev) => {
              const idx = prev.findIndex((a) => a.id === next.id);
              if (idx === -1) return [next, ...prev];
              const copy = [...prev];
              copy[idx] = next;
              return copy;
            });
          }

          // Fallback for strict consistency (ordering/derived totals).
          void fetchAgreements();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, fetchAgreements]);

  const copyAgreementLink = async (id: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://vstah.am";
    const link = `${base}/agreement/${id}`;
    await navigator.clipboard.writeText(link);
    setCopiedAgreementId(id);
  };

  const getAgreementPublicUrl = (id: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://vstah.am";
    return `${base}/agreement/${id}`;
  };

  const openAgreementLink = (id: string) => {
    window.open(getAgreementPublicUrl(id), "_blank", "noopener,noreferrer");
  };

  const downloadAgreementPdf = (agreement: Agreement) => {
    const link = `${getAgreementPublicUrl(agreement.id)}?download=1`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => {
    setClientName("");
    setProjectTitle("");
    setServiceArea("");
    setContractTerms("");
    setTotalPriceInput("");
    setPaymentType("single");
    setMilestones([]);
    setError("");
  };

  const buildDefaultTerms = (input: {
    providerName: string;
    clientName: string;
    serviceArea: string;
    totalPrice: number;
  }) =>
    [
      "SERVICE AGREEMENT",
      "",
      `This Agreement is made between ${input.providerName || "Service Provider"} (\"Provider\") and ${input.clientName} (\"Client\").`,
      `Service Area: ${input.serviceArea}.`,
      `Total Price: ${formatAMD(input.totalPrice)}.`,
      "",
      "Provider agrees to deliver services professionally and within the agreed scope and timeline.",
      "Client agrees to cooperate, provide access where required, and review delivered work in good faith.",
      "",
      "Funds will be released only upon client approval."
    ].join("\n");

  const submitAgreement = async () => {
    if (!user?.id || !supabase) {
      setError("You must be logged in to create an agreement.");
      return;
    }
    setError("");

    if (!clientName.trim() || !projectTitle.trim() || !serviceArea.trim() || totalPrice <= 0) {
      setError(tx.completeRequired);
      return;
    }

    if (paymentType === "milestones") {
      if (milestonesParsed.length === 0 || milestonesParsed.some((m) => !m.title || m.amount <= 0)) {
        setError(tx.completeMilestones);
        return;
      }
      if (!milestonesValid) {
        setError(tx.milestonesMismatch);
        return;
      }
    }

    setCreating(true);
    const providerName = user.email?.split("@")[0] || "Service Provider";
    const customTermsText =
      contractTerms.trim() ||
      buildDefaultTerms({
        providerName,
        clientName: clientName.trim(),
        serviceArea: serviceArea.trim(),
        totalPrice
      });
    const result = await insertAgreementWithSchemaFallback(supabase, {
      providerId: user.id,
      providerName,
      clientName: clientName.trim(),
      projectTitle: projectTitle.trim(),
      serviceArea: serviceArea.trim(),
      customTerms: customTermsText,
      totalPrice,
      paymentType,
      milestones: paymentType === "milestones" ? milestonesParsed : []
    });
    setCreating(false);

    if (result.error || !result.id) {
      setError(result.error ?? "Failed to create agreement.");
      return;
    }

    setSuccessAgreementId(result.id);
    setToast(tx.toastCreated);
    resetForm();
    setView("overview");
    await fetchAgreements();
  };

  const stats = useMemo(
    () => ({
      totalValue: agreements.reduce((sum, a) => sum + Number(a.total_price || 0), 0),
      signedCount: agreements.filter((a) => a.payment_status === "escrow_held" || a.payment_status === "released").length
    }),
    [agreements]
  );

  const archived = agreements.filter((a) => getDerivedStatus(a) === "completed");
  const listed = agreements.filter((a) => getDerivedStatus(a) !== "completed");
  const showClientSearch = listed.length > 15;
  const filteredListed = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return listed;
    return listed.filter((item) => item.client_name.toLowerCase().includes(query));
  }, [listed, clientSearch]);

  if (loading || !user) return <div className="min-h-screen bg-[#F9FAFB] p-6">Loading dashboard...</div>;

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] text-slate-900">
      <div className="flex h-full">
        <aside className="hidden h-screen w-72 min-w-[18rem] shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
          <h1 className="text-2xl font-black">{tx.dashboardTitle}</h1>
          <p className="mt-2 text-sm text-blue-100">{tx.dashboardSubtitle}</p>
          <nav className="mt-8 space-y-2">
            {[
              { id: "overview" as const, label: tx.overview, icon: LayoutDashboard },
              { id: "create" as const, label: tx.createNewAgreement, icon: FilePlus2 },
              { id: "archive" as const, label: tx.archive, icon: Archive }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${view === id ? "bg-white text-[#0033A0]" : "text-blue-100 hover:bg-blue-700/40"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <p className="text-xs text-blue-100">{tx.signedInAs}: {user.email}</p>
            <button
              type="button"
              onClick={() => void signOut().then(() => router.replace("/login?next=%2Fdashboard"))}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0033A0]"
            >
              {tx.logout}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#0033A0]">{view === "archive" ? tx.archivedTitle : tx.agreementsTitle}</h2>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
                    <span className="px-2 text-xs font-semibold text-slate-500">{tx.language}</span>
                    {(["en", "hy", "ru"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLang(code)}
                        className="rounded-md px-2 py-1 text-xs font-bold uppercase"
                        style={{ backgroundColor: lang === code ? "#F2A800" : "transparent", color: lang === code ? "#111827" : "#64748B" }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setView("create")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900"
                >
                  <Plus className="h-4 w-4" />
                  {tx.createNewAgreement}
                </button>
              </div>
            </header>

            {view === "overview" ? (
              <>
                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.totalAgreementValue}</p>
                    <p className="mt-2 text-3xl font-black">{formatAMD(stats.totalValue)}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.signedAgreements}</p>
                    <p className="mt-2 text-3xl font-black">{stats.signedCount}</p>
                  </article>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {loadingAgreements ? (
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />{tx.loading}</div>
                  ) : listed.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="font-semibold text-slate-800">{tx.emptyTitle}</p>
                      <p className="mt-1 text-sm text-slate-600">{tx.emptySubtitle}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {showClientSearch ? (
                        <div className="mb-3">
                          <input
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder={tx.searchClientPlaceholder}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-sm"
                          />
                        </div>
                      ) : null}
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2">{tx.clientName}</th>
                            <th className="px-3 py-2">{tx.price}</th>
                            <th className="px-3 py-2">{tx.releaseProgress}</th>
                            <th className="px-3 py-2">{tx.status}</th>
                            <th className="px-3 py-2">
                              <span className="sr-only">{tx.viewLink} / {tx.copyLink} / {tx.download}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredListed.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                              <td className="px-3 py-3">{formatAMD(Number(item.total_price))}</td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const progress = getReleaseProgress(item);
                                  return (
                                    <div className="min-w-[190px]">
                                      <p className="mb-1 text-xs font-semibold text-slate-600">
                                        {formatAMD(progress.released)} / {formatAMD(Number(item.total_price || 0))} {tx.releasedOfTotal}
                                      </p>
                                      <p className="mb-1 text-[11px] font-semibold text-slate-500">
                                        {tx.vault}: {formatAMD(progress.escrow)} | {tx.waiting}: {formatAMD(progress.pending)}
                                      </p>
                                      <div className="h-2 w-full rounded-full bg-slate-200">
                                        <div
                                          className="h-2 rounded-full bg-orange-500 transition-all"
                                          style={{ width: `${progress.pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const derived = getDerivedStatus(item);
                                  const showSignedIndicator = item.status === "signed" && derived !== "paid" && derived !== "completed";
                                  const paid = item.payment_status === "released" || derived === "paid";
                                  const escrow =
                                    item.payment_status === "escrow_held" ||
                                    getEscrowHeldMilestoneAmount(item) > 0;
                                  const signedMark = item.status === "signed" || item.status === "completed";
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                        {paid ? (
                                          <span title={tx.paid}>✅</span>
                                        ) : (
                                          <>
                                            {signedMark ? <span title={tx.signed}>✍️</span> : null}
                                            {escrow ? <span title={tx.fundsSecured}>🔒</span> : null}
                                          </>
                                        )}
                                      </div>
                                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>
                                        {statusText[derived]}
                                      </span>
                                      {showSignedIndicator ? (
                                        <p className="text-xs font-semibold text-slate-500">{tx.signatureSigned}</p>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}>
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}>
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => downloadAgreementPdf(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}>
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredListed.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                                {tx.noSearchResults}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {view === "create" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold">{tx.createSafeAgreement}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">{tx.clientName}<input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700">{tx.projectTitle}<input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">Service Area<input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">{tx.totalPrice}<input value={totalPriceInput} onChange={(e) => setTotalPriceInput(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                    Contract Terms
                    <textarea
                      value={contractTerms}
                      onChange={(e) => setContractTerms(e.target.value)}
                      rows={7}
                      placeholder="Add specific contract terms. If left empty, a professional default template will be used."
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-sm font-bold text-slate-900">{tx.milestones}</p><p className="text-xs text-slate-500">{tx.milestonesHint}</p></div>
                    <button type="button" onClick={() => setPaymentType((p) => (p === "single" ? "milestones" : "single"))} className={`inline-flex h-8 w-16 items-center rounded-full p-1 transition ${paymentType === "milestones" ? "bg-[#0033A0]" : "bg-slate-300"}`}><span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${paymentType === "milestones" ? "translate-x-8" : "translate-x-0"}`} /></button>
                  </div>

                  {paymentType === "milestones" ? (
                    <div className="mt-4 space-y-3">
                      {milestones.map((m, index) => (
                        <div key={m.id} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                          <input value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))} placeholder={`${tx.milestoneTitle} ${index + 1}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                          <input value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, amount: e.target.value } : x)))} placeholder={tx.milestoneAmount} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                          <button type="button" onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))} className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-red-600" aria-label="Remove milestone"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setMilestones((prev) => [...prev, createMilestone()])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><Plus className="h-4 w-4" />{tx.addMilestone}</button>
                      <p className={`text-xs font-semibold ${milestonesValid ? "text-slate-600" : "text-red-600"}`}>{tx.milestones}: {formatAMD(milestonesTotal)} / {tx.totalPrice}: {formatAMD(totalPrice || 0)}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">{tx.singlePayment}</p>
                  )}
                </div>

                {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}

                <div className="mt-5">
                  <button type="button" onClick={() => void submitAgreement()} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-black text-slate-900 disabled:opacity-60">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {creating ? tx.creating : tx.create}
                  </button>
                </div>
              </section>
            ) : null}

            {view === "archive" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold">{tx.completedAgreements}</h3>
                {archived.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">{tx.noCompleted}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">{tx.clientName}</th>
                          <th className="px-3 py-2">{tx.price}</th>
                          <th className="px-3 py-2">{tx.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archived.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                            <td className="px-3 py-3">{formatAMD(Number(item.total_price))}</td>
                            <td className="px-3 py-3">
                              {(() => {
                                const derived = getDerivedStatus(item);
                                const paid = item.payment_status === "released" || derived === "paid";
                                const escrow =
                                  item.payment_status === "escrow_held" ||
                                  getEscrowHeldMilestoneAmount(item) > 0;
                                const signedMark = item.status === "signed" || item.status === "completed";
                                return (
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                      {paid ? (
                                        <span title={tx.paid}>✅</span>
                                      ) : (
                                        <>
                                          {signedMark ? <span title={tx.signed}>✍️</span> : null}
                                          {escrow ? <span title={tx.fundsSecured}>🔒</span> : null}
                                        </>
                                      )}
                                    </div>
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>
                                      {statusText[derived]}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </main>
      </div>

      {successAgreementId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-xl font-extrabold text-emerald-700">{tx.successTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{tx.successSubtitle}</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">{tx.publicLink}</p>
              <p className="mt-1 break-all text-sm font-bold text-slate-900">{typeof window !== "undefined" ? `${window.location.origin}/agreement/${successAgreementId}` : `/agreement/${successAgreementId}`}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyAgreementLink(successAgreementId)} className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900"><Copy className="h-4 w-4" />{copiedAgreementId === successAgreementId ? tx.copied : tx.copyToClipboard}</button>
              <button type="button" onClick={() => setSuccessAgreementId("")} className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{tx.close}</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}
