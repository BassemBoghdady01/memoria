/**
 * Quick visual QA: full-page screenshot of one route at one viewport,
 * with reveal animations forced on, plus console errors.
 * Usage: node scripts/qa-shot.mjs <route> <desktop|tablet|mobile> <out.jpg> [base]
 */
import { chromium } from 'playwright';

const [route = '/', vpName = 'desktop', out = 'qa/shot.jpg', base = 'http://localhost:5173'] = process.argv.slice(2);
const vps = { desktop: { width: 1440, height: 900 }, tablet: { width: 834, height: 1112 }, mobile: { width: 390, height: 844 } };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vps[vpName], deviceScaleFactor: 1, isMobile: vpName === 'mobile', hasTouch: vpName === 'mobile' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push('FAILED ' + r.url()));
page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
await page.goto(base + route, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
/* walk the page so scroll-triggered reveals fire, then return to top */
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 500) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(60);
}
await page.evaluate(() => {
  document.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('is-in'));
  window.scrollTo(0, 0);
});
await page.waitForTimeout(700);
await page.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 70 });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
