/**
 * MEMÓRIA · Bottle renderer.
 *
 * No product photography was supplied, so every perfume is drawn as a
 * layered SVG illustration: glass, liquid, printed paper label, cap and
 * a moving light-sweep layer. Layers give honest 2.5D motion (tilt,
 * float, sweep) without faking 3D renders.
 *
 * Six silhouettes: shoulder | oval | column | apothecary | block | slim
 */
import { esc } from '../utils.js';

let uidCounter = 0;

/* — colour helpers — */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
const darken = (hex, t) => mix(hex, '#1c120a', t);
const lighten = (hex, t) => mix(hex, '#f6efe0', t);

/* — silhouettes: body path + geometry in a 200×300 viewBox — */
const SHAPES = {
  shoulder: {
    body: 'M57 100 Q57 78 80 73 L120 73 Q143 78 143 100 L143 264 Q143 276 131 276 L69 276 Q57 276 57 264 Z',
    bodyTop: 78, bodyBottom: 276, bodyLeft: 57, bodyRight: 143,
    neck: { x: 88, y: 52, w: 24, h: 24 },
    labelY: 150, labelH: 84,
  },
  oval: {
    body: 'M100 74 C138 74 152 110 152 168 C152 234 136 274 100 274 C64 274 48 234 48 168 C48 110 62 74 100 74 Z',
    bodyTop: 80, bodyBottom: 274, bodyLeft: 48, bodyRight: 152,
    neck: { x: 87, y: 58, w: 26, h: 20 },
    labelY: 152, labelH: 80,
  },
  column: {
    body: 'M72 76 Q72 70 78 70 L122 70 Q128 70 128 76 L128 268 Q128 278 118 278 L82 278 Q72 278 72 268 Z',
    bodyTop: 70, bodyBottom: 278, bodyLeft: 72, bodyRight: 128,
    neck: { x: 86, y: 48, w: 28, h: 24 },
    labelY: 148, labelH: 92,
  },
  apothecary: {
    body: 'M52 104 Q52 90 68 86 L132 86 Q148 90 148 104 L148 264 Q148 276 136 276 L64 276 Q52 276 52 264 Z',
    bodyTop: 88, bodyBottom: 276, bodyLeft: 52, bodyRight: 148,
    neck: { x: 84, y: 58, w: 32, h: 30 },
    labelY: 150, labelH: 86,
  },
  block: {
    body: 'M50 118 Q50 108 60 106 L140 106 Q150 108 150 118 L150 262 Q150 274 138 274 L62 274 Q50 274 50 262 Z',
    bodyTop: 106, bodyBottom: 274, bodyLeft: 50, bodyRight: 150,
    neck: { x: 82, y: 76, w: 36, h: 32 },
    labelY: 158, labelH: 78,
  },
  slim: {
    body: 'M74 84 Q74 76 82 76 L118 76 Q126 76 126 84 L126 268 Q126 278 116 278 L84 278 Q74 278 74 268 Z',
    bodyTop: 76, bodyBottom: 278, bodyLeft: 74, bodyRight: 126,
    neck: { x: 88, y: 54, w: 24, h: 24 },
    labelY: 150, labelH: 90,
  },
};

