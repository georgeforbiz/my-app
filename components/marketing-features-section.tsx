"use client";

import { FileSignature, Layers, MapPin, ShieldCheck } from "lucide-react";
import type { Language } from "@/lib/i18n/locales";
import { Reveal } from "@/components/reveal";

type FeatureCopy = {
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
};

const FEATURE_ICONS = [Layers, FileSignature, ShieldCheck, MapPin] as const;

/** Same blue on every cell (not position-dependent). */
const FEATURE_CELL_BG = "linear-gradient(168deg, #1a5596 0%, #2878c8 52%, #3d8ee0 100%)";

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

export function MarketingFeaturesSection({
  t,
  locale
}: {
  t: FeatureCopy;
  locale: Language;
}) {
  const items = [t.feature1, t.feature2, t.feature3, t.feature4];

  return (
    <section className="bg-white px-4 py-10 md:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {items.map((text, idx) => {
                const [line1, line2] = featureLines(text, locale);
                const Icon = FEATURE_ICONS[idx] ?? Layers;

                return (
                  <li
                    key={`${locale}-${idx}`}
                    className="flex min-h-[7rem] flex-col items-center justify-center rounded-[1.25rem] px-5 py-7 text-center shadow-[0_16px_40px_-20px_rgba(15,61,110,0.45)] sm:min-h-[8rem] sm:py-8 md:min-h-[9rem] md:rounded-[1.75rem] md:px-6 md:py-9"
                    style={{ background: FEATURE_CELL_BG }}
                  >
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/35">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.75} aria-hidden />
                    </span>
                    <p className="w-full max-w-[15rem] leading-tight sm:max-w-[17rem]">
                      <span className={FEATURE_TEXT}>{line1}</span>
                      <span className={`mt-1 ${FEATURE_TEXT}`}>{line2}</span>
                    </p>
                  </li>
                );
              })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
