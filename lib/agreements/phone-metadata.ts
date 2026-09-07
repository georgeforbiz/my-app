const CONTACT_PHONES_BLOCK =
  /\n\n---\r?\nvstah-contact-phones\r?\nprovider:\s*([^\n\r]*)\r?\nclient:\s*([^\n\r]*)/i;

const CONTACT_EMAILS_BLOCK =
  /\n\n---\r?\nvstah-contact-emails\r?\nprovider:\s*([^\n\r]*)\r?\nclient:\s*([^\n\r]*)/i;

export type AgreementPhones = {
  provider?: string;
  client?: string;
};

export type AgreementEmails = {
  provider?: string;
  client?: string;
};

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

export function appendPhonesToTerms(
  customTerms: string,
  phones: { providerPhone?: string | null; clientPhone?: string | null }
): string {
  const base = stripPhonesFromTerms(customTerms);
  const provider = phones.providerPhone?.trim() ?? "";
  const client = phones.clientPhone?.trim() ?? "";
  if (!provider && !client) return base;
  return `${base}\n\n---\nvstah-contact-phones\nprovider: ${provider}\nclient: ${client}`;
}

export function stripPhonesFromTerms(customTerms: string): string {
  return normalizeNewlines(customTerms).replace(CONTACT_PHONES_BLOCK, "").trimEnd();
}

export function parsePhonesFromTerms(customTerms: string): AgreementPhones {
  const match = normalizeNewlines(customTerms).match(CONTACT_PHONES_BLOCK);
  if (!match) return {};
  const provider = match[1]?.trim();
  const client = match[2]?.trim();
  return {
    ...(provider ? { provider } : {}),
    ...(client ? { client } : {})
  };
}

export function resolveProviderPhone(dbValue: unknown, customTerms?: string | null): string | undefined {
  const fromDb = String(dbValue ?? "").trim();
  if (fromDb) return fromDb;
  const fromTerms = customTerms ? parsePhonesFromTerms(customTerms).provider : undefined;
  return fromTerms?.trim() || undefined;
}

export function resolveClientPhone(dbValue: unknown, customTerms?: string | null): string | undefined {
  const fromDb = String(dbValue ?? "").trim();
  if (fromDb) return fromDb;
  const fromTerms = customTerms ? parsePhonesFromTerms(customTerms).client : undefined;
  return fromTerms?.trim() || undefined;
}

export function appendEmailsToTerms(
  customTerms: string,
  emails: { providerEmail?: string | null; clientEmail?: string | null }
): string {
  const base = stripEmailsFromTerms(customTerms);
  const provider = emails.providerEmail?.trim() ?? "";
  const client = emails.clientEmail?.trim() ?? "";
  if (!provider && !client) return base;
  return `${base}\n\n---\nvstah-contact-emails\nprovider: ${provider}\nclient: ${client}`;
}

export function stripEmailsFromTerms(customTerms: string): string {
  return normalizeNewlines(customTerms).replace(CONTACT_EMAILS_BLOCK, "").trimEnd();
}

export function parseEmailsFromTerms(customTerms: string): AgreementEmails {
  const match = normalizeNewlines(customTerms).match(CONTACT_EMAILS_BLOCK);
  if (!match) return {};
  const provider = match[1]?.trim();
  const client = match[2]?.trim();
  return {
    ...(provider ? { provider } : {}),
    ...(client ? { client } : {})
  };
}

export function resolveProviderEmail(dbValue: unknown, customTerms?: string | null): string | undefined {
  const fromDb = String(dbValue ?? "").trim();
  if (fromDb) return fromDb;
  const fromTerms = customTerms ? parseEmailsFromTerms(customTerms).provider : undefined;
  return fromTerms?.trim() || undefined;
}

export function resolveClientEmail(dbValue: unknown, customTerms?: string | null): string | undefined {
  const fromDb = String(dbValue ?? "").trim();
  if (fromDb) return fromDb;
  const fromTerms = customTerms ? parseEmailsFromTerms(customTerms).client : undefined;
  return fromTerms?.trim() || undefined;
}
