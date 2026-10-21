/**
 * MEMÓRIA · Editorial homepage (art direction "Afternoon Light").
 * One room, one sun, one film stock.
 *
 *  edHero()        one still life: the real packshot on sunlit plaster,
 *                  one headline, one purchase action
 *  edIntro()       one sentence and the index of seven scents
 *  edCollection()  each scent as a magazine spread: the memory it is named
 *                  after, the bottle in the same light, name, price, buy
 *  edLight()       "The Light Changes": the bottle holds still while the
 *                  afternoon passes over it, then the memory (scroll-driven
 *                  cross-fades of real frames, no particles)
 *  edHeritage()    25 years, told in the owner's words with close details
 *                  of the real bottle (no stock "factory" imagery)
 *  edWhatsApp()    help choosing, in the same paper
 *
 * Images are built by scripts/build-stilllife.mjs (src/js/data/editorial.json).
 * Prices always come from the database; nothing here computes a total.
 */
import { esc, money } from '../utils.js';
import { settings, defaultVariant, unitPrice, isPurchasable, isSoldOut } from '../data/catalog.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { waLink, productMessage, enquiryMessage, waIcon } from './whatsapp.js';
import { offerLine } from './price.js';
import { onPageCleanup, ScrollTrigger } from '../motion.js';
import ed from '../data/editorial.json';
import { postmark } from './postmark.js';

const set = (name, widths) => widths.map((w) => `/editorial/${name}-${w}.webp ${w}w`).join(', ');
const no = (i) => String(i).padStart(2, '0');

function priceLine(p) {
  const v = defaultVariant(p);
  if (!v || v.price === null) return '<span>Price on request</span>';
  const sale = v.salePrice !== null && v.salePrice < v.price;
  return `${sale ? `<s>${money(v.price)}</s>` : ''}<strong>${money(unitPrice(v))}</strong>`;
}

