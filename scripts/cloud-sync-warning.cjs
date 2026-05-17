/**
 * Prints a one-time hint when the repo lives under a cloud-synced folder (OneDrive,
 * iCloud Drive, etc.). Those setups often corrupt or lock `.next` → `/_next/static/*`
 * 404 → blank white page in the browser.
 */
const cwd = process.cwd().replace(/\\/g, "/").toLowerCase();
const looksSynced =
  cwd.includes("onedrive") ||
  cwd.includes("icloud") ||
  cwd.includes("dropbox") ||
  cwd.includes("google drive") ||
  cwd.includes("cloudstorage");

if (!looksSynced) {
  process.exit(0);
}

// stderr so it does not look like part of Next.js stdout
console.warn(`
▸ Cloud-sync folder detected for this project.
  If the site appears as a white screen, static chunks under /.next were likely missing (404).
  Fix: stop the dev server, run "npm run clean", then "npm run dev" again.
  Do not run "npm run build" while "npm run dev" is running on the same folder.
  Best: clone or copy the repo to a non-synced path (e.g. C:\\\\dev\\\\ayoayo).
`);
