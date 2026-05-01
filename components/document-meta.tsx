"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { SITE_METADATA } from "@/lib/i18n/site-metadata";

/** Updates document title and meta description when the UI language changes. */
export function DocumentMeta() {
  const { language } = useLanguage();

  useEffect(() => {
    const m = SITE_METADATA[language] ?? SITE_METADATA.en;
    document.title = m.title;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", m.description);
  }, [language]);

  return null;
}
