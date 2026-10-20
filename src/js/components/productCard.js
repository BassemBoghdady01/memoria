/**
 * MEMÓRIA · Product card — the real bottle on a studio plate.
 * Hover turns to the three-quarter photograph (a real second view, not
 * a fake rotation). Price, availability and quick add straight from the
 * database; unpriced scents offer a WhatsApp enquiry instead.
 */
import { esc, money } from '../utils.js';
import { defaultVariant, fromPrice, isPurchasable, isSoldOut, pricedVariants } from '../data/catalog.js';
import { productImg } from './render.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { onPageCleanup } from '../motion.js';
import { offerLine } from './price.js';
import scenes from '../data/scenes.json';
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
  const scene = scenes[p.story?.scene] || scenes['nile-dusk'];
  const cut = (w) => `/products/${p.slug}/cutout-01-${w}.webp`;
  let action;
  if (buyable) action = `<button class="scard__add" data-add="${v.id}">Add to bag</button>`;
  else if (sold) action = `<span class="scard__flag">Sold out</span>`;
  else {
    const wa = waLink(enquiryMessage(p));
    action = wa ? `<a class="scard__add" href="${esc(wa)}" target="_blank" rel="noopener">Enquire</a>` : '';
  }
  return `
  <article class="scard" data-reveal style="--reveal-delay:${revealDelay}ms" data-pcard="${esc(p.slug)}">
    <a class="scard__link" href="/product/${esc(p.slug)}" aria-label="${esc(p.name)}, ${esc(priceLabel(p))}"></a>
    <div class="scard__media" aria-hidden="true">
      <img class="scard__scene" src="${esc(scene.src.replace('-1600.', '-800.'))}" alt="" loading="lazy" decoding="async"/>
      <i class="scard__veil"></i>
      <img class="scard__bottle" src="${cut(600)}" srcset="${cut(600)} 600w, ${cut(1200)} 1200w" sizes="(max-width: 700px) 45vw, 16vw" alt="" loading="lazy" decoding="async"/>
      <i class="scard__shadow"></i>
    </div>
    <div class="scard__body">
      <h3 class="scard__name">${esc(p.name)}</h3>
      ${p.story?.tagline ? `<p class="scard__tag">${esc(p.story.tagline)}</p>` : ''}
      <div class="scard__row">
        <span class="scard__price">${onSale ? `<s>${money(v.price)}</s> ` : ''}<strong>${esc(priceLabel(p))}</strong></span>
        ${action}
      </div>
      ${onSale && offerLine() ? `<small class="scard__offer">${esc(offerLine())}</small>` : ''}
    </div>
  </article>`;
}

export function renderProductGrid(list, opts = {}) {
  if (!list.length) return `<div class="shop__empty"><p>No scents here yet.</p><a class="btn" href="/shop">See the full collection</a></div>`;
  return `<div class="sgrid">${list.map((p, i) => renderProductCard(p, { revealDelay: (i % 4) * 80, ...opts })).join('')}</div>`;
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
