/**
 * Stop port 3000, clear local .next, start dev:local (fixes white screen / stale chunks).
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

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

const child = spawn("node", ["scripts/dev-local.cjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: true
});
child.on("exit", (code) => process.exit(code ?? 0));
