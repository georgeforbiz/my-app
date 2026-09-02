"use client";

import { FileSignature, Layers, MapPin, ShieldCheck } from "lucide-react";
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

const FEATURE_TEXT =
  "text-[13px] font-black leading-tight tracking-tight text-white sm:text-sm";

function featureLabel(text: string): string {
  return text.replace(/\n/g, " ").replace(/\.\s*$/, "").trim();
}

function FeatureContent({ label, Icon }: { label: string; Icon: (typeof FEATURE_ICONS)[number] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/60 sm:h-10 sm:w-10">
        <Icon className="h-[16px] w-[16px] sm:h-[17px] sm:w-[17px]" style={{ color: ORANGE }} strokeWidth={2.75} aria-hidden />
      </span>
      <p className={`min-w-0 ${FEATURE_TEXT}`}>{label}</p>
    </div>
  );
}

export function MarketingFeaturesSection({ t }: { t: FeatureCopy }) {
  const items = [t.feature1, t.feature2, t.feature3, t.feature4].map((text, idx) => ({
    label: featureLabel(text),
    Icon: FEATURE_ICONS[idx] ?? Layers,
    key: idx
  }));

  const cellClass =
    "flex min-h-[4.25rem] items-center justify-start px-5 py-4 sm:min-h-[4.5rem] sm:px-6 sm:py-5 md:justify-center md:px-4";

  return (
    <section className="bg-white px-4 py-10 md:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-0 md:overflow-hidden md:rounded-[1.75rem] md:shadow-[0_20px_48px_-22px_rgba(15,61,110,0.5)]">
            {items.map(({ label, Icon, key }, idx) => (
              <li
                key={key}
                className={[
                  cellClass,
                  "rounded-[1.25rem] shadow-[0_16px_40px_-20px_rgba(15,61,110,0.4)] md:rounded-none md:shadow-none",
                  idx > 0 ? "md:border-l md:border-white/15" : ""
                ].join(" ")}
                style={{ background: FEATURE_BG }}
              >
                <FeatureContent label={label} Icon={Icon} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
