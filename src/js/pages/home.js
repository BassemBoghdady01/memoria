/**
 * MEMÓRIA · Homepage — a modern perfume shop that behaves as if it has
 * a rich, strange, charming history.
 *
 * Rhythm: HERO AD → THE SIX PERFUMES → forecast interruption → rotating
 * showcase → the spray moment → two standalone ads → the archive →
 * scent finder → the hotline. Light ground, real-looking product,
 * shopping never more than one tap away.
 */
import { esc, money, toast } from '../utils.js';
import { products, getByGender, getProduct } from '../data/products.js';
import { bottleImg } from '../components/render.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';
import { openFinder } from '../components/finder.js';
import { gsap, motionOK, onPageCleanup, scanReveals } from '../motion.js';

/* ————— hero ————— */

function heroSection() {
  const hero = getProduct('jasmine-dusk');
  return `
  <section class="hero2">
    <div class="container hero2__grid">
      <div class="hero2__copy">
        <p class="hero2__eyebrow" data-reveal>Memory-Enhancing Compositions · Est. 2006<sup>*</sup></p>
        <h1 class="hero2__title" data-reveal>Every scent<br/>holds a <em>memory.</em></h1>
        <p class="hero2__sub" data-reveal>Six scents. Twenty years. No bad memories included.</p>
        <div class="hero2__ctas" data-reveal>
          <a class="btn btn--primary btn--big" href="/shop">Shop the Collection</a>
          <a class="btn btn--ghost" href="/our-story">Discover Memória</a>
        </div>
        <p class="hero2__foot" data-reveal><sup>*</sup>Placeholder date. Records before 2006 remain suspiciously incomplete.</p>
      </div>
      <div class="hero2__plate" data-hero-plate>
        <div class="hero2__arch" data-hero-arch>
          ${bottleImg(hero, { w: 720, cls: 'hero2__bottle', eager: true })}
          <svg class="hero2__stamp" viewBox="0 0 120 120" aria-hidden="true">
            <defs><path id="stampcircle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs>
            <circle cx="60" cy="60" r="58" fill="var(--terracotta)"/>
            <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(232,221,200,.55)" stroke-width="1"/>
            <g class="hero2__stampspin">
              <text font-size="10.6" letter-spacing="2" fill="var(--parchment)">
                <textPath href="#stampcircle">TWENTY YEARS OF SCENTS · MEMÓRIA ·</textPath>
              </text>
            </g>
            <text x="60" y="66" text-anchor="middle" font-size="20" fill="var(--parchment)" font-family="Cormorant Garamond, serif" font-style="italic">Nº 01</text>
          </svg>
          <a class="hero2__chip" href="/product/${hero.slug}">Nº ${hero.number} · from ${money(hero.sizes[0].price)}</a>
        </div>
      </div>
    </div>
    <nav class="container hero2__index" aria-label="The six scents">
      ${products
        .map(
          (p) => `
        <a class="hero2__ix" href="/product/${p.slug}">
          <strong>Nº ${p.number}</strong><span>${esc(p.name)}</span>
        </a>`
        )
        .join('')}
    </nav>
  </section>`;
}

/* ————— the collection ————— */

function collectionSection() {
  return `
  <section class="collection2" id="collection" aria-labelledby="collection-title">
    <div class="container">
      <header class="sechead2">
        <div>
          <p class="sechead2__kicker" data-reveal>The Collection</p>
          <h2 id="collection-title" data-reveal>Three for her. Three for him.<br/><em>All six for people who change their mind.</em></h2>
        </div>
        <div class="filters" role="group" aria-label="Filter the collection" data-reveal>
          <button class="filter-tab" data-filter="all" aria-pressed="true">All six</button>
          <button class="filter-tab" data-filter="her" aria-pressed="false">For her</button>
          <button class="filter-tab" data-filter="him" aria-pressed="false">For him</button>
        </div>
      </header>
      <div data-collection-grid>${renderProductGrid(products)}</div>
      <p class="collection2__more" data-reveal><a class="link-line" href="/shop">Browse the full catalogue →</a></p>
    </div>
  </section>`;
}

