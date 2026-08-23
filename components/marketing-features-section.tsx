"use client";

import { Reveal } from "@/components/reveal";
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
    <section className="border-b border-slate-100 bg-white py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((text, idx) => {
            const lines = splitFeatureLines(text, locale);
            return (
              <Reveal key={`${locale}-${idx}`} delay={idx * 30}>
                <div className="flex h-full min-h-[5rem] items-center justify-center border border-[#0033A0]/15 bg-[#DBEAFE] px-5 py-5 text-center sm:min-h-[5.5rem] sm:px-6 sm:py-6">
                  <p className="text-base font-bold leading-snug text-slate-900 sm:text-[17px]">
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
      </div>
    </section>
  );
}