/* — caps — */
function renderCap(kind, color, shape) {
  const n = shape.neck;
  const cx = n.x + n.w / 2;
  const light = lighten(color, 0.24);
  const dark = darken(color, 0.3);
  const neckGlass = `
    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h + 4}" fill="#ffffff" opacity="0.14"/>
    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h + 4}" fill="${darken('#c8b490', 0.15)}" opacity="0.35"/>`;
  switch (kind) {
    case 'square':
      return `${neckGlass}
        <rect x="${cx - 19}" y="${n.y - 40}" width="38" height="42" rx="2.5" fill="${color}"/>
        <rect x="${cx - 19}" y="${n.y - 40}" width="12" height="42" rx="2.5" fill="${light}" opacity="0.28"/>
        <rect x="${cx - 19}" y="${n.y - 6}" width="38" height="8" fill="${dark}" opacity="0.5"/>`;
    case 'dome':
      return `${neckGlass}
        <path d="M${cx - 17} ${n.y - 2} L${cx - 17} ${n.y - 18} Q${cx - 17} ${n.y - 36} ${cx} ${n.y - 36} Q${cx + 17} ${n.y - 36} ${cx + 17} ${n.y - 18} L${cx + 17} ${n.y - 2} Z" fill="${color}"/>
        <path d="M${cx - 10} ${n.y - 5} L${cx - 10} ${n.y - 18} Q${cx - 10} ${n.y - 30} ${cx - 2} ${n.y - 32}" stroke="${light}" stroke-width="4" fill="none" opacity="0.4" stroke-linecap="round"/>`;
    case 'tall':
      return `${neckGlass}
        <rect x="${cx - 15}" y="${n.y - 52}" width="30" height="54" rx="2" fill="${color}"/>
        <rect x="${cx - 15}" y="${n.y - 52}" width="9" height="54" fill="${light}" opacity="0.3"/>
        <line x1="${cx - 15}" y1="${n.y - 40}" x2="${cx + 15}" y2="${n.y - 40}" stroke="${dark}" stroke-width="1" opacity="0.4"/>`;
    case 'wood':
      return `${neckGlass}
        <rect x="${cx - 22}" y="${n.y - 34}" width="44" height="36" rx="4" fill="${color}"/>
        <line x1="${cx - 16}" y1="${n.y - 28}" x2="${cx - 16}" y2="${n.y - 4}" stroke="${dark}" stroke-width="1.4" opacity="0.5"/>
        <line x1="${cx - 6}" y1="${n.y - 30}" x2="${cx - 6}" y2="${n.y - 2}" stroke="${dark}" stroke-width="1" opacity="0.4"/>
        <line x1="${cx + 8}" y1="${n.y - 28}" x2="${cx + 8}" y2="${n.y - 4}" stroke="${dark}" stroke-width="1.2" opacity="0.45"/>
        <rect x="${cx - 22}" y="${n.y - 34}" width="44" height="7" rx="3" fill="${light}" opacity="0.22"/>`;
    case 'heavy':
      return `${neckGlass}
        <rect x="${cx - 26}" y="${n.y - 34}" width="52" height="38" rx="3" fill="${color}"/>
        <rect x="${cx - 26}" y="${n.y - 34}" width="52" height="9" rx="3" fill="${light}" opacity="0.2"/>
        <rect x="${cx - 26}" y="${n.y - 3}" width="52" height="7" fill="${dark}" opacity="0.55"/>`;
    case 'brass':
    default:
      return `${neckGlass}
        <rect x="${cx - 14}" y="${n.y - 40}" width="28" height="42" rx="13" fill="${color}"/>
        <rect x="${cx - 8}" y="${n.y - 38}" width="6" height="38" rx="3" fill="${light}" opacity="0.5"/>
        <rect x="${cx - 14}" y="${n.y - 10}" width="28" height="6" fill="${dark}" opacity="0.4"/>`;
  }
}

/**
 * Render a perfume bottle as an SVG string.
 * opts: { label: true, hint: '' }
 */
