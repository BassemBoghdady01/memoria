/**
 * MEMÓRIA · Product page — buy first, story after.
 * Gallery = the supplied photographs. Dragging the bottle turns it through
 * the real photographed angles (no faked rotation). Sticky bag bar on mobile.
 */
import { esc, money } from '../utils.js';
import { settings, getProduct, getRelated, pricedVariants, defaultVariant, unitPrice, isSoldOut } from '../data/catalog.js';
import { productImg } from '../components/render.js';
import { renderProductCard, mountProductCards } from '../components/productCard.js';
import { icons } from '../components/icons.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from '../components/cartDrawer.js';
import { navigate } from '../router.js';
import { onPageCleanup, motionOK, gsap } from '../motion.js';
import { waLink, productMessage, enquiryMessage, waButton, waIcon } from '../components/whatsapp.js';
import { setSeo, productJsonLd } from '../seo.js';
import { offerLine } from '../components/price.js';

/* order in which the photographed views read as one turn of the bottle */
const TURN = ['Opposite three-quarter', 'Front', 'Three-quarter', 'Side'];

function notesBlock(p) {
  const rows = [
    ['Top', p.notes.top],
    ['Heart', p.notes.heart],
    ['Base', p.notes.base],
  ].filter(([, n]) => n.length);
  if (!rows.length) return '';
  return `
  <div class="pdp__notes">
    <span class="label">The notes</span>
    <div class="notes-block">
      ${rows.map(([t, n]) => `<div class="notes-row"><span class="label">${t}</span><p>${esc(n.join(' · '))}</p></div>`).join('')}
    </div>
  </div>`;
}

function buyBox(p) {
  const priced = pricedVariants(p);
  if (!priced.length) {
    const wa = waLink(enquiryMessage(p));
    return `
    <div class="pdp__unpriced">
      <p class="pdp__unpriced-note">Online ordering for ${esc(p.name)} opens as soon as sizes and prices are published.</p>
      ${waButton(wa, `Ask about ${p.name} on WhatsApp`, 'btn--block')}
    </div>`;
  }
  const v = defaultVariant(p);
  const sold = isSoldOut(p);
  return `
    ${
      priced.length > 1 || priced[0].label
        ? `<div class="field">
      <span class="label" id="size-label">Size</span>
      <div class="sizes" role="radiogroup" aria-labelledby="size-label" data-sizes>
        ${priced
          .map(
            (s) => `
          <button type="button" class="size-opt" role="radio" data-variant="${esc(s.id)}" aria-checked="${s.id === v.id}" ${s.inStock ? '' : 'data-soldout'}>
            <strong>${esc(s.label)}</strong>
            <span>${s.inStock ? money(unitPrice(s)) : 'Sold out'}</span>
          </button>`
          )
          .join('')}
      </div>
    </div>`
        : ''
    }
    <div class="pdp__price" aria-live="polite">
      <s data-price-was hidden></s>
      <span data-price-display></span>
      <span class="pdp__stock" data-stock></span>
    </div>
    ${offerLine() ? `<p class="pdp__offer">${esc(offerLine())}<small>${esc(settings.offer?.detail || '')}</small></p>` : ''}
    <div class="pdp__ctarow">
      <div class="qty" role="group" aria-label="Quantity">
        <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
        <span data-qty-display aria-live="polite">1</span>
        <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
      </div>
      <button type="button" class="btn btn--primary" data-add-main ${sold ? 'disabled' : ''}>Add to bag</button>
    </div>
    <button type="button" class="btn btn--dark btn--block" data-buy-now ${sold ? 'disabled' : ''}>Buy it now</button>
    <div data-wa-slot></div>
    <p class="pdp__wanote">WhatsApp opens a pre-written message. Your order is confirmed once we reply.</p>`;
}

