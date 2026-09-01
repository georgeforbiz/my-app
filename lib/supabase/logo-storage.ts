import type { SupabaseClient } from "@supabase/supabase-js";
import { readLogoDataUrl, withProviderLogoCacheBust } from "@/lib/agreements/logo-image";

export const LOGOS_BUCKET = "logos";

export function providerLogoObjectPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

export function buildLogoFilename(ext: "png" | "jpeg" | "webp" = "jpeg"): string {
  return `logo-${Date.now()}.${ext}`;
}

function extensionForMime(mime: string): "png" | "jpeg" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpeg";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Upload a compressed logo to `logos/{userId}/logo-{timestamp}.ext`. */
export async function uploadProviderLogoToStorage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url?: string; path?: string; error?: string }> {
  const { dataUrl, error: compressError } = await readLogoDataUrl(file);
  if (compressError || !dataUrl) {
    return { error: compressError ?? "Could not use this image." };
  }

  let blob: Blob;
  try {
    blob = await dataUrlToBlob(dataUrl);
  } catch {
    return { error: "Could not prepare this image for upload." };
  }

  const ext = extensionForMime(blob.type || file.type);
  const objectPath = providerLogoObjectPath(userId, buildLogoFilename(ext));

  const { error: uploadError } = await supabase.storage.from(LOGOS_BUCKET).upload(objectPath, blob, {
    upsert: true,
    contentType: blob.type || `image/${ext}`,
    cacheControl: "60"
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(objectPath);

  const url = withProviderLogoCacheBust(publicUrl, userId, Date.now());
  return { url, path: objectPath };
}

/** Remove all logo objects under `logos/{userId}/`. */
export async function deleteProviderLogosFromStorage(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const folder = `${userId}`;
  const { data: objects, error: listError } = await supabase.storage.from(LOGOS_BUCKET).list(folder);
  if (listError || !objects?.length) return;

  const paths = objects.map((obj) => providerLogoObjectPath(userId, obj.name));
  await supabase.storage.from(LOGOS_BUCKET).remove(paths);
}
