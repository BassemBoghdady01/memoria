/**
 * MEMÓRIA · Memory objects — a small photographic prop vocabulary.
 *
 * Four objects, one per memory type, rendered like photographed paper
 * and plastic (light, shadow, print, grain — no line-art):
 *   ticket   = place memory    (hero)
 *   envelope = person memory   (hotline)
 *   cassette = sound memory    (archive)
 *   blotter  = scent memory    (product memory plate)
 *
 * Usage: node scripts/build-memory-objects.mjs
 * Output: public/objects/{name}.png|webp (transparent, baked shadow)
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/objects';
await mkdir(OUT, { recursive: true });

const GRAIN = `
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.12 0 0 0 0.06 0"/>
    <feComposite operator="over" in2="SourceGraphic"/>
  </filter>`;

/* ——— ticket — admit one, golden hour ——— */
const ticket = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="400" viewBox="0 0 920 400">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2E6C6"/>
      <stop offset=".5" stop-color="#EBDCB8"/>
      <stop offset="1" stop-color="#DFCCA2"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(120,84,48,.22)"/>
      <stop offset=".06" stop-color="rgba(120,84,48,0)"/>
      <stop offset=".94" stop-color="rgba(120,84,48,0)"/>
      <stop offset="1" stop-color="rgba(120,84,48,.25)"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <!-- shadow -->
  <rect x="34" y="66" width="852" height="290" rx="10" fill="rgba(40,22,10,.30)" filter="blur(13px)"/>
  <!-- paper -->
  <g>
    <rect x="20" y="40" width="860" height="300" rx="8" fill="url(#paper)"/>
    <rect x="20" y="40" width="860" height="300" rx="8" fill="url(#edge)"/>
    <!-- perforation between stub and body -->
    <line x1="660" y1="48" x2="660" y2="332" stroke="#B9A67E" stroke-width="2.5" stroke-dasharray="2 11" stroke-linecap="round"/>
    <!-- printed frame -->
    <rect x="44" y="64" width="588" height="252" fill="none" stroke="#5A3522" stroke-width="3"/>
    <rect x="52" y="72" width="572" height="236" fill="none" stroke="#5A3522" stroke-width="1"/>
    <!-- body print -->
    <text x="338" y="136" text-anchor="middle" font-family="Georgia" font-size="30" letter-spacing="14" fill="#3E281B">MEMÓRIA</text>
    <line x1="120" y1="160" x2="556" y2="160" stroke="#5A3522" stroke-width="1"/>
    <text x="338" y="208" text-anchor="middle" font-family="Georgia" font-size="40" font-style="italic" fill="#8A4A2E">Admit One</text>
    <text x="338" y="250" text-anchor="middle" font-family="Arial" font-size="16" letter-spacing="6" fill="#6E5238">GOLDEN HOUR · CAIRO</text>
    <text x="338" y="288" text-anchor="middle" font-family="Arial" font-size="12" letter-spacing="4" fill="#8A7452">KEEP THIS PORTION</text>
    <!-- stub -->
    <g transform="rotate(90 770 190)">
      <text x="770" y="150" text-anchor="middle" font-family="Georgia" font-size="26" letter-spacing="6" fill="#3E281B">Nº 000106</text>
    </g>
    <text x="770" y="120" text-anchor="middle" font-family="Arial" font-size="13" letter-spacing="4" fill="#8A4A2E">ADMIT</text>
    <text x="770" y="286" text-anchor="middle" font-family="Arial" font-size="13" letter-spacing="4" fill="#8A4A2E">ONE</text>
    <!-- soft sheen -->
    <rect x="20" y="40" width="860" height="90" rx="8" fill="rgba(255,250,238,.28)"/>
  </g>
  <rect x="20" y="40" width="860" height="300" rx="8" filter="url(#grain)" opacity=".5" fill="#EBDCB8"/>