/* ————— scent forecast (teal interruption) ————— */

function forecastSection() {
  const line = `SCENT FORECAST — CAIRO: WARM, CLEAR, HIGH PROJECTION · Nº 02 UNTIL SUNSET · Nº 05 AFTER DARK · CARRY Nº 03 IN CASE OF SUNDAY`;
  const item = `<span class="forecast__item">${line}</span><span class="forecast__star" aria-hidden="true">✷</span>`;
  return `
  <section class="forecast" aria-label="Scent forecast">
    <div class="forecast__marquee" aria-hidden="true"><div class="forecast__track">${item.repeat(4)}</div></div>
    <div class="container forecast__row">
      <p class="forecast__note">Issued daily by the Memory Department. Accuracy not guaranteed, projection is.</p>
      <button class="btn btn--small btn--onteal" data-open-finder-2>Get a personal forecast</button>
    </div>
  </section>`;
}

/* ————— the six — rotating showcase ————— */

function sixSlide(p) {
  return `
  <article class="six__slide" style="--tint:${p.tint}; --world:${p.world.color}">
    <div class="six__slideplate">${bottleImg(p, { w: 720 })}</div>
    <div class="six__slideinfo">
      <span class="six__meta">Nº ${p.number} · ${p.gender === 'her' ? 'For Her' : 'For Him'} · ${esc(p.fragranceFamily)}</span>
      <h3>${esc(p.name)}</h3>
      <p class="six__notes">${esc([...p.topNotes.slice(0, 1), ...p.heartNotes.slice(0, 2), ...p.baseNotes.slice(0, 1)].join(' · '))}</p>
      <div class="six__buy">
        <span class="six__price">${money(p.sizes[p.sizes.length - 1].price)}</span>
        <button class="btn btn--small" data-add="${p.slug}" data-ml="${p.sizes[p.sizes.length - 1].ml}">Add to Bag</button>
        <a class="link-line" href="/product/${p.slug}">Full record</a>
      </div>
    </div>
  </article>`;
}

function sixSection() {
  return `
  <section class="six six--rail" data-six aria-labelledby="six-title">
    <div class="container six__head">
      <p class="sechead2__kicker" data-reveal>The Six</p>
      <h2 id="six-title" data-reveal>Turn each one over.</h2>
    </div>

    <!-- desktop: pinned, scroll turns the bottles -->
    <div class="six__stage" data-six-stage aria-hidden="true">
      <span class="six__bigno" data-six-no aria-hidden="true">01</span>
      <div class="six__bottles">
        ${products.map((p, i) => `<div class="six__bottle" data-six-b="${i}">${bottleImg(p, { w: 720 })}</div>`).join('')}
      </div>
      <div class="six__panels">
        ${products
          .map(
            (p, i) => `
          <div class="six__panel" data-six-p="${i}">
            <span class="six__meta">Nº ${p.number} · ${p.gender === 'her' ? 'For Her' : 'For Him'} · ${esc(p.fragranceFamily)}</span>
            <h3>${esc(p.name)}</h3>
            <p class="six__notes">${esc([...p.topNotes.slice(0, 1), ...p.heartNotes.slice(0, 2), ...p.baseNotes.slice(0, 1)].join(' · '))}</p>
            <p class="six__ad">${esc(p.ad)}</p>
            <div class="six__buy">
              <span class="six__price">${money(p.sizes[p.sizes.length - 1].price)}</span>
              <button class="btn btn--small" data-add="${p.slug}" data-ml="${p.sizes[p.sizes.length - 1].ml}">Add to Bag</button>
              <a class="link-line" href="/product/${p.slug}">Full record</a>
            </div>
          </div>`
          )
          .join('')}
      </div>
      <div class="six__dots" aria-hidden="true">${products.map((_, i) => `<i data-six-dot="${i}"></i>`).join('')}</div>
    </div>

    <!-- mobile / reduced motion: swipe rail -->
    <div class="six__rail" data-six-rail>
      ${products.map(sixSlide).join('')}
    </div>
  </section>`;
}

/* ————— the spray moment ————— */

