/**
 * MEMÓRIA · Product card — a catalogue plate, rebuilt for 2026.
 * Photoreal render on a tinted plate; hover turns the bottle slightly,
 * floods the plate with the scent's world colour and reveals the notes.
 * Shopping stays one tap away at all times.
 */
import { esc, money } from '../utils.js';
import { genderLabel } from '../data/products.js';
import { bottleImg } from './render.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { onPageCleanup } from '../motion.js';

export function renderProductCard(p, { revealDelay = 0 } = {}) {
  const defaultSize = p.sizes[p.sizes.length - 1];
  const notesLine = [...p.topNotes.slice(0, 1), ...p.heartNotes.slice(0, 2), ...p.baseNotes.slice(0, 1)].join(' · ');
  return `
  <article class="pcard" data-reveal style="--reveal-delay:${revealDelay}ms; --tint:${p.tint}; --world:${p.world.color}; --accent:${p.accent}" data-pcard="${p.slug}">
    <a class="pcard__link" href="/product/${p.slug}" aria-label="Nº ${p.number} — ${esc(p.name)}, ${genderLabel(p.gender)}, from ${money(p.sizes[0].price)}"></a>
    <div class="pcard__plate">
      <span class="pcard__no" aria-hidden="true">Nº ${p.number}</span>
      <span class="pcard__for">${p.gender === 'her' ? 'For Her' : 'For Him'}</span>
      ${bottleImg(p, { w: 720, cls: 'pcard__img' })}
      <div class="pcard__world" aria-hidden="true">
        <p class="pcard__ad">${esc(p.ad)}</p>
        <p class="pcard__notes">${esc(notesLine)}</p>
      </div>
    </div>
    <div class="pcard__info">
      <div class="pcard__namerow">
        <h3 class="pcard__name">${esc(p.name)}</h3>
        <span class="pcard__numchip" aria-hidden="true">${p.number}</span>
      </div>
      <span class="pcard__fam">${esc(p.fragranceFamily)} · ${esc(p.concentration)}</span>
      <div class="pcard__row">
        <span class="pcard__price">${money(defaultSize.price)}</span>
        <button class="btn btn--small btn--quickadd" data-add="${p.slug}" data-ml="${defaultSize.ml}">Quick Add</button>
      </div>
    </div>
  </article>`;
}

export function renderProductGrid(list, opts = {}) {
  return `<div class="pgrid">${list.map((p, i) => renderProductCard(p, { revealDelay: (i % 3) * 90, ...opts })).join('')}</div>`;
}

/**
 * Wire up quick-add buttons inside a container. Hover/turn behaviour is
 * pure CSS now. Returns a disposer — call before replacing the container's
 * HTML (filter tabs, live search) to drop listeners cleanly.
 */
export function mountProductCards(root) {
  if (!root) return () => {};
  const handlers = [];
  root.querySelectorAll('[data-add]').forEach((btn) => {
    const fn = (e) => {
      e.preventDefault();
      cart.add(btn.dataset.add, Number(btn.dataset.ml), 1);
      openCartDrawer();
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
