"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  Globe,
  LayoutDashboard,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { formatAMD, formatProMonthly } from "@/lib/currency";
import { FREE_AGREEMENT_LIMIT, readMockPlan, writeMockPlan, type MockPlanId } from "@/lib/subscription/mock";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { insertAgreementWithSchemaFallback, normalizeAgreementRow } from "@/lib/agreements/row";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type Lang = Language;
type View = "overview" | "create" | "archive" | "billing";
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
  agreementHistory: string;
  noHistory: string;
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
  agreementIdCol: string;
  completionDateCol: string;
  viewDetails: string;
  contractTerms: string;
  contractTermsPlaceholder: string;
  billing: string;
  billingTitle: string;
  currentPlan: string;
  planFree: string;
  planPro: string;
  statusActiveTrial: string;
  statusActive: string;
  agreementsUsedLabel: string;
  unlimitedAgreements: string;
  usageTitle: string;
  freeAgreementsProgress: string;
  limitReached: string;
  upgradeToPro: string;
  upgradePerMonth: string;
  upgradeSubtitle: string;
  upgradeNowMock: string;
  freePlanBanner: string;
  upgrade: string;
  freeLimitTitle: string;
  freeLimitMessage: string;
  freeLimitUpgrade: string;
  mockTesting: string;
  mockSwitchToFree: string;
};

