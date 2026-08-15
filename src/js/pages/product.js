/**
 * MEMÓRIA · Product page — buy first, story after. Sticky bag bar on mobile.
 */
import { esc, money, toast } from '../utils.js';
import { getProduct, getRelated, genderLabel } from '../data/products.js';
import { renderBottle, renderBottleStage } from '../components/bottle.js';
import { renderMotif, renderNoteIcon } from '../components/artwork.js';
import { renderProductCard, mountProductCards } from '../components/productCard.js';
import { icons } from '../components/icons.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from '../components/cartDrawer.js';
import { navigate } from '../router.js';
import { attachTilt, floatBottle, sweepBottle, driftMist, onPageCleanup, motionOK, gsap } from '../motion.js';

function notesBlock(p) {
  return `
  <div class="notes-block">
    <div class="notes-row"><span class="label">Top Notes</span><p>${esc(p.topNotes.join(' · '))}</p></div>
    <div class="notes-row"><span class="label">Heart Notes</span><p>${esc(p.heartNotes.join(' · '))}</p></div>
    <div class="notes-row"><span class="label">Base Notes</span><p>${esc(p.baseNotes.join(' · '))}</p></div>
  </div>`;
}

export default {
  title: (params) => {
    const p = getProduct(params.slug);
    return p ? `Nº ${p.number} ${p.name} — MEMÓRIA` : 'Perfume — MEMÓRIA';
  },

  render(params) {
    const p = getProduct(params.slug);
    if (!p) {
      return `
      <section class="container notfound">
        <span class="stamp">Catalogue · No Entry</span>
        <h1>This scent isn’t in the archive.</h1>
        <p>Perhaps it was only a dream — the collection lives here:</p>
        <a class="btn btn--primary" href="/shop">Shop the Collection</a>
      </section>`;
    }

    const motifs = p.motifs || ['sketch', 'city'];
    const allNotes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes];
    const related = getRelated(p, 2);
    const genderCrumb = p.gender === 'her' ? { href: '/women', label: 'Women' } : { href: '/men', label: 'Men' };

    return `
    <article class="pdp" style="--mist-c:${p.mist}">
      <div class="container">
        <div class="pdp__layout">

          <div class="pdp__gallery">
            <div class="pdp__stage" data-pdp-stage>
              <span class="stamp">Nº ${p.number} · Cairo</span>
              <span class="stamp stamp--r">${esc(p.concentration)}</span>
              ${renderBottleStage(p, { mists: 3, reflection: true })}
            </div>
            <p class="pdp__hint">Move over the bottle — it turns toward you</p>
            <div class="pdp__views" aria-hidden="true">
              <div class="pdp__view">${renderBottle(p, { label: true })}</div>
              <div class="pdp__view">${renderBottle(p, { label: false })}</div>
              <div class="pdp__view" style="color:var(--brown)"><span style="width:62%;display:block">${renderNoteIcon(p.noteIcons[0])}</span></div>
            </div>
          </div>

          <div class="pdp__buy">
            <nav class="crumbs" aria-label="Breadcrumb">
              <a href="/">Memória</a><span aria-hidden="true">/</span>
              <a href="${genderCrumb.href}">${genderCrumb.label}</a><span aria-hidden="true">/</span>
              <span>Nº ${p.number}</span>
            </nav>
            <div>
              <span class="label label--faint">MEMÓRIA Nº ${p.number} · ${genderLabel(p.gender)}</span>
              <h1 class="pdp__title">${esc(p.name)}</h1>
            </div>
            <div class="pdp__gender-row">
              <span class="pdp__fam">${esc(p.fragranceFamily)}</span>
              <span class="label label--faint">${esc(p.concentration)}</span>
            </div>
            <p class="pdp__short">${esc(p.description)}</p>

            <div class="pdp__notes">
              <span class="label">The Notes</span>
              ${notesBlock(p)}
            </div>

            <div class="field">
              <label id="size-label">Size</label>
              <div class="sizes" role="group" aria-labelledby="size-label" data-sizes>
                ${p.sizes
                  .map(
                    (s, i) => `
                  <button class="size-opt" data-ml="${s.ml}" data-price="${s.price}" aria-pressed="${i === p.sizes.length - 1}">
                    <strong>${s.ml} ML</strong>
                    <span>${money(s.price)}</span>
                  </button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="pdp__price">
              <span data-price-display aria-live="polite">${money(p.sizes[p.sizes.length - 1].price)}</span>
              <small>VAT included · placeholder pricing</small>
            </div>

            <div class="pdp__ctarow">
              <div class="qty" aria-label="Quantity">
                <button data-qty="-1" aria-label="Decrease quantity">−</button>
                <span data-qty-display aria-live="polite">1</span>
                <button data-qty="1" aria-label="Increase quantity">+</button>
              </div>
              <button class="btn btn--primary" data-add-main>Add to Bag</button>
            </div>
            <button class="btn btn--dark pdp__buynow" data-buy-now>Buy It Now</button>

            <ul class="pdp__assure">
              <li>${icons.truck()} Hand-wrapped and delivered with care</li>
              <li>${icons.seal()} A MEMÓRIA house original — blended by us</li>
              <li>${icons.returns()} Unopened bottles exchangeable within 14 days</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ——— Storytelling ——— -->
      <section class="pdp-story" aria-labelledby="memory-title">
        <div class="container pdp-story__inner">
          <div class="pdp-story__art">
            <div class="acard" style="--tilt:-3deg" data-reveal>
              <div class="acard__img">${renderMotif(motifs[0], { title: esc(p.memoryPlace) })}</div>
              <div class="acard__caption"><span class="hand">${esc(p.memoryPlace.toLowerCase())}</span><span class="stamp">FIG. ${p.number}</span></div>
            </div>
            <div class="acard" style="--tilt:2deg; --reveal-delay:140ms" data-reveal>
              <div class="acard__img">${renderMotif(motifs[1], { title: 'A kept moment' })}</div>
              <div class="acard__caption"><span class="hand">kept, since ${p.archiveYear}*</span><span class="stamp">ARCHIVE</span></div>
            </div>
          </div>
          <div class="pdp-story__copy">
            <span class="stamp" data-reveal>The Memory Behind Nº ${p.number}</span>
            <h2 id="memory-title" data-reveal>${esc(p.memoryPlace)}</h2>
            <span class="hand" data-reveal>“${esc(p.smellsLike.join(', ').toLowerCase())}…”</span>
            <p data-reveal>${esc(p.memoryStory)}</p>
            <p class="stamp" style="margin-top:1rem" data-reveal>* archive year is a placeholder</p>
          </div>
        </div>
      </section>

      <!-- ——— Smells like ——— -->
      <section class="smells" aria-label="Smells like">
        <div class="container">
          <span class="stamp" data-reveal>Smells Like</span>
          <div class="smells__words">
            ${p.smellsLike
              .map((w, i) => `<span class="smells__word" data-reveal style="--reveal-delay:${i * 140}ms">${esc(w)}.</span>`)
              .join('')}
          </div>
        </div>
      </section>

      <!-- ——— The notes, plated ——— -->
      <section class="section--tight" aria-labelledby="plates-title">
        <div class="container">
          <div class="sechead">
            <span class="stamp" data-reveal>Composition</span>
            <h2 id="plates-title" data-reveal>The Notes</h2>
          </div>
          <div class="plates">
            ${['Top', 'Heart', 'Base']
              .map(
                (tier, i) => `
              <div class="plate" data-reveal style="--reveal-delay:${i * 120}ms">
                ${renderNoteIcon(p.noteIcons[i] || p.noteIcons[0])}
                <span class="label">${tier} Notes</span>
                <p>${esc([p.topNotes, p.heartNotes, p.baseNotes][i].join(' · '))}</p>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </section>

      <!-- ——— Related ——— -->
      <section class="related" aria-labelledby="related-title">
        <div class="container">
          <div class="sechead">
            <span class="stamp" data-reveal>From the same shelf</span>
            <h2 id="related-title" data-reveal>You may also remember</h2>
          </div>
          <div class="pgrid" data-related>
            ${related.map((r, i) => renderProductCard(r, { revealDelay: i * 110 })).join('')}
          </div>
        </div>
      </section>

      <!-- ——— Sticky mobile bag bar ——— -->
      <div class="stickybuy" data-stickybuy>
        <div class="stickybuy__meta">
          <span class="stickybuy__price" data-sticky-price>${money(p.sizes[p.sizes.length - 1].price)}</span>
          <span class="stickybuy__name">Nº ${p.number} · ${esc(p.name)}</span>
        </div>
        <button class="btn btn--primary btn--small" data-add-sticky>Add to Bag</button>
      </div>
    </article>`;
  },

  mount(root, params) {
    const p = getProduct(params.slug);
    if (!p) return;

    /* — buy state — */
    let selectedMl = p.sizes[p.sizes.length - 1].ml;
    let qty = 1;

    const priceDisplay = root.querySelector('[data-price-display]');
    const stickyPrice = root.querySelector('[data-sticky-price]');
    const qtyDisplay = root.querySelector('[data-qty-display]');

    const currentPrice = () => p.sizes.find((s) => s.ml === selectedMl).price;
    const syncPrice = () => {
      priceDisplay.textContent = money(currentPrice() * qty);
      stickyPrice.textContent = money(currentPrice() * qty);
    };

    root.querySelectorAll('[data-sizes] .size-opt').forEach((btn) =>
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-sizes] .size-opt').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        selectedMl = Number(btn.dataset.ml);
        syncPrice();
      })
    );

    root.querySelectorAll('[data-qty]').forEach((btn) =>
      btn.addEventListener('click', () => {
        qty = Math.max(1, Math.min(10, qty + Number(btn.dataset.qty)));
        qtyDisplay.textContent = qty;
        syncPrice();
      })
    );

    const addToBag = () => {
      cart.add(p.slug, selectedMl, qty);
      openCartDrawer();
    };
    root.querySelector('[data-add-main]').addEventListener('click', addToBag);
    root.querySelector('[data-add-sticky]').addEventListener('click', addToBag);
    root.querySelector('[data-buy-now]').addEventListener('click', () => {
      cart.add(p.slug, selectedMl, qty);
      navigate('/checkout');
    });

    /* — sticky bar visibility (mobile): show once the main CTA scrolls out — */
    const sticky = root.querySelector('[data-stickybuy]');
    const mainCta = root.querySelector('[data-add-main]');
    const io = new IntersectionObserver(
      ([entry]) => sticky.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(mainCta);
    onPageCleanup(() => io.disconnect());

    /* — motion — */
    const stage = root.querySelector('[data-pdp-stage]');
    const bottleStage = stage.querySelector('.bottle-stage');
    onPageCleanup(attachTilt(stage, { max: 10, scale: 1.03 }));
    onPageCleanup(floatBottle(bottleStage, { y: 6, dur: 6 }));
    onPageCleanup(sweepBottle(bottleStage, { every: 4.5 }));
    onPageCleanup(driftMist(stage, { opacity: 0.5 }));

    if (motionOK()) {
      gsap.from(stage, { opacity: 0, y: 24, duration: 0.9, ease: 'power2.out' });
      gsap.from(root.querySelector('.pdp__buy'), { opacity: 0, y: 24, duration: 0.9, delay: 0.12, ease: 'power2.out' });
    }

    mountProductCards(root.querySelector('[data-related]'));
  },
};
