"use client";

import { FileSignature, Layers, MapPin, ShieldCheck } from "lucide-react";
import type { Language } from "@/lib/i18n/locales";
import { Reveal } from "@/components/reveal";
import { ORANGE } from "@/lib/brand";

type FeatureCopy = {
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
};

const FEATURE_ICONS = [Layers, FileSignature, ShieldCheck, MapPin] as const;

const FEATURE_BG = "linear-gradient(168deg, #1a5596 0%, #2878c8 52%, #3d8ee0 100%)";

/** Same size and weight on both lines. */
const FEATURE_TEXT = "block text-[17px] font-black tracking-tight text-white sm:text-lg";

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

function FeatureContent({
  line1,
  line2,
  Icon
}: {
  line1: string;
  line2: string;
  Icon: (typeof FEATURE_ICONS)[number];
}) {
  return (
    <>
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-white/60">
        <Icon className="h-[18px] w-[18px]" style={{ color: ORANGE }} strokeWidth={2.75} aria-hidden />
      </span>
      <p className="w-full max-w-[15rem] leading-tight sm:max-w-[17rem]">
        <span className={FEATURE_TEXT}>{line1}</span>
        <span className={`mt-1 ${FEATURE_TEXT}`}>{line2}</span>
      </p>
    </>
  );
}

export function MarketingFeaturesSection({
  t,
  locale
}: {
  t: FeatureCopy;
  locale: Language;
}) {
  const items = [t.feature1, t.feature2, t.feature3, t.feature4].map((text, idx) => {
    const [line1, line2] = featureLines(text, locale);
    return {
      line1,
      line2,
      Icon: FEATURE_ICONS[idx] ?? Layers,
      key: `${locale}-${idx}`
    };
  });

  return (
    <section className="bg-white px-4 py-10 md:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          {/* Mobile: stacked cards */}
          <ul className="grid grid-cols-1 gap-3 md:hidden">
            {items.map(({ line1, line2, Icon, key }) => (
              <li
                key={key}
                className="flex min-h-[7rem] flex-col items-center justify-center rounded-[1.25rem] px-5 py-7 text-center shadow-[0_16px_40px_-20px_rgba(15,61,110,0.4)] sm:min-h-[8rem] sm:py-8"
                style={{ background: FEATURE_BG }}
              >
                <FeatureContent line1={line1} line2={line2} Icon={Icon} />
              </li>
            ))}
          </ul>

          {/* Desktop: one connected pill */}
          <div
            className="hidden overflow-hidden rounded-[1.75rem] shadow-[0_20px_48px_-22px_rgba(15,61,110,0.5)] md:block"
            style={{ background: FEATURE_BG }}
          >
            <ul className="grid grid-cols-4 divide-x divide-white/15">
              {items.map(({ line1, line2, Icon, key }) => (
                <li
                  key={key}
                  className="flex min-h-[9rem] flex-col items-center justify-center px-5 py-9 text-center"
                >
                  <FeatureContent line1={line1} line2={line2} Icon={Icon} />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
