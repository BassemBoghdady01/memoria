/**
 * Visual QA — screenshot every route at three viewports.
 * Usage: node scripts/qa-screens.mjs [route] [viewport]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT = 'qa';
await mkdir(OUT, { recursive: true });

const routes = [
  ['home', '/'],
  ['shop', '/shop'],
  ['women', '/women'],
  ['men', '/men'],
  ['product', '/product/jasmine-dusk'],
  ['product-oud', '/product/oud-mosaic'],
  ['story', '/our-story'],
  ['archive', '/archive'],
  ['cart', '/cart'],
  ['checkout', '/checkout'],
  ['search', '/search?q=rose'],
  ['account', '/account'],
  ['notfound', '/nothing-here'],
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

const onlyRoute = process.argv[2];
const onlyVp = process.argv[3];

const browser = await chromium.launch();
const errors = [];

for (const [vpName, vp] of Object.entries(viewports)) {
  if (onlyVp && vpName !== onlyVp) continue;
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => errors.push(`[${vpName}] pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${vpName}] console: ${msg.text()}`);
  });

  for (const [name, path] of routes) {
    if (onlyRoute && name !== onlyRoute) continue;
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${name}-${vpName}.png`, fullPage: false });
    // full page too (motion sections will be mid-state; still useful)
    await page.screenshot({ path: `${OUT}/${name}-${vpName}-full.png`, fullPage: true });
    // horizontal overflow check
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) errors.push(`[${vpName}] ${path} horizontal overflow: ${overflow}px`);
  }
  await ctx.close();
}

await browser.close();
if (errors.length) {
  console.log('ISSUES:');
  errors.forEach((e) => console.log(' -', e));
} else {
  console.log('No JS errors, no overflow.');
}
