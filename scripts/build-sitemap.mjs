/**
 * MEMÓRIA · robots.txt + sitemap.xml, generated at build time.
 * Product URLs come from the live database when configured, else the seed.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8').catch(() => ''))
    .split(/\r?\n/)
    .filter((l) => /^\w+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
const get = (k) => process.env[k] || env[k] || '';
const SITE = (get('VITE_SITE_URL') || 'https://example.com').replace(/\/$/, '');
let slugs = [];
if (get('VITE_SUPABASE_URL') && get('VITE_SUPABASE_ANON_KEY')) {
  const r = await fetch(`${get('VITE_SUPABASE_URL')}/rest/v1/products?select=slug&status=eq.published`, {
    headers: { apikey: get('VITE_SUPABASE_ANON_KEY'), Authorization: `Bearer ${get('VITE_SUPABASE_ANON_KEY')}` },
  });
  if (r.ok) slugs = (await r.json()).map((p) => p.slug);
}
if (!slugs.length) slugs = JSON.parse(await readFile('supabase/seed/product-assets.json', 'utf8')).map((a) => a.slug);
const urls = ['/', '/shop', '/our-story', '/help', ...slugs.map((s) => `/product/${s}`)];
const today = new Date().toISOString().slice(0, 10);
await mkdir('public', { recursive: true });
await writeFile(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /cart\nDisallow: /order/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`sitemap: ${urls.length} URLs for ${SITE}${SITE.includes('example.com') ? '  (set VITE_SITE_URL before launch)' : ''}`);
