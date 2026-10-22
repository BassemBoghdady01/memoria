/**
 * MEMÓRIA · Homepage — a cinematic memory that stays easy to shop.
 *
 *  1 HERO       a Cairo window over the Nile, the real bottle on the ledge
 *               (composited per product: colour, rim light, glass, shadow)
 *  2 OFFER      the launch price and the any-2 offer, from store settings
 *  3 GALLERY    one fragrance at a time in its own photographed place,
 *               price + Add to bag + WhatsApp always in reach, radio tuning band
 *  4 SPRAY      the Memory Spray scroll film (skippable, reversible)
 *  5 HERITAGE   25 years of perfume making (owner-editable copy)
 *  6 ARCHIVE    objects of memory
 *  7 WHATSAPP
 *
 * Copy, hero product, featured scent, heritage text and section visibility
 * are store settings (Dashboard → Website content). Products and prices
 * come from the database.
 */
import { esc } from '../utils.js';
import { products, settings, getProduct, getFeatured } from '../data/catalog.js';
import { gsap, motionOK, onPageCleanup } from '../motion.js';
import { waLink, waButton } from '../components/whatsapp.js';
import { campaign, campaignImg } from '../data/campaign.js';
import { priceBlock, offerLine } from '../components/price.js';
import { gallerySection, mountGallery } from '../components/gallery.js';
import { memorySpraySection, mountMemorySpray } from '../components/memorySpray.js';
import hero from '../data/hero.json';
import scenes from '../data/scenes.json';
import { setSeo } from '../seo.js';

const home = () => settings.home || {};
const on = (key) => home().sections?.[key] !== false;
const heritage = () => settings.heritage || {};

/* ————— 1 · hero ————— */

function heroSection() {
  const h = home().hero || {};
  const p = getProduct(h.product_slug) || getFeatured();
  const baked = p && hero.products.includes(p.slug);
  const years = heritage().years;
  const headline = h.headline || 'Every scent holds a memory.';
  const script = h.script && headline.includes(h.script) ? h.script : '';
  const [before, after] = script ? headline.split(script) : [headline, ''];
  const sub = h.subline || '';
  const custom = h.image_url;
  const desktopSet = baked ? hero.widths.map((w) => `/campaign/hero-${p.slug}-${w}.webp ${w}w`).join(', ') : '';
  const mobileSet = baked ? hero.mobileWidths.map((w) => `/campaign/hero-m-${p.slug}-${w}.webp ${w}w`).join(', ') : '';
  return `
  <section class="h4" aria-labelledby="hero-title" data-hero>
    <div class="h4__scene" aria-hidden="true">
      ${
        custom
          ? `<img class="h4__photo" src="${esc(custom)}" alt="" fetchpriority="high"/>`
          : baked
            ? `<picture>
                <source media="(max-width: 760px)" srcset="${mobileSet}" sizes="100vw"/>
                <img class="h4__photo" src="/campaign/hero-${p.slug}-1920.webp" srcset="${desktopSet}" sizes="100vw" alt="" fetchpriority="high" decoding="async" width="2600" height="1100" data-hero-photo/>
              </picture>`
            : campaign.hero
              ? `<img class="h4__photo" ${campaignImg(campaign.hero, { sizes: '100vw' })} alt="" fetchpriority="high"/>`
              : ''
      }
      <i class="h4__sun" data-sun></i>
      <i class="h4__grade"></i>
    </div>
    ${p ? `<a class="h4__product" href="/product/${esc(p.slug)}" aria-label="${esc(p.name)} — view the fragrance"><span class="sr-only">${esc(p.name)}</span></a>` : ''}

    <div class="container h4__inner">
      <div class="h4__copy">
        ${years ? `<p class="h4__heritage"><span>${esc(String(years))}</span> years of perfume craft · Cairo</p>` : ''}
        <h1 id="hero-title" class="h4__title">
          <span class="h4__caps">${esc(before.trim())}</span>
          ${script ? `<span class="h4__script">${esc(script)}${esc(after.trim())}<i class="h4__stroke" aria-hidden="true"></i></span>` : ''}
        </h1>
        ${sub ? `<p class="h4__sub">${esc(sub)}</p>` : ''}
        <div class="h4__ctas">
          <a class="btn btn--ink" href="#collection" data-to-collection>Shop now</a>
          <a class="btn btn--line" href="/our-story">Discover our story</a>
        </div>
      </div>
      ${
        p
          ? `<a class="h4__tag" href="/product/${esc(p.slug)}">
              <span class="h4__tagname">${esc(p.name)}</span>
              ${priceBlock(p, { cls: 'pblock--light', offer: false })}
            </a>`
          : ''
      }
    </div>
    <a class="h4__scroll" href="#collection" aria-label="Scroll to the collection"><i></i><span>Scroll</span></a>
  </section>`;
}

