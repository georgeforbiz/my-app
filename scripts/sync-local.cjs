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

console.log("Sync complete. If dev is running, save a file or refresh the browser (Ctrl+Shift+R).");
