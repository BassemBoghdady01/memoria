/**
 * MEMÓRIA · The Fragrance Gallery.
 *
 * One fragrance at a time, large, in its own photographed place; its
 * neighbours wait at the edges. Arrows, swipe, keyboard, or the radio
 * tuning band underneath (an optional, accessible way to "tune" between
 * stories). Price, offer, Add to bag and WhatsApp are always in reach.
 */
import { esc } from '../utils.js';
import { products, defaultVariant, isPurchasable } from '../data/catalog.js';
import { priceBlock } from './price.js';
import { waLink, productMessage, enquiryMessage, waIcon } from './whatsapp.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { onPageCleanup } from '../motion.js';
import scenes from '../data/scenes.json';

const pad = (n) => String(n).padStart(2, '0');
const sceneOf = (p) => scenes[p.story?.scene] || scenes['nile-dusk'];
const cut = (p, v = '01', w = 1200) => `/products/${p.slug}/cutout-${v}-${w}.webp`;

export function gallerySection(startSlug) {
  if (!products.length) return '';
  const start = Math.max(0, products.findIndex((p) => p.slug === startSlug));
  const word = { 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine' }[products.length] || String(products.length);
  return `
  <section class="gal" aria-roledescription="carousel" aria-labelledby="gal-title" data-gallery data-start="${start}">
    <div class="gal__scenes" aria-hidden="true">
      ${products
        .map((p, i) => {
          const s = sceneOf(p);
          return `<img class="gal__scene ${i === start ? 'is-on' : ''}" data-scene="${i}" ${i === start ? `src="${esc(s.src)}"` : `data-src="${esc(s.src)}"`} srcset="" alt="" decoding="async"/>`;
        })
        .join('')}
      <i class="gal__veil"></i>
    </div>
    <div class="gal__inner">
      <header class="gal__head">
        <p class="gal__kicker">The collection</p>
        <h2 id="gal-title" class="gal__title">${word} scents. <span class="gal__script">${word} memories.</span></h2>
      </header>

      <div class="gal__track" data-track>
        ${products
          .map(
            (p, i) => `
          <div class="gal__slot" data-slot="${i}">
            <button class="gal__bottle" data-pick="${i}" tabindex="-1" aria-hidden="true">
              <img src="${cut(p, '01', 600)}" srcset="${cut(p, '01', 600)} 600w, ${cut(p)} 1200w" sizes="(max-width: 760px) 50vw, 24vw" alt="" loading="${Math.abs(i - start) < 2 ? 'eager' : 'lazy'}" decoding="async"/>
              <img class="gal__alt" src="${cut(p, '02', 600)}" alt="" loading="lazy" decoding="async"/>
              <i class="gal__shadow"></i>
            </button>
          </div>`
          )
          .join('')}
      </div>

      <div class="gal__panel">
        ${products
          .map((p, i) => {
            const v = defaultVariant(p);
            const buy = isPurchasable(p);
            const wa = waLink(buy && v ? productMessage(p, v, 1) : enquiryMessage(p));
            return `
          <article class="gal__info ${i === start ? 'is-on' : ''}" data-info="${i}" aria-hidden="${i !== start}" ${i !== start ? 'inert' : ''}>
            <p class="gal__no">Nº ${pad(i + 1)} <span>/ ${pad(products.length)}</span></p>
            <h3 class="gal__name">${esc(p.name)}</h3>
            ${p.story?.tagline ? `<p class="gal__tag">${esc(p.story.tagline)}</p>` : ''}
            ${priceBlock(p, { variant: v })}
            <div class="gal__actions">
              ${buy ? `<button class="btn btn--ink-light" data-add="${esc(v.id)}">Add to bag</button>` : ''}
              ${wa ? `<a class="btn btn--wa-light" href="${esc(wa)}" target="_blank" rel="noopener">${waIcon()}<span>Order on WhatsApp</span></a>` : ''}
              <a class="gal__more" href="/product/${esc(p.slug)}">Discover ${esc(p.name)} →</a>
            </div>
          </article>`;
          })
          .join('')}
      </div>

      <button class="gal__arrow gal__arrow--prev" data-prev aria-label="Previous fragrance">‹</button>
      <button class="gal__arrow gal__arrow--next" data-next aria-label="Next fragrance">›</button>

      <div class="dial" role="tablist" aria-label="Tune between fragrances">
        <div class="dial__band">
          <i class="dial__needle" data-needle aria-hidden="true"></i>
          ${products.map((p, i) => `<button class="dial__station" role="tab" aria-selected="${i === start}" data-tune="${i}"><span class="dial__freq" aria-hidden="true">${(88 + i * 3.1).toFixed(1)}</span>${esc(p.name)}</button>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

export function mountGallery(root) {
  const g = root.querySelector('[data-gallery]');
  if (!g) return;
  const n = products.length;
  const slots = [...g.querySelectorAll('[data-slot]')];
  const infos = [...g.querySelectorAll('[data-info]')];
  const scenesEl = [...g.querySelectorAll('[data-scene]')];
  const stations = [...g.querySelectorAll('[data-tune]')];
  const needle = g.querySelector('[data-needle]');
  let cur = Number(g.dataset.start) || 0;

  const layout = () => {
    slots.forEach((s, i) => {
      let d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      s.style.setProperty('--d', d);
      s.dataset.pos = d === 0 ? 'center' : Math.abs(d) === 1 ? 'near' : 'far';
      s.querySelector('[data-pick]').tabIndex = -1;
    });
    infos.forEach((el, i) => {
      const on = i === cur;
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-hidden', String(!on));
      el.toggleAttribute('inert', !on);
    });
    scenesEl.forEach((img, i) => {
      if ((i === cur || Math.abs(i - cur) === 1) && img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      img.classList.toggle('is-on', i === cur);
    });
    stations.forEach((b, i) => b.setAttribute('aria-selected', String(i === cur)));
    const st = stations[cur];
    if (st && needle) needle.style.left = `${st.offsetLeft + st.offsetWidth / 2}px`;
  };
  const go = (i) => {
    cur = (i + n) % n;
    layout();
  };
  g.querySelector('[data-prev]').addEventListener('click', () => go(cur - 1));
  g.querySelector('[data-next]').addEventListener('click', () => go(cur + 1));
  g.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.pick))));
  stations.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.tune))));
  g.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'ArrowLeft') go(cur - 1);
  });
  /* swipe */
  let sx = null;
  const track = g.querySelector('[data-track]');
  track.addEventListener('pointerdown', (e) => (sx = e.clientX));
  track.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });
  g.querySelectorAll('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      if (cart.add(b.dataset.add, 1)) openCartDrawer();
    })
  );
  const onResize = () => layout();
  window.addEventListener('resize', onResize);
  onPageCleanup(() => window.removeEventListener('resize', onResize));
  layout();
}
