/**
 * Run Next dev from a copy outside OneDrive so `.next` is not corrupted mid-build.
 * Usage: npm run dev:local  (from the OneDrive repo — syncs, then starts dev on :3000)
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { isCloudSyncedProject } = require("./next-dist-dir.cjs");

const sourceRoot = process.cwd();
const localRoot = process.env.VSTAH_LOCAL_DEV_ROOT || path.join("C:", "dev", "vstah-am");

function log(msg) {
  console.log(msg);
}

function mirrorSource() {
  fs.mkdirSync(path.dirname(localRoot), { recursive: true });
  log(`Syncing project → ${localRoot}`);
  // Use /E not /MIR: /MIR deletes destination folders excluded via /XD (e.g. node_modules),
  // which forced a full npm install on every dev:local run.
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
}

function ensureDeps() {
  const nm = path.join(localRoot, "node_modules");
  if (fs.existsSync(nm)) return;
  log("Installing dependencies in local dev folder (first run only)…");
  execSync("npm install", { cwd: localRoot, stdio: "inherit", shell: true });
}

function cleanLocalNext() {
  const nextDir = path.join(localRoot, ".next");
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch {
    // ok
  }
}

function startDev() {
  log(`Starting Next.js at http://localhost:3000 from ${localRoot}`);
  const child = spawn("npx", ["next", "dev", "-p", "3000"], {
    cwd: localRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, VSTAH_DEV_FROM_LOCAL: "1" }
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

if (!isCloudSyncedProject()) {
  log("Not a cloud-synced path — running next dev here.");
  const child = spawn("npx", ["next", "dev", "-p", "3000"], {
    cwd: sourceRoot,
    stdio: "inherit",
    shell: true
  });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  mirrorSource();
  ensureDeps();
  if (process.argv.includes("--clean")) cleanLocalNext();
  startDev();
}
