"use client";

import { FileSignature, Layers, MapPin, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HERO_BG_GRADIENT } from "@/lib/brand";
import type { Language } from "@/lib/i18n/locales";

type FeatureCopy = {
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  fundsLabel: string;
  lockedNote: string;
  stage1State: string;
  projectStatus: string;
};

const FEATURE_ICONS = [Layers, FileSignature, ShieldCheck, MapPin] as const;

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
          <div
            className="overflow-hidden rounded-[1.75rem] p-px shadow-[0_20px_48px_-22px_rgba(15,61,110,0.5)]"
            style={{ background: HERO_BG_GRADIENT }}
          >
            <div className="grid grid-cols-1 gap-px bg-white sm:grid-cols-2 xl:grid-cols-4">
              {items.map((text, idx) => {
                const [line1, line2] = featureLines(text, locale);
                const Icon = FEATURE_ICONS[idx] ?? Layers;

                return (
                  <div
                    key={`${locale}-${idx}`}
                    className="flex min-h-[7.5rem] flex-col items-center justify-center px-7 py-8 text-center sm:min-h-[8.25rem] sm:px-8 sm:py-9 xl:min-h-[8.75rem]"
                    style={{ background: HERO_BG_GRADIENT }}
                  >
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/35">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
                    </span>
                    <p className="w-full max-w-[15rem] leading-tight sm:max-w-[17rem]">
                      <span className="block text-[17px] font-black tracking-tight text-white sm:text-lg">
                        {line1}
                      </span>
                      <span className="mt-1 block text-[15px] font-medium text-white/85 sm:text-base">
                        {line2}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
