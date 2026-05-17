"use client";

import Link from "next/link";
import { ComingSoonOverlay } from "@/components/coming-soon-overlay";
import { OrangeButton, OutlineLightButton } from "@/components/vstah-button";
import { NAVY, ORANGE, RED, SITE_BG_GRADIENT } from "@/lib/brand";
import { formatProMonthly } from "@/lib/currency";
import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleCheck,
  Clock,
  Facebook,
  FileText,
  Globe,
  Hammer,
  Headphones,
  Flag,
  Instagram,
  Landmark,
  Layers,
  ListOrdered,
  Lock,
  Menu,
  Shield,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";

type Locale = Language;

type ComparisonRow = { label: string; withVstah: string; withoutUs: string };
type ProcessStep = { step: string; title: string; desc: string };

type TranslationBundle = {
  brand: string;
  navHome: string;
  navHowItWorks: string;
  navPricing: string;
  btnCreateDeal: string;
  btnProtectProject: string;
  btnSeeHow: string;
  btnStartProtected: string;
  heroEyebrow: string;
  /** Split headline so the renovation word can be styled (blue + underline). */
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
  heroSubtitle: string;
  cardChip1: string;
  cardChip2: string;
  projectLabel: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  fundsLabel: string;
  lockedNote: string;
  stage1Name: string;
  stage1Amount: string;
  stage1State: string;
  stage2Name: string;
  stage2Amount: string;
  stage2State: string;
  stage3Name: string;
  stage3Amount: string;
  stage3State: string;
  cardMediation: string;
  cardTagline1: string;
  cardTagline2: string;
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  diffEyebrow: string;
  diffTitle: string;
  diffSubtitle: string;
  recommended: string;
  colWith: string;
  colWithout: string;
  /** Short label above the “without us” column (e.g. “Old way”). */
  diffWithoutEyebrow: string;
  comparisonRows: ComparisonRow[];
  processEyebrow: string;
  processTitle: string;
  processSubtitle: string;
  processSteps: ProcessStep[];
  disputeEyebrow: string;
  disputeTitle: string;
  disputeBody: string;
  badge24h: string;
  badge24hSub: string;
  badgeLaw: string;
  badgeLawSub: string;
  badgeMed: string;
  badgeMedSub: string;
  footerTagline: string;
  footerRights: string;
  footerTerms: string;
  footerPrivacy: string;
  footerFollow: string;
  tableCategory: string;
  heroSlideAria: string;
  langSwitcherAria: string;
  menuAria: string;
  completionDashboard: string;
  successCompleted: string;
  leaveFeedback: string;
  awaitingFundsEscrow: string;
  depositRequired: string;
  setupDashboard: string;
  totalTransferred: string;
  allMilestonesCompleted: string;
  milestoneDemolition: string;
  milestonePlumbing: string;
  milestoneFinishing: string;
  stateLocked: string;
  statePending: string;
  stateReleased: string;
  agreementPreviewTitle: string;
  pendingDeposit: string;
  clientLabel: string;
  serviceAreaLabel: string;
  termsSnapshot: string;
  termsSnapshotText: string;
  depositFunds: string;
  providerDashboardTitle: string;
  agreementsTrackedMonth: string;
  finalPayoutCompleted: string;
  fundsSecuredEscrow: string;
  awaitingClientDeposit: string;
  statusPaid: string;
  statusSecured: string;
  completed: string;
  releaseProgress: string;
  pricingTitle: string;
  pricingSubtitle: string;
  pricingPlanName: string;
  pricingPerMonth: string;
  pricingValueFree: string;
  pricingValuePro: string;
  pricingCta: string;
};

