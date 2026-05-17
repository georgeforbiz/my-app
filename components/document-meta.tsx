"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { SITE_METADATA } from "@/lib/i18n/site-metadata";

/** Updates document title and meta description when the UI language changes. */
export function DocumentMeta() {
  const { language } = useLanguage();

  useEffect(() => {
    try {
      if (typeof document === "undefined") return;
      const lang = language === "en" || language === "hy" || language === "ru" ? language : "en";
      const m = SITE_METADATA[lang] ?? SITE_METADATA.en;
      document.title = m.title;
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", "description");
        document.head.appendChild(el);
      }
      el.setAttribute("content", m.description);
    } catch {
      // Avoid taking down the whole app if head/meta manipulation fails in an edge browser.
    }
  }, [language]);

  return null;
}
