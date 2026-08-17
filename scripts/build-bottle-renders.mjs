/**
 * MEMÓRIA · Photoreal bottle renders — six scents, one flacon family.
 * Layered-gradient glass simulation designed for LIGHT grounds, rendered
 * to transparent PNG/WebP via sharp. No flat illustration: glass walls,
 * liquid depth, speculars, rim lights, brass collar, printed label,
 * baked contact shadow.
 *
 * Usage: node scripts/build-bottle-renders.mjs
 * Output: public/renders/no{1..6}-{720,360}.png|webp
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/renders';
await mkdir(OUT, { recursive: true });

/* Per-scent juice + hardware. Same flacon, different liquid/label/cap —
   how a real house differentiates a collection. */
const SCENTS = [
  { n: 1, slug: 'jasmine-dusk',   name: 'JASMINE DUSK',   liquid: ['#F4D890', '#E0A94A', '#96601C'], cap: 'her' },
  { n: 2, slug: 'rose-vellum',    name: 'ROSE VELLUM',    liquid: ['#F0C4A4', '#CE8358', '#8A4424'], cap: 'her' },
  { n: 3, slug: 'sunday-linen',   name: 'SUNDAY LINEN',   liquid: ['#F4E6B8', '#DCBE72', '#9A7830'], cap: 'her' },
  { n: 4, slug: 'nile-cedar',     name: 'NILE CEDAR',     liquid: ['#ECB55C', '#C67F2E', '#744312'], cap: 'him' },
  { n: 5, slug: 'oud-memoir',     name: 'OUD MEMOIR',     liquid: ['#D08C34', '#9A5C1C', '#4A250A'], cap: 'him' },
  { n: 6, slug: 'vetiver-arcade', name: 'VETIVER ARCADE', liquid: ['#DECC80', '#AC9846', '#615616'], cap: 'him' },
];

const CAPS = {
  her: { g: ['#8A6A38', '#C9A868', '#7A5C30', '#A88750', '#5E4522'], spec: 'rgba(255,244,220,.75)' }, // brushed brass
  him: { g: ['#241710', '#4A3322', '#1C110A', '#38251A', '#120A06'], spec: 'rgba(240,220,195,.5)' }, // dark lacquer
};

