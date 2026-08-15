/**
 * When the repo is under OneDrive/iCloud, keep `.next` off the synced folder so chunks
 * are not deleted mid-dev (white screen / 404 on /_next/static/*).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

function isCloudSyncedProject(cwd = process.cwd()) {
  const norm = cwd.replace(/\\/g, "/").toLowerCase();
  return (
    norm.includes("onedrive") ||
    norm.includes("icloud") ||
    norm.includes("dropbox") ||
    norm.includes("google drive") ||
    norm.includes("cloudstorage")
  );
}

function getNextDistDirAbsolute(cwd = process.cwd()) {
  if (isCloudSyncedProject(cwd)) {
    return path.join(os.tmpdir(), "vstah-am-next");
  }
  return path.join(cwd, ".next");
}

/** Path for next.config `distDir` (relative to project root). */
function getNextDistDirRelative(cwd = process.cwd()) {
  const abs = getNextDistDirAbsolute(cwd);
  const rel = path.relative(cwd, abs);
  return rel.split(path.sep).join("/") || ".next";
}

function cleanNextDirs(cwd = process.cwd()) {
  const targets = [path.join(cwd, ".next"), getNextDistDirAbsolute(cwd)];
  for (const dir of targets) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`Removed ${dir}`);
    } catch {
      // ok if missing
    }
  }
}

module.exports = {
  isCloudSyncedProject,
  getNextDistDirAbsolute,
  getNextDistDirRelative,
  cleanNextDirs
};
