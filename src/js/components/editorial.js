/**
 * MEMÓRIA · Editorial homepage pieces (art direction "Afternoon Light").
 *
 *  edHero()        one still life: the real LIQAA packshot on sunlit plaster,
 *                  one headline, one purchase action
 *  edSpread(p)     one scent as a magazine spread: the memory it is named
 *                  after, the bottle in the same light, then name, price, buy
 *
 * Images are built by scripts/build-stilllife.mjs (src/js/data/editorial.json).
 * Prices always come from the database; nothing here computes a total.
 */
import { esc, money } from '../utils.js';
import { settings, defaultVariant, unitPrice, isPurchasable } from '../data/catalog.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { waLink, productMessage, enquiryMessage, waIcon } from './whatsapp.js';
import { offerLine } from './price.js';
import { onPageCleanup } from '../motion.js';
import ed from '../data/editorial.json';

const set = (name, widths) => widths.map((w) => `/editorial/${name}-${w}.webp ${w}w`).join(', ');

function priceLine(p) {
  const v = defaultVariant(p);
  if (!v || v.price === null) return '';
  const sale = v.salePrice !== null && v.salePrice < v.price;
  return `${sale ? `<s>${money(v.price)}</s>` : ''}<strong>${money(unitPrice(v))}</strong>`;
}

/* ————— hero ————— */

export function edHero(p) {
  const sub = settings.home?.hero?.subline || '';
  const H = ed.hero,
    M = ed.heroMobile;
  return `
  <section class="edh" aria-labelledby="edh-title" data-edh>
    <div class="edh__frame" aria-hidden="true">
      <picture>
        <source media="(max-width: 760px)" srcset="${set('hero-m-liqaa', M.widths)}" sizes="100vw"/>
        <img class="edh__photo" src="/editorial/hero-liqaa-1920.webp" srcset="${set('hero-liqaa', H.widths)}" sizes="100vw" alt="" width="${H.w}" height="${H.h}" fetchpriority="high" decoding="async"/>
      </picture>
      <picture class="edh__leaves">
        <source media="(max-width: 760px)" srcset="${set('hero-m-liqaa-leaves', M.leaves)}" sizes="100vw"/>
        <img src="/editorial/hero-liqaa-leaves-1920.webp" srcset="${set('hero-liqaa-leaves', H.leaves)}" sizes="100vw" alt="" decoding="async"/>
      </picture>
    </div>
    <div class="edh__copy">
      <p class="ed-label">Perfume house · Cairo</p>
      <h1 id="edh-title" class="edh__title">Memories<br/>you can wear.</h1>
      ${sub ? `<p class="edh__sub">${esc(sub)}</p>` : ''}
      ${
        p
          ? `<div class="edh__buy">
              <a class="ed-btn" href="/product/${esc(p.slug)}">Shop ${esc(p.name)}</a>
              <span class="ed-price">${priceLine(p)}</span>
            </div>`
          : ''
      }
    </div>
    ${p ? `<p class="edh__caption" aria-hidden="true">No. 01 · ${esc(p.name)}</p>` : ''}
  </section>`;
}

/* ————— one scent, one spread ————— */

export function edSpread(p, { index = 1 } = {}) {
  if (!p) return '';
  const plate = ed.plate?.[p.slug];
  const memory = ed.memory?.[p.slug];
  if (!plate || !memory) return '';
  const v = defaultVariant(p);
  const buyable = isPurchasable(p);
  const wa = waLink(buyable ? productMessage(p, v, 1) : enquiryMessage(p));
  const offer = offerLine();
  const tagline = p.story?.tagline || '';
  const [meaning, ...rest] = tagline.split(/(?<=\.)\s+/);
  return `
  <section class="eds" id="collection" aria-labelledby="eds-${esc(p.slug)}">
    <figure class="eds__memory" data-reveal>
      <img src="/editorial/memory-${esc(p.slug)}-1200.webp" srcset="${set(`memory-${p.slug}`, memory.widths)}" sizes="(max-width: 900px) 100vw, 42vw" alt="Late sun through a window falls across an armchair and a telephone." loading="lazy" decoding="async" width="${memory.w}" height="${memory.h}"/>
    </figure>
    <a class="eds__plate" href="/product/${esc(p.slug)}" data-reveal style="--reveal-delay:120ms" aria-label="${esc(p.name)}, view the fragrance">
      <img src="/editorial/plate-${esc(p.slug)}-1200.webp" srcset="${set(`plate-${p.slug}`, plate.widths)}" sizes="(max-width: 900px) 100vw, 33vw" alt="${esc(p.name)} bottle in afternoon light" loading="lazy" decoding="async" width="${plate.w}" height="${plate.h}"/>
    </a>
    <div class="eds__info" data-reveal style="--reveal-delay:220ms">
      <p class="ed-label">No. ${String(index).padStart(2, '0')} · The collection</p>
      <h2 id="eds-${esc(p.slug)}" class="eds__name">${esc(p.name)}</h2>
      ${meaning ? `<p class="eds__meaning">${esc(meaning)}</p>` : ''}
      ${rest.length ? `<p class="eds__line">${esc(rest.join(' '))}</p>` : ''}
      <div class="eds__price ed-price">${priceLine(p)}</div>
      ${offer ? `<p class="eds__offer">${esc(offer)}</p>` : ''}
      <div class="eds__actions">
        ${buyable ? `<button class="ed-btn ed-btn--block" type="button" data-ed-add="${esc(v.id)}">Add to bag</button>` : ''}
        ${wa ? `<a class="ed-btn ed-btn--line ed-btn--block" href="${esc(wa)}" target="_blank" rel="noopener">${waIcon()} Order on WhatsApp</a>` : ''}
      </div>
      <a class="eds__more" href="/product/${esc(p.slug)}">View the fragrance</a>
    </div>
  </section>`;
}

export function mountEditorial(root, { reduced = false } = {}) {
  root.querySelectorAll('[data-ed-add]').forEach((b) => {
    const fn = () => {
      if (cart.add(b.dataset.edAdd, 1)) openCartDrawer();
    };
    b.addEventListener('click', fn);
    onPageCleanup(() => b.removeEventListener('click', fn));
  });
  const hero = root.querySelector('[data-edh]');
  if (hero && !reduced) {
    requestAnimationFrame(() => hero.classList.add('is-in'));
  } else hero?.classList.add('is-in', 'is-still');
}