/** "Liqaa means meeting. For the evening…" → ["Liqaa means meeting.", "For the evening…"] */
function splitTagline(t = '') {
  const [first, ...rest] = String(t).split(/(?<=\.)\s+/);
  return [first || '', rest.join(' ')];
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
    ${postmark({ cls: 'edh__postmark' })}
    ${p ? `<p class="edh__note" aria-hidden="true">No. 01 · ${esc(p.name)} · Cairo, four in the afternoon</p>` : ''}
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
    <a class="edh__scroll" href="#collection" data-ed-scroll aria-label="Scroll to the collection"><span>The collection</span><i aria-hidden="true"></i></a>
  </section>`;
}

/* ————— intro + index ————— */

export function edIntro(list) {
  const shown = list.filter((p) => ed.plate?.[p.slug]);
  if (!shown.length) return '';
  const offer = offerLine();
  return `
  <section class="edi" id="collection" aria-labelledby="edi-title">
    <p class="ed-label" data-reveal>The collection</p>
    <h2 id="edi-title" class="edi__title" data-reveal>${shown.length === 7 ? 'Seven' : shown.length} scents, each named<br/>for a moment.</h2>
    <p class="edi__sub" data-reveal>Wear the one you remember.${offer ? ` <span>${esc(offer)}.</span>` : ''}</p>
    <ol class="edi__index edi__film" data-reveal>
      ${shown
        .map(
          (p, i) => `
        <li><a href="#scent-${esc(p.slug)}" data-ed-jump>
          <span class="edi__thumb"><img src="/editorial/plate-${esc(p.slug)}-400.webp" alt="" loading="lazy" decoding="async" width="400" height="500"/></span>
          <span class="edi__no">${no(i + 1)}A</span>
          <span class="edi__name">${esc(p.name)}</span>
        </a></li>`
        )
        .join('')}
    </ol>
  </section>`;
}

/* ————— one scent, one spread ————— */

export function edSpread(p, { index = 1, flip = false } = {}) {
  if (!p) return '';
  const plate = ed.plate?.[p.slug];
  const memory = ed.memory?.[p.slug];
  if (!plate || !memory) return '';
  const v = defaultVariant(p);
  const buyable = isPurchasable(p);
  const sold = isSoldOut(p);
  const wa = waLink(buyable ? productMessage(p, v, 1) : enquiryMessage(p));
  const offer = offerLine();
  const [meaning, line] = splitTagline(p.story?.tagline);
  return `
  <section class="eds${flip ? ' eds--flip' : ''}" id="scent-${esc(p.slug)}" aria-labelledby="eds-${esc(p.slug)}">
    <figure class="eds__memory" data-reveal>
      <span class="eds__print">
        <img src="/editorial/memory-${esc(p.slug)}-1200.webp" srcset="${set(`memory-${p.slug}`, memory.widths)}" sizes="(max-width: 760px) 90vw, 34vw" alt="${esc(memory.alt || '')}" loading="lazy" decoding="async" width="${memory.w}" height="${memory.h}"/>
      </span>
      <figcaption class="eds__caption">No. ${no(index)} · ${esc(p.name)}${meaning ? ` · ${esc(meaning.replace(/.$/, ''))}` : ''}</figcaption>
      ${postmark({ cls: 'eds__postmark', top: esc(p.name), middle: no(index), bottom: 'CAIRO' })}
    </figure>
    <a class="eds__plate" href="/product/${esc(p.slug)}" data-reveal style="--reveal-delay:120ms" aria-label="${esc(p.name)}, view the fragrance">
      <img src="/editorial/plate-${esc(p.slug)}-1200.webp" srcset="${set(`plate-${p.slug}`, plate.widths)}" sizes="(max-width: 760px) 100vw, 33vw" alt="${esc(p.name)} bottle in afternoon light" loading="lazy" decoding="async" width="${plate.w}" height="${plate.h}"/>
    </a>
    <div class="eds__info" data-reveal style="--reveal-delay:220ms">
      <p class="ed-label">No. ${no(index)}</p>
      <h2 id="eds-${esc(p.slug)}" class="eds__name">${esc(p.name)}</h2>
      ${meaning ? `<p class="eds__meaning">${esc(meaning)}</p>` : ''}
      ${line ? `<p class="eds__line">${esc(line)}</p>` : ''}
      <div class="eds__price ed-price">${priceLine(p)}</div>
      ${offer && buyable ? `<p class="eds__offer">${esc(offer)}</p>` : ''}
      <div class="eds__actions">
        ${buyable ? `<button class="ed-btn ed-btn--block" type="button" data-ed-add="${esc(v.id)}">Add to bag</button>` : sold ? '<p class="eds__offer">Sold out for now</p>' : ''}
        ${wa ? `<a class="ed-btn ed-btn--line ed-btn--block" href="${esc(wa)}" target="_blank" rel="noopener">${waIcon()} ${buyable ? 'Order on WhatsApp' : 'Ask on WhatsApp'}</a>` : ''}
      </div>
      <a class="eds__more" href="/product/${esc(p.slug)}">View the fragrance</a>
    </div>
  </section>`;
}

export function edCollection(list) {
  return list
    .filter((p) => ed.plate?.[p.slug])
    .map((p, i) => edSpread(p, { index: i + 1, flip: i % 2 === 1 }))
    .join('');
}

/* ————— the light changes ————— */

const TIMES = ['Four in the afternoon', 'Five', 'Six. The light goes.'];

export function edLight(p) {
  const L = ed.light;
  const memory = ed.memory?.[L?.slug];
  if (!L || !p || p.slug !== L.slug || !memory) return '';
  const [meaning] = splitTagline(p.story?.tagline);
  const frame = (k) => `
      <picture class="edl__layer" data-layer="${k}">
        <source media="(max-width: 760px)" srcset="${set(L.mobile[k].name, L.mobile[k].widths)}" sizes="100vw"/>
        <img src="/editorial/${L.frames[k].name}-1920.webp" srcset="${set(L.frames[k].name, L.frames[k].widths)}" sizes="100vw" alt="" loading="lazy" decoding="async"/>
      </picture>`;
  return `
  <section class="edl" aria-labelledby="edl-title" data-edl>
    <div class="edl__pin">
      ${L.frames.map((_, k) => frame(k)).join('')}
      <img class="edl__layer edl__memory" data-layer="${L.frames.length}" src="/editorial/memory-${esc(p.slug)}-1600.webp" srcset="${set(`memory-${p.slug}`, memory.widths)}" sizes="100vw" alt="" loading="lazy" decoding="async"/>
      <i class="edl__veil" aria-hidden="true"></i>
      <ol class="edl__times" aria-hidden="true">${TIMES.map((t, k) => `<li data-time="${k}">${esc(t)}</li>`).join('')}</ol>
      <div class="edl__end" data-edl-end>
        <p class="ed-label">${esc(p.name)}</p>
        <h2 id="edl-title" class="edl__title">The light moves.<br/>The memory stays.</h2>
        ${meaning ? `<p class="edl__sub">${esc(p.story?.tagline || '')}</p>` : ''}
        <a class="ed-btn ed-btn--light" href="/product/${esc(p.slug)}">Discover ${esc(p.name)} · ${money(unitPrice(defaultVariant(p)))}</a>
      </div>
    </div>
  </section>`;
}

/* ————— heritage ————— */

export function edHeritage() {
  const h = settings.heritage || {};
  if (!h.title && !h.body) return '';
  const steps = (h.steps?.length ? h.steps : []).slice(0, 4);
  const details = ed.details || [];
  return `
  <section class="edr" aria-labelledby="edr-title">
    <div class="edr__head">
      ${h.years ? `<p class="edr__years" aria-hidden="true">${esc(String(h.years))}</p>` : ''}
      <div>
        <p class="ed-label" data-reveal>The house</p>
        <h2 id="edr-title" class="edr__title" data-reveal>${esc(h.title || '')}${h.script ? `<span>${esc(h.script)}</span>` : ''}</h2>
        ${(h.body || '').split(/\n{2,}/).map((t) => `<p class="edr__body" data-reveal>${esc(t)}</p>`).join('')}
        <a class="eds__more" href="/our-story" data-reveal>Our story</a>
      </div>
    </div>
    ${
      steps.length
        ? `<ol class="edr__chapters">
        ${steps
          .map((s, i) => {
            const d = details[i];
            return `
          <li data-reveal style="--reveal-delay:${i * 90}ms">
            ${d ? `<span class="edr__img"><img src="/editorial/detail-${esc(d.name)}-800.webp" srcset="${set(`detail-${d.name}`, d.widths)}" sizes="(max-width: 760px) 50vw, 22vw" alt="" loading="lazy" decoding="async" width="${d.w}" height="${d.h}"/></span>` : ''}
            <span class="edr__no">${no(i + 1)}</span>
            <span class="edr__step">${esc(s)}</span>
          </li>`;
          })
          .join('')}
      </ol>`
        : ''
    }
  </section>`;
}

/* ————— whatsapp ————— */

export function edWhatsApp() {
  const href = waLink('Hello MEMÓRIA, I would like help choosing a scent.');
  if (!href) return '';
  return `
  <section class="edw" aria-labelledby="edw-title">
    <p class="ed-label" data-reveal>Help choosing</p>
    <h2 id="edw-title" class="edw__title" data-reveal>Not sure which memory is yours?</h2>
    <p class="edw__sub" data-reveal>Tell us a place, a person or a season. We’ll suggest a scent, and you can order right there on WhatsApp.</p>
    <a class="ed-btn ed-btn--line" href="${esc(href)}" target="_blank" rel="noopener" data-reveal>${waIcon()} Chat on WhatsApp</a>
  </section>`;
}

/* ————— behaviour ————— */

export function mountEditorial(root, { reduced = false } = {}) {
  root.querySelectorAll('[data-ed-add]').forEach((b) => {
    const fn = () => {
      if (cart.add(b.dataset.edAdd, 1)) openCartDrawer();
    };
    b.addEventListener('click', fn);
    onPageCleanup(() => b.removeEventListener('click', fn));
  });

  root.querySelectorAll('[data-ed-scroll], [data-ed-jump]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const t = root.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    })
  );

  const hero = root.querySelector('[data-edh]');
  if (hero && !reduced) requestAnimationFrame(() => hero.classList.add('is-in'));
  else hero?.classList.add('is-in', 'is-still');

  // the light changes: stacked frames cross-fade with scroll progress
  const light = root.querySelector('[data-edl]');
  if (light) {
    const layers = [...light.querySelectorAll('[data-layer]')];
    const times = [...light.querySelectorAll('[data-time]')];
    const end = light.querySelector('[data-edl-end]');
    const stages = layers.length - 1;
    const paint = (p) => {
      const stage = p * stages * 1.15; // hold the memory a little at the end
      layers.forEach((l, k) => {
        if (k) l.style.opacity = String(Math.max(0, Math.min(1, stage - (k - 1))));
      });
      const now = Math.min(times.length - 1, Math.floor(stage + 0.2));
      times.forEach((t, k) => t.classList.toggle('is-on', k === now && stage < stages - 0.35));
      end.classList.toggle('is-on', stage >= stages - 0.35);
    };
    if (reduced) {
      light.classList.add('is-still');
      paint(1);
    } else {
      paint(0);
      const st = ScrollTrigger.create({ trigger: light, start: 'top top', end: 'bottom bottom', onUpdate: (self) => paint(self.progress) });
      onPageCleanup(() => st.kill());
    }
  }
}
