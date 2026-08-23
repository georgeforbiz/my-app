"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Clock, FileText, Lock } from "lucide-react";
import { OutlineLightButton } from "@/components/vstah-button";
import { ORANGE } from "@/lib/brand";

const HERO_DOT_STYLES = [
  {
    active: "bg-[#E30A17] ring-2 ring-[#E30A17]/65",
    inactive: "bg-[#E30A17]/70 hover:bg-[#E30A17]"
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

type HeroCopy = {
  heroEyebrow: string;
  heroTitleBefore: string;
  heroTitleAfter: string;
  heroSlideAria: string;
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
  agreementPreviewTitle: string;
  pendingDeposit: string;
  clientLabel: string;
  serviceAreaLabel: string;
  termsSnapshot: string;
  termsSnapshotText: string;
  milestoneDemolition: string;
  milestonePlumbing: string;
  milestoneFinishing: string;
  stateLocked: string;
  statePending: string;
  awaitingFundsEscrow: string;
  depositRequired: string;
  depositFunds: string;
  providerDashboardTitle: string;
  completed: string;
  totalTransferred: string;
  agreementsTrackedMonth: string;
  finalPayoutCompleted: string;
  fundsSecuredEscrow: string;
  awaitingClientDeposit: string;
  statusPaid: string;
  statusSecured: string;
  releaseProgress: string;
  cardMediation: string;
  btnProtectProject: string;
  btnSeeHow: string;
};

export function MarketingHeroSection({
  t,
  isHy,
  heroChipsHyRu,
  locale
}: {
  t: HeroCopy;
  isHy: boolean;
  heroChipsHyRu: boolean;
  locale: "en" | "hy" | "ru";
}) {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const titleParts = (() => {
    const title = t.heroEyebrow;
    for (const delim of [". ", "։ ", " · "] as const) {
      const idx = title.indexOf(delim);
      if (idx === -1) continue;
      return {
        first: title.slice(0, idx + (delim === " · " ? 0 : 1)),
        second: title.slice(idx + delim.length)
      };
    }
    return { first: title, second: "" };
  })();

  return (
    <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 pt-8 sm:gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-8 md:px-6 md:pt-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div lang={heroChipsHyRu ? locale : undefined} className="relative z-10 flex min-w-0 w-full flex-col justify-center text-left md:pr-4 lg:pr-8">
        <p
          className={`font-semibold text-white/55 ${
            heroChipsHyRu
              ? "max-w-md text-[13px] leading-relaxed normal-case tracking-normal md:text-sm"
              : "text-[11px] uppercase tracking-[0.22em] md:text-xs"
          }`}
        >
          {heroChipsHyRu ? (
            <>
              <span className="block">{titleParts.first}</span>
              {titleParts.second ? <span className="mt-1 block">{titleParts.second}</span> : null}
            </>
          ) : (
            t.heroEyebrow
          )}
        </p>
        <h1
          className={`mt-5 w-full min-w-0 text-balance break-words font-black tracking-tight text-white hyphens-none sm:mt-6 ${
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
        <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/register?next=%2Fdashboard"
            className="inline-flex h-11 w-full items-center justify-center bg-[#E30A17] px-6 text-sm font-semibold text-white transition hover:bg-[#c40914] sm:h-12 sm:w-auto sm:px-8 sm:text-base"
          >
            {t.btnProtectProject}
          </Link>
          <OutlineLightButton href="/#difference" className="h-11 w-full border-white/40 px-6 sm:h-12 sm:w-auto sm:px-8">
            {t.btnSeeHow}
          </OutlineLightButton>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 sm:mt-9">
          {[t.cardChip1, t.cardChip2].map((label) => (
            <span
              key={label}
              className={`text-sm font-medium leading-snug text-white/85 ${heroChipsHyRu ? "hyphens-none break-words" : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative w-full min-w-0 pb-10 sm:pb-14 lg:pb-12 vstah-animate-in">
        <div className="relative">
          <div className="relative overflow-hidden bg-white vstah-soft-shadow-hero">
            <div className="flex items-center gap-2 bg-slate-50/90 px-4 py-2.5 sm:px-5">
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
                          ? `scale-110 ${HERO_DOT_STYLES[index].active}`
                          : HERO_DOT_STYLES[index].inactive
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
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-5">
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          {t.projectLabel}{" "}
                          <span className="text-slate-900">{t.projectId}</span>
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                          {t.projectTitle}
                        </h2>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {t.projectStatus}
                      </span>
                    </div>
                    <div className="mt-5 overflow-hidden bg-gradient-to-br from-[#0033A0] to-[#002a7a] p-5 text-white sm:p-6">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.fundsLabel}</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/90">{t.lockedNote}</p>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      <li className="flex items-center justify-between gap-3 bg-emerald-50/70 px-3.5 py-3 sm:px-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{t.stage1Name}</p>
                          <p className="text-xs font-medium text-slate-500">{t.stage1Amount}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                          {t.stage1State}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-3 bg-blue-50/50 px-3.5 py-3 sm:px-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{t.stage2Name}</p>
                          <p className="text-xs font-medium text-slate-500">{t.stage2Amount}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0033A0]">
                          <Lock className="h-3 w-3" strokeWidth={2.5} />
                          {t.stage2State}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-3 bg-slate-50 px-3.5 py-3 sm:px-4">
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
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                          {t.agreementPreviewTitle}
                        </h2>
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

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
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

                    <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#0033A0] to-[#002a7a] p-4 text-white shadow-inner sm:p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.awaitingFundsEscrow}</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-white/90">{t.depositRequired}</p>
                    </div>
                    <div
                      role="presentation"
                      aria-hidden="true"
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#E30A17] px-4 text-sm font-semibold text-white shadow-sm shadow-red-900/30"
                    >
                      {t.depositFunds}
                    </div>
                  </div>
                </article>

                <article className="w-full min-w-0 shrink-0 grow-0 basis-full">
                  <div className="p-5 text-slate-900 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-5">
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          {t.projectLabel} <span className="text-slate-900">{t.projectId}</span>
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                          {t.providerDashboardTitle}
                        </h2>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {t.completed}
                      </span>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl bg-gradient-to-br from-[#0033A0] to-[#002a7a] p-4 text-white shadow-inner sm:p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.totalTransferred}</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        2,450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-white/90">{t.agreementsTrackedMonth}</p>
                    </div>

                    <ul className="mt-5 space-y-2.5">
                      <li className="flex items-center justify-between gap-3 bg-emerald-50/70 px-3.5 py-3 sm:px-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">Agreement #AM-2841</p>
                          <p className="text-xs font-medium text-slate-500">{t.finalPayoutCompleted}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                          {t.statusPaid}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-3 bg-blue-50/50 px-3.5 py-3 sm:px-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">Agreement #AM-2843</p>
                          <p className="text-xs font-medium text-slate-500">{t.fundsSecuredEscrow}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0033A0]">
                          <Lock className="h-3 w-3" strokeWidth={2.5} />
                          {t.statusSecured}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-3 bg-slate-50 px-3.5 py-3 sm:px-4">
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
              className="px-4 py-2.5 text-center text-xs font-semibold text-slate-900 vstah-soft-shadow"
              style={{ backgroundColor: ORANGE }}
            >
              {t.cardMediation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
