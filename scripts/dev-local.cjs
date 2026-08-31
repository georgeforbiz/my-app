/**
 * Start Next dev on :3000.
 * OneDrive: mirrors to C:\dev\vstah-am (robocopy on start + auto-sync on save).
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

function purgeStaleMirrorRoutes(root) {
  for (const rel of [
    "app/(account)/login/page.tsx",
    "app/(account)/register/page.tsx",
    "app/dashboard/page.tsx",
    "app/dashboard/layout.tsx",
    "middleware.ts"
  ]) {
    try {
      fs.rmSync(path.join(root, rel), { force: true });
    } catch {
      // ok
    }
  }
}

function mirrorSource(quiet = false) {
  fs.mkdirSync(path.dirname(localRoot), { recursive: true });
  if (!quiet) log(`Syncing project → ${localRoot}`);
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
    ...(quiet ? ["/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/np", "/ns"] : ["/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/np", "/ns"])
  ];
  try {
    execSync(`robocopy ${args.join(" ")}`, {
      stdio: quiet ? "pipe" : "inherit",
      shell: true,
      windowsHide: true
    });
  } catch (err) {
    const code = err.status;
    if (code === undefined || code > 7) throw err;
  }
  purgeStaleMirrorRoutes(localRoot);
}

function watchSourceAndSync() {
  let timer = null;
  let syncing = false;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (syncing) return;
      syncing = true;
      try {
        mirrorSource(true);
        log("Auto-synced latest edits to dev folder");
      } catch {
        // ok — next save will retry
      } finally {
        syncing = false;
      }
    }, 600);
  };

  try {
    fs.watch(sourceRoot, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      const f = filename.replace(/\\/g, "/");
      if (
        f.includes("node_modules/") ||
        f.includes(".next/") ||
        f.includes(".git/") ||
        f.endsWith(".tsbuildinfo")
      ) {
        return;
      }
      schedule();
    });
    log("Watching OneDrive repo — saves auto-sync to dev folder");
  } catch {
    log("Could not watch for file changes; run npm run sync:local after edits");
  }
}

function ensureDeps() {
  const nm = path.join(localRoot, "node_modules");
  if (fs.existsSync(nm)) return;
  log("Installing dependencies in local dev folder (first run only)…");
  execSync("npm install", { cwd: localRoot, stdio: "inherit", shell: true });
}

function cleanLocalNext() {
  try {
    fs.rmSync(path.join(localRoot, ".next"), { recursive: true, force: true });
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
  if (process.argv.includes("--clean")) cleanLocalNext();
  startDev();
} else {
  mirrorSource();
  ensureDeps();
  if (process.argv.includes("--clean")) cleanLocalNext();
  watchSourceAndSync();
  startDev();
}
