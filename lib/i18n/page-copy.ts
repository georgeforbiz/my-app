import type { Language } from "@/lib/i18n/locales";

export type CreateDealCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  projectTitle: string;
  projectTitlePh: string;
  description: string;
  descriptionPh: string;
  totalAmount: string;
  milestones: string;
  milestonesPh: string;
  yourName: string;
  yourEmail: string;
  contractorEmailOptional: string;
  notes: string;
  alertInvalidAmount: string;
  submit: string;
  submitSaving: string;
  preparedJson: string;
  backHome: string;
};

export const createDealCopy: Record<Language, CreateDealCopy> = {
  en: {
    eyebrow: "Protected deal",
    title: "Create a deal",
    subtitle: "Define your renovation project and deposit terms. Data is structured for your database.",
    projectTitle: "Project title",
    projectTitlePh: "e.g. Apartment renovation — Yerevan",
    description: "Description",
    descriptionPh: "Scope of work, materials, timeline…",
    totalAmount: "Total amount (֏)",
    milestones: "Project milestones",
    milestonesPh: "Stage 1: … Stage 2: …",
    yourName: "Your name",
    yourEmail: "Your email",
    contractorEmailOptional: "Contractor email (optional)",
    notes: "Notes",
    alertInvalidAmount: "Enter a valid amount in Armenian dram (֏).",
    submit: "Save deal (prepare for database)",
    submitSaving: "Saving…",
    preparedJson: "Prepared JSON (ready for API / Supabase)",
    backHome: "Back to home"
  },
  hy: {
    eyebrow: "Պաշտպանված գործարք",
    title: "Ստեղծել գործարք",
    subtitle:
      "Վերանորոգման նախագիծ և դեպոզիտ։ Տվյալները՝ պատրաստ բազային։",
    projectTitle: "Նախագծի անուն",
    projectTitlePh: "օր․՝ Բնակարանի վերանորոգում — Երևան",
    description: "Նկարագրություն",
    descriptionPh: "ծավալ, նյութեր, ժամանակացույց…",
    totalAmount: "Ընդհանուր գումար (֏)",
    milestones: "Փուլեր",
    milestonesPh: "Փուլ 1՝ … Փուլ 2՝ …",
    yourName: "Անուն",
    yourEmail: "Էլ․ փոստ",
    contractorEmailOptional: "Կապալառուի էլ․ փոստ (ըստ ցանկության)",
    notes: "Նշումներ",
    alertInvalidAmount: "Մուտքագրեք վավեր գումար դրամով (֏)։",
    submit: "Պահպանել գործարքը (բազայի համար)",
    submitSaving: "Պահպանվում է…",
    preparedJson: "Պատրաստ JSON (API / Supabase)",
    backHome: "Գլխավոր"
  },
  ru: {
    eyebrow: "Защищённая сделка",
    title: "Создать соглашение",
    subtitle:
      "Опишите ремонт и условия депозита. Поля уже в формате для сохранения в базу.",
    projectTitle: "Название проекта",
    projectTitlePh: "напр., ремонт квартиры — Ереван",
    description: "Описание",
    descriptionPh: "Объём, материалы, сроки…",
    totalAmount: "Общая сумма (֏)",
    milestones: "Этапы",
    milestonesPh: "Этап 1: … Этап 2: …",
    yourName: "Ваше имя",
    yourEmail: "Эл. почта",
    contractorEmailOptional: "Эл. почта подрядчика (необязательно)",
    notes: "Примечания",
    alertInvalidAmount: "Укажите корректную сумму в драмах (֏).",
    submit: "Сохранить (для базы)",
    submitSaving: "Сохранение…",
    preparedJson: "JSON для API / Supabase",
    backHome: "На главную"
  }
};

export type ProtectCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  yourEmail: string;
  yourNameOptional: string;
  contractorEmail: string;
  projectSummary: string;
  invitationMessageOptional: string;
  submit: string;
  submitSaving: string;
  preparedJson: string;
  backHome: string;
  phEmail: string;
  phContractor: string;
  phSummary: string;
  phInvite: string;
};

export const protectCopy: Record<Language, ProtectCopy> = {
  en: {
    eyebrow: "Protection",
    title: "Protect my project",
    subtitle: "Invite your contractor to a clear, protected agreement.",
    yourEmail: "Your email",
    yourNameOptional: "Your name (optional)",
    contractorEmail: "Contractor email to invite",
    projectSummary: "Project summary",
    invitationMessageOptional: "Invitation message (optional)",
    submit: "Prepare invitation (database-ready)",
    submitSaving: "Saving…",
    preparedJson: "Prepared JSON (ready for API / Supabase)",
    backHome: "Back to home",
    phEmail: "you@example.com",
    phContractor: "contractor@example.com",
    phSummary: "Address, scope, timeline, agreed total…",
    phInvite: "Short note to your contractor…"
  },
  hy: {
    eyebrow: "Պաշտպանություն",
    title: "Պաշտպանեք նախագիծը",
    subtitle: "Հրավիրեք կապալառուն՝ պարզ պաշտպանված պայմանագիր։",
    yourEmail: "Էլ․ փոստ",
    yourNameOptional: "Անուն (ըստ ցանկության)",
    contractorEmail: "Կապալառուի էլ․ փոստ",
    projectSummary: "Կարճ նկարագրություն",
    invitationMessageOptional: "Հաղորդագրություն (ըստ ցանկության)",
    submit: "Պատրաստել հրավերը (բազայի համար)",
    submitSaving: "Պահպանվում է…",
    preparedJson: "Պատրաստ JSON (API / Supabase)",
    backHome: "Գլխավոր",
    phEmail: "you@example.com",
    phContractor: "contractor@example.com",
    phSummary: "Հասցե, ծավալ, ժամանակացույց, համաձայնեցված գումար…",
    phInvite: "Կարճ նամակ կապալառուին…"
  },
  ru: {
    eyebrow: "Защита",
    title: "Защитить проект",
    subtitle: "Пригласите подрядчика к прозрачному соглашению с защитой платежа.",
    yourEmail: "Эл. почта",
    yourNameOptional: "Ваше имя (необязательно)",
    contractorEmail: "Эл. почта подрядчика для приглашения",
    projectSummary: "Кратко о проекте",
    invitationMessageOptional: "Текст приглашения (необязательно)",
    submit: "Сформировать приглашение (для БД)",
    submitSaving: "Сохранение…",
    preparedJson: "JSON для API / Supabase",
    backHome: "На главную",
    phEmail: "you@example.com",
    phContractor: "contractor@example.com",
    phSummary: "Адрес, объём, сроки, сумма…",
    phInvite: "Короткое сообщение подрядчику…"
  }
};

