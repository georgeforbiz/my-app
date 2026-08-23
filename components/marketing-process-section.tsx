"use client";

import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";

type ProcessStep = { step: string; title: string; desc: string };

const STEP_ACCENTS = [
  { bar: "#E30A17", hover: "hover:bg-red-50/80" },
  { bar: "#0033A0", hover: "hover:bg-blue-50/80" },
  { bar: "#F2A800", hover: "hover:bg-amber-50/80" },
  { bar: "#0B1F3A", hover: "hover:bg-slate-50" }
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
    <section id="process" className="scroll-mt-28 border-t border-slate-100 bg-[#FAFBFC] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <MarketingSectionHeader
            eyebrow={processEyebrow}
            title={processTitle}
            subtitle={processSubtitle}
            align="center"
          />
        </Reveal>

        <ol className="relative mt-10 md:mt-14 lg:mt-16">
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[2.75rem] hidden h-px bg-slate-200 lg:block"
            aria-hidden
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {processSteps.map((step, idx) => {
              const accent = STEP_ACCENTS[idx] ?? STEP_ACCENTS[0];
              return (
                <li key={step.title} className="relative min-w-0">
                  <Reveal delay={idx * 45}>
                    <div
                      className={`relative flex h-full min-h-[10.5rem] flex-col items-center justify-center border border-slate-200/80 bg-white px-5 py-6 text-center transition-colors duration-200 sm:min-h-[11rem] sm:px-6 ${accent.hover}`}
                      style={{ borderTopWidth: 3, borderTopColor: accent.bar }}
                    >
                      <span
                        className="mb-4 inline-flex h-2.5 w-2.5 shrink-0 rounded-full lg:absolute lg:-top-[0.4rem] lg:mb-0"
                        style={{ backgroundColor: accent.bar }}
                        aria-hidden
                      />
                      <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">{step.title}</h3>
                      <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-slate-600">{step.desc}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </div>
        </ol>
      </div>
    </section>
  );
}
