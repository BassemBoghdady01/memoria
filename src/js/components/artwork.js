/**
 * MEMÓRIA · Archival artwork library.
 *
 * No archival photography was supplied, so archive cards and "memory"
 * scenes use duotone line illustrations in the brand palette — evocative
 * paper artifacts rather than fake photographs. Each motif is a 200×150
 * SVG drawn in Archive Brown with one restrained accent.
 */

const BROWN = '#5a3522';
const COCOA = '#3e281b';
const DUST = '#7b786f';
const SAND = '#d8c3a3';
const TEAL = '#2f6670';
const TERRA = '#b66a4b';

const wash = (o = 0.28) => `<rect width="200" height="150" fill="${SAND}" opacity="${o}"/>`;
const sun = (x = 155, y = 34, r = 14, c = TERRA) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.55"/>`;
const g = (inner, sw = 1.6) =>
  `<g fill="none" stroke="${BROWN}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

const MOTIFS = {
  atelier: () =>
    wash() +
    sun(160, 30, 12) +
    g(`
      <path d="M30 130 L30 60 Q60 30 90 60 L90 130"/>
      <path d="M30 92 L90 92"/>
      <line x1="60" y1="45" x2="60" y2="92"/>
      <rect x="108" y="96" width="70" height="34"/>
      <path d="M120 96 L120 78 L132 78 L132 96 M126 78 L126 68 L128 66"/>
      <path d="M148 96 L148 84 Q148 76 156 76 Q164 76 164 84 L164 96"/>
      <line x1="20" y1="130" x2="185" y2="130"/>
    `),
  sketch: () =>
    wash(0.2) +
    g(`
      <path d="M38 118 L38 62 Q38 52 48 50 L62 50 Q72 52 72 62 L72 118 Z"/>
      <rect x="48" y="30" width="14" height="14"/>
      <path d="M96 118 L96 70 Q96 56 112 56 Q128 56 128 70 L128 118 Z" stroke-dasharray="4 3"/>
      <rect x="104" y="38" width="16" height="12" stroke-dasharray="3 2"/>
      <path d="M150 118 L150 66 L174 66 L174 118 Z" stroke-opacity="0.55"/>
      <line x1="26" y1="126" x2="182" y2="126" stroke-opacity="0.4"/>
      <path d="M142 40 L178 30" stroke-opacity="0.5"/>
      <path d="M142 47 L170 40" stroke-opacity="0.35"/>
    `) +
    `<text x="40" y="138" font-family="'Courier Prime',monospace" font-size="8" letter-spacing="2" fill="${DUST}">STUDY · FLACON</text>`,
  balcony: () =>
    wash() +
    sun(42, 30, 13) +
    g(`
      <line x1="18" y1="118" x2="182" y2="118"/>
      <line x1="30" y1="80" x2="30" y2="118"/><line x1="55" y1="80" x2="55" y2="118"/>
      <line x1="80" y1="80" x2="80" y2="118"/><line x1="105" y1="80" x2="105" y2="118"/>
      <line x1="130" y1="80" x2="130" y2="118"/><line x1="155" y1="80" x2="155" y2="118"/>
      <line x1="18" y1="80" x2="182" y2="80"/>
      <path d="M118 80 Q122 62 138 58 Q130 70 134 80"/>
      <path d="M138 58 Q150 52 160 56 Q150 60 146 66"/>
    `) +
    `<g fill="${BROWN}"><circle cx="140" cy="56" r="2.4"/><circle cx="150" cy="52" r="2"/><circle cx="132" cy="64" r="2"/></g>
     <g fill="#efe6d2" stroke="${BROWN}" stroke-width="1"><circle cx="146" cy="60" r="3"/><circle cx="136" cy="52" r="2.6"/></g>`,
  label: () =>
    wash(0.2) +
    `<rect x="45" y="30" width="110" height="90" fill="#efe6d2" stroke="${BROWN}" stroke-width="1.6"/>
     <rect x="52" y="37" width="96" height="76" fill="none" stroke="${BROWN}" stroke-opacity="0.5" stroke-width="0.8"/>
     <text x="100" y="60" text-anchor="middle" font-family="Jost,sans-serif" font-size="11" letter-spacing="4" fill="${COCOA}">MEMÓRIA</text>
     <line x1="76" y1="70" x2="124" y2="70" stroke="${BROWN}" stroke-width="0.8" stroke-opacity="0.6"/>
     <text x="100" y="92" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-style="italic" font-size="20" fill="${BROWN}">Nº —</text>
     <text x="100" y="106" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="6.4" letter-spacing="2" fill="${DUST}">EAU DE PARFUM</text>
     <circle cx="158" cy="112" r="13" fill="none" stroke="${TERRA}" stroke-width="1.4" opacity="0.8"/>
     <text x="158" y="115" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="6" fill="${TERRA}">PROOF</text>`,
  letter: () =>
    wash(0.22) +
    g(`
      <rect x="36" y="42" width="128" height="76"/>
      <path d="M36 42 L100 88 L164 42"/>
    `) +
    `<line x1="52" y1="104" x2="120" y2="104" stroke="${DUST}" stroke-width="1.2"/>
     <circle cx="146" cy="60" r="11" fill="none" stroke="${TERRA}" stroke-width="1.3" stroke-dasharray="2.5 2.5"/>
     <text x="52" y="36" font-family="Caveat,cursive" font-size="15" fill="${BROWN}">for you —</text>`,
  postcard: () =>
    wash(0.2) +
    `<rect x="28" y="34" width="144" height="86" fill="#efe6d2" stroke="${BROWN}" stroke-width="1.4"/>
     <line x1="100" y1="42" x2="100" y2="112" stroke="${BROWN}" stroke-opacity="0.4" stroke-width="1"/>
     <line x1="110" y1="66" x2="160" y2="66" stroke="${DUST}" stroke-width="1.1"/>
     <line x1="110" y1="78" x2="160" y2="78" stroke="${DUST}" stroke-width="1.1"/>
     <line x1="110" y1="90" x2="148" y2="90" stroke="${DUST}" stroke-width="1.1"/>
     <rect x="142" y="40" width="20" height="16" fill="none" stroke="${TERRA}" stroke-width="1.2"/>
     <circle cx="138" cy="52" r="10" fill="none" stroke="${DUST}" stroke-width="0.9" opacity="0.8"/>
     <text x="38" y="58" font-family="Caveat,cursive" font-size="14" fill="${BROWN}">from Cairo,</text>
     <text x="38" y="76" font-family="Caveat,cursive" font-size="14" fill="${BROWN}">with love</text>
     <text x="36" y="112" font-family="'Courier Prime',monospace" font-size="6.4" letter-spacing="1.6" fill="${DUST}">CARTE POSTALE</text>`,
  flask: () =>
    wash(0.22) +
    g(`
      <path d="M84 34 L84 62 L60 106 Q54 118 66 118 L104 118 Q116 118 110 106 L86 62 L86 34"/>
      <line x1="76" y1="30" x2="94" y2="30"/>
      <path d="M128 118 L128 70 Q128 58 140 58 Q152 58 152 70 L152 118 Z"/>
      <line x1="122" y1="118" x2="158" y2="118"/>
    `) +
    `<path d="M64 104 Q85 96 108 104 L104 112 Q85 118 68 112 Z" fill="${TERRA}" opacity="0.5"/>
     <path d="M130 96 Q140 92 150 96 L150 114 L130 114 Z" fill="${TEAL}" opacity="0.45"/>
     <text x="52" y="140" font-family="'Courier Prime',monospace" font-size="7" letter-spacing="2" fill="${DUST}">TRIAL Nº —</text>`,
  notes: () =>
    wash(0.2) +
    `<rect x="40" y="28" width="120" height="96" fill="#efe6d2" stroke="${BROWN}" stroke-width="1.4"/>
     <line x1="58" y1="28" x2="58" y2="124" stroke="${TERRA}" stroke-width="1" opacity="0.7"/>
     ${[46, 60, 74, 88, 102].map((y) => `<line x1="66" y1="${y}" x2="150" y2="${y}" stroke="${DUST}" stroke-width="1"/>`).join('')}
     <text x="66" y="42" font-family="Caveat,cursive" font-size="13" fill="${BROWN}">jasmine — more dusk, less sugar</text>
     <path d="M132 96 Q140 88 148 96 Q140 106 132 96" fill="none" stroke="${BROWN}" stroke-width="1.2"/>`,
  shelf: () =>
    wash(0.24) +
    g(`
      <line x1="24" y1="58" x2="176" y2="58"/>
      <line x1="24" y1="102" x2="176" y2="102"/>
      <path d="M36 58 L36 40 Q36 34 42 34 L50 34 Q56 34 56 40 L56 58"/>
      <rect x="66" y="36" width="16" height="22"/>
      <path d="M94 58 L94 44 Q94 36 103 36 Q112 36 112 44 L112 58"/>
      <rect x="124" y="40" width="13" height="18"/>
      <rect x="146" y="34" width="18" height="24"/>
      <rect x="40" y="80" width="15" height="22"/>
      <path d="M68 102 L68 86 Q68 78 77 78 Q86 78 86 86 L86 102"/>
      <rect x="98" y="82" width="17" height="20"/>
      <path d="M128 102 L128 84 L146 84 L146 102"/>
    `) +
    `<rect x="153" y="86" width="12" height="16" fill="${TEAL}" opacity="0.5"/>
     <text x="30" y="130" font-family="'Courier Prime',monospace" font-size="7" letter-spacing="2.4" fill="${DUST}">THE ARCHIVE ROOM</text>`,
  film: () =>
    wash(0.18) +
    `<rect x="24" y="30" width="152" height="90" fill="${COCOA}" opacity="0.9"/>
     ${[0, 1, 2].map((i) => `<rect x="${34 + i * 50}" y="44" width="40" height="30" fill="${SAND}" opacity="0.8"/><rect x="${34 + i * 50}" y="82" width="40" height="26" fill="${SAND}" opacity="0.55"/>`).join('')}
     ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => `<rect x="${28 + i * 11.6}" y="33" width="5" height="6" fill="${SAND}" opacity="0.6"/><rect x="${28 + i * 11.6}" y="111" width="5" height="6" fill="${SAND}" opacity="0.6"/>`).join('')}
     <path d="M44 66 Q54 52 64 66" stroke="${COCOA}" fill="none" stroke-width="1.6"/>
     <circle cx="104" cy="58" r="7" fill="none" stroke="${COCOA}" stroke-width="1.6"/>
     <path d="M138 70 L150 54 L162 70" stroke="${COCOA}" fill="none" stroke-width="1.6"/>`,
  collection: () =>
    wash(0.24) +
    g(`
      ${[0, 1, 2, 3, 4, 5]
        .map((i) => {
          const x = 30 + i * 25;
          const h = [34, 42, 30, 44, 36, 40][i];
          return `<path d="M${x} 116 L${x} ${116 - h} Q${x} ${112 - h} ${x + 4} ${112 - h} L${x + 12} ${112 - h} Q${x + 16} ${112 - h} ${x + 16} ${116 - h} L${x + 16} 116 Z"/><rect x="${x + 4}" y="${104 - h}" width="8" height="7"/>`;
        })
        .join('')}
      <line x1="22" y1="116" x2="178" y2="116"/>
    `) +
    `<text x="100" y="136" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="7" letter-spacing="2.4" fill="${DUST}">SIX SCENTS · KEPT</text>`,
  city: () =>
    wash() +
    sun(38, 36, 12) +
    g(`
      <line x1="16" y1="112" x2="184" y2="112"/>
      <path d="M28 112 L28 78 L52 78 L52 112"/>
      <path d="M62 112 L62 64 L84 64 L84 112 M68 64 L68 56 L78 56 L78 64"/>
      <path d="M96 112 L96 84 L118 84 L118 112"/>
      <path d="M128 112 L128 58 Q139 46 150 58 L150 112"/>
      <line x1="160" y1="112" x2="160" y2="70"/>
      <path d="M160 70 Q166 64 160 58"/>
      <line x1="34" y1="88" x2="46" y2="88"/><line x1="68" y1="76" x2="78" y2="76"/>
      <line x1="102" y1="94" x2="112" y2="94"/><line x1="134" y1="72" x2="144" y2="72"/>
    `) +
    `<path d="M52 78 Q57 68 62 78" fill="none" stroke="${TEAL}" stroke-width="1.6" opacity="0.9"/>`,
  linenline: () =>
    wash() +
    sun(160, 32, 12) +
    g(`
      <line x1="20" y1="52" x2="180" y2="60"/>
      <path d="M36 54 L36 96 Q50 104 64 96 L64 55"/>
      <path d="M84 57 L84 88 Q95 94 106 88 L106 58"/>
      <path d="M126 59 L126 100 Q140 108 154 100 L154 60"/>
      <line x1="20" y1="128" x2="180" y2="128" stroke-opacity="0.5"/>
    `) +
    `<circle cx="36" cy="54" r="2.4" fill="${TERRA}"/><circle cx="106" cy="58" r="2.4" fill="${TERRA}"/><circle cx="154" cy="60" r="2.4" fill="${TERRA}"/>`,
  felucca: () =>
    wash() +
    sun(46, 34, 13) +
    g(`
      <path d="M40 104 Q100 96 160 104 L146 118 L54 118 Z"/>
      <path d="M98 100 L98 36 Q130 56 140 92"/>
      <path d="M98 36 Q80 70 92 100"/>
    `) +
    `<path d="M20 126 Q40 122 60 126 T100 126 T140 126 T180 126" fill="none" stroke="${TEAL}" stroke-width="1.8" opacity="0.85"/>
     <path d="M28 134 Q48 130 68 134 T108 134 T148 134" fill="none" stroke="${TEAL}" stroke-width="1.4" opacity="0.5"/>`,
  study: () =>
    wash(0.26) +
    g(`
      <rect x="30" y="34" width="58" height="70"/>
      <line x1="30" y1="56" x2="88" y2="56"/><line x1="30" y1="78" x2="88" y2="78"/>
      <line x1="38" y1="40" x2="38" y2="56"/><line x1="50" y1="38" x2="50" y2="56"/><line x1="60" y1="42" x2="60" y2="56"/><line x1="72" y1="38" x2="72" y2="56"/>
      <line x1="42" y1="62" x2="42" y2="78"/><line x1="56" y1="60" x2="56" y2="78"/><line x1="68" y1="64" x2="68" y2="78"/><line x1="80" y1="61" x2="80" y2="78"/>
      <line x1="36" y1="84" x2="36" y2="104"/><line x1="52" y1="82" x2="52" y2="104"/><line x1="66" y1="86" x2="66" y2="104"/>
      <rect x="106" y="88" width="64" height="30"/>
      <line x1="106" y1="98" x2="170" y2="98"/>
      <path d="M120 88 L120 76 L152 76 L152 88"/>
    `) +
    `<path d="M136 66 Q132 56 138 48 Q144 42 141 32" fill="none" stroke="${DUST}" stroke-width="1.6" opacity="0.9"/>
     <circle cx="136" cy="70" r="3" fill="${TERRA}" opacity="0.8"/>`,
  arcade: () =>
    wash(0.26) +
    g(`
      <line x1="18" y1="122" x2="182" y2="122"/>
      <path d="M30 122 L30 54 Q47 34 64 54 L64 122"/>
      <path d="M76 122 L76 54 Q93 34 110 54 L110 122"/>
      <path d="M122 122 L122 54 Q139 34 156 54 L156 122"/>
      <line x1="18" y1="34" x2="182" y2="34"/>
    `) +
    `<ellipse cx="70" cy="130" rx="22" ry="3" fill="${TEAL}" opacity="0.4"/>
     <ellipse cx="130" cy="134" rx="16" ry="2.5" fill="${TEAL}" opacity="0.3"/>`,
};

export function renderMotif(name, opts = {}) {
  const draw = MOTIFS[name] || MOTIFS.sketch;
  const title = opts.title || 'Archival illustration';
  return `<svg viewBox="0 0 200 150" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${draw()}</svg>`;
}

export const motifNames = Object.keys(MOTIFS);

/* ——— Fragrance-note icons — thin line style ——— */
const NOTE_ICONS = {
  blossom: `<circle cx="24" cy="24" r="4"/><path d="M24 8 Q29 14 24 20 Q19 14 24 8Z M40 24 Q34 29 28 24 Q34 19 40 24Z M24 40 Q19 34 24 28 Q29 34 24 40Z M8 24 Q14 19 20 24 Q14 29 8 24Z M35 13 Q33 20 27 21 Q28 15 35 13Z M35 35 Q28 33 27 27 Q33 28 35 35Z M13 35 Q15 28 21 27 Q20 33 13 35Z M13 13 Q20 15 21 21 Q15 20 13 13Z"/>`,
  petal: `<path d="M24 6 Q38 18 32 34 Q28 42 24 42 Q20 42 16 34 Q10 18 24 6Z"/><path d="M24 14 L24 36"/>`,
  amber: `<path d="M24 6 Q36 22 36 30 Q36 41 24 41 Q12 41 12 30 Q12 22 24 6Z"/><path d="M20 28 Q20 35 26 36" stroke-opacity="0.6"/>`,
  rose: `<circle cx="24" cy="20" r="12"/><path d="M24 12 Q30 16 24 20 Q18 16 24 12M18 22 Q24 26 30 22"/><path d="M24 32 L24 42 M24 38 Q30 34 33 38 M24 40 Q18 36 15 40"/>`,
  letter: `<rect x="8" y="14" width="32" height="22"/><path d="M8 14 L24 27 L40 14"/>`,
  wood: `<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="4.5"/><path d="M40 24 L44 24" stroke-opacity="0.5"/>`,
  citrus: `<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="12.5" stroke-opacity="0.5"/><path d="M24 12 L24 36 M12 24 L36 24 M16 16 L32 32 M32 16 L16 32"/>`,
  linen: `<path d="M8 16 Q16 12 24 16 T40 16 M8 24 Q16 20 24 24 T40 24 M8 32 Q16 28 24 32 T40 32"/>`,
  musk: `<circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="12" stroke-opacity="0.5"/><circle cx="24" cy="24" r="17" stroke-opacity="0.25"/>`,
  leaf: `<path d="M10 38 Q10 14 38 10 Q36 38 14 38Z"/><path d="M14 34 Q22 26 32 16"/>`,
  reed: `<path d="M24 42 L24 14 M24 14 Q24 6 18 6 M24 14 Q24 6 30 6 M24 22 Q16 22 12 14 M24 22 Q32 22 36 14 M24 32 Q18 32 14 26"/>`,
  smoke: `<path d="M26 42 Q18 34 26 26 Q34 18 26 10"/><path d="M32 40 Q27 34 32 28 Q37 22 32 16" stroke-opacity="0.5"/>`,
  book: `<path d="M10 10 L10 38 Q17 34 24 38 Q31 34 38 38 L38 10 Q31 6 24 10 Q17 6 10 10Z M24 10 L24 38"/>`,
};

export function renderNoteIcon(name) {
  const body = NOTE_ICONS[name] || NOTE_ICONS.blossom;
  return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
