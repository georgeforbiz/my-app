import type { Language } from "@/lib/i18n/locales";

export const SITE_METADATA: Record<Language, { title: string; description: string }> = {
  en: {
    title: "VSTAH | Building Trust in Every Project",
    description:
      "Armenia's leading safe-deal platform for home and renovation. Protected payments and secure deposits until work is complete."
  },
  hy: {
    title: "VSTAH | Վստահություն նախագծում",
    description:
      "Անվտանգ գործարքներ տան ու վերանորոգման համար։ Դեպոզիտը պահվում է՝ մինչև աշխատանքի ավարտը։"
  },
  ru: {
    title: "VSTAH | Доверие в каждом проекте",
    description:
      "Безопасные расчёты для дома и ремонта в Армении. Платежи под защитой, средства удерживаются до приёмки работ."
  }
};
