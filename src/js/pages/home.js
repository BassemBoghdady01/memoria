/**
 * MEMÓRIA · Homepage.
 *
 * Rhythm: CAMPAIGN HERO (real photograph + the real bottle) → THE
 * COLLECTION (every scent, buyable) → FEATURED SCENT (turn the bottle
 * through its photographed angles) → OBJECTS OF MEMORY (photographed
 * props, small interactions) → HOUSE STORY (owner-written) → WHATSAPP.
 *
 * Copy, hero imagery, featured scent and section visibility come from
 * store settings, editable in the dashboard.
 */
import { esc, money } from '../utils.js';
import { products, settings, getProduct, getFeatured, defaultVariant, unitPrice, isPurchasable, pricedVariants } from '../data/catalog.js';
import { productImg, productCutout } from '../components/render.js';
import { mountProductCards, priceLabel } from '../components/productCard.js';
import { gsap, motionOK, onPageCleanup } from '../motion.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from '../components/cartDrawer.js';
import { waLink, waButton, productMessage, enquiryMessage } from '../components/whatsapp.js';
import { campaign, campaignImg } from '../data/campaign.js';
import { setSeo } from '../seo.js';

const home = () => settings.home || {};
const on = (key) => home().sections?.[key] !== false;

/* ————— hero ————— */

function heroSection() {
  const h = home().hero || {};
  const p = getProduct(h.product_slug) || getFeatured();
  const scene = h.image_url ? { src: h.image_url } : campaign.hero;
  const sceneMobile = h.mobile_image_url ? { src: h.mobile_image_url } : campaign.heroMobile || scene;
  const headline = h.headline || 'Every scent holds a memory.';
  const script = h.script || '';
  const [before, after] = script && headline.includes(script) ? headline.split(script) : [headline, null];
  return `
  <section class="chero" aria-labelledby="hero-title" data-hero>
    <div class="chero__scene ${scene ? '' : 'chero__scene--studio'}" aria-hidden="true">
      ${
        scene
          ? `<picture>
              ${sceneMobile && sceneMobile !== scene ? `<source media="(max-width: 760px)" ${campaignImg(sceneMobile, { attrsOnly: true })}/>` : ''}
              <img class="chero__photo" ${campaignImg(scene, { attrsOnly: true })} alt="" fetchpriority="high" decoding="async" data-hero-photo/>
            </picture>`
          : ''
      }
      <i class="chero__light" data-hero-light></i>
      <i class="chero__grade"></i>
    </div>
    ${
      p
        ? `<div class="chero__product" data-hero-bottle>
            ${productCutout(p, { cls: 'chero__bottle', sizes: '(max-width: 760px) 58vw, 30vw', eager: true, alt: `${p.name} by MEMÓRIA` })}
            <i class="chero__contact" aria-hidden="true"></i>
          </div>`
        : ''
    }
    <div class="container chero__inner">
      <div class="chero__copy">
        ${h.eyebrow ? `<p class="chero__eyebrow">${esc(h.eyebrow)}</p>` : ''}
        <h1 id="hero-title" class="chero__title">
          ${after !== null ? `${esc(before)}<span class="brandword">${esc(script)}</span>${esc(after)}` : esc(headline)}
        </h1>
        ${h.subline ? `<p class="chero__sub">${esc(h.subline)}</p>` : ''}
        <div class="chero__ctas">
          <a class="btn btn--light" href="/shop">Shop the collection</a>
          <a class="btn btn--ghost-light" href="/our-story">Our story</a>
        </div>
        ${p ? `<a class="chero__caption" href="/product/${esc(p.slug)}"><span>${esc(p.name)}</span><span>${esc(priceLabel(p))}</span></a>` : ''}
      </div>
    </div>
    ${campaign.hero?.credit ? `<p class="chero__credit">Photograph: ${esc(campaign.hero.credit)}</p>` : ''}
  </section>`;
}

/* ————— the collection ————— */

function lineupItem(p) {
  const v = defaultVariant(p);
  const buy = isPurchasable(p)
    ? `<button class="btn btn--small btn--quickadd lineup__add" data-add="${esc(v.id)}">Add</button>`
    : '';
  return `
  <div class="lineup__item" data-pcard="${esc(p.slug)}">
    <a class="lineup__link" href="/product/${esc(p.slug)}" aria-label="${esc(p.name)}, ${esc(priceLabel(p))}"></a>
    ${productCutout(p, { cls: 'lineup__bottle', sizes: '(max-width: 760px) 40vw, 14vw' })}
    <strong class="lineup__name">${esc(p.name)}</strong>
    ${p.category ? `<span class="lineup__for">${esc(p.category.name)}</span>` : ''}
    <span class="lineup__price">${esc(priceLabel(p))}</span>
    ${buy}
  </div>`;
}

function collectionSection() {
  return `
  <section class="lineup" id="collection" aria-labelledby="collection-title">
    <div class="container">
      <div class="lineup__head">
        <h2 id="collection-title" class="lineup__title" data-reveal>The collection</h2>
        <p class="lineup__subtitle" data-reveal>${products.length} scents. One bottle, a different memory inside each.</p>
      </div>
      <div class="lineup__row" data-collection-grid>${products.map(lineupItem).join('')}</div>
      <p class="lineup__more" data-reveal><a class="link-line" href="/shop">Browse the collection →</a></p>
    </div>
  </section>`;
}

