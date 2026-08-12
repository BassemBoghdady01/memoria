/**
 * MEMÓRIA · Slide-out bag drawer.
 */
import { $, el, esc, money, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { cart } from '../store/cart.js';
import { renderBottle } from './bottle.js';
import { genderLabel } from '../data/products.js';
import { navigate } from '../router.js';

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
          <span class="drawer__title">Your Bag <span data-drawer-count></span></span>
          <button class="iconbtn" data-close-cart aria-label="Close bag">${icons.close()}</button>
        </div>
        <div class="drawer__body" data-drawer-body data-lenis-prevent></div>
        <div class="drawer__foot" data-drawer-foot hidden>
          <div class="drawer__subtotal">
            <span class="label">Subtotal</span>
            <strong data-drawer-subtotal></strong>
          </div>
          <a class="btn btn--primary btn--block" href="/checkout" data-drawer-checkout>Checkout</a>
          <a class="link-line" style="align-self:center" href="/cart" data-drawer-viewbag>View bag</a>
          <p class="drawer__note">Delivery confirmed by phone after checkout.</p>
        </div>
      </aside>
    </div>`);
  document.querySelector('#overlays').appendChild(drawer);

  drawer.querySelectorAll('[data-close-cart]').forEach((b) => b.addEventListener('click', closeCartDrawer));
  drawer.querySelector('[data-drawer-checkout]').addEventListener('click', () => closeCartDrawer());
  drawer.querySelector('[data-drawer-viewbag]').addEventListener('click', () => closeCartDrawer());
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

  /* remember which control the user was on, so a rebuild doesn't drop
     keyboard focus back to <body> */
  const focused = document.activeElement;
  const focusMemo =
    body.contains(focused) && focused.closest('[data-line]')
      ? {
          line: focused.closest('[data-line]').dataset.line,
          kind: focused.dataset.qty || (focused.dataset.remove !== undefined ? 'remove' : null),
        }
      : null;

  if (!items.length) {
    body.innerHTML = `
      <div class="drawer__empty">
        <p>Your bag is empty —<br/>no memories chosen yet.</p>
        <a class="btn" href="/shop" data-close-empty>Shop the Collection</a>
      </div>`;
    body.querySelector('[data-close-empty]').addEventListener('click', () => closeCartDrawer());
    foot.hidden = true;
    return;
  }

  body.innerHTML = items
    .map(
      (l) => `
      <div class="cartline" data-line="${l.slug}:${l.ml}">
        <a class="cartline__thumb" href="/product/${l.slug}" aria-hidden="true" tabindex="-1">
          ${renderBottle(l.product, { label: false })}
        </a>
        <div class="cartline__info">
          <a class="cartline__name" href="/product/${l.slug}">Nº ${l.product.number} · ${esc(l.product.name)}</a>
          <span class="cartline__meta">${genderLabel(l.product.gender)} · ${l.ml} ml</span>
          <div class="cartline__qty" aria-label="Quantity">
            <button data-qty="-1" aria-label="Decrease quantity">−</button>
            <span>${l.qty}</span>
            <button data-qty="1" aria-label="Increase quantity">+</button>
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
    const [slug, ml] = row.dataset.line.split(':');
    row.querySelectorAll('[data-qty]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = cart.items.find((l) => l.slug === slug && l.ml === Number(ml));
        if (line) cart.setQty(slug, Number(ml), line.qty + Number(b.dataset.qty));
      })
    );
    row.querySelector('[data-remove]').addEventListener('click', () => cart.remove(slug, Number(ml)));
    row.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeCartDrawer()));
  });

  foot.hidden = false;
  drawer.querySelector('[data-drawer-subtotal]').textContent = money(cart.subtotal);

  if (focusMemo) {
    const row = body.querySelector(`[data-line="${focusMemo.line}"]`) || body.querySelector('[data-line]');
    if (row) {
      const target =
        focusMemo.kind === 'remove'
          ? row.querySelector('[data-remove]')
          : row.querySelector(`[data-qty="${focusMemo.kind}"]`) || row.querySelector('[data-qty]');
      target?.focus();
    }
  }
}

export function openCartDrawer() {
  ensureDrawer();
  renderBody();
  lastFocus = document.activeElement;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  lockScroll();
  isOpen = true;
  untrap = trapFocus(drawer.querySelector('.drawer__panel'), closeCartDrawer);
  drawer.querySelector('[data-close-cart][aria-label]').focus();
}

export function closeCartDrawer() {
  if (!drawer || !isOpen) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  unlockScroll();
  isOpen = false;
  untrap?.();
  lastFocus?.focus?.();
}
