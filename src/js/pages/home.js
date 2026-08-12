/**
 * MEMÓRIA · Homepage — cinematic hero, collection, zoom-to-scent scene,
 * memory chapter, six-scent showcase, archive teaser, finder band, values.
 */
import { esc, money, isNarrow } from '../utils.js';
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

function heroSection() {
  return `
  <section class="hero" aria-label="MEMÓRIA — every scent holds a memory">
    <div class="hero__bg" data-hero-bg>
      <div class="hero__lattice"></div>
      <div class="hero__glow"></div>
    </div>
    <div class="container hero__inner">
      <div class="hero__copy">
        <span class="hero__eyebrow" data-reveal>
          <span class="rule" aria-hidden="true"></span>
          <span class="label">Twenty Years of Scents · Cairo</span>
        </span>
        <h1 class="hero__title" data-reveal style="--reveal-delay:90ms">
          Every scent<br/>holds a <em>memory.</em>
        </h1>
        <p class="hero__lede" data-reveal style="--reveal-delay:180ms">
          Two decades of passion and craft, bottled into six timeless perfumes —
          three for her, three for him.
        </p>
        <div class="hero__ctas" data-reveal style="--reveal-delay:260ms">
          <a class="btn btn--primary" href="/shop">Shop the Collection</a>
          <a class="btn" href="/our-story">Discover Our Story</a>
        </div>
      </div>
      <div class="hero__fig" data-hero-fig>
        <div class="hero__figframe" aria-hidden="true"></div>
        ${renderBottleStage(featured, { mists: 3 })}
        <div class="hero__fignote" aria-hidden="true">
          <span class="stamp">Fig. ${featured.number} — ${esc(featured.name)}</span>
          <span class="stamp">Eau de Parfum · The Collection</span>
        </div>
      </div>
    </div>
    <div class="hero__scrollcue" aria-hidden="true">
      <span class="stamp">Scroll</span>
      <span class="line"></span>
    </div>
  </section>`;
}

function collectionSection() {
  return `
  <section class="section homecoll" aria-labelledby="coll-title">
    <div class="container">
      <div class="sechead">
        <span class="stamp" data-reveal>Catalogue · Six Scents</span>
        <h2 id="coll-title" data-reveal>The Collection</h2>
        <p class="serif-lede" data-reveal>Each perfume keeps one memory. Find yours, or begin a new one.</p>
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
        <a class="link-line" href="/shop">View the full catalogue</a>
      </div>
    </div>
  </section>`;
}

