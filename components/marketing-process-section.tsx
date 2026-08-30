"use client";

import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";
import { NAVY, ORANGE, RED } from "@/lib/brand";

type ProcessStep = { step: string; title: string; desc: string };

const STEP_COLORS = [RED, NAVY, ORANGE, "#0B1F3A"] as const;

const STEP_HOVER = [
  "hover:bg-red-50/70",
  "hover:bg-blue-50/70",
  "hover:bg-amber-50/70",
  "hover:bg-slate-50"
] as const;

export function MarketingProcessSection({
  processEyebrow,
  processTitle,
  processSubtitle,
  processSteps
}: {
  processEyebrow: string;
  processTitle: string;
  processSubtitle: string;
  processSteps: ProcessStep[];
}) {
  return (
    <section id="process" className="scroll-mt-28 bg-[#FAFBFC] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <MarketingSectionHeader
            eyebrow={processEyebrow}
            title={processTitle}
            subtitle={processSubtitle}
            align="center"
          />
        </Reveal>

        <Reveal className="mt-10 md:mt-12">
          <ol className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white vstah-soft-shadow-lg">
            {processSteps.map((step, idx) => {
              const color = STEP_COLORS[idx] ?? STEP_COLORS[0];
              const hoverBg = STEP_HOVER[idx] ?? STEP_HOVER[0];
              const isLast = idx === processSteps.length - 1;

              return (
                <li
                  key={step.title}
                  className={`group flex cursor-default gap-5 px-5 py-6 transition-colors duration-200 sm:gap-6 sm:px-8 sm:py-7 ${hoverBg} ${
                    !isLast ? "border-b border-slate-100" : ""
                  }`}
                >
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black tabular-nums text-white transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12 sm:text-[15px]"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    >
                      {step.step}
                    </span>
                    {!isLast ? (
                      <div className="mt-2 hidden w-px flex-1 bg-slate-200 sm:block" aria-hidden />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5 transition-transform duration-200 group-hover:translate-x-0.5 sm:pt-1">
                    <h3 className="text-base font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-slate-950 sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
