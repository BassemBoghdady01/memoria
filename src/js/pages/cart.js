/**
 * MEMÓRIA · Full bag page (/cart).
 */
import { esc, money } from '../utils.js';
import { cart } from '../store/cart.js';
import { renderBottle } from '../components/bottle.js';
import { genderLabel } from '../data/products.js';
import { onPageCleanup } from '../motion.js';

function renderList() {
  const items = cart.items;
  if (!items.length) {
    return `
    <div class="shop__empty">
      <p>Your bag is empty — no memories chosen yet.</p>
      <a class="btn btn--primary" href="/shop">Shop the Collection</a>
    </div>`;
  }
  return `
  <div class="cartpage__layout">
    <div class="cartpage__list" data-cart-list>
      ${items
        .map(
          (l) => `
        <div class="cartline" data-line="${l.slug}:${l.ml}">
          <a class="cartline__thumb" href="/product/${l.slug}">${renderBottle(l.product, { label: false })}</a>
          <div class="cartline__info">
            <a class="cartline__name" href="/product/${l.slug}">Nº ${l.product.number} · ${esc(l.product.name)}</a>
            <span class="cartline__meta">${genderLabel(l.product.gender)} · ${esc(l.product.concentration)} · ${l.ml} ml</span>
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
        .join('')}
    </div>
    <aside class="cartpage__summary" aria-label="Order summary">
      <h2>Summary</h2>
      <div class="sumline"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
      <div class="sumline"><span>Delivery</span><span>Confirmed by phone</span></div>
      <div class="sumline sumline--total">
        <span class="label">Total</span>
        <strong>${money(cart.subtotal)}</strong>
      </div>
      <a class="btn btn--primary btn--block" href="/checkout">Checkout</a>
      <a class="link-line" style="align-self:center" href="/shop">Continue shopping</a>
    </aside>
  </div>`;
}

export default {
  title: 'Your Bag — MEMÓRIA',
  render() {
    return `
    <section class="container">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Memória</a><span aria-hidden="true">/</span><span>Your Bag</span>
        </nav>
        <h1>Your Bag</h1>
      </div>
      <div data-cart-root>${renderList()}</div>
    </section>`;
  },
  mount(root) {
    const rootEl = root.querySelector('[data-cart-root]');
    const wire = () => {
      rootEl.querySelectorAll('[data-line]').forEach((row) => {
        const [slug, ml] = row.dataset.line.split(':');
        row.querySelectorAll('[data-qty]').forEach((b) =>
          b.addEventListener('click', () => {
            const line = cart.items.find((l) => l.slug === slug && l.ml === Number(ml));
            if (line) cart.setQty(slug, Number(ml), line.qty + Number(b.dataset.qty));
          })
        );
        row.querySelector('[data-remove]').addEventListener('click', () => cart.remove(slug, Number(ml)));
      });
    };
    wire();
    const off = cart.onChange(() => {
      rootEl.innerHTML = renderList();
      wire();
    });
    onPageCleanup(off);
  },
};
