"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delay?: number;
  /** Once visible, stay revealed (default true) */
  once?: boolean;
};

/** Fast fade/slide when scrolled into view. Respects prefers-reduced-motion via CSS. */
export function Reveal({ children, className = "", delay = 0, once = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    // Show immediately if already on screen (faster first paint / reload)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
      setVisible(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 12% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style = delay > 0 ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      className={`vstah-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
