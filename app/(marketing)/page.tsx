"use client";

import { FloatingPillHeader } from "@/components/floating-pill-header";
import { MarketingHeroSection } from "@/components/marketing-hero-section";
import { MarketingPainPointsCarousel } from "@/components/marketing-pain-points-carousel";
import { MarketingFeaturesSection } from "@/components/marketing-features-section";
import { MarketingDifferenceSection } from "@/components/marketing-difference-section";
import { MarketingProcessSection } from "@/components/marketing-process-section";
import { MarketingDisputeSection } from "@/components/marketing-dispute-section";
import { MarketingPricingFaqSection } from "@/components/marketing-pricing-faq-section";
import { MarketingFooter } from "@/components/marketing-footer";
import { SITE_BG_GRADIENT } from "@/lib/brand";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

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
  heroPainPoints: string[];
  heroDashboardTitle: string;
  heroPreviewLabel: string;
  heroRow1Label: string;
  heroRow1Badge: string;
  heroRow2Label: string;
  heroRow2Badge: string;
  heroRow3Label: string;
  heroRow3Badge: string;
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
  painPointsTitle: string;
  painPoints: string[];
  painCarouselAria: string;
  painPrevAria: string;
  painNextAria: string;
  painSlideAria: string;
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
    heroPainPoints: [
      "When the client is terrified to pay you upfront, but you can't work for free...",
      "When you feel awkward chasing your own money, but bills are due...",
      "When you worry that asking for a contract will scare the client away...",
      "When the project scope keeps growing, but the budget stays the same...",
      "When you deliver 100% of the work, but only get 50% of the respect...",
      "When a late payment forces you to put your entire business on pause..."
    ],
    heroDashboardTitle: "VSTAH Secured Dashboard",
    heroPreviewLabel: "Live deal protection",
    heroRow1Label: "Digital Work Agreement",
    heroRow1Badge: "Signed & Locked",
    heroRow2Label: "Secured Project Deposit",
    heroRow2Badge: "Verified",
    heroRow3Label: "Scope & Milestone Guard",
    heroRow3Badge: "Active",
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
    painPointsTitle: "Sound familiar?",
    painPoints: [
      "Working as a freelancer, acting as a debt collector.",
      "Chasing your own hard-earned money feels embarrassing.",
      "'We don't need a contract, we trust you.'",
      "Afraid to ask for a deposit upfront.",
      "Spending hours re-writing a polite payment reminder.",
      "Doing endless free revisions just to get paid.",
      "Starting the project based on a vague verbal promise."
    ],
    painCarouselAria: "Freelancer pain points",
    painPrevAria: "Previous",
    painNextAria: "Next",
    painSlideAria: "Slide",
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
    heroEyebrow: "Կառուցեք վստահելի գործարքներ։ Ստացեք վճարումները ժամանակին։",
    heroTitleBefore: "Աշխատեք վստահությամբ։",
    heroTitleHighlight: "",
    heroTitleAfter: " Ստացեք վճարումը վստահությամբ։",
    heroPainPoints: [
      "Երբ հաճախորդը վախենում է կանխավճարից, բայց դուք չեք կարող անվճար աշխատել...",
      "Երբ ամաչում եք հետապնդել ձեր գումարը, բայց հաշիվները ժամանակին են...",
      "Երբ վախենում եք, որ պայմանագրի խնդրանքը կվախեցնի հաճախորդին...",
      "Երբ աշխատանքի ծավալը մեծանում է, բայց բյուջեն նույնն է մնում...",
      "Երբ կատարում եք աշխատանքի 100%-ը, բայց ստանում եք հարգանքի միայն 50%-ը...",
      "Երբ ուշ վճարումը ստիպում է դադարեցնել ողջ բիզնեսը..."
    ],
    heroDashboardTitle: "Պաշտպանված վահանակ",
    heroPreviewLabel: "Կենդանի գործարքի պաշտպանություն",
    heroRow1Label: "Թվային աշխատանքային պայմանագիր",
    heroRow1Badge: "Ստորագրված և կողպված",
    heroRow2Label: "Ապահովված նախագծի դեպոզիտ",
    heroRow2Badge: "Հաստատված",
    heroRow3Label: "Ծավալի և փուլերի պաշտպանություն",
    heroRow3Badge: "Ակտիվ",
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
    painPointsTitle: "Ծանո՞թ է",
    painPoints: [
      "Ֆրիլանսեր աշխատելիս՝ դուք եք պարտքի հավաքագրողը։",
      "Ամաչում եք հետապնդել սեփական վաստակած գումարը։",
      "«Պայմանագիր պետք չէ, մենք քեզ վստահում ենք»։",
      "Վախենում եք նախապես ավանս խնդրել։",
      "Շատ ժամանակ եք ծախսում հաճակական վճարային հիշեցումը գրելու համար։",
      "Անվերջ անվճար փոփոխություններ անելու՝ միայն վճարվելու համար։",
      "Նախագիծը սկսում եք անորոշ խոսքային պայմանավորվածության վրա։",
    ],
    painCarouselAria: "Ֆրիլանսերի խնդիրներ",
    painPrevAria: "Նախորդ",
    painNextAria: "Հաջորդ",
    painSlideAria: "Կադր",
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
    heroEyebrow: "Стройте профессиональное доверие. Получайте оплату вовремя.",
    heroTitleBefore: "Работайте уверенно.",
    heroTitleHighlight: "",
    heroTitleAfter: " Получайте оплату наверняка.",
    heroPainPoints: [
      "Когда клиент боится платить вперёд, а вы не можете работать бесплатно...",
      "Когда неловко требовать свои деньги, а счета уже пора оплачивать...",
      "Когда боитесь, что просьба о договоре отпугнёт клиента...",
      "Когда объём работ растёт, а бюджет остаётся прежним...",
      "Когда вы делаете 100% работы, а уважения получаете только 50%...",
      "Когда просроченная оплата ставит на паузу весь бизнес..."
    ],
    heroDashboardTitle: "Защищённая панель",
    heroPreviewLabel: "Защита сделки в реальном времени",
    heroRow1Label: "Цифровое рабочее соглашение",
    heroRow1Badge: "Подписано и зафиксировано",
    heroRow2Label: "Защищённый депозит проекта",
    heroRow2Badge: "Проверено",
    heroRow3Label: "Контроль объёма и этапов",
    heroRow3Badge: "Активно",
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
    painPointsTitle: "Знакомо?",
    painPoints: [
      "Работая фрилансером, вы сами становитесь коллектором долгов.",
      "Требовать свои честно заработанные деньги — неловко.",
      "«Нам не нужен договор, мы вам доверяем».",
      "Страшно просить предоплату заранее.",
      "Тратите часы на вежливое напоминание об оплате.",
      "Делаете бесконечные правки бесплатно, лишь бы получить оплату.",
      "Начинаете проект на основе расплывчатого устного обещания."
    ],
    painCarouselAria: "Боли фрилансеров",
    painPrevAria: "Назад",
    painNextAria: "Далее",
    painSlideAria: "Слайд",
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

