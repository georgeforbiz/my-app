"use client";

import Link from "next/link";
import { OutlineLightButton } from "@/components/vstah-button";
import { MarketingAgreementDemo, type ProposalPreviewCopy } from "@/components/marketing-proposal-preview-card";
import { ORANGE } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

type HeroCopy = ProposalPreviewCopy & {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleLine3: string;
  heroSubtitle: string;
  btnProtectProject: string;
  btnSeeHow: string;
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

/** HY/RU translations run longer — keep the same 3-line breaks with a smaller scale. */
const heroHeadlineClassLocalized =
  "mt-4 w-full min-w-0 font-black tracking-tight text-center text-[clamp(1.15rem,calc(3.4vw+0.35rem),2.35rem)] leading-[1.18] sm:mt-5 md:text-left md:leading-[1.14]";

/** Keep each phrase on one row — no mid-line wraps like "with a clear / agreement". */
const heroHeadlineRowClass = "block whitespace-nowrap max-md:mx-auto md:mt-1 lg:mt-1.5 first:mt-0";

function HeroHeadline({
  line1,
  line2,
  line3,
  compact
}: {
  line1: string;
  line2: string;
  line3: string;
  compact?: boolean;
}) {
  return (
    <h1 className={compact ? heroHeadlineClassLocalized : heroHeadlineClassEn}>
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
  const compactHeadline = locale === "hy" || locale === "ru";
  void isHy;

  const buttonsClass = isArmenian
    ? "mt-8 flex w-full max-md:max-w-sm flex-col gap-3 sm:mt-9 md:flex-row md:flex-nowrap md:items-center md:justify-start md:gap-2"
    : "mt-8 flex w-full max-md:max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center md:justify-start";

  const primaryBtnClass = isArmenian
    ? "inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] md:h-11 md:w-auto md:flex-none md:px-5 md:whitespace-nowrap"
    : "inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] sm:h-12 sm:w-auto sm:px-8 sm:text-base";

  const secondaryBtnClass = isArmenian
    ? "h-11 w-full border-white/40 px-6 md:h-11 md:w-auto md:flex-none md:px-5 md:whitespace-nowrap"
    : "h-11 w-full border-white/40 px-6 sm:h-12 sm:w-auto sm:px-8";

  return (
    <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 pt-8 max-md:justify-items-center sm:gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-10 md:px-6 md:pt-10 lg:gap-14">
      <div className="relative z-10 flex min-w-0 w-full flex-col items-center text-center max-md:mx-auto md:max-w-[34rem] md:items-start md:pl-6 md:text-left lg:pl-12 xl:pl-16">
        <HeroSubtitle text={t.heroSubtitle} locale={locale} />
        <HeroHeadline
          line1={t.heroTitleLine1}
          line2={t.heroTitleLine2}
          line3={t.heroTitleLine3}
          compact={compactHeadline}
        />
        <div className={buttonsClass}>
          <Link href={ROUTES.register} className={primaryBtnClass}>
            {t.btnProtectProject}
          </Link>
          <OutlineLightButton href="/#process" className={secondaryBtnClass}>
            {t.btnSeeHow}
          </OutlineLightButton>
        </div>
      </div>

      <div className="relative flex w-full min-w-0 items-center justify-center overflow-visible pb-2 sm:pb-4 md:justify-end md:pb-0 vstah-animate-in">
        <MarketingAgreementDemo t={t} locale={locale} />
      </div>
    </div>
  );
}