export type DealPageCopy = {
  loading: string;
  supabaseNotConfigured: string;
  notFound: string;
  title: string;
  intro: string;
  agreementId: string;
  client: string;
  project: string;
  total: string;
  status: string;
  created: string;
  terms: string;
  paymentInstructions: string;
  paymentInstructionsBody: string;
  approveConfirm: string;
  approveFailed: string;
  toastApproved: string;
  approving: string;
  approveRelease: string;
  statusDraft: string;
  statusPendingDeposit: string;
  statusFundsSecured: string;
  statusPaymentRequested: string;
  statusCompleted: string;
};

export const dealPageCopy: Record<Language, DealPageCopy> = {
  en: {
    loading: "Loading agreement...",
    supabaseNotConfigured: "Supabase is not configured.",
    notFound: "Agreement not found.",
    title: "VSTAH Safe Agreement",
    intro: "Please review the agreement details and follow payment instructions.",
    agreementId: "Agreement ID",
    client: "Client",
    project: "Project",
    total: "Total",
    status: "Status",
    created: "Created",
    terms: "Terms",
    paymentInstructions: "Payment instructions",
    paymentInstructionsBody:
      "Sign by proceeding with the protected deposit flow. Funds remain held until milestones are approved.",
    approveConfirm:
      "Are you sure the work is completed? This will authorize VSTAH to pay the contractor.",
    approveFailed: "Failed to approve payment. Please try again.",
    toastApproved: "Payment approved and released.",
    approving: "Approving...",
    approveRelease: "Approve & release payment",
    statusDraft: "Draft",
    statusPendingDeposit: "Pending deposit",
    statusFundsSecured: "Funds secured",
    statusPaymentRequested: "Payment requested",
    statusCompleted: "Completed"
  },
  hy: {
    loading: "Բեռնում…",
    supabaseNotConfigured: "Supabase-ը կարգավորված չէ։",
    notFound: "Պայմանագիրը չի գտնվել։",
    title: "VSTAH անվտանգ պայմանագիր",
    intro: "Ստուգեք պայմանագիրը և կատարեք վճարման քայլերը։",
    agreementId: "ID",
    client: "Հաճախորդ",
    project: "Նախագիծ",
    total: "Ընդհանուր",
    status: "Կարգավիճակ",
    created: "Ստեղծված",
    terms: "Պայմաններ",
    paymentInstructions: "Վճարման քայլեր",
    paymentInstructionsBody:
      "Անցեք դեպոզիտի քայլերին։ Գումարը մնում է պահված՝ մինչև փուլերի հաստատումը։",
    approveConfirm:
      "Աշխատանքը ավարտված է՞ VSTAH-ը կփոխանցի կապալառուին։",
    approveFailed: "Չհաջողվեց հաստատել։ Փորձեք կրկին։",
    toastApproved: "Վճարումը հաստատված և արձակված։",
    approving: "Հաստատվում է…",
    approveRelease: "Հաստատել և արձակել",
    statusDraft: "Սևագիր",
    statusPendingDeposit: "Սպասում է դեպոզիտին",
    statusFundsSecured: "Գումարը պահվում է",
    statusPaymentRequested: "Վճարման սպասում",
    statusCompleted: "Ավարտված"
  },
  ru: {
    loading: "Загрузка соглашения…",
    supabaseNotConfigured: "Supabase не настроен.",
    notFound: "Соглашение не найдено.",
    title: "Защищённое соглашение VSTAH",
    intro: "Проверьте условия и следуйте инструкциям по оплате.",
    agreementId: "ID соглашения",
    client: "Клиент",
    project: "Проект",
    total: "Итого",
    status: "Статус",
    created: "Создано",
    terms: "Условия",
    paymentInstructions: "Как оплатить",
    paymentInstructionsBody:
      "Пройдите защищённый депозит. Средства остаются удержанными до приёмки этапов.",
    approveConfirm:
      "Работы завершены? После подтверждения VSTAH переведёт оплату исполнителю.",
    approveFailed: "Не удалось подтвердить выплату. Попробуйте снова.",
    toastApproved: "Выплата подтверждена и отправлена.",
    approving: "Подтверждение…",
    approveRelease: "Подтвердить и выплатить",
    statusDraft: "Черновик",
    statusPendingDeposit: "Ожидает депозита",
    statusFundsSecured: "Средства удерживаются",
    statusPaymentRequested: "Запрошена выплата",
    statusCompleted: "Завершено"
  }
};
