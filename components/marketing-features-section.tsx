"use client";

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

function splitFeatureLines(text: string, locale: Language): string[] {
  if (locale === "en") return [text];

  const spaceIdx = text.indexOf(" ");
  if (spaceIdx === -1) return [text];

  return [text.slice(0, spaceIdx), text.slice(spaceIdx + 1)];
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
    <section className="border-b border-slate-100 bg-white">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((text, idx) => {
          const lines = splitFeatureLines(text, locale);
          return (
            <Reveal key={`${locale}-${idx}`} delay={idx * 30}>
              <div
                className="flex h-full min-h-[5.5rem] items-center justify-center px-4 py-6 text-center sm:min-h-[6rem] sm:px-5 sm:py-7 lg:min-h-[6.5rem]"
                style={{ background: HERO_BG_GRADIENT }}
              >
                <p className="text-base font-bold leading-snug text-white sm:text-[17px] lg:text-lg">
                  {lines.map((line, lineIdx) => (
                    <span key={lineIdx}>
                      {lineIdx > 0 ? <br /> : null}
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
