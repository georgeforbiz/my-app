/** Removes a OneDrive junction `.next` if present so Next uses a normal folder. */
const fs = require("fs");
const path = require("path");

const linkPath = path.join(process.cwd(), ".next");

function isReparsePoint(p) {
  try {
    const stat = fs.lstatSync(p);
    return stat.isSymbolicLink() || (stat.mode & 0x4000) !== 0;
  } catch {
    return false;
  }
}

if (fs.existsSync(linkPath) && isReparsePoint(linkPath)) {
  fs.rmSync(linkPath, { recursive: true, force: true });
  console.log("Removed .next junction");
}