const translations: Record<Locale, TranslationBundle> = {
  en: {
    brand: "VSTAH.am",
    navHome: "Home",
    navHowItWorks: "How it works",
    navPricing: "Pricing",
    btnCreateDeal: "Create Deal",
    btnProtectProject: "Protect My Project",
    btnSeeHow: "See how it works",
    btnStartProtected: "Start a protected project",
    heroEyebrow: "Build Professional Trust. Get Paid on Time.",
    heroTitleBefore: "Secure Your ",
    heroTitleHighlight: "Project Deals",
    heroTitleAfter: " in Armenia.",
    heroSubtitle:
      "Stop chasing payments. Start working with certainty. VSTAH ensures your funds are locked and ready for release.",
    cardChip1: "Secured Project Deposit",
    cardChip2: "Digital Work Agreement",
    projectLabel: "Project",
    projectId: "#AM-2841",
    projectTitle: "Apartment renovation",
    projectStatus: "Active",
    fundsLabel: "Funds in safe",
    lockedNote: "Locked across 3 stages",
    stage1Name: "Demolition & prep",
    stage1Amount: "150,000 ֏",
    stage1State: "Released",
    stage2Name: "Plumbing & electrical",
    stage2Amount: "200,000 ֏",
    stage2State: "Locked",
    stage3Name: "Final finishing",
    stage3Amount: "100,000 ֏",
    stage3State: "Pending",
    cardMediation: "Funds Secured & Locally Protected",
    cardTagline1: "Stop the disputes.",
    cardTagline2: "Start the renovation.",
    feature1: "Verified Funds.",
    feature2: "Guaranteed Payouts.",
    feature3: "Built for Armenia.",
    feature4: "Secure Deals.",
    diffEyebrow: "The difference",
    diffTitle: "With VSTAH vs. Without Us",
    diffSubtitle:
      "Stop the arguments before they start. See how VSTAH protects your project.",
    recommended: "(Recommended)",
    colWith: "With VSTAH",
    colWithout: "Without Us",
    diffWithoutEyebrow: "(Old way)",
    comparisonRows: [
      {
        label: "Payment Security",
        withVstah: "Funds locked in escrow before you start",
        withoutUs: "Hoping the client pays after work"
      },
      {
        label: "Digital Agreement",
        withVstah: "Professional contract signed by both parties",
        withoutUs: "Verbal promises and WhatsApp messages"
      },
      {
        label: "Project Milestones",
        withVstah: "Get paid per completed stage",
        withoutUs: "Waiting for full payment at the end"
      },
      {
        label: "Disputes",
        withVstah: "Funds secured until local mediation ends",
        withoutUs: "Personal arguments and wasted time"
      },
      {
        label: "Transparency",
        withVstah: "Full proof of work with timestamps",
        withoutUs: "Miscommunication and misunderstandings"
      },
      {
        label: "Professionalism",
        withVstah: "Guaranteed by system, not just promises",
        withoutUs: "Depends on who you know"
      }
    ],
    processEyebrow: "The process",
    processTitle: "How it works",
    processSubtitle:
      "Four simple steps. Zero guesswork. Professional deals, fully secured.",
    processSteps: [
      {
        step: "01",
        title: "Create Project Deal",
        desc: "Set the scope, milestones, and costs in minutes."
      },
      {
        step: "02",
        title: "Verify Secured Funds",
        desc: "Funds are locked in escrow. Money is ready before you start."
      },
      {
        step: "03",
        title: "Work with Confidence",
        desc: "Start the project knowing the payment is guaranteed and waiting."
      },
      {
        step: "04",
        title: "Automatic Payouts",
        desc: "Get paid instantly as each stage is completed and approved."
      }
    ],
    disputeEyebrow: "Dispute Assistance",
    disputeTitle: "We help facilitate clear and structured communication when issues arise.",
    disputeBody:
      "VSTAH provides a transparent process for both parties to review agreements, exchange information, and work toward a fair resolution in a professional and efficient way.",
    badge24h: "Fast Support",
    badge24hSub: "24h response time to help clarify issues and keep your project moving forward.",
    badgeLaw: "Structured Agreements",
    badgeLawSub:
      "Designed to support service deals through clear workflows aligned with Armenian business practices.",
    badgeMed: "Quick Resolution",
    badgeMedSub:
      "Simple 3-step process to help both parties review and resolve issues efficiently without unnecessary delays or costs.",
    footerTagline: "Building Trust in Every Project",
    footerRights: "© 2026 VSTAH.am. All rights reserved.",
    footerTerms: "Terms of Service",
    footerPrivacy: "Privacy Policy",
    footerFollow: "Follow us",
    tableCategory: "Topic",
    heroSlideAria: "Go to hero slide",
    langSwitcherAria: "Change language",
    menuAria: "Menu",
    completionDashboard: "Completion Dashboard",
    successCompleted: "Success: Contract completed",
    leaveFeedback: "Leave Feedback",
    awaitingFundsEscrow: "Awaiting Funds in Escrow",
    depositRequired: "Deposit required before any release.",
    setupDashboard: "Setup Dashboard",
    totalTransferred: "Total Transferred",
    allMilestonesCompleted: "All milestones completed successfully.",
    milestoneDemolition: "Demolition",
    milestonePlumbing: "Plumbing",
    milestoneFinishing: "Finishing",
    stateLocked: "Locked",
    statePending: "Pending",
    stateReleased: "Released",
    agreementPreviewTitle: "Agreement Preview",
    pendingDeposit: "Pending Deposit",
    clientLabel: "Client",
    serviceAreaLabel: "Service Area",
    termsSnapshot: "Terms Snapshot",
    termsSnapshotText: "Secured funds are released automatically upon milestone completion.",
    depositFunds: "Deposit Funds",
    providerDashboardTitle: "Provider Dashboard",
    agreementsTrackedMonth: "18 agreements tracked this month",
    finalPayoutCompleted: "Final payout completed",
    fundsSecuredEscrow: "Funds secured in escrow",
    awaitingClientDeposit: "Awaiting client deposit",
    statusPaid: "Paid",
    statusSecured: "Secured",
    completed: "Completed",
    releaseProgress: "Release progress",
    pricingTitle: "Simple pricing",
    pricingSubtitle: "Start free, upgrade when ready",
    pricingPlanName: "Pro",
    pricingPerMonth: "/ month",
    pricingValueFree: "3 free agreements included",
    pricingValuePro: "Unlimited after upgrade",
    pricingCta: "Start Free Trial"
  },
  hy: {
    brand: "VSTAH.am",
    navHome: "Գլխավոր",
    navHowItWorks: "Ինչպես է աշխատում",
    navPricing: "Գին",
    btnCreateDeal: "Ստեղծել գործարք",
    btnProtectProject: "Պաշտպանել նախագիծը",
    btnSeeHow: "Տեսնել քայլերը",
    btnStartProtected: "Սկսել պաշտպանված նախագիծ",
    heroEyebrow: "Մասնագիտական վստահություն · Վճարումը ժամանակին",
    heroTitleBefore: "Պաշտպանեք ձեր ",
    heroTitleHighlight: "նախագծային գործարքները",
    heroTitleAfter: " Հայաստանում",
    heroSubtitle:
      "Չվազեք վճարների հետևից։ Աշխատեք վստահ։ Գումարը կողպված է էսկրոուում՝ արձակելու պատրաստ։",
    cardChip1: "Դեպոզիտը էսկրոուում",
    cardChip2: "Թվային պայմանագիր",
    projectLabel: "Նախագիծ",
    projectId: "#AM-2841",
    projectTitle: "Բնակարանի վերանորոգում",
    projectStatus: "Ակտիվ",
    fundsLabel: "Գումարը՝ էսկրոուում",
    lockedNote: "3 փուլով կողպված",
    stage1Name: "Քանդում և նախապատրաստում",
    stage1Amount: "150,000 ֏",
    stage1State: "Արձակված",
    stage2Name: "Ջրմուղություն և էլեկտրիկա",
    stage2Amount: "200,000 ֏",
    stage2State: "Կողպված",
    stage3Name: "Վերջնահարդարում",
    stage3Amount: "100,000 ֏",
    stage3State: "Սպասում",
    cardMediation: "Գումարը ապահով · տեղային պաշտպանություն",
    cardTagline1: "Վեճերին վերջ։",
    cardTagline2: "Նախագիծը առաջ։",
    feature1: "Ստուգված գումար",
    feature2: "Երաշխավորված վճարում",
    feature3: "Հայաստանի համար",
    feature4: "Ապահով գործարքներ",
    diffEyebrow: "Տարբերությունը",
    diffTitle: "VSTAH-ով և առանց VSTAH-ի",
    diffSubtitle:
      "Կանխիր վեճերը նախօրոք։ Տե՛ս՝ VSTAH-ը ինչպես է պաշտպանում նախագիծը։",
    recommended: "(Առաջարկվող)",
    colWith: "VSTAH-ով",
    colWithout: "Առանց մեզ",
    diffWithoutEyebrow: "(Հին մոտեցում)",
    comparisonRows: [
      {
        label: "Վճարման անվտանգություն",
        withVstah: "Մինչև մեկնարկ՝ գումարը էսկրոուում",
        withoutUs: "Հույս՝ վճարեն աշխատանքից հետո"
      },
      {
        label: "Թվային պայմանագիր",
        withVstah: "Պայմանագիր՝ երկու ստորագրությամբ",
        withoutUs: "Բանավոր խոստումներ, WhatsApp"
      },
      {
        label: "Նախագծի փուլեր",
        withVstah: "Վճարում ըստ փուլերի",
        withoutUs: "Ամբողջ գումարը վերջում"
      },
      {
        label: "Վեճեր",
        withVstah: "Գումարը կողպված՝ մինչև լուծում",
        withoutUs: "Անձնական վեճեր, կորած ժամանակ"
      },
      {
        label: "Թափանցիկություն",
        withVstah: "Աշխատանքի ապացույց · ժամանակագրություն",
        withoutUs: "Կապի խզում, սխալ հասկացողություն"
      },
      {
        label: "Պրոֆեսիոնալիզմ",
        withVstah: "Երաշխիք՝ պլատֆորմից",
        withoutUs: "Կախված է կապերից"
      }
    ],
    processEyebrow: "Քայլերը",
    processTitle: "Ինչպես է աշխատում",
    processSubtitle:
      "Չորս քայլ։ Անորոշություն չկա։ Ապահով գործարքներ։",
    processSteps: [
      {
        step: "01",
        title: "Ստեղծեք գործարքը",
        desc: "Սահմանեք ծավալը, փուլերը, գինը՝ րոպեներում։"
      },
      {
        step: "02",
        title: "Ստուգեք գումարը",
        desc: "Գումարը էսկրոուում է։ Պատրաստ է աշխատանքին։"
      },
      {
        step: "03",
        title: "Աշխատեք վստահ",
        desc: "Սկսեք նախագիծը՝ վճարումը երաշխավորված է։"
      },
      {
        step: "04",
        title: "Ավտոմատ վճարում",
        desc: "Փուլը հաստատվելուց հետո՝ անմիջապես։"
      }
    ],
    disputeEyebrow: "Վեճերի աջակցություն",
    disputeTitle: "Խնդիրների դեպքում՝ հստակ հաղորդակցություն։",
    disputeBody:
      "VSTAH-ը թափանցիկ գործընթաց է տալիս՝ երկու կողմերն էլ տեսնում են պայմանագիրը, կիսվում են տեղեկություններով, քայլ են անում դեպի արդար լուծում։",
    badge24h: "Արագ աջակցություն",
    badge24hSub:
      "24 ժ՝ կարճ պատասխան, նախագիծը առաջ։",
    badgeLaw: "Կառուցված պայմանագրեր",
    badgeLawSub:
      "Պարզ հոսք՝ տեղային պրակտիկային մոտ։",
    badgeMed: "Արագ լուծում",
    badgeMedSub:
      "3 քայլ՝ առանց ձգձգման ու ավելորդ ծախսի։",
    footerTagline: "Վստահություն յուրաքանչյուր նախագծում",
    footerRights: "© 2026 VSTAH.am · Բոլոր իրավունքները պաշտպանված են",
    footerTerms: "Օգտագործման պայմաններ",
    footerPrivacy: "Գաղտնիության քաղաքականություն",
    footerFollow: "Հետևեք մեզ",
    tableCategory: "Թեմա",
    heroSlideAria: "Անցնել սլայդին",
    langSwitcherAria: "Փոխել լեզուն",
    menuAria: "Մենյու",
    completionDashboard: "Ավարտման վահանակ",
    successCompleted: "Ավարտված · պայմանագիր փակված",
    leaveFeedback: "Կարծիք թողնել",
    awaitingFundsEscrow: "Սպասվող գումար էսկրոուում",
    depositRequired: "Դեպոզիտ՝ մինչև արձակում",
    setupDashboard: "Մեկնարկի վահանակ",
    totalTransferred: "Ընդհանուր փոխանցված",
    allMilestonesCompleted: "Բոլոր փուլերը փակված են։",
    milestoneDemolition: "Քանդում",
    milestonePlumbing: "Ջրմուղ",
    milestoneFinishing: "Հարդարում",
    stateLocked: "Կողպված",
    statePending: "Սպասում",
    stateReleased: "Արձակված",
    agreementPreviewTitle: "Պայմանագրի նախադիտում",
    pendingDeposit: "Սպասվող դեպոզիտ",
    clientLabel: "Հաճախորդ",
    serviceAreaLabel: "Տարածք",
    termsSnapshot: "Պայմանների ամփոփում",
    termsSnapshotText: "Փուլը փակվելուց հետո՝ գումարի ավտոմատ արձակում։",
    depositFunds: "Դեպոզիտ անել",
    providerDashboardTitle: "Մատակարարի վահանակ",
    agreementsTrackedMonth: "18 պայմանագիր այս ամիս",
    finalPayoutCompleted: "Վերջին վճարումը կատարված",
    fundsSecuredEscrow: "Գումարը՝ էսկրոուում",
    awaitingClientDeposit: "Սպասում է հաճախորդի դեպոզիտին",
    statusPaid: "Վճարված",
    statusSecured: "Ապահովված",
    completed: "Ավարտված",
    releaseProgress: "Արձակման ընթացք",
    pricingTitle: "Պարզ գին",
    pricingSubtitle: "Սկսեք անվճար, թարմացրեք երբ պատրաստ եք",
    pricingPlanName: "Պրո",
    pricingPerMonth: "/ ամիս",
    pricingValueFree: "3 անվճար պայմանագիր ներառված է",
    pricingValuePro: "Թարմացումից հետո՝ անսահմանափակ պայմանագրեր",
    pricingCta: "Սկսել անվճար փորձարկում"
  },
  ru: {
    brand: "VSTAH.am",
    navHome: "Главная",
    navHowItWorks: "Как это работает",
    navPricing: "Тарифы",
    btnCreateDeal: "Создать соглашение",
    btnProtectProject: "Защитить проект",
    btnSeeHow: "Как это устроено",
    btnStartProtected: "Начать защищённый проект",
    heroEyebrow: "Профессиональное доверие · Оплата в срок",
    heroTitleBefore: "Защитите ",
    heroTitleHighlight: "проектные сделки",
    heroTitleAfter: " в Армении",
    heroSubtitle:
      "Не гонитесь за оплатой. Работайте спокойно: VSTAH удерживает средства и готовит выплату.",
    cardChip1: "Депозит в эскроу",
    cardChip2: "Цифровое соглашение на работы",
    projectLabel: "Проект",
    projectId: "#AM-2841",
    projectTitle: "Ремонт квартиры",
    projectStatus: "Активен",
    fundsLabel: "Средства в эскроу",
    lockedNote: "Удержание по 3 этапам",
    stage1Name: "Демонтаж и подготовка",
    stage1Amount: "150 000 ֏",
    stage1State: "Выплачено",
    stage2Name: "Сантехника и электрика",
    stage2Amount: "200 000 ֏",
    stage2State: "Удерживается",
    stage3Name: "Финишная отделка",
    stage3Amount: "100 000 ֏",
    stage3State: "Ожидание",
    cardMediation: "Средства под защитой — в рамках законодательства Армении",
    cardTagline1: "Меньше споров.",
    cardTagline2: "Быстрее проект.",
    feature1: "Проверенные средства.",
    feature2: "Выплаты гарантированы.",
    feature3: "Сделано для Армении.",
    feature4: "Сделки под защитой.",
    diffEyebrow: "Разница",
    diffTitle: "С VSTAH и без VSTAH",
    diffSubtitle:
      "Снимите риски до старта. Посмотрите, как VSTAH защищает проект.",
    recommended: "(Рекомендуется)",
    colWith: "С VSTAH",
    colWithout: "Без нас",
    diffWithoutEyebrow: "(По-старому)",
    comparisonRows: [
      {
        label: "Безопасность оплаты",
        withVstah: "Деньги в эскроу до начала работ",
        withoutUs: "Надежда, что заплатят после работ"
      },
      {
        label: "Цифровое соглашение",
        withVstah: "Договор с подписью обеих сторон",
        withoutUs: "На словах и в переписке"
      },
      {
        label: "Этапы",
        withVstah: "Оплата за каждый принятый этап",
        withoutUs: "Вся сумма в конце"
      },
      {
        label: "Споры",
        withVstah: "Средства под защитой до конца медиации",
        withoutUs: "Ссоры и потерянное время"
      },
      {
        label: "Прозрачность",
        withVstah: "Факт работы с отметками времени",
        withoutUs: "Сбои в коммуникации"
      },
      {
        label: "Профессионализм",
        withVstah: "Гарантия системы, не слов",
        withoutUs: "Всё через «своих»"
      }
    ],
    processEyebrow: "Процесс",
    processTitle: "Как это работает",
    processSubtitle:
      "Четыре шага. Без догадок. Сделки под защитой.",
    processSteps: [
      {
        step: "01",
        title: "Создайте соглашение",
        desc: "Объём, этапы и сумма — за пару минут."
      },
      {
        step: "02",
        title: "Проверьте средства",
        desc: "Деньги в эскроу до старта работ."
      },
      {
        step: "03",
        title: "Работайте спокойно",
        desc: "Оплата зарезервирована и ждёт приёмки."
      },
      {
        step: "04",
        title: "Автоматические выплаты",
        desc: "Оплата сразу после приёмки этапа."
      }
    ],
    disputeEyebrow: "При спорах",
    disputeTitle: "Помогаем выстроить ясный диалог, когда возникают вопросы.",
    disputeBody:
      "Прозрачный процесс: обе стороны видят условия, обмениваются фактами и двигаются к решению без лишнего шума.",
    badge24h: "Быстрая поддержка",
    badge24hSub:
      "Ответ за 24 ч — разобраться и не тормозить проект.",
    badgeLaw: "Чёткие договорённости",
    badgeLawSub:
      "Для сервисных соглашений и понятных процессов в духе практики Армении.",
    badgeMed: "Быстрое решение",
    badgeMedSub:
      "Три шага: смотрите вопрос вместе и двигаетесь к исходу без лишних задержек и затрат.",
    footerTagline: "Доверие в каждом проекте",
    footerRights: "© 2026 VSTAH.am. Все права защищены.",
    footerTerms: "Условия использования",
    footerPrivacy: "Политика конфиденциальности",
    footerFollow: "Мы в соцсетях",
    tableCategory: "Тема",
    heroSlideAria: "Перейти к промо-слайду",
    langSwitcherAria: "Сменить язык",
    menuAria: "Меню",
    completionDashboard: "Экран завершения",
    successCompleted: "Успешно: соглашение закрыто",
    leaveFeedback: "Оставить отзыв",
    awaitingFundsEscrow: "Ожидание зачисления в эскроу",
    depositRequired: "Сначала депозит, затем выплаты.",
    setupDashboard: "Стартовый экран",
    totalTransferred: "Всего переведено",
    allMilestonesCompleted: "Все этапы закрыты.",
    milestoneDemolition: "Демонтаж",
    milestonePlumbing: "Сантехника",
    milestoneFinishing: "Отделка",
    stateLocked: "Удерживается",
    statePending: "Ожидание",
    stateReleased: "Выплачено",
    agreementPreviewTitle: "Предпросмотр соглашения",
    pendingDeposit: "Ждём депозит",
    clientLabel: "Клиент",
    serviceAreaLabel: "Регион",
    termsSnapshot: "Сводка условий",
    termsSnapshotText: "После приёмки этапа средства уходят исполнителю автоматически.",
    depositFunds: "Внести депозит",
    providerDashboardTitle: "Кабинет исполнителя",
    agreementsTrackedMonth: "18 соглашений за месяц",
    finalPayoutCompleted: "Финальная выплата прошла",
    fundsSecuredEscrow: "Средства в эскроу",
    awaitingClientDeposit: "Ждём депозит клиента",
    statusPaid: "Оплачено",
    statusSecured: "Под защитой",
    completed: "Завершено",
    releaseProgress: "Выплаты по этапам",
    pricingTitle: "Простые тарифы",
    pricingSubtitle: "Начните бесплатно, перейдите на Pro когда будете готовы",
    pricingPlanName: "Про",
    pricingPerMonth: "/ месяц",
    pricingValueFree: "3 соглашения бесплатно включено",
    pricingValuePro: "Безлимит после перехода на тариф Про",
    pricingCta: "Начать бесплатный период"
  }
};

