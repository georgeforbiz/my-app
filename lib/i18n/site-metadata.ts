import type { Language } from "@/lib/i18n/locales";

export const SITE_METADATA: Record<Language, { title: string; description: string }> = {
  en: {
    title: "VSTAH.am | Building Trust in Every Project",
    description:
      "Armenia's leading safe-deal platform for home and renovation. Protected payments and secure deposits until work is complete."
  },
  hy: {
    title: "VSTAH.am | Վստահություն նախագծում",
    description:
      "Անվտանգ գործարքներ տան ու վերանորոգման համար։ Դեպոզիտը էսկրոուում՝ մինչև աշխատանքի ավարտը։"
  },
  ru: {
    title: "VSTAH.am | Доверие в каждом проекте",
    description:
      "Безопасные расчёты для дома и ремонта в Армении. Платежи под защитой, средства в эскроу до приёмки работ."
  }
};
