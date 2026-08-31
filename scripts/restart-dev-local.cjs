/**
 * Stop port 3000, clear local .next, sync + start dev (fixes white screen / stale code).
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const sourceRoot = process.cwd();
const localRoot = process.env.VSTAH_LOCAL_DEV_ROOT || path.join("C:", "dev", "vstah-am");

try {
  execSync(
    'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
    { stdio: "ignore", shell: true }
  );
} catch {
  // ok
}

try {
  fs.rmSync(path.join(localRoot, ".next"), { recursive: true, force: true });
  console.log("Cleared", path.join(localRoot, ".next"));
} catch {
  // ok
}

// Force a full sync before starting so localhost always matches OneDrive source.
execSync("node scripts/sync-local.cjs", { cwd: sourceRoot, stdio: "inherit", shell: true });

const child = spawn("node", ["scripts/dev-local.cjs"], {
  cwd: sourceRoot,
  stdio: "inherit",
  shell: true
});
child.on("exit", (code) => process.exit(code ?? 0));
