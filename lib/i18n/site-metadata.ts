import type { Language } from "@/lib/i18n/locales";

export const SITE_DESCRIPTION =
  "Create, share, and sign digital service agreements in seconds. Lock scope, pricing, and terms before work starts with zero friction.";

export const SITE_METADATA: Record<Language, { title: string; description: string }> = {
  en: {
    title: "VSTAH | Building Trust in Every Project",
    description: SITE_DESCRIPTION
  },
  hy: {
    title: "VSTAH | Վստահություն յուրաքանչյուր նախագծում",
    description:
      "Ստեղծեք, կիսվեք և ստորագրեք թվային ծառայության պայմանագրեր վայրկյանների ընթացքում։ Ամրագրեք ծավալը, գները և պայմանները՝ մինչև աշխատանքի սկիզբը։"
  },
  ru: {
    title: "VSTAH | Доверие в каждом проекте",
    description:
      "Создавайте, отправляйте и подписывайте цифровые договоры на услуги за секунды. Фиксируйте объём, цену и условия до начала работ — без лишней сложности."
  }
};
