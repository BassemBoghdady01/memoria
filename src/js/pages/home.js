/**
 * MEMÓRIA · Homepage — a living perfume shop built inside twenty years
 * of memories. Composition target: the client's homepage reference.
 *
 * Rhythm: HERO SCENE (bottle + radio on a real table) → SIX-BOTTLE
 * LINEUP → forecast ticker → FEATURED SCENT (paper panel + room scene)
 * → the signature spray moment → STORY COLLAGE → values → dark closing
 * band → hotline. The content feels human; the commerce stays precise.
 */
import { esc, money, toast } from '../utils.js';
import { products, getByGender, getProduct } from '../data/products.js';
import { bottleImg } from '../components/render.js';
import { mountProductCards } from '../components/productCard.js';
import { openFinder } from '../components/finder.js';
import { icons } from '../components/icons.js';
import { gsap, ScrollTrigger, motionOK, onPageCleanup, scanReveals } from '../motion.js';

/* ————— hero — the apartment at golden hour ————— */

function heroSection() {
  const hero = getProduct('jasmine-dusk');
  return `
  <section class="hero3">
    <div class="hero3__scene">
      <i class="hero3__dust" aria-hidden="true"></i>
      <div class="container hero3__inner">
        <div class="hero3__copy">
          <svg class="hero3__postmark" viewBox="0 0 120 120" aria-hidden="true">
            <defs><path id="hpm" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 5"/>
            <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="1"/>
            <text font-size="10.5" letter-spacing="2.4" fill="currentColor"><textPath href="#hpm">MEMÓRIA · CAIRO · MEMÓRIA · CAIRO ·</textPath></text>
            <text x="60" y="56" text-anchor="middle" font-size="15" fill="currentColor" font-family="Georgia">EST.</text>
            <text x="60" y="76" text-anchor="middle" font-size="17" fill="currentColor" font-family="Georgia">2006</text>
          </svg>
          <h1 class="hero3__title" data-reveal>
            <span class="hero3__caps">Every scent</span>
            <span class="hero3__caps">holds a</span>
            <span class="brandword hero3__brand">memory.<i class="hero3__stroke" aria-hidden="true"></i></span>
          </h1>
          <p class="hero3__sub" data-reveal>Six scents. Twenty years.<br/>Thousands of places we thought we&rsquo;d forgotten.</p>
          <div class="hero3__ctas" data-reveal>
            <a class="btn btn--dark" href="/shop">Shop the Collection</a>
            <a class="btn btn--ghost" href="/our-story">Discover Memória</a>
          </div>
        </div>
        <div class="hero3__still" data-hero-still>
          <img class="hero3__radio" src="/objects/radio.png" alt="" aria-hidden="true" loading="eager" />
          <i class="hero3__dialglow" aria-hidden="true"></i>
          ${bottleImg(hero, { w: 720, cls: 'hero3__bottle', eager: true })}
        </div>
        <figure class="hero3__photoback" aria-hidden="true">
          <img src="/objects/photoback.png" alt="" loading="eager" />
          <figcaption>Zamalek — summer, 1998</figcaption>
        </figure>
        <img class="hero3__papers" src="/objects/envelope.png" alt="" aria-hidden="true" loading="lazy" />
        <img class="hero3__ticket" src="/objects/ticket.png" alt="" aria-hidden="true" loading="lazy" />
      </div>
    </div>
  </section>`;
}

/* ————— the six — horizontal family lineup ————— */

