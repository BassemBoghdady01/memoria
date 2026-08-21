/**
 * MEMÓRIA · Bottle renders — matched to the client's approved bottle sheet.
 *
 * ONE cylindrical silhouette across all six fragrances. Per the approved
 * system, only these vary: liquid/glass colour, accent, ring below the cap,
 * cap finish, label details. Three collections: BLACK (01–02),
 * NILE (03–04), TERRACOTTA (05–06).
 *
 * Usage: node scripts/build-bottle-renders.mjs
 * Output: public/renders/no{1..6}-{720,360}.png|webp (transparent, baked shadow)
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/renders';
await mkdir(OUT, { recursive: true });

/* Collection hardware: cap finish + ring + label dot */
const COLLECTIONS = {
  black: {
    cap: ['#241E1A', '#4A403A', '#16110E', '#332A24', '#0E0A08'],
    ring: ['#6E5B3A', '#C9B080', '#8A744A'],
    dot: '#26201D',
  },
  nile: {
    cap: ['#1C3A50', '#3A6480', '#142C3E', '#2A4E68', '#0E2230'],
    ring: ['#6E5B3A', '#C9B080', '#8A744A'],
    dot: '#2F6670',
  },
  terracotta: {
    cap: ['#8A3E22', '#C67450', '#702F16', '#A85434', '#5C2410'],
    ring: ['#6E5B3A', '#C9B080', '#8A744A'],
    dot: '#B66A4B',
  },
};

/* liquid: [top sheen, body, depth] — glass and juice read as one, like the sheet */
const SCENTS = [
  { n: 1, slug: 'jasmine-dusk', name: 'JASMINE DUSK', col: 'black',      liquid: ['#8A7A42', '#6E5A28', '#3A2C10'] },
  { n: 2, slug: 'rose-vellum',  name: 'ROSE VELLUM',  col: 'black',      liquid: ['#6E4A30', '#4E2E1A', '#28140A'] },
  { n: 3, slug: 'sunday-linen', name: 'SUNDAY LINEN', col: 'nile',       liquid: ['#D8D6CC', '#C2C4BE', '#8E9490'] },
  { n: 4, slug: 'midnight-fig', name: 'MIDNIGHT FIG', col: 'nile',       liquid: ['#33565E', '#22414A', '#0F2228'] },
  { n: 5, slug: 'ambered-wood', name: 'AMBERED WOOD', col: 'terracotta', liquid: ['#B06A24', '#8A4A16', '#4A2408'] },
  { n: 6, slug: 'oud-mosaic',   name: 'OUD MOSAIC',   col: 'terracotta', liquid: ['#7A3018', '#5A2010', '#300E06'] },
];