const processIcons = [FileText, Landmark, Hammer, CircleCheck] as const;

export default function Page() {
  const { language: locale, setLanguage: setLocale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const heroDotStyles = [
    {
      active: "bg-[#D90012] ring-2 ring-[#D90012]/65",
      inactive: "bg-[#D90012]/70 hover:bg-[#D90012]"
    },
    {
      active: "bg-[#0033A0] ring-2 ring-[#0033A0]/65",
      inactive: "bg-[#0033A0]/70 hover:bg-[#0033A0]"
    },
    {
      active: "bg-[#F2A800] ring-2 ring-[#F2A800]/70",
      inactive: "bg-[#F2A800]/75 hover:bg-[#F2A800]"
    }
  ] as const;

  const langButtons = useMemo(
    () => [
      { code: "en" as const, short: "EN", label: "English" },
      { code: "hy" as const, short: "HY", label: "Հայերեն" },
      { code: "ru" as const, short: "RU", label: "Русский" }
    ],
    []
  );

  const t: TranslationBundle = translations[locale] ?? translations.en;
  const heroChipsHyRu = locale === "hy" || locale === "ru";
  const isHy = locale === "hy";
  const pricingLongLocale = locale === "hy" || locale === "ru";
  const loginLabel = locale === "hy" ? "Մուտք" : locale === "ru" ? "Войти" : "Log in";
  const headerAuthBtnClass =
    "inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold";
  const createDealCtaClass = `${headerAuthBtnClass} bg-[#F2A800] font-extrabold text-slate-900 shadow-lg shadow-amber-800/25 transition-all duration-200 hover:!bg-[#F2A800] hover:!text-slate-900 hover:shadow-lg hover:shadow-amber-800/35 hover:-translate-y-0.5 active:translate-y-0 active:!bg-[#F2A800] active:!text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/40`;
  return (
    <ComingSoonOverlay>
    <div className="flex min-h-screen w-full min-w-0 max-w-[100%] flex-col overflow-x-hidden bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white shadow-lg shadow-black/10">
        <div className="mx-auto flex h-[76px] w-full min-w-0 max-w-[min(100%,90rem)] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:h-[84px] md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
            <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11" />
            <span className="text-lg font-bold tracking-tight md:text-xl">{t.brand}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
            <Link href="/" className="transition hover:text-slate-900">
              {t.navHome}
            </Link>
            <a href="#difference" className="transition hover:text-slate-900">
              {t.navHowItWorks}
            </a>
            <a href="#pricing" className="transition hover:text-slate-900">
              {t.navPricing}
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-label={t.langSwitcherAria}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 transition hover:opacity-85"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F2A800] via-[#D90012] to-[#0033A0] text-white shadow-sm">
                  <Globe className="h-5 w-5" />
                </span>
              </button>
              {langMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {langButtons.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLocale(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                        locale === item.code ? "bg-slate-100 text-[#0033A0]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {locale === item.code ? <Check className="h-4 w-4" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <Link
              href="/login?next=%2Fdashboard"
              className={`${headerAuthBtnClass} border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-900`}
            >
              {loginLabel}
            </Link>
            <OrangeButton
              href="/register?next=%2Fdashboard"
              className={`${createDealCtaClass} !h-10 !min-h-0 !px-5 !py-0 !text-sm sm:!text-sm`}
            >
              {t.btnCreateDeal}
            </OrangeButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-label={t.langSwitcherAria}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F2A800] via-[#D90012] to-[#0033A0] text-white shadow-sm">
                  <Globe className="h-4 w-4" />
                </span>
              </button>
              {langMenuOpen ? (
                <div className="absolute left-0 top-10 z-50 min-w-[150px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {langButtons.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLocale(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                        locale === item.code ? "bg-slate-100 text-[#0033A0]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {locale === item.code ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              aria-expanded={mobileOpen}
              aria-label={t.menuAria}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="/"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.navHome}
                </Link>
                <a
                  href="#difference"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.navHowItWorks}
                </a>
                <a
                  href="#pricing"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.navPricing}
                </a>
              </nav>
              <div className="my-3 h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`${headerAuthBtnClass} border border-slate-300 bg-white text-slate-700`}
                >
                  {loginLabel}
                </Link>
                <Link
                  href="/register?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className={createDealCtaClass}
                >
                  {t.btnCreateDeal}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden" style={{ background: SITE_BG_GRADIENT }}>
        <section
          className="relative z-10 h-auto min-h-screen w-full min-w-0 overflow-x-hidden pb-12 pt-8 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.14)] md:pb-24 md:pt-14"
          style={{ background: SITE_BG_GRADIENT }}
        >
          {/* Tighten off-viewport blurs on small screens — full -left-32 / -right-24 widens iOS scroll width */}
          <div
            className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl sm:-left-24 sm:h-80 sm:w-80 md:-left-32 md:h-96 md:w-96"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl sm:-right-16 sm:h-72 sm:w-72 md:-right-24 md:h-80 md:w-80"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full min-w-0 max-w-[min(100%,75rem)] gap-8 px-4 sm:gap-10 md:grid-cols-2 md:items-center md:gap-16 lg:gap-20 md:px-6">
            <div
              lang={heroChipsHyRu ? locale : undefined}
              className="flex min-w-0 w-full flex-col justify-center text-left"
            >
              <p
                className={`inline-flex w-fit max-w-full flex-wrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium leading-snug text-white/90 shadow-sm backdrop-blur-sm hyphens-none break-words md:text-sm ${
                  isHy ? "flex-col items-start gap-0.5" : ""
                }`}
              >
                {isHy ? (
                  <>
                    <span className="block">Մասնագիտական վստահություն</span>
                    <span className="block">Վճարումը ժամանակին</span>
                  </>
                ) : (
                  t.heroEyebrow
                )}
              </p>
              <h1
                className={`mt-6 min-w-0 break-words font-black tracking-tight text-white hyphens-none sm:mt-8 ${
                  isHy
                    ? "text-[1.7rem] leading-[1.12] sm:text-[2rem] md:text-[2.35rem] lg:text-[2.9rem] xl:text-[3.3rem]"
                    : "text-balance text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
                }`}
              >
                {isHy ? (
                  <span className="block text-balance">
                    Ապահովեք ձեր նախագծային{" "}
                    <span className="relative inline-block" style={{ color: ORANGE }}>
                      <span className="relative z-10">գործարքները</span>
                      <span
                        className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-orange-300/90 to-transparent"
                        aria-hidden
                      />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/25" aria-hidden />
                    </span>{" "}
                    Հայաստանում
                  </span>
                ) : (
                  <>
                    {t.heroTitleBefore}
                    <span className="relative inline" style={{ color: ORANGE }}>
                      <span className="relative z-10">{t.heroTitleHighlight}</span>
                      <span
                        className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-orange-300/90 to-transparent"
                        aria-hidden
                      />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/25" aria-hidden />
                    </span>
                    {t.heroTitleAfter}
                  </>
                )}
              </h1>
              <p
                className={`mt-4 w-full text-left text-sm font-medium leading-relaxed text-white/85 hyphens-none break-words sm:mt-6 sm:text-base md:text-lg lg:text-xl ${
                  isHy ? "max-w-[640px]" : "max-w-[800px]"
                }`}
              >
                {t.heroSubtitle}
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/register?next=%2Fdashboard"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#DC2626] px-6 text-sm font-semibold text-white shadow-sm shadow-red-900/30 transition hover:bg-[#B91C1C] sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                >
                  {t.btnProtectProject}
                </Link>
                <OutlineLightButton href="/#difference" className="h-11 w-full border-white/40 px-6 sm:h-12 sm:w-auto sm:px-8">
                  {t.btnSeeHow}
                </OutlineLightButton>
              </div>
              <ul className="mt-8 flex w-full min-w-0 max-w-full flex-wrap justify-start gap-3 text-sm text-white/90 sm:mt-10 sm:gap-4">
                <li className="flex max-w-full items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-orange-200 shadow-sm ring-1 ring-white/20">
                    <Shield className="h-4 w-4 shrink-0 text-orange-200" strokeWidth={2} />
                  </span>
                  <span
                    className={`max-w-full text-left font-medium leading-snug ${heroChipsHyRu ? "min-w-min whitespace-normal hyphens-none break-words" : ""}`}
                  >
                    {t.cardChip1}
                  </span>
                </li>
                <li className="flex max-w-full items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-orange-200 shadow-sm ring-1 ring-white/20">
                    <FileText className="h-4 w-4 shrink-0 text-orange-200" strokeWidth={2} />
                  </span>
                  <span
                    className={`max-w-full text-left font-medium leading-snug ${heroChipsHyRu ? "min-w-min whitespace-normal hyphens-none break-words" : ""}`}
                  >
                    {t.cardChip2}
                  </span>
                </li>
              </ul>
            </div>

            <div className="relative w-full min-w-0 pb-10 sm:pb-14 lg:pb-12">
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-100/50 blur-sm"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.04]">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    {[0, 1, 2].map((index) => (
                      <button
                        key={`hero-slide-dot-header-${index}`}
                        type="button"
                        aria-label={`${t.heroSlideAria} ${index + 1}`}
                        aria-current={activeHeroSlide === index ? "true" : undefined}
                        onClick={() => setActiveHeroSlide(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      >
                        <span
                          className={`h-3.5 w-3.5 rounded-full transition-all ${
                            activeHeroSlide === index
                              ? `scale-110 ${heroDotStyles[index].active}`
                              : heroDotStyles[index].inactive
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-right text-[11px] font-medium text-slate-400">vstah.app</span>
                </div>
                <div className="w-full min-w-0 overflow-hidden">
                  <div
                    className="flex w-full min-w-0 will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
                  >
                  <article className="w-full min-w-0 shrink-0 grow-0 basis-full">
                    <div className="p-5 text-slate-900 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                        <div>
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                            {t.projectLabel}{" "}
                            <span className="text-slate-900">{t.projectId}</span>
                          </p>
                          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{t.projectTitle}</h2>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t.projectStatus}
                        </span>
                      </div>
                      <div className="mt-5 overflow-hidden rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] p-5 text-white shadow-inner sm:p-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.fundsLabel}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                          450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                        </p>
                        <p className="mt-2 text-sm font-medium text-white/90">{t.lockedNote}</p>
                      </div>
                      <ul className="mt-5 space-y-2.5">
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{t.stage1Name}</p>
                            <p className="text-xs font-medium text-slate-500">{t.stage1Amount}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                            {t.stage1State}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{t.stage2Name}</p>
                            <p className="text-xs font-medium text-slate-500">{t.stage2Amount}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                            <Lock className="h-3 w-3" strokeWidth={2.5} />
                            {t.stage2State}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{t.stage3Name}</p>
                            <p className="text-xs font-medium text-slate-500">{t.stage3Amount}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                            <Clock className="h-3 w-3" strokeWidth={2.5} />
                            {t.stage3State}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </article>

                  <article className="w-full min-w-0 shrink-0 grow-0 basis-full">
                    <div className="p-5 text-slate-900 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                            {t.projectLabel} <span className="text-slate-900">#AM-2842</span>
                          </p>
                          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{t.agreementPreviewTitle}</h2>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20">
                          <Clock className="h-3.5 w-3.5" />
                          {t.pendingDeposit}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.clientLabel}</p>
                          <p className="text-xs font-semibold text-slate-700">Aram Petrosyan</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.serviceAreaLabel}</p>
                          <p className="text-xs font-semibold text-slate-700">Yerevan</p>
                        </div>
                        <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold text-slate-500">{t.termsSnapshot}</p>
                          <p className="mt-1 text-xs text-slate-700">{t.termsSnapshotText}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">{t.milestoneDemolition}</p>
                          <p className="mt-1 text-[11px] font-bold text-blue-900">{t.stateLocked}</p>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">{t.milestonePlumbing}</p>
                          <p className="mt-1 text-[11px] font-bold text-blue-900">{t.stateLocked}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{t.milestoneFinishing}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-700">{t.statePending}</p>
                        </div>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] p-4 text-white shadow-inner sm:p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.awaitingFundsEscrow}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                          450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-white/90">{t.depositRequired}</p>
                      </div>
                      <button
                        type="button"
                        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#DC2626] px-4 text-sm font-semibold text-white shadow-sm shadow-red-900/30 transition hover:bg-[#B91C1C]"
                      >
                        {t.depositFunds}
                      </button>
                    </div>
                  </article>

                  <article className="w-full min-w-0 shrink-0 grow-0 basis-full">
                    <div className="p-5 text-slate-900 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                        <div>
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                            {t.projectLabel} <span className="text-slate-900">{t.projectId}</span>
                          </p>
                          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{t.providerDashboardTitle}</h2>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t.completed}
                        </span>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] p-4 text-white shadow-inner sm:p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.totalTransferred}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                          2,450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-white/90">{t.agreementsTrackedMonth}</p>
                      </div>

                      <ul className="mt-5 space-y-2.5">
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">Agreement #AM-2841</p>
                            <p className="text-xs font-medium text-slate-500">{t.finalPayoutCompleted}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                            {t.statusPaid}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">Agreement #AM-2843</p>
                            <p className="text-xs font-medium text-slate-500">{t.fundsSecuredEscrow}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                            <Lock className="h-3 w-3" strokeWidth={2.5} />
                            {t.statusSecured}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">Agreement #AM-2844</p>
                            <p className="text-xs font-medium text-slate-500">{t.awaitingClientDeposit}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                            <Clock className="h-3 w-3" strokeWidth={2.5} />
                            {t.statePending}
                          </span>
                        </li>
                      </ul>

                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-900">{t.releaseProgress}</p>
                          <span className="text-[11px] font-semibold text-emerald-700">72%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
                          <div className="h-full w-[72%] rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </article>
                  </div>
                </div>
              </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 z-10 w-[min(100%,22rem)] -translate-x-1/2 px-2 sm:w-full sm:max-w-sm">
                <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700">
                  {t.cardMediation}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white py-12 text-slate-900 md:py-16">
          <div className="mx-auto grid w-full max-w-none grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6 md:px-6">
            {[
              { text: t.feature1, icon: ShieldCheck },
              { text: t.feature2, icon: Wallet },
              { text: t.feature3, icon: Flag },
              { text: t.feature4, icon: Shield }
            ].map(({ text, icon: Icon }, index) => (
              <div
                key={`feature-${index}`}
                className="group flex min-h-[4.75rem] w-full min-w-0 max-w-none items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ring-1 ring-slate-100/70 transition-colors duration-200 hover:from-blue-50 hover:to-blue-50 md:min-h-[5rem] md:p-5"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E30A17] text-white shadow-md transition-colors duration-200 group-hover:bg-[#F2A800] group-hover:text-slate-900"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <p className="min-w-0 flex-1 break-words pt-1 font-extrabold leading-snug text-[clamp(12px,1.2vw,16px)]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="difference" className="scroll-mt-28 bg-slate-100 py-16 text-slate-900 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-slate-500">{t.diffEyebrow}</p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
              {t.diffTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base font-medium text-slate-700 md:text-lg">{t.diffSubtitle}</p>

            {/* Narrow screens: stacked cards */}
            <div className="mt-10 flex flex-col gap-5 md:hidden">
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ backgroundColor: "#0f43ac" }}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">{t.recommended}</p>
                    <p className="text-3xl font-black leading-none md:text-[2.1rem]">{t.colWith}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`with-${row.label}`} className="flex items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-blue-50">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900">{row.label}</p>
                        <p className="text-[15px] leading-relaxed text-slate-600">{row.withVstah}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-br from-red-900 via-neutral-950 to-black px-5 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-200/85">{t.diffWithoutEyebrow}</p>
                    <p className="text-3xl font-black leading-none text-white md:text-[2.1rem]">{t.colWithout}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`without-${row.label}`} className="flex items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-blue-50">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900">{row.label}</p>
                        <p className="text-[15px] leading-relaxed text-slate-600">{row.withoutUs}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            {/* md+: each comparison row is one CSS grid row — horizontal rules stay aligned */}
            <div className="mt-10 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 md:block">
              <div className="grid grid-cols-2 border-b border-slate-100">
                <div className="flex items-center gap-3 border-r border-slate-100 px-5 py-4 text-white" style={{ backgroundColor: "#0f43ac" }}>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">{t.recommended}</p>
                    <p className="text-3xl font-black leading-none md:text-[2.1rem]">{t.colWith}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-red-900 via-neutral-950 to-black px-5 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-200/85">{t.diffWithoutEyebrow}</p>
                    <p className="text-3xl font-black leading-none text-white md:text-[2.1rem]">{t.colWithout}</p>
                  </div>
                </div>
              </div>
              {t.comparisonRows.map((row) => (
                <div
                  key={`row-${row.label}`}
                  className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3 border-r border-slate-100 px-5 py-4 transition-colors duration-200 hover:bg-blue-50">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900">{row.label}</p>
                      <p className="text-[15px] leading-relaxed text-slate-600">{row.withVstah}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-blue-50">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                      <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900">{row.label}</p>
                      <p className="text-[15px] leading-relaxed text-slate-600">{row.withoutUs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-28 border-t border-white/10 bg-white py-16 text-slate-900 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-center text-xs font-black uppercase tracking-[0.25em]" style={{ color: NAVY }}>
              {t.processEyebrow}
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
              {t.processTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base font-medium text-slate-700 md:text-lg">{t.processSubtitle}</p>

            <div className="relative mt-14">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-1 rounded-full opacity-40 lg:block" style={{ background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)` }} aria-hidden />
              <ol className="relative grid gap-8 lg:grid-cols-4">
                {t.processSteps.map((step, idx) => {
                  const Icon = processIcons[Math.min(idx, processIcons.length - 1)] ?? FileText;
                  return (
                    <li
                      key={step.step}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-lg transition-colors duration-200 hover:border-slate-200 hover:bg-blue-50"
                    >
                      <span className="absolute right-4 top-4 font-mono text-5xl font-black text-slate-100">{step.step}</span>
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0033A0] text-white shadow-lg transition-colors duration-200 group-hover:bg-[#F2A800] group-hover:text-slate-900">
                        <Icon className="h-7 w-7" strokeWidth={2} />
                      </div>
                      <h3 className="relative mt-5 text-lg font-black" style={{ color: NAVY }}>
                        {step.title}
                      </h3>
                      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                      <div className="relative mt-4 flex items-center gap-1 text-xs font-bold uppercase" style={{ color: RED }}>
                        <ArrowRight className="h-4 w-4" />
                        VSTAH
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16" style={{ background: SITE_BG_GRADIENT }}>
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${RED}, transparent 40%)` }} aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 text-center md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">{t.disputeEyebrow}</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">{t.disputeTitle}</h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-white/90 md:text-lg">{t.disputeBody}</p>
            <div className="mt-8 flex justify-center">
              <OrangeButton
                href="/register?next=%2Fdashboard"
                className="hover:!bg-[#E30A17] hover:!text-white hover:shadow-[0_14px_36px_-6px_rgba(227,10,23,0.45)] active:!bg-[#c40914] focus-visible:!outline-[#E30A17]"
              >
                {t.btnStartProtected}
              </OrangeButton>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
              {[
                { main: t.badge24h, sub: t.badge24hSub, icon: Headphones },
                { main: t.badgeLaw, sub: t.badgeLawSub, icon: Layers },
                { main: t.badgeMed, sub: t.badgeMedSub, icon: ListOrdered }
              ].map(({ main, sub, icon: Icon }, idx) => (
                <div
                  key={`dispute-badge-${idx}`}
                  className="flex min-h-[12rem] min-w-0 flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white backdrop-blur-sm sm:min-h-[13rem]"
                >
                  <Icon className="h-6 w-6 shrink-0" style={{ color: ORANGE }} />
                  <p className={`mt-2 text-center font-black leading-tight [overflow-wrap:anywhere] ${isHy ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
                    {main}
                  </p>
                  <p
                    className="mt-2 min-w-0 max-w-full text-center text-xs font-medium leading-snug text-white/85 [overflow-wrap:anywhere] sm:text-sm"
                    title={sub}
                  >
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section
          id="pricing"
          className="relative scroll-mt-28 bg-slate-50 py-12 md:py-14"
          aria-label={t.pricingTitle}
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="rounded-2xl bg-white/95 p-6 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] backdrop-blur-sm md:p-8">
              <div className="flex flex-col gap-6 md:gap-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 md:gap-8">
                  <div className="min-w-0 flex-1 sm:max-w-md lg:max-w-lg">
                  <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: NAVY }}>
                    {t.pricingPlanName}
                  </p>
                  <h2
                    className={`mt-2 font-black leading-tight tracking-tight text-slate-900 ${
                      pricingLongLocale ? "text-xl sm:text-2xl" : "text-2xl md:text-[1.65rem]"
                    }`}
                  >
                    {t.pricingTitle}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                    {t.pricingSubtitle}
                  </p>
                </div>

                <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,20rem)]">
                  <div
                    className="flex min-h-[4.5rem] items-center justify-center rounded-2xl border border-amber-700/30 px-5 py-4 text-center shadow-sm ring-1 ring-amber-900/15 sm:min-h-0 sm:justify-start sm:px-6 sm:py-5 sm:text-left"
                    style={{ backgroundColor: ORANGE }}
                  >
                    <p
                      className={`whitespace-nowrap font-black tabular-nums leading-tight tracking-tight text-slate-900 ${
                        pricingLongLocale ? "text-2xl sm:text-3xl" : "text-3xl md:text-4xl"
                      }`}
                    >
                      {formatProMonthly(t.pricingPerMonth, locale)}
                    </p>
                  </div>
                </div>
                </div>

                <div className="flex flex-col gap-5 border-t border-slate-200/80 pt-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <ul className="min-w-0 flex-1 space-y-3 md:max-w-xl lg:max-w-2xl">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/15">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-snug text-slate-800 [overflow-wrap:anywhere]">
                      {t.pricingValueFree}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0033A0] ring-1 ring-[#0033A0]/15">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-snug text-slate-700 [overflow-wrap:anywhere]">
                      {t.pricingValuePro}
                    </span>
                  </li>
                </ul>

                <Link
                  href="/register?next=%2Fdashboard"
                  className={`group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0033A0] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#0033A0]/30 transition hover:bg-[#002a7a] hover:shadow-xl hover:shadow-[#0033A0]/35 hover:-translate-y-0.5 active:translate-y-0 md:w-auto md:self-end ${
                    pricingLongLocale
                      ? "max-w-full text-center text-sm leading-snug sm:px-6 lg:max-w-[15rem] xl:max-w-[17rem]"
                      : "text-sm sm:px-6 lg:min-w-[12.5rem]"
                  }`}
                >
                  <span className="[overflow-wrap:anywhere]">{t.pricingCta}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" strokeWidth={2.5} />
                </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 py-10 text-slate-700 md:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.6fr_1fr_1fr] md:gap-10 md:px-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-9 w-9 shrink-0 object-contain" />
              <span className="text-lg font-bold tracking-tight md:text-xl" style={{ color: NAVY }}>
                {t.brand}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">{t.footerTagline}</p>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <Link href="/" className="font-medium text-slate-900 underline-offset-4 transition hover:underline">
                {t.navHome}
              </Link>
            </p>
            <p>
              <Link href="/terms" className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline">
                {t.footerTerms}
              </Link>
            </p>
            <p>
              <Link href="/privacy" className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline">
                {t.footerPrivacy}
              </Link>
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <p className="font-medium text-slate-900">{t.footerFollow}</p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://instagram.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#E4405F] transition hover:opacity-90"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1877F2] transition hover:opacity-90"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-slate-500">{t.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
    </ComingSoonOverlay>
  );
}