const t: Record<Lang, Tx> = {
  en: {
    dashboardTitle: "Service Provider Dashboard",
    dashboardSubtitle: "Manage your agreements professionally.",
    overview: "Overview",
    createNewAgreement: "Create New Agreement",
    archive: "Agreement History",
    signedInAs: "Signed in as",
    logout: "Log out",
    language: "Language",
    agreementsTitle: "Agreements",
    archivedTitle: "Agreement History",
    totalAgreementValue: "Total Earned Revenue",
    signedAgreements: "Signed Agreements",
    loading: "Loading agreements...",
    emptyTitle: "Create your first deal to get started",
    emptySubtitle: "You can create a safe agreement and instantly share it with your client.",
    clientName: "Client Name",
    projectTitle: "Project Title",
    price: "Amount",
    status: "Status",
    copyLink: "Copy Link",
    viewLink: "View Link",
    download: "Download",
    searchClientPlaceholder: "Search by client name...",
    noSearchResults: "No agreements match your search.",
    copied: "Copied!",
    createSafeAgreement: "Create Safe Agreement",
    totalPrice: "Total Price (֏)",
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
    agreementHistory: "Agreement History",
    noHistory: "Signed and completed agreements will appear here.",
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
    releasedOfTotal: "Released",
    agreementIdCol: "ID",
    completionDateCol: "Date",
    viewDetails: "View Details",
    contractTerms: "Contract Terms",
    contractTermsPlaceholder: "Editable at any time. Your latest saved terms load when you open the dashboard.",
    billing: "Billing",
    billingTitle: "Billing & Plan",
    currentPlan: "Current plan",
    planFree: "Free",
    planPro: "Pro",
    statusActiveTrial: "Active Trial",
    statusActive: "Active",
    agreementsUsedLabel: "Agreements used",
    unlimitedAgreements: "Unlimited Agreements",
    usageTitle: "Usage",
    freeAgreementsProgress: "{used} / {limit} Free Agreements Used",
    limitReached: "Limit Reached",
    upgradeToPro: "Upgrade to Pro",
    upgradePerMonth: "/ month",
    upgradeSubtitle: "Unlimited agreements + full access",
    upgradeNowMock: "Upgrade Now (Mock)",
    freePlanBanner: "Free Plan: {used}/{limit} agreements used",
    upgrade: "Upgrade",
    freeLimitTitle: "Free limit reached",
    freeLimitMessage: "Upgrade to Pro for unlimited agreements",
    freeLimitUpgrade: "Upgrade (Mock)",
    mockTesting: "Testing controls",
    mockSwitchToFree: "Switch to Free (mock)"
  },
  hy: {
    dashboardTitle: "Մատակարարի վահանակ",
    dashboardSubtitle: "Պայմանագրերը՝ մեկ վահանակում։",
    overview: "Ընդհանուր",
    createNewAgreement: "Ստեղծել նոր պայմանագիր",
    archive: "Պայմանագրերի պատմություն",
    signedInAs: "Մուտք՝",
    logout: "Դուրս գալ",
    language: "Լեզու",
    agreementsTitle: "Պայմանագրեր",
    archivedTitle: "Պայմանագրերի պատմություն",
    totalAgreementValue: "Ընդհանուր եկամուտ",
    signedAgreements: "Ստորագրված պայմանագրեր",
    loading: "Բեռնում…",
    emptyTitle: "Սկսեք առաջին գործարքով",
    emptySubtitle: "Ապահով պայմանագիր՝ ուղարկեք հղումը հաճախորդին։",
    clientName: "Հաճախորդի անուն",
    projectTitle: "Նախագծի վերնագիր",
    price: "Գումար",
    status: "Կարգավիճակ",
    copyLink: "Պատճենել հղումը",
    viewLink: "Բացել հղումը",
    download: "Ներբեռնել",
    searchClientPlaceholder: "Փնտրել ըստ հաճախորդի անվան…",
    noSearchResults: "Որոնմամբ պայմանագիր չի գտնվել։",
    copied: "Պատճենված է!",
    createSafeAgreement: "Ստեղծել անվտանգ պայմանագիր",
    totalPrice: "Ընդհանուր գին (֏)",
    milestones: "Փուլեր",
    milestonesHint: "Բաժանեք վճարը փուլերի։",
    singlePayment: "Մեկ վճարում",
    addMilestone: "Ավելացնել փուլ",
    milestoneTitle: "Փուլի անվանում",
    milestoneAmount: "Գումար (֏)",
    milestonesMismatch: "Փուլերի գումարը պետք է հավասար լինի ընդհանուրին։",
    create: "Ստեղծել",
    creating: "Ստեղծվում է…",
    completeRequired: "Լրացրեք բոլոր պարտադիր դաշտերը։",
    completeMilestones: "Լրացրեք փուլերի անուններն ու գումարները։",
    agreementHistory: "Պայմանագրերի պատմություն",
    noHistory: "Ստորագրված և ավարտված պայմանագրերը կհայտնվեն այստեղ։",
    successTitle: "Պայմանագիրը պատրաստ է",
    successSubtitle: "Ուղարկեք հղումը հաճախորդին։",
    publicLink: "Հանրային հղում",
    copyToClipboard: "Պատճենել",
    close: "Փակել",
    toastCreated: "Պայմանագիրը ստեղծված է։",
    pending: "Սպասում",
    signed: "Ստորագրված",
    completed: "Ավարտված",
    inProgress: "Ընթացքում",
    paid: "Վճարված",
    fundsSecured: "Գումարը՝ էսկրոուում",
    signatureSigned: "✍️ Ստորագրված",
    paymentReleasedBanner: "🎉 Հաճախորդը արձակեց վճարումը",
    releaseProgress: "Արձակման ընթացք",
    vault: "Էսկրոու",
    waiting: "Սպասում",
    releasedOfTotal: "Արձակված",
    agreementIdCol: "ID",
    completionDateCol: "Ամսաթիվ",
    viewDetails: "Մանրամասն",
    contractTerms: "Պայմաններ",
    contractTermsPlaceholder:
      "Խմբագրելի է միշտ։ Վերջին պահվածը՝ վահանակը բացելիս։",
    billing: "Վճարում",
    billingTitle: "Փաթեթ և վճարում",
    currentPlan: "Ընթացիկ փաթեթ",
    planFree: "Անվճար",
    planPro: "Պրո",
    statusActiveTrial: "Ակտիվ փորձարկում",
    statusActive: "Ակտիվ",
    agreementsUsedLabel: "Օգտագործված պայմանագրեր",
    unlimitedAgreements: "Անսահմանափակ պայմանագրեր",
    usageTitle: "Օգտագործում",
    freeAgreementsProgress: "{used} / {limit} անվճար պայմանագիր",
    limitReached: "Սահմանաչափը լրացված է",
    upgradeToPro: "Անցնել Պրո փաթեթին",
    upgradePerMonth: "/ ամիս",
    upgradeSubtitle: "Անսահմանափակ պայմանագրեր + ամբողջ հասանելիություն",
    upgradeNowMock: "Թարմացնել (մոկ)",
    freePlanBanner: "Անվճար փաթեթ՝ {used}/{limit} պայմանագիր",
    upgrade: "Թարմացնել",
    freeLimitTitle: "Անվճար սահմանաչափը լրացված է",
    freeLimitMessage: "Անցեք Պրո փաթեթին՝ անսահմանափակ պայմանագրերի համար",
    freeLimitUpgrade: "Թարմացնել (մոկ)",
    mockTesting: "Փորձարկման կառավարում",
    mockSwitchToFree: "Անվճար (մոկ)"
  },
  ru: {
    dashboardTitle: "Кабинет исполнителя",
    dashboardSubtitle: "Соглашения — в одном месте.",
    overview: "Обзор",
    createNewAgreement: "Новое соглашение",
    archive: "История соглашений",
    signedInAs: "Вы вошли как",
    logout: "Выйти",
    language: "Язык",
    agreementsTitle: "Соглашения",
    archivedTitle: "История соглашений",
    totalAgreementValue: "Совокупный доход",
    signedAgreements: "Подписанные соглашения",
    loading: "Загрузка…",
    emptyTitle: "Создайте первое соглашение",
    emptySubtitle: "Создайте защищённое соглашение и сразу отправьте клиенту ссылку.",
    clientName: "Клиент",
    projectTitle: "Проект",
    price: "Сумма",
    status: "Статус",
    copyLink: "Копировать ссылку",
    viewLink: "Открыть ссылку",
    download: "Скачать",
    searchClientPlaceholder: "Поиск по клиенту…",
    noSearchResults: "Ничего не найдено.",
    copied: "Скопировано",
    createSafeAgreement: "Создать защищённое соглашение",
    totalPrice: "Сумма по соглашению (֏)",
    milestones: "Этапы",
    milestonesHint: "Разбейте оплату по этапам.",
    singlePayment: "Выбран один платёж",
    addMilestone: "Добавить этап",
    milestoneTitle: "Название этапа",
    milestoneAmount: "Сумма (֏)",
    milestonesMismatch: "Сумма этапов должна совпадать с общей суммой.",
    create: "Создать",
    creating: "Создание…",
    completeRequired: "Заполните обязательные поля.",
    completeMilestones: "Укажите названия и суммы всех этапов.",
    agreementHistory: "История соглашений",
    noHistory: "Здесь появятся подписанные и завершённые соглашения.",
    successTitle: "Соглашение создано",
    successSubtitle: "Отправьте клиенту эту публичную ссылку.",
    publicLink: "Публичная ссылка",
    copyToClipboard: "Копировать",
    close: "Закрыть",
    toastCreated: "Соглашение создано.",
    pending: "Ожидает",
    signed: "Подписано",
    completed: "Завершено",
    inProgress: "В работе",
    paid: "Оплачено",
    fundsSecured: "Средства в эскроу",
    signatureSigned: "✍️ Подписано",
    paymentReleasedBanner: "🎉 Клиент подтвердил выплату",
    releaseProgress: "Выплаты по этапам",
    vault: "Эскроу",
    waiting: "Ожидает",
    releasedOfTotal: "Выплачено",
    agreementIdCol: "ID",
    completionDateCol: "Дата",
    viewDetails: "Подробнее",
    contractTerms: "Условия",
    contractTermsPlaceholder:
      "Можно менять в любой момент. При открытии кабинета подставляются последние сохранённые условия.",
    billing: "Оплата",
    billingTitle: "Тариф и оплата",
    currentPlan: "Текущий тариф",
    planFree: "Бесплатный",
    planPro: "Про",
    statusActiveTrial: "Пробный период",
    statusActive: "Активен",
    agreementsUsedLabel: "Соглашений использовано",
    unlimitedAgreements: "Безлимитные соглашения",
    usageTitle: "Использование",
    freeAgreementsProgress: "{used} / {limit} бесплатных соглашений",
    limitReached: "Лимит исчерпан",
    upgradeToPro: "Перейти на тариф Про",
    upgradePerMonth: "/ месяц",
    upgradeSubtitle: "Безлимитные соглашения + полный доступ",
    upgradeNowMock: "Улучшить (мок)",
    freePlanBanner: "Бесплатный: {used}/{limit} соглашений",
    upgrade: "Улучшить",
    freeLimitTitle: "Лимит бесплатного тарифа исчерпан",
    freeLimitMessage: "Перейдите на тариф Про для безлимитных соглашений",
    freeLimitUpgrade: "Улучшить (мок)",
    mockTesting: "Тестовые переключатели",
    mockSwitchToFree: "Вернуть бесплатный (мок)"
  }
};

