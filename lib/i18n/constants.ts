/** Must stay in a server-safe file — used by `app/layout.tsx` (RSC). */
export const STORAGE_KEY = "vstah-language";

/** Synced from the client so full page loads can set `<html lang>` via cookies(). */
export const LANG_COOKIE = "vstah-lang";
