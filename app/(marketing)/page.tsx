"use client";

import Link from "next/link";
import { FloatingPillHeader } from "@/components/floating-pill-header";
import { Reveal } from "@/components/reveal";
import { OrangeButton, OutlineLightButton } from "@/components/vstah-button";
import { MarketingPricingFaqSection } from "@/components/marketing-pricing-faq-section";
import { NAVY, ORANGE, RED, SITE_BG_GRADIENT } from "@/lib/brand";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";
import {
  AlertTriangle,
  Check,
  CircleCheck,
  Clock,
  Facebook,
  FileText,
  Hammer,
  Headphones,
  Flag,
  Instagram,
  Landmark,
  Layers,
  ListOrdered,
  Lock,
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
  btnProtectProject: string;
  btnSeeHow: string;
  btnStartProtected: string;
  heroEyebrow: string;
  /** Split headline so the renovation word can be styled (blue + underline). */
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
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
  footerCompany: string;
  footerLegal: string;
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
  faqEyebrow: string;
  faqTitle: string;
  faqSubtitle: string;
  faqs: { q: string; a: string }[];
};

const translations: Record<Locale, TranslationBundle> = {
  en: {
    brand: "VSTAH",
    navHome: "Home",
    navHowItWorks: "How it works",
    navPricing: "Pricing",
    btnProtectProject: "Try For Free",
    btnSeeHow: "See how it works",
    btnStartProtected: "Start a protected project",
    heroEyebrow: "Build Professional Trust. Get Paid on Time.",
    heroTitleBefore: "Work with confidence.",
    heroTitleHighlight: "",
    heroTitleAfter: " Get paid with certainty.",
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
    diffTitle: "Can you see the difference?",
    diffSubtitle:
      "Stop the arguments before they start. See how VSTAH protects your project.",
    recommended: "(Recommended)",
    colWith: "With VSTAH",
    colWithout: "Without Us",
    diffWithoutEyebrow: "(Old way)",
    comparisonRows: [
      {
        label: "Payment Security",
        withVstah: "Funds locked before you start",
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
        desc: "Set the scope, milestones, and costs in minutes using our structured forms."
      },
      {
        step: "02",
        title: "Verify Secured Funds",
        desc: "Funds are safely locked in a secure trust account. Money is verified before work begins."
      },
      {
        step: "03",
        title: "Work with Confidence",
        desc: "Start the project knowing the payment is fully guaranteed and waiting."
      },
      {
        step: "04",
        title: "Secured Payouts",
        desc: "Get paid safely as each stage is completed and approved by the client."
      }
    ],
    disputeEyebrow: "Support",
    disputeTitle: "Dispute Assistance",
    disputeBody:
      "We help facilitate clear and structured communication when issues arise. VSTAH provides a transparent digital framework for both parties to review the original agreement, exchange evidence, and settle conflicts independently.",
    badge24h: "Guided Resolution",
    badge24hSub:
      "A structured step by step workflow that guides both parties to review facts and reach a mutual agreement without unnecessary delays.",
    badgeLaw: "Smart Frameworks",
    badgeLawSub:
      "Contracts designed to protect service deals through clear milestones aligned with Armenian business practices, minimizing room for misunderstandings.",
    badgeMed: "Expert Intervention",
    badgeMedSub:
      "If a mutual agreement cannot be reached independently, you can unlock our official human arbitration service to evaluate the facts and deliver a definitive verdict.",
    footerTagline: "Building Trust in Every Project",
    footerRights: "© 2026 VSTAH. All rights reserved.",
    footerTerms: "Terms of Service",
    footerPrivacy: "Privacy Policy",
    footerFollow: "Follow us",
    footerCompany: "Company",
    footerLegal: "Legal",
    tableCategory: "Topic",
    heroSlideAria: "Go to hero slide",
    langSwitcherAria: "Change language",
    menuAria: "Menu",
    completionDashboard: "Completion Dashboard",
    successCompleted: "Success: Contract completed",
    leaveFeedback: "Leave Feedback",
    awaitingFundsEscrow: "Awaiting Funds",
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
    fundsSecuredEscrow: "Funds secured",
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
    pricingCta: "Start Free Trial",
    faqEyebrow: "Questions",
    faqTitle: "Frequently asked Questions",
    faqSubtitle: "Quick answers before you start your first protected deal.",
    faqs: [
      {
        q: "What is VSTAH and how does it work?",
        a: "VSTAH is a digital platform designed to secure payments and build absolute trust between businesses and clients in Armenia. The provider creates a deal and a secure payment link, and the client deposits the funds into our system. The money is locked safely and is only released to the provider once the client confirms that the work has been completed or the product delivered."
      },
      {
        q: "Is my money safe while it’s on hold?",
        a: "Absolutely. The funds are completely inaccessible to the provider and are never used for VSTAH's operations. Your money is held in a dedicated, secure institutional Trust Account at a top-tier Armenian bank, under strict monitoring, until the deal is successfully finalized."
      },
      {
        q: "How much does it cost to get started?",
        a: "Signing up and creating a deal is completely free. Our pricing model is straightforward: a flat fee of 7% per successful transaction arranged in advance, or a fixed subscription of 25,000 AMD per month for high-volume businesses. You decide who covers the fee: the provider, the client, or a 50/50 split."
      },
      {
        q: "What happens if there is a disagreement?",
        a: "Our deal-creation form enforces such clear expectations and milestones that 95% of disputes are prevented before they even start. If a conflict does arise, the money remains safely locked in the bank. If you cannot settle it independently, you can initiate our official human arbitration service for a small fee, and we will make a fair decision based on the evidence."
      },
      {
        q: "Do my clients need to create an account to sign and pay?",
        a: "No. Your client receives a direct link via text, WhatsApp, or email. They can review the terms, digitally sign with a single checkbox, and complete the secure payment via card or bank transfer in under a minute without going through any tedious registration process."
      }
    ]
  },
  hy: {
    brand: "VSTAH",
    navHome: "Գլխավոր",
    navHowItWorks: "Ինչպես է աշխատում",
    navPricing: "Գին",
    btnProtectProject: "Փորձել անվճար",
    btnSeeHow: "Տեսնել ինչպես է աշխատում",
    btnStartProtected: "Սկսել պաշտպանված նախագիծ",
    heroEyebrow: "Կառուցեք վստահելի գործարքներ · Ստացեք վճարումները ժամանակին",
    heroTitleBefore: "Աշխատեք վստահությամբ։",
    heroTitleHighlight: "",
    heroTitleAfter: " Ստացեք վճարումը վստահությամբ։",
    cardChip1: "Դեպոզիտը պահված է",
    cardChip2: "Թվային աշխատանքային պայմանագիր",
    projectLabel: "Նախագիծ",
    projectId: "#AM-2841",
    projectTitle: "Բնակարանի վերանորոգում",
    projectStatus: "Ակտիվ",
    fundsLabel: "Գումարը պահվում է",
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
    cardMediation: "Գումարը ապահովված է և տեղայնորեն պաշտպանված",
    cardTagline1: "Վեճերին վերջ։",
    cardTagline2: "Նախագիծը առաջ։",
    feature1: "Հաստատված միջոցներ",
    feature2: "Երաշխավորված վճարումներ",
    feature3: "Հայաստանի համար",
    feature4: "Ապահով գործարքներ",
    diffEyebrow: "Տարբերությունը",
    diffTitle: "Տեսնո՞ւմ եք տարբերությունը։",
    diffSubtitle:
      "Կանխեք վեճերը նախապես։ Տե՛ս՝ VSTAH-ը ինչպես է պաշտպանում նախագիծը։",
    recommended: "(Առաջարկված)",
    colWith: "VSTAH-ով",
    colWithout: "Առանց VSTAH-ի",
    diffWithoutEyebrow: "(Հին եղանակ)",
    comparisonRows: [
      {
        label: "Վճարման անվտանգություն",
        withVstah: "Մինչև մեկնարկ՝ գումարը պահված է",
        withoutUs: "Հույս ունենալ, որ հաճախորդը կվճարի աշխատանքի ավարտից հետո"
      },
      {
        label: "Թվային աշխատանքային պայմանագիր",
        withVstah: "Պայմանագիր՝ երկու ստորագրությամբ",
        withoutUs: "Բանավոր պայմանավորվածություններ և WhatsApp հաղորդագրություններ"
      },
      {
        label: "Նախագծի փուլեր",
        withVstah: "Վճարում ըստ փուլերի",
        withoutUs: "Ամբողջ վճարմանը սպասել նախագծի վերջում"
      },
      {
        label: "Վեճեր",
        withVstah: "Գումարը պաշտպանված է մինչև խնդրի լուծումը",
        withoutUs: "Անձնական վեճեր և կորցրած ժամանակ"
      },
      {
        label: "Թափանցիկություն",
        withVstah: "Աշխատանքի ապացույց · ժամանակագրություն",
        withoutUs: "Թյուրըմբռնումներ և հաղորդակցության խնդիրներ"
      },
      {
        label: "Պրոֆեսիոնալիզմ",
        withVstah: "Երաշխիք՝ պլատֆորմից",
        withoutUs: "Կախված է անձնական վստահությունից"
      }
    ],
    processEyebrow: "Գործընթացը",
    processTitle: "Ինչպես է աշխատում",
    processSubtitle:
      "Չորս պարզ քայլ։ Առանց անորոշության։ Պրոֆեսիոնալ գործարքներ՝ լիովին ապահովված։",
    processSteps: [
      {
        step: "01",
        title: "Ստեղծեք գործարքը",
        desc: "Սահմանեք ծավալը, փուլերը և արժեքը րոպեներում՝ մեր կառուցվածքային ձևերով։"
      },
      {
        step: "02",
        title: "Ստուգեք ապահով գումարը",
        desc: "Գումարը ապահով կողպված է վստահության հաշվին։ Միջոցները ստուգվում են մինչև աշխատանքի մեկնարկը։"
      },
      {
        step: "03",
        title: "Աշխատեք վստահ",
        desc: "Սկսեք նախագիծը՝ իմանալով, որ վճարումը լիովին երաշխավորված է և սպասում է։"
      },
      {
        step: "04",
        title: "Ապահով վճարումներ",
        desc: "Ստացեք վճարումը ապահով՝ յուրաքանչյուր փուլը հաճախորդի կողմից հաստատվելուց հետո։"
      }
    ],
    disputeEyebrow: "Աջակցություն",
    disputeTitle: "Վեճերի աջակցություն",
    disputeBody:
      "Մենք օգնում ենք ապահովել հստակ և կառուցվածքային հաղորդակցություն, երբ խնդիրներ են առաջանում։ VSTAH-ը թափանցիկ թվային շրջանակ է տալիս՝ երկու կողմերն էլ վերանայում են սկզբնական պայմանագիրը, փոխանակում ապացույցներ և ինքնուրույն լուծում վեճերը։",
    badge24h: "Ուղղորդված\nլուծում",
    badge24hSub:
      "Կառուցվածքային քայլ առ քայլ գործընթաց, որը օգնում է երկու կողմերին վերանայել փաստերը և հասնել փոխադարձ համաձայնության՝ առանց ավելորդ ձգձգումների։",
    badgeLaw: "Խելացի\nշրջանակներ",
    badgeLawSub:
      "Պայմանագրեր՝ ծառայությունների գործարքները պաշտպանելու համար՝ հստակ փուլերով, համահունչ հայկական բիզնես պրակտիկային, նվազեցնելով թյուրըմբռնումների հնարավորությունը։",
    badgeMed: "Փորձագիտական միջամտություն",
    badgeMedSub:
      "Եթե ինքնուրույն փոխադարձ համաձայնության չեք հասնում, կարող եք միացնել մեր պաշտոնական մարդկային արբիտրաժային ծառայությունը՝ փաստերը գնահատելու և վերջնական որոշում կայացնելու համար։",
    footerTagline: "Վստահություն յուրաքանչյուր նախագծում",
    footerRights: "© 2026 VSTAH · Բոլոր իրավունքները պաշտպանված են",
    footerTerms: "Օգտագործման պայմաններ",
    footerPrivacy: "Գաղտնիության քաղաքականություն",
    footerFollow: "Հետևեք մեզ",
    footerCompany: "Ընկերություն",
    footerLegal: "Իրավական",
    tableCategory: "Թեմա",
    heroSlideAria: "Անցնել սլայդին",
    langSwitcherAria: "Փոխել լեզուն",
    menuAria: "Մենյու",
    completionDashboard: "Ավարտման վահանակ",
    successCompleted: "Ավարտված · պայմանագիր փակված",
    leaveFeedback: "Կարծիք թողնել",
    awaitingFundsEscrow: "Սպասվող գումար",
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
    fundsSecuredEscrow: "Գումարը պահվում է",
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
    pricingCta: "Սկսել անվճար փորձարկում",
    faqEyebrow: "Հարցեր",
    faqTitle: "Հաճախ տրվող հարցեր",
    faqSubtitle: "Կարճ պատասխաններ՝ առաջին պաշտպանված գործարքը սկսելուց առաջ։",
    faqs: [
      {
        q: "Ի՞նչ է VSTAH-ը և ինչպե՞ս է աշխատում։",
        a: "VSTAH-ը թվային հարթակ է՝ վճարումները ապահովելու և Հայաստանում բիզնեսների ու հաճախորդների միջև վստահություն կառուցելու համար։ Մատակարարը ստեղծում է գործարք և անվտանգ վճարման հղում, իսկ հաճախորդը գումարը մուտքագրում է մեր համակարգ։ Գումարը ապահով կողպվում է և արձակվում է մատակարարին միայն այն ժամանակ, երբ հաճախորդը հաստատում է, որ աշխատանքն ավարտված է կամ ապրանքը մատակարարված։"
      },
      {
        q: "Ապահո՞վ է գումարս, քանի դեռ այն պահված է։",
        a: "Անշուշտ։ Գումարը լիովին անհասանելի է մատակարարին և երբեք չի օգտագործվում VSTAH-ի գործունեության համար։ Ձեր գումարը պահվում է Հայաստանի առաջատար բանկում՝ նվիրված, անվտանգ ինստիտուցիոնալ Trust Account-ում՝ խիստ վերահսկողությամբ, մինչև գործարքի հաջող ավարտը։"
      },
      {
        q: "Որքա՞ն արժե սկսելը։",
        a: "Գրանցումը և գործարքի ստեղծումը լիովին անվճար են։ Մեր գնագոյացումը պարզ է՝ կամ 7% ֆիքսված վճար յուրաքանչյուր հաջող գործարքի համար (նախապես համաձայնեցված), կամ ամսական 25,000 AMD բաժանորդագրություն՝ մեծ ծավալով աշխատող բիզնեսների համար։ Դուք որոշում եք՝ վճարը կրում է մատակարարը, հաճախորդը, թե 50/50 բաժանում։"
      },
      {
        q: "Ի՞նչ է լինում տարաձայնության դեպքում։",
        a: "Մեր գործարքի ստեղծման ձևը այնքան հստակ սպասումներ և փուլեր է սահմանում, որ վեճերի 95%-ը կանխվում է դեռ սկզբից։ Եթե հակամարտություն առաջանա, գումարը մնում է ապահով՝ բանկում կողպված։ Եթե ինքնուրույն չեք կարողանում լուծել, կարող եք սկսել մեր պաշտոնական մարդկային արբիտրաժային ծառայությունը՝ փոքր վճարով, և մենք արդար որոշում կկայացնենք՝ հիմնվելով ապացույցների վրա։"
      },
      {
        q: "Հաճախորդներս պե՞տք է հաշիվ ստեղծեն՝ ստորագրելու և վճարելու համար։",
        a: "Ոչ։ Հաճախորդը ստանում է ուղիղ հղում տեքստով, WhatsApp-ով կամ էլ․ փոստով։ Նա կարող է վերանայել պայմանները, թվայնորեն ստորագրել մեկ նշման վանդակով և անվտանգ վճարել քարտով կամ բանկային փոխանցմամբ՝ մեկ րոպեից պակասում, առանց երկար գրանցման գործընթացի։"
      }
    ]
  },
  ru: {
    brand: "VSTAH",
    navHome: "Главная",
    navHowItWorks: "Как это работает",
    navPricing: "Тарифы",
    btnProtectProject: "Попробовать бесплатно",
    btnSeeHow: "Как это устроено",
    btnStartProtected: "Начать защищённый проект",
    heroEyebrow: "Профессиональное доверие · Оплата в срок",
    heroTitleBefore: "Работайте уверенно.",
    heroTitleHighlight: "",
    heroTitleAfter: " Получайте оплату наверняка.",
    cardChip1: "Депозит удержан",
    cardChip2: "Цифровое соглашение на работы",
    projectLabel: "Проект",
    projectId: "#AM-2841",
    projectTitle: "Ремонт квартиры",
    projectStatus: "Активен",
    fundsLabel: "Средства удерживаются",
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
    cardMediation: "Средства защищены и локально охраняются",
    cardTagline1: "Меньше споров.",
    cardTagline2: "Быстрее проект.",
    feature1: "Проверенные средства.",
    feature2: "Выплаты гарантированы.",
    feature3: "Сделано для Армении.",
    feature4: "Сделки под защитой.",
    diffEyebrow: "Разница",
    diffTitle: "Видите разницу?",
    diffSubtitle:
      "Снимите риски до старта. Посмотрите, как VSTAH защищает проект.",
    recommended: "(Рекомендуем)",
    colWith: "С VSTAH",
    colWithout: "Без VSTAH",
    diffWithoutEyebrow: "(Старый способ)",
    comparisonRows: [
      {
        label: "Безопасность оплаты",
        withVstah: "Деньги удерживаются до начала работ",
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
      "Четыре простых шага. Без догадок. Профессиональные сделки под полной защитой.",
    processSteps: [
      {
        step: "01",
        title: "Создайте соглашение",
        desc: "Определите объём, этапы и стоимость за минуты с помощью наших структурированных форм."
      },
      {
        step: "02",
        title: "Проверьте защищённые средства",
        desc: "Деньги надёжно заблокированы на трастовом счёте. Средства проверяются до начала работ."
      },
      {
        step: "03",
        title: "Работайте спокойно",
        desc: "Начинайте проект, зная, что оплата полностью гарантирована и ждёт."
      },
      {
        step: "04",
        title: "Защищённые выплаты",
        desc: "Получайте оплату безопасно по мере завершения каждого этапа и подтверждения клиентом."
      }
    ],
    disputeEyebrow: "Поддержка",
    disputeTitle: "Помощь при спорах",
    disputeBody:
      "Мы помогаем выстроить ясное и структурированное общение, когда возникают проблемы. VSTAH даёт прозрачную цифровую рамку: обе стороны пересматривают исходное соглашение, обмениваются доказательствами и урегулируют конфликт самостоятельно.",
    badge24h: "Управляемое разрешение",
    badge24hSub:
      "Пошаговый процесс, который ведёт обе стороны к разбору фактов и взаимному соглашению без лишних задержек.",
    badgeLaw: "Умные рамки",
    badgeLawSub:
      "Договоры, которые защищают сервисные сделки через чёткие этапы в духе армянской бизнес-практики и снижают риск недопонимания.",
    badgeMed: "Экспертное вмешательство",
    badgeMedSub:
      "Если самостоятельно договориться не получается, вы можете подключить наш официальный сервис человеческого арбитража — мы оценим факты и вынесем окончательное решение.",
    footerTagline: "Доверие в каждом проекте",
    footerRights: "© 2026 VSTAH. Все права защищены.",
    footerTerms: "Условия использования",
    footerPrivacy: "Политика конфиденциальности",
    footerFollow: "Мы в соцсетях",
    footerCompany: "Компания",
    footerLegal: "Правовая информация",
    tableCategory: "Тема",
    heroSlideAria: "Перейти к промо-слайду",
    langSwitcherAria: "Сменить язык",
    menuAria: "Меню",
    completionDashboard: "Экран завершения",
    successCompleted: "Успешно: соглашение закрыто",
    leaveFeedback: "Оставить отзыв",
    awaitingFundsEscrow: "Ожидание зачисления",
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
    fundsSecuredEscrow: "Средства удерживаются",
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
    pricingCta: "Начать бесплатный период",
    faqEyebrow: "Вопросы",
    faqTitle: "Частые вопросы",
    faqSubtitle: "Короткие ответы перед первой защищённой сделкой.",
    faqs: [
      {
        q: "Что такое VSTAH и как это работает?",
        a: "VSTAH — цифровая платформа для безопасных платежей и абсолютного доверия между бизнесом и клиентами в Армении. Исполнитель создаёт сделку и защищённую ссылку на оплату, а клиент вносит средства в нашу систему. Деньги надёжно блокируются и переводятся исполнителю только после того, как клиент подтвердит, что работа выполнена или товар доставлен."
      },
      {
        q: "Безопасны ли мои деньги, пока они на удержании?",
        a: "Абсолютно. Средства полностью недоступны исполнителю и никогда не используются в операционной деятельности VSTAH. Ваши деньги хранятся на выделенном институциональном Trust Account в ведущем армянском банке под строгим контролем — до успешного завершения сделки."
      },
      {
        q: "Сколько стоит начать?",
        a: "Регистрация и создание сделки полностью бесплатны. Модель простая: фиксированная комиссия 7% с каждой успешной сделки (согласовывается заранее) или подписка 25 000 AMD в месяц для бизнеса с большим объёмом. Вы решаете, кто оплачивает комиссию: исполнитель, клиент или 50/50."
      },
      {
        q: "Что если возникнет разногласие?",
        a: "Форма создания сделки задаёт настолько чёткие ожидания и этапы, что 95% споров предотвращаются ещё до начала. Если конфликт всё же возникает, деньги остаются надёжно заблокированными в банке. Если не удаётся договориться самостоятельно, вы можете запустить наш официальный сервис человеческого арбитража за небольшую плату — мы примем справедливое решение на основе доказательств."
      },
      {
        q: "Нужно ли клиентам создавать аккаунт, чтобы подписать и оплатить?",
        a: "Нет. Клиент получает прямую ссылку в SMS, WhatsApp или по email. Он может ознакомиться с условиями, подписать цифровой галочкой в одном чекбоксе и безопасно оплатить картой или банковским переводом менее чем за минуту — без долгой регистрации."
      }
    ]
  }
};

const processIcons = [FileText, Landmark, Hammer, CircleCheck] as const;

export default function Page() {
  const { language: locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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

  const t: TranslationBundle = translations[locale] ?? translations.en;
  const heroChipsHyRu = locale === "hy" || locale === "ru";
  const isHy = locale === "hy";
  const pricingLongLocale = locale === "hy" || locale === "ru";
  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-clip bg-white text-slate-900">
      <main className="min-w-0 flex-1 overflow-x-clip bg-white">
        <section
          className="relative z-10 h-auto min-h-dvh w-full min-w-0 overflow-x-clip pb-12 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.14)] md:pb-24"
          style={{ background: SITE_BG_GRADIENT }}
        >
          <FloatingPillHeader
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
            langMenuOpen={langMenuOpen}
            onLangMenuOpenChange={setLangMenuOpen}
          />

          {/* Tighten off-viewport blurs on small screens — full -left-32 / -right-24 widens iOS scroll width */}
          <div
            className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl sm:-left-24 sm:h-80 sm:w-80 md:-left-32 md:h-96 md:w-96"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl sm:-right-16 sm:h-72 sm:w-72 md:-right-24 md:h-80 md:w-80"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 pt-8 sm:gap-10 md:grid-cols-2 md:items-center md:gap-16 md:px-6 md:pt-10 lg:gap-20">
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
                    <span className="block">Կառուցեք վստահելի գործարքներ</span>
                    <span className="block">Ստացեք վճարումները ժամանակին</span>
                  </>
                ) : (
                  t.heroEyebrow
                )}
              </p>
              <h1
                className={`mt-6 w-full min-w-0 text-balance break-words font-black tracking-tight text-white hyphens-none sm:mt-8 ${
                  isHy
                    ? "text-[2rem] leading-[1.14] sm:text-[2.5rem] md:text-[2.1rem] lg:text-[2.8rem] xl:text-[3.35rem]"
                    : "text-[2.3rem] leading-[1.1] sm:text-[2.9rem] md:text-[2.35rem] lg:text-[3.1rem] xl:text-[3.7rem]"
                }`}
              >
                <span className="block" style={{ color: ORANGE }}>
                  {t.heroTitleBefore}
                </span>
                <span className="block text-white">{t.heroTitleAfter.trim()}</span>
              </h1>
              <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/register?next=%2Fdashboard"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#DC2626] px-6 text-sm font-semibold text-white shadow-sm shadow-red-900/30 transition hover:-translate-y-0.5 hover:bg-[#B91C1C] hover:shadow-md sm:h-12 sm:w-auto sm:px-8 sm:text-base"
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

            <div className="relative w-full min-w-0 pb-10 sm:pb-14 lg:pb-12 vstah-animate-in">
              <div
                className="pointer-events-none absolute left-0 top-1/2 z-0 hidden w-28 -translate-x-[86%] -translate-y-1/2 flex-col items-center gap-9 xl:flex 2xl:w-32"
                aria-hidden
              >
                <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-white/0 via-white/35 to-white/0" />
                {[
                  { icon: FileText, tone: "border-white/25 bg-white/10 text-white" },
                  { icon: Lock, tone: "border-orange-300/40 bg-orange-400/15 text-orange-200" },
                  { icon: Wallet, tone: "border-emerald-300/40 bg-emerald-400/15 text-emerald-200" }
                ].map(({ icon: Icon, tone }, index) => (
                  <span
                    key={`hero-rail-node-${index}`}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[0_10px_28px_rgba(2,6,23,0.35)] backdrop-blur-sm ${tone}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                ))}
              </div>
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
              <div className="absolute -bottom-5 left-1/2 z-10 w-[min(100%,22rem)] -translate-x-1/2 px-2 sm:-bottom-6 sm:w-full sm:max-w-sm">
                <div
                  className="rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-slate-900 shadow-sm"
                  style={{ backgroundColor: ORANGE }}
                >
                  {t.cardMediation}
                </div>
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
              <Reveal key={`feature-${index}`} delay={index * 30}>
                <div className="group flex min-h-[4.75rem] w-full min-w-0 max-w-none items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ring-1 ring-slate-100/70 transition-all duration-300 hover:-translate-y-1 hover:from-blue-50 hover:to-blue-50 hover:shadow-md md:min-h-[5rem] md:p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E30A17] text-white shadow-md transition-colors duration-200 group-hover:bg-[#F2A800] group-hover:text-slate-900">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="min-w-0 flex-1 break-words pt-1 font-extrabold leading-snug text-[clamp(12px,1.2vw,16px)]">{text}</p>
                </div>
              </Reveal>
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

            {/* Mobile: stacked cards */}
            <div className="mt-10 grid gap-5 md:hidden">
              <Reveal>
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex min-h-[5.25rem] items-center gap-3 border-b border-white/10 bg-gradient-to-br from-blue-800 via-slate-950 to-black px-5 py-4 text-white">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-blue-400 ring-1 ring-blue-500/30">
                    <Shield className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200/85">{t.recommended}</p>
                    <p className="text-2xl font-black leading-none sm:text-3xl">{t.colWith}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`m-with-${row.label}`} className="grid min-h-[5.5rem] grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 px-5 py-4">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold leading-snug text-slate-900">{row.label}</p>
                        <p className="mt-1 text-sm leading-snug text-slate-600 sm:text-[15px]">{row.withVstah}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              </Reveal>

              <Reveal delay={40}>
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex min-h-[5.25rem] items-center gap-3 border-b border-white/10 bg-gradient-to-br from-red-900 via-neutral-950 to-black px-5 py-4 text-white">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-200/85">{t.diffWithoutEyebrow}</p>
                    <p className="text-2xl font-black leading-none text-white sm:text-3xl">{t.colWithout}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`m-without-${row.label}`} className="grid min-h-[5.5rem] grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 px-5 py-4">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold leading-snug text-slate-900">{row.label}</p>
                        <p className="mt-1 text-sm leading-snug text-slate-600 sm:text-[15px]">{row.withoutUs}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              </Reveal>
            </div>

            {/* Desktop: one grid so matching rows share height in every language */}
            <Reveal className="mt-10 hidden md:block">
              <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex min-h-[5.5rem] items-center gap-3 border-b border-white/10 bg-gradient-to-br from-blue-800 via-slate-950 to-black px-5 py-4 text-white lg:px-6">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-blue-400 ring-1 ring-blue-500/30">
                    <Shield className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200/85">{t.recommended}</p>
                    <p className="text-3xl font-black leading-none md:text-[2.1rem]">{t.colWith}</p>
                  </div>
                </div>
                <div className="flex min-h-[5.5rem] items-center gap-3 border-b border-l border-white/10 bg-gradient-to-br from-red-900 via-neutral-950 to-black px-5 py-4 text-white lg:px-6">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-200/85">{t.diffWithoutEyebrow}</p>
                    <p className="text-3xl font-black leading-none text-white md:text-[2.1rem]">{t.colWithout}</p>
                  </div>
                </div>

                {t.comparisonRows.map((row, idx) => {
                  const isLast = idx === t.comparisonRows.length - 1;
                  return (
                    <div key={row.label} className="contents">
                      <div
                        className={`grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-blue-50 lg:px-6 ${
                          isLast ? "" : "border-b border-slate-100"
                        }`}
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold leading-snug text-slate-900">{row.label}</p>
                          <p className="mt-1 text-[15px] leading-snug text-slate-600">{row.withVstah}</p>
                        </div>
                      </div>
                      <div
                        className={`grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 border-l border-slate-100 px-5 py-4 transition-colors duration-200 hover:bg-red-50 lg:px-6 ${
                          isLast ? "" : "border-b border-slate-100"
                        }`}
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                          <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold leading-snug text-slate-900">{row.label}</p>
                          <p className="mt-1 text-[15px] leading-snug text-slate-600">{row.withoutUs}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="process"
          className="scroll-mt-28 relative overflow-hidden py-14 text-white md:py-20"
          style={{ background: SITE_BG_GRADIENT }}
        >
          <div
            className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#F2A800]/10 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/65">{t.processEyebrow}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{t.processTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{t.processSubtitle}</p>
            </div>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-10">
              {t.processSteps.map((step, idx) => {
                const Icon = processIcons[Math.min(idx, processIcons.length - 1)] ?? FileText;
                return (
                  <li key={step.step} className="h-full min-w-0">
                    <Reveal delay={idx * 35} className="h-full">
                      <div className="group flex h-full gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1] sm:gap-4 sm:p-5">
                        <div className="flex shrink-0 flex-col items-center gap-2">
                          <span className="text-xs font-black tabular-nums tracking-wide text-[#F2A800]">{step.step}</span>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#F2A800] ring-1 ring-white/15 transition duration-300 group-hover:bg-[#F2A800] group-hover:text-slate-900">
                            <Icon className="h-5 w-5" strokeWidth={2.2} />
                          </div>
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <h3 className="text-base font-bold leading-snug">{step.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{step.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[#d7e0ef] bg-[#E8EEF8] py-14 text-slate-900 md:py-20">
          <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#0033A0]/[0.08] blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#E30A17]/[0.06] blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-col gap-5 rounded-2xl border border-[#0033A0]/12 bg-white/80 p-5 shadow-sm sm:p-6 md:flex-row md:items-end md:justify-between md:gap-10 md:p-7">
                <div className="min-w-0 max-w-2xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: RED }}>
                    {t.disputeEyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl" style={{ color: NAVY }}>
                    {t.disputeTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{t.disputeBody}</p>
                </div>
                <div className="shrink-0 md:pb-0.5">
                  <OrangeButton
                    href="/register?next=%2Fdashboard"
                    className="w-full hover:!bg-[#E30A17] hover:!text-white hover:shadow-[0_14px_36px_-6px_rgba(227,10,23,0.45)] active:!bg-[#c40914] focus-visible:!outline-[#E30A17] md:w-auto"
                  >
                    {t.btnStartProtected}
                  </OrangeButton>
                </div>
              </div>
            </Reveal>

            <ol className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
              {[
                { main: t.badge24h, sub: t.badge24hSub, icon: Headphones, accent: NAVY },
                { main: t.badgeLaw, sub: t.badgeLawSub, icon: Layers, accent: RED },
                { main: t.badgeMed, sub: t.badgeMedSub, icon: ListOrdered, accent: ORANGE }
              ].map(({ main, sub, icon: Icon, accent }, idx) => (
                <li key={`dispute-step-${idx}`} className="h-full min-w-0">
                  <Reveal delay={idx * 40} className="h-full">
                    <div className="flex h-full flex-col rounded-2xl border border-[#0033A0]/10 bg-white/70 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                          style={{ backgroundColor: accent }}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
                            0{idx + 1}
                          </p>
                          <h3
                            className={`whitespace-pre-line font-bold leading-snug [overflow-wrap:anywhere] ${
                              isHy ? "text-sm sm:text-[15px]" : "text-[15px] sm:text-base"
                            }`}
                            style={{ color: NAVY }}
                          >
                            {main}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600" title={sub}>
                        {sub}
                      </p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <MarketingPricingFaqSection
          locale={locale}
          pricingLongLocale={pricingLongLocale}
          openFaqIndex={openFaqIndex}
          onToggleFaq={(index) => setOpenFaqIndex(openFaqIndex === index ? null : index)}
          pricingPlanName={t.pricingPlanName}
          pricingTitle={t.pricingTitle}
          pricingSubtitle={t.pricingSubtitle}
          pricingPerMonth={t.pricingPerMonth}
          pricingValueFree={t.pricingValueFree}
          pricingValuePro={t.pricingValuePro}
          pricingCta={t.pricingCta}
          faqEyebrow={t.faqEyebrow}
          faqTitle={t.faqTitle}
          faqSubtitle={t.faqSubtitle}
          faqs={t.faqs}
        />
</main>

      <footer className="border-t border-slate-200 bg-white text-slate-600">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <div className="flex w-full flex-col gap-10 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-8 sm:gap-y-10 lg:flex-nowrap">
            <div className="min-w-0 shrink-0 sm:max-w-[14rem]">
              <div className="flex items-center gap-2">
                <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-8 w-8 shrink-0 object-contain" />
                <span className="text-base font-semibold tracking-tight text-slate-900">{t.brand}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{t.footerTagline}</p>
            </div>

            <div className="min-w-0 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">{t.footerCompany}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-slate-600 transition hover:text-slate-900">
                    {t.navHome}
                  </Link>
                </li>
                <li>
                  <a href="#difference" className="text-slate-600 transition hover:text-slate-900">
                    {t.navHowItWorks}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-slate-600 transition hover:text-slate-900">
                    {t.navPricing}
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-0 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">{t.footerLegal}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-slate-600 transition hover:text-slate-900">
                    {t.footerTerms}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-600 transition hover:text-slate-900">
                    {t.footerPrivacy}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="min-w-0 shrink-0 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">{t.footerFollow}</p>
              <div className="mt-3 flex items-center gap-3 sm:justify-end">
                <a
                  href="https://instagram.com/vstah.am"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-slate-500 transition hover:text-slate-800"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/vstah.am"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="text-slate-500 transition hover:text-slate-800"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
            <p className="text-xs text-slate-500">{t.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