function bottleSVG(s) {
  const c = COLLECTIONS[s.col];
  const [liqHi, liqMid, liqDeep] = s.liquid;
  /* geometry — one silhouette, never changes */
  const bodyX = 178, bodyW = 244, bodyTop = 340, bodyBot = 838, shoulderR = 30;
  const capX = 252, capW = 96, capTop = 128, capH = 168;
  const ringY = capTop + capH, ringH = 14;
  const neckY = ringY + ringH;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="920" viewBox="0 0 600 920">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${liqDeep}"/>
      <stop offset=".07" stop-color="${liqMid}"/>
      <stop offset=".2" stop-color="${liqHi}"/>
      <stop offset=".34" stop-color="${liqMid}"/>
      <stop offset=".62" stop-color="${liqDeep}"/>
      <stop offset=".82" stop-color="${liqMid}"/>
      <stop offset=".95" stop-color="${liqHi}"/>
      <stop offset="1" stop-color="${liqDeep}"/>
    </linearGradient>
    <linearGradient id="spec" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(255,252,244,0)"/>
      <stop offset=".1" stop-color="rgba(255,252,244,.85)"/>
      <stop offset=".7" stop-color="rgba(255,252,244,.35)"/>
      <stop offset="1" stop-color="rgba(255,252,244,0)"/>
    </linearGradient>
    <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c.cap[4]}"/>
      <stop offset=".16" stop-color="${c.cap[0]}"/>
      <stop offset=".34" stop-color="${c.cap[1]}"/>
      <stop offset=".52" stop-color="${c.cap[0]}"/>
      <stop offset=".8" stop-color="${c.cap[2]}"/>
      <stop offset="1" stop-color="${c.cap[4]}"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c.ring[0]}"/>
      <stop offset=".3" stop-color="${c.ring[1]}"/>
      <stop offset=".55" stop-color="${c.ring[2]}"/>
      <stop offset=".8" stop-color="${c.ring[1]}"/>
      <stop offset="1" stop-color="${c.ring[0]}"/>
    </linearGradient>
    <radialGradient id="shoulderGlow" cx=".5" cy="0" r="1">
      <stop offset="0" stop-color="rgba(255,250,240,.4)"/>
      <stop offset=".5" stop-color="rgba(255,250,240,.08)"/>
      <stop offset="1" stop-color="rgba(255,250,240,0)"/>
    </radialGradient>
  </defs>

  <!-- contact shadow -->
  <ellipse cx="300" cy="856" rx="188" ry="22" fill="rgba(28,16,8,.3)" filter="blur(13px)"/>
  <ellipse cx="300" cy="852" rx="140" ry="12" fill="rgba(28,16,8,.24)" filter="blur(7px)"/>

  <!-- cap: tall cylinder, matte collection finish -->
  <rect x="${capX}" y="${capTop}" width="${capW}" height="${capH}" rx="10" fill="url(#cap)"/>
  <ellipse cx="300" cy="${capTop + 7}" rx="${capW / 2 - 2}" ry="7" fill="${c.cap[1]}" opacity=".8"/>
  <rect x="${capX + 14}" y="${capTop + 10}" width="9" height="${capH - 22}" rx="4.5" fill="rgba(255,246,230,.32)" filter="blur(2.5px)"/>
  <rect x="${capX + capW - 26}" y="${capTop + 12}" width="5" height="${capH - 26}" rx="2.5" fill="rgba(255,246,230,.16)" filter="blur(2px)"/>

  <!-- ring below the cap -->
  <rect x="${capX + 2}" y="${ringY}" width="${capW - 4}" height="${ringH}" rx="4" fill="url(#ring)"/>
  <rect x="${capX + 2}" y="${ringY + 2}" width="${capW - 4}" height="3" fill="rgba(255,248,230,.5)" filter="blur(1px)"/>

  <!-- neck (short, glass) -->
  <rect x="${capX + 8}" y="${neckY}" width="${capW - 16}" height="${bodyTop - neckY + 8}" fill="url(#body)" opacity=".9"/>

  <!-- body: one cylinder, colored glass + liquid as one mass -->
  <rect x="${bodyX}" y="${bodyTop}" width="${bodyW}" height="${bodyBot - bodyTop}" rx="${shoulderR}" fill="url(#body)"/>
  <!-- shoulder light catch -->
  <rect x="${bodyX}" y="${bodyTop}" width="${bodyW}" height="70" rx="${shoulderR}" fill="url(#shoulderGlow)"/>
  <!-- long left specular -->
  <rect x="${bodyX + 26}" y="${bodyTop + 22}" width="18" height="${bodyBot - bodyTop - 52}" rx="9" fill="url(#spec)" opacity=".8" filter="blur(2px)"/>
  <rect x="${bodyX + 52}" y="${bodyTop + 30}" width="30" height="${bodyBot - bodyTop - 70}" rx="15" fill="rgba(255,250,240,.14)" filter="blur(8px)"/>
  <!-- right rim counter-light -->
  <rect x="${bodyX + bodyW - 34}" y="${bodyTop + 26}" width="12" height="${bodyBot - bodyTop - 60}" rx="6" fill="url(#spec)" opacity=".4" filter="blur(2.5px)"/>
  <!-- thick glass base -->
  <rect x="${bodyX}" y="${bodyBot - 46}" width="${bodyW}" height="46" rx="20" fill="rgba(10,5,2,.38)" filter="blur(2px)"/>
  <rect x="${bodyX + 8}" y="${bodyBot - 10}" width="${bodyW - 16}" height="5" rx="2.5" fill="rgba(255,248,235,.4)" filter="blur(1.5px)"/>

  <!-- label: cream, collection dot, sheet layout -->
  <g>
    <rect x="212" y="470" width="176" height="230" rx="3" fill="#F1E8D4"/>
    <rect x="212" y="470" width="176" height="230" rx="3" fill="none" stroke="rgba(60,40,24,.18)" stroke-width="1"/>
    <text x="300" y="508" text-anchor="middle" font-family="Arial" font-size="14" letter-spacing="4.4" fill="#2E2118">MEMÓRIA</text>
    <text x="300" y="576" text-anchor="middle" font-family="Georgia" font-size="44" fill="#241A10">N&#186; 0${s.n}</text>
    <text x="300" y="608" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" letter-spacing="2.4" fill="#4A3524">${s.name}</text>
    <text x="300" y="632" text-anchor="middle" font-family="Arial" font-size="9" letter-spacing="1.8" fill="#7A6A52">EAU DE PARFUM</text>
    <circle cx="300" cy="654" r="5" fill="${c.dot}"/>
    <text x="300" y="682" text-anchor="middle" font-family="Arial" font-size="8.5" letter-spacing="1.4" fill="#8A7A62">100 ML &#183; 3.4 FL.OZ</text>
  </g>
</svg>`;
}

for (const s of SCENTS) {
  const svg = Buffer.from(bottleSVG(s));
  for (const w of [720, 360]) {
    const base = sharp(svg, { density: (72 * w) / 600 }).resize(w);
    await base.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/no${s.n}-${w}.png`);
    await base.clone().webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/no${s.n}-${w}.webp`);
  }
  console.log(`rendered Nº 0${s.n} ${s.slug} (${s.col})`);
}
console.log('done → public/renders');