function cineSection() {
  const p = featured;
  return `
  <section class="cine" data-cine aria-label="A memory escaping from the bottle">
    <div class="cine__stage" data-cine-stage>
      <div class="cine__vignette" data-cine-vignette></div>

      <div class="cine__copy cine__copy--intro" data-cine-intro>
        <span class="stamp">Chapter I · The Scent</span>
        <h2>Come closer —<br/>this one remembers.</h2>
      </div>

      <div class="cine__stagebottle" data-cine-bottle>
        ${renderBottleStage(p, { mists: 3 })}
      </div>

      <div class="cine__memory" data-cine-memory>
        <div class="cine__memory-inner">
          <div class="cine__polaroid" style="--tilt:-5deg; top:6%; left:4%;" data-cine-pol>
            ${renderMotif('balcony', { title: 'A balcony at sunset' })}
            <span class="hand">the balcony, at dusk</span>
          </div>
          <div class="cine__polaroid" style="--tilt:4deg; top:0%; right:6%;" data-cine-pol>
            ${renderMotif('city', { title: 'The city from the roof' })}
            <span class="hand">home, from the roof</span>
          </div>
          <div class="cine__polaroid" style="--tilt:-2deg; bottom:2%; left:30%;" data-cine-pol>
            ${renderMotif('letter', { title: 'A kept letter' })}
            <span class="hand">a letter, kept</span>
          </div>
        </div>
      </div>

      <div class="cine__copy cine__copy--outro" data-cine-outro style="opacity:0">
        <span class="stamp">Nº ${p.number} · ${esc(p.fragranceFamily)}</span>
        <h2>${esc(p.memoryPlace)}</h2>
      </div>

      <div class="cine__final" data-cine-final>
        <p>“${esc(p.shortDescription)}”</p>
        <a class="btn btn--primary" href="/product/${p.slug}">Discover Nº ${p.number} — ${esc(p.name)}</a>
      </div>
    </div>
  </section>`;
}

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
        ${renderBottleStage(p, { mists: 2 })}
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
      <div class="sechead">
        <span class="stamp" data-reveal>The Six · In Order</span>
        <h2 data-reveal>One by one</h2>
      </div>
      <div class="showcase__rail">${railCards}</div>
    </div>
  </section>`;
}

function archivePreviewSection() {
  return `
  <section class="section" aria-labelledby="archprev-title">
    <div class="container">
      <div class="sechead">
        <span class="stamp" data-reveal>Vol. I – VI · Placeholder years</span>
        <h2 id="archprev-title" data-reveal>The MEMÓRIA Archive</h2>
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
    /* — Collection filter — */
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

    /* — Finder — */
    root.querySelector('[data-open-finder]').addEventListener('click', openFinder);

    /* — Hero motion — */
    const heroFig = root.querySelector('[data-hero-fig] .bottle-stage');
    onPageCleanup(attachTilt(root.querySelector('[data-hero-fig]'), { max: 8 }));
    onPageCleanup(floatBottle(heroFig, { y: 8, dur: 5.5 }));
    onPageCleanup(sweepBottle(heroFig, { every: 5 }));
    onPageCleanup(driftMist(root.querySelector('[data-hero-fig]'), { opacity: 0.55 }));

    if (motionOK()) {
      const heroBg = root.querySelector('[data-hero-bg]');
      gsap.fromTo(
        heroBg,
        { scale: 1.0 },
        {
          scale: 1.07,
          ease: 'none',
          scrollTrigger: { trigger: root.querySelector('.hero'), start: 'top top', end: 'bottom top', scrub: 0.6 },
        }
      );
      /* slow ambient reveal on load (opacity only — scale belongs to the scrub) */
      gsap.from(root.querySelector('.hero__glow'), { opacity: 0, duration: 2.6, ease: 'power2.out' });
    }

    /* Re-render if the viewport crosses the pin/carousel breakpoint,
       so the pinned showcase and cine scene swap modes cleanly. */
    const mq = window.matchMedia('(max-width: 820px)');
    const onMq = () => renderRoute({ scroll: false });
    mq.addEventListener('change', onMq);
    onPageCleanup(() => mq.removeEventListener('change', onMq));

    /* — Cinematic zoom-to-scent scene — */
    const cine = root.querySelector('[data-cine]');
    const useCinePin = motionOK() && !isNarrow();
    if (!useCinePin) {
      cine.classList.add('cine--static');
      const stage = cine.querySelector('[data-cine-bottle] .bottle-stage');
      onPageCleanup(driftMist(cine.querySelector('[data-cine-bottle]'), { opacity: 0.4 }));
      if (motionOK()) onPageCleanup(floatBottle(stage, { y: 6 }));
    } else {
      const stageEl = cine.querySelector('[data-cine-stage]');
      const bottle = cine.querySelector('[data-cine-bottle]');
      const mists = bottle.querySelectorAll('.mist');
      const intro = cine.querySelector('[data-cine-intro]');
      const outro = cine.querySelector('[data-cine-outro]');
      const memory = cine.querySelector('[data-cine-memory]');
      const pols = memory.querySelectorAll('[data-cine-pol]');
      const vignette = cine.querySelector('[data-cine-vignette]');
      const final = cine.querySelector('[data-cine-final]');

      gsap.set(bottle, { scale: 0.86, yPercent: 4 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageEl,
          start: 'top top',
          end: '+=270%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(intro, { opacity: 0, y: -40, duration: 0.16, ease: 'power1.in' }, 0.02)
        .to(bottle, { scale: 1.65, yPercent: 0, duration: 0.5, ease: 'power1.inOut' }, 0.06)
        .to(bottle.querySelector('.bottle'), { rotationY: 9, rotationX: -3, duration: 0.5, ease: 'sine.inOut' }, 0.06)
        .to(vignette, { opacity: 1, duration: 0.4 }, 0.18)
        .to(mists, { opacity: 0.75, scale: 1.5, stagger: 0.05, duration: 0.3, ease: 'sine.out' }, 0.3)
        .to(memory, { opacity: 1, duration: 0.28 }, 0.44)
        .from(pols, { y: 70, opacity: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out' }, 0.46)
        .to(bottle, { scale: 1.28, yPercent: 6, duration: 0.3, ease: 'sine.inOut' }, 0.55)
        .to(bottle.querySelector('.bottle'), { rotationY: -6, duration: 0.3, ease: 'sine.inOut' }, 0.55)
        .to(outro, { opacity: 1, y: -14, duration: 0.2 }, 0.62)
        .to(mists, { opacity: 0.35, duration: 0.3 }, 0.72)
        .to(final, { opacity: 1, y: -8, duration: 0.2 }, 0.8);
    }

    /* — Six-scent pinned showcase (desktop, motion allowed) — */
    const usePin = motionOK() && !isNarrow();
    if (usePin) {
      const pin = root.querySelector('[data-showcase-pin]');
      const slides = pin.querySelectorAll('.showcase__slide');
      const ticks = pin.querySelectorAll('.showcase__tick');
      const per = 1 / slides.length;

      gsap.set(slides, { autoAlpha: 0 });
      gsap.set(slides[0], { autoAlpha: 1 }); /* first slide visible before the pin engages */
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

    /* — Memory-stack drift — */
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
  },
};