function bottleSVG(s) {
  const [liqTop, liqMid, liqDeep] = s.liquid;
  const cap = CAPS[s.cap];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="920" viewBox="0 0 600 920">
  <defs>
    <linearGradient id="glassWall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="rgba(66,40,20,.55)"/>
      <stop offset=".05"  stop-color="rgba(210,180,140,.34)"/>
      <stop offset=".11"  stop-color="rgba(80,50,26,.34)"/>
      <stop offset=".5"   stop-color="rgba(235,220,195,.16)"/>
      <stop offset=".9"   stop-color="rgba(76,48,24,.32)"/>
      <stop offset=".955" stop-color="rgba(225,200,165,.4)"/>
      <stop offset="1"    stop-color="rgba(58,35,18,.6)"/>
    </linearGradient>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${liqTop}"/>
      <stop offset=".42" stop-color="${liqMid}"/>
      <stop offset="1" stop-color="${liqDeep}"/>
    </linearGradient>
    <linearGradient id="liquidSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(40,20,8,.4)"/>
      <stop offset=".14" stop-color="rgba(40,20,8,0)"/>
      <stop offset=".86" stop-color="rgba(40,20,8,0)"/>
      <stop offset="1" stop-color="rgba(40,20,8,.4)"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(255,252,244,0)"/>
      <stop offset=".18" stop-color="rgba(255,252,244,.95)"/>
      <stop offset=".62" stop-color="rgba(255,252,244,.4)"/>
      <stop offset="1" stop-color="rgba(255,252,244,0)"/>
    </linearGradient>
    <linearGradient id="capg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${cap.g[0]}"/><stop offset=".2" stop-color="${cap.g[1]}"/>
      <stop offset=".45" stop-color="${cap.g[2]}"/><stop offset=".7" stop-color="${cap.g[3]}"/>
      <stop offset="1" stop-color="${cap.g[4]}"/>
    </linearGradient>
    <linearGradient id="collar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6E5226"/><stop offset=".25" stop-color="#D9BC7E"/>
      <stop offset=".5" stop-color="#8A6A38"/><stop offset=".75" stop-color="#C4A462"/>
      <stop offset="1" stop-color="#5E4522"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".45" r=".6">
      <stop offset="0" stop-color="rgba(255,236,190,.55)"/><stop offset="1" stop-color="rgba(255,236,190,0)"/>
    </radialGradient>
  </defs>

  <!-- contact shadow -->
  <ellipse cx="300" cy="862" rx="196" ry="24" fill="rgba(30,16,6,.28)" filter="blur(14px)"/>
  <ellipse cx="300" cy="858" rx="150" ry="14" fill="rgba(30,16,6,.22)" filter="blur(8px)"/>

  <!-- cap -->
  <rect x="252" y="118" width="96" height="128" rx="9" fill="url(#capg)"/>
  <rect x="252" y="118" width="96" height="10" rx="5" fill="${cap.spec}" opacity=".7" filter="blur(1.5px)"/>
  <rect x="270" y="126" width="11" height="112" rx="5" fill="${cap.spec}" filter="blur(2.5px)"/>
  <rect x="322" y="130" width="5" height="104" rx="2.5" fill="${cap.spec}" opacity=".45" filter="blur(2px)"/>

  <!-- brass collar -->
  <rect x="256" y="246" width="88" height="20" rx="4" fill="url(#collar)"/>
  <rect x="256" y="248" width="88" height="4" fill="rgba(255,248,230,.55)" filter="blur(1px)"/>

  <!-- neck -->
  <rect x="262" y="266" width="76" height="48" fill="url(#glassWall)"/>
  <rect x="265" y="270" width="5" height="40" fill="url(#rim)" opacity=".9"/>
  <rect x="331" y="270" width="4" height="40" fill="url(#rim)" opacity=".5"/>

  <!-- body glass -->
  <rect x="170" y="310" width="260" height="534" rx="20" fill="rgba(244,236,220,.30)"/>
  <rect x="170" y="310" width="260" height="534" rx="20" fill="url(#glassWall)"/>

  <!-- liquid -->
  <rect x="185" y="386" width="230" height="444" rx="12" fill="url(#liquid)"/>
  <rect x="185" y="386" width="230" height="444" rx="12" fill="url(#liquidSide)"/>
  <ellipse cx="300" cy="560" rx="118" ry="170" fill="url(#glow)"/>
  <ellipse cx="300" cy="388" rx="113" ry="8" fill="rgba(255,244,214,.85)" filter="blur(2.5px)"/>
  <!-- headspace shading above liquid -->
  <rect x="176" y="316" width="248" height="66" rx="14" fill="rgba(250,244,230,.18)"/>

  <!-- printed label -->
  <g>
    <rect x="212" y="556" width="176" height="180" fill="#F2E8D4" stroke="#4A2E18" stroke-width="3"/>
    <rect x="219" y="563" width="162" height="166" fill="none" stroke="#4A2E18" stroke-width="1"/>
    <text x="300" y="596" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" letter-spacing="4.5" fill="#3E281B">MEMÓRIA</text>
    <line x1="240" y1="610" x2="360" y2="610" stroke="#4A2E18" stroke-width="1"/>
    <text x="300" y="662" text-anchor="middle" font-family="Georgia" font-size="46" font-style="italic" fill="#3E281B">N&#186; 0${s.n}</text>
    <text x="300" y="690" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" letter-spacing="2.6" fill="#5A3522">${s.name}</text>
    <text x="300" y="714" text-anchor="middle" font-family="Arial" font-size="9" letter-spacing="2" fill="#7B6A50">EAU DE PARFUM &#183; 100 ML</text>
  </g>

  <!-- speculars & rims -->
  <rect x="176" y="322" width="8" height="508" rx="4" fill="url(#rim)"/>
  <rect x="417" y="322" width="6" height="508" rx="3" fill="url(#rim)" opacity=".55"/>
  <rect x="212" y="330" width="30" height="496" rx="15" fill="rgba(255,250,240,.34)" filter="blur(9px)"/>
  <rect x="200" y="336" width="8" height="480" rx="4" fill="rgba(255,252,246,.5)" filter="blur(2px)"/>
  <g filter="blur(5px)" opacity=".7">
    <rect x="352" y="352" width="42" height="150" rx="20" fill="rgba(250,246,238,.30)" transform="rotate(3 373 427)"/>
    <rect x="358" y="520" width="26" height="60" rx="13" fill="rgba(250,246,238,.20)" transform="rotate(3 371 550)"/>
  </g>
  <!-- top edge catch -->
  <rect x="176" y="312" width="248" height="9" rx="4.5" fill="rgba(255,250,238,.6)" filter="blur(1.5px)"/>
  <!-- base thickness -->
  <rect x="176" y="806" width="248" height="34" rx="12" fill="rgba(60,34,16,.30)" filter="blur(3px)"/>
  <rect x="176" y="836" width="248" height="6" rx="3" fill="rgba(255,248,235,.4)" filter="blur(1.5px)"/>
</svg>`;
}

for (const s of SCENTS) {
  const svg = Buffer.from(bottleSVG(s));
  for (const w of [720, 360]) {
    const base = sharp(svg, { density: (72 * w) / 600 }).resize(w);
    await base.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/no${s.n}-${w}.png`);
    await base.clone().webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/no${s.n}-${w}.webp`);
  }
  console.log(`rendered Nº 0${s.n} ${s.slug}`);
}
console.log('done → public/renders');