export default {
  title: (params) => {
    const p = getProduct(params.slug);
    return p ? `${p.seoTitle || `${p.name} — MEMÓRIA`}` : 'Perfume — MEMÓRIA';
  },

  render(params) {
    const p = getProduct(params.slug);
    if (!p) {
      return `
      <section class="container notfound">
        <span class="stamp">Not in the collection</span>
        <h1>This scent isn’t here.</h1>
        <p>It may have been renamed or retired. The full collection is one click away.</p>
        <a class="btn btn--primary" href="/shop">Shop the collection</a>
      </section>`;
    }
    const related = getRelated(p, 3);
    const turnFrames = TURN.map((label) => p.gallery.find((g) => g.view === label)).filter(Boolean);
    const thumbs = p.gallery;
    const crumbCat = p.category ? `<a href="/shop?c=${esc(p.category.slug)}">${esc(p.category.name)}</a><span aria-hidden="true">/</span>` : '';
    const storyText = p.story?.text || p.story?.memoryStory;

    return `
    <article class="pdp">
      <div class="container">
        <div class="pdp__layout">
          <div class="pdp__gallery">
            <div class="pdp__stage" data-pdp-stage ${turnFrames.length > 1 ? 'data-turnable' : ''}>
              ${productImg(p, { image: thumbs[0], cls: 'pdp__main', sizes: '(max-width: 900px) 100vw, 55vw', eager: true })}
              <i class="pdp__sheen" aria-hidden="true"></i>
            </div>
            ${
              turnFrames.length > 1
                ? `<p class="pdp__hint" data-turn-hint>${icons.arrowRight()} Drag the bottle to turn it · real photographed angles</p>`
                : ''
            }
            ${
              thumbs.length > 1
                ? `<div class="pdp__thumbs" role="tablist" aria-label="Product photographs">
                ${thumbs
                  .map(
                    (g, i) => `<button type="button" role="tab" class="pdp__thumb" data-thumb="${i}" aria-selected="${i === 0}" aria-label="${esc(g.view || 'View ' + (i + 1))}">
                      ${productImg(p, { image: g, sizes: '80px', alt: '' })}</button>`
                  )
                  .join('')}
              </div>`
                : ''
            }
          </div>

          <div class="pdp__buy">
            <nav class="crumbs" aria-label="Breadcrumb">
              <a href="/">Home</a><span aria-hidden="true">/</span>
              <a href="/shop">Collection</a><span aria-hidden="true">/</span>
              ${crumbCat}<span aria-current="page">${esc(p.name)}</span>
            </nav>
            <div>
              <span class="label label--faint">${esc(['MEMÓRIA', p.category?.name, p.concentration].filter(Boolean).join(' · '))}</span>
              <h1 class="pdp__title">${esc(p.name)}</h1>
              ${p.family ? `<span class="pdp__fam">${esc(p.family)}</span>` : ''}
            </div>
            ${p.story?.tagline ? `<p class="pdp__tagline">${esc(p.story.tagline)}</p>` : ''}
            ${p.shortDescription || p.description ? `<p class="pdp__short">${esc(p.description || p.shortDescription)}</p>` : ''}
            ${notesBlock(p)}
            ${buyBox(p)}
            <ul class="pdp__assure">
              <li>${icons.truck()} Delivery across Egypt · fee shown at checkout</li>
              <li>${icons.seal()} Guest checkout · no account needed</li>
            </ul>
          </div>
        </div>
      </div>

      ${
        storyText
          ? `<section class="pdp-story" aria-labelledby="memory-title">
        <div class="container pdp-story__inner">
          <div class="pdp-story__copy">
            <span class="stamp" data-reveal>The memory</span>
            ${p.story.place ? `<h2 id="memory-title" data-reveal>${esc(p.story.place)}</h2>` : `<h2 id="memory-title" class="sr-only">The memory behind ${esc(p.name)}</h2>`}
            <p data-reveal>${esc(storyText)}</p>
          </div>
        </div>
      </section>`
          : ''
      }

      ${
        related.length
          ? `<section class="related" aria-labelledby="related-title">
        <div class="container">
          <div class="sechead"><h2 id="related-title" data-reveal>More from the collection</h2></div>
          <div class="pgrid pgrid--3" data-related>
            ${related.map((r, i) => renderProductCard(r, { revealDelay: i * 90 })).join('')}
          </div>
        </div>
      </section>`
          : ''
      }

      ${
        pricedVariants(p).length
          ? `<div class="stickybuy" data-stickybuy>
        <div class="stickybuy__meta">
          <span class="stickybuy__price" data-sticky-price></span>
          <span class="stickybuy__name">${esc(p.name)} · <span data-sticky-size></span></span>
        </div>
        <a class="iconbtn stickybuy__wa" data-sticky-wa target="_blank" rel="noopener" aria-label="Order via WhatsApp">${waIcon()}</a>
        <button type="button" class="btn btn--primary btn--small" data-add-sticky ${isSoldOut(p) ? 'disabled' : ''}>Add to bag</button>
      </div>`
          : ''
      }
    </article>`;
  },

  mount(root, params) {
    const p = getProduct(params.slug);
    if (!p) {
      setSeo({ title: 'Not found — MEMÓRIA', noindex: true });
      return;
    }
    setSeo({
      title: p.seoTitle || `${p.name} — MEMÓRIA`,
      description: p.seoDescription || p.shortDescription || p.description || `${p.name}, a perfume by MEMÓRIA.`,
      image: p.gallery[0]?.url?.replace('-960.', '-1600.'),
      type: 'product',
      jsonLd: productJsonLd(p, unitPrice),
    });

    /* — gallery: thumbnails + drag-to-turn through the real angles — */
    const stage = root.querySelector('[data-pdp-stage]');
    const main = stage.querySelector('.pdp__main');
    const show = (img) => {
      if (!img || !main) return;
      main.src = img.url;
      if (img.srcset) main.srcset = img.srcset;
      main.alt = img.alt || p.name;
    };
    const thumbs = [...root.querySelectorAll('[data-thumb]')];
    const selectThumb = (i) => {
      thumbs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
      show(p.gallery[i]);
    };
    thumbs.forEach((t, i) => t.addEventListener('click', () => selectThumb(i)));

    const frames = TURN.map((label) => p.gallery.find((g) => g.view === label)).filter(Boolean);
    if (frames.length > 1) {
      frames.forEach((f) => {
        const pre = new Image();
        pre.srcset = f.srcset || '';
        pre.src = f.url;
      });
      let idx = Math.max(0, frames.findIndex((f) => f.view === 'Front'));
      let startX = null;
      let startIdx = idx;
      const step = () => Math.max(40, stage.clientWidth / (frames.length * 1.4));
      const setFrame = (i) => {
        idx = Math.max(0, Math.min(frames.length - 1, i));
        show(frames[idx]);
        const ti = p.gallery.indexOf(frames[idx]);
        thumbs.forEach((t, j) => t.setAttribute('aria-selected', String(j === ti)));
      };
      stage.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startIdx = idx;
        stage.setPointerCapture(e.pointerId);
        stage.classList.add('is-turning');
      });
      stage.addEventListener('pointermove', (e) => {
        if (startX === null) return;
        setFrame(startIdx + Math.round((e.clientX - startX) / step()));
      });
      const end = () => {
        startX = null;
        stage.classList.remove('is-turning');
      };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);
      stage.tabIndex = 0;
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', `${p.name}. Use left and right arrow keys to turn the bottle.`);
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') setFrame(idx + 1);
        if (e.key === 'ArrowLeft') setFrame(idx - 1);
      });
    }

    /* — buy state — */
    const priced = pricedVariants(p);
    if (!priced.length) return mountRelated(root);
    let variant = defaultVariant(p);
    let qty = 1;
    const priceEl = root.querySelector('[data-price-display]');
    const wasEl = root.querySelector('[data-price-was]');
    const stockEl = root.querySelector('[data-stock]');
    const qtyEl = root.querySelector('[data-qty-display]');
    const addMain = root.querySelector('[data-add-main]');
    const buyNow = root.querySelector('[data-buy-now]');
    const addSticky = root.querySelector('[data-add-sticky]');
    const waSlot = root.querySelector('[data-wa-slot]');
    const stickyWa = root.querySelector('[data-sticky-wa]');

    const sync = () => {
      const unit = unitPrice(variant);
      priceEl.textContent = money(unit * qty);
      const onSale = variant.salePrice !== null;
      wasEl.hidden = !onSale;
      if (onSale) wasEl.textContent = money(variant.price * qty);
      stockEl.textContent = !variant.inStock ? 'Sold out' : variant.lowStock ? 'Only a few left' : '';
      [addMain, buyNow, addSticky].forEach((b) => b && (b.disabled = !variant.inStock));
      root.querySelector('[data-sticky-price]').textContent = money(unit * qty);
      root.querySelector('[data-sticky-size]').textContent = variant.label;
      const href = waLink(productMessage(p, variant, qty));
      waSlot.innerHTML = waButton(href, 'Order via WhatsApp', 'btn--block');
      if (stickyWa) {
        if (href) stickyWa.href = href;
        else stickyWa.remove();
      }
    };

    root.querySelectorAll('[data-sizes] .size-opt').forEach((btn) =>
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-sizes] .size-opt').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
        variant = priced.find((v) => v.id === btn.dataset.variant) || variant;
        sync();
      })
    );
    root.querySelectorAll('[data-qty]').forEach((btn) =>
      btn.addEventListener('click', () => {
        qty = Math.max(1, Math.min(10, qty + Number(btn.dataset.qty)));
        qtyEl.textContent = qty;
        sync();
      })
    );
    const add = () => {
      if (cart.add(variant.id, qty)) openCartDrawer();
    };
    addMain.addEventListener('click', add);
    addSticky?.addEventListener('click', add);
    buyNow.addEventListener('click', () => {
      if (cart.add(variant.id, qty)) navigate('/checkout');
    });
    sync();

    /* sticky bar: show once the main CTA has scrolled away */
    const sticky = root.querySelector('[data-stickybuy]');
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', on);
        document.body.classList.toggle('has-stickybuy', on);
      },
      { threshold: 0 }
    );
    io.observe(addMain);
    onPageCleanup(() => {
      io.disconnect();
      document.body.classList.remove('has-stickybuy');
    });

    /* light passes across the glass as the page scrolls */
    if (motionOK()) {
      const sheen = gsap.fromTo(
        stage.querySelector('.pdp__sheen'),
        { xPercent: -120 },
        { xPercent: 120, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 80%', end: 'bottom 20%', scrub: 0.6 } }
      );
      onPageCleanup(() => sheen.scrollTrigger?.kill() || sheen.kill());
      gsap.from(root.querySelector('.pdp__buy'), { opacity: 0, y: 18, duration: 0.8, ease: 'power2.out' });
    }
    mountRelated(root);
  },
};

function mountRelated(root) {
  mountProductCards(root.querySelector('[data-related]'));
}
