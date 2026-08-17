/**
 * Interaction QA — exercises the real shopping funnel and overlays.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
await mkdir('qa/flows', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));

const shot = (name) => page.screenshot({ path: `qa/flows/${name}.png` });

try {
  /* 1 — shop → product */
  await page.goto(BASE + '/shop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('.pcard [href="/product/nile-cedar"]');
  await page.waitForTimeout(900);
  if (!(await page.textContent('h1')).includes('Nile Cedar')) problems.push('PDP navigation failed');
  await shot('01-pdp');

  /* 2 — size switch updates price */
  await page.click('.size-opt[data-ml="50"]');
  const price50 = await page.textContent('[data-price-display]');
  if (!price50.includes('2,100')) problems.push('size switch price wrong: ' + price50);

  /* 3 — qty + add to bag opens drawer */
  await page.click('[data-qty="1"]');
  await page.click('[data-add-main]');
  await page.waitForTimeout(700);
  const drawerVisible = await page.isVisible('.drawer.is-open');
  if (!drawerVisible) problems.push('cart drawer did not open');
  const qtyText = await page.textContent('.drawer .cartline__qty span');
  if (qtyText.trim() !== '2') problems.push('drawer qty wrong: ' + qtyText);
  await shot('02-drawer');

  /* 4 — drawer qty controls */
  await page.click('.drawer [data-qty="1"]');
  await page.waitForTimeout(300);
  const subtotal = await page.textContent('[data-drawer-subtotal]');
  if (!subtotal.includes('6,300')) problems.push('drawer subtotal wrong: ' + subtotal);

  /* 5 — checkout via drawer */
  await page.click('[data-drawer-checkout]');
  await page.waitForTimeout(900);
  if (!page.url().endsWith('/checkout')) problems.push('checkout nav failed: ' + page.url());
  await shot('03-checkout');

  /* 6 — validation blocks empty submit */
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  const errors = await page.locator('.field.has-error').count();
  if (errors < 3) problems.push('checkout validation weak: ' + errors);
  await shot('04-checkout-errors');

  /* 7 — fill + place order */
  await page.fill('#co-name', 'Amina Test');
  await page.fill('#co-phone', '0100 000 0000');
  await page.fill('#co-email', 'amina@example.com');
  await page.fill('#co-address', '12 Test Street');
  await page.fill('#co-city', 'Cairo');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(700);
  if (!(await page.isVisible('.confirm'))) problems.push('order confirmation missing');
  await shot('05-confirm');

  /* 8 — cart cleared */
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('memoria.cart.v1')).length);
  if (count !== 0) problems.push('cart not cleared after order');

  /* 9 — search overlay */
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('[data-open-search]');
  await page.fill('.search__input', 'cedar');
  await page.waitForTimeout(400);
  const results = await page.locator('.overlay.is-open .search__item').count();
  if (results < 1) problems.push('search overlay found nothing for cedar');
  await shot('06-search');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  if (!page.url().includes('/product/')) problems.push('search enter did not navigate');

  /* 10 — finder flow */
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-open-finder-2]').scrollIntoView());
  await page.waitForTimeout(800);
  await page.click('[data-open-finder-2]');
  await page.waitForTimeout(400);
  await page.click('.finder__opt[data-val="woody"]');
  await page.click('.finder__opt[data-val="him"]');
  await page.click('.finder__opt[data-val="day"]');
  await page.waitForTimeout(400);
  const recs = await page.locator('.finder__results .search__item').count();
  if (recs < 1) problems.push('finder produced no recommendations');
  await shot('07-finder');

  /* 11 — archive lightbox */
  await page.goto(BASE + '/archive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.click('[data-artifact="0:0"]');
  await page.waitForTimeout(500);
  if (!(await page.isVisible('.lightbox.is-open'))) problems.push('lightbox did not open');
  await shot('08-lightbox');
  await page.keyboard.press('Escape');

  /* 12 — mobile nav + sticky buy */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mob.on('pageerror', (e) => problems.push('mobile pageerror: ' + e.message));
  await mob.goto(BASE + '/product/jasmine-dusk', { waitUntil: 'networkidle' });
  await mob.waitForTimeout(800);
  await mob.evaluate(() => window.scrollTo({ top: 2400 }));
  await mob.waitForTimeout(600);
  if (!(await mob.isVisible('.stickybuy.is-visible'))) problems.push('sticky buy bar not visible on mobile scroll');
  await mob.screenshot({ path: 'qa/flows/09-mobile-sticky.png' });
  await mob.click('[data-add-sticky]');
  await mob.waitForTimeout(600);
  if (!(await mob.isVisible('.drawer.is-open'))) problems.push('mobile sticky add did not open drawer');
  await mob.screenshot({ path: 'qa/flows/10-mobile-drawer.png' });
  await mob.goto(BASE + '/', { waitUntil: 'networkidle' });
  await mob.click('[data-open-mobilenav]');
  await mob.waitForTimeout(500);
  if (!(await mob.isVisible('.mobilenav.is-open'))) problems.push('mobile nav did not open');
  await mob.screenshot({ path: 'qa/flows/11-mobile-nav.png' });
  await mob.close();
} catch (err) {
  problems.push('EXCEPTION: ' + err.message);
}

await browser.close();
if (problems.length) {
  console.log('PROBLEMS:');
  problems.forEach((p) => console.log(' -', p));
  process.exit(1);
}
console.log('All flows passed.');
