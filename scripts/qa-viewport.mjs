import { chromium } from 'playwright';
const [route, w, h, out, mobile] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:+w,height:+h}, isMobile: mobile==='1', hasTouch: mobile==='1'});
const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:5173'+route,{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
await p.screenshot({path:out, type:'jpeg', quality:80, fullPage: process.argv[7]==='full'});
console.log(errs.join('\n')||'ok'); await b.close();
