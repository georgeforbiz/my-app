import type { Language } from "@/lib/i18n/locales";

export const SITE_METADATA: Record<Language, { title: string; description: string }> = {
  en: {
    title: "VSTAH.am | Building Trust in Every Project",
    description:
      "Armenia's leading safe-deal platform for home and renovation. Protected payments and secure deposits until work is complete."
  },
  hy: {
    title: "VSTAH.am | Վստահություն յուրաքանչյուր նախագծում",
    description:
      "Տան և վերանորոգման համար անվտանգ գործարքների հարթակ Հայաստանում։ Պաշտպանված վճարներ մինչև աշխատանքի ավարտը։"
  },
  ru: {
    title: "VSTAH.am | Доверие в каждом проекте",
    description:
      "Платформа безопасных сделок для дома и ремонта в Армении. Защищённые платежи и средства в Эскроу до завершения работ."
  }
};
