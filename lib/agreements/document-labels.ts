import type { Language } from "@/lib/i18n/locales";

export type AgreementDocumentLabels = {
  offer: string;
  title: string;
  subtitle: string;
  subtitleSigned: string;
  draftBanner: string;
  previewId: string;
  agreementId: string;
  creationDate: string;
  agreementPhase: string;
  phaseAwaitingSign: string;
  phaseCompleted: string;
  signedAndApproved: string;
  providerDetails: string;
  clientDetails: string;
  businessName: string;
  providerNameLabel: string;
  providerPhoneLabel: string;
  serviceAreaLabel: string;
  client: string;
  clientPhoneLabel: string;
  project: string;
  total: string;
  vatStatusIncluded: string;
  vatStatusExempt: string;
  termsAndConditions: string;
  scopeOfWork: string;
  scopeExclusions: string;
  estimatedCompletionDate: string;
  offerDeadline: string;
  paymentSchedule: string;
  paymentScheduleIntro: string;
  scheduleStage: string;
  scheduleAmount: string;
  scheduleCondition: string;
  scheduleStatus: string;
  statusSigned: string;
  pendingSignature: string;
  conditionStage: string;
  conditionSingle: string;
  singlePaymentLabel: string;
  agreeTermsAccepted: string;
  previewSignHint: string;
  clientSignature: string;
  signedSuccessNote: string;
  signedSuccessHint: string;
};

