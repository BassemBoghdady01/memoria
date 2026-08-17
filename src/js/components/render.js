/**
 * MEMÓRIA · Bottle render image — the photoreal PNG/WebP renders that
 * replaced the illustrated SVG bottles everywhere.
 */
import { esc } from '../utils.js';
import { renderSrc } from '../data/products.js';

export function bottleImg(p, { w = 720, cls = '', alt, eager = false } = {}) {
  const s = renderSrc(p, w);
  const a = alt ?? `MEMÓRIA Nº ${p.number} — ${p.name}, glass flacon`;
  return `<picture class="bimg${cls ? ' ' + cls : ''}">
    <source srcset="${s.webp}" type="image/webp"/>
    <img src="${s.png}" alt="${esc(a)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"/>
  </picture>`;
}