const fill = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);

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

const formatAgreementNumber = (id: string, createdAt: string) =>
  `AG-${new Date(createdAt).getFullYear()}-${id.slice(0, 8).toUpperCase()}`;

const formatAmount = (value: number) => formatAMD(value, { maxFractionDigits: 2 });

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
  const [historySearch, setHistorySearch] = useState("");
  const [successAgreementId, setSuccessAgreementId] = useState("");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mockPlan, setMockPlan] = useState<MockPlanId>("free");
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [totalPriceInput, setTotalPriceInput] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("single");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  /** Latest saved agreement body text for this provider — mirrors DB + updates on each successful create. */
  const [globalTermsTemplate, setGlobalTermsTemplate] = useState("");
  const lastPaymentStatusByIdRef = useRef<Record<string, Agreement["payment_status"]>>({});
  /** One-time hydrate of contract terms from the latest agreement (or static boilerplate). */
  const termsHydratedRef = useRef(false);
  /** Protects against overwriting user-typed terms mid-session. */
  const termsDirtyRef = useRef(false);

  useEffect(() => {
    setMockPlan(readMockPlan());
  }, []);

  const tx: Tx = t[lang] ?? t.en;
  const isPro = mockPlan === "pro";
  const agreementsUsed = agreements.length;
  const isAtFreeLimit = !isPro && agreementsUsed >= FREE_AGREEMENT_LIMIT;
  const freeUsagePct = Math.min(100, (agreementsUsed / FREE_AGREEMENT_LIMIT) * 100);

  const upgradeToProMock = () => {
    writeMockPlan("pro");
    setMockPlan("pro");
    setLimitModalOpen(false);
    setToast(tx.upgradeNowMock);
  };

  const resetToFreeMock = () => {
    writeMockPlan("free");
    setMockPlan("free");
  };

  const tryOpenCreate = () => {
    if (isAtFreeLimit) {
      setLimitModalOpen(true);
      return;
    }
    setView("create");
  };

  const openBilling = () => setView("billing");

  const pageTitle =
    view === "archive"
      ? tx.archivedTitle
      : view === "billing"
        ? tx.billingTitle
        : view === "create"
          ? tx.createSafeAgreement
          : tx.agreementsTitle;

  const navItems = [
    { id: "overview" as const, label: tx.overview, icon: LayoutDashboard },
    { id: "create" as const, label: tx.createNewAgreement, icon: FilePlus2, createAction: true },
    { id: "archive" as const, label: tx.archive, icon: Archive },
    { id: "billing" as const, label: tx.billing, icon: CreditCard }
  ];

  const handleNav = (id: View, createAction?: boolean) => {
    if (createAction) {
      tryOpenCreate();
      return;
    }
    setView(id);
  };
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
    // Preserve explicit completion from DB as strongest signal.
    if (agreement.status === "completed") return "completed";
    if (agreement.payment_status === "released") return "paid";
    if (agreement.payment_status === "escrow_held") return "funds_secured";
    if (agreement.payment_type === "milestones") {
      const milestones = agreement.milestones ?? [];
      const releasedCount = milestones.filter((m) => m.status === "released").length;
      if (milestones.length > 0 && releasedCount === milestones.length) return "completed";
      if (releasedCount > 0) return "in_progress";
    }
    if (agreement.status === "signed") return "signed";
    return "pending";
  };

  const isHistoryAgreement = (agreement: Agreement) => {
    // "History" should include signed (funds secured) and completed (paid out) agreements.
    if (agreement.status === "signed" || agreement.status === "completed") return true;
    if (agreement.payment_status === "escrow_held" || agreement.payment_status === "released") return true;
    if (agreement.payment_type !== "milestones") return false;
    const milestones = agreement.milestones ?? [];
    const releasedCount = milestones.filter((m) => m.status === "released").length;
    const escrowCount = milestones.filter((m) => m.status === "escrow_held").length;
    return milestones.length > 0 && (releasedCount > 0 || escrowCount > 0);
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

  const resetForm = (nextContractTerms?: string) => {
    setClientName("");
    setProjectTitle("");
    setServiceArea("");
    setContractTerms(nextContractTerms ?? "");
    setTotalPriceInput("");
    setPaymentType("single");
    setMilestones([]);
    setError("");
  };

  const resolveProviderDisplayName = useCallback(async (): Promise<string> => {
    if (!supabase || !user) return "Service Provider";
    await supabase.auth.refreshSession();
    const { data: authData } = await supabase.auth.getUser();
    const userMetadata = (authData.user?.user_metadata ?? {}) as Record<string, unknown>;
    let full_name = String(userMetadata.full_name ?? userMetadata.fullName ?? "").trim();
    let business_name = String(userMetadata.business_name ?? userMetadata.businessName ?? "").trim();
    if (!full_name && !business_name) {
      const legacy = String(userMetadata.full_name_or_business_name ?? "").trim();
      if (legacy) {
        const m = legacy.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (m) {
          business_name = m[1].trim();
          full_name = m[2].trim();
        } else {
          full_name = legacy;
        }
      }
    }
    return business_name || full_name || user.email?.split("@")[0] || "Service Provider";
  }, [supabase, user]);

  const buildDefaultTerms = useCallback((input: {
    providerName: string;
    clientName: string;
    serviceArea: string;
    totalPrice: number;
  }) => {
    const saved = globalTermsTemplate.trim();
    if (saved.length > 0) return saved;

    const clientDisplay = input.clientName.trim() || "Client";
    return [
      "SERVICE AGREEMENT",
      "",
      `This Agreement is made between ${input.providerName || "Service Provider"} (\"Provider\") and ${clientDisplay} (\"Client\").`,
      `Service Area: ${input.serviceArea}.`,
      `Total Price: ${formatAmount(input.totalPrice)}.`,
      "",
      "Provider agrees to deliver services professionally and within the agreed scope and timeline.",
      "Client agrees to cooperate, provide access where required, and review delivered work in good faith.",
      "",
      "Funds will be released only upon client approval."
    ].join("\n");
  }, [globalTermsTemplate]);

  useEffect(() => {
    if (termsHydratedRef.current || loadingAgreements) return;

    // 1) Prefer the user's saved default template from auth metadata.
    // This is persisted per-user and survives across devices/sessions.
    void (async () => {
      if (!supabase || !user?.id) return;
      const { data } = await supabase.auth.getUser();
      const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      const saved = String(meta.default_agreement_terms ?? "").trim();
      if (saved.length > 0) {
        setGlobalTermsTemplate(saved);
        if (!termsDirtyRef.current) setContractTerms(saved);
        termsHydratedRef.current = true;
      }
    })();

    if (termsHydratedRef.current) return;

    if (agreements.length > 0) {
      const latest = agreements[0];
      const t = (latest.custom_terms ?? "").trim();
      if (t.length > 0) {
        termsHydratedRef.current = true;
        setGlobalTermsTemplate(t);
        if (!termsDirtyRef.current) setContractTerms(t);
        return;
      }
      termsHydratedRef.current = true;
      void (async () => {
        const pn = await resolveProviderDisplayName();
        if (termsDirtyRef.current) return;
        setContractTerms(
          buildDefaultTerms({
            providerName: pn,
            clientName: "",
            serviceArea: "Armenia",
            totalPrice: 0
          })
        );
      })();
      return;
    }

    termsHydratedRef.current = true;
    void (async () => {
      const pn = await resolveProviderDisplayName();
      if (termsDirtyRef.current) return;
      setContractTerms(
        buildDefaultTerms({
          providerName: pn,
          clientName: "",
          serviceArea: "Armenia",
          totalPrice: 0
        })
      );
    })();
  }, [loadingAgreements, agreements, buildDefaultTerms, resolveProviderDisplayName]);

  useEffect(() => {
    // When the user navigates into the Create view, prefill the textarea from
    // the saved default template (or fallback boilerplate) if it's currently empty.
    if (view !== "create") return;
    if (contractTerms.trim().length > 0) return;
    if (globalTermsTemplate.trim().length > 0) {
      setContractTerms(globalTermsTemplate);
      return;
    }
    void (async () => {
      const pn = await resolveProviderDisplayName();
      setContractTerms(
        buildDefaultTerms({
          providerName: pn,
          clientName: "",
          serviceArea: "Armenia",
          totalPrice: 0
        })
      );
    })();
  }, [view, contractTerms, globalTermsTemplate, buildDefaultTerms, resolveProviderDisplayName]);

  const submitAgreement = async () => {
    if (!user?.id || !supabase) {
      setError("You must be logged in to create an agreement.");
      return;
    }
    setError("");

    if (isAtFreeLimit) {
      setLimitModalOpen(true);
      return;
    }

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
    await supabase.auth.refreshSession();
    const { data: authData } = await supabase.auth.getUser();
    const userMetadata = (authData.user?.user_metadata ?? {}) as Record<string, unknown>;

    let full_name = String(userMetadata.full_name ?? userMetadata.fullName ?? "").trim();
    let business_name = String(userMetadata.business_name ?? userMetadata.businessName ?? "").trim();
    if (!full_name && !business_name) {
      const legacy = String(userMetadata.full_name_or_business_name ?? "").trim();
      if (legacy) {
        const m = legacy.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (m) {
          business_name = m[1].trim();
          full_name = m[2].trim();
        } else {
          full_name = legacy;
        }
      }
    }

    const providerName = await resolveProviderDisplayName();
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
      full_name,
      business_name,
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

    setGlobalTermsTemplate(customTermsText);
    // Persist the latest agreement terms as the user's default template.
    // This keeps the Create form prefilled on the next offer for this user.
    void supabase.auth.updateUser({ data: { default_agreement_terms: customTermsText } });
    setSuccessAgreementId(result.id);
    setToast(tx.toastCreated);
    resetForm(customTermsText);
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

  const archived = agreements.filter(isHistoryAgreement);
  const listed = agreements;
  const showClientSearch = listed.length > 15;
  const filteredListed = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return listed;
    return listed.filter((item) => item.client_name.toLowerCase().includes(query));
  }, [listed, clientSearch]);
  const filteredArchived = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return archived;
    return archived.filter((item) => {
      const derived = getDerivedStatus(item);
      const haystack = [
        item.client_name,
        item.project_title,
        item.service_area,
        formatAgreementNumber(item.id, item.created_at),
        item.id,
        statusText[derived]
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [archived, historySearch, statusText]);

  if (loading || !user) return <div className="min-h-screen bg-[#F9FAFB] p-6">Loading dashboard...</div>;

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] text-slate-900">
      <div className="flex h-full">
        <aside className="hidden h-screen w-72 min-w-[18rem] shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
          <h1 className="text-2xl font-black">{tx.dashboardTitle}</h1>
          <p className="mt-2 text-sm text-blue-100">{tx.dashboardSubtitle}</p>
          <nav className="mt-8 space-y-2">
            {navItems.map(({ id, label, icon: Icon, createAction }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id, createAction)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                  view === id ? "bg-white text-[#0033A0]" : "text-blue-100 hover:bg-blue-700/40"
                } ${createAction && isAtFreeLimit ? "opacity-70" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
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

        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {!isPro ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  {fill(tx.freePlanBanner, { used: agreementsUsed, limit: FREE_AGREEMENT_LIMIT })}
                </p>
                <button
                  type="button"
                  onClick={openBilling}
                  className="inline-flex shrink-0 items-center rounded-lg border border-[#0033A0] bg-[#0033A0] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#002a7a]"
                >
                  {tx.upgrade}
                </button>
              </div>
            ) : null}

            <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-2xl font-black text-[#0033A0]">{pageTitle}</h2>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLangMenuOpen((prev) => !prev)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
                      aria-label="Open language switcher"
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                    {langMenuOpen ? (
                      <div className="absolute left-0 top-10 z-20 min-w-[94px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        {(["en", "hy", "ru"] as const).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              setLang(code);
                              setLangMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase ${
                              lang === code ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {view !== "billing" ? (
                  <button
                    type="button"
                    onClick={tryOpenCreate}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900 ${
                      isAtFreeLimit ? "opacity-50" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    {tx.createNewAgreement}
                  </button>
                ) : null}
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 lg:hidden">
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="min-w-0 truncate text-xs text-slate-600">{tx.signedInAs}: {user.email}</p>
                  <button
                    type="button"
                    onClick={() => void signOut().then(() => router.replace("/login?next=%2Fdashboard"))}
                    className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {tx.logout}
                  </button>
                </div>
              </div>
            </header>

            {view === "overview" ? (
              <>
                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.totalAgreementValue}</p>
                    <p className="mt-2 text-3xl font-black">{formatAmount(stats.totalValue)}</p>
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
                    <div>
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
                      <div className="space-y-3 md:hidden">
                        {filteredListed.map((item) => {
                          const progress = getReleaseProgress(item);
                          const derived = getDerivedStatus(item);
                          const showSignedIndicator = item.status === "signed" && derived !== "paid" && derived !== "completed";
                          const paid = item.payment_status === "released" || derived === "paid";
                          const escrow = item.payment_status === "escrow_held" || getEscrowHeldMilestoneAmount(item) > 0;
                          const signedMark = item.status === "signed" || item.status === "completed";
                          return (
                            <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.clientName}</p>
                                    <p className="break-words text-sm font-bold text-slate-900">{item.client_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.price}</p>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{formatAmount(Number(item.total_price))}</p>
                                  </div>
                                </div>
                                <div>
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>{statusText[derived]}</span>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="mb-1 break-words text-xs font-semibold text-slate-600">{formatAmount(progress.released)} / {formatAmount(Number(item.total_price || 0))} {tx.releasedOfTotal}</p>
                                <p className="mb-1 break-words text-[11px] font-semibold text-slate-500">{tx.vault}: {formatAmount(progress.escrow)} | {tx.waiting}: {formatAmount(progress.pending)}</p>
                                <div className="h-2 w-full rounded-full bg-slate-200">
                                  <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${progress.pct}%` }} />
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                {paid ? <span title={tx.paid}>✅</span> : (<>{signedMark ? <span title={tx.signed}>✍️</span> : null}{escrow ? <span title={tx.fundsSecured}>🔒</span> : null}</>)}
                              </div>
                              {showSignedIndicator ? <p className="mt-1 text-xs font-semibold text-slate-500">{tx.signatureSigned}</p> : null}
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                                <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                                <button type="button" onClick={() => downloadAgreementPdf(item)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
                              </div>
                            </article>
                          );
                        })}
                        {filteredListed.length === 0 ? <p className="py-4 text-center text-sm text-slate-500">{tx.noSearchResults}</p> : null}
                      </div>
                      <div className="hidden overflow-x-auto md:block">
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
                                <td className="px-3 py-3">{formatAmount(Number(item.total_price))}</td>
                                <td className="px-3 py-3">
                                  {(() => {
                                    const progress = getReleaseProgress(item);
                                    return (
                                      <div className="min-w-0 w-full max-w-[11.875rem]">
                                        <p className="mb-1 text-xs font-semibold text-slate-600">
                                          {formatAmount(progress.released)} / {formatAmount(Number(item.total_price || 0))} {tx.releasedOfTotal}
                                        </p>
                                        <p className="mb-1 text-[11px] font-semibold text-slate-500">
                                          {tx.vault}: {formatAmount(progress.escrow)} | {tx.waiting}: {formatAmount(progress.pending)}
                                        </p>
                                        <div className="h-2 w-full rounded-full bg-slate-200">
                                          <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${progress.pct}%` }} />
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
                                    const escrow = item.payment_status === "escrow_held" || getEscrowHeldMilestoneAmount(item) > 0;
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
                                        {showSignedIndicator ? <p className="text-xs font-semibold text-slate-500">{tx.signatureSigned}</p> : null}
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => downloadAgreementPdf(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredListed.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">{tx.noSearchResults}</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {view === "create" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold">{tx.createSafeAgreement}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {tx.clientName}
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      autoComplete="off"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">{tx.projectTitle}<input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">Service Area<input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">{tx.totalPrice}<input value={totalPriceInput} onChange={(e) => setTotalPriceInput(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="contract-terms-create">
                      {tx.contractTerms}
                    </label>
                    <textarea
                      id="contract-terms-create"
                      value={contractTerms}
                      onChange={(e) => {
                        termsDirtyRef.current = true;
                        setContractTerms(e.target.value);
                      }}
                      rows={7}
                      placeholder={tx.contractTermsPlaceholder}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
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
                      <p className={`text-xs font-semibold ${milestonesValid ? "text-slate-600" : "text-red-600"}`}>{tx.milestones}: {formatAmount(milestonesTotal)} / {tx.totalPrice}: {formatAmount(totalPrice || 0)}</p>
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
                <h3 className="text-lg font-extrabold">{tx.agreementHistory}</h3>
                {archived.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#0033A0]">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">{tx.noHistory}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="mb-3">
                      <input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder={tx.searchClientPlaceholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-sm"
                        aria-label={tx.searchClientPlaceholder}
                      />
                    </div>
                    <div className="space-y-3 md:hidden">
                      {filteredArchived.map((item) => {
                        const derived = getDerivedStatus(item);
                        const paid = item.payment_status === "released" || derived === "paid";
                        const escrow = item.payment_status === "escrow_held" || getEscrowHeldMilestoneAmount(item) > 0;
                        const signedMark = item.status === "signed" || item.status === "completed";
                        return (
                          <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="space-y-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.clientName}</p>
                                <p className="break-words text-sm font-bold text-slate-900">{item.client_name}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.agreementIdCol}</p>
                                <p className="font-mono text-xs font-semibold tracking-wide text-slate-700">
                                  {formatAgreementNumber(item.id, item.created_at)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.completionDateCol}</p>
                                  <p className="text-sm text-slate-700">{new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.price}</p>
                                  <p className="font-mono text-sm font-semibold text-slate-800">{formatAmount(Number(item.total_price))}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                {paid ? <span title={tx.paid}>✅</span> : (<>{signedMark ? <span title={tx.signed}>✍️</span> : null}{escrow ? <span title={tx.fundsSecured}>🔒</span> : null}</>)}
                              </div>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>{statusText[derived]}</span>
                            </div>
                          </article>
                        );
                      })}
                      {filteredArchived.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">{tx.noSearchResults}</p>
                      ) : null}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2">{tx.agreementIdCol}</th>
                            <th className="px-3 py-2">{tx.clientName}</th>
                            <th className="px-3 py-2">{tx.completionDateCol}</th>
                            <th className="px-3 py-2">{tx.price}</th>
                            <th className="px-3 py-2">{tx.status}</th>
                            <th className="px-3 py-2">
                              <span className="sr-only">{tx.viewDetails}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredArchived.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-mono text-xs font-semibold tracking-wide text-slate-700">
                                {formatAgreementNumber(item.id, item.created_at)}
                              </td>
                              <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                              <td className="px-3 py-3 text-slate-700">{new Date(item.created_at).toLocaleDateString()}</td>
                              <td className="px-3 py-3 font-mono font-semibold">{formatAmount(Number(item.total_price))}</td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const derived = getDerivedStatus(item);
                                  const paid = item.payment_status === "released" || derived === "paid";
                                  const escrow = item.payment_status === "escrow_held" || getEscrowHeldMilestoneAmount(item) > 0;
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
                                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>{statusText[derived]}</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => openAgreementLink(item.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {tx.viewDetails}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredArchived.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                                {tx.noSearchResults}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {view === "billing" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.currentPlan}</p>
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-black text-[#0033A0]">{isPro ? tx.planPro : tx.planFree}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {isPro ? tx.statusActive : tx.statusActiveTrial}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                      {isPro ? (
                        <p className="font-semibold text-slate-800">{tx.unlimitedAgreements}</p>
                      ) : (
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">{tx.agreementsUsedLabel}:</span>{" "}
                          {agreementsUsed} / {FREE_AGREEMENT_LIMIT}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {!isPro ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-900">{tx.usageTitle}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {fill(tx.freeAgreementsProgress, { used: agreementsUsed, limit: FREE_AGREEMENT_LIMIT })}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${isAtFreeLimit ? "bg-amber-500" : "bg-[#0033A0]"}`}
                        style={{ width: `${freeUsagePct}%` }}
                      />
                    </div>
                    {isAtFreeLimit ? (
                      <p className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        {tx.limitReached}
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {!isPro ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-extrabold text-slate-900">{tx.upgradeToPro}</h3>
                    <div className="mt-3 inline-flex w-full max-w-sm items-center justify-center rounded-2xl border border-amber-700/30 bg-[#F2A800] px-5 py-4 shadow-sm ring-1 ring-amber-900/15 sm:justify-start">
                      <p className="whitespace-nowrap text-2xl font-black tabular-nums text-slate-900">
                        {formatProMonthly(tx.upgradePerMonth, lang)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{tx.upgradeSubtitle}</p>
                    <button
                      type="button"
                      onClick={upgradeToProMock}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#F2A800] px-4 py-2.5 text-sm font-bold text-slate-900 sm:w-auto"
                    >
                      {tx.upgradeNowMock}
                    </button>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm lg:col-span-2">
                  <p className="font-semibold text-slate-700">{tx.mockTesting}</p>
                  <p className="mt-1 text-slate-500">UI preview only — no payment processed.</p>
                  {isPro ? (
                    <button
                      type="button"
                      onClick={resetToFreeMock}
                      className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {tx.mockSwitchToFree}
                    </button>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map(({ id, label, icon: Icon, createAction }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id, createAction)}
              className={`inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-[10px] font-semibold leading-tight ${
                view === id ? "border-[#0033A0] bg-[#0033A0] text-white" : "border-slate-300 bg-white text-slate-700"
              } ${createAction && isAtFreeLimit ? "opacity-70" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {limitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-xl font-extrabold text-slate-900">{tx.freeLimitTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{tx.freeLimitMessage}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={upgradeToProMock}
                className="inline-flex items-center justify-center rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900"
              >
                {tx.freeLimitUpgrade}
              </button>
              <button
                type="button"
                onClick={() => setLimitModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {tx.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
