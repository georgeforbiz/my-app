"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAVY, ORANGE } from "@/lib/brand";

const NAV_ARROW_CLASS =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-slate-900 transition hover:brightness-105 sm:h-11 sm:w-11";
const CARD_ACCENTS = ["#E30A17", "#0033A0", "#F2A800"] as const;
const AUTO_PLAY_MS = 4500;
const SWIPE_THRESHOLD = 52;

type MarketingPainPointsCarouselProps = {
  title: string;
  quotes: readonly string[];
  carouselAria: string;
  prevAria: string;
  nextAria: string;
  slideAria: string;
};

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

export function MarketingPainPointsCarousel({
  title,
  quotes,
  carouselAria,
  prevAria,
  nextAria,
  slideAria
}: MarketingPainPointsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setSlideKey((key) => key + 1);
  }, [quotes]);

  const bump = useCallback(
    (next: number) => {
      setActiveIndex(wrapIndex(next, quotes.length));
      setSlideKey((key) => key + 1);
    },
    [quotes.length]
  );

  const advance = useCallback(
    (delta: number) => {
      setActiveIndex((current) => wrapIndex(current + delta, quotes.length));
      setSlideKey((key) => key + 1);
    },
    [quotes.length]
  );

  const goNext = useCallback(() => advance(1), [advance]);
  const goPrev = useCallback(() => advance(-1), [advance]);

  useEffect(() => {
    if (isPaused || quotes.length === 0) return;
    const id = window.setInterval(() => advance(1), AUTO_PLAY_MS);
    return () => window.clearInterval(id);
  }, [isPaused, advance, quotes.length]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  if (quotes.length === 0) return null;

  const activeAccent = CARD_ACCENTS[activeIndex % CARD_ACCENTS.length];

  return (
    <section
      className="relative z-20 -mt-8 px-4 pb-10 md:-mt-14 md:pb-14"
      aria-roledescription="carousel"
      aria-label={carouselAria}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 pt-8 pb-5 sm:px-8 sm:pt-10 sm:pb-6 md:px-10 md:pt-12 md:pb-7"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="mb-8 text-center md:mb-10">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl md:text-[2rem]" style={{ color: NAVY }}>
              {title}
            </h2>
          </div>

          <div
            className="flex min-w-0 w-full items-center justify-center gap-2 sm:gap-4 md:gap-6"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label={prevAria}
              className={NAV_ARROW_CLASS}
              style={{ backgroundColor: ORANGE }}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <div
              key={slideKey}
              className="vstah-pain-in flex min-h-[9.5rem] min-w-0 flex-1 w-full max-w-2xl flex-col items-center justify-center px-2 py-6 text-center sm:min-h-[10rem] sm:px-4 md:min-h-[10.5rem] md:px-8"
              aria-live="polite"
            >
              <p
                className="text-base font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] sm:text-xl md:text-[1.35rem] md:leading-relaxed"
                style={{ borderBottom: `3px solid ${activeAccent}`, paddingBottom: "0.75rem" }}
              >
                &ldquo;{quotes[activeIndex]}&rdquo;
              </p>
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label={nextAria}
              className={NAV_ARROW_CLASS}
              style={{ backgroundColor: ORANGE }}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 md:mt-10" role="tablist" aria-label={carouselAria}>
            {quotes.map((quote, index) => {
              const isActive = index === activeIndex;
              const tone = CARD_ACCENTS[index % CARD_ACCENTS.length];
              return (
                <button
                  key={`${index}-${quote}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${slideAria} ${index + 1}`}
                  onClick={() => bump(index)}
                  className="inline-flex h-8 w-8 items-center justify-center"
                >
                  <span
                    className={`rounded-full transition-all duration-300 ${
                      isActive ? "h-2.5 w-2.5" : "h-2 w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                    style={isActive ? { backgroundColor: tone } : undefined}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
