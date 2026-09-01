"use client";

import Link from "next/link";
import { OutlineLightButton } from "@/components/vstah-button";
import { MarketingProposalPreviewCard, type ProposalPreviewCopy } from "@/components/marketing-proposal-preview-card";
import { ORANGE } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

type HeroCopy = ProposalPreviewCopy & {
  heroTitleBefore: string;
  heroTitleAfter: string;
  heroSubtitle: string;
  btnProtectProject: string;
  btnSeeHow: string;
};

const heroSubtitleClass =
  "w-full max-w-lg text-[1.0625rem] font-semibold leading-relaxed text-white/90 max-md:mx-auto max-md:text-center sm:text-lg md:max-w-xl md:border-l-2 md:border-[#F2A800]/75 md:pl-4 md:text-left md:text-xl";

const heroHeadlineClass =
  "mt-4 w-full min-w-0 text-balance text-pretty font-black tracking-tight text-center text-[2rem] leading-[1.12] sm:mt-5 sm:text-[2.35rem] md:text-left md:text-[2.5rem] md:leading-[1.1] lg:text-[3rem] xl:text-[3.35rem]";

function HeroHeadline({ before, after }: { before: string; after: string }) {
  return (
    <h1 className={heroHeadlineClass}>
      <span className="block max-md:mx-auto" style={{ color: ORANGE }}>
        {before}
      </span>
      <span className="mt-1.5 block text-white max-md:mx-auto md:mt-2">{after}</span>
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
        <p
          className={`${heroSubtitleClass}${locale === "en" || locale === "ru" ? " md:whitespace-nowrap" : ""}`}
        >
          {t.heroSubtitle.replace(/\n/g, " ")}
        </p>
        <HeroHeadline before={t.heroTitleBefore} after={t.heroTitleAfter} />
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
        <MarketingProposalPreviewCard t={t} />
      </div>
    </div>
  );
}
