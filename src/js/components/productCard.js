/**
 * MEMÓRIA · Product card — the real bottle on a studio plate.
 * Hover turns to the three-quarter photograph (a real second view, not
 * a fake rotation). Price, availability and quick add straight from the
 * database; unpriced scents offer a WhatsApp enquiry instead.
 */
import { esc, money } from '../utils.js';
import { defaultVariant, fromPrice, isPurchasable, isSoldOut, pricedVariants } from '../data/catalog.js';
import { productPlate } from './render.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { onPageCleanup } from '../motion.js';
import { waLink, enquiryMessage } from './whatsapp.js';

export function priceLabel(p) {
  const from = fromPrice(p);
  if (from === null) return 'Price on request';
  return `${pricedVariants(p).length > 1 ? 'From ' : ''}${money(from)}`;
}

export function renderProductCard(p, { revealDelay = 0 } = {}) {
  const v = defaultVariant(p);
  const buyable = isPurchasable(p);
  const sold = isSoldOut(p);
  const onSale = v && v.salePrice !== null && v.price !== null;
  const meaning = String(p.story?.tagline || '').split(/(?<=\.)\s+/)[0];
  let action;
  if (buyable) action = `<button class="pcard__add" data-add="${v.id}">Add to bag</button>`;
  else if (sold) action = `<span class="pcard__flag">Sold out</span>`;
  else {
    const wa = waLink(enquiryMessage(p));
    action = wa ? `<a class="pcard__add" href="${esc(wa)}" target="_blank" rel="noopener">Enquire</a>` : '';
  }
  return `
  <article class="pcard" data-reveal style="--reveal-delay:${revealDelay}ms" data-pcard="${esc(p.slug)}">
    <a class="pcard__media" href="/product/${esc(p.slug)}" aria-label="${esc(p.name)}, ${esc(priceLabel(p))}">
      ${productPlate(p, { sizes: '(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw' })}
    </a>
    <div class="pcard__body">
      <h3 class="pcard__name"><a href="/product/${esc(p.slug)}">${esc(p.name)}</a></h3>
      ${meaning ? `<p class="pcard__tag">${esc(meaning)}</p>` : ''}
      <div class="pcard__row">
        <span class="pcard__price ed-price">${onSale ? `<s>${money(v.price)}</s>` : ''}<strong>${esc(priceLabel(p))}</strong></span>
        ${action}
      </div>
    </div>
  </article>`;
}

export function renderProductGrid(list, opts = {}) {
  if (!list.length) return `<div class="shop__empty"><p>No scents here yet.</p><a class="btn" href="/shop">See the full collection</a></div>`;
  return `<div class="pgrid">${list.map((p, i) => renderProductCard(p, { revealDelay: (i % 4) * 80, ...opts })).join('')}</div>`;
}

/** Wire quick-add buttons in a container. Returns a disposer. */
export function mountProductCards(root) {
  if (!root) return () => {};
  const handlers = [];
  root.querySelectorAll('[data-add]').forEach((btn) => {
    const fn = (e) => {
      e.preventDefault();
      if (cart.add(btn.dataset.add, 1)) openCartDrawer();
    };
    btn.addEventListener('click', fn);
    handlers.push([btn, fn]);
  });
  const dispose = () => {
    handlers.forEach(([btn, fn]) => btn.removeEventListener('click', fn));
    handlers.length = 0;
  };
  onPageCleanup(dispose);
  return dispose;
}
