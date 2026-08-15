/**
 * Quick check: is dev up and are JS chunks reachable?
 * Usage: npm run dev:check
 */
const http = require("http");

const base = process.env.DEV_URL || "http://localhost:3000";

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

(async () => {
  try {
    const page = await get(`${base}/`);
    if (page.status !== 200) {
      console.error(`Homepage returned ${page.status}`);
      process.exit(1);
    }
    const scripts = [...page.body.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
    const bad = [];
    for (const s of scripts) {
      const r = await get(`${base}${s}`);
      if (r.status !== 200) bad.push(`${r.status} ${s}`);
    }
    if (bad.length) {
      console.error("Broken JS chunks (white screen likely):");
      bad.forEach((b) => console.error(" ", b));
      console.error("\nFix: npm run dev:restart  (or dev:local:clean)");
      process.exit(1);
    }
    console.log(`OK — ${base} (${scripts.length} scripts, ${page.body.length} bytes HTML)`);
  } catch (e) {
    console.error(`Cannot reach ${base}: ${e.message}`);
    console.error("Start dev:  npm run dev:local");
    process.exit(1);
  }
})();
