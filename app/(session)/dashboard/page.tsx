"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FilePlus2,
  Globe,
  LayoutDashboard,
  Loader2,
  Plus,
  Settings,
  Share2,
  Trash2,
  ImageIcon,
  User,
  Pencil,
  Phone,
  Briefcase,
  MapPin,
  CircleDollarSign
} from "lucide-react";
import { AgreementShareDialog } from "@/components/agreement-share-dialog";
import { AgreementDocumentView } from "@/components/agreement-document-view";
import { FormField } from "@/components/form-field";
import {
  AgreementStatusPill,
  getDerivedAgreementStatus,
  type DerivedAgreementStatus
} from "@/components/agreement-status-pill";
import {
  formatAMD,
  formatGroupedNumberInput,
  formatProMonthly,
  parseGroupedNumberInput
} from "@/lib/currency";
import { FREE_AGREEMENT_LIMIT, readMockPlan, writeMockPlan, type MockPlanId } from "@/lib/subscription/mock";
import { authDisplayName, useAuth, type AuthUser } from "@/lib/auth/auth-context";
import { mockGetSession } from "@/lib/auth/mock-storage";
import { isSigningOut, redirectToLogin } from "@/lib/auth/constants";
import { readHasAgreementsHint, writeHasAgreementsHint, readStoredContractTerms, writeStoredContractTerms } from "@/lib/auth/storage-keys";
import { ROUTES } from "@/lib/routes";
import { ensureSupabaseBrowser, getSupabaseBrowser, getSupabaseReachable } from "@/lib/supabase/browser-client";
import { normalizeAgreementRow } from "@/lib/agreements/row";
import { fetchDashboardAgreementsViaApi, mergeAgreementsById, publishLocalAgreementToCloud, updatePendingAgreementViaApi } from "@/lib/agreements/create-via-api";
import { getAgreementPublicUrl, isShareableAgreementId } from "@/lib/agreements/public-url";
import { createShareableAgreement, ensureSupabaseAccessToken } from "@/lib/agreements/shareable-create";
import type { VatMode } from "@/lib/agreements/vat";
import { isAgreementEditable, pickAdvancedStatus, statusRank } from "@/lib/agreements/status-rank";
import { writeAgreementCache } from "@/lib/agreements/signed-cache";
import {
  getLocalAgreement,
  isLocalAgreementId,
  listLocalAgreementsForDashboard,
  replaceLocalAgreementId,
  saveLocalAgreement,
  updateLocalAgreement
} from "@/lib/agreements/local-store";
import { formatDateDMY, latestIsoDate } from "@/lib/format-date";
import {
  readLogoDataUrl,
  readStoredProviderLogo,
  readStoredProviderLogoTimestamp,
  resolveAgreementProviderLogo,
  resolveEffectiveProviderLogo,
  resolveProviderLogoForUser,
  resolveStoredProviderLogo,
  syncProviderLogoToAccount,
  clearProviderLogoFromAccount,
  withProviderLogoCacheBust,
  writeStoredProviderLogo,
  clearStoredProviderLogo
} from "@/lib/agreements/logo-image";
import { uploadProviderLogoToStorage, deleteProviderLogosFromStorage } from "@/lib/supabase/logo-storage";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type Lang = Language;
type View = "overview" | "create" | "archive" | "billing";
type AgreementStatus = "pending" | "signed" | "completed";
type PaymentType = "single" | "milestones";
type Milestone = {
  title: string;
  amount: number;
  status?: "pending" | "escrow_held" | "released";
  target_date?: string;
};
type MilestoneDraft = {
  id: string;
  title: string;
  amount: string;
  targetDay: string;
  targetMonth: string;
  targetYear: string;
};

type Agreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  full_name?: string;
  business_name?: string;
  client_name: string;
  provider_phone?: string;
  client_phone?: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  scope_of_work?: string;
  scope_exclusions?: string;
  estimated_completion_date?: string;
  deadline?: string;
  total_price: number;
  vat_mode?: VatMode;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  client_signature?: string;
  provider_logo_url?: string;
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
  awaitingSignature: string;
  signedAgreements: string;
  latestDeals: string;
  loading: string;
  emptyTitle: string;
  emptySubtitle: string;
  clientName: string;
  clientPhone: string;
  vatModeIncludes: string;
  vatModeExempt: string;
  completeClientPhone: string;
  projectTitle: string;
  serviceArea: string;
  price: string;
  status: string;
  copyLink: string;
  share: string;
  shareTitle: string;
  shareHint: string;
  shareVia: string;
  shareWhatsApp: string;
  shareTelegram: string;
  shareViber: string;
  shareMessage: string;
  viewLink: string;
  download: string;
  searchClientPlaceholder: string;
  noSearchResults: string;
  linkNotPublished: string;
  linkLocalWarning: string;
  cloudSaveFailed: string;
  signInRequiredForSharing: string;
  copied: string;
  createSafeAgreement: string;
  totalPrice: string;
  milestones: string;
  milestonesHint: string;
  singlePayment: string;
  addMilestone: string;
  milestoneTitle: string;
  milestoneAmount: string;
  milestoneTargetDate: string;
  estimatedCompletionAuto: string;
  milestonesMismatch: string;
  create: string;
  creating: string;
  edit: string;
  editAgreement: string;
  saveChanges: string;
  saving: string;
  cancelEdit: string;
  toastUpdated: string;
  editLocked: string;
  completeRequired: string;
  completeMilestones: string;
  agreementHistory: string;
  noHistory: string;
  successTitle: string;
  successSubtitle: string;
  publicLink: string;
  copyToClipboard: string;
  preview: string;
  previewAgreement: string;
  openFullPage: string;
  close: string;
  toastCreated: string;
  pending: string;
  signed: string;
  completed: string;
  inProgress: string;
  paid: string;
  fundsSecured: string;
  verificationPending: string;
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
  scopeOfWork: string;
  scopeOfWorkPlaceholder: string;
  scopeExclusions: string;
  scopeExclusionsPlaceholder: string;
  estimatedCompletionDate: string;
  offerDeadline: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  completeScopeOfWork: string;
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
  providerLogo: string;
  providerLogoHint: string;
  removeLogo: string;
  logoProcessing: string;
  uploadLogo: string;
  changeLogo: string;
  settings: string;
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
    totalAgreementValue: "Total Contract Value",
    awaitingSignature: "Awaiting Signature",
    signedAgreements: "Signed Agreements",
    latestDeals: "Latest deals",
    loading: "Loading agreements...",
    emptyTitle: "Create your first deal to get started",
    emptySubtitle: "You can create a safe agreement and instantly share it with your client.",
    clientName: "Client Name",
    clientPhone: "Client Phone",
    vatModeIncludes: "Includes 20% VAT",
    vatModeExempt: "VAT Exempt",
    completeClientPhone: "Please enter the client's phone number.",
    projectTitle: "Project Title",
    serviceArea: "Service Area",
    price: "Amount",
    status: "Status",
    copyLink: "Copy Link",
    share: "Share",
    shareTitle: "Share agreement link",
    shareHint: "Copy the link to paste anywhere, or tap a chat app to send it directly.",
    shareVia: "Send via chat app",
    shareWhatsApp: "WhatsApp",
    shareTelegram: "Telegram",
    shareViber: "Viber",
    shareMessage: "Please review and sign our agreement:",
    viewLink: "View Link",
    download: "Download",
    searchClientPlaceholder: "Search by client name...",
    noSearchResults: "No agreements match your search.",
    linkNotPublished: "Could not save this agreement online. Shared links will not work until it is saved.",
    linkLocalWarning:
      "This link only works on this browser until your online database is connected. WhatsApp clients need a cloud-saved link.",
    cloudSaveFailed: "Could not save agreement to the cloud. Please try again.",
    signInRequiredForSharing:
      "Could not save online. Sign out, sign in again, then copy the link.",
    copied: "Copied!",
    createSafeAgreement: "Create Safe Agreement",
    totalPrice: "Total Price (֏)",
    milestones: "Milestones",
    milestonesHint: "Split payment into milestone amounts.",
    singlePayment: "Single payment selected.",
    addMilestone: "Add milestone",
    milestoneTitle: "Milestone title",
    milestoneAmount: "Amount (֏)",
    milestoneTargetDate: "Target date (optional)",
    estimatedCompletionAuto: "Auto-set from the latest milestone date",
    milestonesMismatch: "Milestones total must match total price.",
    create: "Create",
    creating: "Creating...",
    edit: "Edit",
    editAgreement: "Edit Agreement",
    saveChanges: "Save changes",
    saving: "Saving...",
    cancelEdit: "Cancel",
    toastUpdated: "Agreement updated",
    editLocked: "Signed agreements cannot be edited.",
    completeRequired: "Please complete all required fields.",
    completeMilestones: "Please fill all milestone titles and amounts.",
    agreementHistory: "Agreement History",
    noHistory: "Signed agreements will appear here.",
    successTitle: "Agreement Created Successfully!",
    successSubtitle: "Copy the link or send it directly via WhatsApp, Telegram, or Viber.",
    publicLink: "Public Link",
    copyToClipboard: "Copy to Clipboard",
    preview: "Preview",
    previewAgreement: "Preview agreement",
    openFullPage: "Open full page",
    close: "Close",
    toastCreated: "Agreement created successfully.",
    pending: "Pending",
    signed: "Signed",
    completed: "Completed",
    inProgress: "In Progress",
    paid: "Paid",
    fundsSecured: "Funds Secured",
    verificationPending: "Verification pending",
    paymentReleasedBanner: "🎉 Payment released by client.",
    releaseProgress: "Release Progress",
    vault: "Vault",
    waiting: "Waiting",
    releasedOfTotal: "Released",
    agreementIdCol: "ID",
    completionDateCol: "Date",
    viewDetails: "View Details",
    contractTerms: "Contract Terms",
    contractTermsPlaceholder:
      "Copy and paste your work agreement here. You can edit and format it anytime before sending.",
    scopeOfWork: "Scope of Work (Included)",
    scopeOfWorkPlaceholder: "List exact deliverables (e.g., demolition, wiring, finishing, cleanup).",
    scopeExclusions: "What is NOT Included (Optional)",
    scopeExclusionsPlaceholder: "e.g., material purchases, extra coats, furniture moving",
    estimatedCompletionDate: "Estimated Completion Date (optional)",
    offerDeadline: "Offer deadline (optional)",
    dateDay: "Day",
    dateMonth: "Month",
    dateYear: "Year",
    completeScopeOfWork: "Please describe the scope of work.",
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
    mockSwitchToFree: "Switch to Free (mock)",
    providerLogo: "Business logo (optional)",
    providerLogoHint: "PNG or JPEG — shown at the top of the agreement.",
    removeLogo: "Remove",
    logoProcessing: "Processing…",
    uploadLogo: "Upload logo",
    changeLogo: "Change logo",
    settings: "Settings"
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
    totalAgreementValue: "Ընդհանուր պայմանագրային արժեք",
    awaitingSignature: "Սպասում է ստորագրության",
    signedAgreements: "Ստորագրված պայմանագրեր",
    latestDeals: "Վերջին գործարքներ",
    loading: "Բեռնում…",
    emptyTitle: "Սկսեք առաջին գործարքով",
    emptySubtitle: "Ապահով պայմանագիր՝ ուղարկեք հղումը հաճախորդին։",
    clientName: "Հաճախորդի անուն",
    clientPhone: "Հաճախորդի հեռախոս",
    vatModeIncludes: "Ներառում է 20% ԱԱՀ",
    vatModeExempt: "ԱԱՀ-ից ազատ",
    completeClientPhone: "Մուտքագրեք հաճախորդի հեռախոսահամարը։",
    projectTitle: "Նախագծի վերնագիր",
    serviceArea: "Տարածք",
    price: "Գումար",
    status: "Կարգավիճակ",
    copyLink: "Պատճենել հղումը",
    share: "Ուղարկել",
    shareTitle: "Ուղարկել պայմանագրի հղումը",
    shareHint: "Պատճենեք հղումը կամ ուղարկեք WhatsApp, Telegram կամ Viber-ով։",
    shareVia: "Ուղարկել չաթով",
    shareWhatsApp: "WhatsApp",
    shareTelegram: "Telegram",
    shareViber: "Viber",
    shareMessage: "Խնդրում եմ դիտել և ստորագրել պայմանագիրը՝",
    viewLink: "Բացել հղումը",
    download: "Ներբեռնել",
    searchClientPlaceholder: "Փնտրել ըստ հաճախորդի անվան…",
    noSearchResults: "Որոնմամբ պայմանագիր չի գտնվել։",
    linkNotPublished: "Չհաջողվեց առցանց պահել։ Հղումը կաշխատի միայն պահպանվելուց հետո։",
    linkLocalWarning:
      "Այս հղումը աշխատում է միայն այս browser-ում, մինչև օնլայն բազան միացված չլինի։ WhatsApp-ի հաճախորդներին պետք է ամպային հղում։",
    cloudSaveFailed: "Չհաջողվեց պահպանել ամպում։ Փորձեք կրկին։",
    signInRequiredForSharing:
      "Չհաջողվեց առցանց պահել։ Դուրս գալ, նորից մուտք գործել, ապա պատճենել հղումը։",
    copied: "Պատճենված է!",
    createSafeAgreement: "Ստեղծել անվտանգ պայմանագիր",
    totalPrice: "Ընդհանուր գին (֏)",
    milestones: "Փուլեր",
    milestonesHint: "Բաժանեք վճարը փուլերի։",
    singlePayment: "Մեկ վճարում",
    addMilestone: "Ավելացնել փուլ",
    milestoneTitle: "Փուլի անվանում",
    milestoneAmount: "Գումար (֏)",
    milestoneTargetDate: "Նպատակային ամսաթիվ (ըստ ցանկության)",
    estimatedCompletionAuto: "Ավտոմատ՝ վերջին փուլի ամսաթվից",
    milestonesMismatch: "Փուլերի գումարը պետք է հավասար լինի ընդհանուրին։",
    create: "Ստեղծել",
    creating: "Ստեղծվում է…",
    edit: "Խմբագրել",
    editAgreement: "Խմբագրել պայմանագիրը",
    saveChanges: "Պահպանել",
    saving: "Պահպանվում է…",
    cancelEdit: "Չեղարկել",
    toastUpdated: "Պայմանագիրը թարմացված է",
    editLocked: "Ստորագրված պայմանագրերը չեն խմբագրվում։",
    completeRequired: "Լրացրեք բոլոր պարտադիր դաշտերը։",
    completeMilestones: "Լրացրեք փուլերի անուններն ու գումարները։",
    agreementHistory: "Պայմանագրերի պատմություն",
    noHistory: "Ստորագրված պայմանագրերը կհայտնվեն այստեղ։",
    successTitle: "Պայմանագիրը պատրաստ է",
    successSubtitle: "Պատճենեք հղումը կամ ուղարկեք WhatsApp, Telegram կամ Viber-ով։",
    publicLink: "Հանրային հղում",
    copyToClipboard: "Պատճենել",
    preview: "Նախադիտում",
    previewAgreement: "Նախադիտել պայմանագիրը",
    openFullPage: "Բացել ամբողջ էջը",
    close: "Փակել",
    toastCreated: "Պայմանագիրը ստեղծված է։",
    pending: "Սպասում",
    signed: "Ստորագրված",
    completed: "Ավարտված",
    inProgress: "Ընթացքում",
    paid: "Վճարված",
    fundsSecured: "Գումարը պահվում է",
    verificationPending: "Ստուգումը սպասման մեջ է",
    paymentReleasedBanner: "🎉 Հաճախորդը արձակեց վճարումը",
    releaseProgress: "Արձակման ընթացք",
    vault: "Պահեստ",
    waiting: "Սպասում",
    releasedOfTotal: "Արձակված",
    agreementIdCol: "ID",
    completionDateCol: "Ամսաթիվ",
    viewDetails: "Մանրամասն",
    contractTerms: "Պայմաններ",
    contractTermsPlaceholder:
      "Պատճենեք և տեղադրեք ձեր աշխատանքային պայմանագիրը այստեղ։ Կարող եք խմբագրել և ձևաչափել այն ցանկացած պահի՝ մինչև ուղարկելը։",
    scopeOfWork: "Աշխատանքի շրջանակ (ներառված)",
    scopeOfWorkPlaceholder: "Նշեք կատարվող աշխատանքները (օր.՝ քանդում, էլեկտրամոնтаж, ավարտ)...",
    scopeExclusions: "Ինչը չի ներառվում (ընտրովի)",
    scopeExclusionsPlaceholder: "օր.՝ նյութերի գնում, լրացուցիչ շերտեր",
    estimatedCompletionDate: "Ավարտի մոտավոր ամսաթիվ (ըստ ցանկության)",
    offerDeadline: "Առաջարկի վավերականության ժամկետ (ըստ ցանկության)",
    dateDay: "Օր",
    dateMonth: "Ամիս",
    dateYear: "Տարի",
    completeScopeOfWork: "Լրացրեք աշխատանքի շրջանակը։",
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
    mockSwitchToFree: "Անվճար (մոկ)",
    providerLogo: "Բիզնեսի լոգո (ընտրովի)",
    providerLogoHint: "PNG կամ JPEG — ցուցադրվում է պայմանագրի վերևում։",
    removeLogo: "Հեռացնել",
    logoProcessing: "Մշակում…",
    uploadLogo: "Բեռնել լոգո",
    changeLogo: "Փոխել լոգոն",
    settings: "Կարգավորումներ"
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
    totalAgreementValue: "Общая сумма соглашений",
    awaitingSignature: "Ожидает подписи",
    signedAgreements: "Подписанные соглашения",
    latestDeals: "Последние сделки",
    loading: "Загрузка…",
    emptyTitle: "Создайте первое соглашение",
    emptySubtitle: "Создайте защищённое соглашение и сразу отправьте клиенту ссылку.",
    clientName: "Клиент",
    clientPhone: "Телефон клиента",
    vatModeIncludes: "Включает 20% НДС",
    vatModeExempt: "Без НДС",
    completeClientPhone: "Укажите телефон клиента.",
    projectTitle: "Проект",
    serviceArea: "Регион",
    price: "Сумма",
    status: "Статус",
    copyLink: "Копировать ссылку",
    share: "Поделиться",
    shareTitle: "Поделиться ссылкой на соглашение",
    shareHint: "Скопируйте ссылку или отправьте через WhatsApp, Telegram или Viber.",
    shareVia: "Отправить в мессенджер",
    shareWhatsApp: "WhatsApp",
    shareTelegram: "Telegram",
    shareViber: "Viber",
    shareMessage: "Пожалуйста, ознакомьтесь и подпишите соглашение:",
    viewLink: "Открыть ссылку",
    download: "Скачать",
    searchClientPlaceholder: "Поиск по клиенту…",
    noSearchResults: "Ничего не найдено.",
    linkNotPublished: "Не удалось сохранить в облаке. Ссылка не будет работать, пока соглашение не сохранено.",
    linkLocalWarning:
      "Эта ссылка работает только в этом браузере, пока база не подключена. Для WhatsApp нужна облачная ссылка.",
    cloudSaveFailed: "Не удалось сохранить соглашение. Попробуйте снова.",
    signInRequiredForSharing:
      "Не удалось сохранить в облаке. Выйдите, войдите снова и скопируйте ссылку.",
    copied: "Скопировано",
    createSafeAgreement: "Создать защищённое соглашение",
    totalPrice: "Сумма по соглашению (֏)",
    milestones: "Этапы",
    milestonesHint: "Разбейте оплату по этапам.",
    singlePayment: "Выбран один платёж",
    addMilestone: "Добавить этап",
    milestoneTitle: "Название этапа",
    milestoneAmount: "Сумма (֏)",
    milestoneTargetDate: "Целевая дата (необязательно)",
    estimatedCompletionAuto: "Автоматически — по последнему этапу",
    milestonesMismatch: "Сумма этапов должна совпадать с общей суммой.",
    create: "Создать",
    creating: "Создание…",
    edit: "Изменить",
    editAgreement: "Изменить соглашение",
    saveChanges: "Сохранить",
    saving: "Сохранение…",
    cancelEdit: "Отмена",
    toastUpdated: "Соглашение обновлено",
    editLocked: "Подписанные соглашения нельзя редактировать.",
    completeRequired: "Заполните обязательные поля.",
    completeMilestones: "Укажите названия и суммы всех этапов.",
    agreementHistory: "История соглашений",
    noHistory: "Здесь появятся подписанные соглашения.",
    successTitle: "Соглашение создано",
    successSubtitle: "Скопируйте ссылку или отправьте через WhatsApp, Telegram или Viber.",
    publicLink: "Публичная ссылка",
    copyToClipboard: "Копировать",
    preview: "Предпросмотр",
    previewAgreement: "Предпросмотр соглашения",
    openFullPage: "Открыть полную страницу",
    close: "Закрыть",
    toastCreated: "Соглашение создано.",
    pending: "Ожидает",
    signed: "Подписано",
    completed: "Завершено",
    inProgress: "В работе",
    paid: "Оплачено",
    fundsSecured: "Средства удерживаются",
    verificationPending: "Ожидает проверки",
    paymentReleasedBanner: "🎉 Клиент подтвердил выплату",
    releaseProgress: "Выплаты по этапам",
    vault: "Сейф",
    waiting: "Ожидает",
    releasedOfTotal: "Выплачено",
    agreementIdCol: "ID",
    completionDateCol: "Дата",
    viewDetails: "Подробнее",
    contractTerms: "Условия",
    contractTermsPlaceholder:
      "Скопируйте и вставьте сюда свой договор. Вы можете редактировать и форматировать его в любой момент до отправки.",
    scopeOfWork: "Объём работ (включено)",
    scopeOfWorkPlaceholder: "Перечислите работы (напр., демонтаж, электрика, отделка)...",
    scopeExclusions: "Что НЕ включено (необязательно)",
    scopeExclusionsPlaceholder: "напр., закупка материалов, дополнительные слои",
    estimatedCompletionDate: "Ориентировочная дата завершения (необязательно)",
    offerDeadline: "Срок действия предложения (необязательно)",
    dateDay: "День",
    dateMonth: "Месяц",
    dateYear: "Год",
    completeScopeOfWork: "Опишите объём работ.",
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
    mockSwitchToFree: "Вернуть бесплатный (мок)",
    providerLogo: "Логотип (необязательно)",
    providerLogoHint: "PNG или JPEG — отображается в шапке договора.",
    removeLogo: "Удалить",
    logoProcessing: "Обработка…",
    uploadLogo: "Загрузить логотип",
    changeLogo: "Изменить логотип",
    settings: "Настройки"
  }
};