function spraySection() {
  const p = getProduct('nile-cedar');
  return `
  <section class="spray" data-spray style="--world:${p.world.color}">
    <div class="spray__stage" data-spray-stage>
      <div class="spray__intro" data-spray-intro>
        <p class="spray__kicker">The Memória Test</p>
        <h2>Spray the memory.<br/><em>Enter it.</em></h2>
        <p class="spray__hint" aria-hidden="true">keep scrolling — this is the fun part</p>
      </div>
      <div class="spray__bottle" data-spray-bottle>${bottleImg(p, { w: 720 })}</div>
      <div class="spray__mist" aria-hidden="true">
        ${Array.from({ length: 7 }, (_, i) => `<i class="spray__puff" data-puff="${i}"></i>`).join('')}
      </div>
      <div class="spray__world" data-spray-world>
        <p class="spray__nowline">You are now remembering:</p>
        <h3 class="spray__place">Nº 04 — ${esc(p.memoryPlace)}.</h3>
        <p class="spray__wcopy">${esc(p.shortDescription)}</p>
        <div class="spray__cta">
          <button class="btn btn--primary" data-add="${p.slug}" data-ml="100">Add Nº 04 · ${money(p.sizes[1].price)}</button>
          <a class="link-line link-line--cream" href="/product/${p.slug}">Read the full record</a>
        </div>
        <p class="spray__fpo">Campaign still: developing<sup>*</sup> <span><sup>*</sup>this frame becomes photography after the shoot</span></p>
      </div>
    </div>
  </section>`;
}

/* ————— standalone ads ————— */

function adSection(slug, flip = false) {
  const p = getProduct(slug);
  return `
  <section class="adband${flip ? ' adband--flip' : ''}" style="--world:${p.world.color}; --tint:${p.tint}" aria-labelledby="ad-${p.slug}">
    <div class="container adband__grid">
      <div class="adband__copy">
        <p class="adband__meta" data-reveal>Nº ${p.number} · ${p.gender === 'her' ? 'For Her' : 'For Him'}</p>
        <h2 id="ad-${p.slug}" data-reveal>${esc(p.ad)}</h2>
        <p class="adband__desc" data-reveal>${esc(p.shortDescription)}</p>
        <div class="adband__ctas" data-reveal>
          <button class="btn btn--primary" data-add="${p.slug}" data-ml="${p.sizes[p.sizes.length - 1].ml}">Add to Bag · ${money(p.sizes[p.sizes.length - 1].price)}</button>
          <a class="link-line link-line--cream" href="/product/${p.slug}">Nº ${p.number} in full</a>
        </div>
      </div>
      <div class="adband__art" data-reveal>
        <div class="adband__tiltcard">${bottleImg(p, { w: 720 })}</div>
      </div>
    </div>
  </section>`;
}

/* ————— the archive ————— */

function archiveSection() {
  const records = [
    { yr: '2006', no: '04', name: 'Nile Cedar', note: 'The first entry in the ledger. Allegedly.' },
    { yr: '2014', no: '02', name: 'Rose Vellum', note: 'Filed under letters never sent.' },
    { yr: '2026', no: '06', name: 'Vetiver Arcade', note: 'The newest memory. Still settling.' },
  ];
  return `
  <section class="archband" aria-labelledby="arch-title">
    <div class="container">
      <header class="sechead2 sechead2--center">
        <p class="sechead2__kicker" data-reveal>The Memória Archive · Est. 2006<sup>*</sup></p>
        <h2 id="arch-title" data-reveal>Twenty years of scents.<br/><em>Six survived the edit.</em></h2>
      </header>
      <div class="archband__grid">
        ${records
          .map(
            (r, i) => `
          <a class="archband__card" href="/archive" data-reveal style="--reveal-delay:${i * 110}ms">
            <span class="archband__yr">${r.yr}</span>
            <span class="archband__entry">Record Nº ${r.no}</span>
            <strong>${r.name}</strong>
            <span class="archband__note">${r.note}</span>
            <span class="archband__stamp">FILED</span>
          </a>`
          )
          .join('')}
        <div class="archband__card archband__card--roll" data-reveal style="--reveal-delay:330ms">
          <span class="archband__yr">19—?</span>
          <span class="archband__entry">Undeveloped roll</span>
          <strong>Campaign film</strong>
          <span class="archband__note">Photography arrives with the shoot. The Department apologises for the suspense.</span>
          <span class="archband__stamp archband__stamp--teal">DEVELOPING</span>
        </div>
      </div>
      <p class="archband__foot" data-reveal>
        <a class="link-line" href="/archive">Browse the archive →</a>
        <span><sup>*</sup>Placeholder dates — awaiting the house's real records.</span>
      </p>
    </div>
  </section>`;
}

