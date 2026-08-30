"use client";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";

export type PreventionItem = { title: string; body: string };

export function MarketingDisputePreventionSection({
  preventionEyebrow,
  preventionTitle,
  preventionBody,
  preventionItems,
  btnProtectProject
}: {
  preventionEyebrow: string;
  preventionTitle: string;
  preventionBody: string;
  preventionItems: readonly PreventionItem[];
  btnProtectProject: string;
}) {
  return (
    <section id="prevention" className="scroll-mt-28 border-t border-slate-100 bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 vstah-soft-shadow-lg">
            <div className="grid md:grid-cols-5 md:divide-x md:divide-slate-200/80">
              <div className="flex flex-col justify-center bg-[#F3F4F6] px-6 py-8 sm:px-8 sm:py-10 md:col-span-2">
                <MarketingSectionHeader
                  eyebrow={preventionEyebrow}
                  title={preventionTitle}
                  subtitle={preventionBody}
                />
                <Link
                  href="/register?next=%2Fdashboard"
                  className="mt-8 inline-flex w-full items-center justify-center bg-[#E30A17] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#c40914] sm:mt-10"
                >
                  {btnProtectProject}
                </Link>
              </div>

              <ul className="divide-y divide-slate-100 md:col-span-3">
                {preventionItems.map(({ title, body }, idx) => (
                  <li key={title} className="px-6 py-6 sm:px-8 sm:py-7">
                    <div className="flex gap-4">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0033A0]/10 text-xs font-black tabular-nums text-[#0033A0]"
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold leading-snug text-slate-900 sm:text-base [overflow-wrap:anywhere]">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