</svg>`;

/* ——— airmail envelope — to whoever still remembers ——— */
function airmailDashes() {
  /* alternating terracotta / teal border marks */
  const marks = [];
  const c = ['#B66A4B', '#2F6670'];
  for (let x = 40; x < 820; x += 44) {
    marks.push(`<rect x="${x}" y="52" width="26" height="12" fill="${c[(x / 44) % 2 < 1 ? 0 : 1]}" transform="skewX(-18)"/>`);
    marks.push(`<rect x="${x + 8}" y="486" width="26" height="12" fill="${c[(x / 44) % 2 < 1 ? 1 : 0]}" transform="skewX(-18)"/>`);
  }
  for (let y = 76; y < 470; y += 44) {
    marks.push(`<rect x="46" y="${y}" width="12" height="26" fill="${c[(y / 44) % 2 < 1 ? 1 : 0]}"/>`);
    marks.push(`<rect x="836" y="${y}" width="12" height="26" fill="${c[(y / 44) % 2 < 1 ? 0 : 1]}"/>`);
  }
  return marks.join('');
}
const envelope = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="580" viewBox="0 0 900 580">
  <defs>
    <linearGradient id="epaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4EBD4"/>
      <stop offset=".55" stop-color="#EFE3C6"/>
      <stop offset="1" stop-color="#E2D2AE"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <rect x="48" y="72" width="812" height="452" rx="6" fill="rgba(40,22,10,.28)" filter="blur(14px)"/>
  <g>
    <rect x="32" y="44" width="836" height="464" rx="4" fill="url(#epaper)"/>
    <!-- flap fold shading (soft, photographic) -->
    <path d="M32 44 L450 268 L868 44 Z" fill="rgba(120,88,50,.10)"/>
    <path d="M32 44 L450 268 L868 44" fill="none" stroke="rgba(90,53,34,.22)" stroke-width="2"/>
    ${airmailDashes()}
    <!-- address -->
    <text x="270" y="330" font-family="Georgia" font-size="34" font-style="italic" fill="#4A3020">To: whoever still remembers,</text>
    <line x1="270" y1="376" x2="700" y2="376" stroke="rgba(90,53,34,.4)" stroke-width="1.5"/>
    <line x1="270" y1="424" x2="640" y2="424" stroke="rgba(90,53,34,.4)" stroke-width="1.5"/>
    <text x="96" y="472" font-family="Arial" font-size="15" letter-spacing="6" fill="#8A4A2E">PAR AVION · THE MEMORY DEPARTMENT, CAIRO</text>
    <rect x="32" y="44" width="836" height="120" rx="4" fill="rgba(255,250,238,.25)"/>
  </g>
  <rect x="32" y="44" width="836" height="464" rx="4" filter="url(#grain)" opacity=".45" fill="#EFE3C6"/>
</svg>`;

/* ——— cassette — the radio from the next room, taped ——— */
const cassette = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="580" viewBox="0 0 860 580">
  <defs>
    <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E2620"/>
      <stop offset=".12" stop-color="#241C16"/>
      <stop offset=".9" stop-color="#17110C"/>
      <stop offset="1" stop-color="#0E0A06"/>
    </linearGradient>
    <linearGradient id="clabel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2E7CC"/>
      <stop offset="1" stop-color="#E4D4AE"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <rect x="60" y="100" width="744" height="428" rx="20" fill="rgba(40,22,10,.32)" filter="blur(15px)"/>
  <g>
    <rect x="44" y="72" width="772" height="452" rx="18" fill="url(#shell)"/>
    <rect x="44" y="72" width="772" height="20" rx="10" fill="rgba(255,244,225,.14)"/>
    <!-- label -->
    <rect x="86" y="108" width="688" height="272" rx="8" fill="url(#clabel)"/>
    <text x="430" y="152" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" letter-spacing="9" fill="#3E281B">MEMÓRIA · SIDE A</text>
    <text x="430" y="190" text-anchor="middle" font-family="Georgia" font-size="24" font-style="italic" fill="#8A4A2E">the radio, one evening — cairo</text>
    <line x1="130" y1="212" x2="730" y2="212" stroke="rgba(90,53,34,.35)" stroke-width="1.5"/>
    <!-- reel window -->
    <rect x="240" y="232" width="380" height="118" rx="59" fill="#12100C"/>
    <rect x="246" y="238" width="368" height="106" rx="53" fill="rgba(244,236,218,.06)"/>
    <circle cx="316" cy="291" r="44" fill="#241E18"/>
    <circle cx="316" cy="291" r="30" fill="#EFE5CC"/>
    <g fill="#241E18">
      ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="313" y="266" width="6" height="12" rx="2" transform="rotate(${a} 316 291)"/>`).join('')}
    </g>
    <circle cx="544" cy="291" r="44" fill="#241E18"/>
    <circle cx="544" cy="291" r="30" fill="#EFE5CC"/>
    <g fill="#241E18">
      ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="541" y="266" width="6" height="12" rx="2" transform="rotate(${a} 544 291)"/>`).join('')}
    </g>
    <!-- tape between reels -->
    <rect x="352" y="282" width="156" height="18" fill="#1A1410"/>
    <!-- screws -->
    <circle cx="70" cy="98" r="7" fill="#3A3028"/><circle cx="790" cy="98" r="7" fill="#3A3028"/>
    <circle cx="70" cy="498" r="7" fill="#3A3028"/><circle cx="790" cy="498" r="7" fill="#3A3028"/>
    <!-- base trapezoid detail -->
    <path d="M300 524 L322 458 L538 458 L560 524 Z" fill="rgba(255,244,225,.08)"/>
    <!-- sheen -->
    <rect x="44" y="72" width="240" height="452" rx="18" fill="rgba(255,248,235,.05)"/>
  </g>
  <rect x="44" y="72" width="772" height="452" rx="18" filter="url(#grain)" opacity=".4" fill="#241C16"/>
