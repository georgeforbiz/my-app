"use client";

import { ListTree, MapPinned, Signature, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { NAVY } from "@/lib/brand";

type FeatureCopy = {
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
};

/** Defined Scope · Sign on Phone · Payment Schedule · Made for Local Pros */
const FEATURE_ICONS = [ListTree, Signature, Wallet, MapPinned] as const;

function featureLabel(text: string): string {
  return text.replace(/\n/g, " ").replace(/\.\s*$/, "").trim();
}

export function MarketingFeaturesSection({ t }: { t: FeatureCopy }) {
  const items = [t.feature1, t.feature2, t.feature3, t.feature4].map((text, idx) => ({
    label: featureLabel(text),
    Icon: FEATURE_ICONS[idx] ?? ListTree,
    key: idx
  }));

  return (
    <section className="bg-white px-4 py-14 sm:px-6 md:px-8 md:py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[90rem]">
        <ul className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-4 md:gap-0">
          {items.map(({ label, Icon, key }, idx) => (
            <Reveal key={key} delay={idx * 70}>
              <li
                className={[
                  "group flex w-full flex-col items-center gap-4 px-3 text-center sm:px-4 md:px-8 lg:px-10",
                  idx > 0 ? "md:border-l md:border-slate-200/70" : ""
                ].join(" ")}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:-translate-y-0.5 sm:h-16 sm:w-16"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(0,51,160,0.10) 0%, rgba(242,168,0,0.12) 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)"
                  }}
                >
                  <Icon
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    style={{ color: NAVY }}
                    strokeWidth={2.1}
                    aria-hidden
                  />
                </span>
                <p className="w-full max-w-[16rem] text-base font-semibold leading-snug tracking-[-0.01em] text-slate-800 sm:text-lg">
                  {label}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
