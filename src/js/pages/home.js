/**
 * MEMÓRIA · Homepage — "the memory desk".
 * Layered collage hero, catalogue-plate collection, and the signature
 * sequence where the fragrance escapes the bottle and becomes a memory.
 */
import { esc, money, isNarrow, isTouch } from '../utils.js';
import { products, getFeatured, genderLabel, minPrice } from '../data/products.js';
import { archiveEras } from '../data/archive.js';
import { renderBottleStage } from '../components/bottle.js';
import { renderMotif, renderNoteIcon } from '../components/artwork.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';
import { icons } from '../components/icons.js';
import { openFinder } from '../components/finder.js';
import {
  gsap, ScrollTrigger, motionOK, attachTilt, floatBottle, sweepBottle, driftMist, onPageCleanup,
} from '../motion.js';
import { renderRoute } from '../router.js';

const featured = getFeatured();

/* Jasmine sprig laid across the desk */
const SPRIG = `
<svg viewBox="0 0 160 90" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
  <path d="M6 78 C 40 66, 90 48, 150 16"/>
  <path d="M38 66 q -2 -14 8 -20 q 4 12 -8 20Z" fill="currentColor" fill-opacity="0.12"/>
  <path d="M64 55 q -1 -13 9 -18 q 3 11 -9 18Z" fill="currentColor" fill-opacity="0.12"/>
  <path d="M92 42 q 0 -12 10 -16 q 2 10 -10 16Z" fill="currentColor" fill-opacity="0.12"/>
  <g fill="#f1e9d8" stroke-width="1.1">
    <circle cx="120" cy="28" r="4.2"/><circle cx="130" cy="20" r="3.4"/>
    <circle cx="138" cy="27" r="3"/><circle cx="128" cy="33" r="2.7"/>
  </g>
  <circle cx="128" cy="27" r="1.4" fill="currentColor" stroke="none" opacity="0.7"/>
</svg>`;

/* ————— HERO ————— */
function heroSection() {
  return `
  <section class="hero" aria-label="MEMÓRIA — every scent holds a memory">
    <div class="hero__bg" data-hero-bg>
      <div class="hero__lattice" data-hero-lattice></div>
      <div class="hero__glow"></div>
    </div>

    <div class="container hero__inner">
      <div class="hero__copy">
        <span class="hero__eyebrow" data-desk data-depth="0.2">
          <span class="rule" aria-hidden="true"></span>
          <span class="label">MEMÓRIA · Twenty Years of Scents · Cairo</span>
        </span>
        <h1 class="hero__title" data-desk data-depth="0.12">
          <span class="t-line">Every scent</span>
          <span class="t-line">holds a <span class="t-chip">memory.</span></span>
        </h1>
        <p class="hero__lede" data-desk data-depth="0.18">
          Six perfumes, two decades of Cairo evenings, rooftops and letters —
          each bottle keeps one hour of the city.
        </p>
        <div class="hero__ctas" data-desk data-depth="0.15">
          <a class="btn btn--primary" href="/shop">Shop the Collection</a>
          <a class="btn" href="/our-story">Our Story</a>
        </div>
        <div class="hero__meta" data-desk data-depth="0.1">
          <span class="stamp">Catalogue Vol. VI</span>
          <span class="stamp">Nº 01 – 06 · Eau de Parfum</span>
          <span class="stamp">For Her · For Him</span>
        </div>
      </div>

      <div class="hero__fig">
        <div class="hero__shelf" aria-hidden="true"></div>
        <div data-desk data-depth="1" data-hero-bottle>
          ${renderBottleStage(featured, { mists: 3, reflection: true })}
        </div>
        <span class="hero__fignote stamp" aria-hidden="true">Fig. ${featured.number} — ${esc(featured.name)} · Eau de Parfum</span>
      </div>
    </div>

    <!-- the desk: paper artifacts at different depths -->
    <figure class="collage__item collage__photo" style="--r:-4deg" data-desk data-depth="0.45" aria-hidden="true">
      <span class="tape tape--tl"></span><span class="tape tape--tr"></span>
      ${renderMotif('balcony', { title: '' })}
      <figcaption><span class="hand">the balcony, at dusk</span><span class="stamp">FIG. 01 · CAIRO</span></figcaption>
    </figure>

    <figure class="collage__item collage__note" style="--r:2.5deg" data-desk data-depth="0.6" aria-hidden="true">
      <span class="hand">jasmine, 6 pm —<br/>keep this one.</span>
      <span class="stamp">— the perfumer’s note</span>
    </figure>

    <figure class="collage__item collage__polaroid" style="--r:5deg" data-desk data-depth="0.8" aria-hidden="true">
      ${renderMotif('felucca', { title: '' })}
      <span class="hand">the river, later</span>
    </figure>

    <figure class="collage__item collage__stamp" style="--r:-7deg" data-desk data-depth="0.9" aria-hidden="true">
      ${renderNoteIcon('reed')}
      <span class="stamp">CAIRO · POSTES</span>
      <span class="collage__postmark">Memória<br/>· kept ·</span>
    </figure>

    <span class="collage__item collage__sprig" style="--r:8deg" data-desk data-depth="0.7" aria-hidden="true">${SPRIG}</span>

    <div class="hero__scrollcue" aria-hidden="true">
      <span class="stamp">Scroll</span>
      <span class="line"></span>
    </div>
  </section>`;
}

