"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { SITE_METADATA } from "@/lib/i18n/site-metadata";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Updates document title and meta description when the UI language changes. */
export function DocumentMeta() {
  const { language } = useLanguage();

  useEffect(() => {
    try {
      if (typeof document === "undefined") return;
      const lang = language === "en" || language === "hy" || language === "ru" ? language : "en";
      const m = SITE_METADATA[lang] ?? SITE_METADATA.en;
      document.title = m.title;
      setMeta("name", "description", m.description);
      setMeta("property", "og:title", m.title);
      setMeta("property", "og:description", m.description);
      setMeta("name", "twitter:title", m.title);
      setMeta("name", "twitter:description", m.description);
    } catch {
      // Avoid taking down the whole app if head/meta manipulation fails in an edge browser.
    }
  }, [language]);

  return null;
}