/* ————— featured scent ————— */

const TURN = ['Opposite three-quarter', 'Front', 'Three-quarter', 'Side'];

function featuredSection() {
  const p = getProduct(home().featured_slug) || getFeatured();
  if (!p) return '';
  const v = defaultVariant(p);
  const priced = pricedVariants(p).length > 0;
  const frames = TURN.map((l) => p.gallery.find((g) => g.view === l)).filter(Boolean);
  const notes = [...p.notes.top, ...p.notes.heart, ...p.notes.base].slice(0, 6);
  return `
  <section class="feature" aria-labelledby="feature-title">
    <div class="container feature__inner">
      <div class="feature__stage" data-turn>
        ${frames
          .map((f, i) => productImg(p, { image: f, cls: `feature__frame${f.view === 'Front' ? ' is-on' : ''}`, sizes: '(max-width: 900px) 90vw, 45vw', alt: i ? '' : f.alt }))
          .join('')}
        <i class="feature__sheen" aria-hidden="true" data-sheen></i>
        ${frames.length > 1 ? `<input class="feature__dial" type="range" min="0" max="${frames.length - 1}" step="1" value="${Math.max(0, frames.findIndex((f) => f.view === 'Front'))}" aria-label="Turn the bottle" data-turn-dial/>` : ''}
      </div>
      <div class="feature__copy">
        <p class="label" data-reveal>Featured scent</p>
        <h2 id="feature-title" class="feature__name" data-reveal>${esc(p.name)}</h2>
        ${p.shortDescription ? `<p class="feature__desc" data-reveal>${esc(p.shortDescription)}</p>` : ''}
        ${notes.length ? `<p class="feature__notes" data-reveal>${esc(notes.join(' · '))}</p>` : ''}
        <div class="feature__buy" data-reveal>
          ${
            priced && v
              ? `<span class="feature__price">${money(unitPrice(v))}${v.label ? ` <small>${esc(v.label)}</small>` : ''}</span>
                 <button class="btn btn--primary" data-add="${esc(v.id)}" ${v.inStock ? '' : 'disabled'}>${v.inStock ? 'Add to bag' : 'Sold out'}</button>
                 ${waButton(waLink(productMessage(p, v, 1)), 'Order via WhatsApp', 'btn--ghost')}`
              : `<span class="feature__price feature__price--muted">Price on request</span>
                 ${waButton(waLink(enquiryMessage(p)), 'Ask on WhatsApp', 'btn--ghost')}`
          }
          <a class="link-line" href="/product/${esc(p.slug)}">Discover ${esc(p.name)}</a>
        </div>
        ${frames.length > 1 ? '<p class="feature__hint">Turn the dial: every angle is a real photograph of the bottle.</p>' : ''}
      </div>
    </div>
  </section>`;
}

/* ————— objects of memory (photographed props) ————— */