/* ————— finder + hotline ————— */

function finderSection() {
  const options = [
    'Dinner we shouldn’t be late for.',
    'Somewhere with a dress code.',
    'Nowhere. That’s the point.',
    'I haven’t decided yet.',
  ];
  return `
  <section class="finderband2" aria-labelledby="finder-title">
    <div class="container finderband2__inner">
      <p class="sechead2__kicker sechead2__kicker--cream" data-reveal>The Scent Finder</p>
      <h2 id="finder-title" data-reveal>Where are we going?</h2>
      <div class="finderband2__opts" data-reveal>
        ${options.map((o) => `<button class="finderband2__opt" data-open-finder-3>${esc(o)}</button>`).join('')}
      </div>
      <p class="finderband2__note" data-reveal>Three questions. One recommendation. The Memory Department is rarely wrong twice.</p>
    </div>
  </section>`;
}

function hotlineSection() {
  return `
  <section class="hotline" aria-labelledby="hotline-title">
    <div class="container hotline__inner">
      <div>
        <p class="hotline__badge" data-reveal>The Memória Hotline</p>
        <h2 id="hotline-title" data-reveal>What are you remembering?</h2>
        <p class="hotline__sub" data-reveal>Write to the Memory Department. Every submission is read, filed, and occasionally answered with a sample.</p>
      </div>
      <form class="hotline__form" data-hotline data-reveal>
        <label class="sr-only" for="hotline-email">Email address</label>
        <input id="hotline-email" type="email" required placeholder="you@somewhere.com" autocomplete="email" />
        <button class="btn btn--primary" type="submit">Report a memory</button>
        <p class="hotline__note">Demo form — nothing is sent yet.</p>
      </form>
    </div>
  </section>`;
}

/* ————————————————————————————————————————— */

