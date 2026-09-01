"use client";

import type { Language } from "@/lib/i18n/locales";
import { Reveal } from "@/components/reveal";
import { NAVY, ORANGE } from "@/lib/brand";

type FeatureCopy = {
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
};

/** Same size and weight on both lines. */
const FEATURE_LINE = "block text-lg font-bold leading-tight sm:text-xl";

const SEP_GRADIENT_V = `linear-gradient(180deg, transparent 0%, ${NAVY}33 18%, ${ORANGE} 50%, ${NAVY}33 82%, transparent 100%)`;
const SEP_GRADIENT_H = `linear-gradient(90deg, transparent 0%, ${NAVY}33 18%, ${ORANGE} 50%, ${NAVY}33 82%, transparent 100%)`;

function SeparatorDiamond() {
  return (
    <span
      className="relative z-10 h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px]"
      style={{
        backgroundColor: ORANGE,
        boxShadow: `0 0 0 3px #fff, 0 0 0 4px ${ORANGE}44`
      }}
      aria-hidden
    />
  );
}

function VerticalSeparator() {
  return (
    <div className="relative flex w-10 shrink-0 items-center justify-center self-stretch sm:w-12" aria-hidden>
      <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2" style={{ background: SEP_GRADIENT_V }} />
      <SeparatorDiamond />
    </div>
  );
}

function HorizontalSeparator() {
  return (
    <div className="relative flex h-10 w-full shrink-0 items-center justify-center sm:h-12" aria-hidden>
      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 sm:inset-x-12" style={{ background: SEP_GRADIENT_H }} />
      <SeparatorDiamond />
    </div>
  );
}

function featureLines(text: string, locale: Language): [string, string] {
  const normalized = text.replace(/\.\s*$/, "").trim();
  if (text.includes("\n")) {
    const parts = text.split("\n").map((line) => line.trim()).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
  }

  if (locale === "en") {
    const splits: Record<string, [string, string]> = {
      "Clear Milestones": ["Clear", "Milestones"],
      "Instant Signatures": ["Instant", "Signatures"],
      "Zero Scope Creep": ["Zero Scope", "Creep"],
      "Built for Armenia": ["Built for", "Armenia"]
    };
    if (splits[normalized]) return splits[normalized];
  }

  const spaceIdx = normalized.indexOf(" ");
  if (spaceIdx === -1) return [normalized, ""];
  return [normalized.slice(0, spaceIdx), normalized.slice(spaceIdx + 1)];
}

function FeatureCell({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <div className="flex min-h-[7.5rem] flex-1 items-center justify-center px-4 py-8 text-center sm:min-h-[8rem] sm:px-6 sm:py-10">
      <p style={{ color: NAVY }}>
        <span className={FEATURE_LINE}>{line1}</span>
        <span className={`mt-1.5 ${FEATURE_LINE}`}>{line2}</span>
      </p>
    </div>
  );
}

export function MarketingFeaturesSection({
  t,
  locale
}: {
  t: FeatureCopy;
  locale: Language;
}) {
  const lines = [t.feature1, t.feature2, t.feature3, t.feature4].map((text) => featureLines(text, locale));

  return (
    <section className="bg-white px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
            {/* Mobile / tablet: 2×2 with cross separators */}
            <div className="lg:hidden">
              <div className="flex items-stretch">
                <FeatureCell line1={lines[0][0]} line2={lines[0][1]} />
                <VerticalSeparator />
                <FeatureCell line1={lines[1][0]} line2={lines[1][1]} />
              </div>
              <HorizontalSeparator />
              <div className="flex items-stretch">
                <FeatureCell line1={lines[2][0]} line2={lines[2][1]} />
                <VerticalSeparator />
                <FeatureCell line1={lines[3][0]} line2={lines[3][1]} />
              </div>
            </div>

            {/* Desktop: single row */}
            <div className="hidden items-stretch lg:flex">
              <FeatureCell line1={lines[0][0]} line2={lines[0][1]} />
              <VerticalSeparator />
              <FeatureCell line1={lines[1][0]} line2={lines[1][1]} />
              <VerticalSeparator />
              <FeatureCell line1={lines[2][0]} line2={lines[2][1]} />
              <VerticalSeparator />
              <FeatureCell line1={lines[3][0]} line2={lines[3][1]} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