/* ————— 2 · offer ————— */

function offerSection() {
  const o = settings.offer || {};
  if (!o.enabled || !offerLine()) return '';
  const p = products[0];
  const v = p?.variants?.find((x) => x.price !== null);
  return `
  <section class="offer" aria-label="Current offer">
    <div class="container offer__inner">
      ${v && v.salePrice !== null ? `<p class="offer__price"><s>EGP ${v.price.toLocaleString('en-EG')}</s> <strong>EGP ${v.salePrice.toLocaleString('en-EG')}</strong> <span>per bottle</span></p>` : ''}
      <p class="offer__line"><span class="offer__script">${esc(o.headline)}</span>${o.detail ? `<small>${esc(o.detail)}</small>` : ''}</p>
      <a class="offer__link" href="/shop">Shop all fragrances →</a>
    </div>
  </section>`;
}

/* ————— 5 · heritage ————— */

function heritageSection() {
  const h = heritage();
  if (!h.title && !h.body) return '';
  const steps = h.steps?.length ? h.steps : ['Craftsmanship', 'Fragrance', 'Emotion', 'Memory'];
  const img = (id, cls, sizes) => (scenes[id] ? `<img class="${cls}" src="${esc(scenes[id].src)}" srcset="${esc(scenes[id].srcset)}" sizes="${sizes}" alt="" loading="lazy" decoding="async"/>` : '');
  return `
  <section class="heri" aria-labelledby="heri-title">
    <div class="heri__media" aria-hidden="true">
      <figure class="heri__frame">${img('heritage-apothecary', 'heri__img heri__img--solo', '(max-width: 900px) 100vw, 42vw') || img('heritage-line', 'heri__img heri__img--solo', '(max-width: 900px) 100vw, 42vw')}</figure>
    </div>
    <div class="heri__copy">
      ${h.years ? `<p class="heri__years" aria-hidden="true">${esc(String(h.years))}</p>` : ''}
      <h2 id="heri-title" class="heri__title">${esc(h.title || '')}${h.script ? `<span class="heri__script">${esc(h.script)}</span>` : ''}</h2>
      ${(h.body || '').split(/\n{2,}/).map((t) => `<p class="heri__body" data-reveal>${esc(t)}</p>`).join('')}
      <ol class="heri__chain">${steps.map((s, i) => `<li style="--i:${i}"><span>${esc(s)}</span></li>`).join('')}</ol>
      <a class="btn btn--line-light" href="/our-story">Our story</a>
    </div>
  </section>`;
}

/* ————— 6 · objects of memory ————— */

