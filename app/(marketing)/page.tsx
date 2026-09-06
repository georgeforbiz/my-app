"use client";

import { FloatingPillHeader } from "@/components/floating-pill-header";
import { MarketingHeroSection } from "@/components/marketing-hero-section";
import { MarketingPainPointsGrid } from "@/components/marketing-pain-points-grid";
import { MarketingFeaturesSection } from "@/components/marketing-features-section";
import { MarketingDifferenceSection } from "@/components/marketing-difference-section";
import { MarketingProcessSection } from "@/components/marketing-process-section";
import { MarketingDisputePreventionSection } from "@/components/marketing-dispute-prevention-section";
import { MarketingPricingFaqSection } from "@/components/marketing-pricing-faq-section";
import { MarketingFooter } from "@/components/marketing-footer";
import { SITE_BG_GRADIENT } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type Locale = Language;

type ComparisonRow = { label: string; withVstah: string; withoutUs: string };
type ProcessStep = { step: string; title: string; desc: string };
type PainPointItem = { title: string; body: string };
type PreventionItem = { title: string; body: string };
type PricingPlanCopy = {
  name: string;
  tagline: string;
  subtitle: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
  popularBadge?: string;
};

type TranslationBundle = {
  brand: string;
  navHome: string;
  navHowItWorks: string;
  navPricing: string;
  btnProtectProject: string;
  btnSeeHow: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleLine3: string;
  heroSubtitle: string;
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
  heroProposalStatus: string;
  heroProposalLabel: string;
  heroMilestonesLabel: string;
  heroStage1Status: string;
  heroStage2Status: string;
  heroStage3Status: string;
  heroSignatureName: string;
  heroDigitallyVerified: string;
  heroTapToSignHint: string;
  heroSignatureLabel: string;
  heroSignCta: string;
  heroAuditTrail: string;
  heroProposalMockupAria: string;
  demoProviderDetails: string;
  demoClientDetails: string;
  demoBusinessName: string;
  demoClientName: string;
  demoBusinessPhone: string;
  demoClientPhone: string;
  demoTotalLabel: string;
  demoTotalAmount: string;
  demoTermsTitle: string;
  demoTermsBody: string;
  demoScrollHint: string;
  demoOfferLabel: string;
  demoAgreementTitle: string;
  demoSignedSubtitle: string;
  demoProjectHeader: string;
  demoBusinessNameLabel: string;
  demoClientNameLabel: string;
  demoPhoneLabel: string;
  demoPaymentSchedule: string;
  demoScheduleStatus: string;
  demoStatusSigned: string;
  demoClientSignature: string;
  cardTagline1: string;
  cardTagline2: string;
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  painPointsTitle: string;
  painPoints: PainPointItem[];
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
  preventionEyebrow: string;
  preventionTitle: string;
  preventionBody: string;
  preventionItems: PreventionItem[];
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
  pricingPlan: PricingPlanCopy;
  faqTitle: string;
  faqs: { q: string; a: string }[];
};

