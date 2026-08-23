"use client";

import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";

type ComparisonRow = { label: string; withVstah: string; withoutUs: string };

type Props = {
  diffEyebrow: string;
  diffTitle: string;
  diffSubtitle: string;
  recommended: string;
  colWith: string;
  colWithout: string;
  diffWithoutEyebrow: string;
  comparisonRows: ComparisonRow[];
};

function MobileColumn({
  tag,
  title,
  tone,
  rows
}: {
  tag: string;
  title: string;
  tone: "with" | "without";
  rows: ComparisonRow[];
}) {
  const headerBg = tone === "with" ? "bg-[#0033A0]" : "bg-[#1a1a1a]";

  return (
    <article className="overflow-hidden border border-slate-200/80 bg-white">
      <div className={`${headerBg} px-5 py-4 sm:px-6 sm:py-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{tag}</p>
        <h3 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">{title}</h3>
      </div>
      <ul>
        {rows.map((row, idx) => (
          <li
            key={`${tone}-${row.label}`}
            className={`px-5 py-4 transition-colors duration-200 sm:px-6 ${
              idx < rows.length - 1 ? "border-b border-slate-100" : ""
            } ${tone === "with" ? "hover:bg-blue-50" : "hover:bg-red-50"}`}
          >
            <p className="font-bold leading-snug text-slate-900">{row.label}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {tone === "with" ? row.withVstah : row.withoutUs}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function MarketingDifferenceSection({
  diffEyebrow,
  diffTitle,
  diffSubtitle,
  recommended,
  colWith,
  colWithout,
  diffWithoutEyebrow,
  comparisonRows
}: Props) {
  return (
    <section id="difference" className="scroll-mt-28 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <MarketingSectionHeader
            eyebrow={diffEyebrow}
            title={diffTitle}
            subtitle={diffSubtitle}
            align="center"
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:hidden">
          <Reveal>
            <MobileColumn tag={recommended} title={colWith} tone="with" rows={comparisonRows} />
          </Reveal>
          <Reveal delay={40}>
            <MobileColumn tag={diffWithoutEyebrow} title={colWithout} tone="without" rows={comparisonRows} />
          </Reveal>
        </div>

        <Reveal className="mt-10 hidden md:block md:mt-12">
          <div className="grid grid-cols-2 overflow-hidden border border-slate-200/80 bg-white">
            <div className="flex min-h-[5rem] flex-col justify-center border-b border-white/10 bg-[#0033A0] px-5 py-4 text-white lg:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{recommended}</p>
              <p className="mt-1 text-2xl font-black leading-none lg:text-[1.75rem]">{colWith}</p>
            </div>
            <div className="flex min-h-[5rem] flex-col justify-center border-b border-l border-white/10 bg-[#1a1a1a] px-5 py-4 text-white lg:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{diffWithoutEyebrow}</p>
              <p className="mt-1 text-2xl font-black leading-none lg:text-[1.75rem]">{colWithout}</p>
            </div>

            {comparisonRows.map((row, idx) => {
              const isLast = idx === comparisonRows.length - 1;
              return (
                <div key={row.label} className="contents">
                  <div
                    className={`px-5 py-4 transition-colors duration-200 hover:bg-blue-50 lg:px-6 ${
                      isLast ? "" : "border-b border-slate-100"
                    }`}
                  >
                    <p className="font-bold leading-snug text-slate-900">{row.label}</p>
                    <p className="mt-1 text-[15px] leading-snug text-slate-600">{row.withVstah}</p>
                  </div>
                  <div
                    className={`border-l border-slate-100 px-5 py-4 transition-colors duration-200 hover:bg-red-50 lg:px-6 ${
                      isLast ? "" : "border-b border-slate-100"
                    }`}
                  >
                    <p className="font-bold leading-snug text-slate-900">{row.label}</p>
                    <p className="mt-1 text-[15px] leading-snug text-slate-600">{row.withoutUs}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
