import {
  LEGACY_PROVIDER_LOGO_KEY,
  providerLogoStorageKey
} from "@/lib/auth/storage-keys";

const MAX_OUTPUT_BYTES = 180_000;
const MAX_DIMENSION = 240;

/** Resize and compress an image file to a data URL suitable for agreement storage. */
export async function readLogoDataUrl(file: File): Promise<{ dataUrl?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Please choose a PNG or JPEG image." };
  }
  if (file.size > 4_000_000) {
    return { error: "Image must be under 4 MB." };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: "Could not read this image. Try a different file." };
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { error: "Could not process this image." };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  let quality = 0.88;
  let dataUrl = canvas.toDataURL(mime, quality);

  while (dataUrl.length > MAX_OUTPUT_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_OUTPUT_BYTES) {
    return { error: "Logo is too large after compression. Use a simpler image." };
  }

  return { dataUrl };
}

/** @deprecated Legacy global key — caused cross-account bleed; cleared on logout and never read. */
export const PROVIDER_LOGO_STORAGE_KEY = LEGACY_PROVIDER_LOGO_KEY;

export { providerLogoStorageKey };

function isStoredLogoValue(value: string): boolean {
  return (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

/** Read the provider logo saved for a specific authenticated user. */
export function readStoredProviderLogo(userId: string | undefined | null): string {
  if (!userId || typeof window === "undefined") return "";
  try {
    localStorage.removeItem(PROVIDER_LOGO_STORAGE_KEY);
    const saved = localStorage.getItem(providerLogoStorageKey(userId));
    return saved && isStoredLogoValue(saved) ? saved : "";
  } catch {
    return "";
  }
}

export function writeStoredProviderLogo(userId: string, logoUrl: string): void {
  if (typeof window === "undefined") return;
  if (!isStoredLogoValue(logoUrl)) return;
  try {
    localStorage.setItem(providerLogoStorageKey(userId), logoUrl);
    localStorage.setItem(`${providerLogoStorageKey(userId)}:ts`, String(Date.now()));
    localStorage.removeItem(PROVIDER_LOGO_STORAGE_KEY);
  } catch {
    // quota / private mode
  }
}

export function readStoredProviderLogoTimestamp(userId: string | undefined | null): number {
  if (!userId || typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(`${providerLogoStorageKey(userId)}:ts`);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : Date.now();
  } catch {
    return Date.now();
  }
}

export function clearStoredProviderLogo(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(providerLogoStorageKey(userId));
    localStorage.removeItem(`${providerLogoStorageKey(userId)}:ts`);
    localStorage.removeItem(PROVIDER_LOGO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Append user id + timestamp cache-busting params for HTTP logo URLs. */
export function withProviderLogoCacheBust(
  url: string | undefined | null,
  userId: string,
  timestamp?: string | number
): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return undefined;

  const uid = userId.trim() || "anon";
  const ts = String(timestamp ?? Date.now());
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://www.vstah.am";
    const parsed = new URL(trimmed, base);
    parsed.searchParams.set("uid", uid);
    parsed.searchParams.set("v", ts);
    return parsed.href;
  } catch {
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}uid=${encodeURIComponent(uid)}&v=${encodeURIComponent(ts)}`;
  }
}

export function readProviderLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    !trimmed.startsWith("data:image/") &&
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !(trimmed.startsWith("/") && !trimmed.includes(".."))
  ) {
    return null;
  }
  return trimmed;
}

export function isAllowedProviderLogoUrl(value: unknown): boolean {
  return readProviderLogoUrl(value) !== null;
}

/** Saved on the auth user so the logo survives logout and applies to new agreements. */
export const PROVIDER_LOGO_METADATA_KEY = "provider_logo_url";

export function readProviderLogoFromMetadata(
  meta: Record<string, unknown> | undefined | null
): string {
  return readProviderLogoUrl(meta?.[PROVIDER_LOGO_METADATA_KEY]) ?? "";
}

/** Storage → account metadata → most recent agreement row. */
export function resolveProviderLogoForUser(
  userId: string | undefined | null,
  meta?: Record<string, unknown> | null,
  agreements?: Array<{ provider_logo_url?: string }>
): string {
  const fromStorage = readStoredProviderLogo(userId);
  if (fromStorage) return fromStorage;

  const fromMeta = readProviderLogoFromMetadata(meta);
  if (fromMeta) return fromMeta;

  for (const row of agreements ?? []) {
    const url = row.provider_logo_url?.trim();
    if (url) return url;
  }
  return "";
}

export async function syncProviderLogoToAccount(
  supabase: { auth: { updateUser: (args: { data: Record<string, string> }) => Promise<unknown> } },
  userId: string,
  logoUrl: string
): Promise<void> {
  const trimmed = logoUrl.trim();
  if (!trimmed || !readProviderLogoUrl(trimmed)) return;
  writeStoredProviderLogo(userId, trimmed);
  // Data URLs are too large for auth metadata — keep them in localStorage + agreement rows.
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return;
  try {
    await supabase.auth.updateUser({ data: { [PROVIDER_LOGO_METADATA_KEY]: trimmed } });
  } catch {
    // offline — local cache still applies on this device
  }
}

export async function clearProviderLogoFromAccount(
  supabase: { auth: { updateUser: (args: { data: Record<string, string> }) => Promise<unknown> } },
  userId: string
): Promise<void> {
  clearStoredProviderLogo(userId);
  try {
    await supabase.auth.updateUser({ data: { [PROVIDER_LOGO_METADATA_KEY]: "" } });
  } catch {
    // ignore
  }
}

export function resolveEffectiveProviderLogo(
  stateUrl: string | undefined | null,
  userId: string | undefined | null,
  meta?: Record<string, unknown> | null,
  agreements?: Array<{ provider_logo_url?: string }>
): string {
  const fromState = stateUrl?.trim() ?? "";
  if (fromState && readProviderLogoUrl(fromState)) return fromState;
  return resolveProviderLogoForUser(userId, meta, agreements);
}

/** Logo for an agreement row, falling back to the provider's saved logo. */
export function resolveAgreementProviderLogo(
  agreement: { provider_id?: string; provider_logo_url?: string } | null | undefined,
  userId?: string | null
): string | undefined {
  const fromRow = readProviderLogoUrl(agreement?.provider_logo_url);
  if (fromRow) return fromRow;
  const providerId = agreement?.provider_id ?? userId;
  const stored = readStoredProviderLogo(providerId);
  return stored || undefined;
}

export function resolveStoredProviderLogo(
  ...sources: Array<{ provider_logo_url?: string } | null | undefined>
): string | undefined {
  for (const source of sources) {
    const url = readProviderLogoUrl(source?.provider_logo_url);
    if (url) return url;
  }
  return undefined;
}