const labels: Record<Language, AgreementDocumentLabels> = {
  en: {
    offer: "Offer",
    title: "Safe Service Agreement",
    subtitle: "Review all details below before accepting this offer.",
    subtitleSigned: "Agreement Officially Executed & Signed",
    draftBanner: "Preview — not yet saved. Share link appears after you create the agreement.",
    previewId: "Draft preview",
    agreementId: "Agreement ID",
    creationDate: "Creation Date",
    agreementPhase: "Agreement",
    phaseAwaitingSign: "Awaiting signature",
    phaseCompleted: "Completed",
    signedAndApproved: "Signed & Approved",
    providerDetails: "Provider Details",
    clientDetails: "Client Details",
    businessName: "Business Name",
    providerNameLabel: "Provider Name",
    providerPhoneLabel: "Provider Phone",
    serviceAreaLabel: "Service Area",
    client: "Client",
    clientPhoneLabel: "Client Phone",
    project: "Project / Service",
    total: "Total Price",
    vatStatusIncluded: "VAT (20%): Included",
    vatStatusExempt: "VAT: Exempt",
    termsAndConditions: "Terms and Conditions",
    scopeOfWork: "Scope of Work (Included)",
    scopeExclusions: "What is NOT Included",
    estimatedCompletionDate: "Estimated Completion Date",
    offerDeadline: "Offer Deadline",
    paymentSchedule: "Payment Schedule",
    paymentScheduleIntro:
      "The payment schedule below is accepted in full with your single signature at the bottom.",
    scheduleStage: "Stage",
    scheduleAmount: "Amount",
    scheduleCondition: "Condition / Trigger",
    scheduleStatus: "Status",
    statusSigned: "Signed",
    pendingSignature: "Pending signature",
    conditionStage: "Upon completion of: {stage}",
    conditionSingle: "Upon completion of all work under this agreement",
    singlePaymentLabel: "Full payment",
    agreeTermsAccepted: "Terms accepted",
    previewSignHint: "Client will sign here on the shared agreement link.",
    clientSignature: "Client signature",
    signedSuccessNote: "The provider has been notified.",
    signedSuccessHint: "No account required."
  },
  hy: {
    offer: "Առաջարկ",
    title: "Անվտանգ ծառայության պայմանագիր",
    subtitle: "Ստուգեք տվյալները ստորագրելուց առաջ։",
    subtitleSigned: "Պայմանագիրը պաշտոնապես կնքված և ստորագրված է",
    draftBanner: "Նախադիտում — դեռ չի պահպանվել։ Հղումը հասանելի կլինի ստեղծելուց հետո։",
    previewId: "Նախադիտում",
    agreementId: "ID",
    creationDate: "Ստեղծման ամսաթիվ",
    agreementPhase: "Պայմանագիր",
    phaseAwaitingSign: "Սպասում է ստորագրման",
    phaseCompleted: "Ավարտված",
    signedAndApproved: "Ստորագրված և հաստատված",
    providerDetails: "Մատակարարի տվյալներ",
    clientDetails: "Հաճախորդի տվյալներ",
    businessName: "Բիզնեսի անվանում",
    providerNameLabel: "Մատակարարի անուն",
    providerPhoneLabel: "Մատակարարի հեռախոս",
    serviceAreaLabel: "Տարածք",
    client: "Հաճախորդ",
    clientPhoneLabel: "Հաճախորդի հեռախոս",
    project: "Նախագիծ / Ծառայություն",
    total: "Ընդհանուր գին",
    vatStatusIncluded: "ԱԱՀ (20%): Ներառված է",
    vatStatusExempt: "ԱԱՀ: Ազատված",
    termsAndConditions: "Պայմաններ",
    scopeOfWork: "Աշխատանքի շրջանակ (ներառված)",
    scopeExclusions: "Ինչը չի ներառվում",
    estimatedCompletionDate: "Ավարտի մոտավոր ամսաթիվ",
    offerDeadline: "Առաջարկի վավերականության ժամկետ",
    paymentSchedule: "Վճարման ժամանակացույց",
    paymentScheduleIntro:
      "Ստորև նշված է վճարման ժամանակացույցը, որը դուք ընդունում եք մեկ ստորագրությամբ։",
    scheduleStage: "Փուլ",
    scheduleAmount: "Գումար",
    scheduleCondition: "Պայման / Շարժիչ",
    scheduleStatus: "Կարգավիճակ",
    statusSigned: "Ստորագրված",
    pendingSignature: "Սպասում է ստորագրության",
    conditionStage: "Այս փուլի ավարտից հետո՝ {stage}",
    conditionSingle: "Պայմանագրով ամբողջ աշխատանքի ավարտից հետո",
    singlePaymentLabel: "Լրիվ վճարում",
    agreeTermsAccepted: "Պայմաններն ընդունված են",
    previewSignHint: "Հաճախորդը կստորագրի այստեղ՝ բացված հղումով։",
    clientSignature: "Հաճախորդի ստորագրություն",
    signedSuccessNote: "Մատակարարը ծանուցված է։",
    signedSuccessHint: "Հաշիվ պարտադիր չէ։"
  },
  ru: {
    offer: "Предложение",
    title: "Безопасное сервисное соглашение",
    subtitle: "Проверьте детали ниже перед принятием.",
    subtitleSigned: "Соглашение официально заключено и подписано",
    draftBanner: "Предпросмотр — ещё не сохранено. Ссылка появится после создания.",
    previewId: "Черновик",
    agreementId: "ID соглашения",
    creationDate: "Дата создания",
    agreementPhase: "Соглашение",
    phaseAwaitingSign: "Ожидает подписи",
    phaseCompleted: "Завершено",
    signedAndApproved: "Подписано и одобрено",
    providerDetails: "Исполнитель",
    clientDetails: "Клиент",
    businessName: "Название бизнеса",
    providerNameLabel: "Имя исполнителя",
    providerPhoneLabel: "Телефон исполнителя",
    serviceAreaLabel: "Регион",
    client: "Клиент",
    clientPhoneLabel: "Телефон клиента",
    project: "Проект / услуга",
    total: "Общая стоимость",
    vatStatusIncluded: "НДС (20%): Включён",
    vatStatusExempt: "НДС: Не облагается",
    termsAndConditions: "Условия",
    scopeOfWork: "Объём работ (включено)",
    scopeExclusions: "Что НЕ включено",
    estimatedCompletionDate: "Ориентировочная дата завершения",
    offerDeadline: "Срок действия предложения",
    paymentSchedule: "График платежей",
    paymentScheduleIntro: "Ниже указан график платежей, который вы принимаете одной подписью.",
    scheduleStage: "Этап",
    scheduleAmount: "Сумма",
    scheduleCondition: "Условие / триггер",
    scheduleStatus: "Статус",
    statusSigned: "Подписано",
    pendingSignature: "Ожидает подписи",
    conditionStage: "После завершения этапа: {stage}",
    conditionSingle: "После выполнения всех работ по соглашению",
    singlePaymentLabel: "Полная оплата",
    agreeTermsAccepted: "Условия приняты",
    previewSignHint: "Клиент подпишет здесь по общей ссылке.",
    clientSignature: "Подпись клиента",
    signedSuccessNote: "Исполнитель уведомлён.",
    signedSuccessHint: "Регистрация не требуется."
  }
};

export function getAgreementDocumentLabels(lang: Language): AgreementDocumentLabels {
  return labels[lang] ?? labels.en;
}
