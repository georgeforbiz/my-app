/* Removes .next so the next dev/build starts from a fresh cache. */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Removed ${dir}`);
} catch {
  console.log("No .next to remove (ok)");
}
