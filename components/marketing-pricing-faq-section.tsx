"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing-section-header";
import { ORANGE } from "@/lib/brand";
import { formatProMonthly } from "@/lib/currency";
import type { Language } from "@/lib/i18n/locales";

type FaqItem = { q: string; a: string };

type Props = {
  locale: Language;
  pricingLongLocale: boolean;
  openFaqIndex: number | null;
  onToggleFaq: (index: number) => void;
  pricingPlanName: string;
  pricingTitle: string;
  pricingSubtitle: string;
  pricingPerMonth: string;
  pricingValueFree: string;
  pricingValuePro: string;
  pricingCta: string;
  faqEyebrow: string;
  faqTitle: string;
  faqSubtitle: string;
  faqs: FaqItem[];
};

export function MarketingPricingFaqSection({
  locale,
  pricingLongLocale,
  openFaqIndex,
  onToggleFaq,
  pricingPlanName,
  pricingTitle,
  pricingSubtitle,
  pricingPerMonth,
  pricingValueFree,
  pricingValuePro,
  pricingCta,
  faqEyebrow,
  faqTitle,
  faqSubtitle,
  faqs
}: Props) {
  const priceTextClass = pricingLongLocale
    ? "text-xl sm:text-2xl lg:text-[1.65rem]"
    : "text-2xl sm:text-3xl lg:text-[2.35rem]";

  return (
    <section id="pricing" className="relative scroll-mt-28 border-t border-slate-100 bg-[#FAFBFC] py-16 md:py-24" aria-label={`${pricingTitle} & ${faqTitle}`}>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-6 lg:gap-8">
          <article className="relative md:col-span-5 md:row-span-2 lg:col-span-5">
            <div className="vstah-soft-shadow-lg relative border border-slate-200/80 bg-white p-6 sm:p-8 md:-rotate-[0.5deg] lg:p-10">
              <MarketingSectionHeader eyebrow={pricingPlanName} title={pricingTitle} subtitle={pricingSubtitle} />

              <div className="mt-8 px-1 py-6 text-center sm:py-8" style={{ backgroundColor: ORANGE }}>
                <p
                  suppressHydrationWarning
                  className={`max-w-full font-black tabular-nums leading-tight tracking-tight text-slate-900 [overflow-wrap:anywhere] ${priceTextClass}`}
                >
                  {formatProMonthly(pricingPerMonth, locale)}
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {[pricingValueFree, pricingValuePro].map((text) => (
                  <li key={text} className="bg-[#F4F7FB] px-4 py-3.5">
                    <span className="min-w-0 text-sm font-semibold leading-snug text-slate-800 [overflow-wrap:anywhere]">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register?next=%2Fdashboard"
                className="mt-8 inline-flex w-full items-center justify-center bg-[#0033A0] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#002a7a]"
              >
                {pricingCta}
              </Link>
            </div>
          </article>

          <article id="faq" className="scroll-mt-28 md:col-span-7 md:col-start-6 lg:col-span-7 lg:col-start-6 lg:-mt-8">
            <div className="vstah-soft-shadow-feature bg-white p-6 sm:p-8 lg:p-10">
              <MarketingSectionHeader eyebrow={faqEyebrow} title={faqTitle} subtitle={faqSubtitle} />

              <div className="mt-8 space-y-2">
                {faqs.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  const panelId = `faq-panel-${index}`;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden transition-colors ${isOpen ? "bg-slate-50" : "bg-[#FAFBFC]"}`}
                    >
                      <button
                        type="button"
                        id={`faq-trigger-${index}`}
                        onClick={() => onToggleFaq(index)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
                      >
                        <span className="min-w-0 text-[13px] font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] sm:text-sm">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          strokeWidth={2.5}
                        />
                      </button>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={`faq-trigger-${index}`}
                        className={`grid transition-all duration-200 ease-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere] sm:px-5 sm:pb-5">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
