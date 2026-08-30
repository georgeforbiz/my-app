"use client";

import Link from "next/link";
import { OutlineLightButton } from "@/components/vstah-button";
import { MarketingProposalPreviewCard, type ProposalPreviewCopy } from "@/components/marketing-proposal-preview-card";
import { ORANGE } from "@/lib/brand";

type HeroCopy = ProposalPreviewCopy & {
  heroTitleBefore: string;
  heroTitleAfter: string;
  heroSubtitle: string;
  btnProtectProject: string;
  btnSeeHow: string;
};

export function MarketingHeroSection({
  t,
  isHy,
  locale
}: {
  t: HeroCopy;
  isHy: boolean;
  locale: "en" | "hy" | "ru";
}) {
  void isHy;
  void locale;

  return (
    <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 pt-8 max-md:justify-items-center sm:gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-8 md:px-6 md:pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div className="relative z-10 flex min-w-0 w-full max-w-lg flex-col items-center justify-center text-center max-md:mx-auto md:max-w-none md:items-start md:pl-10 md:pr-2 md:text-left lg:pl-16 lg:pr-4 xl:pl-20">
        <p className="w-full max-w-xl text-base font-semibold leading-relaxed text-white/85 max-md:mx-auto max-md:text-center sm:text-lg md:text-left">
          {t.heroSubtitle.split("\n").map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </p>
        <h1 className="mt-4 w-full min-w-0 text-balance break-words text-center font-black tracking-tight text-white hyphens-none text-[2rem] leading-[1.12] sm:mt-5 sm:text-[2.5rem] md:text-left md:text-[2.35rem] lg:text-[3rem] xl:text-[3.35rem]">
          <span className="block max-md:mx-auto" style={{ color: ORANGE }}>
            {t.heroTitleBefore}
          </span>
          <span className="block text-white max-md:mx-auto">{t.heroTitleAfter.trim()}</span>
        </h1>
        <div className="mt-8 flex w-full max-md:max-w-sm flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center md:justify-start">
          <Link
            href="/register?next=%2Fdashboard"
            className="inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] sm:h-12 sm:w-auto sm:px-8 sm:text-base"
          >
            {t.btnProtectProject}
          </Link>
          <OutlineLightButton href="/#process" className="h-11 w-full border-white/40 px-6 sm:h-12 sm:w-auto sm:px-8">
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
