import type { Language } from "@/lib/i18n/locales";
import {
  AgreementDocumentView,
  type AgreementDocumentData
} from "@/components/agreement-document-view";

/** @deprecated Use AgreementDocumentView — kept for existing imports. */
export function AgreementDocumentPreview({
  agreement,
  lang,
  draft = false
}: {
  agreement: AgreementDocumentData;
  lang: Language;
  draft?: boolean;
}) {
  return (
    <AgreementDocumentView agreement={agreement} lang={lang} draft={draft} embedded />
  );
}

export type { AgreementDocumentData };
