import type { Language } from "@/lib/i18n/locales";

export const termsLegal: Record<
  Language,
  {
    documentTitle: string;
    backToHome: string;
    h1: string;
    lead: string;
    s1h: string;
    s1p: string;
    s2h: string;
    s2p: string;
    s3h: string;
    s3p: string;
    s4h: string;
    s4pBefore: string;
    s4pAfter: string;
  }
> = {
  en: {
    documentTitle: "Terms of Service | VSTAH",
    backToHome: "Back to home",
    h1: "Terms of Service",
    lead:
      "These Terms govern use of VSTAH as a Neutral Payment Infrastructure for Service Providers in Armenia. The platform facilitates secure payment holding and release workflows and is not a contracting party to the underlying service agreement between provider and client.",
    s1h: "1. Platform role and legal status",
    s1p:
      "VSTAH operates as a neutral payment facilitator only. We provide infrastructure to lock, track, and release funds according to platform workflow. We are not the provider or client, do not supervise service delivery, and do not assume contractual obligations for performance, quality, legality, timing, or outcome of services.",
    s2h: "2. Fees and payment framework",
    s2p:
      "All platform service fees are charged to the Service Provider. Fees are non-refundable once a payment process has been initiated, including deposit placement, staged release flow, or payout processing. The provider remains solely responsible for pricing, tax reporting, and business compliance obligations.",
    s3h: "3. Disputes, liability, and governing law",
    s3p:
      "The platform does not provide arbitration, mediation, or dispute resolution services. Any disagreement must be resolved directly between the parties or through competent legal channels in the Republic of Armenia. VSTAH is not liable for service quality disputes, delivery disputes, or indirect losses arising from underlying service contracts.",
    s4h: "4. Contact",
    s4pBefore: "For legal or account-related issues, contact us at",
    s4pAfter: "."
  },
  hy: {
    documentTitle: "Օգտագործման պայմաններ | VSTAH",
    backToHome: "Գլխավոր",
    h1: "Օգտագործման պայմաններ",
    lead:
      "Այս պայմանները կարգավորում են VSTAH-ը որպես վճարային ենթակառուցվածք Հայաստանում։ Հարթակը պահում և արձակում է գումարները, բայց գործարքի կողմ չէ։",
    s1h: "1. Հարթակի դերը",
    s1p:
      "VSTAH-ը չեզոք վճարային միջնորդ է։ Մենք տալիս ենք ենթակառուցվածք՝ գումարը կողպելու, հաշվելու և արձակելու համար։ Մենք ոչ մատակարար ենք, ոչ հաճախորդ, և պատասխանատվություն չենք կրում ծառայության որակի, ժամկետի կամ արդյունքի համար։",
    s2h: "2. Վճարներ",
    s2p:
      "Պլատֆորմի վճարը կրում է մատակարարը։ Վճարը չի վերադարձվում, եթե վճարման գործընթացը մեկնարկել է՝ ներառյալ դեպոզիտի մուտքը, փուլային արձակումը կամ փոխանցումը։ Գնագոյացումը, հարկերը և համապատասխանությունը՝ միայն մատակարարի պատասխանատվությունն են։",
    s3h: "3. Վեճեր և իրավունք",
    s3p:
      "Հարթակը արբիտրաժ և մեդիացիա չի տալիս։ Վեճերը՝ կողմերի միջև կամ իրավասու մարմիններով Հայաստանում։ VSTAH-ը պատասխանատու չէ ծառայության որակի վեճերի կամ անուղղակի վնասների համար։",
    s4h: "4. Կապ",
    s4pBefore: "Իրավական և հաշվի հարցերով՝",
    s4pAfter: "։"
  },
  ru: {
    documentTitle: "Условия использования | VSTAH",
    backToHome: "На главную",
    h1: "Условия использования",
    lead:
      "Эти Условия регулируют использование VSTAH как нейтральной платёжной инфраструктуры для поставщиков услуг в Армении. Платформа удерживает и разблокирует средства по своим процессам и не является стороной договора между исполнителем и клиентом.",
    s1h: "1. Роль платформы и правовой статус",
    s1p:
      "VSTAH — нейтральный платёжный посредник: инфраструктура для блокировки, учёта и разблокировки средств. Мы не исполнитель и не заказчик, не контролируем оказание услуг и не отвечаем за качество, законность, сроки или результат работ.",
    s2h: "2. Комиссии и платежи",
    s2p:
      "Комиссию платформы оплачивает исполнитель. После старта платежа (в т.ч. внесение депозита, поэтапные выплаты, перевод) комиссия не возвращается. Цены, налоги и соблюдение закона в деятельности исполнителя — зона ответственности исполнителя.",
    s3h: "3. Споры, ответственность и право",
    s3p:
      "Платформа не ведёт арбитраж, медиацию и не урегулирует споры. Споры — между сторонами или в уполномоченных органах РА. VSTAH не отвечает за споры о качестве услуг, срыв сроков и косвенные убытки по основному договору.",
    s4h: "4. Контакты",
    s4pBefore: "По юридическим вопросам и аккаунту:",
    s4pAfter: "."
  }
};

export const privacyLegal: Record<
  Language,
  {
    documentTitle: string;
    backToHome: string;
    h1: string;
    lead: string;
    s1h: string;
    s1p: string;
    s2h: string;
    s2p: string;
    s3h: string;
    s3p: string;
    s4h: string;
    s4pBefore: string;
    s4pAfter: string;
  }
