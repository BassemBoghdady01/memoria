/**
 * MEMÓRIA · Product imagery — only the supplied product photography,
 * served at responsive sizes. The bottle is never redrawn.
 */
import { esc } from '../utils.js';
import { primaryImage, cutoutImage } from '../data/catalog.js';
import ed from '../data/editorial.json';

export function productImg(p, { image, cls = '', sizes = '(max-width: 700px) 50vw, 25vw', eager = false, alt } = {}) {
  const im = image || primaryImage(p);
  if (!im) return `<span class="pimg pimg--missing ${cls}" role="img" aria-label="${esc(p.name)} — photograph coming soon"><span>${esc(p.name)}</span></span>`;
  return `<img class="pimg ${cls}" src="${esc(im.url)}" ${im.srcset ? `srcset="${esc(im.srcset)}" sizes="${esc(sizes)}"` : ''}
    alt="${esc(alt ?? im.alt ?? p.name)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''} width="960" height="960"/>`;
}

/** Transparent cut-out of the real bottle, for compositing over scenes. */
export function productCutout(p, { view = 'Front', cls = '', sizes = '40vw', eager = false, alt } = {}) {
  const im = cutoutImage(p, view);
  if (!im) return productImg(p, { cls, sizes, eager, alt });
  return `<img class="pcut ${cls}" src="${esc(im.url)}" ${im.srcset ? `srcset="${esc(im.srcset)}" sizes="${esc(sizes)}"` : ''}
    alt="${esc(alt ?? im.alt ?? p.name)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}/>`;
}

/**
 * The scent's still life (real packshot on sunlit plaster, built by
 * scripts/build-stilllife.mjs). Falls back to the studio photograph.
 */
export function productPlate(p, { cls = '', sizes = '(max-width: 700px) 50vw, 25vw', eager = false, alt } = {}) {
  const pl = ed.plate?.[p?.slug];
  if (!pl) return productImg(p, { cls, sizes, eager, alt });
  const srcset = pl.widths.map((w) => `/editorial/plate-${p.slug}-${w}.webp ${w}w`).join(', ');
  return `<img class="pplate ${cls}" src="/editorial/plate-${esc(p.slug)}-800.webp" srcset="${srcset}" sizes="${esc(sizes)}"
    alt="${esc(alt ?? `${p.name} bottle in afternoon light`)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''} width="${pl.w}" height="${pl.h}"/>`;
}
