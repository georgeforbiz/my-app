"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { OutlineLightButton } from "@/components/vstah-button";
import { AgreementDocumentView } from "@/components/agreement-document-view";
import {
  MarketingAgreementDemo,
  buildMarketingDemoAgreement,
  type ProposalPreviewCopy
} from "@/components/marketing-proposal-preview-card";
import { ORANGE } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

type HeroCopy = ProposalPreviewCopy & {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleLine3: string;
  heroSubtitle: string;
  btnProtectProject: string;
  btnSeeHow: string;
  btnViewExample: string;
  examplePopupIntro: string;
  btnCloseExample: string;
};

/** EN — mobile: 2 rows; md+: one row. */
const heroSubtitleMobileEnClass =
  "flex w-full min-w-0 flex-col gap-0.5 text-center text-[1.0625rem] font-semibold leading-snug text-white/90 sm:text-lg md:hidden";

const heroSubtitleDesktopEnClass =
  "hidden w-full max-w-xl whitespace-nowrap text-xl font-semibold leading-relaxed text-white/90 md:block md:border-l-2 md:border-[#F2A800]/75 md:pl-4 md:text-left";

/** HY — mobile: larger stacked lines; md+: one row. */
const heroSubtitleMobileHyClass =
  "flex w-full min-w-0 flex-col gap-0.5 text-center text-[1.125rem] font-semibold leading-snug text-white/90 sm:text-xl md:hidden";

/** RU — mobile: 3 stacked lines; md+: one row. */
const heroSubtitleMobileRuClass =
  "flex w-full min-w-0 flex-col gap-0.5 text-center text-[0.9375rem] font-semibold leading-snug text-white/90 sm:text-base md:hidden";

const heroSubtitleDesktopLocalizedClass =
  "hidden w-full min-w-0 whitespace-nowrap text-[0.95rem] font-semibold leading-snug text-white/90 md:block md:border-l-2 md:border-[#F2A800]/75 md:pl-4 md:text-left lg:text-base";

const EN_SUBTITLE_MOBILE_LINES = ["Send a link. Lock the terms.", "Avoid the argument."] as const;

function localizedSubtitleLines(text: string, locale: "hy" | "ru"): string[] {
  if (locale === "hy") {
    const parts = text.split(/\s*:\s*/).filter(Boolean);
    return parts.map((part, i) => (i < parts.length - 1 ? `${part}:` : part));
  }
  const parts = text.split(/\.\s+/).filter(Boolean);
  return parts.map((part, i) => (i < parts.length - 1 ? `${part}.` : part.endsWith(".") ? part : `${part}.`));
}