> = {
  en: {
    documentTitle: "Privacy Policy | VSTAH",
    backToHome: "Back to home",
    h1: "Privacy Policy",
    lead:
      "This Privacy Policy explains how VSTAH, as Neutral Payment Infrastructure for Service Providers in Armenia, collects and processes personal and transactional information for secure financial operations and legal compliance.",
    s1h: "1. Data minimization and lawful basis",
    s1p:
      "We collect only data that is necessary to verify identity, validate transactions, prevent fraud, and comply with applicable Armenian legal and financial requirements. Collected data may include account identifiers, transaction metadata, payment status, and legally required compliance records.",
    s2h: "2. Third-party disclosure",
    s2p:
      "Data is disclosed strictly on a need-to-process basis and only to licensed financial institutions and regulated service partners in Armenia for secure fund transfer, settlement, and compliance procedures. We do not sell personal data to unauthorized third parties.",
    s3h: "3. Security and confidentiality",
    s3p:
      "We apply bank-grade technical and organizational safeguards, including encryption controls, access restrictions, and audit-oriented monitoring, to protect deal information, payment statuses, and identity records against unauthorized access, alteration, or disclosure.",
    s4h: "4. Provider consent and compliance",
    s4pBefore:
      "By using the platform, the Service Provider consents to the processing of transaction data required for tax, accounting, anti-fraud, and legal compliance in the Republic of Armenia. For privacy requests, contact us at",
    s4pAfter: "."
  },
  hy: {
    documentTitle: "Գաղտնիություն | VSTAH",
    backToHome: "Գլխավոր",
    h1: "Գաղտնիության քաղաքականություն",
    lead:
      "Այս քաղաքականությունը բացատրում է, թե ինչպես է VSTAH-ը հավաքում և մշակում տվյալները անվտանգ վճարների և իրավական համապատասխանության համար։",
    s1h: "1. Նվազագույն տվյալներ",
    s1p:
      "Հավաքում ենք միայն անհրաժեշտը՝ նույնականացման, գործարքների, խարդախության կանխման և ՀՀ օրենքին համապատասխանելու համար։ Ներառում է հաշվի տվյալներ, գործարքի մետատվյալներ, վճարման կարգավիճակ։",
    s2h: "2. Երրորդ կողմեր",
    s2p:
      "Տվյալները փոխանցվում են միայն անհրաժեշտության դեպքում՝ լիցենզավորված ֆինանսական հաստատություններին և գործընկերներին Հայաստանում։ Անձնական տվյալ չենք վաճառում։",
    s3h: "3. Անվտանգություն",
    s3p:
      "Կիրառում ենք ուժեղ տեխնիկական և կազմակերպական պաշտպանություն՝ գործարքների, վճարների և ինքնության տվյալները պահպանելու համար։",
    s4h: "4. Համաձայնություն",
    s4pBefore:
      "Պլատֆորմից օգտվելով՝ մատակարարը համաձայնում է գործարքային տվյալների մշակմանը՝ հարկային, հաշվապահական և իրավական պահանջների համար։ Գաղտնիության հարցերով՝",
    s4pAfter: "։"
  },
  ru: {
    documentTitle: "Политика конфиденциальности | VSTAH",
    backToHome: "На главную",
    h1: "Политика конфиденциальности",
    lead:
      "Политика описывает, как VSTAH как нейтральная платёжная инфраструктура для поставщиков услуг в Армении собирает и обрабатывает персональные и транзакционные данные для безопасных операций и соблюдения закона.",
    s1h: "1. Минимизация данных и основания",
    s1p:
      "Собираем только необходимое: идентификация, проверка операций, противодействие мошенничеству, требования законодательства РА. Например: идентификаторы аккаунта, метаданные операций, статусы платежей, учётные записи по требованиям регуляторов.",
    s2h: "2. Передача третьим лицам",
    s2p:
      "Передаём данные только по необходимости лицензированным финансовым организациям и регулируемым партнёрам в Армении — для переводов, расчётов и проверок по закону. Персональные данные не продаём.",
    s3h: "3. Безопасность",
    s3p:
      "Используем шифрование, ограничение доступа и мониторинг, ориентированный на аудит, чтобы защитить данные о соглашениях, платежах и личности от несанкционированного доступа и утечек.",
    s4h: "4. Согласие исполнителя",
    s4pBefore:
      "Используя платформу, исполнитель соглашается на обработку транзакционных данных, необходимых для налогов, учёта, противодействия мошенничеству и соблюдения закона в РА. По вопросам конфиденциальности:",
    s4pAfter: "."
  }
};

export const errorPageCopy: Record<
  Language,
  {
    title: string;
    body: string;
    tryAgain: string;
    home: string;
  }
> = {
  en: {
    title: "Something went wrong",
    body:
      "This is often a stale build cache (especially if the project folder syncs with OneDrive). Try npm run dev:clean or delete the .next folder, then run npm run dev again.",
    tryAgain: "Try again",
    home: "Home"
  },
  hy: {
    title: "Ինչ-որ բան սխալ է",
    body:
      "Սովորաբար՝ կեշի խնդիր (հատկապես OneDrive-ով համաժամեցված պանակներում). npm run dev:clean կամ ջնջեք .next, հետո նորից npm run dev։",
    tryAgain: "Կրկին",
    home: "Գլխավոր"
  },
  ru: {
    title: "Что-то пошло не так",
    body:
      "Часто виноват устаревший кэш сборки (например, если проект в OneDrive). Выполните npm run dev:clean или удалите папку .next и снова запустите npm run dev.",
    tryAgain: "Повторить",
    home: "Главная"
  }
};
