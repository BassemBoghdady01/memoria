/**
 * QA: viewport screenshots at chosen scroll targets.
 * Usage: node scripts/qa-frames.mjs <route> <w> <h> <outPrefix> <mobile 0|1> <targets...>
 * target = CSS selector, optionally "selector@0.5" = scroll into that element by 50% of its scrollable height.
 */
import { chromium } from 'playwright';
const [route, w, h, prefix, mobile, ...targets] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: mobile === '1', hasTouch: mobile === '1' });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
let n = 0;
for (const t of targets) {
  const [sel, frac] = t.split('@');
  await p.evaluate(([s, f]) => {
    const el = document.querySelector(s);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const extra = f ? (el.offsetHeight - window.innerHeight) * Number(f) : 0;
    window.scrollTo(0, top + extra);
  }, [sel, frac]);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${prefix}-${n++}.jpg`, type: 'jpeg', quality: 72 });
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
await b.close();
