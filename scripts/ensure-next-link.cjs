/**
 * On OneDrive/iCloud repos, junction project `.next` → %TEMP%/vstah-am-next so
 * webpack still resolves node_modules while sync does not touch build output.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { getNextDistDirAbsolute, isCloudSyncedProject } = require("./next-dist-dir.cjs");

if (!isCloudSyncedProject()) {
  process.exit(0);
}

const projectRoot = process.cwd();
const linkPath = path.join(projectRoot, ".next");
const targetPath = getNextDistDirAbsolute();

fs.mkdirSync(targetPath, { recursive: true });

function isReparsePoint(p) {
  try {
    const stat = fs.lstatSync(p);
    return stat.isSymbolicLink() || (stat.mode & 0x4000) !== 0;
  } catch {
    return false;
  }
}

try {
  if (fs.existsSync(linkPath)) {
    if (isReparsePoint(linkPath)) {
      process.exit(0);
    }
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
} catch (err) {
  console.warn("Could not remove existing .next:", err.message);
}

try {
  execSync(`cmd /c mklink /J "${linkPath}" "${targetPath}"`, {
    stdio: "ignore",
    windowsHide: true
  });
  console.log(`Linked .next → ${targetPath}`);
} catch (err) {
  console.warn(
    "Could not create .next junction (run terminal as admin or move repo off OneDrive):",
    err.message
  );
}