</svg>`;

/* ——— perfume blotter — dipped at 6:40 PM ——— */
const blotter = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="820" viewBox="0 0 300 820">
  <defs>
    <linearGradient id="bpaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F6EDD6"/>
      <stop offset=".72" stop-color="#F0E4C4"/>
      <stop offset=".88" stop-color="#E2C79A"/>
      <stop offset="1" stop-color="#CBA05E"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <path d="M120 76 L196 82 L178 782 L134 780 Z" fill="rgba(40,22,10,.28)" filter="blur(10px)"/>
  <g>
    <path d="M104 52 L196 58 L182 768 L118 764 Z" fill="url(#bpaper)"/>
    <text x="0" y="0" font-family="Arial" font-size="17" letter-spacing="7" fill="#5A3522"
          transform="translate(160 120) rotate(89)">MEMÓRIA · EAU DE PARFUM</text>
    <path d="M104 52 L196 58 L193 130 L101 124 Z" fill="rgba(255,250,240,.35)"/>
  </g>
  <path d="M104 52 L196 58 L182 768 L118 764 Z" filter="url(#grain)" opacity=".4" fill="#F0E4C4"/>
</svg>`;

/* ——— torn typewriter paper (blank — text set in HTML for crispness) ——— */
const tornEdgeTop = 'M28 46 L84 34 L140 44 L206 30 L268 42 L334 32 L398 44 L462 30 L524 40 L590 32 L652 44 L718 34 L772 46';
const tornEdgeBot = 'L768 512 L706 524 L644 512 L578 526 L512 514 L448 526 L382 512 L318 524 L252 514 L188 526 L124 512 L62 524 L32 510';
const tornnote = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="tpaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F3EBD6"/>
      <stop offset=".6" stop-color="#EDE2C6"/>
      <stop offset="1" stop-color="#E0D0AA"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <path d="${tornEdgeTop} ${tornEdgeBot} Z" transform="translate(14 22)" fill="rgba(40,22,10,.28)" filter="blur(12px)"/>
  <g>
    <path d="${tornEdgeTop} ${tornEdgeBot} Z" fill="url(#tpaper)"/>
    <path d="${tornEdgeTop}" fill="none" stroke="rgba(255,252,242,.6)" stroke-width="2"/>
    <path d="M32 510 ${tornEdgeBot.replace('L768 512', 'M768 512')}" fill="none" stroke="rgba(120,84,48,.25)" stroke-width="2"/>
  </g>
  <path d="${tornEdgeTop} ${tornEdgeBot} Z" filter="url(#grain)" opacity=".5" fill="#EDE2C6"/>
</svg>`;

/* ——— ring-notebook page, torn out (blank) ——— */
const ringpage = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="600" viewBox="0 0 760 600">
  <defs>
    <linearGradient id="rpaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F5EEDC"/>
      <stop offset="1" stop-color="#E7DABA"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <path d="M60 60 L96 46 L134 60 L172 44 L210 58 L248 46 L286 60 L324 46 L362 58 L400 46 L438 60 L476 46 L514 58 L552 46 L590 60 L628 46 L666 58 L700 48 L712 54 L716 552 L64 556 Z"
        transform="translate(12 20)" fill="rgba(40,22,10,.28)" filter="blur(12px)"/>
  <g>
    <path d="M60 60 L96 46 L134 60 L172 44 L210 58 L248 46 L286 60 L324 46 L362 58 L400 46 L438 60 L476 46 L514 58 L552 46 L590 60 L628 46 L666 58 L700 48 L712 54 L716 552 L64 556 Z" fill="url(#rpaper)"/>
    ${[110, 190, 270, 350, 430, 510].map((y) => `<circle cx="92" cy="${y}" r="13" fill="rgba(70,48,28,.16)"/><circle cx="90" cy="${y - 2}" r="12" fill="#DCCBA4"/>`).join('')}
    ${[170, 240, 310, 380, 450].map((y) => `<line x1="140" y1="${y}" x2="680" y2="${y}" stroke="rgba(110,80,50,.16)" stroke-width="2"/>`).join('')}
    <line x1="126" y1="70" x2="126" y2="540" stroke="rgba(182,106,75,.35)" stroke-width="2.5"/>
  </g>
  <path d="M60 60 L716 54 L716 552 L64 556 Z" filter="url(#grain)" opacity=".45" fill="#EDE2C6"/>
</svg>`;