const translations: Record<Locale, TranslationBundle> = {
  en: {
    brand: "VSTAH",
    navHome: "Home",
    navHowItWorks: "How it works",
    navPricing: "Pricing",
    btnProtectProject: "Try for Free",
    btnSeeHow: "See How It Works",
    heroEyebrow: "",
    heroTitleLine1: "Protect every deal",
    heroTitleLine2: "with a clear agreement",
    heroTitleLine3: "before work starts.",
    heroSubtitle: "Send a link. Lock the terms. Avoid the argument.",
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
    heroRow1Badge: "Signed & Approved",
    heroRow2Label: "Secured Project Deposit",
    heroRow2Badge: "Verified",
    heroRow3Label: "Scope & Milestone Guard",
    heroRow3Badge: "Active",
    cardChip1: "Secured Project Deposit",
    cardChip2: "Digital Work Agreement",
    projectLabel: "Project",
    projectId: "#AM-2841",
    projectTitle: "Apartment Renovation",
    projectStatus: "Active",
    fundsLabel: "Funds in safe",
    lockedNote: "Locked across 3 stages",
    stage1Name: "Demolition & Prep",
    stage1Amount: "150,000 ֏",
    stage1State: "Released",
    stage2Name: "Plumbing & Electrical",
    stage2Amount: "200,000 ֏",
    stage2State: "Locked",
    stage3Name: "Final Finishing",
    stage3Amount: "100,000 ֏",
    stage3State: "Pending",
    heroProposalStatus: "[Active: Signed]",
    heroProposalLabel: "Proposal",
    heroMilestonesLabel: "Project Milestones",
    heroStage1Status: "Approved",
    heroStage2Status: "In Progress",
    heroStage3Status: "Pending",
    heroSignatureName: "Aram Petrosyan",
    heroDigitallyVerified: "Digitally Verified",
    heroTapToSignHint: "Tap to sign",
    heroSignatureLabel: "Signature",
    heroSignCta: "Sign & Approve Proposal",
    heroAuditTrail: "Audit Trail: IP Verified • TimeStamped • Legal Record",
    heroProposalMockupAria:
      "Interactive scrollable agreement demo with milestones and digital signature",
    demoProviderDetails: "Provider",
    demoClientDetails: "Client",
    demoBusinessName: "BuildPro LLC",
    demoClientName: "Anahit Hakobyan",
    demoBusinessPhone: "+374 91 234 567",
    demoClientPhone: "+374 99 111 222",
    demoTotalLabel: "Total",
    demoTotalAmount: "450,000 ֏",
    demoTermsTitle: "Terms",
    demoTermsBody:
      "Scope, price, and payment schedule are locked once signed. Extra work requires a written update before it starts.",
    demoScrollHint: "Scroll to explore",
    demoOfferLabel: "Offer",
    demoAgreementTitle: "Safe Service Agreement",
    demoSignedSubtitle: "Agreement Officially Executed & Signed",
    demoProjectHeader: "Project / Service Name",
    demoBusinessNameLabel: "Business Name",
    demoClientNameLabel: "Client Name",
    demoPhoneLabel: "Phone",
    demoPaymentSchedule: "Payment Schedule",
    demoScheduleStatus: "Status",
    demoStatusSigned: "Signed",
    demoClientSignature: "Client signature",
    cardTagline1: "Stop the disputes.",
    cardTagline2: "Start the renovation.",
    feature1: "Clear Milestones",
    feature2: "Instant Signatures",
    feature3: "No Extra Favors",
    feature4: "Built for Armenia",
    painPointsTitle: 'No more "That\'s not what we talked about"',
    painPoints: [
      {
        title: "False Sense of Security",
        body: 'A text saying "sounds good" is not a commitment. When unexpected costs come up, silence replaces agreement and you pay out of pocket.'
      },
      {
        title: "Boundary Creep",
        body: "You start with one job, but the client keeps asking for small extra favors. Without clear limits upfront, saying no feels like a conflict."
      },
      {
        title: "Contract Friction",
        body: "Long legal contracts intimidate clients. They feel anxious, stop responding, and a simple project dies before it starts."
      },
      {
        title: "Unpaid Good Intentions",
        body: "You do free work to keep the client happy. Without explicit boundaries, good customer service turns into unpaid labor."
      }
    ],
    diffEyebrow: "",
    diffTitle: "Amateurs argue over WhatsApp.",
    diffSubtitle: "",
    recommended: "",
    colWith: "The New Way",
    colWithout: "The Old Way",
    diffWithoutEyebrow: "",
    comparisonRows: [
      {
        label: "",
        withoutUs: "Messy text messages buried in chat history",
        withVstah: "One clear mobile link with exact project details"
      },
      {
        label: "",
        withoutUs: '"Please print, sign, scan, and email this back"',
        withVstah: "Quick finger signature on the phone in 10 seconds"
      },
      {
        label: "",
        withoutUs: "Endless arguments over what was actually agreed upon",
        withVstah: "Scope, price, and terms locked before work starts"
      },
      {
        label: "",
        withoutUs: "Awkward chats when asking for approval",
        withVstah: "Clear milestone dates agreed upfront"
      },
      {
        label: "",
        withoutUs: "Zero proof when memories fade and stories change",
        withVstah: "Permanent digital proof of who signed and when"
      }
    ],
    processEyebrow: "",
    processTitle: "Four steps to bulletproof your business.",
    processSubtitle: "",
    processSteps: [
      {
        step: "01",
        title: "Set the Scope",
        desc: "Pick a template or list your project milestones, costs in AMD, and basic terms."
      },
      {
        step: "02",
        title: "Drop the Link",
        desc: "Send an interactive link directly via WhatsApp, Telegram, or Viber."
      },
      {
        step: "03",
        title: "Online Signature",
        desc: "Your client opens the link on their phone, reviews the breakdown, and signs with a finger."
      },
      {
        step: "04",
        title: "Lock the Agreement",
        desc: "Both parties receive a legal digital copy with zero friction."
      }
    ],
    preventionEyebrow: "Prevention",
    preventionTitle: "Stop Disputes\nBefore They Start.",
    preventionBody:
      "Build clear expectation alignment and mutual commitment before work starts.",
    preventionItems: [
      {
        title: "Locked Scope Before Day One",
        body: "Every stage, cost, and deliverable is signed before work starts. Zero confusion about what is included."
      },
      {
        title: "Instant Addendums for Scope Changes",
        body: "Client wants extra work? Send a new link. If they sign, the scope expands. If not, you stick to the original deal."
      },
      {
        title: "Immutable Audit Trail",
        body: "IP address, device metadata, and exact timestamp on every signature create permanent proof of agreement."
      }
    ],
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
    pricingPlan: {
      name: "Pro",
      tagline: "Simple pricing",
      subtitle: "Start free, upgrade when ready",
      price: "15,000 ֏ / month",
      features: ["10 free agreements included", "Unlimited after upgrade"],
      cta: "Start Free Trial"
    },
    faqTitle: "Frequently asked Questions",
    faqs: [
      {
        q: "Will my clients actually use this, or will it scare them off?",
        a: "It builds instant trust. Clients hate hidden surprises just as much as you do. Seeing a clear breakdown on a modern mobile screen makes you look like an elite professional."
      },
      {
        q: "Is a finger signature on a phone legally binding in Armenia?",
        a: "Yes. Under Armenian law, digital consent backed by an audit trail (IP address, device metadata, timestamp, and explicit term acceptance) serves as valid legal proof of contract formation."
      },
      {
        q: "What happens if a client demands extra work halfway through?",
        a: 'You simply send an "Addendum Link" for the new task. If they sign, the new scope and cost are added. If they don\'t, you stick strictly to the original agreement. No arguing.'
      },
      {
        q: "Do my clients need to sign up or download an app?",
        a: "No. Zero friction. They tap the link in WhatsApp, review the proposal, sign on their phone screen, and they're done."
      },
      {
        q: "Can I lock a proposal so it can't be changed after signing?",
        a: "The exact second the client signs, VSTAH generates a tamper-proof, time-stamped PDF record that is permanently locked for both parties."
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
    heroEyebrow: "",
    heroTitleLine1: "Պաշտպանիր գործարքդ",
    heroTitleLine2: "հստակ պայմանագրով",
    heroTitleLine3: "նախքան աշխատանքը սկսելը:",
    heroSubtitle: "Ուղարկիր հղումը: Ֆիքսիր պայմանները: Խուսափիր վեճից:",
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
    heroRow1Badge: "Ստորագրված և հաստատված",
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
    stage1Name: "Նախնական փուլ",
    stage1Amount: "100,000 ֏",
    stage1State: "Արձակված",
    stage2Name: "Էլեկտրիկա և ջուր",
    stage2Amount: "200,000 ֏",
    stage2State: "Կողպված",
    stage3Name: "Վերջնահարդարում",
    stage3Amount: "100,000 ֏",
    stage3State: "Սպասում",
    heroProposalStatus: "[Ակտիվ՝ ստորագրված]",
    heroProposalLabel: "Առաջարկ",
    heroMilestonesLabel: "Նախագծի փուլեր",
    heroStage1Status: "Հաստատված",
    heroStage2Status: "Ընթացքում",
    heroStage3Status: "Սպասում",
    heroSignatureName: "Aram Petrosyan",
    heroDigitallyVerified: "Թվային հաստատված",
    heroTapToSignHint: "Սեղմեք՝ ստորագրելու համար",
    heroSignatureLabel: "Ստորագրություն",
    heroSignCta: "Ստորագրել և հաստատել առաջարկը",
    heroAuditTrail: "Հետագծում՝ IP հաստատված • Ժամանակային կնիք • Իրավական գրառում",
    heroProposalMockupAria:
      "Ինտերակտիվ պայմանագրի դեմո՝ փուլերով և թվային ստորագրությամբ",
    demoProviderDetails: "Մատակարար",
    demoClientDetails: "Հաճախորդ",
    demoBusinessName: "BuildPro LLC",
    demoClientName: "Անահիտ Հակոբյան",
    demoBusinessPhone: "+374 91 234 567",
    demoClientPhone: "+374 99 111 222",
    demoTotalLabel: "Ընդամենը",
    demoTotalAmount: "400,000 ֏",
    demoTermsTitle: "Պայմաններ",
    demoTermsBody:
      "Ծավալը, գինը և վճարման ժամանակացույցը ֆիքսվում են ստորագրումից հետո։ Լրացուցիչ աշխատանքը պահանջում է գրավոր թարմացում։",
    demoScrollHint: "Ոլորեք՝ տեսնելու համար",
    demoOfferLabel: "Առաջարկ",
    demoAgreementTitle: "Անվտանգ ծառայության պայմանագիր",
    demoSignedSubtitle: "Պայմանագիրը պաշտոնապես կնքված և ստորագրված\u00A0է",
    demoProjectHeader: "Նախագծի / ծառայության անվանում",
    demoBusinessNameLabel: "Բիզնեսի անվանում",
    demoClientNameLabel: "Հաճախորդի անուն",
    demoPhoneLabel: "Հեռախոս",
    demoPaymentSchedule: "Վճարման ժամանակացույց",
    demoScheduleStatus: "Կարգավիճակ",
    demoStatusSigned: "Ստորագրված",
    demoClientSignature: "Հաճախորդի ստորագրություն",
    cardTagline1: "Վեճերին վերջ։",
    cardTagline2: "Նախագիծը առաջ։",
    feature1: "Հստակ փուլեր",
    feature2: "Ակնթարթային ստորագրություն",
    feature3: "Զրո լրացուցիչ աշխատանք",
    feature4: "Ստեղծված Հայաստանի համար",
    painPointsTitle: "Այլևս ոչ մի «Մենք սրա մասին չենք պայմանավորվել»",
    painPoints: [
      {
        title: "Կեղծ ապահովության զգացում",
        body: "«Լավ է» գրառումը պայմանավորվածություն չէ։ Երբ ի հայտ են գալիս չնախատեսված ծախսեր, լռությունը փոխարինում է համաձայնությանը, ու դու ստիպված ես վճարել սեփական գրպանից։"
      },
      {
        title: "Սահմանների խախտում",
        body: "Սկսում ես մի աշխատանքից, բայց հաճախորդը շարունակում է խնդրել փոքր լրացուցիչ ծառայություններ։ Առանց հստակ սահմանների, «ոչ» ասելը հակամարտություն է թվում։"
      },
      {
        title: "Պայմանագրային բարդություններ",
        body: "Երկար իրավաբանական պայմանագրերը վախեցնում են հաճախորդներին։ Նրանք լարվում են, դադարում պատասխանել, ու պարզ նախագիծը մեռնում է նախքան սկսվելը։"
      },
      {
        title: "Անվճար բարի մտադրություններ",
        body: "Անվճար աշխատանք ես անում հաճախորդին գոհացնելու համար։ Առանց հստակ սահմանների, լավ սպասարկումը վերածվում է չվճարվող աշխատանքի։"
      }
    ],
    diffEyebrow: "",
    diffTitle: "Սիրողականները վիճում են WhatsApp-ում։",
    diffSubtitle: "",
    recommended: "",
    colWith: "Նոր ձևը",
    colWithout: "Հին ձևը",
    diffWithoutEyebrow: "",
    comparisonRows: [
      {
        label: "",
        withoutUs: "Խառը հաղորդագրություններ՝ կորած չաթերում",
        withVstah: "Մեկ հստակ հղում հեռախոսի մեջ՝ նախագծի ճշգրիտ մանրամասներով"
      },
      {
        label: "",
        withoutUs: "«Խնդրում եմ տպեք, ստորագրեք, սկանավորեք և ուղարկեք էլ. փոստով»",
        withVstah: "Արագ ստորագրություն մատով՝ հեռախոսի էկրանին, 10 վայրկյանում"
      },
      {
        label: "",
        withoutUs: "Անվերջ վեճեր այն մասին, թե իրականում ինչի շուրջ եք պայմանավորվել",
        withVstah: "Ծավալը, գինը և պայմանները ֆիքսված են նախքան աշխատանքը սկսելը"
      },
      {
        label: "",
        withoutUs: "Անհարմար չաթեր, երբ հաստատում ես խնդրում",
        withVstah: "Փուլերի պարզ հաստատում՝ մեկ հպումով"
      },
      {
        label: "",
        withoutUs: "Զրո ապացույց, երբ հիշողությունը մշուշոտվում է, ու պատմությունները փոխվում են",
        withVstah: "Թվային մշտական ապացույց, թե ով է ստորագրել և երբ"
      }
    ],
    processEyebrow: "",
    processTitle: "Չորս քայլ՝ ձեր բիզնեսն ապահովագրելու համար։",
    processSubtitle: "",
    processSteps: [
      {
        step: "01",
        title: "Սահմանեք ծավալը",
        desc: "Ընտրեք կաղապարը կամ նշեք նախագծի փուլերը, արժեքը դրամով և հիմնական պայմանները։"
      },
      {
        step: "02",
        title: "Ուղարկեք հղումը",
        desc: "Ուղարկեք ինտերակտիվ հղումը անմիջապես WhatsApp-ով, Telegram-ով կամ Viber-ով։"
      },
      {
        step: "03",
        title: "Օնլայն ստորագրություն",
        desc: "Ձեր հաճախորդը բացում է հղումը հեռախոսով, նայում է մանրամասները և ստորագրում մատով։"
      },
      {
        step: "04",
        title: "Ֆիքսեք պայմանագիրը",
        desc: "Երկու կողմերն էլ ստանում են իրավաբանական թվային պատճեն՝ առանց ավելորդ քաշքշուկի։"
      }
    ],
    preventionEyebrow: "Կանխարգելում",
    preventionTitle: "Կանգնեցրեք վեճերը\nՆախքան դրանց սկսվելը։",
    preventionBody:
      "Ստեղծեք հստակ սպասելիքներ և փոխադարձ պարտավորվածություն նախքան աշխատանքը սկսելը։",
    preventionItems: [
      {
        title: "Ֆիքսված ծավալ՝ առաջին իսկ օրվանից",
        body: "Յուրաքանչյուր փուլ, արժեք և աշխատանք ստորագրվում է նախքան սկսելը։ Զրո շփոթմունք ներառված աշխատանքների շուրջ։"
      },
      {
        title: "Ակնթարթային լրացումներ՝ ծավալի փոփոխման դեպքում",
        body: "Հաճախորդը լրացուցիչ աշխատա՞նք է ուզում։ Ուղարկեք նոր հղում։ Եթե ստորագրում են, ծավալը մեծանում է։ Եթե ոչ, մնում եք սկզբնական պայմանավորվածությանը։"
      },
      {
        title: "Անփոփոխ աուդիտորական հետք",
        body: "IP հասցեն, սարքի տվյալները և ստորագրման ճշգրիտ ժամը ստեղծում են համաձայնության մշտական ապացույց։"
      }
    ],
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
    pricingPlan: {
      name: "Pro",
      tagline: "Պարզ գնագոյացում",
      subtitle: "Սկսեք անվճար, թարմացրեք, երբ պատրաստ լինեք",
      price: "15,000 ֏ / ամիս",
      features: ["Ներառված է 10 անվճար պայմանագիր", "Անսահմանափակ՝ թարմացումից հետո"],
      cta: "Սկսել անվճար փորձաշրջանը"
    },
    faqTitle: "Հաճախ տրվող հարցեր",
    faqs: [
      {
        q: "Արդյո՞ք հաճախորդներս իրոք կօգտվեն սրանից, թե՞ սա կվախեցնի նրանց։",
        a: "Այն ակնթարթորեն վստահություն է ստեղծում։ Հաճախորդներն էլ տժվել են անակնկայի սյրպրիզներից, ինչպես դուք։ Հստակ բաժանումը բջջային էկրանի վրա ձեզ բարձրակարգ պրոֆեսիոնալ է ցույց տալիս։"
      },
      {
        q: "Արդյո՞ք հեռախոսի էկրանին մատով ստորագրությունն իրավաբանական ուժ ունի Հայաստանում։",
        a: "Այո։ Հայաստանի օրենքով թվային համաձայնությունը՝ IP հասցեի, սարքի տվյալների, ժամանակային կնիքի և պայմանների ընդունման հետ միասին՝ վավեր իրավական ապացույց է պայմանագրի կնքման համար։"
      },
      {
        q: "Ի՞նչ է տեղի ունենում, եթե հաճախորդը լրացուցիչ աշխատանք է պահանջում աշխատանքի կեսից։",
        a: "Ուղարկում եք նոր հղում լրացուցիչ աշխատանքի համար։ Ստորագրում է՝ ավելանում է, չի ստորագրում՝ մնում եք սկզբնական պայմանավորվածությանը։"
      },
      {
        q: "Արդյո՞ք հաճախորդները պետք է գրանցվեն կամ հավելված ներբեռնեն։",
        a: "Ոչ։ Հղումը WhatsApp-ում, ստորագրությունը հեռախոսի էկրանին, և պատրաստ։"
      },
      {
        q: "Կարո՞ղ եմ ֆիքսել առաջարկը, որպեսզի ստորագրելուց հետո այը հնարավոր չլինի փոխել։",
        a: "Ստորագրության վայրկյանից VSTAH-ը ստեղծում է անփոփոխ, ժամանակային կնիքով PDF, որը կողպված է երկու կողմերի համար։"
      }
    ]
  },
  ru: {
    brand: "VSTAH",
    navHome: "Главная",
    navHowItWorks: "Как это работает",
    navPricing: "Тарифы",
    btnProtectProject: "Попробовать бесплатно",
    btnSeeHow: "Как это работает",
    heroEyebrow: "",
    heroTitleLine1: "Защити каждую сделку",
    heroTitleLine2: "четким соглашением",
    heroTitleLine3: "до начала работ.",
    heroSubtitle: "Отправьте ссылку. Зафиксируйте условия. Избегите спора.",
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
    heroRow1Badge: "Подписано и утверждено",
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
    stage1Amount: "150,000 ֏",
    stage1State: "Выплачено",
    stage2Name: "Сантехника и электрика",
    stage2Amount: "200,000 ֏",
    stage2State: "Удерживается",
    stage3Name: "Финишная отделка",
    stage3Amount: "100,000 ֏",
    stage3State: "Ожидание",
    heroProposalStatus: "[Активно: подписано]",
    heroProposalLabel: "Предложение",
    heroMilestonesLabel: "Этапы проекта",
    heroStage1Status: "Утверждено",
    heroStage2Status: "В работе",
    heroStage3Status: "Ожидание",
    heroSignatureName: "Aram Petrosyan",
    heroDigitallyVerified: "Цифровая проверка",
    heroTapToSignHint: "Нажмите, чтобы подписать",
    heroSignatureLabel: "Подпись",
    heroSignCta: "Подписать и утвердить предложение",
    heroAuditTrail: "Аудит: IP проверен • Отметка времени • Юридическая запись",
    heroProposalMockupAria:
      "Интерактивное демо соглашения с этапами и цифровой подписью",
    demoProviderDetails: "Исполнитель",
    demoClientDetails: "Клиент",
    demoBusinessName: "BuildPro LLC",
    demoClientName: "Анаит Акопян",
    demoBusinessPhone: "+374 91 234 567",
    demoClientPhone: "+374 99 111 222",
    demoTotalLabel: "Итого",
    demoTotalAmount: "450,000 ֏",
    demoTermsTitle: "Условия",
    demoTermsBody:
      "Объём, цена и график платежей фиксируются после подписи. Доп. работы требуют письменного обновления до начала.",
    demoScrollHint: "Листайте, чтобы смотреть",
    demoOfferLabel: "Предложение",
    demoAgreementTitle: "Безопасное сервисное соглашение",
    demoSignedSubtitle: "Соглашение официально заключено и подписано",
    demoProjectHeader: "Название проекта / услуги",
    demoBusinessNameLabel: "Название бизнеса",
    demoClientNameLabel: "Имя клиента",
    demoPhoneLabel: "Телефон",
    demoPaymentSchedule: "График платежей",
    demoScheduleStatus: "Статус",
    demoStatusSigned: "Подписано",
    demoClientSignature: "Подпись клиента",
    cardTagline1: "Меньше споров.",
    cardTagline2: "Быстрее проект.",
    feature1: "Четкие этапы",
    feature2: "Мгновенные подписи",
    feature3: "Ноль лишней работы",
    feature4: "Создано для Армении",
    painPointsTitle: "Больше никаких «Мы об этом не договаривались»",
    painPoints: [
      {
        title: "Ложное чувство безопасности",
        body: "Сообщение «ок» — это не обязательство. Когда возникают непредвиденные расходы, тишина заменяет согласие, и вы платите из своего кармана."
      },
      {
        title: "Размытие границ",
        body: "Вы начинаете с одной задачи, но клиент продолжает просить о мелких дополнительных услугах. Без четких границ заранее, отказ кажется конфликтом."
      },
      {
        title: "Сложность договоров",
        body: "Длинные юридические договоры пугают клиентов. Они тревожатся, перестают отвечать, и простой проект умирает, не успев начаться."
      },
      {
        title: "Бесплатные благие намерения",
        body: "Вы делаете бесплатную работу, чтобы клиент был доволен. Без четких границ хороший сервис превращается в неоплачиваемый труд."
      }
    ],
    diffEyebrow: "",
    diffTitle: "Любители спорят в WhatsApp.",
    diffSubtitle: "",
    recommended: "",
    colWith: "Новый подход",
    colWithout: "Старый подход",
    diffWithoutEyebrow: "",
    comparisonRows: [
      {
        label: "",
        withoutUs: "Хаотичные сообщения, потерянные в чатах",
        withVstah: "Одна четкая ссылка в телефоне с точными деталями проекта"
      },
      {
        label: "",
        withoutUs: "«Пожалуйста, распечатайте, подпишите, отсканируйте и отправьте обратно»",
        withVstah: "Быстрая подпись пальцем на экране за 10 секунд"
      },
      {
        label: "",
        withoutUs: "Бесконечные споры о том, о чем на самом деле договаривались",
        withVstah: "Объем, цена и условия зафиксированы до начала работ"
      },
      {
        label: "",
        withoutUs: "Неловкие переписки при запросе подтверждения",
        withVstah: "Простое подтверждение этапов в одно касание"
      },
      {
        label: "",
        withoutUs: "Zero доказательств, когда память подводит, а версии меняются",
        withVstah: "Постоянное цифровое доказательство того, кто и когда подписал"
      }
    ],
    processEyebrow: "",
    processTitle: "Четыре шага для защиты вашего бизнеса.",
    processSubtitle: "",
    processSteps: [
      {
        step: "01",
        title: "Задайте объем",
        desc: "Выберите шаблон или укажите этапы проекта, стоимость в драмах и базовые условия."
      },
      {
        step: "02",
        title: "Отправьте ссылку",
        desc: "Отправьте интерактивную ссылку прямо в WhatsApp, Telegram или Viber."
      },
      {
        step: "03",
        title: "Онлайн-подпись",
        desc: "Ваш клиент открывает ссылку на телефоне, проверяет детали и подписывает пальцем."
      },
      {
        step: "04",
        title: "Зафиксируйте договор",
        desc: "Обе стороны получают юридическую цифровую копию без лишней суеты."
      }
    ],
    preventionEyebrow: "Предотвращение",
    preventionTitle: "Остановите споры\nДо того, как они начнутся.",
    preventionBody:
      "Сформируйте четкие ожидания и взаимные обязательства до начала работ.",
    preventionItems: [
      {
        title: "Зафиксированный объем с первого дня",
        body: "Каждый этап, стоимость и результат подписываются до начала работ. Никакой путаницы в том, что включено."
      },
      {
        title: "Мгновенные дополнения при изменении объема",
        body: "Клиент хочет дополнительную работу? Отправьте новую ссылку. Подпишет — объем расширяется. Нет — придерживаетесь первоначальной сделки."
      },
      {
        title: "Неизменяемый аудиторский след",
        body: "IP-адрес, метаданные устройства и точный таймштамп на каждой подписи создают постоянное доказательство договора."
      }
    ],
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
    pricingPlan: {
      name: "Pro",
      tagline: "Простые тарифы",
      subtitle: "Начните бесплатно, переходите на Pro, когда будете готовы",
      price: "15,000 ֏ / месяц",
      features: ["Включено 10 бесплатных договоров", "Безлимитно после перехода"],
      cta: "Начать бесплатный период"
    },
    faqTitle: "Часто задаваемые вопросы",
    faqs: [
      {
        q: "Будут ли мои клиенты реально этим пользоваться, или это их испугает?",
        a: "Это сразу вызывает доверие. Клиенты тоже ненавидят сюрпризы. Чёткий мобильный экран делает вас профессионалом высокого класса."
      },
      {
        q: "Имеет ли подпись пальцем на экране телефона юридическую силу в Армении?",
        a: "Да. Цифровое согласие с журналом проверки (IP, метаданные устройства, отметка времени, принятие условий) — действительное юридическое доказательство."
      },
      {
        q: "Что произойдет, если клиент потребует дополнительную работу посередине проекта?",
        a: "Отправляете ссылку на дополнение. Подписал — объём и цена добавлены. Не подписал — работаете строго по исходному договору."
      },
      {
        q: "Нужно ли моим клиентам регистрироваться или скачивать приложение?",
        a: "Нет. Ссылка в WhatsApp, подпись на экране — готово."
      },
      {
        q: "Могу ли я заблокировать предложение, чтобы его нельзя было изменить после подписания?",
        a: "В секунду подписи VSTAH создаёт защищённый от изменений PDF с отметкой времени, навсегда заблокированный для обеих сторон."
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
  const isHy = locale === "hy";

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
          <MarketingHeroSection t={t} isHy={isHy} locale={locale} />
        </section>

        <MarketingPainPointsGrid title={t.painPointsTitle} items={t.painPoints} />

        <MarketingFeaturesSection
          t={{
            feature1: t.feature1,
            feature2: t.feature2,
            feature3: t.feature3,
            feature4: t.feature4
          }}
        />

        <MarketingDifferenceSection
          locale={locale}
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

        <MarketingDisputePreventionSection
          preventionEyebrow={t.preventionEyebrow}
          preventionTitle={t.preventionTitle}
          preventionBody={t.preventionBody}
          preventionItems={t.preventionItems}
          btnProtectProject={t.btnProtectProject}
        />

        <MarketingPricingFaqSection
          openFaqIndex={openFaqIndex}
          onToggleFaq={(index) => setOpenFaqIndex(openFaqIndex === index ? null : index)}
          pricingPlan={{
            ...t.pricingPlan,
            href: ROUTES.register
          }}
          faqTitle={t.faqTitle}
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
