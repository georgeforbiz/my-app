"use client";

import Image from "next/image";
import { Battery, Check, Clock, Lock, ShieldCheck, Signal, Wifi } from "lucide-react";

export type ProposalPreviewCopy = {
  projectId: string;
  projectTitle: string;
  heroProposalStatus: string;
  heroProposalLabel: string;
  heroMilestonesLabel: string;
  stage1Name: string;
  stage1Amount: string;
  heroStage1Status: string;
  stage2Name: string;
  stage2Amount: string;
  heroStage2Status: string;
  stage3Name: string;
  stage3Amount: string;
  heroStage3Status: string;
  heroSignatureName: string;
  heroDigitallyVerified: string;
  heroTapToSignHint: string;
  heroSignatureLabel: string;
  heroSignCta: string;
  heroRow1Badge: string;
  heroAuditTrail: string;
  heroProposalMockupAria: string;
};

export function MarketingProposalPreviewCard({ t }: { t: ProposalPreviewCopy }) {
  const milestones = [
    {
      name: t.stage1Name,
      amount: t.stage1Amount,
      status: t.heroStage1Status,
      icon: Check,
      accent: "border-l-emerald-500 bg-white ring-emerald-100/80",
      iconWrap: "bg-emerald-100 text-emerald-600",
      statusClass: "text-emerald-600"
    },
    {
      name: t.stage2Name,
      amount: t.stage2Amount,
      status: t.heroStage2Status,
      icon: Clock,
      accent: "border-l-blue-500 bg-white ring-blue-100/80",
      iconWrap: "bg-blue-100 text-blue-600",
      statusClass: "text-blue-600"
    },
    {
      name: t.stage3Name,
      amount: t.stage3Amount,
      status: t.heroStage3Status,
      icon: Lock,
      accent: "border-l-slate-300 bg-white/90 ring-slate-100",
      iconWrap: "bg-slate-100 text-slate-500",
      statusClass: "text-slate-500"
    }
  ] as const;

  const statusLabel = t.heroProposalStatus.replace(/^\[|\]$/g, "").trim();

  return (
    <div className="w-full" aria-label={t.heroProposalMockupAria}>
      <div className="relative mx-auto flex min-h-[380px] w-full max-w-[420px] items-center justify-center py-8 sm:min-h-[420px] sm:max-w-[460px] sm:py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="absolute h-[min(100%,420px)] w-[min(100%,420px)] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute h-[72%] w-[72%] rounded-full bg-[#F2A800]/12 blur-2xl" />
          <div className="absolute h-[88%] w-[88%] rounded-full border border-white/10" />
          <div className="absolute h-[68%] w-[68%] rounded-full border border-dashed border-white/15" />
          <div className="absolute left-[14%] top-[18%] h-2 w-2 rounded-full bg-[#F2A800]/70 blur-[1px]" />
          <div className="absolute right-[16%] top-[24%] h-1.5 w-1.5 rounded-full bg-white/50" />
          <div className="absolute bottom-[20%] left-[22%] h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>

        <div className="relative w-full max-w-[300px] sm:max-w-[320px]">
          <div className="relative rounded-[2.75rem] bg-gradient-to-b from-slate-700 via-slate-900 to-black p-[10px] shadow-[0_28px_56px_-14px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
            <span className="absolute -left-[3px] top-[84px] h-7 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -left-[3px] top-[124px] h-10 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -left-[3px] top-[168px] h-10 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -right-[3px] top-[116px] h-14 w-[3px] rounded-r-sm bg-slate-600" aria-hidden />

            <div className="relative overflow-hidden rounded-[2.2rem] bg-black ring-1 ring-white/10">
              <div className="relative bg-white px-4 pb-1.5 pt-3">
                <div
                  className="absolute left-1/2 top-2 z-10 h-[25px] w-[92px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  aria-hidden
                />
                <div className="relative z-[1] flex items-center justify-between px-1 text-[11px] font-semibold tracking-tight text-slate-900">
                  <span>9:41</span>
                  <span className="flex items-center gap-1">
                    <Signal className="h-3 w-3" strokeWidth={2.5} />
                    <Wifi className="h-3 w-3" strokeWidth={2.5} />
                    <Battery className="h-3.5 w-4" strokeWidth={2} />
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 font-sans">
                <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-[18px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t.heroProposalLabel}</p>
                  <h3 className="mt-1 text-[13px] font-bold leading-snug text-slate-900">
                    {t.projectId}
                    <span className="font-semibold text-slate-400"> · </span>
                    <span className="font-semibold text-slate-700">{t.projectTitle}</span>
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {statusLabel}
                  </span>
                </div>

                <div className="space-y-3 px-4 py-3 sm:px-[18px]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {t.heroMilestonesLabel}
                  </p>
                  <ul className="space-y-2">
                    {milestones.map((milestone) => {
                      const Icon = milestone.icon;
                      return (
                        <li
                          key={milestone.name}
                          className={`flex items-center justify-between gap-2 rounded-lg border-l-[3px] p-2.5 ring-1 ${milestone.accent}`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${milestone.iconWrap}`}
                            >
                              <Icon className="h-3 w-3" strokeWidth={2.5} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-semibold leading-tight text-slate-900">
                                {milestone.name}
                              </p>
                              <p className={`text-[10px] font-medium ${milestone.statusClass}`}>{milestone.status}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-800">
                            {milestone.amount}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-slate-200/80 bg-white px-4 pb-3 pt-3 sm:px-[18px]">
                  <div className="rounded-lg border border-slate-200/90 bg-white p-2.5 shadow-sm">
                    <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#0033A0]">
                      {t.heroSignatureLabel}
                    </p>
                    <div className="relative mt-1.5 overflow-hidden rounded-md bg-[linear-gradient(to_bottom,#f8fafc_0%,#ffffff_100%)] px-2.5 py-2 ring-1 ring-slate-200/80">
                      <div
                        className="pointer-events-none absolute inset-x-2.5 bottom-1.5 border-b border-slate-300/90"
                        aria-hidden
                      />
                      <Image
                        src="/marketing/signature-mark.svg"
                        alt=""
                        width={128}
                        height={32}
                        className="relative z-[1] mx-auto block h-6 w-auto max-w-[5.5rem] object-contain"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                      {t.heroDigitallyVerified}
                    </p>
                  </div>

                  <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[11px] font-bold text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
                    {t.heroRow1Badge}
                  </div>

                  <p className="mt-2 text-center text-[8px] font-medium leading-relaxed tracking-wide text-slate-400">
                    {t.heroAuditTrail}
                  </p>
                </div>

                <div className="flex justify-center bg-white pb-2.5 pt-0.5">
                  <div className="h-[5px] w-[118px] rounded-full bg-slate-900/20" aria-hidden />
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-[2.2rem] bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-20"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