/* ————— COLLECTION (immediately after the hero) ————— */
function collectionSection() {
  return `
  <section class="section--tight homecoll" aria-labelledby="coll-title" style="padding-top: var(--space-6)">
    <div class="container">
      <div class="plate-head">
        <div class="plate-head__rules" data-reveal><span class="stamp">Plate I · The Catalogue</span></div>
        <h2 id="coll-title" data-reveal>The <em>Collection</em></h2>
        <p class="serif-lede" data-reveal>Six scents, twenty years in the making. Each keeps one memory — find yours.</p>
        <div class="filters" role="group" aria-label="Filter collection" data-reveal>
          <button class="filter-tab" data-filter="all" aria-pressed="true">All</button>
          <button class="filter-tab" data-filter="her" aria-pressed="false">Women</button>
          <button class="filter-tab" data-filter="him" aria-pressed="false">Men</button>
        </div>
      </div>
      <div data-collection-grid>
        ${renderProductGrid(products)}
      </div>
      <div class="homecoll__foot" data-reveal>
        <a class="link-line" href="/shop">Open the full catalogue</a>
      </div>
    </div>
  </section>`;
}

/* ————— CINE — the fragrance becomes a memory ————— */
function cineSection() {
  const p = featured;
  return `
  <section class="cine" data-cine aria-label="The fragrance becomes a memory">
    <div class="cine__stage" data-cine-stage>
      <div class="cine__vignette" data-cine-vignette></div>

      <div class="cine__copy cine__copy--intro" data-cine-intro>
        <span class="stamp">Chapter I · The Scent</span>
        <h2>Come closer —<br/>this one remembers.</h2>
      </div>

      <div class="cine__copy cine__copy--outro" data-cine-outro style="opacity:0">
        <span class="stamp">Nº ${p.number} · ${esc(p.fragranceFamily)}</span>
        <h2>…and the scent became a place.</h2>
      </div>

      <div class="cine__bottlewrap" data-cine-bottle>
        ${renderBottleStage(p, { mists: 0, reflection: true })}
      </div>

      <div class="cine__mistcol" data-cine-mistcol aria-hidden="true"></div>

      <div class="cine__memory" data-cine-memory>
        <figure class="cine__side cine__side--l" data-cine-side style="left:14%; top:24%">
          ${renderMotif('city', { title: '' })}
          <span class="hand">home, from the roof</span>
        </figure>
        <figure class="cine__side cine__side--r" data-cine-side style="right:13%; bottom:20%">
          ${renderMotif('letter', { title: '' })}
          <span class="hand">a letter, kept</span>
        </figure>
        <figure class="cine__photo" data-cine-photo>
          ${renderMotif('balcony', { title: esc(p.memoryPlace) })}
          <span class="hand" data-cine-caption>${esc(p.memoryPlace.toLowerCase())} — ${p.archiveYear}*</span>
        </figure>
      </div>

      <div class="cine__final" data-cine-final>
        <p>“${esc(p.shortDescription)}”</p>
        <a class="btn btn--primary" href="/product/${p.slug}">Discover Nº ${p.number} — ${esc(p.name)}</a>
      </div>
    </div>
  </section>`;
}

