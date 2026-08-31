"use client";

import { Check, Sparkles, X } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";
import type { Language } from "@/lib/i18n/locales";

type ComparisonRow = { label: string; withVstah: string; withoutUs: string };

type Props = {
  locale?: Language;
  diffEyebrow: string;
  diffTitle: string;
  diffSubtitle: string;
  recommended: string;
  colWith: string;
  colWithout: string;
  diffWithoutEyebrow: string;
  comparisonRows: ComparisonRow[];
};

function ComparisonCell({ text, tone, fillHeight = false }: { text: string; tone: "with" | "without"; fillHeight?: boolean }) {
  const isWith = tone === "with";

  return (
    <div
      className={`flex items-start gap-4 px-6 py-4 transition-colors sm:px-7 sm:py-[1.125rem] ${
        fillHeight ? "h-full min-h-full" : ""
      } ${isWith ? "hover:bg-blue-50/60" : "hover:bg-red-50/40"}`}
    >
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${
          isWith
            ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
            : "bg-red-50 text-red-500 ring-red-100"
        }`}
        aria-hidden
      >
        {isWith ? <Check className="h-4 w-4" strokeWidth={2.75} /> : <X className="h-4 w-4" strokeWidth={2.75} />}
      </span>
      <p className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-relaxed text-slate-800 sm:text-[15px] [overflow-wrap:anywhere]">
        {text}
      </p>
    </div>
  );
}

function ColumnHeader({ tag, title, tone }: { tag: string; title: string; tone: "with" | "without" }) {
  const isWith = tone === "with";

  return (
    <div
      className={`relative overflow-hidden px-6 py-5 sm:px-7 sm:py-6 ${
        isWith
          ? "bg-gradient-to-br from-[#0033A0] via-[#0033A0] to-[#004ecb]"
          : "bg-gradient-to-br from-[#E30A17] via-[#E30A17] to-[#b80813]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,transparent_45%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {tag ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{tag}</p>
          ) : null}
          <h3 className={`${tag ? "mt-1.5" : ""} text-xl font-black leading-tight text-white sm:text-2xl`}>
            {title}
          </h3>
        </div>

        {isWith ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20"
            aria-hidden
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ComparisonColumn({
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
  const isWith = tone === "with";

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white ${
        isWith
          ? "border-[#0033A0]/15 shadow-[0_10px_40px_-12px_rgba(0,51,160,0.35)] ring-1 ring-[#0033A0]/10"
          : "border-slate-200/90 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]"
      }`}
    >
      <ColumnHeader tag={tag} title={title} tone={tone} />

      <ul className="flex flex-1 flex-col divide-y divide-slate-100">
        {rows.map((row, idx) => (
          <li key={`${tone}-${idx}`}>
            <ComparisonCell text={isWith ? row.withVstah : row.withoutUs} tone={tone} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function AlignedComparisonGrid({
  recommended,
  colWith,
  colWithout,
  diffWithoutEyebrow,
  comparisonRows
}: Pick<Props, "recommended" | "colWith" | "colWithout" | "diffWithoutEyebrow" | "comparisonRows">) {
  const totalRows = comparisonRows.length + 1;

  return (
    <div
      className="grid grid-cols-2 gap-x-8 lg:gap-x-10"
      style={{ gridTemplateRows: `auto repeat(${comparisonRows.length}, auto)` }}
    >
      {(["with", "without"] as const).map((tone) => {
        const isWith = tone === "with";

        return (
          <article
            key={tone}
            className={`row-start-1 grid overflow-hidden rounded-2xl border bg-white [grid-template-rows:subgrid] ${
              isWith
                ? "col-start-1 border-[#0033A0]/15 shadow-[0_10px_40px_-12px_rgba(0,51,160,0.35)] ring-1 ring-[#0033A0]/10"
                : "col-start-2 border-slate-200/90 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]"
            }`}
            style={{ gridRowEnd: `span ${totalRows}` }}
          >
            <div className="[grid-row:1]">
              <ColumnHeader
                tag={isWith ? recommended : diffWithoutEyebrow}
                title={isWith ? colWith : colWithout}
                tone={tone}
              />
            </div>

            {comparisonRows.map((row, idx) => (
              <div
                key={`${tone}-${idx}`}
                className="h-full border-t border-slate-100 bg-white"
                style={{ gridRow: idx + 2 }}
              >
                <ComparisonCell
                  text={isWith ? row.withVstah : row.withoutUs}
                  tone={tone}
                  fillHeight
                />
              </div>
            ))}
          </article>
        );
      })}
    </div>
  );
}

export function MarketingDifferenceSection({
  locale = "en",
  diffEyebrow,
  diffTitle,
  diffSubtitle,
  recommended,
  colWith,
  colWithout,
  diffWithoutEyebrow,
  comparisonRows
}: Props) {
  const useAlignedRows = locale === "hy" || locale === "ru";

  return (
    <section id="difference" className="scroll-mt-28 bg-[#FAFBFC] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <MarketingSectionHeader
            eyebrow={diffEyebrow}
            title={diffTitle}
            subtitle={diffSubtitle}
            align="center"
          />
        </Reveal>

        <div className="mt-10 md:mt-14">
          {useAlignedRows ? (
            <>
              <div className="grid gap-6 md:hidden">
                <Reveal className="h-full">
                  <ComparisonColumn tag={recommended} title={colWith} tone="with" rows={comparisonRows} />
                </Reveal>
                <Reveal delay={40} className="h-full">
                  <ComparisonColumn tag={diffWithoutEyebrow} title={colWithout} tone="without" rows={comparisonRows} />
                </Reveal>
              </div>

              <Reveal className="hidden md:block">
                <AlignedComparisonGrid
                  recommended={recommended}
                  colWith={colWith}
                  colWithout={colWithout}
                  diffWithoutEyebrow={diffWithoutEyebrow}
                  comparisonRows={comparisonRows}
                />
              </Reveal>
            </>
          ) : (
            <div className="grid items-stretch gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
              <Reveal className="h-full">
                <ComparisonColumn tag={recommended} title={colWith} tone="with" rows={comparisonRows} />
              </Reveal>
              <Reveal delay={40} className="h-full">
                <ComparisonColumn tag={diffWithoutEyebrow} title={colWithout} tone="without" rows={comparisonRows} />
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