export function renderBottle(product, opts = {}) {
  const { label = true } = opts;
  const cfg = product.bottle;
  const shape = SHAPES[cfg.shape] || SHAPES.shoulder;
  const uid = `b${product.id}-${++uidCounter}`;

  const glassLight = lighten(cfg.glass, 0.4);
  const glassDark = darken(cfg.glass, 0.34);
  const liquidY = shape.bodyTop + (1 - cfg.level) * (shape.bodyBottom - shape.bodyTop);
  const bodyW = shape.bodyRight - shape.bodyLeft;
  const cx = shape.bodyLeft + bodyW / 2;

  const labelW = Math.min(bodyW - 22, 74);
  const labelX = cx - labelW / 2;
  const labelY = shape.labelY;
  const labelH = shape.labelH;

  const labelSvg = label
    ? `
    <g class="bottle__label">
      <rect x="${labelX}" y="${labelY}" width="${labelW}" height="${labelH}" fill="#efe6d2"/>
      <rect x="${labelX + 2.5}" y="${labelY + 2.5}" width="${labelW - 5}" height="${labelH - 5}" fill="none" stroke="#5a3522" stroke-opacity="0.5" stroke-width="0.7"/>
      <text x="${cx}" y="${labelY + 17}" text-anchor="middle" font-family="Jost, sans-serif" font-size="7.4" letter-spacing="2.6" fill="#3e281b">MEMÓRIA</text>
      <line x1="${cx - 14}" y1="${labelY + 24}" x2="${cx + 14}" y2="${labelY + 24}" stroke="#5a3522" stroke-opacity="0.45" stroke-width="0.6"/>
      <text x="${cx}" y="${labelY + 43}" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="19" font-style="italic" fill="#5a3522">Nº ${esc(product.number)}</text>
      <text x="${cx}" y="${labelY + 57}" text-anchor="middle" font-family="Jost, sans-serif" font-size="5.6" letter-spacing="1.6" fill="#5a3522">${esc(product.name.toUpperCase())}</text>
      <text x="${cx}" y="${labelY + labelH - 8}" text-anchor="middle" font-family="'Courier Prime', monospace" font-size="4.6" letter-spacing="1.2" fill="#7b786f">EAU DE PARFUM</text>
    </g>`
    : '';

  return `
<svg class="bottle" viewBox="0 0 200 300" role="img" aria-label="${esc(product.name)} — illustrated bottle" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}-glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${glassDark}"/>
      <stop offset="0.18" stop-color="${cfg.glass}"/>
      <stop offset="0.42" stop-color="${glassLight}"/>
      <stop offset="0.65" stop-color="${cfg.glass}"/>
      <stop offset="1" stop-color="${glassDark}"/>
    </linearGradient>
    <linearGradient id="${uid}-liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cfg.liquidTop}"/>
      <stop offset="1" stop-color="${cfg.liquidBottom}"/>
    </linearGradient>
    <linearGradient id="${uid}-lqside" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${darken(cfg.liquidBottom, 0.35)}"/>
      <stop offset="0.25" stop-color="${darken(cfg.liquidBottom, 0.35)}" stop-opacity="0"/>
      <stop offset="0.75" stop-color="${darken(cfg.liquidBottom, 0.35)}" stop-opacity="0"/>
      <stop offset="1" stop-color="${darken(cfg.liquidBottom, 0.35)}"/>
    </linearGradient>
    <linearGradient id="${uid}-sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${uid}-clip"><path d="${shape.body}"/></clipPath>
  </defs>

  ${renderCap(cfg.cap, cfg.capColor, shape)}

  <!-- glass body -->
  <path d="${shape.body}" fill="url(#${uid}-glass)" opacity="0.94"/>

  <!-- liquid -->
  <g clip-path="url(#${uid}-clip)">
    <rect x="${shape.bodyLeft}" y="${liquidY}" width="${bodyW}" height="${shape.bodyBottom - liquidY}" fill="url(#${uid}-liquid)" opacity="0.92"/>
    <rect x="${shape.bodyLeft}" y="${liquidY}" width="${bodyW}" height="${shape.bodyBottom - liquidY}" fill="url(#${uid}-lqside)" opacity="0.5"/>
    <ellipse cx="${cx}" cy="${liquidY}" rx="${bodyW / 2 - 4}" ry="3.4" fill="${lighten(cfg.liquidTop, 0.35)}" opacity="0.85"/>
  </g>

  <!-- inner glass edge shading -->
  <path d="${shape.body}" fill="none" stroke="${glassDark}" stroke-opacity="0.55" stroke-width="1.6"/>

  ${labelSvg}

  <!-- static highlight -->
  <g clip-path="url(#${uid}-clip)">
    <rect x="${shape.bodyLeft + 7}" y="${shape.bodyTop - 6}" width="7" height="${shape.bodyBottom - shape.bodyTop + 12}" rx="3.5" fill="#ffffff" opacity="0.20"/>
    <rect x="${shape.bodyRight - 13}" y="${shape.bodyTop - 6}" width="4" height="${shape.bodyBottom - shape.bodyTop + 12}" rx="2" fill="#ffffff" opacity="0.10"/>
    <!-- animated sweep -->
    <rect data-sweep x="-60%" y="0" width="46%" height="100%" fill="url(#${uid}-sweep)"/>
  </g>
</svg>`;
}

/**
 * A bottle inside a stage with fragrance-mist layers.
 * mists: number of mist blobs (0 to skip).
 * reflection: adds a faded, flipped copy beneath — the bottle stands on a surface.
 */
export function renderBottleStage(product, { label = true, mists = 0, stageClass = '', reflection = false } = {}) {
  let mistHtml = '';
  for (let i = 0; i < mists; i++) {
    const size = 46 + i * 22;
    const x = [8, 52, 26][i % 3];
    const y = [18, 30, 6][i % 3];
    mistHtml += `<span class="mist" style="width:${size}%;aspect-ratio:1;left:${x}%;top:${y}%;background:radial-gradient(circle, ${product.mist}55, ${product.mist}00 70%);"></span>`;
  }
  const reflectionHtml = reflection
    ? `<div class="bottle-reflection" aria-hidden="true">${renderBottle(product, { label: false })}</div>`
    : '';
  return `
  <div class="bottle-stage ${stageClass}" style="--mist-c:${product.mist}">
    ${mistHtml}
    ${renderBottle(product, { label })}
    ${reflectionHtml}
  </div>`;
}