export default {
  title: 'MEMÓRIA — Every Scent Holds a Memory',

  render() {
    return [
      heroSection(),
      collectionSection(),
      forecastSection(),
      sixSection(),
      spraySection(),
      adSection('rose-vellum'),
      adSection('oud-memoir', true),
      archiveSection(),
      finderSection(),
      hotlineSection(),
    ].join('');
  },

  mount(root) {
    /* — commerce wiring (each container owns its buttons) — */
    const grid = root.querySelector('[data-collection-grid]');
    let disposeGrid = mountProductCards(grid);
    mountProductCards(root.querySelector('[data-six]'));
    mountProductCards(root.querySelector('[data-spray]'));
    root.querySelectorAll('.adband').forEach((band) => mountProductCards(band));

    /* — collection filters — */
    root.querySelectorAll('.filter-tab').forEach((tab) =>
      tab.addEventListener('click', () => {
        root.querySelectorAll('.filter-tab').forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
        disposeGrid();
        grid.innerHTML = renderProductGrid(getByGender(tab.dataset.filter));
        disposeGrid = mountProductCards(grid);
        scanReveals(grid);
      })
    );

    /* — finder openers — */
    root.querySelectorAll('[data-open-finder-2],[data-open-finder-3]').forEach((b) => b.addEventListener('click', openFinder));

    /* — hotline — */
    root.querySelector('[data-hotline]').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      if (!input.value) return;
      input.value = '';
      toast('Filed. The Memory Department thanks you.');
    });

    const ok = motionOK();
    const wide = window.matchMedia('(min-width: 880px)').matches;

    /* — hero motion — */
    if (ok) {
      const tl = gsap.from('[data-hero-arch]', { opacity: 0, scale: 0.94, y: 24, duration: 0.9, delay: 0.1, ease: 'power2.out' });
      const float = gsap.to('.hero2__bottle', { y: -10, duration: 4.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      onPageCleanup(() => {
        tl.kill();
        float.kill();
      });
    }

    /* — the six: pinned turntable on desktop, swipe rail otherwise — */
    const six = root.querySelector('[data-six]');
    if (ok && wide) {
      six.classList.remove('six--rail');
      const stage = six.querySelector('[data-six-stage]');
      stage.removeAttribute('aria-hidden');
      const bottles = [...stage.querySelectorAll('[data-six-b]')];
      const panels = [...stage.querySelectorAll('[data-six-p]')];
      const dots = [...stage.querySelectorAll('[data-six-dot]')];
      const bigno = stage.querySelector('[data-six-no]');

      gsap.set(bottles, { autoAlpha: 0, xPercent: 24, rotationY: -26, transformPerspective: 900 });
      gsap.set(panels, { autoAlpha: 0, y: 22 });
      gsap.set(bottles[0], { autoAlpha: 1, xPercent: 0, rotationY: 0 });
      gsap.set(panels[0], { autoAlpha: 1, y: 0 });
      gsap.set(stage, { backgroundColor: products[0].tint });
      dots[0].classList.add('is-on');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=420%',
          scrub: 0.6,
          pin: stage,
          onUpdate(self) {
            const i = Math.min(5, Math.round(self.progress * 5));
            dots.forEach((d, j) => d.classList.toggle('is-on', j === i));
          },
        },
      });
      for (let i = 0; i < 5; i++) {
        const at = i;
        tl.to(bottles[i], { autoAlpha: 0, xPercent: -24, rotationY: 26, duration: 0.45 }, at)
          .to(panels[i], { autoAlpha: 0, y: -18, duration: 0.35 }, at)
          .fromTo(
            bottles[i + 1],
            { autoAlpha: 0, xPercent: 24, rotationY: -26 },
            { autoAlpha: 1, xPercent: 0, rotationY: 0, duration: 0.5 },
            at + 0.3
          )
          .to(panels[i + 1], { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.45)
          .to(stage, { backgroundColor: products[i + 1].tint, duration: 0.5 }, at + 0.2)
          .call(() => (bigno.textContent = products[Math.min(5, i + 1)].number), [], at + 0.4);
      }
      onPageCleanup(() => tl.kill());
    }

    /* — the spray moment — */
    const spray = root.querySelector('[data-spray]');
    if (ok && wide) {
      const stage = spray.querySelector('[data-spray-stage]');
      const intro = spray.querySelector('[data-spray-intro]');
      const bottle = spray.querySelector('[data-spray-bottle]');
      const world = spray.querySelector('[data-spray-world]');
      const puffs = [...spray.querySelectorAll('[data-puff]')];

      gsap.set(bottle, { yPercent: 34, scale: 0.9, rotationY: -14, transformPerspective: 900 });
      gsap.set(world, { autoAlpha: 0, y: 30 });
      gsap.set(puffs, { scale: 0, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: spray, start: 'top top', end: '+=300%', scrub: 0.6, pin: true },
      });
      tl.to(intro, { autoAlpha: 0, y: -36, duration: 0.5 }, 0.15)
        .to(bottle, { yPercent: 6, scale: 1.42, rotationY: 0, duration: 0.9 }, 0.2)
        .to(
          puffs,
          {
            scale: (i) => 2.4 + i * 0.7,
            opacity: 0.85,
            x: (i) => -60 - i * 90,
            y: (i) => -30 - (i % 3) * 34,
            duration: 0.7,
            stagger: 0.05,
          },
          1.1
        )
        .to(stage, { backgroundColor: getProduct('nile-cedar').world.color, duration: 0.6 }, 1.35)
        .to(puffs, { opacity: 0, duration: 0.5 }, 1.8)
        .to(bottle, { xPercent: 30, scale: 1.06, duration: 0.7 }, 1.7)
        .to(world, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.9);
      onPageCleanup(() => tl.kill());
    } else {
      spray.classList.add('spray--static');
    }
  },
};