function memoriesSection() {
  const objs = campaign.objects || [];
  if (!objs.length) return '';
  return `
  <section class="objects" aria-labelledby="objects-title">
    <div class="container">
      <div class="objects__head">
        <h2 id="objects-title" data-reveal>Objects that remember</h2>
        <p data-reveal>A tuning dial, a cassette, a key to a house you left. Scent works the same way.</p>
      </div>
      <div class="objects__grid">
        ${objs
          .map(
            (o, i) => `
          <figure class="objects__item objects__item--${esc(o.id)}" data-object="${esc(o.id)}" data-reveal style="--reveal-delay:${i * 70}ms" ${o.interactive ? 'tabindex="0"' : ''}>
            <div class="objects__media">
              <img ${campaignImg(o, { attrsOnly: true })} alt="${esc(o.alt)}" loading="lazy" decoding="async" data-parallax/>
              ${o.id === 'dial' ? '<i class="objects__needle" aria-hidden="true" data-needle></i>' : ''}
            </div>
            <figcaption><span>${esc(o.caption)}</span>${o.credit ? `<small>Photo: ${esc(o.credit)}</small>` : ''}</figcaption>
          </figure>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

/* ————— house story (owner-written) ————— */

function storySection() {
  const s = home().story || {};
  if (!s.title && !s.body) return '';
  return `
  <section class="hstory" aria-labelledby="hstory-title">
    <div class="container hstory__inner">
      ${s.image_url ? `<img class="hstory__img" src="${esc(s.image_url)}" alt="" loading="lazy" />` : ''}
      <div class="hstory__copy">
        ${s.title ? `<h2 id="hstory-title" data-reveal>${esc(s.title)}</h2>` : '<h2 id="hstory-title" class="sr-only">Our story</h2>'}
        ${(s.body || '')
          .split(/\n{2,}/)
          .map((para) => `<p data-reveal>${esc(para)}</p>`)
          .join('')}
        <a class="link-line" href="/our-story" data-reveal>Our story →</a>
      </div>
    </div>
  </section>`;
}

/* ————— whatsapp band ————— */

function whatsappSection() {
  const href = waLink('Hello MEMÓRIA, I would like help choosing a scent.');
  if (!href) return '';
  return `
  <section class="waband" aria-labelledby="waband-title">
    <div class="container waband__inner">
      <div>
        <h2 id="waband-title" data-reveal>Not sure which memory is yours?</h2>
        <p data-reveal>Message the house on WhatsApp. We’ll help you choose, and you can order right there.</p>
      </div>
      <div data-reveal>${waButton(href, 'Chat on WhatsApp', 'btn--light')}</div>
    </div>
  </section>`;
}

export default {
  title: 'MEMÓRIA — Every Scent Holds a Memory',

  render() {
    return [
      heroSection(),
      on('collection') ? collectionSection() : '',
      on('featured') ? featuredSection() : '',
      on('memories') ? memoriesSection() : '',
      on('story') ? storySection() : '',
      on('whatsapp_band') ? whatsappSection() : '',
    ].join('');
  },

  mount(root) {
    setSeo({
      title: 'MEMÓRIA — Every Scent Holds a Memory',
      description: 'MEMÓRIA is an Egyptian perfume house. Discover the collection, order online with delivery across Egypt, or order on WhatsApp.',
      path: '/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'MEMÓRIA', url: location.origin, logo: location.origin + '/brand/logo-brown-560.png' },
    });
    mountProductCards(root.querySelector('[data-collection-grid]'));
    root.querySelectorAll('.feature [data-add]').forEach((b) =>
      b.addEventListener('click', () => {
        if (cart.add(b.dataset.add, 1)) openCartDrawer();
      })
    );

    const ok = motionOK();
    const wide = window.matchMedia('(min-width: 880px)').matches;

    /* hero: slow light across the room, the camera drifts a touch on scroll */
    const hero = root.querySelector('[data-hero]');
    if (ok && hero) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.7 } });
      tl.to('[data-hero-photo]', { yPercent: 6, scale: 1.04, ease: 'none' }, 0)
        .to('[data-hero-bottle]', { yPercent: -6, ease: 'none' }, 0)
        .to('[data-hero-light]', { xPercent: 18, opacity: 0.55, ease: 'none' }, 0);
      onPageCleanup(() => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
      gsap.from('.chero__copy > *', { y: 18, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out', delay: 0.1 });
      gsap.from('[data-hero-bottle]', { y: 26, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
    }

    /* featured: turn the bottle through its real photographed angles */
    const turn = root.querySelector('[data-turn]');
    if (turn) {
      const frames = [...turn.querySelectorAll('.feature__frame')];
      const dial = turn.querySelector('[data-turn-dial]');
      const show = (i) => frames.forEach((f, j) => f.classList.toggle('is-on', j === i));
      dial?.addEventListener('input', () => show(Number(dial.value)));
      let sx = null;
      let si = 0;
      turn.addEventListener('pointerdown', (e) => {
        if (e.target === dial) return;
        sx = e.clientX;
        si = Number(dial?.value || 0);
        turn.setPointerCapture(e.pointerId);
      });
      turn.addEventListener('pointermove', (e) => {
        if (sx === null || !dial) return;
        const i = Math.max(0, Math.min(frames.length - 1, si + Math.round((e.clientX - sx) / 70)));
        dial.value = i;
        show(i);
      });
      const end = () => (sx = null);
      turn.addEventListener('pointerup', end);
      turn.addEventListener('pointercancel', end);
      if (ok) {
        const sheen = gsap.fromTo(
          turn.querySelector('[data-sheen]'),
          { xPercent: -140 },
          { xPercent: 140, ease: 'none', scrollTrigger: { trigger: turn, start: 'top 85%', end: 'bottom 15%', scrub: 0.6 } }
        );
        onPageCleanup(() => {
          sheen.scrollTrigger?.kill();
          sheen.kill();
        });
      }
    }

    /* objects: the radio dial follows the pointer; restrained parallax */
    const dialObj = root.querySelector('[data-object="dial"]');
    if (dialObj) {
      const needle = dialObj.querySelector('[data-needle]');
      const move = (x) => {
        const r = dialObj.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (x - r.left) / r.width));
        needle.style.setProperty('--x', `${8 + t * 84}%`);
      };
      dialObj.addEventListener('pointermove', (e) => move(e.clientX));
      dialObj.addEventListener('keydown', (e) => {
        const cur = parseFloat(needle.style.getPropertyValue('--x')) || 30;
        if (e.key === 'ArrowRight') needle.style.setProperty('--x', `${Math.min(92, cur + 6)}%`);
        if (e.key === 'ArrowLeft') needle.style.setProperty('--x', `${Math.max(8, cur - 6)}%`);
      });
    }
    if (ok && wide) {
      root.querySelectorAll('.objects [data-parallax]').forEach((img, i) => {
        const tw = gsap.fromTo(img, { yPercent: -4 - (i % 3) }, { yPercent: 4 + (i % 3), ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
        onPageCleanup(() => {
          tw.scrollTrigger?.kill();
          tw.kill();
        });
      });
    }
  },
};
