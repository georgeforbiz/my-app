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

export const PROVIDER_LOGO_STORAGE_KEY = "vstah_last_provider_logo";

export function readProviderLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    !trimmed.startsWith("data:image/") &&
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://")
  ) {
    return null;
  }
  return trimmed;
}

export function resolveStoredProviderLogo(
  ...sources: Array<{ provider_logo_url?: string } | null | undefined>
): string | undefined {
  for (const source of sources) {
    const url = source?.provider_logo_url?.trim();
    if (url) return url;
  }
  return undefined;
}