function HeroSubtitle({ text, locale }: { text: string; locale: "en" | "hy" | "ru" }) {
  const normalized = text.replace(/\n/g, " ");

  if (locale === "hy" || locale === "ru") {
    const lines = localizedSubtitleLines(normalized, locale);
    const mobileClass = locale === "hy" ? heroSubtitleMobileHyClass : heroSubtitleMobileRuClass;
    return (
      <>
        <p className={mobileClass} aria-label={normalized}>
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p className={heroSubtitleDesktopLocalizedClass}>{normalized}</p>
      </>
    );
  }

  return (
    <>
      <p className={heroSubtitleMobileEnClass} aria-label={normalized}>
        {EN_SUBTITLE_MOBILE_LINES.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className={heroSubtitleDesktopEnClass}>{normalized}</p>
    </>
  );
}

const heroHeadlineClassEn =
  "mt-4 w-full min-w-0 font-black tracking-tight text-center text-[clamp(1.45rem,calc(4.8vw+0.4rem),3.35rem)] leading-[1.15] sm:mt-5 md:text-left md:leading-[1.12]";

/** HY translations run longer — keep the same 3-line breaks with a smaller scale. */
const heroHeadlineClassHy =
  "mt-4 w-full min-w-0 font-black tracking-tight text-center text-[clamp(1.15rem,calc(3.4vw+0.35rem),2.35rem)] leading-[1.18] sm:mt-5 md:text-left md:leading-[1.14]";

/** RU — larger on mobile only; desktop cap stays the same. */
const heroHeadlineClassRu =
  "mt-4 w-full min-w-0 font-black tracking-tight text-center text-[clamp(1.45rem,calc(4.8vw+0.45rem),2.35rem)] leading-[1.16] sm:mt-5 md:text-left md:text-[clamp(1.15rem,calc(3.4vw+0.35rem),2.35rem)] md:leading-[1.14]";

/** Keep each phrase on one row — no mid-line wraps like "with a clear / agreement". */
const heroHeadlineRowClass = "block whitespace-nowrap max-md:mx-auto md:mt-1 lg:mt-1.5 first:mt-0";

function HeroHeadline({
  line1,
  line2,
  line3,
  locale
}: {
  line1: string;
  line2: string;
  line3: string;
  locale: "en" | "hy" | "ru";
}) {
  const headlineClass =
    locale === "ru" ? heroHeadlineClassRu : locale === "hy" ? heroHeadlineClassHy : heroHeadlineClassEn;

  return (
    <h1 className={headlineClass}>
      <span className={heroHeadlineRowClass} style={{ color: ORANGE }}>
        {line1}
      </span>
      <span className={`${heroHeadlineRowClass} text-white`}>{line2}</span>
      <span className={`${heroHeadlineRowClass} text-white`}>{line3}</span>
    </h1>
  );
}

export function MarketingHeroSection({
  t,
  isHy,
  locale
}: {
  t: HeroCopy;
  isHy: boolean;
  locale: "en" | "hy" | "ru";
}) {
  const isArmenian = locale === "hy";
  const [exampleOpen, setExampleOpen] = useState(false);
  const exampleAgreement = useMemo(() => buildMarketingDemoAgreement(t), [t]);
  void isHy;

  useEffect(() => {
    if (!exampleOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExampleOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [exampleOpen]);

  const buttonsClass = isArmenian
    ? "mt-8 flex w-full max-md:max-w-sm flex-col gap-3 sm:mt-9 md:flex-row md:flex-nowrap md:items-center md:justify-start md:gap-2"
    : "mt-8 flex w-full max-md:max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center md:justify-start";

  const primaryBtnClass = isArmenian
    ? "inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] md:h-11 md:w-auto md:flex-none md:px-5 md:whitespace-nowrap"
    : "inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] sm:h-12 sm:w-auto sm:px-8 sm:text-base";

  const secondaryBtnClass = isArmenian
    ? "h-11 w-full border-white/40 px-6 md:h-11 md:w-auto md:flex-none md:px-5 md:whitespace-nowrap"
    : "h-11 w-full border-white/40 px-6 sm:h-12 sm:w-auto sm:px-8";

  const exampleBtnClass =
    "mt-3 inline-flex w-full max-md:max-w-sm items-center justify-center text-sm font-semibold text-white/85 underline decoration-white/40 underline-offset-4 transition hover:text-white hover:decoration-white md:w-auto md:justify-start sm:text-base";

  return (
    <>
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 pt-8 max-md:justify-items-center sm:gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-10 md:px-6 md:pt-10 lg:gap-14">
        <div className="relative z-10 flex min-w-0 w-full flex-col items-center text-center max-md:mx-auto md:max-w-[34rem] md:items-start md:pl-6 md:text-left lg:pl-12 xl:pl-16">
          <HeroSubtitle text={t.heroSubtitle} locale={locale} />
          <HeroHeadline
            line1={t.heroTitleLine1}
            line2={t.heroTitleLine2}
            line3={t.heroTitleLine3}
            locale={locale}
          />
          <div className={buttonsClass}>
            <Link href={ROUTES.register} className={primaryBtnClass}>
              {t.btnProtectProject}
            </Link>
            <OutlineLightButton href="/#process" className={secondaryBtnClass}>
              {t.btnSeeHow}
            </OutlineLightButton>
          </div>
          <button type="button" onClick={() => setExampleOpen(true)} className={exampleBtnClass}>
            {t.btnViewExample}
          </button>
        </div>

        <div className="relative flex w-full min-w-0 items-center justify-center overflow-visible pb-2 sm:pb-4 md:justify-end md:pb-0 vstah-animate-in">
          <MarketingAgreementDemo t={t} locale={locale} />
        </div>
      </div>

      {exampleOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.btnViewExample}
          onClick={() => setExampleOpen(false)}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-[min(100%,56rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-100 via-[#f8fafc] to-slate-200/90 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-800">
                {t.examplePopupIntro}
              </p>
              <button
                type="button"
                onClick={() => setExampleOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label={t.btnCloseExample}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <AgreementDocumentView agreement={exampleAgreement} lang={locale} embedded logoBelowBadge />
            </div>
            <div className="flex border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setExampleOpen(false)}
                className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.btnCloseExample}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
