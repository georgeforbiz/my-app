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
    documentTitle: "Terms of Service | VSTAH.am",
    backToHome: "Back to home",
    h1: "Terms of Service",
    lead:
      "These Terms govern use of VSTAH.am as a Neutral Payment Infrastructure for Service Providers in Armenia. The platform facilitates secure payment holding and release workflows and is not a contracting party to the underlying service agreement between provider and client.",
    s1h: "1. Platform role and legal status",
    s1p:
      "VSTAH.am operates as a neutral payment facilitator only. We provide infrastructure to lock, track, and release funds according to platform workflow. We are not the provider or client, do not supervise service delivery, and do not assume contractual obligations for performance, quality, legality, timing, or outcome of services.",
    s2h: "2. Fees and payment framework",
    s2p:
      "All platform service fees are charged to the Service Provider. Fees are non-refundable once a payment process has been initiated, including escrow placement, staged release flow, or payout processing. The provider remains solely responsible for pricing, tax reporting, and business compliance obligations.",
    s3h: "3. Disputes, liability, and governing law",
    s3p:
      "The platform does not provide arbitration, mediation, or dispute resolution services. Any disagreement must be resolved directly between the parties or through competent legal channels in the Republic of Armenia. VSTAH.am is not liable for service quality disputes, delivery disputes, or indirect losses arising from underlying service contracts.",
    s4h: "4. Contact",
    s4pBefore: "For legal or account-related issues, contact us at",
    s4pAfter: "."
  },
  hy: {
    documentTitle: "Պայմաններ | VSTAH.am",
    backToHome: "Վերադառնալ գլխավոր",
    h1: "Ծառայության պայմաններ",
    lead:
      "Սույն Պայմանները կարգավորում են VSTAH.am-ի օգտագործումը որպես չեզոք վճարային ենթակառուցվածք Հայաստանի ծառայություն մատուցողների համար։ Հարթակը ապահովում է միջոցների անվտանգ պահում և թողարկում, սակայն չի հանդիսանում ծառայություն մատուցողի և պատվիրատուի հիմնական պայմանագրի կողմ։",
    s1h: "1. Հարթակի դերը և իրավական կարգավիճակը",
    s1p:
      "VSTAH.am-ը գործում է բացառապես որպես չեզոք վճարային միջնորդ։ Մենք տրամադրում ենք ենթակառուցվածք՝ միջոցները կողպելու, հաշվառելու և թողարկելու համար։ Մենք չենք վերահսկում ծառայության կատարումը և պատասխանատվություն չենք կրում աշխատանքի որակի, օրինականության, ժամկետի կամ արդյունքի համար։",
    s2h: "2. Վճարներ և վճարային կարգ",
    s2p:
      "Հարթակի բոլոր ծառայավճարները գանձվում են Ծառայություն մատուցողից։ Վճարները չեն վերադարձվում, եթե վճարային գործընթացը արդեն մեկնարկել է՝ ներառյալ էսկրոու մուտքագրումը, փուլային թողարկումը կամ փոխանցման մշակումը։ Ծառայություն մատուցողը մնում է միանձնյա պատասխանատու իր գնագոյացման, հարկային հաշվետվողականության և բիզնես-համապատասխանության համար։",
    s3h: "3. Վեճեր, պատասխանատվություն և կիրառելի իրավունք",
    s3p:
      "Հարթակը չի տրամադրում արբիտրաժի, մեդիացիայի կամ վեճերի կարգավորման ծառայություններ։ Ցանկացած անհամաձայնություն պետք է լուծվի կողմերի միջև կամ Հայաստանի Հանրապետության իրավասու մարմինների միջոցով։ VSTAH.am-ը պատասխանատվություն չի կրում ծառայության որակի, կատարման կամ հիմնական պայմանագրից բխող անուղղակի վնասների համար։",
    s4h: "4. Կապ",
    s4pBefore: "Իրավական կամ հաշվի հարցերով կապվեք՝",
    s4pAfter: "։"
  },
  ru: {
    documentTitle: "Условия использования | VSTAH.am",
    backToHome: "На главную",
    h1: "Условия использования",
    lead:
      "Настоящие Условия регулируют использование VSTAH.am как Нейтральной платежной инфраструктуры для поставщиков услуг в Армении. Платформа обеспечивает безопасное удержание и выпуск средств, но не является стороной основного договора между исполнителем и клиентом.",
    s1h: "1. Роль платформы и правовой статус",
    s1p:
      "VSTAH.am действует исключительно как нейтральный платежный посредник. Мы предоставляем инфраструктуру для блокировки, отслеживания и выпуска средств. Мы не контролируем выполнение услуг и не несем ответственности за качество, законность, сроки или результат работ.",
    s2h: "2. Комиссии и платежный порядок",
    s2p:
      "Все сервисные комиссии платформы оплачивает Исполнитель. Комиссии не подлежат возврату после запуска платежного процесса, включая внесение средств в эскроу, этапные выплаты и обработку перевода. Исполнитель самостоятельно отвечает за ценообразование, налоговую отчетность и соблюдение требований к своей деятельности.",
    s3h: "3. Споры, ответственность и применимое право",
    s3p:
      "Платформа не оказывает услуги арбитража, медиации или урегулирования споров. Любые разногласия разрешаются сторонами напрямую либо в компетентных органах Республики Армения. VSTAH.am не несет ответственности за споры о качестве услуг, исполнении обязательств и косвенные убытки по основному договору.",
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
    documentTitle: "Privacy Policy | VSTAH.am",
    backToHome: "Back to home",
    h1: "Privacy Policy",
    lead:
      "This Privacy Policy explains how VSTAH.am, as Neutral Payment Infrastructure for Service Providers in Armenia, collects and processes personal and transactional information for secure financial operations and legal compliance.",
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
    documentTitle: "Գաղտնիության քաղաքականություն | VSTAH.am",
    backToHome: "Վերադառնալ գլխավոր",
    h1: "Գաղտնիության քաղաքականություն",
    lead:
      "Սույն Քաղաքականությունը սահմանում է, թե ինչպես է VSTAH.am-ը՝ որպես չեզոք վճարային ենթակառուցվածք Հայաստանի ծառայություն մատուցողների համար, հավաքում և մշակում անձնական ու գործարքային տվյալներ անվտանգ ֆինանսական գործառնությունների և իրավական համապատասխանության նպատակով։",
    s1h: "1. Տվյալների նվազեցում և իրավական հիմք",
    s1p:
      "Մենք հավաքում ենք միայն այն տվյալները, որոնք անհրաժեշտ են անձի նույնականացման, գործարքների վավերացման, խարդախության կանխման և ՀՀ կիրառելի իրավական/ֆինանսական պահանջների կատարման համար։ Տվյալները կարող են ներառել հաշվի նույնացուցիչներ, գործարքի մետատվյալներ, վճարման կարգավիճակ և օրենքով պահանջվող համապատասխանության գրառումներ։",
    s2h: "2. Տվյալների փոխանցում երրորդ կողմերին",
    s2p:
      "Տվյալները փոխանցվում են միայն անհրաժեշտության սկզբունքով և բացառապես ՀՀ-ում լիցենզավորված ֆինանսական հաստատություններին ու կարգավորվող գործընկերներին՝ անվտանգ փոխանցումների, հաշվարկների և համապատասխանության ընթացակարգերի իրականացման համար։ Մենք անձնական տվյալները չենք վաճառում չարտոնված երրորդ կողմերին։",
    s3h: "3. Անվտանգություն և գաղտնիություն",
    s3p:
      "Մենք կիրառում ենք բանկային մակարդակի տեխնիկական և կազմակերպական պաշտպանություն՝ ներառյալ կոդավորում, հասանելիության սահմանափակումներ և վերահսկողության մեխանիզմներ, որպեսզի գործարքների տվյալները, վճարումների կարգավիճակները և ինքնության գրառումները պաշտպանվեն չարտոնված մուտքից, փոփոխումից կամ բացահայտումից։",
    s4h: "4. Մատակարարի համաձայնություն և համապատասխանություն",
    s4pBefore:
      "Հարթակից օգտվելով՝ Ծառայություն մատուցողը տալիս է համաձայնություն այն գործարքային տվյալների մշակմանը, որոնք պահանջվում են հարկային, հաշվապահական, հակախարդախային և իրավական համապատասխանության նպատակներով ՀՀ-ում։ Գաղտնիության հարցերով կապվեք՝",
    s4pAfter: "։"
  },
  ru: {
    documentTitle: "Политика конфиденциальности | VSTAH.am",
    backToHome: "На главную",
    h1: "Политика конфиденциальности",
    lead:
      "Настоящая Политика описывает, как VSTAH.am, выступая Нейтральной платежной инфраструктурой для поставщиков услуг в Армении, собирает и обрабатывает персональные и транзакционные данные для безопасных финансовых операций и соблюдения законодательства.",
    s1h: "1. Минимизация данных и правовое основание",
    s1p:
      "Мы собираем только те данные, которые необходимы для идентификации, верификации средств, предотвращения мошенничества и соблюдения применимых финансово-правовых требований Армении. Это может включать идентификаторы аккаунта, метаданные сделок, статус платежей и обязательные комплаенс-записи.",
    s2h: "2. Передача данных третьим лицам",
    s2p:
      "Передача данных осуществляется строго по принципу необходимости и только лицензированным финансовым учреждениям и регулируемым партнерам в Армении для безопасных переводов, расчетов и комплаенс-процедур. Мы не продаем персональные данные неуполномоченным третьим лицам.",
    s3h: "3. Безопасность и конфиденциальность",
    s3p:
      "Мы применяем меры защиты банковского уровня, включая шифрование, ограничение доступа и контрольные механизмы, чтобы обеспечить конфиденциальность сведений о сделках, статусах платежей и идентификационных данных.",
    s4h: "4. Согласие Исполнителя и комплаенс",
    s4pBefore:
      "Используя платформу, Исполнитель соглашается на обработку транзакционных данных, необходимых для налогового, бухгалтерского, антифрод и правового комплаенса в Республике Армения. По вопросам конфиденциальности:",
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
    title: "Ինչ որ բան սխալ է",
    body:
      "Սա հաճախ կապված է հին կեշի հետ (հատկապես եթե պանակը համաժամեցվում է OneDrive-ով). Փորձեք npm run dev:clean կամ ջնջեք .next պանակը, հետո նորից գործարկեք npm run dev։",
    tryAgain: "Կրկին փորձել",
    home: "Գլխավոր"
  },
  ru: {
    title: "Что-то пошло не так",
    body:
      "Часто это устаревший кэш сборки (например, при синхронизации папки через OneDrive). Запустите npm run dev:clean или удалите папку .next, затем снова npm run dev.",
    tryAgain: "Повторить",
    home: "Главная"
  }
};
