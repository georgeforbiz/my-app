import { chromium } from "playwright";

const url = process.env.DEV_URL || "http://localhost:3000";
const logs = [];
const errors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

const text = await page.locator("body").innerText();
const hasVstah = text.includes("VSTAH");
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const visible = await page.locator("h1").first().isVisible().catch(() => false);

console.log(JSON.stringify({ hasVstah, visibleH1: visible, bodyBg, textLen: text.length, textSample: text.slice(0, 200), errors, logs: logs.slice(0, 15) }, null, 2));

await browser.close();