/* ————— Memory strip ————— */
function memstripSection() {
  return `
  <section class="memstrip" aria-labelledby="memstrip-title">
    <div class="container memstrip__inner">
      <div class="memstrip__copy">
        <span class="stamp" data-reveal>Chapter II · Cairo</span>
        <h2 id="memstrip-title" data-reveal>A house built on <em>kept moments</em></h2>
        <p data-reveal>
          For twenty years we have bottled the hours this city gave us — jasmine
          climbing a balcony rail, linen drying in the morning sun, the river wind
          at dusk. The perfumes changed. The memories didn’t.
        </p>
        <a class="btn" href="/our-story" data-reveal>Read Our Story</a>
      </div>
      <div class="memstrip__stack" data-memstack>
        <div class="acard" style="--tilt:-3deg" data-reveal>
          <div class="acard__img">${renderMotif('balcony', { title: 'Jasmine on the balcony rail' })}</div>
          <div class="acard__caption"><span class="hand">jasmine, 6 pm</span><span class="stamp">FIG. 01</span></div>
        </div>
        <div class="acard" style="--tilt:2.5deg; --reveal-delay:120ms" data-reveal>
          <div class="acard__img">${renderMotif('felucca', { title: 'Feluccas on the Nile at dusk' })}</div>
          <div class="acard__caption"><span class="hand">the river, later</span><span class="stamp">FIG. 02</span></div>
        </div>
        <div class="acard" style="--tilt:-1.5deg; --reveal-delay:220ms" data-reveal>
          <div class="acard__img">${renderMotif('linenline', { title: 'Linen drying on the roof' })}</div>
          <div class="acard__caption"><span class="hand">sunday, washed</span><span class="stamp">FIG. 03</span></div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ————— Six-scent showcase ————— */
function showcaseSection() {
  const slides = products
    .map(
      (p, i) => `
      <div class="showcase__slide" data-slide="${i}">
        <div class="showcase__left">
          <span class="showcase__no" aria-hidden="true">Nº ${p.number}</span>
          <h3 class="showcase__name">${esc(p.name)}</h3>
          <span class="label label--faint">${genderLabel(p.gender)} · ${esc(p.fragranceFamily)}</span>
          <p class="showcase__desc">${esc(p.shortDescription)}</p>
        </div>
        <div style="position:relative">
          <figure class="showcase__slidememory" aria-hidden="true">${renderMotif((p.motifs && p.motifs[0]) || 'sketch', { title: '' })}</figure>
          ${renderBottleStage(p, { mists: 2, reflection: true })}
        </div>
        <div class="showcase__right">
          <div class="showcase__noterow"><span class="label">Top Notes</span><p>${esc(p.topNotes.join(', '))}</p></div>
          <div class="showcase__noterow"><span class="label">Heart Notes</span><p>${esc(p.heartNotes.join(', '))}</p></div>
          <div class="showcase__noterow"><span class="label">Base Notes</span><p>${esc(p.baseNotes.join(', '))}</p></div>
          <a class="btn btn--small" href="/product/${p.slug}">View Nº ${p.number}</a>
        </div>
      </div>`
    )
    .join('');

  const railCards = products
    .map(
      (p) => `
      <div class="showcase__railcard">
        <span class="stamp">Nº ${p.number} · ${genderLabel(p.gender)}</span>
        ${renderBottleStage(p, { mists: 0 })}
        <h3 class="showcase__name">${esc(p.name)}</h3>
        <p class="showcase__desc">${esc(p.shortDescription)}</p>
        <a class="btn btn--small" href="/product/${p.slug}">View Nº ${p.number}</a>
      </div>`
    )
    .join('');

  return `
  <section class="showcase" aria-label="Six scents, one by one">
    <div class="showcase__pin" data-showcase-pin>
      <div class="showcase__head">
        <span class="stamp">The Six · In Order</span>
      </div>
      <div class="showcase__slides" data-showcase-slides>${slides}</div>
      <div class="showcase__progress" aria-hidden="true" data-showcase-progress>
        ${products.map(() => `<span class="showcase__tick"></span>`).join('')}
      </div>
    </div>
    <div class="showcase__scroller">
      <div class="plate-head">
        <div class="plate-head__rules" data-reveal><span class="stamp">The Six · In Order</span></div>
        <h2 data-reveal>One by one</h2>
      </div>
      <div class="showcase__rail">${railCards}</div>
    </div>
  </section>`;
}

/* ————— Archive preview ————— */
function archivePreviewSection() {
  return `
  <section class="section" aria-labelledby="archprev-title">
    <div class="container">
      <div class="plate-head">
        <div class="plate-head__rules" data-reveal><span class="stamp">Vol. I – VI · Placeholder years</span></div>
        <h2 id="archprev-title" data-reveal>The MEMÓRIA <em>Archive</em></h2>
        <p class="serif-lede" data-reveal>Twenty years of labels, letters and light — kept, not curated.</p>
      </div>
      <div class="archprev__rail" data-reveal tabindex="0" aria-label="Archive timeline preview — scroll horizontally">
        ${archiveEras
          .map(
            (era) => `
          <a class="archprev__year" href="/archive">
            <span class="year">${era.year}</span>
            <span class="stamp">${esc(era.tag)}</span>
            <p>${esc(era.title)}</p>
          </a>`
          )
          .join('')}
      </div>
      <div class="homecoll__foot" data-reveal>
        <a class="btn" href="/archive">Open the Archive</a>
      </div>
    </div>
  </section>`;
}

function finderBandSection() {
  return `
  <section class="finderband" aria-labelledby="finder-title">
    <div class="container finderband__inner">
      <span class="stamp" data-reveal>Not sure where to begin?</span>
      <h2 id="finder-title" data-reveal>Find <em>your</em> memory</h2>
      <p data-reveal>Three small questions — a mood, a person, an hour — and we’ll match you to the scents that remember the same things you do.</p>
      <button class="btn btn--ghost-light" data-open-finder data-reveal>Begin — it takes a minute</button>
    </div>
  </section>`;
}

function valuesSection() {
  return `
  <section class="values" aria-label="From our hands to yours">
    <div class="container">
      <div class="values__grid">
        <div class="value" data-reveal>
          ${icons.truck()}
          <h3>Careful Delivery</h3>
          <p>Every bottle wrapped by hand and delivered to your door.</p>
        </div>
        <div class="value" data-reveal style="--reveal-delay:100ms">
          ${icons.seal()}
          <h3>House Original</h3>
          <p>Blended and bottled by MEMÓRIA — every scent is our own.</p>
        </div>
        <div class="value" data-reveal style="--reveal-delay:200ms">
          ${icons.returns()}
          <h3>Easy Exchanges</h3>
          <p>Unopened bottles may be exchanged — details at checkout.</p>
        </div>
      </div>
    </div>
  </section>`;
}

export default {
  title: 'MEMÓRIA — Every Scent Holds a Memory',
  render() {
    return `
      ${heroSection()}
      ${collectionSection()}
      ${cineSection()}
      ${memstripSection()}
      ${showcaseSection()}
      ${archivePreviewSection()}
      ${finderBandSection()}
      ${valuesSection()}
    `;
  },

  mount(root) {
    /* ——— Collection filter ——— */
    const grid = root.querySelector('[data-collection-grid]');
    const tabs = root.querySelectorAll('.filter-tab');
    let disposeCards = mountProductCards(root);
    tabs.forEach((tab) =>
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
        const f = tab.dataset.filter;
        const list = f === 'all' ? products : products.filter((p) => p.gender === f);
        disposeCards();
        grid.innerHTML = renderProductGrid(list);
        grid.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('is-in'));
        disposeCards = mountProductCards(grid);
      })
    );

    root.querySelector('[data-open-finder]').addEventListener('click', openFinder);

    /* ——— HERO: the desk assembles, then breathes ——— */
    const hero = root.querySelector('.hero');
    const deskItems = hero.querySelectorAll('[data-desk]');
    const heroBottleWrap = hero.querySelector('[data-hero-bottle]');
    const heroStage = heroBottleWrap.querySelector('.bottle-stage');

    onPageCleanup(floatBottle(heroStage, { y: 9, dur: 5.5 }));
    onPageCleanup(sweepBottle(heroStage, { every: 4 }));
    onPageCleanup(driftMist(hero.querySelector('.hero__fig'), { opacity: 0.6 }));
    onPageCleanup(attachTilt(hero.querySelector('.hero__fig'), { max: 9 }));

    if (motionOK()) {
      /* entrance: artifacts are laid on the desk one by one */
      const tl = gsap.timeline();
      tl.from(deskItems, {
        y: 44,
        opacity: 0,
        rotation: (i, el) => (parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0) * 2.4,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power3.out',
        clearProps: 'opacity',
      });

      /* physical presence: continuous slow sway on the stage (tilt rides on the svg) */
      gsap.set(heroBottleWrap, { transformPerspective: 800 });
      gsap.to(heroBottleWrap, {
        rotationY: 7,
        duration: 6.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      /* lattice light drifts like sun through a screen */
      gsap.to(hero.querySelector('[data-hero-lattice]'), {
        backgroundPosition: '120px 60px',
        duration: 60,
        ease: 'none',
        repeat: -1,
      });

      /* slow ambient push-in + depth parallax while scrolling away */
      gsap.fromTo(
        hero.querySelector('[data-hero-bg]'),
        { scale: 1 },
        { scale: 1.07, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } }
      );
      deskItems.forEach((item) => {
        const depth = parseFloat(item.dataset.depth || 0.4);
        gsap.to(item, {
          yPercent: -34 * depth,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 },
        });
      });

      /* mouse parallax across the desk */
      if (!isTouch()) {
        const quicks = [...deskItems].map((item) => ({
          depth: parseFloat(item.dataset.depth || 0.4),
          x: gsap.quickTo(item, 'x', { duration: 1.1, ease: 'power3.out' }),
          yq: gsap.quickTo(item, 'y', { duration: 1.1, ease: 'power3.out' }),
        }));
        const onMove = (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          quicks.forEach((q) => {
            q.x(nx * 26 * q.depth);
            q.yq(ny * 16 * q.depth);
          });
        };
        hero.addEventListener('pointermove', onMove);
        onPageCleanup(() => hero.removeEventListener('pointermove', onMove));
      }
    }

    /* ——— CINE: zoom → fragrance escapes → becomes a memory ——— */
    const cine = root.querySelector('[data-cine]');
    const useCinePin = motionOK() && !isNarrow();
    if (!useCinePin) {
      cine.classList.add('cine--static');
      const stage = cine.querySelector('[data-cine-bottle] .bottle-stage');
      if (motionOK()) onPageCleanup(floatBottle(stage, { y: 6 }));
    } else {
      const stageEl = cine.querySelector('[data-cine-stage]');
      const bottle = cine.querySelector('[data-cine-bottle]');
      const intro = cine.querySelector('[data-cine-intro]');
      const outro = cine.querySelector('[data-cine-outro]');
      const vignette = cine.querySelector('[data-cine-vignette]');
      const photo = cine.querySelector('[data-cine-photo]');
      const sides = cine.querySelectorAll('[data-cine-side]');
      const final = cine.querySelector('[data-cine-final]');
      const mistcol = cine.querySelector('[data-cine-mistcol]');

      /* build the fragrance column: mist blobs + fine particles at the neck */
      const mistC = featured.mist;
      const blobs = [];
      for (let i = 0; i < 5; i++) {
        const s = 90 + i * 55;
        const b = document.createElement('span');
        b.className = 'mist';
        b.style.cssText = `width:${s}px;height:${s}px;left:${-s / 2}px;top:${-s / 2}px;background:radial-gradient(circle, ${mistC}66, ${mistC}00 70%);`;
        mistcol.appendChild(b);
        blobs.push(b);
      }
      const particles = [];
      for (let i = 0; i < 9; i++) {
        const d = document.createElement('span');
        d.className = 'cine__particle';
        d.style.background = i % 3 === 0 ? 'var(--terracotta)' : mistC;
        d.style.left = `${-40 + Math.random() * 80}px`;
        d.style.top = `0px`;
        mistcol.appendChild(d);
        particles.push(d);
      }

      gsap.set(bottle, { scale: 0.9, yPercent: 6 });
      gsap.set(photo, { opacity: 0, scale: 0.62, y: 60, rotation: 5, filter: 'blur(22px)' });
      gsap.set(sides, { opacity: 0, y: 70 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageEl,
          start: 'top top',
          end: '+=330%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      /* Act I — approach: the camera closes in */
      tl.to(intro, { opacity: 0, y: -40, duration: 0.1, ease: 'power1.in' }, 0.02)
        .to(bottle, { scale: 2.3, yPercent: 14, duration: 0.34, ease: 'power1.inOut' }, 0.04)
        .to(bottle.querySelector('.bottle'), { rotationY: 12, rotationX: -4, duration: 0.34, ease: 'sine.inOut' }, 0.04)
        .to(vignette, { opacity: 1, duration: 0.3 }, 0.12)

        /* Act II — the fragrance escapes: a column of mist rises from the neck */
        .to(blobs, {
          opacity: 0.85,
          y: (i) => -120 - i * 62,
          x: (i) => (i % 2 ? 34 : -30) * (1 + i * 0.12),
          scale: 1.35,
          stagger: 0.03,
          duration: 0.2,
          ease: 'sine.out',
        }, 0.3)
        .to(particles, {
          opacity: 0.9,
          y: () => -140 - Math.random() * 240,
          x: (i) => -60 + Math.random() * 120,
          duration: 0.26,
          stagger: 0.012,
          ease: 'sine.out',
        }, 0.32)

        /* Act III — transformation: the mist gathers into a photograph */
        .to(blobs, {
          y: -230,
          x: 0,
          scale: 2.1,
          opacity: 0.55,
          duration: 0.14,
          ease: 'power1.inOut',
        }, 0.5)
        .to(bottle, { scale: 1.05, yPercent: 34, xPercent: -46, duration: 0.24, ease: 'power2.inOut' }, 0.5)
        .to(bottle.querySelector('.bottle'), { rotationY: -8, duration: 0.24 }, 0.5)
        .to(photo, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotation: -3,
          filter: 'blur(0px)',
          duration: 0.22,
          ease: 'power2.out',
        }, 0.56)
        .to(blobs, { opacity: 0, scale: 2.6, duration: 0.12, ease: 'sine.in' }, 0.62)
        .to(particles, { opacity: 0, duration: 0.1 }, 0.62)

        /* Act IV — the memory settles; companions join it */
        .to(sides, { opacity: 0.95, y: 0, stagger: 0.06, duration: 0.16, ease: 'power2.out' }, 0.68)
        .to(outro, { opacity: 1, y: 6, duration: 0.12 }, 0.7)
        .to(final, { opacity: 1, y: -8, duration: 0.14 }, 0.84);
    }

    /* ——— Showcase pin (desktop) ——— */
    const usePin = motionOK() && !isNarrow();
    if (usePin) {
      const pin = root.querySelector('[data-showcase-pin]');
      const slides = pin.querySelectorAll('.showcase__slide');
      const ticks = pin.querySelectorAll('.showcase__tick');
      const per = 1 / slides.length;

      gsap.set(slides, { autoAlpha: 0 });
      gsap.set(slides[0], { autoAlpha: 1 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: `+=${slides.length * 90}%`,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            const idx = Math.min(slides.length - 1, Math.floor(self.progress / per));
            ticks.forEach((t, i) => t.classList.toggle('is-active', i <= idx));
          },
        },
      });

      slides.forEach((slide, i) => {
        const at = i * per;
        const stay = per * 0.62;
        const fade = per * 0.16;
        tl.fromTo(slide, { autoAlpha: i === 0 ? 1 : 0 }, { autoAlpha: 1, duration: fade, ease: 'none' }, at)
          .fromTo(
            slide.querySelector('.bottle-stage'),
            { y: 60, rotation: -2 },
            { y: 0, rotation: 0, duration: fade * 1.4, ease: 'power2.out' },
            at
          )
          .fromTo(
            slide.querySelector('.showcase__slidememory'),
            { y: 40, opacity: 0, rotation: -10 },
            { y: 0, opacity: 0.85, rotation: -5, duration: fade * 1.5, ease: 'power2.out' },
            at + fade * 0.3
          )
          .fromTo(
            slide.querySelectorAll('.showcase__left > *, .showcase__right > *'),
            { y: 26, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.012, duration: fade, ease: 'power2.out' },
            at + fade * 0.4
          );
        if (i < slides.length - 1) {
          tl.to(slide, { autoAlpha: 0, y: -30, duration: fade, ease: 'none' }, at + stay + fade);
          tl.set(slide, { y: 0 }, at + stay + fade * 2);
        }
      });
    }

    /* ——— Memory-stack drift ——— */
    if (motionOK()) {
      const stack = root.querySelector('[data-memstack]');
      stack.querySelectorAll('.acard').forEach((card, i) => {
        gsap.to(card, {
          y: (i - 1) * -22,
          ease: 'none',
          scrollTrigger: { trigger: stack, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        });
      });
    }

    /* re-render when crossing the pin/carousel breakpoint */
    const mq = window.matchMedia('(max-width: 820px)');
    const onMq = () => renderRoute({ scroll: false });
    mq.addEventListener('change', onMq);
    onPageCleanup(() => mq.removeEventListener('change', onMq));
  },
};
