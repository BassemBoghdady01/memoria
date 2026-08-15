/**
 * Scroll-through QA — capture the homepage (or any route) while actually
 * scrolling, so reveals / pinned scenes are exercised like a real visit.
 * Usage: node scripts/qa-scroll.mjs [path] [viewport] [steps]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const path = process.argv[2] || '/';
const vpName = process.argv[3] || 'desktop';
const steps = Number(process.argv[4] || 14);

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

const OUT = 'qa/scroll';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: viewports[vpName] });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto(BASE + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const slug = path.replace(/[^a-z0-9]+/gi, '_') || 'home';
for (let i = 0; i < steps; i++) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const y = Math.round((total * i) / (steps - 1));
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), y);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${OUT}/${slug}-${vpName}-${String(i).padStart(2, '0')}.jpeg`, type: 'jpeg', quality: 80 });
}
await browser.close();
console.log('done:', slug, vpName);
