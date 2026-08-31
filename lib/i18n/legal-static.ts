import type { Language } from "@/lib/i18n/locales";

export type LegalListItem = {
  label?: string;
  text: string;
};

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  listIntro?: string;
  listItems?: LegalListItem[];
};

export type LegalPageContent = {
  documentTitle: string;
  backToHome: string;
  h1: string;
  sections: LegalSection[];
};

export const termsLegal: Record<Language, LegalPageContent> = {
  en: {
    documentTitle: "Terms of Service | VSTAH",
    backToHome: "Back to home",
    h1: "Terms of Service",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          'By accessing or using VSTAH ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.'
        ]
      },
      {
        heading: "2. Nature of Service",
        paragraphs: [
          "VSTAH is a digital agreement creation and metadata-logging platform. VSTAH is not a bank, escrow agent, payment processor, or legal firm. VSTAH provides tools to structure project terms and record electronic consent."
        ]
      },
      {
        heading: "3. Electronic Signatures & Audit Trail",
        paragraphs: [
          'By executing a document on VSTAH via touch/finger signature, users explicitly consent to conduct transactions electronically under the laws of the Republic of Armenia (including Law HO-122-N "On Electronic Documents and Electronic Digital Signatures"). The Platform records technical metadata (including timestamps, IP addresses, and device signatures) to form an immutable proof log.'
        ]
      },
      {
        heading: "4. User Content & Agreement Scope",
        paragraphs: [
          "Users are solely responsible for the accuracy, legality, and execution of the terms, scope, and pricing entered into any agreement. VSTAH does not guarantee payment, project completion, or quality of work between parties."
        ]
      },
      {
        heading: "5. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by applicable law, VSTAH shall not be liable for any indirect, incidental, or consequential damages, contract disputes, unpaid invoices, or scope disagreements between service providers and clients."
        ]
      },
      {
        heading: "6. Governing Law",
        paragraphs: [
          "These Terms shall be governed by and construed in accordance with the laws of the Republic of Armenia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Yerevan, Armenia."
        ]
      }
    ]
  },
  hy: {
    documentTitle: "Ծառայությունների մատուցման պայմաններ | VSTAH",
    backToHome: "Գլխավոր",
    h1: "Ծառայությունների մատուցման պայմաններ",
    sections: [
      {
        heading: "1. Պայմանների ընդունում",
        paragraphs: [
          "Մուտք գործելով կամ օգտագործելով VSTAH հարթակը («Հարթակ»)՝ Դուք համաձայնում եք ենթարկվել սույն Ծառայությունների մատուցման պայմաններին։ Եթե համաձայն չեք, մի օգտագործեք Հարթակը։"
        ]
      },
      {
        heading: "2. Ծառայության բնույթը",
        paragraphs: [
          "VSTAH-ը թվային պայմանագրերի ստեղծման և մետատվյալների գրանցման հարթակ է։ VSTAH-ը բանկ, էսքրոու գործակալ, վճարային համակարգ կամ իրավաբանական ընկերություն չէ։ VSTAH-ը տրամադրում է գործիքներ նախագծի պայմանները ձևակերպելու և էլեկտրոնային համաձայնությունը գրանցելու համար։"
        ]
      },
      {
        heading: "3. Էլեկտրոնային ստորագրություններ և աուդիտորական հետք",
        paragraphs: [
          "VSTAH-ում մատի/էկրանի հպման միջոցով փաստաթուղթ ստորագրելով՝ օգտատերերը հստակ համաձայնություն են տալիս գործարքներն իրականացնել էլեկտրոնային եղանակով՝ Հայաստանի Հանրապետության օրենսդրությանը համապատասխան (ներառյալ «Էլեկտրոնային փաստաթղթի և էլեկտրոնային թվային ստորագրության մասին» ՀՀ օրենքը)։ Հարթակը գրանցում է տեխնիկական մետատվյալներ (ներառյալ ժամանակացույցը, IP հասցեները և սարքի տվյալները)՝ անփոփոխ ապացուցողական լոգ ձևավորելու համար։"
        ]
      },
      {
        heading: "4. Օգտատիրոջ բովանդակությունը և պատասխանատվությունը",
        paragraphs: [
          "Օգտատերերը լիովին պատասխանատու են պայմանագրում մուտքագրված պայմանների, ծավալների և գների ճշգրտության ու օրինականության համար։ VSTAH-ը չի երաշխավորում վճարումները, նախագծերի կատարումը կամ աշխատանքի որակը կողմերի միջև։"
        ]
      },
      {
        heading: "5. Պատասխանատվության սահմանափակում",
        paragraphs: [
          "Օրենքով թույլատրված առավելագույն չափով VSTAH-ը պատասխանատվություն չի կրում որևէ անուղղակի կամ պատահական վնասների, պայմանագրային վեճերի, չվճարված հաշիվների կամ կողմերի միջև ծագած անհամաձայնությունների համար։"
        ]
      },
      {
        heading: "6. Կիրառելի օրենսդրություն",
        paragraphs: [
          "Սույն Պայմանները կարգավորվում և մեկնաբանվում են Հայաստանի Հանրապետության օրենսդրության համաձայն։ Վեճերը ենթակա են քննության Երևան քաղաքի ընդհանուր իրավասության դատարաններում։"
        ]
      }
    ]
  },
  ru: {
    documentTitle: "Условия использования | VSTAH",
    backToHome: "На главную",
    h1: "Условия использования",
    sections: [
      {
        heading: "1. Принятие условий",
        paragraphs: [
          "Получая доступ или используя платформу VSTAH («Платформа»), вы соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны, не используйте Платформу."
        ]
      },
      {
        heading: "2. Характер сервиса",
        paragraphs: [
          "VSTAH — это платформа для создания цифровых соглашений и фиксации метаданных. VSTAH не является банком, эскроу-агентом, платежным процессором или юридической фирмой. VSTAH предоставляет инструменты для структурирования условий проектов и фиксации электронного согласия."
        ]
      },
      {
        heading: "3. Электронные подписи и аудиторский след",
        paragraphs: [
          "Подписывая документ на VSTAH с помощью сенсорного ввода/подписи пальцем, пользователи выражают явное согласие на совершение сделок в электронной форме в соответствии с законодательством Республики Армения (включая Закон RA HO-122-N «Об электронном документе и электронной цифровой подписи»). Платформа фиксирует технические метаданные (включая метки времени, IP-адреса и данные устройства) для формирования неизменяемого журнала доказательств."
        ]
      },
      {
        heading: "4. Контент пользователей и зоны ответственности",
        paragraphs: [
          "Пользователи несут полную ответственность за точность, законность и исполнение условий, объемов работ и цен, указанных в соглашении. VSTAH не гарантирует оплату, завершение проектов или качество работ между сторонами."
        ]
      },
      {
        heading: "5. Ограничение ответственности",
        paragraphs: [
          "В максимальной степени, разрешенной законодательством, VSTAH не несет ответственности за любые косвенные убытки, договорные споры, неоплаченные счета или разногласия по объему работ между исполнителями и клиентами."
        ]
      },
      {
        heading: "6. Применимое право",
        paragraphs: [
          "Настоящие Условия регулируются и толкуются в соответствии с законодательством Республики Армения. Споры подлежат разрешению в компетентных судах г. Еревана, Армения."
        ]
      }
    ]
  }
};

