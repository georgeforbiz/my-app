"use client";

import { Reveal } from "@/components/reveal";
import { NAVY } from "@/lib/brand";

export type PainPointItem = { title: string; body: string };

export function MarketingPainPointsGrid({
  title,
  items
}: {
  title: string;
  items: readonly PainPointItem[];
}) {
  return (
    <section className="relative z-20 -mt-8 px-4 pb-10 md:-mt-14 md:pb-14">
      <div className="mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-center text-2xl font-black tracking-tight sm:text-3xl md:text-[2rem]" style={{ color: NAVY }}>
              {title}
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:mt-10 md:gap-5">
            {items.map((item, index) => (
              <Reveal key={item.title} delay={index * 40}>
                <article className="h-full rounded-xl border border-slate-100 bg-slate-50/80 p-5 sm:p-6">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
