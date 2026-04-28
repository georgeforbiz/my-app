const sharp = require("sharp");
const path = require("path");

/** Matches lib/brand.ts NAVY (#0033A0) */
const NAVY = { r: 0, g: 51, b: 160, alpha: 1 };

const root = path.join(__dirname, "..");
const src = path.join(root, "public", "logo-vstah-clean.png");
const appDir = path.join(root, "app");

async function main() {
  const fit = {
    fit: "contain",
    background: NAVY,
  };

  await sharp(src)
    .resize(512, 512, fit)
    .png()
    .toFile(path.join(appDir, "icon.png"));

  await sharp(src)
    .resize(180, 180, fit)
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));

  console.log("Wrote app/icon.png (512) and app/apple-icon.png (180)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
