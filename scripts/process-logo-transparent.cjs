/**
 * Removes solid black / near-black backgrounds from a logo PNG by making them transparent,
 * trims empty edges, then exports square assets for the site + favicon sources.
 *
 * Usage:
 *   node scripts/process-logo-transparent.cjs [path-to-source.png]
 *
 * Default source is the Cursor workspace asset path used when importing chat images.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const OUT = 1024;

const DEFAULT_SRC = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-georg-OneDrive-Documents-ayoayo",
  "assets",
  "c__Users_georg_AppData_Roaming_Cursor_User_workspaceStorage_733ad4a6423a8ca3509ca64c32ab5163_images_ChatGPT_Image_May_10__2026__03_13_57_PM-03c9f01c-6769-4490-9e41-b59ff7fc7b46.png"
);

/** Knock out pixels whose strongest channel is below this (pure black edge). */
const BLACK_MAX = 34;
/** Fully opaque once the brightest channel reaches this. */
const OPAQUE_MIN = 56;

function knockoutBlackBackgroundRgba(buf) {
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const prevA = buf[i + 3];
    const m = Math.max(r, g, b);

    let keyAlpha;
    if (m <= BLACK_MAX) keyAlpha = 0;
    else if (m >= OPAQUE_MIN) keyAlpha = 255;
    else keyAlpha = Math.round(((m - BLACK_MAX) / (OPAQUE_MIN - BLACK_MAX)) * 255);

    buf[i + 3] = Math.round((prevA * keyAlpha) / 255);
  }
}

async function main() {
  const srcArg = process.argv[2];
  const src = srcArg && fs.existsSync(srcArg) ? srcArg : DEFAULT_SRC;

  if (!fs.existsSync(src)) {
    console.error("Source PNG not found:", src);
    process.exit(1);
  }

  const archived = path.join(root, "public", "logo-import-source.png");
  fs.copyFileSync(src, archived);
  console.log("Copied source → public/logo-import-source.png");

  const input = await fs.promises.readFile(src);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    console.error("Expected RGBA after ensureAlpha");
    process.exit(1);
  }

  knockoutBlackBackgroundRgba(data);

  let pipeline = sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png();

  pipeline = pipeline.trim();

  const trimmedBuf = await pipeline.toBuffer();

  const finalBuf = await sharp(trimmedBuf)
    .resize(OUT, OUT, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const cleanOut = path.join(root, "public", "logo-vstah-clean.png");
  const altOut = path.join(root, "public", "logo-vstah.png");
  const tmpDir = require("os").tmpdir();
  const t1 = path.join(tmpDir, `vstah-a-${Date.now()}.png`);
  const t2 = path.join(tmpDir, `vstah-b-${Date.now()}.png`);

  await fs.promises.writeFile(t1, finalBuf);
  await fs.promises.copyFile(t1, t2);
  fs.renameSync(t1, cleanOut);
  fs.renameSync(t2, altOut);

  const meta = await sharp(cleanOut).metadata();
  console.log(`Wrote transparent ${OUT}×${OUT} (file ${meta.width}×${meta.height}, alpha: ${meta.hasAlpha}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