const fill = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);

const createMilestone = (): MilestoneDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  amount: "",
  targetDay: "",
  targetMonth: "",
  targetYear: ""
});

const formatAgreementNumber = (id: string, createdAt: string) =>
  `AG-${new Date(createdAt).getFullYear()}-${id.slice(0, 8).toUpperCase()}`;

const formatAmount = (value: number) => formatAMD(value, { maxFractionDigits: 2 });

/** Prefer the most advanced lifecycle status; prefer cloud row data when cloud is ahead. */
function mergeDashboardAgreementRow(local: Agreement | undefined, cloud: Agreement): Agreement {
  const localStatus = local?.status ?? "pending";
  const status = pickAdvancedStatus(localStatus, cloud.status);
  const cloudIsAhead = statusRank(cloud.status) >= statusRank(localStatus);
  const base = cloudIsAhead || !local ? cloud : local;
  const localScoped = local?.provider_id === cloud.provider_id ? local : undefined;
  const provider_logo_url =
    resolveStoredProviderLogo(base, cloudIsAhead ? localScoped : cloud) ||
    readStoredProviderLogo(base.provider_id) ||
    undefined;
  const merged: Agreement = {
    ...base,
    status,
    ...(provider_logo_url ? { provider_logo_url } : {})
  };

  if (local && statusRank(merged.status) > statusRank(local.status)) {
    updateLocalAgreement(merged.id, {
      status: merged.status,
      payment_status: merged.payment_status
    });
  }

  return merged;
}

function mergeDashboardAgreements(local: Agreement[], cloud: Agreement[]): Agreement[] {
  const localById = new Map(local.map((a) => [a.id, a]));
  const cloudIds = new Set(cloud.map((a) => a.id));
  const mergedCloud = cloud.map((row) => mergeDashboardAgreementRow(localById.get(row.id), row));
  const localOnly = local.filter((a) => !cloudIds.has(a.id));
  return mergeAgreementsById([mergedCloud, localOnly]);
}

/** Resolves to null when the network call fails or exceeds `ms`. */
async function withNetworkTimeout<T>(promise: Promise<T>, ms = 5_000): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), ms);
      })
    ]);
  } catch {
    return null;
  }
}

const selectFieldClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

