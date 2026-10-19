/**
 * MEMÓRIA · Price presentation. Values always come from the database
 * (variant price / sale price) and the owner's offer settings; the real
 * total is computed server-side in the bag.
 */
import { esc, money } from '../utils.js';
import { settings, defaultVariant, unitPrice } from '../data/catalog.js';

export function offerLine() {
  const o = settings.offer || {};
  return o.enabled && o.headline ? o.headline : '';
}

/** <s>EGP 1,200</s> EGP 999 + the quantity offer line */
export function priceBlock(p, { variant, cls = '', offer = true } = {}) {
  const v = variant || defaultVariant(p);
  if (!v || v.price === null) return `<div class="pblock ${cls}"><span class="pblock__now pblock__now--muted">Price on request</span></div>`;
  const sale = v.salePrice !== null && v.salePrice < v.price;
  const line = offer ? offerLine() : '';
  return `<div class="pblock ${cls}">
    <span class="pblock__row">${sale ? `<s class="pblock__was">${money(v.price)}</s>` : ''}<strong class="pblock__now">${money(unitPrice(v))}</strong></span>
    ${line ? `<span class="pblock__offer">${esc(line)}</span>` : ''}
  </div>`;
}
