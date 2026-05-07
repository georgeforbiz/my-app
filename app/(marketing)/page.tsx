"use client";

import Link from "next/link";
import { OrangeButton, OutlineLightButton } from "@/components/vstah-button";
import { NAVY, ORANGE, RED } from "@/lib/brand";
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
  Flag,
  Instagram,
  Landmark,
  ListOrdered,
  Lock,
  Menu,
  Phone,
  Scale,
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
  footerPhoneLabel: string;
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
};

const translations: Record<Locale, TranslationBundle> = {
  en: {
    brand: "VSTAH.am",
    navHome: "Home",
    navHowItWorks: "How it works",
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
        title: "Automatic Milestone Payouts",
        desc: "Get paid instantly as each stage is completed and approved."
      }
    ],
    disputeEyebrow: "Dispute Resolution",
    disputeTitle: "We protect your business if things go sideways.",
    disputeBody:
      "Our Armenian experts mediate to ensure you get paid for the work you've done. Fair, fast, and 100% based on local law to reach a professional resolution.",
    badge24h: "Fast Support",
    badge24hSub: "24h response time to address any issues and keep your project moving.",
    badgeLaw: "Fully Legal",
    badgeLawSub: "100% compliant with Armenian law, providing a solid legal foundation for every deal.",
    badgeMed: "Quick Resolution",
    badgeMedSub: "Simple 3-step process to settle disagreements without wasting time or money.",
    footerTagline: "Building Trust in Every Project",
    footerRights: "© 2026 VSTAH.am. All rights reserved.",
    footerPhoneLabel: "Phone",
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
    releaseProgress: "Release progress"
  },
  hy: {
    brand: "VSTAH.am",
    navHome: "Գլխավոր",
    navHowItWorks: "Աշխատանքի սկզբունքը",
    btnCreateDeal: "Բացել գործարք",
    btnProtectProject: "Պաշտպանել իմ նախագիծը",
    btnSeeHow: "Տեսնել մեխանիզմը",
    btnStartProtected: "Սկսել պաշտպանված նախագիծ",
    heroEyebrow: "Կառուցում ենք մասնագիտական վստահություն։ Վճարումները՝ ժամանակին։",
    heroTitleBefore: "Պաշտպանեք ձեր ",
    heroTitleHighlight: "նախագծային գործարքները",
    heroTitleAfter: " Հայաստանում",
    heroSubtitle:
      "Դադարեք վճարումներ հետապնդել։ Աշխատեք վստահությամբ։ VSTAH-ը պահում է միջոցները և պատրաստում թողարկման համար։",
    cardChip1: "Պաշտպանված նախագծային դեպոզիտ",
    cardChip2: "Թվային աշխատանքային պայմանագիր",
    projectLabel: "Նախագիծ",
    projectId: "#AM-2841",
    projectTitle: "Բնակարանի վերանորոգում",
    projectStatus: "Ակտիվ",
    fundsLabel: "Միջոցները էսկրոու հաշվին",
    lockedNote: "Պահպանվում է 3 փուլով",
    stage1Name: "Քանդում և նախապատրաստում",
    stage1Amount: "150,000 ֏",
    stage1State: "Արձակված",
    stage2Name: "Ջրմուղություն և էլեկտրիկա",
    stage2Amount: "200,000 ֏",
    stage2State: "Կողպված",
    stage3Name: "Վերջնահարդարում",
    stage3Amount: "100,000 ֏",
    stage3State: "Սպասում",
    cardMediation: "Միջոցները պաշտպանված են և կարգավորվում են ՀՀ իրավական դաշտում",
    cardTagline1: "Կանխեք վեճերը։",
    cardTagline2: "Առաջ մղեք նախագիծը։",
    feature1: "Հաստատված միջոցներ։",
    feature2: "Երաշխավորված վճարումներ։",
    feature3: "Նախագծված է Հայաստանի շուկայի համար։",
    feature4: "Ապահով գործարքներ։",
    diffEyebrow: "Տարբերությունը",
    diffTitle: "VSTAH-ով և առանց VSTAH-ի",
    diffSubtitle:
      "Կանխեք հակասությունները դեռ մեկնարկից առաջ։ Տեսեք, թե ինչպես է VSTAH-ը պաշտպանում ձեր նախագիծը։",
    recommended: "(Առաջարկվող)",
    colWith: "VSTAH-ով",
    colWithout: "Առանց մեզ",
    diffWithoutEyebrow: "(Հին մոտեցում)",
    comparisonRows: [
      {
        label: "Վճարման անվտանգություն",
        withVstah: "Միջոցները կողպվում են էսկրոուում մինչև մեկնարկը",
        withoutUs: "Մնում է հույս դնել, որ պատվիրատուն կվճարի հետո"
      },
      {
        label: "Թվային պայմանագիր",
        withVstah: "Մասնագիտական պայմանագիր՝ երկու կողմի հաստատմամբ",
        withoutUs: "Բանավոր խոստումներ և WhatsApp հաղորդագրություններ"
      },
      {
        label: "Նախագծի փուլեր",
        withVstah: "Վճարում՝ յուրաքանչյուր ավարտված փուլի համար",
        withoutUs: "Սպասում ամբողջ վճարմանը վերջում"
      },
      {
        label: "Վեճեր",
        withVstah: "Միջոցները պաշտպանված են մինչև տեղական միջնորդության ավարտը",
        withoutUs: "Անձնական վեճեր և կորցրած ժամանակ"
      },
      {
        label: "Թափանցիկություն",
        withVstah: "Աշխատանքի լիարժեք ապացույց՝ ժամային նշումներով",
        withoutUs: "Կոմունիկացիոն խզումներ և թյուրըմբռնումներ"
      },
      {
        label: "Պրոֆեսիոնալիզմ",
        withVstah: "Երաշխավորված է համակարգով, ոչ թե խոստումներով",
        withoutUs: "Կախված է անձնական կապերից"
      }
    ],
    processEyebrow: "Գործընթաց",
    processTitle: "Ինչպես է դա աշխատում",
    processSubtitle:
      "Չորս պարզ քայլ, զրո անորոշություն։ Պրոֆեսիոնալ գործարքներ՝ լիովին պաշտպանված։",
    processSteps: [
      {
        step: "01",
        title: "Ստեղծեք նախագծային գործարքը",
        desc: "Մի քանի րոպեում սահմանեք ծավալը, փուլերն ու արժեքը։"
      },
      {
        step: "02",
        title: "Ստուգեք պաշտպանված միջոցները",
        desc: "Միջոցները կողպված են էսկրոուում․ գումարը պատրաստ է մինչև մեկնարկը։"
      },
      {
        step: "03",
        title: "Աշխատեք վստահությամբ",
        desc: "Սկսեք նախագիծը՝ իմանալով, որ վճարումը երաշխավորված է։"
      },
      {
        step: "04",
        title: "Ավտոմատ փուլային վճարումներ",
        desc: "Ստացեք վճարումը անմիջապես՝ յուրաքանչյուր փուլի ավարտից ու հաստատումից հետո։"
      }
    ],
    disputeEyebrow: "Վեճերի կարգավորում",
    disputeTitle: "Մենք պաշտպանում ենք ձեր բիզնեսը, եթե ընթացքը շեղվում է։",
    disputeBody:
      "Մեր հայ մասնագետները միջնորդում են, որ դուք ստանաք ձեր կատարած աշխատանքի վճարումը։ Արդար, արագ և 100%՝ տեղական իրավունքի հիմքով։",
    badge24h: "Օպերատիվ աջակցություն",
    badge24hSub: "24 ժամում արձագանք՝ հարցերը լուծելու և նախագիծը շարունակելու համար։",
    badgeLaw: "Իրավական համապատասխանություն",
    badgeLawSub: "100% համապատասխան ՀՀ օրենսդրությանը՝ յուրաքանչյուր գործարքի համար ամուր իրավական հիմքով։",
    badgeMed: "Արագ կարգավորում",
    badgeMedSub: "Պարզ 3-քայլանոց գործընթաց՝ վեճերը լուծելու առանց ժամանակ ու գումար կորցնելու։",
    footerTagline: "Վստահություն յուրաքանչյուր նախագծում` պաշտպանված վճարումներով սկզբից մինչև ավարտ։",
    footerRights: "© 2026 VSTAH.am։ Բոլոր իրավունքները պաշտպանված են։",
    footerPhoneLabel: "Հեռախոս",
    footerTerms: "Ծառայության պայմաններ",
    footerPrivacy: "Գաղտնիության քաղաքականություն",
    footerFollow: "Հետևեք մեզ",
    tableCategory: "Թեմա",
    heroSlideAria: "Անցնել հերո սլայդին",
    langSwitcherAria: "Փոխել լեզուն",
    menuAria: "Մենյու",
    completionDashboard: "Կատարման ցուցատախտակ",
    successCompleted: "Հաջողված ավարտ. պայմանագիրն ավարտված է",
    leaveFeedback: "Թողնել գնահատական",
    awaitingFundsEscrow: "Միջոցները սպասման մեջ են էսկրոուում",
    depositRequired: "Դեպոզիտը պահանջվում է մինչև ցանկացած վճարման բաց թողնում։",
    setupDashboard: "Մեկնարկի ցուցատախտակ",
    totalTransferred: "Ընդհանուր փոխանցված",
    allMilestonesCompleted: "Բոլոր փուլերը հաջողությամբ ավարտված են։",
    milestoneDemolition: "Քանդում",
    milestonePlumbing: "Ջրմուղ",
    milestoneFinishing: "Հարդարում",
    stateLocked: "Կողպված",
    statePending: "Սպասման մեջ",
    stateReleased: "Արձակված",
    agreementPreviewTitle: "Պայմանագրի նախադիտում",
    pendingDeposit: "Սպասվող դեպոզիտ",
    clientLabel: "Հաճախորդ",
    serviceAreaLabel: "Սպասարկման տարածք",
    termsSnapshot: "Պայմանների ամփոփում",
    termsSnapshotText: "Պաշտպանված միջոցները ազատվում են ավտոմատ՝ փուլի ավարտից հետո։",
    depositFunds: "Դեպոզիտ անել միջոցները",
    providerDashboardTitle: "Մատակարարի վահանակ",
    agreementsTrackedMonth: "18 պայմանագիր՝ ընթացիկ ամսում",
    finalPayoutCompleted: "Վերջնական վճարումը ավարտված է",
    fundsSecuredEscrow: "Միջոցները ապահովված են էսկրոուում",
    awaitingClientDeposit: "Սպասում է հաճախորդի դեպոզիտին",
    statusPaid: "Վճարված",
    statusSecured: "Ապահովված",
    completed: "Ավարտված",
    releaseProgress: "Ազատման ընթացք"
  },
  ru: {
    brand: "VSTAH.am",
    navHome: "Главная",
    navHowItWorks: "Принцип работы",
    btnCreateDeal: "Открыть сделку",
    btnProtectProject: "Защитить проект",
    btnSeeHow: "Смотреть механизм",
    btnStartProtected: "Начать защищённый проект",
    heroEyebrow: "Укрепляем профессиональное доверие. Оплата — вовремя.",
    heroTitleBefore: "Защитите ",
    heroTitleHighlight: "сделки по проекту",
    heroTitleAfter: " в Армении",
    heroSubtitle:
      "Хватит догонять оплату. Работайте с уверенностью. VSTAH фиксирует средства и готовит их к выплате.",
    cardChip1: "Защищенный проектный депозит",
    cardChip2: "Цифровой договор на выполнение работ",
    projectLabel: "Проект",
    projectId: "#AM-2841",
    projectTitle: "Ремонт квартиры",
    projectStatus: "Активен",
    fundsLabel: "Средства в эскроу",
    lockedNote: "Зафиксировано по 3 этапам",
    stage1Name: "Демонтаж и подготовка",
    stage1Amount: "150 000 ֏",
    stage1State: "Выплачено",
    stage2Name: "Сантехника и электрика",
    stage2Amount: "200 000 ֏",
    stage2State: "Заблокировано",
    stage3Name: "Финишная отделка",
    stage3Amount: "100 000 ֏",
    stage3State: "Ожидание",
    cardMediation: "Средства защищены и регулируются в правовом поле Армении",
    cardTagline1: "Предотвратите споры.",
    cardTagline2: "Ускорьте проект.",
    feature1: "Подтвержденные средства.",
    feature2: "Гарантированные выплаты.",
    feature3: "Разработано для рынка Армении.",
    feature4: "Защищенные сделки.",
    diffEyebrow: "Разница",
    diffTitle: "С VSTAH и без VSTAH",
    diffSubtitle:
      "Предотвращайте конфликтные ситуации еще до старта. Посмотрите, как VSTAH защищает ваш проект.",
    recommended: "(Рекомендуется)",
    colWith: "С VSTAH",
    colWithout: "Без нас",
    diffWithoutEyebrow: "(Старый подход)",
    comparisonRows: [
      {
        label: "Безопасность оплаты",
        withVstah: "Средства фиксируются в эскроу до старта работ",
        withoutUs: "Остается надеяться, что клиент заплатит после"
      },
      {
        label: "Цифровой договор",
        withVstah: "Профессиональный договор с подтверждением обеих сторон",
        withoutUs: "Устные обещания и переписка в WhatsApp"
      },
      {
        label: "Этапы проекта",
        withVstah: "Оплата за каждый завершенный этап",
        withoutUs: "Ожидание полной оплаты в конце"
      },
      {
        label: "Споры",
        withVstah: "Средства защищены до завершения локальной медиации",
        withoutUs: "Личные конфликты и потеря времени"
      },
      {
        label: "Прозрачность",
        withVstah: "Полное подтверждение работ с временными метками",
        withoutUs: "Недопонимание и сбои в коммуникации"
      },
      {
        label: "Профессионализм",
        withVstah: "Гарантируется системой, а не обещаниями",
        withoutUs: "Зависимость от личных связей"
      }
    ],
    processEyebrow: "Процесс",
    processTitle: "Как это работает",
    processSubtitle:
      "Четыре простых шага. Ноль неопределенности. Профессиональные сделки под полной защитой.",
    processSteps: [
      {
        step: "01",
        title: "Создайте проектную сделку",
        desc: "За несколько минут задайте объем, этапы и стоимость."
      },
      {
        step: "02",
        title: "Проверьте защищенные средства",
        desc: "Средства зафиксированы в эскроу. Деньги готовы до старта."
      },
      {
        step: "03",
        title: "Работайте с уверенностью",
        desc: "Начинайте проект, зная, что оплата гарантирована и ожидает."
      },
      {
        step: "04",
        title: "Автоматические выплаты по этапам",
        desc: "Получайте оплату сразу после завершения и подтверждения каждого этапа."
      }
    ],
    disputeEyebrow: "Урегулирование споров",
    disputeTitle: "Мы защищаем ваш бизнес, если что-то идет не так.",
    disputeBody:
      "Наши армянские эксперты медиируют, чтобы вы получили оплату за выполненную работу. Справедливо, быстро и на 100% по местному праву.",
    badge24h: "Оперативная поддержка",
    badge24hSub: "Ответ в течение 24 часов, чтобы быстро решить вопросы и двигать проект дальше.",
    badgeLaw: "Правовая чистота",
    badgeLawSub: "100% соответствие законодательству Армении и надежная правовая база для каждой сделки.",
    badgeMed: "Быстрое урегулирование",
    badgeMedSub: "Простой 3-шаговый процесс, чтобы закрывать споры без потери времени и денег.",
    footerTagline: "Доверие в каждом проекте: защищенные платежи от старта до финального закрытия.",
    footerRights: "© 2026 VSTAH.am. Все права защищены.",
    footerPhoneLabel: "Телефон",
    footerTerms: "Условия использования",
    footerPrivacy: "Политика конфиденциальности",
    footerFollow: "Мы в соцсетях",
    tableCategory: "Тема",
    heroSlideAria: "Перейти к слайду героя",
    langSwitcherAria: "Сменить язык",
    menuAria: "Меню",
    completionDashboard: "Панель завершения",
    successCompleted: "Успешно: договор исполнен",
    leaveFeedback: "Оставить отзыв",
    awaitingFundsEscrow: "Средства ожидают размещения в эскроу",
    depositRequired: "Для разблокировки выплат требуется внесение депозита.",
    setupDashboard: "Панель запуска",
    totalTransferred: "Итого переведено",
    allMilestonesCompleted: "Все этапы успешно завершены.",
    milestoneDemolition: "Демонтаж",
    milestonePlumbing: "Сантехника",
    milestoneFinishing: "Отделка",
    stateLocked: "Заблокировано",
    statePending: "Ожидание",
    stateReleased: "Выплачено",
    agreementPreviewTitle: "Предпросмотр соглашения",
    pendingDeposit: "Ожидается депозит",
    clientLabel: "Клиент",
    serviceAreaLabel: "Регион услуг",
    termsSnapshot: "Сводка условий",
    termsSnapshotText: "Защищенные средства автоматически выплачиваются после завершения этапа.",
    depositFunds: "Внести депозит",
    providerDashboardTitle: "Панель исполнителя",
    agreementsTrackedMonth: "18 соглашений в этом месяце",
    finalPayoutCompleted: "Финальная выплата завершена",
    fundsSecuredEscrow: "Средства защищены в эскроу",
    awaitingClientDeposit: "Ожидается депозит клиента",
    statusPaid: "Оплачено",
    statusSecured: "Защищено",
    completed: "Завершено",
    releaseProgress: "Прогресс выплат"
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
  const loginLabel = locale === "hy" ? "Մուտք" : locale === "ru" ? "Войти" : "Log in";
  const createDealCtaClass =
    "inline-flex items-center justify-center rounded-xl bg-[#F2A800] px-4 py-2.5 text-sm font-extrabold text-slate-900 shadow-lg shadow-amber-800/25 transition hover:bg-[#D99000] hover:brightness-105";
  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-[100%] flex-col overflow-x-clip bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white shadow-lg shadow-black/10">
        <div className="mx-auto flex h-[76px] w-full min-w-0 max-w-[min(100%,90rem)] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:h-[84px] md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
            <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-10 w-10 md:h-11 md:w-11" />
            <span className="text-lg font-bold tracking-tight md:text-xl">{t.brand}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
            <Link href="/" className="transition hover:text-slate-900">
              {t.navHome}
            </Link>
            <a href="#difference" className="transition hover:text-slate-900">
              {t.navHowItWorks}
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {loginLabel}
            </Link>
            <OrangeButton href="/register?next=%2Fdashboard" className={`${createDealCtaClass} px-6 py-3 text-base sm:px-7 sm:py-3.5`}>
              + {t.btnCreateDeal}
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
              </nav>
              <div className="my-3 h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
                >
                  {loginLabel}
                </Link>
                <Link
                  href="/register?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`${createDealCtaClass} h-11 text-base`}
                >
                  + {t.btnCreateDeal}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="min-w-0 flex-1 overflow-x-clip" style={{ backgroundColor: NAVY }}>
        <section className="relative h-auto min-h-screen w-full min-w-0 overflow-x-clip border-b border-white/10 pb-12 pt-8 md:overflow-hidden md:pb-24 md:pt-14">
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
              <p className="inline-flex w-fit max-w-full flex-wrap rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium leading-snug text-white/90 shadow-sm backdrop-blur-sm hyphens-none break-words md:text-sm">
                {t.heroEyebrow}
              </p>
              <h1
                className={`mt-6 min-w-0 break-words font-black tracking-tight text-white hyphens-none sm:mt-8 ${
                  isHy
                    ? "text-[1.7rem] leading-[1.12] sm:text-[2rem] md:text-[2.35rem] lg:text-[2.9rem] xl:text-[3.3rem]"
                    : "text-balance text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
                }`}
              >
                {isHy ? (
                  <>
                    <span className="block">Պաշտպանեք</span>
                    <span className="block">ձեր նախագծային</span>
                    <span className="block">
                      <span className="relative inline-block" style={{ color: ORANGE }}>
                        <span className="relative z-10">գործարքները</span>
                        <span
                          className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-orange-300/90 to-transparent"
                          aria-hidden
                        />
                        <span className="absolute bottom-0 left-0 right-0 h-px bg-white/25" aria-hidden />
                      </span>
                    </span>
                    <span className="block">Հայաստանում</span>
                  </>
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
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-100/50 blur-sm" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]">
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
                    className="flex w-full will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
              <div className="absolute -bottom-2 left-1/2 z-10 w-[min(100%,22rem)] -translate-x-1/2 px-2 sm:w-full sm:max-w-sm">
                <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10">
                  {t.cardMediation}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white py-12 text-slate-900 md:py-16">
          <div className="mx-auto grid w-full max-w-none grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6 md:px-6">
            {[
              { text: t.feature1, icon: ShieldCheck },
              { text: t.feature2, icon: Wallet },
              { text: t.feature3, icon: Flag },
              { text: t.feature4, icon: Shield }
            ].map(({ text, icon: Icon }, index) => (
              <div
                key={`feature-${index}`}
                className="flex min-h-[4.75rem] w-full min-w-0 max-w-none items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ring-1 ring-slate-100/70 md:min-h-[5rem] md:p-5"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  style={{ backgroundColor: RED }}
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
                    <li key={`with-${row.label}`} className="flex items-start gap-3 px-5 py-4">
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
                    <li key={`without-${row.label}`} className="flex items-start gap-3 px-5 py-4">
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
                  <div className="flex items-start gap-3 border-r border-slate-100 px-5 py-4">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900">{row.label}</p>
                      <p className="text-[15px] leading-relaxed text-slate-600">{row.withVstah}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4">
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
                  const Icon = processIcons[idx]!;
                  return (
                    <li key={step.step} className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
                      <span className="absolute right-4 top-4 font-mono text-5xl font-black text-slate-100">{step.step}</span>
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: NAVY }}>
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

        <section className="relative overflow-hidden py-16 md:py-24" style={{ backgroundColor: NAVY }}>
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${RED}, transparent 40%)` }} aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 text-center md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">{t.disputeEyebrow}</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">{t.disputeTitle}</h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-white/90 md:text-lg">{t.disputeBody}</p>
            <div className="mt-8 flex justify-center">
              <OrangeButton href="/register?next=%2Fdashboard">{t.btnStartProtected}</OrangeButton>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
              {[
                { main: t.badge24h, sub: t.badge24hSub, icon: Clock },
                { main: t.badgeLaw, sub: t.badgeLawSub, icon: Scale },
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
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-10 text-slate-700 md:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.6fr_1fr_1fr] md:gap-10 md:px-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-9 w-9 shrink-0" />
              <span className="text-lg font-bold tracking-tight md:text-xl" style={{ color: NAVY }}>
                {t.brand}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">{t.footerTagline}</p>
            <a href="tel:+37411550550" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
              <Phone className="h-4 w-4" />
              <span>
                {t.footerPhoneLabel}: +374 11 550 550
              </span>
            </a>
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
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://facebook.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1877F2] transition hover:opacity-90"
              >
                <Facebook className="h-4.5 w-4.5" />
              </a>
            </div>
            <p className="text-xs text-slate-500">{t.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
