/**
 * Copy latest code from OneDrive repo → C:\dev\vstah-am (no dev server).
 * Usage: npm run sync:local
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const sourceRoot = process.cwd();
const localRoot = process.env.VSTAH_LOCAL_DEV_ROOT || path.join("C:", "dev", "vstah-am");

fs.mkdirSync(path.dirname(localRoot), { recursive: true });
console.log(`Syncing ${sourceRoot}`);
console.log(`       → ${localRoot}`);

const args = [
  `"${sourceRoot}"`,
  `"${localRoot}"`,
  "/E",
  "/XD",
  ".next",
  "node_modules",
  ".git",
  "/XF",
  "*.tsbuildinfo",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/nc",
  "/np",
  "/ns"
];

try {
  execSync(`robocopy ${args.join(" ")}`, { stdio: "inherit", shell: true, windowsHide: true });
} catch (err) {
  const code = err.status;
  if (code === undefined || code > 7) throw err;
}

for (const rel of [
  "app/(account)/login/page.tsx",
  "app/(account)/register/page.tsx",
  "app/dashboard/page.tsx",
  "app/dashboard/layout.tsx",
  "middleware.ts"
]) {
  try {
    fs.rmSync(path.join(localRoot, rel), { force: true });
  } catch {
    // ok
  }
}

console.log("Sync complete. Run npm run dev:restart if the dev server is already running.");