export const privacyLegal: Record<Language, LegalPageContent> = {
  en: {
    documentTitle: "Privacy Policy | VSTAH",
    backToHome: "Back to home",
    h1: "Privacy Policy",
    sections: [
      {
        heading: "1. Information We Collect",
        listItems: [
          {
            label: "Account Information",
            text: "Name, phone number, business name, and contact details provided during usage."
          },
          {
            label: "Agreement Metadata",
            text: "IP addresses, device identifiers, timestamps, geolocation data (if enabled), and touch stroke coordinates captured during electronic signing."
          },
          {
            label: "Agreement Content",
            text: "Project titles, scope descriptions, agreed amounts, and milestone structures."
          }
        ]
      },
      {
        heading: "2. How We Use Information",
        listIntro: "We use collected data solely to:",
        listItems: [
          { text: "Generate, verify, and store immutable digital agreements." },
          { text: "Provide an audit trail to prove signature authenticity in case of disputes." },
          { text: "Maintain and optimize Platform performance and security." }
        ]
      },
      {
        heading: "3. Data Protection & Sharing",
        paragraphs: [
          "We do not sell user data. Data is shared only between the contracting parties of a specific agreement, or when required by Armenian law enforcement or court orders."
        ]
      },
      {
        heading: "4. Retention",
        paragraphs: [
          "Agreement records and metadata are permanently retained to maintain the integrity of the audit trail for contractual evidence purposes."
        ]
      }
    ]
  },
  hy: {
    documentTitle: "Գաղտնիության քաղաքականություն | VSTAH",
    backToHome: "Գլխավոր",
    h1: "Գաղտնիության քաղաքականություն",
    sections: [
      {
        heading: "1. Հավաքագրվող տեղեկատվությունը",
        listItems: [
          {
            label: "Հաշվի տվյալներ",
            text: "Անուն, հեռախոսահամար, ընկերության անվանում և կոնտակտային տվյալներ։"
          },
          {
            label: "Պայմանագրի մետատվյալներ",
            text: "IP հասցեներ, սարքի նույնականացուցիչներ, ժամանակի նշում, աշխարհագրական տվյալներ (եթե միացված է) և ստորագրման պահին էկրանի հպման կոորդինատներ։"
          },
          {
            label: "Պայմանագրի բովանդակություն",
            text: "Նախագծի անվանում, աշխատանքի ծավալ, համաձայնեցված գումար և փուլեր։"
          }
        ]
      },
      {
        heading: "2. Տվյալների օգտագործման նպատակները",
        listIntro: "Հավաքագրված տվյալներն օգտագործվում են բացառապես․",
        listItems: [
          { text: "Անփոփոխ թվային պայմանագրեր ստեղծելու և պահպանելու համար։" },
          { text: "Վեճերի դեպքում ստորագրության իսկությունը հաստատող աուդիտորական հետք ապահովելու համար։" },
          { text: "Հարթակի անվտանգությունն ու աշխատանքը ապահովելու համար։" }
        ]
      },
      {
        heading: "3. Տվյալների պաշտպանությունը և փոխանցումը",
        paragraphs: [
          "Մենք չենք վաճառում օգտատերերի տվյալները։ Տվյալները փոխանցվում են միայն տվյալ պայմանագրի կողմերին կամ ՀՀ օրենսդրությամբ նախատեսված դեպքերում՝ իրավապահ մարմինների կամ դատարանի պահանջով։"
        ]
      },
      {
        heading: "4. Տվյալների պահպանումը",
        paragraphs: [
          "Պայմանագրերի գրանցումները և մետատվյալները պահպանվում են մշտապես՝ պայմանագրային ապացույցների ամբողջականությունն ու աուդիտորական հետքը ապահովելու համար։"
        ]
      }
    ]
  },
  ru: {
    documentTitle: "Политика конфиденциальности | VSTAH",
    backToHome: "На главную",
    h1: "Политика конфиденциальности",
    sections: [
      {
        heading: "1. Собираемая информация",
        listItems: [
          {
            label: "Данные аккаунта",
            text: "Имя, номер телефона, название компании и контактные данные."
          },
          {
            label: "Метаданные соглашения",
            text: "IP-адреса, идентификаторы устройств, метки времени, геолокация (если включена) и координаты касаний при электронной подписи."
          },
          {
            label: "Содержание соглашения",
            text: "Название проекта, описание объема работ, согласованные суммы и этапы."
          }
        ]
      },
      {
        heading: "2. Цели использования информации",
        listIntro: "Мы используем собранные данные исключительно для:",
        listItems: [
          { text: "Создания, проверки и хранения неизменяемых цифровых соглашений." },
          { text: "Предоставления аудиторского следа для подтверждения подлинности подписи в случае споров." },
          { text: "Обеспечения безопасности и работоспособности Платформы." }
        ]
      },
      {
        heading: "3. Защита и передача данных",
        paragraphs: [
          "Мы не продаем данные пользователей. Данные передаются только сторонам конкретного соглашения или по запросу правоохранительных и судебных органов Республики Армения."
        ]
      },
      {
        heading: "4. Хранение данных",
        paragraphs: [
          "Записи соглашений и метаданные хранятся бессрочно для обеспечения целостности аудиторского следа и договорной доказательной базы."
        ]
      }
    ]
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
