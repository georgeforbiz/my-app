"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { NAVY, ORANGE, RED } from "@/lib/brand";
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

function PanelHeader({
  eyebrow,
  title,
  subtitle,
  titleClassName = "text-xl sm:text-2xl"
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  titleClassName?: string;
}) {
  return (
    <header className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: NAVY }}>
        {eyebrow}
      </p>
      <h2 className={`mt-2 font-black leading-tight tracking-tight text-slate-900 ${titleClassName}`}>{title}</h2>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{subtitle}</p>
    </header>
  );
}

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
    : "text-2xl sm:text-3xl lg:text-4xl";

  return (
    <section
      id="pricing"
      className="relative scroll-mt-28 bg-slate-50 py-12 md:py-14"
      aria-label={`${pricingTitle} & ${faqTitle}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-stretch">
            {/* Pricing */}
            <article className="flex min-w-0 flex-col border-b border-slate-200/80 p-6 sm:p-8 md:border-b-0 md:border-r md:p-8 lg:p-12 xl:p-14">
              <PanelHeader
                eyebrow={pricingPlanName}
                title={pricingTitle}
                subtitle={pricingSubtitle}
                titleClassName={pricingLongLocale ? "text-xl sm:text-2xl" : "text-2xl sm:text-[1.65rem]"}
              />

              <div
                className="mt-6 flex w-full items-center justify-center rounded-2xl border border-amber-700/30 px-4 py-5 text-center shadow-sm ring-1 ring-amber-900/15 sm:px-6 sm:py-6"
                style={{ backgroundColor: ORANGE }}
              >
                <p
                  suppressHydrationWarning
                  className={`max-w-full font-black tabular-nums leading-tight tracking-tight text-slate-900 [overflow-wrap:anywhere] ${priceTextClass}`}
                >
                  {formatProMonthly(pricingPerMonth, locale)}
                </p>
              </div>

              <div className="mt-6 flex flex-1 flex-col gap-5 border-t border-slate-200/80 pt-6 md:mt-8">
                <ul className="grid min-w-0 gap-3">
                  {[
                    {
                      text: pricingValueFree,
                      iconClass: "bg-emerald-100 text-emerald-700 ring-emerald-600/15",
                      textClass: "text-slate-800"
                    },
                    {
                      text: pricingValuePro,
                      iconClass: "bg-blue-100 text-[#0033A0] ring-[#0033A0]/15",
                      textClass: "text-slate-800"
                    }
                  ].map((item) => (
                    <li
                      key={item.text}
                      className="grid min-h-[3.25rem] grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-3 sm:px-4"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${item.iconClass}`}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                      <span
                        className={`min-w-0 text-sm font-semibold leading-snug [overflow-wrap:anywhere] ${item.textClass}`}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register?next=%2Fdashboard"
                  className="group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0033A0] px-5 py-3.5 text-sm font-bold leading-snug text-white shadow-lg shadow-[#0033A0]/25 transition hover:bg-[#002a7a] hover:shadow-xl hover:shadow-[#0033A0]/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="text-center [overflow-wrap:anywhere]">{pricingCta}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" strokeWidth={2.5} />
                </Link>
              </div>
            </article>

            {/* FAQ */}
            <article id="faq" className="scroll-mt-28 flex min-w-0 flex-col p-6 sm:p-8 md:p-8 lg:p-12 xl:p-14">
              <PanelHeader eyebrow={faqEyebrow} title={faqTitle} subtitle={faqSubtitle} />

              <div className="mt-6 flex flex-1 flex-col gap-3 md:mt-8">
                {faqs.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                        isOpen
                          ? "border-[#0033A0]/25 bg-slate-50 shadow-sm ring-1 ring-[#0033A0]/10"
                          : "border-slate-200/90 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleFaq(index)}
                        aria-expanded={isOpen}
                        className="grid min-h-[3.25rem] w-full grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] items-center gap-3 px-3 py-3 text-left sm:px-4"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums ring-1 transition-colors ${
                            isOpen ? "text-white ring-red-600/25" : "bg-red-50 ring-red-200"
                          }`}
                          style={
                            isOpen
                              ? { backgroundColor: RED }
                              : { color: RED }
                          }
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 text-[13px] font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 justify-self-end text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[#0033A0]" : ""
                          }`}
                          strokeWidth={2.5}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-200 ease-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-slate-200/80 px-3 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
                            <span aria-hidden className="block h-9 w-9 shrink-0" />
                            <p className="min-w-0 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
