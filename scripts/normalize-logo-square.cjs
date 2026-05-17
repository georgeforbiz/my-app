/**
 * Removes unused padding (e.g. black frames around a small mark), crops to the artwork,
 * then scales to a square PNG so header slots (h-10 w-10 etc.) look full-sized again.
 *
 * Usage: node scripts/normalize-logo-square.cjs
 */
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "public", "logo-vstah-clean.png");
const OUT = 1024;
/** Pixel is “foreground” if total RGB energy above this (filters near-black padding). */
const MASK_THRESHOLD = 42;

function boundingBoxFromRgb(buf, width, height, channels, threshold) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const sum = buf[i] + buf[i + 1] + buf[i + 2];
      if (sum > threshold) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(width - 1, maxX + 2);
  maxY = Math.min(height - 1, maxY + 2);

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

async function main() {
  const input = await fs.promises.readFile(src);

  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const box = boundingBoxFromRgb(data, w, h, ch, MASK_THRESHOLD);

  let pipeline = sharp(input);

  if (box && box.width > 0 && box.height > 0 && box.width < w * 0.98) {
    pipeline = pipeline.extract({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height
    });
    console.log(`Cropped padding → content ${box.width}×${box.height} (from ${w}×${h}).`);
  } else {
    console.log(`No tight crop applied (box=${box ? `${box.width}×${box.height}` : "none"}).`);
  }

  // White letterboxing matches the marketing header/footer background.
  const buf = await pipeline
    .resize(OUT, OUT, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  const cleanOut = path.join(root, "public", "logo-vstah-clean.png");
  const altOut = path.join(root, "public", "logo-vstah.png");
  const tmpDir = require("os").tmpdir();
  const tmpClean = path.join(tmpDir, `vstah-clean-${Date.now()}.png`);
  const tmpAlt = path.join(tmpDir, `vstah-alt-${Date.now()}.png`);

  await sharp(buf).toFile(tmpClean);
  await sharp(buf).toFile(tmpAlt);
  fs.renameSync(tmpClean, cleanOut);
  fs.renameSync(tmpAlt, altOut);

  const after = await sharp(cleanOut).metadata();
  console.log(`Wrote ${OUT}×${OUT} logos (file ${after.width}×${after.height}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