/* ——— vintage radio — a song you haven't heard in twenty years ——— */
const radio = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="760" viewBox="0 0 1100 760">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5A3A22"/>
      <stop offset=".08" stop-color="#7A5230"/>
      <stop offset=".5" stop-color="#4A2C18"/>
      <stop offset=".92" stop-color="#331C0E"/>
      <stop offset="1" stop-color="#241206"/>
    </linearGradient>
    <linearGradient id="woodside" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(20,10,4,.7)"/>
      <stop offset=".05" stop-color="rgba(150,100,55,.35)"/>
      <stop offset=".12" stop-color="rgba(20,10,4,0)"/>
      <stop offset=".88" stop-color="rgba(20,10,4,0)"/>
      <stop offset=".95" stop-color="rgba(150,100,55,.3)"/>
      <stop offset="1" stop-color="rgba(20,10,4,.75)"/>
    </linearGradient>
    <linearGradient id="grille" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C9AE7E"/>
      <stop offset="1" stop-color="#9A7E52"/>
    </linearGradient>
    <radialGradient id="dialface" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#F0E2BE"/>
      <stop offset=".8" stop-color="#D9C494"/>
      <stop offset="1" stop-color="#A8895C"/>
    </radialGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8A6A38"/>
      <stop offset=".4" stop-color="#D9BC7E"/>
      <stop offset=".7" stop-color="#8A6A38"/>
      <stop offset="1" stop-color="#5E4522"/>
    </linearGradient>
    <pattern id="mesh" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#8A7048"/>
      <circle cx="4.5" cy="4.5" r="3" fill="#6E5836"/>
      <circle cx="4.5" cy="4.5" r="1.4" fill="#4A3A20"/>
    </pattern>
    ${GRAIN}
  </defs>
  <!-- shadow -->
  <ellipse cx="550" cy="712" rx="470" ry="34" fill="rgba(24,12,4,.4)" filter="blur(18px)"/>
  <g>
    <!-- cabinet -->
    <rect x="70" y="70" width="960" height="620" rx="42" fill="url(#wood)"/>
    <rect x="70" y="70" width="960" height="620" rx="42" fill="url(#woodside)"/>
    <rect x="82" y="80" width="936" height="16" rx="8" fill="rgba(255,232,190,.22)" filter="blur(3px)"/>
    <!-- brass trim -->
    <rect x="108" y="112" width="884" height="540" rx="30" fill="none" stroke="url(#brass)" stroke-width="5"/>
    <!-- speaker grille -->
    <rect x="140" y="146" width="560" height="360" rx="24" fill="url(#grille)"/>
    <rect x="140" y="146" width="560" height="360" rx="24" fill="url(#mesh)" opacity=".85"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${172 + i * 132}" y="146" width="10" height="360" rx="5" fill="url(#brass)"/>`).join('')}
    <rect x="140" y="146" width="560" height="120" rx="24" fill="rgba(255,240,210,.10)"/>
    <!-- dial -->
    <circle cx="856" cy="300" r="118" fill="#241406"/>
    <circle cx="856" cy="300" r="106" fill="url(#dialface)"/>
    ${Array.from({ length: 24 }, (_, i) => `<rect x="854" y="204" width="4" height="16" rx="2" fill="#5A3A1C" transform="rotate(${i * 15} 856 300)"/>`).join('')}
    <circle cx="856" cy="300" r="10" fill="#3A2410"/>
    <rect x="852" y="216" width="8" height="88" rx="4" fill="#A83A22" transform="rotate(42 856 300)"/>
    <circle cx="856" cy="300" r="106" fill="none" stroke="url(#brass)" stroke-width="6"/>
    <!-- tuning window -->
    <rect x="140" y="540" width="560" height="70" rx="12" fill="#1E1206"/>
    <rect x="150" y="548" width="540" height="54" rx="8" fill="rgba(240,220,175,.16)"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${182 + i * 62}" y="556" width="3" height="38" fill="rgba(240,220,175,.5)"/>`).join('')}
    <rect x="366" y="552" width="5" height="46" fill="#C93A1E"/>
    <!-- knobs -->
    <circle cx="782" cy="574" r="34" fill="url(#brass)"/>
    <circle cx="782" cy="574" r="24" fill="#3A2410"/>
    <circle cx="932" cy="574" r="34" fill="url(#brass)"/>
    <circle cx="932" cy="574" r="24" fill="#3A2410"/>
    <!-- feet -->
    <rect x="140" y="690" width="70" height="22" rx="8" fill="#241206"/>
    <rect x="890" y="690" width="70" height="22" rx="8" fill="#241206"/>
  </g>
  <rect x="70" y="70" width="960" height="620" rx="42" filter="url(#grain)" opacity=".45" fill="#4A2C18"/>
</svg>`;

/* ——— brass key tag — ROOM 206, a place you used to enter ——— */
const keytag = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
  <defs>
    <linearGradient id="tagbrass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6E5226"/>
      <stop offset=".35" stop-color="#C9AE6E"/>
      <stop offset=".6" stop-color="#8A6A38"/>
      <stop offset="1" stop-color="#4A3418"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <ellipse cx="184" cy="600" rx="120" ry="18" fill="rgba(30,16,6,.32)" filter="blur(10px)"/>
  <g>
    <!-- ring -->
    <circle cx="180" cy="86" r="52" fill="none" stroke="url(#tagbrass)" stroke-width="14"/>
    <!-- oval tag -->
    <ellipse cx="180" cy="380" rx="140" ry="210" fill="url(#tagbrass)"/>
    <ellipse cx="180" cy="380" rx="122" ry="192" fill="none" stroke="rgba(60,40,14,.5)" stroke-width="3"/>
    <circle cx="180" cy="216" r="16" fill="#241606"/>
    <text x="180" y="352" text-anchor="middle" font-family="Georgia" font-size="40" letter-spacing="6" fill="#3A2810">ROOM</text>
    <text x="180" y="446" text-anchor="middle" font-family="Georgia" font-size="76" letter-spacing="4" fill="#2E1E0A">206</text>
    <text x="180" y="510" text-anchor="middle" font-family="Arial" font-size="15" letter-spacing="4" fill="rgba(58,40,16,.75)">CAIRO</text>
    <ellipse cx="128" cy="270" rx="34" ry="80" fill="rgba(255,244,215,.28)" filter="blur(10px)" transform="rotate(-18 128 270)"/>
  </g>
  <ellipse cx="180" cy="380" rx="140" ry="210" filter="url(#grain)" opacity=".4" fill="#8A6A38"/>
</svg>`;

/* ——— photograph, face down — one handwritten line on the back (text set in HTML) ——— */
const photoback = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="560" viewBox="0 0 720 560">
  <defs>
    <linearGradient id="pback" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2ECDC"/>
      <stop offset=".6" stop-color="#EAE0C6"/>
      <stop offset="1" stop-color="#D9C9A4"/>
    </linearGradient>
    ${GRAIN}
  </defs>
  <rect x="52" y="60" width="632" height="464" rx="4" fill="rgba(40,22,10,.30)" filter="blur(13px)"/>
  <g>
    <rect x="36" y="36" width="648" height="480" rx="3" fill="url(#pback)"/>
    <!-- foxing / age spots -->
    <circle cx="120" cy="120" r="26" fill="rgba(150,110,60,.10)" filter="blur(6px)"/>
    <circle cx="600" cy="420" r="40" fill="rgba(150,110,60,.12)" filter="blur(9px)"/>
    <circle cx="520" cy="100" r="18" fill="rgba(150,110,60,.09)" filter="blur(5px)"/>
    <rect x="36" y="36" width="648" height="70" fill="rgba(255,250,240,.3)"/>
    <!-- faint photo-paper stamp -->
    <text x="600" y="500" text-anchor="end" font-family="Arial" font-size="14" letter-spacing="3" fill="rgba(120,90,50,.35)">KODAK · PAPER</text>
  </g>
  <rect x="36" y="36" width="648" height="480" rx="3" filter="url(#grain)" opacity=".4" fill="#EAE0C6"/>
</svg>`;

/* ——— hero backdrop — plaster wall, warm light, wooden table ——— */
const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <filter id="plaster">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="4" seed="7" result="n"/>
      <feDiffuseLighting in="n" lighting-color="#F2E0BC" surfaceScale="1.6" diffuseConstant="1.05" result="l">
        <feDistantLight azimuth="235" elevation="58"/>
      </feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
    </filter>
    <filter id="woodgrain">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="12" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.32 0 0 0 0 0.19 0 0 0 0 0.08 0 0 0 0.55 0" result="g"/>
      <feComposite in="g" in2="SourceGraphic" operator="over"/>
    </filter>
    <linearGradient id="wallwash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(120,70,30,.35)"/>
      <stop offset=".35" stop-color="rgba(224,178,112,.12)"/>
      <stop offset=".62" stop-color="rgba(244,206,138,.42)"/>
      <stop offset="1" stop-color="rgba(160,100,45,.4)"/>
    </linearGradient>
    <linearGradient id="tablewood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8A5A2E"/>
      <stop offset=".06" stop-color="#A87840"/>
      <stop offset=".5" stop-color="#6E4220"/>
      <stop offset="1" stop-color="#3E2410"/>
    </linearGradient>
  </defs>
  <!-- wall -->
  <rect width="1600" height="760" fill="#E2C89A"/>
  <rect width="1600" height="760" fill="#E2C89A" filter="url(#plaster)" opacity=".55"/>
  <rect width="1600" height="760" fill="url(#wallwash)"/>
  <!-- warm beam from upper right -->
  <path d="M1600 0 L900 0 L340 760 L1600 760 Z" fill="rgba(250,214,150,.30)" filter="blur(60px)"/>
  <!-- leaf-dapple shadows, soft -->
  <g fill="rgba(74,44,20,.32)" filter="blur(26px)">
    <ellipse cx="300" cy="130" rx="150" ry="46" transform="rotate(-32 300 130)"/>
    <ellipse cx="470" cy="90" rx="120" ry="34" transform="rotate(-18 470 90)"/>
    <ellipse cx="180" cy="270" rx="180" ry="40" transform="rotate(-40 180 270)"/>
    <ellipse cx="420" cy="330" rx="90" ry="26" transform="rotate(-24 420 330)"/>
    <ellipse cx="1380" cy="600" rx="200" ry="60" transform="rotate(-30 1380 600)"/>
  </g>
  <!-- curtain-bar shadows falling across wall -->
  <g fill="rgba(74,44,20,.16)" filter="blur(18px)">
    <rect x="1020" y="0" width="70" height="760" transform="skewX(-9)"/>
    <rect x="1220" y="0" width="46" height="760" transform="skewX(-9)"/>
  </g>
  <!-- table -->
  <rect y="760" width="1600" height="240" fill="url(#tablewood)"/>
  <rect y="760" width="1600" height="240" fill="url(#tablewood)" filter="url(#woodgrain)" opacity=".5"/>
  <rect y="760" width="1600" height="10" fill="rgba(255,232,185,.5)" filter="blur(2px)"/>
  <rect y="772" width="1600" height="34" fill="rgba(255,220,160,.14)" filter="blur(8px)"/>
  <!-- vignette -->
  <rect width="1600" height="1000" fill="url(#wallwash)" opacity=".12"/>
</svg>`;

const OBJECTS = [
  { name: 'ticket', svg: ticket, w: 920 },
  { name: 'envelope', svg: envelope, w: 900 },
  { name: 'cassette', svg: cassette, w: 860 },
  { name: 'blotter', svg: blotter, w: 300 },
  { name: 'tornnote', svg: tornnote, w: 800 },
  { name: 'ringpage', svg: ringpage, w: 760 },
  { name: 'radio', svg: radio, w: 1100 },
  { name: 'keytag', svg: keytag, w: 360 },
  { name: 'photoback', svg: photoback, w: 720 },
  { name: 'backdrop', svg: backdrop, w: 1600 },
];

for (const o of OBJECTS) {
  const buf = Buffer.from(o.svg);
  await sharp(buf, { density: 144 }).resize(o.w).png({ compressionLevel: 9 }).toFile(`${OUT}/${o.name}.png`);
  await sharp(buf, { density: 144 }).resize(o.w).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/${o.name}.webp`);
  console.log('rendered', o.name);
}
console.log('done → public/objects');
