/**
 * MEMÓRIA · Slide-out bag drawer.
 */
import { el, esc, money, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { cart } from '../store/cart.js';
import { productPlate } from './render.js';
import { waLink, cartMessage, waButton } from './whatsapp.js';
import { offerLine } from './price.js';
import { settings } from '../data/catalog.js';

let drawer = null;
let untrap = null;
let isOpen = false;
let lastFocus = null;

function ensureDrawer() {
  if (drawer) return drawer;
  drawer = el(`
    <div class="drawer" aria-hidden="true">
      <div class="drawer__scrim" data-close-cart></div>
      <aside class="drawer__panel" role="dialog" aria-modal="true" aria-label="Your bag">
        <div class="drawer__head">
          <span class="drawer__title">Your bag <span data-drawer-count></span></span>
          <button class="iconbtn" data-close-cart aria-label="Close bag">${icons.close()}</button>
        </div>
        <div class="drawer__body" data-drawer-body data-lenis-prevent></div>
        <div class="drawer__foot" data-drawer-foot hidden>
          <div class="drawer__subtotal">
            <span class="label">Subtotal</span>
            <strong data-drawer-subtotal></strong>
          </div>
          <div class="drawer__subtotal drawer__offer" data-drawer-offer hidden><span data-drawer-offer-label></span><strong data-drawer-offer-amount></strong></div>
          <div class="drawer__subtotal" data-drawer-total-row hidden><span class="label">Estimated total</span><strong data-drawer-total></strong></div>
          <p class="drawer__hint" data-drawer-hint hidden></p>
          <a class="btn btn--primary btn--block" href="/checkout" data-drawer-link>Checkout</a>
          <div data-drawer-wa></div>
          <a class="link-line" style="align-self:center" href="/cart" data-drawer-link>View bag &amp; apply a code</a>
          <p class="drawer__note">Delivery and any discount are calculated at checkout.</p>
        </div>
      </aside>
    </div>`);
  document.querySelector('#overlays').appendChild(drawer);

  drawer.querySelectorAll('[data-close-cart]').forEach((b) => b.addEventListener('click', closeCartDrawer));
  drawer.querySelectorAll('[data-drawer-link]').forEach((a) => a.addEventListener('click', () => closeCartDrawer()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeCartDrawer();
  });
  cart.onChange(() => {
    if (isOpen) renderBody();
  });
  return drawer;
}

function renderBody() {
  const body = drawer.querySelector('[data-drawer-body]');
  const foot = drawer.querySelector('[data-drawer-foot]');
  const count = drawer.querySelector('[data-drawer-count]');
  const items = cart.items;
  count.textContent = items.length ? `· ${cart.count}` : '';

  const focused = document.activeElement;
  const focusMemo =
    body.contains(focused) && focused.closest('[data-line]')
      ? { line: focused.closest('[data-line]').dataset.line, kind: focused.dataset.qty || (focused.dataset.remove !== undefined ? 'remove' : null) }
      : null;

  if (!items.length) {
    body.innerHTML = `
      <div class="drawer__empty">
        <p>Your bag is empty.</p>
        <a class="btn" href="/shop" data-close-empty>Explore the collection</a>
      </div>`;
    body.querySelector('[data-close-empty]').addEventListener('click', () => closeCartDrawer());
    foot.hidden = true;
    return;
  }

  body.innerHTML = items
    .map(
      (l) => `
      <div class="cartline" data-line="${esc(l.variantId)}">
        <a class="cartline__thumb" href="/product/${esc(l.product.slug)}" aria-hidden="true" tabindex="-1">
          ${productPlate(l.product, { sizes: '96px', alt: '' })}
        </a>
        <div class="cartline__info">
          <a class="cartline__name" href="/product/${esc(l.product.slug)}">${esc(l.product.name)}</a>
          <span class="cartline__meta">${esc(l.variant.label)} · ${money(l.unit)}</span>
          <div class="cartline__qty" aria-label="Quantity for ${esc(l.product.name)}">
            <button data-qty="-1" aria-label="Decrease quantity">−</button>
            <span>${l.qty}</span>
            <button data-qty="1" aria-label="Increase quantity" ${l.qty >= 10 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="cartline__right">
          <span class="cartline__price">${money(l.lineTotal)}</span>
          <button class="cartline__remove" data-remove>Remove</button>
        </div>
      </div>`
    )
    .join('');

  body.querySelectorAll('[data-line]').forEach((row) => {
    const id = row.dataset.line;
    row.querySelectorAll('[data-qty]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = cart.items.find((l) => l.variantId === id);
        if (line) cart.setQty(id, line.qty + Number(b.dataset.qty));
      })
    );
    row.querySelector('[data-remove]').addEventListener('click', () => cart.remove(id));
    row.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeCartDrawer()));
  });

  foot.hidden = false;
  drawer.querySelector('[data-drawer-subtotal]').textContent = money(cart.subtotal);
  drawer.querySelector('[data-drawer-wa]').innerHTML = waButton(waLink(cartMessage(null)), 'Order via WhatsApp', 'btn--block');
  const hint = drawer.querySelector('[data-drawer-hint]');
  const o = settings.offer || {};
  hint.hidden = !(o.enabled && cart.count === 1);
  if (!hint.hidden) hint.textContent = `Add one more bottle: ${offerLine()}.`;
  refreshQuote();

  if (focusMemo) {
    const row = body.querySelector(`[data-line="${CSS.escape(focusMemo.line)}"]`) || body.querySelector('[data-line]');
    if (row) {
      const target =
        focusMemo.kind === 'remove' ? row.querySelector('[data-remove]') : row.querySelector(`[data-qty="${focusMemo.kind}"]`) || row.querySelector('[data-qty]');
      target?.focus();
    }
  }
}

let quoteSeq = 0;
async function refreshQuote() {
  const mine = ++quoteSeq;
  let q;
  try {
    q = await cart.quote();
  } catch {
    return;
  }
  if (mine !== quoteSeq || !drawer) return;
  const has = q.discount && Number(q.discount_total) > 0;
  drawer.querySelector('[data-drawer-offer]').hidden = !has;
  drawer.querySelector('[data-drawer-total-row]').hidden = !has;
  if (has) {
    drawer.querySelector('[data-drawer-offer-label]').textContent = q.discount.code || q.discount.name;
    drawer.querySelector('[data-drawer-offer-amount]').textContent = '−' + money(q.discount_total);
    drawer.querySelector('[data-drawer-total]').textContent = money(Number(q.subtotal) - Number(q.discount_total));
  }
  drawer.querySelector('[data-drawer-wa]').innerHTML = waButton(waLink(cartMessage(q)), 'Order via WhatsApp', 'btn--block');
}

export function openCartDrawer() {
  ensureDrawer();
  renderBody();
  lastFocus = document.activeElement;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-drawer');
  lockScroll();
  isOpen = true;
  untrap = trapFocus(drawer.querySelector('.drawer__panel'), closeCartDrawer);
  drawer.querySelector('[data-close-cart][aria-label]').focus();
}

export function closeCartDrawer() {
  if (!drawer || !isOpen) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-drawer');
  unlockScroll();
  isOpen = false;
  untrap?.();
  lastFocus?.focus?.();
}
