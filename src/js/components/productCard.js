/**
 * MEMÓRIA · Product card + grid.
 */
import { esc, money } from '../utils.js';
import { genderLabel } from '../data/products.js';
import { renderBottleStage } from './bottle.js';
import { cart } from '../store/cart.js';
import { toast } from '../utils.js';
import { openCartDrawer } from './cartDrawer.js';
import { attachTilt, sweepBottle, onPageCleanup } from '../motion.js';

export function renderProductCard(p, { revealDelay = 0 } = {}) {
  const defaultSize = p.sizes[p.sizes.length - 1];
  return `
  <article class="pcard" data-reveal style="--reveal-delay:${revealDelay}ms; --mist-c:${p.mist}" data-pcard="${p.slug}">
    <a class="pcard__link" href="/product/${p.slug}" aria-label="Nº ${p.number} — ${esc(p.name)}, ${genderLabel(p.gender)}"></a>
    <div class="pcard__stage">
      <span class="pcard__no">Nº ${p.number}</span>
      <span class="pcard__fam">${esc(p.fragranceFamily)}</span>
      ${renderBottleStage(p, { label: true })}
      <span class="pcard__notes">${esc([...p.topNotes.slice(0, 1), ...p.heartNotes.slice(0, 2), ...p.baseNotes.slice(0, 1)].join(' · '))}</span>
    </div>
    <div class="pcard__body">
      <span class="pcard__gender">${genderLabel(p.gender)}</span>
      <h3 class="pcard__name">${esc(p.name)}</h3>
      <span class="pcard__size">${esc(p.concentration)} · ${defaultSize.ml} ml</span>
      <div class="pcard__row">
        <span class="pcard__price">${money(defaultSize.price)}</span>
        <button class="btn btn--small" data-add="${p.slug}" data-ml="${defaultSize.ml}">Add to Bag</button>
      </div>
    </div>
  </article>`;
}

export function renderProductGrid(list, opts = {}) {
  return `<div class="pgrid">${list.map((p, i) => renderProductCard(p, { revealDelay: (i % 3) * 90, ...opts })).join('')}</div>`;
}

/**
 * Wire up add-to-bag buttons + bottle tilt inside a container.
 * Returns a disposer — call it before replacing the container's HTML
 * (filter tabs, live search) so infinite tweens don't outlive their cards.
 */
export function mountProductCards(root) {
  const offs = [];
  root.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cart.add(btn.dataset.add, Number(btn.dataset.ml), 1);
      openCartDrawer();
    });
  });
  root.querySelectorAll('[data-pcard]').forEach((card) => {
    /* Tilt listens on the whole card: the full-card link overlay sits above
       the stage, so pointer events must be caught at card level. */
    offs.push(attachTilt(card, { max: 6 }));
    offs.push(sweepBottle(card, { every: 7 + Math.random() * 5 }));
  });
  const dispose = () => {
    offs.forEach((fn) => fn?.());
    offs.length = 0;
  };
  onPageCleanup(dispose);
  return dispose;
}