function memoriesSection() {
  const objs = (campaign.objects || []).slice(0, 3);
  if (!objs.length) return '';
  return `
  <section class="arch" aria-labelledby="arch-title">
    <div class="container">
      <div class="arch__head">
        <h2 id="arch-title" data-reveal>From the house archive</h2>
        <p data-reveal>A tuning dial, a letter, a photograph. Scent keeps what they keep.</p>
      </div>
      <div class="arch__grid">
        ${objs
          .map(
            (o, i) => `
          <figure class="arch__item" data-object="${esc(o.id)}" data-reveal style="--reveal-delay:${i * 80}ms" ${o.interactive ? 'tabindex="0" aria-label="Radio dial. Move across it, or use the arrow keys, to tune."' : ''}>
            <div class="arch__media">
              <img ${campaignImg(o, { sizes: '(max-width: 760px) 100vw, 33vw' })} alt="${esc(o.alt)}" loading="lazy" decoding="async"/>
              ${o.id === 'dial' ? '<i class="objects__needle" aria-hidden="true" data-needle></i>' : ''}
            </div>
            <figcaption>${esc(o.caption)}</figcaption>
          </figure>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

/* ————— 7 · whatsapp ————— */

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
    const featured = getProduct(home().featured_slug) || getFeatured();
    return [
      heroSection(),
      offerSection(),
      `<div id="collection"></div>`,
      on('collection') ? gallerySection(featured?.slug) : '',
      on('featured') ? memorySpraySection(featured, scenes.curtain) : '',
      on('story') ? heritageSection() : '',
      on('memories') ? memoriesSection() : '',
      on('whatsapp_band') ? whatsappSection() : '',
    ].join('');
  },

  mount(root) {
    setSeo({
      title: 'MEMÓRIA — Every Scent Holds a Memory',
      description: 'MEMÓRIA — 25 years of perfume craft in Cairo. Seven fragrances, each holding a memory. Order online with delivery across Egypt, or on WhatsApp.',
      path: '/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'MEMÓRIA', url: location.origin, logo: location.origin + '/brand/logo-black-560.png' },
    });
    document.body.classList.add('is-home');
    onPageCleanup(() => document.body.classList.remove('is-home'));

    const ok = motionOK();
    const mobile = window.matchMedia('(max-width: 760px)').matches;

    root.querySelectorAll('[data-to-collection], .h4__scroll').forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        root.querySelector('#collection')?.scrollIntoView({ behavior: ok ? 'smooth' : 'auto' });
      })
    );

    mountGallery(root);
    mountMemorySpray(root, { reduced: !ok, mobile });

    /* hero: a slow push-in and sunlight drifting across the room as you scroll */
    const heroEl = root.querySelector('[data-hero]');
    if (ok && heroEl) {
      gsap.from('.h4__copy > *', { y: 18, opacity: 0, duration: 1, stagger: 0.09, ease: 'power2.out', delay: 0.1 });
      gsap.fromTo('[data-hero-photo]', { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power2.out' });
      const tl = gsap.timeline({ scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: 0.7 } });
      tl.to('[data-hero-photo]', { yPercent: 5, ease: 'none' }, 0).to('[data-sun]', { xPercent: 30, opacity: 0.75, ease: 'none' }, 0);
      onPageCleanup(() => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
    }

    /* archive: the radio dial follows the pointer / arrow keys */
    const dialObj = root.querySelector('[data-object="dial"]');
    if (dialObj) {
      const needle = dialObj.querySelector('[data-needle]');
      dialObj.addEventListener('pointermove', (e) => {
        const r = dialObj.getBoundingClientRect();
        needle.style.setProperty('--x', `${8 + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 84}%`);
      });
      dialObj.addEventListener('keydown', (e) => {
        const c = parseFloat(needle.style.getPropertyValue('--x')) || 30;
        if (e.key === 'ArrowRight') needle.style.setProperty('--x', `${Math.min(92, c + 6)}%`);
        if (e.key === 'ArrowLeft') needle.style.setProperty('--x', `${Math.max(8, c - 6)}%`);
      });
    }

    /* heritage chain lights up step by step */
    const chain = root.querySelector('.heri__chain');
    if (chain) {
      const io = new IntersectionObserver(([e]) => e.isIntersecting && chain.classList.add('is-in'), { threshold: 0.4 });
      io.observe(chain);
      onPageCleanup(() => io.disconnect());
    }
  },
};