function buildCompletionDate(year: string, month: string, day: string): string {
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitIsoDate(value?: string | null): { day: string; month: string; year: string } {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { day: "", month: "", year: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

function completionYearOptions(): number[] {
  const start = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, i) => start + i);
}

function profileDefaultsFromUser(user: AuthUser | null | undefined) {
  return {
    phone: user?.phone_number?.trim() ?? "",
    serviceArea: user?.service_area?.trim() ?? ""
  };
}

export default function DashboardPage() {
  const { user, loading, signOut, revalidateSession } = useAuth();
  const { language: lang, setLanguage: setLang } = useLanguage();
  const [supabase, setSupabase] = useState(() => getSupabaseBrowser());

  useEffect(() => {
    if (supabase) return;
    void ensureSupabaseBrowser().then((client) => {
      if (client) setSupabase(client);
    });
  }, [supabase]);

  useEffect(() => {
    if (!user?.id) {
      setProviderPhone("");
      return;
    }
    const defaults = profileDefaultsFromUser(user);
    setProviderPhone(defaults.phone);
    setServiceArea((current) => current || defaults.serviceArea);
  }, [user]);

  const [view, setView] = useState<View>("overview");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copiedAgreementId, setCopiedAgreementId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [successAgreementId, setSuccessAgreementId] = useState("");
  const [shareAgreementId, setShareAgreementId] = useState("");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mockPlan, setMockPlan] = useState<MockPlanId>("free");
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState<Agreement | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [providerPhone, setProviderPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [scopeExclusions, setScopeExclusions] = useState("");
  const [completionDay, setCompletionDay] = useState("");
  const [completionMonth, setCompletionMonth] = useState("");
  const [completionYear, setCompletionYear] = useState("");
  const [deadlineDay, setDeadlineDay] = useState("");
  const [deadlineMonth, setDeadlineMonth] = useState("");
  const [deadlineYear, setDeadlineYear] = useState("");
  const [totalPriceInput, setTotalPriceInput] = useState("");
  const [vatMode, setVatMode] = useState<VatMode>("included");
  const [paymentType, setPaymentType] = useState<PaymentType>("single");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  /** When set, the create form updates this pending agreement instead of creating a new one. */
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null);
  const [providerLogoUrl, setProviderLogoUrl] = useState("");
  const [logoRevision, setLogoRevision] = useState(0);
  const [logoError, setLogoError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  /** Latest saved Contract Terms template for this provider (localStorage + optional cloud metadata). */
  const [globalTermsTemplate, setGlobalTermsTemplate] = useState("");
  /** One-time hydrate of contract terms from saved template / last agreement. */
  const termsHydratedRef = useRef(false);
  /** Protects against overwriting user-typed terms mid-session. */
  const termsDirtyRef = useRef(false);
  const contractTermsRef = useRef(contractTerms);
  const termsSaveTimerRef = useRef<number | null>(null);
  const termsCloudSaveTimerRef = useRef<number | null>(null);
  const logoBackfillAttemptedRef = useRef<Set<string>>(new Set());
  const agreementsFetchSeqRef = useRef(0);
  const agreementsRefreshTimerRef = useRef<number | null>(null);
  const agreementsRef = useRef(agreements);
  agreementsRef.current = agreements;
  contractTermsRef.current = contractTerms;

  useEffect(() => {
    if (!user?.id) {
      setMockPlan("free");
      return;
    }
    setMockPlan(readMockPlan(user.id));
  }, [user?.id]);

  useEffect(() => {
    termsHydratedRef.current = false;
    termsDirtyRef.current = false;
    if (!user?.id) {
      setGlobalTermsTemplate("");
      setContractTerms("");
    }
  }, [user?.id]);

  const hydrateProviderLogo = useCallback(async () => {
    if (!user?.id) {
      setProviderLogoUrl("");
      setLogoRevision(0);
      return;
    }

    let meta: Record<string, unknown> | undefined;
    if (supabase && user.source !== "mock") {
      const authData = await withNetworkTimeout(supabase.auth.getUser());
      meta = (authData?.data.user?.user_metadata ?? {}) as Record<string, unknown>;
    }

    const resolved = resolveProviderLogoForUser(user.id, meta, agreementsRef.current);
    if (!resolved) return;

    setProviderLogoUrl(resolved);
    writeStoredProviderLogo(user.id, resolved);
    setLogoRevision(readStoredProviderLogoTimestamp(user.id));
  }, [supabase, user?.id, user?.source]);

  useEffect(() => {
    void hydrateProviderLogo();
  }, [hydrateProviderLogo]);

  useEffect(() => {
    if (!user?.id || providerLogoUrl.trim() || loadingAgreements) return;
    void hydrateProviderLogo();
  }, [hydrateProviderLogo, loadingAgreements, providerLogoUrl, user?.id]);

  const savedProviderLogoUrl = useMemo(
    () => resolveEffectiveProviderLogo(providerLogoUrl, user?.id, undefined, agreements),
    [providerLogoUrl, user?.id, agreements]
  );

  useEffect(() => {
    if (view !== "create" || !user?.id || providerLogoUrl.trim()) return;
    void hydrateProviderLogo();
  }, [view, user?.id, providerLogoUrl, hydrateProviderLogo]);

  // Backfill logos onto older agreements so logged-out share links can render them.
  useEffect(() => {
    if (!user?.id || !supabase || user.source === "mock") return;
    let logo = providerLogoUrl.trim();
    if (!logo) return;

    const missing = agreements.filter(
      (a) =>
        a.provider_id === user.id &&
        !(a.provider_logo_url ?? "").trim() &&
        !logoBackfillAttemptedRef.current.has(a.id)
    );
    if (missing.length === 0) return;

    for (const row of missing) {
      logoBackfillAttemptedRef.current.add(row.id);
    }

    let cancelled = false;
    void (async () => {
      if (logo.startsWith("data:image/")) {
        try {
          const token = await ensureSupabaseAccessToken(supabase);
          if (!token || cancelled) return;
          const blobRes = await fetch(logo);
          const blob = await blobRes.blob();
          const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpeg";
          const file = new File([blob], `logo.${ext}`, { type: blob.type || `image/${ext}` });
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/user/logo", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form
          });
          const payload = (await res.json().catch(() => ({}))) as { url?: string };
          if (!res.ok || !payload.url || cancelled) return;
          logo = payload.url;
          setProviderLogoUrl(logo);
          writeStoredProviderLogo(user.id, logo);
          void syncProviderLogoToAccount(supabase, user.id, logo);
        } catch {
          return;
        }
      }

      if (!logo.startsWith("http://") && !logo.startsWith("https://")) return;

      for (const row of missing.slice(0, 25)) {
        if (cancelled) return;
        const { error } = await supabase
          .from("agreements")
          .update({ provider_logo_url: logo })
          .eq("id", row.id)
          .eq("provider_id", user.id);
        if (!error) {
          setAgreements((prev) =>
            prev.map((a) => (a.id === row.id ? { ...a, provider_logo_url: logo } : a))
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agreements, providerLogoUrl, supabase, user?.id, user?.source]);

  const providerLogoDisplayUrl =
    withProviderLogoCacheBust(providerLogoUrl, user?.id ?? "", logoRevision) ?? providerLogoUrl;

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoError("");
    setLogoUploading(true);

    const persistLogo = async (url: string) => {
      setProviderLogoUrl(url);
      setLogoRevision(Date.now());
      if (!user?.id) return;
      writeStoredProviderLogo(user.id, url);
      if (supabase) {
        await syncProviderLogoToAccount(supabase, user.id, url);
      }
    };

    try {
      if (user?.id && supabase) {
        const token = await ensureSupabaseAccessToken(supabase);
        if (token) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/user/logo", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form
          });
          const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
          if (res.ok && payload.url) {
            await persistLogo(payload.url);
            return;
          }
        }

        const uploaded = await uploadProviderLogoToStorage(supabase, user.id, file);
        if (uploaded.url) {
          await persistLogo(uploaded.url);
          return;
        }
      }

      const { dataUrl, error: logoErr } = await readLogoDataUrl(file);
      if (logoErr || !dataUrl) {
        setLogoError(logoErr ?? "Could not use this image.");
        return;
      }
      await persistLogo(dataUrl);
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = () => {
    setProviderLogoUrl("");
    setLogoError("");
    setLogoRevision(Date.now());
    if (user?.id) {
      if (supabase) {
        void clearProviderLogoFromAccount(supabase, user.id);
        void deleteProviderLogosFromStorage(supabase, user.id);
      } else {
        clearStoredProviderLogo(user.id);
      }
    }
  };

  const tx: Tx = t[lang] ?? t.en;
  const isPro = mockPlan === "pro";
  const agreementsUsed = agreements.length;
  const isAtFreeLimit = !isPro && agreementsUsed >= FREE_AGREEMENT_LIMIT;
  const freeUsagePct = Math.min(100, (agreementsUsed / FREE_AGREEMENT_LIMIT) * 100);

  const upgradeToProMock = () => {
    if (!user?.id) return;
    writeMockPlan("pro", user.id);
    setMockPlan("pro");
    setLimitModalOpen(false);
    setToast(tx.upgradeNowMock);
  };

  const resetToFreeMock = () => {
    if (!user?.id) return;
    writeMockPlan("free", user.id);
    setMockPlan("free");
  };

  const tryOpenCreate = () => {
    if (isAtFreeLimit) {
      setLimitModalOpen(true);
      return;
    }
    const termsTemplate = globalTermsTemplate.trim() || contractTerms.trim() || undefined;
    setEditingAgreementId(null);
    resetForm(termsTemplate);
    setView("create");
  };

  const openBilling = () => setView("billing");

  const isEditing = Boolean(editingAgreementId);

  const pageTitle =
    view === "archive"
      ? tx.archivedTitle
      : view === "billing"
        ? tx.billingTitle
        : view === "create"
          ? isEditing
            ? tx.editAgreement
            : tx.createSafeAgreement
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
    setEditingAgreementId(null);
    setView(id);
  };
  const statusText: Record<DerivedAgreementStatus, string> = {
    pending: tx.pending,
    signed: tx.signed,
    completed: tx.completed,
    in_progress: tx.inProgress,
    paid: tx.paid,
    funds_secured: tx.fundsSecured,
    verification_pending: tx.verificationPending
  };

  const getDerivedStatus = (agreement: Agreement): DerivedAgreementStatus =>
    getDerivedAgreementStatus(agreement);

  const isHistoryAgreement = (agreement: Agreement) => {
    if (agreement.status === "signed" || agreement.status === "completed") return true;
    // Legacy: payment-completed deals from earlier escrow flow
    if (agreement.payment_status === "released") return true;
    if (agreement.payment_type === "milestones") {
      const milestones = agreement.milestones ?? [];
      return milestones.length > 0 && milestones.every((m) => m.status === "released");
    }
    return false;
  };

  useEffect(() => {
    if (loading) return;
    if (user || isSigningOut()) return;
    if (mockGetSession()) return;

    let cancelled = false;
    let redirectTimer: number | undefined;

    void (async () => {
      const recovered = await revalidateSession();
      if (cancelled || recovered) return;

      redirectTimer = window.setTimeout(() => {
        void (async () => {
          if (cancelled || mockGetSession()) return;
          const retry = await revalidateSession();
          if (cancelled || retry) return;
          redirectToLogin(ROUTES.dashboard);
        })();
      }, 600);
    })();

    return () => {
      cancelled = true;
      if (redirectTimer !== undefined) window.clearTimeout(redirectTimer);
    };
  }, [loading, user, revalidateSession]);

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

  const totalPrice = useMemo(() => parseGroupedNumberInput(totalPriceInput), [totalPriceInput]);

  const manualEstimatedCompletionDate = useMemo(
    () => buildCompletionDate(completionYear, completionMonth, completionDay),
    [completionYear, completionMonth, completionDay]
  );

  const milestonesParsed = useMemo(
    () =>
      milestones.map((m) => {
        const target_date = buildCompletionDate(m.targetYear, m.targetMonth, m.targetDay);
        return {
          title: m.title.trim(),
          amount: parseGroupedNumberInput(m.amount),
          ...(target_date ? { target_date } : {})
        };
      }),
    [milestones]
  );

  const effectiveEstimatedCompletionDate = useMemo(() => {
    if (paymentType === "milestones") {
      const milestoneDates = milestonesParsed.map((m) => m.target_date).filter(Boolean);
      if (milestoneDates.length > 0) {
        return latestIsoDate(milestoneDates);
      }
      return "";
    }
    return manualEstimatedCompletionDate;
  }, [paymentType, milestonesParsed, manualEstimatedCompletionDate]);

  const hasMilestoneTargetDates = useMemo(
    () => milestonesParsed.some((m) => Boolean(m.target_date)),
    [milestonesParsed]
  );

  const offerDeadline = useMemo(
    () => buildCompletionDate(deadlineYear, deadlineMonth, deadlineDay),
    [deadlineYear, deadlineMonth, deadlineDay]
  );

  const milestonesTotal = useMemo(() => milestonesParsed.reduce((sum, item) => sum + item.amount, 0), [milestonesParsed]);
  const milestonesValid = paymentType === "single" || Math.abs(milestonesTotal - totalPrice) < 0.0001;

  const fetchAgreements = useCallback(async (options?: { background?: boolean }) => {
    const seq = ++agreementsFetchSeqRef.current;
    const isCurrent = () => seq === agreementsFetchSeqRef.current;
    const background = options?.background === true;

    const local = user?.id ? (listLocalAgreementsForDashboard(user.id) as Agreement[]) : [];
    if (!user?.id) {
      if (!isCurrent()) return;
      setAgreements([]);
      setLoadingAgreements(false);
      return;
    }

    if (user.source === "mock" || !supabase) {
      if (!isCurrent()) return;
      setAgreements(local);
      setLoadingAgreements(false);
      if (user.id) writeHasAgreementsHint(user.id, local.length > 0);
      return;
    }

    const expectAgreements =
      local.length > 0 || agreementsRef.current.length > 0 || readHasAgreementsHint(user.id);

    if (!background && expectAgreements && isCurrent()) {
      setLoadingAgreements(true);
    }

    if (isCurrent() && local.length > 0) {
      setAgreements((prev) => mergeDashboardAgreements(local, prev));
    }

    try {
      const token = await withNetworkTimeout(ensureSupabaseAccessToken(supabase), 5_000);
      let cloud: Agreement[] = [];

      if (token) {
        const apiResult = await withNetworkTimeout(fetchDashboardAgreementsViaApi(token), 8_000);
        if (Array.isArray(apiResult?.agreements)) {
          cloud = apiResult.agreements as Agreement[];
        } else if (apiResult?.error) {
          setError(apiResult.error);
        }
      }

      if (!isCurrent()) return;
      const merged = mergeDashboardAgreements(local, cloud);
      setAgreements(merged);
      writeHasAgreementsHint(user.id, merged.length > 0);
    } catch {
      if (!isCurrent()) return;
      setAgreements(local);
      writeHasAgreementsHint(user.id, local.length > 0);
    } finally {
      if (isCurrent()) setLoadingAgreements(false);
    }
  }, [supabase, user?.id, user?.source]);

  useEffect(() => {
    agreementsFetchSeqRef.current += 1;
    if (!user?.id) {
      setLoadingAgreements(false);
      setAgreements([]);
      return;
    }

    const local = listLocalAgreementsForDashboard(user.id) as Agreement[];
    if (local.length > 0) {
      setAgreements(local);
    } else {
      setAgreements([]);
    }

    const expectAgreements = local.length > 0 || readHasAgreementsHint(user.id);
    if (expectAgreements && user.source !== "mock" && supabase) {
      setLoadingAgreements(true);
    } else if (user.source === "mock" || !supabase) {
      setLoadingAgreements(false);
    }

    void fetchAgreements();

    const safetyTimer = window.setTimeout(() => setLoadingAgreements(false), 10_000);
    return () => {
      agreementsFetchSeqRef.current += 1;
      window.clearTimeout(safetyTimer);
    };
  }, [fetchAgreements, user?.id, supabase, user?.source]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const locals = listLocalAgreementsForDashboard(user.id).filter((a) => isLocalAgreementId(a.id));
    if (locals.length === 0) return;

    void (async () => {
      const token = await ensureSupabaseAccessToken(supabase);
      if (!token) return;
      const { data: authData } = await supabase.auth.getUser();
      const providerId = authData.user?.id ?? user.id;
      let migrated = false;
      for (const local of locals) {
        const localForPublish = { ...local, provider_id: providerId };
        const published = await publishLocalAgreementToCloud(supabase, localForPublish);
        if (published.id) {
          replaceLocalAgreementId(local.id, published.id);
          migrated = true;
        }
      }
      if (migrated) void fetchAgreements({ background: true });
    })();
  }, [supabase, user?.id, fetchAgreements]);

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
              copy[idx] = mergeDashboardAgreementRow(copy[idx], next);
              return copy;
            });
          }

          // Debounced full refresh when realtime fires (e.g. client signed on shared link).
          if (agreementsRefreshTimerRef.current !== null) {
            window.clearTimeout(agreementsRefreshTimerRef.current);
          }
          agreementsRefreshTimerRef.current = window.setTimeout(() => {
            agreementsRefreshTimerRef.current = null;
            void fetchAgreements({ background: true });
          }, 400);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, user?.source, fetchAgreements]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !loadingAgreements) {
        void fetchAgreements({ background: true });
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchAgreements]);

  const resolvePublicAgreementId = useCallback(
    async (id: string): Promise<{ id: string; error?: string }> => {
      if (!isLocalAgreementId(id)) return { id };
      if (!supabase || !user?.id) {
        return { id, error: tx.linkNotPublished };
      }
      const token = await ensureSupabaseAccessToken(supabase);
      if (!token) {
        return { id, error: tx.signInRequiredForSharing };
      }
      const { data: authData } = await supabase.auth.getUser();
      const providerId = authData.user?.id ?? user.id;
      const stored = getLocalAgreement(id) ?? agreementsRef.current.find((a) => a.id === id) ?? null;
      if (!stored) {
        return { id, error: tx.linkNotPublished };
      }
      const localForPublish = { ...stored, provider_id: providerId };
      const published = await publishLocalAgreementToCloud(supabase, localForPublish);
      if (!published.id) {
        return { id, error: published.error ?? tx.linkNotPublished };
      }
      replaceLocalAgreementId(id, published.id);
      setAgreements((prev) =>
        prev.map((a) => (a.id === id ? ({ ...a, id: published.id! } as Agreement) : a))
      );
      if (successAgreementId === id) setSuccessAgreementId(published.id);
      return { id: published.id };
    },
    [supabase, user?.id, successAgreementId, tx.linkNotPublished, tx.signInRequiredForSharing]
  );

  const copyAgreementLink = async (id: string) => {
    const resolved = await resolvePublicAgreementId(id);
    if (!isShareableAgreementId(resolved.id)) {
      setToast(resolved.error ?? tx.linkNotPublished);
      return;
    }
    const link = getAgreementPublicUrl(resolved.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAgreementId(resolved.id);
    } catch {
      setToast("Could not copy link.");
    }
  };

  const copySuccessModalLink = async (id: string) => {
    const resolved = await resolvePublicAgreementId(id);
    if (!isShareableAgreementId(resolved.id)) {
      setToast(resolved.error ?? tx.linkNotPublished);
      return;
    }
    const link = getAgreementPublicUrl(resolved.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAgreementId(resolved.id);
    } catch {
      setToast("Could not copy link.");
    }
  };

  const openShareAgreement = async (id: string) => {
    const resolved = await resolvePublicAgreementId(id);
    if (!isShareableAgreementId(resolved.id)) {
      setToast(resolved.error ?? tx.linkNotPublished);
      return;
    }
    setShareAgreementId(resolved.id);
  };

  const closeShareDialog = () => {
    setSuccessAgreementId("");
    setShareAgreementId("");
    setCopiedAgreementId("");
  };

  const activeShareAgreementId = successAgreementId || shareAgreementId;

  const openAgreementLink = async (id: string) => {
    const resolved = await resolvePublicAgreementId(id);
    if (!isShareableAgreementId(resolved.id)) {
      setToast(resolved.error ?? tx.linkNotPublished);
      return;
    }
    window.open(getAgreementPublicUrl(resolved.id), "_blank", "noopener,noreferrer");
  };

  const downloadAgreementPdf = async (agreement: Agreement) => {
    const resolved = await resolvePublicAgreementId(agreement.id);
    if (!isShareableAgreementId(resolved.id)) {
      setToast(resolved.error ?? tx.linkNotPublished);
      return;
    }
    const link = `${getAgreementPublicUrl(resolved.id)}?download=1`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const resetForm = (nextContractTerms?: string) => {
    const defaults = profileDefaultsFromUser(user);
    setClientName("");
    setClientPhone("");
    setProjectTitle("");
    setServiceArea(defaults.serviceArea);
    setProviderPhone(defaults.phone);
    setContractTerms(nextContractTerms ?? "");
    setScopeOfWork("");
    setScopeExclusions("");
    setCompletionDay("");
    setCompletionMonth("");
    setCompletionYear("");
    setDeadlineDay("");
    setDeadlineMonth("");
    setDeadlineYear("");
    setTotalPriceInput("");
    setVatMode("included");
    setPaymentType("single");
    setMilestones([]);
    setEditingAgreementId(null);
    setError("");
  };

  const startEditAgreement = (agreement: Agreement) => {
    if (!isAgreementEditable(agreement)) {
      setToast(tx.editLocked);
      return;
    }

    const completion = splitIsoDate(agreement.estimated_completion_date);
    const deadline = splitIsoDate(agreement.deadline);
    const defaults = profileDefaultsFromUser(user);

    setEditingAgreementId(agreement.id);
    setClientName(agreement.client_name ?? "");
    setClientPhone(agreement.client_phone ?? "");
    setProjectTitle(agreement.project_title ?? "");
    setServiceArea(agreement.service_area?.trim() || defaults.serviceArea);
    setProviderPhone(agreement.provider_phone?.trim() || defaults.phone);
    setContractTerms(agreement.custom_terms ?? "");
    setScopeOfWork(agreement.scope_of_work ?? "");
    setScopeExclusions(agreement.scope_exclusions ?? "");
    setCompletionDay(completion.day);
    setCompletionMonth(completion.month);
    setCompletionYear(completion.year);
    setDeadlineDay(deadline.day);
    setDeadlineMonth(deadline.month);
    setDeadlineYear(deadline.year);
    setTotalPriceInput(formatGroupedNumberInput(String(agreement.total_price ?? "")));
    setVatMode(agreement.vat_mode === "exempt" ? "exempt" : "included");
    setPaymentType(agreement.payment_type === "milestones" ? "milestones" : "single");
    setMilestones(
      agreement.payment_type === "milestones" && (agreement.milestones?.length ?? 0) > 0
        ? (agreement.milestones ?? []).map((m) => {
            const target = splitIsoDate(m.target_date);
            return {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: m.title ?? "",
              amount: formatGroupedNumberInput(String(m.amount ?? "")),
              targetDay: target.day,
              targetMonth: target.month,
              targetYear: target.year
            };
          })
        : []
    );
    termsDirtyRef.current = true;
    setError("");
    setView("create");
  };

  const cancelEditAgreement = () => {
    setEditingAgreementId(null);
    resetForm(globalTermsTemplate.trim() || undefined);
    setView("overview");
  };

  const persistContractTermsTemplate = useCallback(
    (terms: string, opts?: { syncCloud?: boolean }) => {
      setGlobalTermsTemplate(terms);
      if (!user?.id) return;
      writeStoredContractTerms(user.id, terms);

      if (!opts?.syncCloud || !supabase || user.source === "mock") return;
      if (termsCloudSaveTimerRef.current) window.clearTimeout(termsCloudSaveTimerRef.current);
      termsCloudSaveTimerRef.current = window.setTimeout(() => {
        void supabase.auth
          .updateUser({ data: { default_agreement_terms: terms } })
          .catch(() => {});
      }, 1200);
    },
    [supabase, user?.id, user?.source]
  );

  const handleContractTermsChange = useCallback(
    (next: string) => {
      termsDirtyRef.current = true;
      setContractTerms(next);
      if (termsSaveTimerRef.current) window.clearTimeout(termsSaveTimerRef.current);
      termsSaveTimerRef.current = window.setTimeout(() => {
        persistContractTermsTemplate(next, { syncCloud: true });
      }, 400);
    },
    [persistContractTermsTemplate]
  );

  useEffect(() => {
    return () => {
      if (termsSaveTimerRef.current) window.clearTimeout(termsSaveTimerRef.current);
      if (termsCloudSaveTimerRef.current) window.clearTimeout(termsCloudSaveTimerRef.current);
    };
  }, []);

  const providerDisplayName = useMemo(
    () => authDisplayName(user) || "Service Provider",
    [user]
  );

  const openAgreementPreview = (id: string) => {
    const found = agreements.find((a) => a.id === id);
    if (found) {
      setPreviewAgreement(found);
      return;
    }
    openAgreementLink(id);
  };

  const buildDraftPreviewAgreement = useCallback((): Agreement => {
    const terms = contractTerms.trim();
    const full_name = user?.full_name?.trim() || "";
    const business_name = user?.business_name?.trim() || "";
    return {
      id: "draft",
      provider_id: user?.id ?? "",
      provider_name: providerDisplayName,
      full_name: full_name || undefined,
      business_name: business_name || undefined,
      client_name: clientName.trim() || "—",
      client_phone: clientPhone.trim() || undefined,
      provider_phone: providerPhone.trim() || undefined,
      project_title: projectTitle.trim() || "—",
      service_area: serviceArea.trim() || "Armenia",
      custom_terms: terms,
      scope_of_work: scopeOfWork.trim() || undefined,
      scope_exclusions: scopeExclusions.trim() || undefined,
      estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined,
      deadline: offerDeadline.trim() || undefined,
      total_price: totalPrice || 0,
      vat_mode: vatMode,
      payment_type: paymentType,
      milestones: paymentType === "milestones" ? milestonesParsed : null,
      status: "pending",
      payment_status: "pending",
      provider_logo_url: savedProviderLogoUrl || undefined,
      created_at: new Date().toISOString()
    };
  }, [
    clientName,
    clientPhone,
    contractTerms,
    scopeOfWork,
    scopeExclusions,
    effectiveEstimatedCompletionDate,
    offerDeadline,
    milestonesParsed,
    paymentType,
    projectTitle,
    providerDisplayName,
    savedProviderLogoUrl,
    providerPhone,
    serviceArea,
    totalPrice,
    vatMode,
    user?.business_name,
    user?.full_name,
    user?.id
  ]);

  const openDraftPreview = () => {
    setPreviewAgreement(buildDraftPreviewAgreement());
  };

  /** Draft preview stays in sync with the create form while the modal is open. */
  const displayedPreview = useMemo((): Agreement | null => {
    if (!previewAgreement) return null;
    if (previewAgreement.id === "draft") return buildDraftPreviewAgreement();
    return agreements.find((a) => a.id === previewAgreement.id) ?? previewAgreement;
  }, [previewAgreement, buildDraftPreviewAgreement, agreements]);

  useEffect(() => {
    if (termsHydratedRef.current || !user?.id) return;

    let cancelled = false;

    void (async () => {
      const fromStorage = readStoredContractTerms(user.id);
      if (fromStorage.trim().length > 0) {
        if (cancelled) return;
        setGlobalTermsTemplate(fromStorage);
        if (!termsDirtyRef.current) setContractTerms(fromStorage);
        termsHydratedRef.current = true;
        return;
      }

      // Wait for agreements before falling back to cloud metadata / last agreement.
      if (loadingAgreements) return;

      if (supabase && user.source !== "mock") {
        const authData = await withNetworkTimeout(supabase.auth.getUser());
        if (cancelled) return;
        if (authData) {
          const meta = (authData.data.user?.user_metadata ?? {}) as Record<string, unknown>;
          const saved = String(meta.default_agreement_terms ?? "").trim();
          if (saved.length > 0) {
            setGlobalTermsTemplate(saved);
            writeStoredContractTerms(user.id, saved);
            if (!termsDirtyRef.current) setContractTerms(saved);
            termsHydratedRef.current = true;
            return;
          }
        }
      }

      if (agreements.length > 0) {
        const latest = agreements[0];
        const t = (latest.custom_terms ?? "").trim();
        if (t.length > 0) {
          if (cancelled) return;
          setGlobalTermsTemplate(t);
          writeStoredContractTerms(user.id, t);
          if (!termsDirtyRef.current) setContractTerms(t);
          termsHydratedRef.current = true;
          return;
        }
      }

      // No saved template — leave empty so the informative placeholder shows.
      termsHydratedRef.current = true;
      if (!termsDirtyRef.current) {
        setGlobalTermsTemplate("");
        setContractTerms("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadingAgreements, agreements, supabase, user?.id, user?.source]);

  useEffect(() => {
    // Prefill create form from the saved template when the field is empty.
    if (view !== "create" || editingAgreementId) return;
    if (contractTermsRef.current.trim().length > 0) return;
    if (globalTermsTemplate.trim().length > 0) {
      setContractTerms(globalTermsTemplate);
    }
  }, [view, globalTermsTemplate, editingAgreementId]);

  const submitAgreement = async () => {
    if (!user?.id) {
      setError("You must be logged in to create an agreement.");
      return;
    }

    setError("");

    const editingId = editingAgreementId;
    const editingExisting = editingId ? agreements.find((a) => a.id === editingId) : undefined;

    if (editingId) {
      if (!editingExisting || !isAgreementEditable(editingExisting)) {
        setError(tx.editLocked);
        return;
      }
    } else if (isAtFreeLimit) {
      setLimitModalOpen(true);
      return;
    }

    if (!clientName.trim() || !clientPhone.trim() || !projectTitle.trim() || !serviceArea.trim() || totalPrice <= 0) {
      setError(tx.completeRequired);
      return;
    }

    if (!scopeOfWork.trim()) {
      setError(tx.completeScopeOfWork);
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
    try {
      const customTermsText = contractTerms.trim();
      const milestonePayload =
        paymentType === "milestones"
          ? milestonesParsed.map((m) => ({
              title: m.title,
              amount: m.amount,
              ...(m.target_date ? { target_date: m.target_date } : {}),
              status: "pending" as const
            }))
          : null;

      if (editingId && editingExisting) {
        const updatePayload = {
          customTerms: customTermsText,
          paymentType,
          milestones:
            paymentType === "milestones"
              ? milestonesParsed.map((m) => ({
                  title: m.title,
                  amount: m.amount,
                  ...(m.target_date ? { target_date: m.target_date } : {})
                }))
              : [],
          totalPrice,
          estimatedCompletionDate: effectiveEstimatedCompletionDate.trim() || undefined
        };

        const cloudOnline = getSupabaseReachable() === true && user.source !== "mock";
        let updatedRow: Agreement = {
          ...editingExisting,
          custom_terms: customTermsText,
          payment_type: paymentType,
          milestones: milestonePayload,
          total_price: totalPrice,
          estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined,
          status: "pending"
        };

        if (isLocalAgreementId(editingId) || user.source === "mock" || !cloudOnline) {
          const local = updateLocalAgreement(editingId, {
            custom_terms: customTermsText,
            payment_type: paymentType,
            milestones: milestonePayload,
            total_price: totalPrice,
            estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined
          });
          if (local) updatedRow = local as Agreement;
        } else if (supabase) {
          const token = await ensureSupabaseAccessToken(supabase);
          if (!token) {
            setError(tx.signInRequiredForSharing);
            return;
          }
          const result = await updatePendingAgreementViaApi(token, editingId, updatePayload);
          if (result.error || !result.id) {
            setError(result.error ?? tx.cloudSaveFailed);
            return;
          }
          if (result.agreement) {
            updatedRow = result.agreement as Agreement;
          }
          updateLocalAgreement(editingId, {
            custom_terms: customTermsText,
            payment_type: paymentType,
            milestones: milestonePayload,
            total_price: totalPrice,
            estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined
          });
        } else {
          setError(tx.cloudSaveFailed);
          return;
        }

        writeAgreementCache(updatedRow);
        setAgreements((prev) => mergeAgreementsById([[updatedRow], prev]));
        void fetch(`/api/agreement/${encodeURIComponent(editingId)}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "agreement.updated" })
        }).catch(() => {});

        persistContractTermsTemplate(customTermsText, { syncCloud: cloudOnline });
        setEditingAgreementId(null);
        setToast(tx.toastUpdated);
        setView("overview");
        resetForm(customTermsText);
        void fetchAgreements({ background: true });
        return;
      }

      const full_name = user.full_name?.trim() ?? "";
      const business_name = user.business_name?.trim() ?? "";
      const resolvedProviderPhone = providerPhone.trim() || undefined;
      const resolvedClientPhone = clientPhone.trim();
      const providerId = user.id;
      const cloudOnline = getSupabaseReachable() === true && user.source !== "mock";
      const providerName =
        business_name || full_name || authDisplayName(user) || "Service Provider";

      // Prefer a public HTTP logo URL so logged-out share links can render it.
      let logoForAgreement = savedProviderLogoUrl.trim();
      if (logoForAgreement.startsWith("data:image/") && cloudOnline && supabase) {
        try {
          const token = await ensureSupabaseAccessToken(supabase);
          if (token) {
            const blobRes = await fetch(logoForAgreement);
            const blob = await blobRes.blob();
            const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpeg";
            const file = new File([blob], `logo.${ext}`, { type: blob.type || `image/${ext}` });
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/user/logo", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form
            });
            const payload = (await res.json().catch(() => ({}))) as { url?: string };
            if (res.ok && payload.url) {
              logoForAgreement = payload.url;
              setProviderLogoUrl(payload.url);
              writeStoredProviderLogo(user.id, payload.url);
              void syncProviderLogoToAccount(supabase, user.id, payload.url);
            }
          }
        } catch {
          // Keep data URL — still saved on the agreement row for viewers who can load it.
        }
      }

      const draft = {
        providerId,
        providerName,
        full_name,
        business_name,
        clientName: clientName.trim(),
        projectTitle: projectTitle.trim(),
        serviceArea: serviceArea.trim(),
        customTerms: customTermsText,
        scopeOfWork: scopeOfWork.trim(),
        scopeExclusions: scopeExclusions.trim() || undefined,
        estimatedCompletionDate: effectiveEstimatedCompletionDate.trim() || undefined,
        deadline: offerDeadline.trim() || undefined,
        providerPhone: resolvedProviderPhone,
        clientPhone: resolvedClientPhone,
        vatMode,
        totalPrice,
        paymentType,
        milestones: paymentType === "milestones" ? milestonesParsed : [],
        providerLogoUrl: logoForAgreement || undefined
      };

      let agreementId: string | undefined;
      let cloudSaveError: string | undefined;

      if (cloudOnline) {
        const activeSupabase = supabase ?? getSupabaseBrowser();
        if (activeSupabase) {
          const result = await createShareableAgreement(activeSupabase, draft);
          if (result.id) {
            agreementId = result.id;
          } else {
            cloudSaveError = result.error;
          }
        } else {
          cloudSaveError = tx.cloudSaveFailed;
        }

        if (!agreementId) {
          try {
            const deviceRes = await fetch("/api/agreement/device", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                providerId: user.id,
                providerName,
                full_name: full_name || undefined,
                business_name: business_name || undefined,
                clientName: draft.clientName,
                projectTitle: draft.projectTitle,
                serviceArea: draft.serviceArea,
                customTerms: customTermsText,
                scopeOfWork: scopeOfWork.trim(),
                scopeExclusions: scopeExclusions.trim() || undefined,
                estimatedCompletionDate: effectiveEstimatedCompletionDate.trim() || undefined,
                deadline: offerDeadline.trim() || undefined,
                providerPhone: resolvedProviderPhone,
                clientPhone: resolvedClientPhone,
                vatMode,
                totalPrice,
                paymentType,
                milestones:
                  paymentType === "milestones"
                    ? milestonesParsed.map((m) => ({
                        title: m.title,
                        amount: m.amount,
                        ...(m.target_date ? { target_date: m.target_date } : {})
                      }))
                    : [],
                providerLogoUrl: logoForAgreement || undefined
              })
            });
            const deviceData = (await deviceRes.json().catch(() => ({}))) as { id?: string; error?: string };
            if (deviceRes.ok && deviceData.id) {
              agreementId = deviceData.id;
              cloudSaveError = undefined;
            } else if (deviceData.error) {
              cloudSaveError = deviceData.error;
            }
          } catch {
            // Keep prior cloudSaveError.
          }
        }

        if (!agreementId) {
          setError(cloudSaveError ?? tx.cloudSaveFailed);
          return;
        }
      }

      if (!agreementId) {
        const local = saveLocalAgreement({
          provider_id: providerId,
          provider_name: providerName,
          full_name: full_name || undefined,
          business_name: business_name || undefined,
          client_name: draft.clientName,
          project_title: draft.projectTitle,
          service_area: draft.serviceArea,
          custom_terms: customTermsText,
          scope_of_work: scopeOfWork.trim(),
          scope_exclusions: scopeExclusions.trim() || undefined,
          estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined,
          deadline: offerDeadline.trim() || undefined,
          provider_phone: resolvedProviderPhone,
          client_phone: resolvedClientPhone,
          vat_mode: vatMode,
          total_price: totalPrice,
          payment_type: paymentType,
          milestones:
            paymentType === "milestones"
              ? milestonesParsed.map((m) => ({ ...m, status: "pending" as const }))
              : null,
          status: "pending",
          payment_status: "pending",
          provider_logo_url: logoForAgreement || undefined
        });
        agreementId = local.id;
      }

      const createdRow: Agreement = {
        id: agreementId,
        provider_id: providerId,
        provider_name: providerName,
        full_name: full_name || undefined,
        business_name: business_name || undefined,
        client_name: draft.clientName,
        project_title: draft.projectTitle,
        service_area: draft.serviceArea,
        custom_terms: customTermsText,
        scope_of_work: scopeOfWork.trim(),
        scope_exclusions: scopeExclusions.trim() || undefined,
        estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined,
        deadline: offerDeadline.trim() || undefined,
        provider_phone: resolvedProviderPhone,
        client_phone: resolvedClientPhone,
        vat_mode: vatMode,
        total_price: totalPrice,
        payment_type: paymentType,
        milestones:
          paymentType === "milestones"
            ? milestonesParsed.map((m) => ({ ...m, status: "pending" as const }))
            : null,
        status: "pending",
        payment_status: "pending",
        provider_logo_url: logoForAgreement || undefined,
        created_at: new Date().toISOString()
      };
      setAgreements((prev) => mergeAgreementsById([[createdRow], prev]));
      writeHasAgreementsHint(providerId, true);
      writeAgreementCache(createdRow);
      if (!isLocalAgreementId(agreementId)) {
        saveLocalAgreement({
          id: agreementId,
          provider_id: providerId,
          provider_name: providerName,
          full_name: full_name || undefined,
          business_name: business_name || undefined,
          client_name: draft.clientName,
          project_title: draft.projectTitle,
          service_area: draft.serviceArea,
          custom_terms: customTermsText,
          scope_of_work: scopeOfWork.trim(),
          scope_exclusions: scopeExclusions.trim() || undefined,
          estimated_completion_date: effectiveEstimatedCompletionDate.trim() || undefined,
          deadline: offerDeadline.trim() || undefined,
          provider_phone: resolvedProviderPhone,
          client_phone: resolvedClientPhone,
          vat_mode: vatMode,
          total_price: totalPrice,
          payment_type: paymentType,
          milestones:
            paymentType === "milestones"
              ? milestonesParsed.map((m) => ({ ...m, status: "pending" as const }))
              : null,
          status: "pending",
          payment_status: "pending",
          provider_logo_url: logoForAgreement || undefined
        });
      }

      void fetch(`/api/agreement/${encodeURIComponent(agreementId)}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agreement.created",
          meta: { clientName: draft.clientName, totalPrice: draft.totalPrice }
        })
      }).catch(() => {});

      persistContractTermsTemplate(customTermsText, { syncCloud: cloudOnline });
      if (logoForAgreement && user?.id && supabase) {
        void syncProviderLogoToAccount(supabase, user.id, logoForAgreement);
      }

      if (cloudOnline && !isShareableAgreementId(agreementId)) {
        setError(tx.linkNotPublished);
        return;
      }

      setSuccessAgreementId(agreementId);
      setView("overview");

      const publicLink = getAgreementPublicUrl(agreementId);
      void navigator.clipboard.writeText(publicLink).then(
        () => setCopiedAgreementId(agreementId),
        () => {}
      );
      setToast(isLocalAgreementId(agreementId) ? tx.linkLocalWarning : tx.toastCreated);
      resetForm(customTermsText);
      void fetchAgreements({ background: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agreement.");
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(
    () => ({
      totalValue: agreements.reduce((sum, a) => sum + Number(a.total_price || 0), 0),
      awaitingSignature: agreements.reduce(
        (sum, a) => sum + (a.status === "pending" ? Number(a.total_price || 0) : 0),
        0
      ),
      signedCount: agreements.filter((a) => a.status === "signed" || a.status === "completed").length
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
      const haystack = [
        item.client_name,
        item.project_title,
        item.service_area,
        formatAgreementNumber(item.id, item.created_at),
        item.id,
        statusText.completed,
        statusText.signed,
        statusText.paid
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [archived, historySearch, statusText.completed, statusText.signed, statusText.paid]);

  if (!loading && !user && !isSigningOut()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F9FAFB] p-6 text-sm text-slate-600">
        Redirecting…
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F9FAFB] p-6 text-sm text-slate-600">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F9FAFB] text-slate-900">
      <aside className="hidden h-full w-72 min-w-0 max-w-[18rem] shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
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
          <p className="truncate text-xs text-blue-100" title={providerDisplayName}>
            {tx.signedInAs}: {providerDisplayName}
          </p>
          <Link
            href={ROUTES.settings}
            className="flex w-full items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700/40"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {tx.settings}
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0033A0]"
          >
            {tx.logout}
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
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
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <h2 className="min-w-0 text-xl font-black text-[#0033A0] sm:text-2xl">{pageTitle}</h2>
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
                    className={`hidden md:inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900 ${
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
                  <p className="min-w-0 truncate text-xs text-slate-600" title={providerDisplayName}>
                    {tx.signedInAs}: {providerDisplayName}
                  </p>
                  <Link
                    href={ROUTES.settings}
                    className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {tx.settings}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {tx.logout}
                  </button>
                </div>
              </div>
            </header>

            {view === "overview" ? (
              <>
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.totalAgreementValue}</p>
                    <p className="mt-2 text-3xl font-black tabular-nums">{formatAmount(stats.totalValue)}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.awaitingSignature}</p>
                    <p className="mt-2 text-3xl font-black tabular-nums text-[#0033A0]">{formatAmount(stats.awaitingSignature)}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                    <p className="text-sm font-semibold text-slate-500">{tx.signedAgreements}</p>
                    <p className="mt-2 text-3xl font-black tabular-nums">{stats.signedCount}</p>
                  </article>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-extrabold text-slate-900">{tx.latestDeals}</h3>
                  {loadingAgreements ? (
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />{tx.loading}</div>
                  ) : listed.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="font-semibold text-slate-800">{tx.emptyTitle}</p>
                      <p className="mt-1 text-sm text-slate-600">{tx.emptySubtitle}</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      {showClientSearch ? (
                        <div className="mb-3">
                          <input
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder={tx.searchClientPlaceholder}
                            aria-label={tx.searchClientPlaceholder}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-sm"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-3 md:hidden">
                        {filteredListed.map((item) => {
                          const derived = getDerivedStatus(item);
                          return (
                            <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.clientName}</p>
                                    <p className="break-words text-sm font-bold text-slate-900">{item.client_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.projectTitle}</p>
                                    <p className="break-words text-sm text-slate-800">{item.project_title}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.price}</p>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{formatAmount(Number(item.total_price))}</p>
                                  </div>
                                </div>
                                <div>
                                  <AgreementStatusPill status={derived} label={statusText[derived]} />
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {isAgreementEditable(item) ? (
                                  <button type="button" onClick={() => startEditAgreement(item)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[#F2A800]/40 bg-[#F2A800]/10 p-2 text-slate-800 hover:bg-[#F2A800]/20" aria-label={tx.edit} title={tx.edit}><Pencil className="h-4 w-4" /></button>
                                ) : null}
                                <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                                <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                                <button type="button" onClick={() => void openShareAgreement(item.id)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5 p-2 text-[#0033A0] hover:bg-[#0033A0]/10" aria-label={tx.share} title={tx.share}><Share2 className="h-4 w-4" /></button>
                                <button type="button" onClick={() => void downloadAgreementPdf(item)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
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
                              <th className="px-3 py-2">{tx.projectTitle}</th>
                              <th className="px-3 py-2">{tx.price}</th>
                              <th className="px-3 py-2">{tx.status}</th>
                              <th className="px-3 py-2">
                                <span className="sr-only">{tx.viewLink} / {tx.copyLink} / {tx.share} / {tx.download}</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredListed.map((item) => (
                              <tr key={item.id} className="border-b border-slate-100">
                                <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                                <td className="px-3 py-3 text-slate-700">{item.project_title}</td>
                                <td className="px-3 py-3">{formatAmount(Number(item.total_price))}</td>
                                <td className="px-3 py-3">
                                  {(() => {
                                    const derived = getDerivedStatus(item);
                                    return <AgreementStatusPill status={derived} label={statusText[derived]} />;
                                  })()}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    {isAgreementEditable(item) ? (
                                      <button type="button" onClick={() => startEditAgreement(item)} className="inline-flex items-center justify-center rounded-lg border border-[#F2A800]/40 bg-[#F2A800]/10 p-2 text-slate-800 hover:bg-[#F2A800]/20" aria-label={tx.edit} title={tx.edit}><Pencil className="h-4 w-4" /></button>
                                    ) : null}
                                    <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => void openShareAgreement(item.id)} className="inline-flex items-center justify-center rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5 p-2 text-[#0033A0] hover:bg-[#0033A0]/10" aria-label={tx.share} title={tx.share}><Share2 className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => void downloadAgreementPdf(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold">{isEditing ? tx.editAgreement : tx.createSafeAgreement}</h3>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={cancelEditAgreement}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {tx.cancelEdit}
                    </button>
                  ) : null}
                </div>

                {!isEditing ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-700">{tx.providerLogo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{tx.providerLogoHint}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {providerLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${user?.id ?? "anon"}-${logoRevision}`}
                        src={providerLogoDisplayUrl}
                        alt=""
                        className="h-14 w-auto max-w-[180px] rounded-lg border border-slate-200 bg-white object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                        <ImageIcon className="h-6 w-6" aria-hidden />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => void handleLogoFile(e)}
                      />
                      <button
                        type="button"
                        disabled={logoUploading}
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        {logoUploading ? tx.logoProcessing : providerLogoUrl ? tx.changeLogo : tx.uploadLogo}
                      </button>
                      {providerLogoUrl ? (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          {tx.removeLogo}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {logoError ? <p className="mt-2 text-sm font-semibold text-red-700">{logoError}</p> : null}
                </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FormField
                    id="create-client-name"
                    label={tx.clientName}
                    icon={User}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    autoComplete="off"
                    readOnly={isEditing}
                  />
                  <FormField
                    id="create-client-phone"
                    label={tx.clientPhone}
                    icon={Phone}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    readOnly={isEditing}
                  />
                  <FormField
                    id="create-project-title"
                    label={tx.projectTitle}
                    icon={Briefcase}
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    autoComplete="off"
                    readOnly={isEditing}
                  />
                  <FormField
                    id="create-service-area"
                    label={tx.serviceArea}
                    icon={MapPin}
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    autoComplete="off"
                    readOnly={isEditing}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      id="create-total-price"
                      label={tx.totalPrice}
                      icon={CircleDollarSign}
                      value={totalPriceInput}
                      onChange={(e) => setTotalPriceInput(formatGroupedNumberInput(e.target.value))}
                      inputMode="decimal"
                    />
                    <fieldset className="mt-3" disabled={isEditing}>
                      <legend className="sr-only">{tx.totalPrice}</legend>
                      <div className={`flex flex-col gap-2 sm:flex-row sm:gap-6 ${isEditing ? "opacity-60" : ""}`}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition has-[:checked]:border-[#0033A0] has-[:checked]:bg-[#0033A0]/5 has-[:checked]:text-[#0033A0]">
                          <input
                            type="radio"
                            name="create-vat-mode"
                            value="included"
                            checked={vatMode === "included"}
                            onChange={() => setVatMode("included")}
                            className="h-4 w-4 shrink-0 border-slate-300 text-[#0033A0] focus:ring-[#0033A0]/30"
                          />
                          {tx.vatModeIncludes}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition has-[:checked]:border-[#0033A0] has-[:checked]:bg-[#0033A0]/5 has-[:checked]:text-[#0033A0]">
                          <input
                            type="radio"
                            name="create-vat-mode"
                            value="exempt"
                            checked={vatMode === "exempt"}
                            onChange={() => setVatMode("exempt")}
                            className="h-4 w-4 shrink-0 border-slate-300 text-[#0033A0] focus:ring-[#0033A0]/30"
                          />
                          {tx.vatModeExempt}
                        </label>
                      </div>
                    </fieldset>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="contract-terms-create">
                      {tx.contractTerms}
                    </label>
                    <textarea
                      id="contract-terms-create"
                      value={contractTerms}
                      onChange={(e) => handleContractTermsChange(e.target.value)}
                      rows={7}
                      placeholder={tx.contractTermsPlaceholder}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="scope-of-work-create">
                      {tx.scopeOfWork}
                    </label>
                    <textarea
                      id="scope-of-work-create"
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      rows={4}
                      placeholder={tx.scopeOfWorkPlaceholder}
                      readOnly={isEditing}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 read-only:bg-slate-50 read-only:text-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="scope-exclusions-create">
                      {tx.scopeExclusions}
                    </label>
                    <textarea
                      id="scope-exclusions-create"
                      value={scopeExclusions}
                      onChange={(e) => setScopeExclusions(e.target.value)}
                      rows={3}
                      placeholder={tx.scopeExclusionsPlaceholder}
                      readOnly={isEditing}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 read-only:bg-slate-50 read-only:text-slate-700"
                    />
                  </div>
                  {paymentType === "single" ? (
                    <div className="md:col-span-2">
                      <p className="text-sm font-semibold text-slate-700">{tx.estimatedCompletionDate}</p>
                      <div className="mt-1 grid grid-cols-3 gap-3 sm:max-w-lg">
                        <label className="min-w-0 text-xs font-medium text-slate-500">
                          {tx.dateDay}
                          <select
                            value={completionDay}
                            onChange={(e) => setCompletionDay(e.target.value)}
                            className={selectFieldClass}
                            aria-label={tx.dateDay}
                          >
                            <option value="">—</option>
                            {Array.from({ length: 31 }, (_, i) => {
                              const day = String(i + 1).padStart(2, "0");
                              return (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <label className="min-w-0 text-xs font-medium text-slate-500">
                          {tx.dateMonth}
                          <select
                            value={completionMonth}
                            onChange={(e) => setCompletionMonth(e.target.value)}
                            className={selectFieldClass}
                            aria-label={tx.dateMonth}
                          >
                            <option value="">—</option>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = String(i + 1).padStart(2, "0");
                              return (
                                <option key={month} value={month}>
                                  {month}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                        <label className="min-w-0 text-xs font-medium text-slate-500">
                          {tx.dateYear}
                          <select
                            value={completionYear}
                            onChange={(e) => setCompletionYear(e.target.value)}
                            className={selectFieldClass}
                            aria-label={tx.dateYear}
                          >
                            <option value="">—</option>
                            {completionYearOptions().map((year) => (
                              <option key={year} value={String(year)}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ) : hasMilestoneTargetDates ? (
                    <div className="md:col-span-2">
                      <p className="text-sm font-semibold text-slate-700">{tx.estimatedCompletionDate}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDateDMY(effectiveEstimatedCompletionDate)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{tx.estimatedCompletionAuto}</p>
                    </div>
                  ) : null}
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">{tx.offerDeadline}</p>
                    <div className={`mt-1 grid grid-cols-3 gap-3 sm:max-w-lg ${isEditing ? "pointer-events-none opacity-60" : ""}`}>
                      <label className="min-w-0 text-xs font-medium text-slate-500">
                        {tx.dateDay}
                        <select
                          value={deadlineDay}
                          onChange={(e) => setDeadlineDay(e.target.value)}
                          className={selectFieldClass}
                          aria-label={tx.dateDay}
                          disabled={isEditing}
                        >
                          <option value="">—</option>
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = String(i + 1).padStart(2, "0");
                            return (
                              <option key={`deadline-day-${day}`} value={day}>
                                {day}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="min-w-0 text-xs font-medium text-slate-500">
                        {tx.dateMonth}
                        <select
                          value={deadlineMonth}
                          onChange={(e) => setDeadlineMonth(e.target.value)}
                          className={selectFieldClass}
                          aria-label={tx.dateMonth}
                          disabled={isEditing}
                        >
                          <option value="">—</option>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = String(i + 1).padStart(2, "0");
                            return (
                              <option key={`deadline-month-${month}`} value={month}>
                                {month}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="min-w-0 text-xs font-medium text-slate-500">
                        {tx.dateYear}
                        <select
                          value={deadlineYear}
                          onChange={(e) => setDeadlineYear(e.target.value)}
                          className={selectFieldClass}
                          aria-label={tx.dateYear}
                          disabled={isEditing}
                        >
                          <option value="">—</option>
                          {completionYearOptions().map((year) => (
                            <option key={`deadline-year-${year}`} value={String(year)}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-sm font-bold text-slate-900">{tx.milestones}</p><p className="text-xs text-slate-500">{tx.milestonesHint}</p></div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={paymentType === "milestones"}
                      aria-label={paymentType === "milestones" ? tx.milestones : tx.singlePayment}
                      onClick={() => setPaymentType((p) => (p === "single" ? "milestones" : "single"))}
                      className={`inline-flex h-8 w-16 shrink-0 items-center rounded-full p-1 transition ${paymentType === "milestones" ? "bg-[#0033A0]" : "bg-slate-300"}`}
                    >
                      <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${paymentType === "milestones" ? "translate-x-8" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {paymentType === "milestones" ? (
                    <div className="mt-4 space-y-3">
                      {milestones.map((m, index) => (
                        <div key={m.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                            <input value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))} placeholder={`${tx.milestoneTitle} ${index + 1}`} aria-label={`${tx.milestoneTitle} ${index + 1}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                            <input value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, amount: formatGroupedNumberInput(e.target.value) } : x)))} placeholder={tx.milestoneAmount} aria-label={`${tx.milestoneAmount} ${index + 1}`} inputMode="decimal" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                            <button type="button" onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))} className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-red-600" aria-label="Remove milestone"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">{tx.milestoneTargetDate}</p>
                            <div className="mt-1 grid grid-cols-3 gap-2 sm:max-w-md">
                              <label className="min-w-0 text-xs font-medium text-slate-500">
                                {tx.dateDay}
                                <select
                                  value={m.targetDay}
                                  onChange={(e) =>
                                    setMilestones((prev) =>
                                      prev.map((x) => (x.id === m.id ? { ...x, targetDay: e.target.value } : x))
                                    )
                                  }
                                  className={selectFieldClass}
                                  aria-label={`${tx.dateDay} ${index + 1}`}
                                >
                                  <option value="">—</option>
                                  {Array.from({ length: 31 }, (_, i) => {
                                    const day = String(i + 1).padStart(2, "0");
                                    return (
                                      <option key={`${m.id}-day-${day}`} value={day}>
                                        {day}
                                      </option>
                                    );
                                  })}
                                </select>
                              </label>
                              <label className="min-w-0 text-xs font-medium text-slate-500">
                                {tx.dateMonth}
                                <select
                                  value={m.targetMonth}
                                  onChange={(e) =>
                                    setMilestones((prev) =>
                                      prev.map((x) => (x.id === m.id ? { ...x, targetMonth: e.target.value } : x))
                                    )
                                  }
                                  className={selectFieldClass}
                                  aria-label={`${tx.dateMonth} ${index + 1}`}
                                >
                                  <option value="">—</option>
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const month = String(i + 1).padStart(2, "0");
                                    return (
                                      <option key={`${m.id}-month-${month}`} value={month}>
                                        {month}
                                      </option>
                                    );
                                  })}
                                </select>
                              </label>
                              <label className="min-w-0 text-xs font-medium text-slate-500">
                                {tx.dateYear}
                                <select
                                  value={m.targetYear}
                                  onChange={(e) =>
                                    setMilestones((prev) =>
                                      prev.map((x) => (x.id === m.id ? { ...x, targetYear: e.target.value } : x))
                                    )
                                  }
                                  className={selectFieldClass}
                                  aria-label={`${tx.dateYear} ${index + 1}`}
                                >
                                  <option value="">—</option>
                                  {completionYearOptions().map((year) => (
                                    <option key={`${m.id}-year-${year}`} value={String(year)}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
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

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => void submitAgreement()}
                    disabled={creating}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F2A800] px-5 py-2.5 text-sm font-black text-slate-900 disabled:opacity-60 sm:flex-none sm:min-w-[10rem]"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {creating ? (isEditing ? tx.saving : tx.creating) : isEditing ? tx.saveChanges : tx.create}
                  </button>
                  <button
                    type="button"
                    onClick={openDraftPreview}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#0033A0] bg-white px-5 py-2.5 text-sm font-black text-[#0033A0] hover:bg-blue-50 sm:flex-none sm:min-w-[10rem]"
                  >
                    <Eye className="h-4 w-4 shrink-0" />
                    {tx.preview}
                  </button>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={cancelEditAgreement}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none sm:min-w-[8rem]"
                    >
                      {tx.cancelEdit}
                    </button>
                  ) : null}
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
                        const historyStatus = getDerivedStatus(item);
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
                                  <p className="text-sm text-slate-700">
                                    {item.estimated_completion_date
                                      ? formatDateDMY(item.estimated_completion_date)
                                      : formatDateDMY(item.created_at)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx.price}</p>
                                  <p className="font-mono text-sm font-semibold text-slate-800">{formatAmount(Number(item.total_price))}</p>
                                </div>
                              </div>
                              <AgreementStatusPill status={historyStatus} label={statusText[historyStatus]} />
                            </div>
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                              <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                              <button type="button" onClick={() => void openShareAgreement(item.id)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5 p-2 text-[#0033A0] hover:bg-[#0033A0]/10" aria-label={tx.share} title={tx.share}><Share2 className="h-4 w-4" /></button>
                              <button type="button" onClick={() => void downloadAgreementPdf(item)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
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
                              <span className="sr-only">{tx.viewLink} / {tx.copyLink} / {tx.share} / {tx.download}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredArchived.map((item) => {
                            const historyStatus = getDerivedStatus(item);
                            return (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-mono text-xs font-semibold tracking-wide text-slate-700">
                                {formatAgreementNumber(item.id, item.created_at)}
                              </td>
                              <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                              <td className="px-3 py-3 text-slate-700">
                                {item.estimated_completion_date
                                  ? formatDateDMY(item.estimated_completion_date)
                                  : formatDateDMY(item.created_at)}
                              </td>
                              <td className="px-3 py-3 font-mono font-semibold">{formatAmount(Number(item.total_price))}</td>
                              <td className="px-3 py-3">
                                <AgreementStatusPill status={historyStatus} label={statusText[historyStatus]} />
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}><ExternalLink className="h-4 w-4" /></button>
                                  <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}><Copy className="h-4 w-4" /></button>
                                  <button type="button" onClick={() => void openShareAgreement(item.id)} className="inline-flex items-center justify-center rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5 p-2 text-[#0033A0] hover:bg-[#0033A0]/10" aria-label={tx.share} title={tx.share}><Share2 className="h-4 w-4" /></button>
                                  <button type="button" onClick={() => void downloadAgreementPdf(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}><Download className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
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
                      <p className="text-xl font-black tabular-nums text-slate-900 [overflow-wrap:anywhere] sm:text-2xl">
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map(({ id, label, icon: Icon, createAction }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id, createAction)}
              className={`inline-flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-[11px] font-semibold leading-tight ${
                view === id ? "border-[#0033A0] bg-[#0033A0] text-white" : "border-slate-300 bg-white text-slate-700"
              } ${createAction && isAtFreeLimit ? "opacity-70" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full line-clamp-2 whitespace-normal text-[11px] leading-tight [overflow-wrap:anywhere]">{label}</span>
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

      {displayedPreview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-2 sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-[min(100%,56rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-100 via-[#f8fafc] to-slate-200/90 shadow-xl">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <AgreementDocumentView
                key={
                  displayedPreview.id === "draft"
                    ? `draft-${displayedPreview.provider_logo_url?.length ?? 0}-${displayedPreview.client_name}-${displayedPreview.project_title}`
                    : displayedPreview.id
                }
                agreement={displayedPreview}
                lang={lang}
                draft={displayedPreview.id === "draft"}
                embedded
                viewerUserId={user?.id}
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-4">
              {displayedPreview.id !== "draft" ? (
                <>
                  <button
                    type="button"
                    onClick={() => void openShareAgreement(displayedPreview.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0033A0] px-4 py-2 text-sm font-bold text-white hover:bg-[#002a7a]"
                  >
                    <Share2 className="h-4 w-4" />
                    {tx.share}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAgreementLink(displayedPreview.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {tx.openFullPage}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setPreviewAgreement(null)}
                className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {tx.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeShareAgreementId ? (
        <AgreementShareDialog
          title={successAgreementId ? tx.successTitle : tx.shareTitle}
          subtitle={successAgreementId ? tx.successSubtitle : tx.shareHint}
          url={getAgreementPublicUrl(activeShareAgreementId)}
          labels={{
            publicLink: tx.publicLink,
            shareHint: tx.shareHint,
            copyToClipboard: tx.copyToClipboard,
            copied: tx.copied,
            shareVia: tx.shareVia,
            shareWhatsApp: tx.shareWhatsApp,
            shareTelegram: tx.shareTelegram,
            shareViber: tx.shareViber,
            shareMessage: tx.shareMessage,
            close: tx.close,
            previewAgreement: tx.previewAgreement
          }}
          copied={copiedAgreementId === activeShareAgreementId}
          onCopy={() => void copySuccessModalLink(activeShareAgreementId)}
          onClose={closeShareDialog}
          onPreview={() => openAgreementPreview(activeShareAgreementId)}
        />
      ) : null}

      {toast ? <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}
