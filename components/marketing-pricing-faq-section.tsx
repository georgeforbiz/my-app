"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Sparkles } from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing-section-header";
import { NAVY } from "@/lib/brand";

type FaqItem = { q: string; a: string };

type PricingPlan = {
  name: string;
  tagline: string;
  subtitle: string;
  price: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
  popularBadge?: string;
};

type Props = {
  openFaqIndex: number | null;
  onToggleFaq: (index: number) => void;
  pricingTitle?: string;
  pricingPlan: PricingPlan;
  faqTitle: string;
  faqs: FaqItem[];
};

function splitPrice(price: string): { amount: string; period: string } {
  const slashIdx = price.indexOf("/");
  if (slashIdx === -1) return { amount: price, period: "" };
  return {
    amount: price.slice(0, slashIdx).trim(),
    period: price.slice(slashIdx).trim()
  };
}

export function MarketingPricingFaqSection({
  openFaqIndex,
  onToggleFaq,
  pricingTitle,
  pricingPlan,
  faqTitle,
  faqs
}: Props) {
  const { amount, period } = splitPrice(pricingPlan.price);

  return (
    <section
      id="pricing"
      className="relative scroll-mt-28 border-t border-slate-100 bg-[#FAFBFC] py-16 md:py-24"
      aria-label={pricingTitle ? `${pricingTitle} & ${faqTitle}` : faqTitle}
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="flex flex-col lg:col-span-5 lg:self-start">
            {pricingTitle ? (
              <div className="mb-8">
                <MarketingSectionHeader title={pricingTitle} align="left" />
              </div>
            ) : null}

            <article
              className={`flex flex-col overflow-hidden rounded-2xl border border-[#0033A0]/15 bg-white shadow-[0_10px_40px_-12px_rgba(0,51,160,0.28)] ring-1 ring-[#0033A0]/10${
                pricingTitle ? "" : ""
              }`}
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0033A0] via-[#0033A0] to-[#004ecb] px-6 py-6 sm:px-7 sm:py-7">
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,transparent_45%,transparent_100%)]"
                  aria-hidden
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                      {pricingPlan.name}
                    </span>
                    <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white sm:text-[1.75rem]">
                      {pricingPlan.tagline}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{pricingPlan.subtitle}</p>
                  </div>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20"
                    aria-hidden
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </div>

                <div className="relative mt-6 flex items-end gap-2 border-t border-white/15 pt-5">
                  <p className="text-[1.85rem] font-black tabular-nums leading-none tracking-tight text-white sm:text-[2rem]">
                    {amount}
                  </p>
                  {period ? (
                    <p className="pb-0.5 text-sm font-medium text-white/60">{period}</p>
                  ) : null}
                </div>

                {pricingPlan.popular && pricingPlan.popularBadge ? (
                  <span className="absolute right-5 top-5 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {pricingPlan.popularBadge}
                  </span>
                ) : null}
              </div>

              <ul className="divide-y divide-slate-100 px-6 py-2 sm:px-7">
                {pricingPlan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3.5 py-4 text-sm font-medium leading-snug text-slate-800 sm:text-[15px]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-slate-100 px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
                <Link
                  href={pricingPlan.href}
                  className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E30A17] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_-12px_rgba(227,10,23,0.55)] transition hover:bg-[#c40914] sm:min-h-[3.25rem] sm:text-[15px]"
                >
                  {pricingPlan.cta}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>
            </article>
          </div>

          <article id="faq" className="flex flex-col scroll-mt-28 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8 sm:py-7">
                <h2 className="text-2xl font-black tracking-tight sm:text-[1.65rem]" style={{ color: NAVY }}>
                  {faqTitle}
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {faqs.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  const panelId = `faq-panel-${index}`;

                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        id={`faq-trigger-${index}`}
                        onClick={() => onToggleFaq(index)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className={`flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors sm:px-8 sm:py-5 ${
                          isOpen ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <span
                          className={`min-w-0 pt-0.5 text-sm font-semibold leading-snug sm:text-[15px] [overflow-wrap:anywhere] ${
                            isOpen ? "text-[#0033A0]" : "text-slate-900"
                          }`}
                        >
                          {item.q}
                        </span>
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                            isOpen
                              ? "bg-[#0033A0]/10 text-[#0033A0] ring-[#0033A0]/15"
                              : "bg-slate-100 text-slate-500 ring-slate-200/80"
                          }`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            strokeWidth={2.5}
                          />
                        </span>
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
                          <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 sm:px-8 sm:pb-6 [overflow-wrap:anywhere]">
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