export default function Page() {
  const { language: locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const t: TranslationBundle = translations[locale] ?? translations.en;
  const heroChipsHyRu = locale === "hy" || locale === "ru";
  const isHy = locale === "hy";
  const pricingLongLocale = locale === "hy" || locale === "ru";

  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-clip bg-white text-slate-900">
      <main className="min-w-0 flex-1 overflow-x-clip bg-white">
        <section
          className="relative z-10 h-auto min-h-dvh w-full min-w-0 overflow-x-clip pb-12 md:pb-24"
          style={{ background: SITE_BG_GRADIENT }}
        >
          <div
            className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl sm:-left-24 sm:h-80 sm:w-80 md:-left-32 md:h-96 md:w-96"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl sm:-right-16 sm:h-72 sm:w-72 md:-right-24 md:h-80 md:w-80"
            aria-hidden
          />
          <FloatingPillHeader
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
            langMenuOpen={langMenuOpen}
            onLangMenuOpenChange={setLangMenuOpen}
          />
          <MarketingHeroSection t={t} isHy={isHy} heroChipsHyRu={heroChipsHyRu} locale={locale} />
        </section>

        <MarketingPainPointsCarousel
          title={t.painPointsTitle}
          quotes={t.painPoints}
          carouselAria={t.painCarouselAria}
          prevAria={t.painPrevAria}
          nextAria={t.painNextAria}
          slideAria={t.painSlideAria}
        />

        <MarketingFeaturesSection
          locale={locale}
          t={{
            feature1: t.feature1,
            feature2: t.feature2,
            feature3: t.feature3,
            feature4: t.feature4,
            fundsLabel: t.fundsLabel,
            lockedNote: t.lockedNote,
            stage1State: t.stage1State,
            projectStatus: t.projectStatus
          }}
        />

        <MarketingDifferenceSection
          diffEyebrow={t.diffEyebrow}
          diffTitle={t.diffTitle}
          diffSubtitle={t.diffSubtitle}
          recommended={t.recommended}
          colWith={t.colWith}
          colWithout={t.colWithout}
          diffWithoutEyebrow={t.diffWithoutEyebrow}
          comparisonRows={t.comparisonRows}
        />

        <MarketingProcessSection
          processEyebrow={t.processEyebrow}
          processTitle={t.processTitle}
          processSubtitle={t.processSubtitle}
          processSteps={t.processSteps}
        />

        <MarketingDisputeSection
          disputeEyebrow={t.disputeEyebrow}
          disputeTitle={t.disputeTitle}
          disputeBody={t.disputeBody}
          btnStartProtected={t.btnStartProtected}
          badge24h={t.badge24h}
          badge24hSub={t.badge24hSub}
          badgeLaw={t.badgeLaw}
          badgeLawSub={t.badgeLawSub}
          badgeMed={t.badgeMed}
          badgeMedSub={t.badgeMedSub}
          isHy={isHy}
        />

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

      <MarketingFooter
        t={{
          brand: t.brand,
          footerTagline: t.footerTagline,
          footerCompany: t.footerCompany,
          footerLegal: t.footerLegal,
          footerFollow: t.footerFollow,
          footerRights: t.footerRights,
          footerTerms: t.footerTerms,
          footerPrivacy: t.footerPrivacy,
          navHome: t.navHome,
          navHowItWorks: t.navHowItWorks,
          navPricing: t.navPricing
        }}
      />
    </div>
  );
}