function lineupItem(p) {
  return `
  <div class="lineup__item" style="--accent:${p.accent}" data-pcard="${p.slug}">
    <a class="lineup__link" href="/product/${p.slug}" aria-label="Nº ${p.number} — ${esc(p.name)}, ${p.gender === 'her' ? 'for her' : 'for him'}, ${money(p.sizes[1].price)}"></a>
    ${bottleImg(p, { w: 360, cls: 'lineup__bottle' })}
    <span class="lineup__no">Nº${p.number}</span>
    <strong class="lineup__name">${esc(p.name)}</strong>
    <span class="lineup__edp">Eau de Parfum</span>
    <span class="lineup__for">${p.gender === 'her' ? 'For Her' : 'For Him'}</span>
    <i class="lineup__dot" aria-hidden="true"></i>
    <span class="lineup__price">${money(p.sizes[1].price)}</span>
    <button class="btn btn--small btn--quickadd lineup__add" data-add="${p.slug}" data-ml="${p.sizes[1].ml}">Quick Add</button>
  </div>`;
}

function renderLineup(list) {
  return list.map(lineupItem).join('');
}

function collectionSection() {
  return `
  <section class="lineup" id="collection" aria-labelledby="collection-title">
    <div class="container">
      <div class="lineup__head">
        <div>
          <h2 id="collection-title" class="lineup__title" data-reveal>Three for her.<br/>Three for him.</h2>
          <p class="lineup__subtitle brandword" data-reveal>All six for people who change their mind.</p>
        </div>
        <div class="filters" role="group" aria-label="Filter the collection">
          <button class="filter-tab" data-filter="all" aria-pressed="true">All six</button>
          <button class="filter-tab" data-filter="her" aria-pressed="false">For her</button>
          <button class="filter-tab" data-filter="him" aria-pressed="false">For him</button>
        </div>
      </div>
      <div class="lineup__row" data-collection-grid>${renderLineup(products)}</div>
      <p class="lineup__more" data-reveal><a class="link-line" href="/shop">Browse the full catalogue →</a></p>
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

/* ————— featured scent — room scene + paper panel ————— */

function sixPanel(p, i) {
  return `
  <div class="six__panel" data-six-p="${i}">
    <span class="six__ghostno" aria-hidden="true">${p.number}</span>
    <span class="six__meta">Nº ${p.number} · ${p.gender === 'her' ? 'For Her' : 'For Him'} <i class="lineup__dot" style="--accent:${p.accent}" aria-hidden="true"></i></span>
    <h3>${esc(p.name)}</h3>
    <p class="six__moment">${esc(p.memoryMoment)}</p>
    <div class="six__notecols">
      <div><span class="six__notelabel">Top notes</span><p>${esc(p.topNotes.join(', '))}</p></div>
      <div><span class="six__notelabel">Heart notes</span><p>${esc(p.heartNotes.join(', '))}</p></div>
      <div><span class="six__notelabel">Base notes</span><p>${esc(p.baseNotes.join(', '))}</p></div>
    </div>
    <div class="six__buy">
      <span class="six__price">${money(p.sizes[1].price)}</span>
      <a class="btn btn--dark btn--small" href="/product/${p.slug}">Discover this scent</a>
      <button class="btn btn--small" data-add="${p.slug}" data-ml="${p.sizes[1].ml}">Add to Bag</button>
    </div>
  </div>`;
}

function sixSlide(p) {
  return `
  <article class="six__slide" style="--tint:${p.tint}; --world:${p.world.color}">
    <div class="six__slideplate">${bottleImg(p, { w: 720 })}</div>
    <div class="six__slideinfo">
      <span class="six__meta">Nº ${p.number} · ${p.gender === 'her' ? 'For Her' : 'For Him'} · ${esc(p.fragranceFamily)}</span>
      <h3>${esc(p.name)}</h3>
      <p class="six__moment">${esc(p.memoryMoment)}</p>
      <div class="six__buy">
        <span class="six__price">${money(p.sizes[1].price)}</span>
        <button class="btn btn--small" data-add="${p.slug}" data-ml="${p.sizes[1].ml}">Add to Bag</button>
        <a class="link-line" href="/product/${p.slug}">Full record</a>
      </div>
    </div>
  </article>`;
}

function sixSection() {
  return `
  <section class="six six--rail" data-six aria-labelledby="six-title">
    <div class="container six__head">
      <p class="sechead2__kicker" data-reveal>Six scents. Six doors back.</p>
      <h2 id="six-title" data-reveal>Turn each one over.</h2>
    </div>

    <div class="six__stage" data-six-stage aria-hidden="true">
      <div class="six__scenehalf">
        <div class="six__bottles">
          ${products.map((p, i) => `<div class="six__bottle" data-six-b="${i}">${bottleImg(p, { w: 720 })}</div>`).join('')}
        </div>
      </div>
      <div class="six__paperhalf">
        <div class="six__panels">${products.map(sixPanel).join('')}</div>
      </div>
      <div class="six__dots">${products
        .map((p, i) => `<button type="button" data-six-dot="${i}" aria-label="Show Nº ${p.number} — ${esc(p.name)}"></button>`)
        .join('')}</div>
    </div>

    <div class="six__rail" data-six-rail>
      ${products.map(sixSlide).join('')}
    </div>
  </section>`;
}

/* ————— the spray moment (signature) ————— */

function spraySection() {
  const p = getProduct('midnight-fig');
  return `
  <section class="spray" data-spray style="--world:${p.world.color}">
    <div class="spray__stage" data-spray-stage>
      <i class="spray__fan" aria-hidden="true"></i>
      <div class="spray__intro" data-spray-intro>
        <p class="spray__kicker">The Memória Test</p>
        <h2>Spray the memory.<br/><span class="brandword brandword--onDark">Enter it.</span></h2>
        <p class="spray__hint" aria-hidden="true">keep scrolling — this is the fun part</p>
      </div>
      <!-- media layer: intentionally empty — future scent/world imagery mounts here -->
      <div class="spray__media" data-world-media aria-hidden="true"></div>
      <div class="spray__bottle" data-spray-bottle>${bottleImg(p, { w: 720 })}</div>
      <div class="spray__mist" aria-hidden="true">
        ${Array.from({ length: 7 }, (_, i) => `<i class="spray__puff" data-puff="${i}"></i>`).join('')}
      </div>
      <div class="spray__world" data-spray-world>
        <p class="spray__nowline">You are now remembering:</p>
        <h3 class="spray__place">Nº 04 — ${esc(p.memoryPlace)}.</h3>
        <p class="spray__wcopy">${esc(p.memoryMoment)}</p>
        <div class="spray__cta">
          <button class="btn btn--primary" data-add="${p.slug}" data-ml="100">Add Nº 04 · ${money(p.sizes[1].price)}</button>
          <a class="link-line link-line--cream" href="/product/${p.slug}">Read the full record</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ————— the story — collected over twenty years ————— */

function collageSection() {
  return `
  <section class="collage" aria-labelledby="collage-title">
    <div class="container collage__grid">
      <div class="collage__side collage__side--left" aria-hidden="true">
        <figure class="collage__photoback">
          <img src="/objects/photoback.png" alt="" loading="lazy" />
          <figcaption>the balcony, before the buildings grew</figcaption>
        </figure>
        <img class="collage__cassette" src="/objects/cassette.png" alt="" loading="lazy" />
        <img class="collage__keytag" src="/objects/keytag.png" alt="" loading="lazy" />
      </div>
      <div class="collage__copy">
        <h2 id="collage-title" data-reveal>Twenty years of scents.<br/><em>A lifetime of memories.</em></h2>
        <div class="collage__story" data-reveal>
          <p>Memória began with a simple observation: we forget details — but somehow, we remember smells.</p>
          <p>A hallway. A jacket. Fresh sheets. A certain hour of sunlight. Someone sitting beside us.</p>
          <p class="collage__pull">One scent, and suddenly you&rsquo;re there again.</p>
          <p>That became our reason for making perfume. Not to invent memories. <strong>To keep them.</strong></p>
        </div>
        <a class="link-line" href="/our-story" data-reveal>Our story →</a>
      </div>
      <div class="collage__side collage__side--right" aria-hidden="true">
        <figure class="collage__photoback collage__photoback--b">
          <img src="/objects/photoback.png" alt="" loading="lazy" />
          <figcaption>the tram on Emad El-Din</figcaption>
        </figure>
        <img class="collage__ticket" src="/objects/ticket.png" alt="" loading="lazy" />
        <img class="collage__blotter" src="/objects/blotter.png" alt="" loading="lazy" />
      </div>
    </div>
  </section>`;
}

/* ————— values strip ————— */

function valuesSection() {
  const vals = [
    [icons.bottle(), 'Made to be remembered'],
    [icons.sparkle(), 'Memory-enhancing compositions'],
    [icons.seal(), 'Crafted in Cairo'],
    [icons.returns(), 'Easy returns, always'],
  ];
  return `
  <section class="values2" aria-label="The house promises">
    <div class="container values2__row">
      ${vals.map(([ic, t]) => `<div class="values2__item" data-reveal>${ic}<span>${t}</span></div>`).join('')}
    </div>
  </section>`;
}

/* ————— dark closing band ————— */

function darkbandSection() {
  return `
  <section class="darkband" aria-labelledby="darkband-title">
    <div class="container darkband__inner">
      <div class="darkband__copy">
        <h2 id="darkband-title" data-reveal>Find the scent that<br/>takes you back.</h2>
        <div class="darkband__ctas" data-reveal>
          <a class="btn btn--ghost-light" href="/shop">Shop all scents</a>
          <button class="btn btn--ghost-light" data-open-finder-3>Ask the Memory Department</button>
        </div>
      </div>
      <div class="tornnote tornnote--closing" aria-hidden="true">
        <p>A scent is the shortest distance<br/>between where you are<br/>and where you&rsquo;ve been.</p>
        <span>MEMÓRIA</span>
      </div>
    </div>
  </section>`;
}

/* ————— hotline ————— */

function hotlineSection() {
  return `
  <section class="hotline" aria-labelledby="hotline-title">
    <div class="container hotline__inner">
      <div>
        <p class="hotline__badge" data-reveal>The Memória Hotline</p>
        <h2 id="hotline-title" data-reveal>What are you remembering?</h2>
        <p class="hotline__sub" data-reveal>Write to the Memory Department. Every submission is read, filed, and occasionally answered with a sample.</p>
        <figure class="ringcard" data-reveal>
          <blockquote>“The fan was turning, and everyone was still awake.”</blockquote>
          <figcaption>Cairo · summer · shared anonymously</figcaption>
        </figure>
      </div>
      <img class="hotline__envelope" src="/objects/envelope.png" alt="" aria-hidden="true" loading="lazy" />
      <form class="hotline__form" data-hotline data-reveal>
        <label class="sr-only" for="hotline-email">Email address</label>
        <input id="hotline-email" type="email" required placeholder="you@somewhere.com" autocomplete="email" />
        <button class="btn btn--primary" type="submit">Report a memory</button>
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
      collageSection(),
      valuesSection(),
      darkbandSection(),
      hotlineSection(),
    ].join('');
  },

  mount(root) {
    /* — commerce wiring — */
    const grid = root.querySelector('[data-collection-grid]');
    let disposeGrid = mountProductCards(grid);
    mountProductCards(root.querySelector('[data-six]'));
    mountProductCards(root.querySelector('[data-spray]'));

    /* — collection filters: crossfade, no jump — */
    root.querySelectorAll('.filter-tab').forEach((tab) =>
      tab.addEventListener('click', () => {
        root.querySelectorAll('.filter-tab').forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
        const h = grid.offsetHeight;
        grid.style.minHeight = h + 'px';
        grid.classList.add('is-swapping');
        setTimeout(() => {
          disposeGrid();
          grid.innerHTML = renderLineup(getByGender(tab.dataset.filter));
          disposeGrid = mountProductCards(grid);
          scanReveals(grid);
          grid.classList.remove('is-swapping');
          setTimeout(() => (grid.style.minHeight = ''), 400);
        }, 170);
      })
    );

    /* — finder openers — */
    root.querySelectorAll('[data-open-finder-2],[data-open-finder-3]').forEach((b) => b.addEventListener('click', openFinder));

    /* — pause the forecast loop while offscreen — */
    const forecast = root.querySelector('.forecast');
    if (forecast) {
      const io = new IntersectionObserver(([e]) => forecast.classList.toggle('is-offscreen', !e.isIntersecting));
      io.observe(forecast);
      onPageCleanup(() => io.disconnect());
    }

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

    /* — hero: bottle breathes, papers drift on scroll — */
    if (ok) {
      const float = gsap.to('.hero3__bottle', { y: -8, duration: 4.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      onPageCleanup(() => float.kill());
      if (wide) {
        const drift = gsap.to(['.hero3__photoback', '.hero3__ticket', '.hero3__papers'], {
          y: -26,
          ease: 'none',
          scrollTrigger: { trigger: '.hero3', start: 'top top', end: 'bottom top', scrub: 0.8 },
        });
        onPageCleanup(() => drift.kill());
      }
    }

    /* — the six: controlled carousel (scroll or dots) — */
    const six = root.querySelector('[data-six]');
    if (ok && wide) {
      six.classList.remove('six--rail');
      const stage = six.querySelector('[data-six-stage]');
      stage.removeAttribute('aria-hidden');
      const bottles = [...stage.querySelectorAll('[data-six-b]')];
      const panels = [...stage.querySelectorAll('[data-six-p]')];
      const dots = [...stage.querySelectorAll('[data-six-dot]')];

      gsap.set(bottles.slice(1), { autoAlpha: 0, xPercent: 9, scale: 0.97, transformPerspective: 900 });
      gsap.set(panels.slice(1), { autoAlpha: 0, y: 16 });
      dots[0].classList.add('is-on');

      let current = 0;
      let animating = false;
      let pending = null;

      const goTo = (target) => {
        if (target === current || target < 0 || target > 5) return;
        if (animating) {
          pending = target;
          return;
        }
        animating = true;
        const dir = target > current ? 1 : -1;
        const from = current;
        current = target;
        dots.forEach((d, j) => d.classList.toggle('is-on', j === target));
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            animating = false;
            if (pending !== null) {
              const next = pending;
              pending = null;
              goTo(next);
            }
          },
        });
        tl.to(bottles[from], { autoAlpha: 0, xPercent: -9 * dir, scale: 0.97, duration: 0.4 }, 0)
          .to(panels[from], { autoAlpha: 0, y: -14 * dir, duration: 0.3 }, 0)
          .fromTo(
            bottles[target],
            { autoAlpha: 0, xPercent: 9 * dir, scale: 0.97 },
            { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.5 },
            0.18
          )
          .fromTo(panels[target], { autoAlpha: 0, y: 16 * dir }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.28);
        onPageCleanup(() => tl.kill());
      };

      const st = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: '+=250%',
        pin: stage,
        onUpdate(self) {
          goTo(Math.min(5, Math.floor(self.progress * 6)));
        },
      });
      onPageCleanup(() => st.kill());

      dots.forEach((d, i) =>
        d.addEventListener('click', () => {
          const y = st.start + ((st.end - st.start) * (i + 0.5)) / 6;
          window.scrollTo({ top: y, behavior: 'smooth' });
          goTo(i);
        })
      );
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
        .to(stage, { backgroundColor: getProduct('midnight-fig').world.color, duration: 0.6 }, 1.35)
        .to(puffs, { opacity: 0, duration: 0.5 }, 1.8)
        .to(bottle, { xPercent: 30, scale: 1.06, duration: 0.7 }, 1.7)
        .to(world, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.9);
      onPageCleanup(() => tl.kill());
    } else {
      spray.classList.add('spray--static');
    }
  },
};
