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
    eyebrow: "Escrow",
    title: "Create a deal",
    subtitle: "Define your renovation project and deposit terms. Data is structured for your database.",
    projectTitle: "Project title",
    projectTitlePh: "e.g. Apartment renovation — Yerevan",
    description: "Description",
    descriptionPh: "Scope of work, materials, timeline…",
    totalAmount: "Total amount (AMD)",
    milestones: "Project milestones",
    milestonesPh: "Stage 1: … Stage 2: …",
    yourName: "Your name",
    yourEmail: "Your email",
    contractorEmailOptional: "Contractor email (optional)",
    notes: "Notes",
    alertInvalidAmount: "Enter a valid total amount in AMD.",
    submit: "Save deal (prepare for database)",
    submitSaving: "Saving…",
    preparedJson: "Prepared JSON (ready for API / Supabase)",
    backHome: "Back to home"
  },
  hy: {
    eyebrow: "Էսկրոու",
    title: "Ստեղծել գործարք",
    subtitle: "Նկարագրեք վերանորոգման նախագիծը և դեպոզիտի պայմանները։ Տվյալները պատրաստ են բազային տեղափոխման համար։",
    projectTitle: "Նախագծի վերնագիր",
    projectTitlePh: "օր․՝ Բնակարանի վերանորոգում — Երևան",
    description: "Նկարագրություն",
    descriptionPh: "Աշխատանքի ծավալ, նյութեր, ժամանակացույց…",
    totalAmount: "Ընդհանուր գումար (AMD)",
    milestones: "Նախագծի փուլեր",
    milestonesPh: "Փուլ 1՝ … Փուլ 2՝ …",
    yourName: "Ձեր անունը",
    yourEmail: "Ձեր էլ․ հասցեն",
    contractorEmailOptional: "Կապալառուի էլ․ հասցե (ըստ ցանկության)",
    notes: "Նշումներ",
    alertInvalidAmount: "Մուտքագրեք վավեր ընդհանուր գումար AMD-ով։",
    submit: "Պահպանել գործարքը (պատրաստ բազայի համար)",
    submitSaving: "Պահպանվում է…",
    preparedJson: "Պատրաստ JSON (API / Supabase)",
    backHome: "Վերադառնալ գլխավոր"
  },
  ru: {
    eyebrow: "Эскроу",
    title: "Создать сделку",
    subtitle: "Опишите проект ремонта и условия депозита. Данные структурированы для передачи в базу.",
    projectTitle: "Название проекта",
    projectTitlePh: "напр. Ремонт квартиры — Ереван",
    description: "Описание",
    descriptionPh: "Объём работ, материалы, сроки…",
    totalAmount: "Общая сумма (AMD)",
    milestones: "Этапы проекта",
    milestonesPh: "Этап 1: … Этап 2: …",
    yourName: "Ваше имя",
    yourEmail: "Ваш email",
    contractorEmailOptional: "Email подрядчика (необязательно)",
    notes: "Заметки",
    alertInvalidAmount: "Введите корректную общую сумму в AMD.",
    submit: "Сохранить сделку (подготовка к базе)",
    submitSaving: "Сохранение…",
    preparedJson: "Подготовленный JSON (для API / Supabase)",
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
    subtitle: "Invite your contractor to a clear, escrow-backed agreement.",
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
    title: "Պաշտպանել նախագիծը",
    subtitle: "Հրավիրեք կապալառուն՝ պարզ, էսկրոուով պաշտպանված պայմանագրի։",
    yourEmail: "Ձեր էլ․ հասցեն",
    yourNameOptional: "Ձեր անունը (ըստ ցանկության)",
    contractorEmail: "Կապալառուի էլ․ հասցեն հրավերի համար",
    projectSummary: "Նախագծի ամփոփում",
    invitationMessageOptional: "Հրավերի հաղորդագրություն (ըստ ցանկության)",
    submit: "Պատրաստել հրավերը (բազայի համար)",
    submitSaving: "Պահպանվում է…",
    preparedJson: "Պատրաստ JSON (API / Supabase)",
    backHome: "Վերադառնալ գլխավոր",
    phEmail: "you@example.com",
    phContractor: "contractor@example.com",
    phSummary: "Հասցե, ծավալ, ժամանակացույց, համաձայնեցված գումար…",
    phInvite: "Կարճ նամակ կապալառուին…"
  },
  ru: {
    eyebrow: "Защита",
    title: "Защитить проект",
    subtitle: "Пригласите подрядчика к понятному соглашению с оплатой через Эскроу.",
    yourEmail: "Ваш email",
    yourNameOptional: "Ваше имя (необязательно)",
    contractorEmail: "Email подрядчика для приглашения",
    projectSummary: "Кратко о проекте",
    invitationMessageOptional: "Текст приглашения (необязательно)",
    submit: "Подготовить приглашение (для базы)",
    submitSaving: "Сохранение…",
    preparedJson: "Подготовленный JSON (для API / Supabase)",
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
      "Sign by proceeding with the protected deposit flow. Funds remain held in escrow until milestones are approved.",
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
    loading: "Պայմանագիրը բեռնվում է…",
    supabaseNotConfigured: "Supabase-ը կարգավորված չէ։",
    notFound: "Պայմանագիրը չի գտնվել։",
    title: "VSTAH անվտանգ պայմանագիր",
    intro: "Ստուգեք պայմանագրի տվյալները և հետևեք վճարման հրահանգներին։",
    agreementId: "Պայմանագրի ID",
    client: "Հաճախորդ",
    project: "Նախագիծ",
    total: "Ընդհանուր",
    status: "Կարգավիճակ",
    created: "Ստեղծված",
    terms: "Պայմաններ",
    paymentInstructions: "Վճարման հրահանգներ",
    paymentInstructionsBody:
      "Ստորագրելու համար շարունակեք պաշտպանված դեպոզիտի գործընթացը։ Միջոցները պահվում են էսկրոուում մինչև փուլերի հաստատումը։",
    approveConfirm:
      "Վստահ եք, որ աշխատանքն ավարտված է՞ Սա թույլ կտա VSTAH-ին վճարել կապալառուին։",
    approveFailed: "Չհաջողվեց հաստատել վճարումը։ Փորձեք կրկին։",
    toastApproved: "Վճարումը հաստատված և արձակված է։",
    approving: "Հաստատվում է…",
    approveRelease: "Հաստատել և արձակել վճարումը",
    statusDraft: "Սևագիր",
    statusPendingDeposit: "Սպասում է դեպոզիտին",
    statusFundsSecured: "Միջոցները ապահովված են",
    statusPaymentRequested: "Վճարման հարցում",
    statusCompleted: "Ավարտված"
  },
  ru: {
    loading: "Загрузка сделки...",
    supabaseNotConfigured: "Supabase не настроен.",
    notFound: "Сделка не найдена.",
    title: "Безопасная сделка VSTAH",
    intro: "Проверьте условия сделки и следуйте инструкциям по оплате.",
    agreementId: "ID сделки",
    client: "Клиент",
    project: "Проект",
    total: "Итого",
    status: "Статус",
    created: "Создано",
    terms: "Условия",
    paymentInstructions: "Инструкции по оплате",
    paymentInstructionsBody:
      "Подтвердите защищённый депозит. Средства остаются в Эскроу до одобрения этапов.",
    approveConfirm:
      "Работы точно завершены? Это разрешит VSTAH выплатить подрядчику.",
    approveFailed: "Не удалось подтвердить выплату. Попробуйте снова.",
    toastApproved: "Выплата подтверждена и отправлена.",
    approving: "Подтверждение...",
    approveRelease: "Подтвердить и выплатить",
    statusDraft: "Черновик",
    statusPendingDeposit: "Ожидает депозита",
    statusFundsSecured: "Средства в Эскроу",
    statusPaymentRequested: "Запрос оплаты",
    statusCompleted: "Завершено"
  }
};
