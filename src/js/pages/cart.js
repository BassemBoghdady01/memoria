/**
 * MEMÓRIA · Bag page — edit quantities, apply a code (validated by the
 * database), check out or order via WhatsApp.
 */
import { esc, money } from '../utils.js';
import { cart } from '../store/cart.js';
import { productImg } from '../components/render.js';
import { renderRoute } from '../router.js';
import { onPageCleanup } from '../motion.js';
import { waLink, cartMessage, waButton } from '../components/whatsapp.js';
import { setSeo } from '../seo.js';

function line(l) {
  return `
  <div class="bagline" data-line="${esc(l.variantId)}">
    <a class="bagline__thumb" href="/product/${esc(l.product.slug)}" tabindex="-1" aria-hidden="true">${productImg(l.product, { sizes: '140px', alt: '' })}</a>
    <div class="bagline__info">
      <a class="bagline__name" href="/product/${esc(l.product.slug)}">${esc(l.product.name)}</a>
      <span class="bagline__meta">${esc(l.variant.label)} · ${money(l.unit)} each${l.variant.inStock ? '' : ' · <strong>sold out</strong>'}</span>
      <button class="cartline__remove" data-remove>Remove</button>
    </div>
    <div class="qty" role="group" aria-label="Quantity for ${esc(l.product.name)}">
      <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
      <span>${l.qty}</span>
      <button type="button" data-qty="1" aria-label="Increase quantity" ${l.qty >= 10 ? 'disabled' : ''}>+</button>
    </div>
    <span class="bagline__total">${money(l.lineTotal)}</span>
  </div>`;
}

export default {
  title: 'Your bag — MEMÓRIA',
  render() {
    const items = cart.items;
    if (!items.length) {
      return `
      <section class="container shop__empty shop__empty--page">
        <h1>Your bag is empty.</h1>
        <p>Every scent in the collection is one tap away.</p>
        <a class="btn btn--primary" href="/shop">Explore the collection</a>
      </section>`;
    }
    return `
    <section class="container bag">
      <div class="pagehead"><h1>Your bag</h1></div>
      <div class="bag__layout">
        <div class="bag__lines">${items.map(line).join('')}</div>
        <aside class="bag__summary" aria-label="Order summary">
          <form class="coupon" data-coupon>
            <label for="coupon-code" class="label">Discount code</label>
            <div class="coupon__row">
              <input id="coupon-code" name="code" value="${esc(cart.code)}" autocomplete="off" spellcheck="false" maxlength="32" />
              <button class="btn btn--small" type="submit">Apply</button>
            </div>
            <p class="coupon__msg" data-coupon-msg aria-live="polite"></p>
          </form>
          <div class="sumline"><span>Subtotal</span><span data-sub>${money(cart.subtotal)}</span></div>
          <div class="sumline" data-disc-row hidden><span data-disc-label>Discount</span><span data-disc></span></div>
          <div class="sumline"><span>Delivery</span><span>Calculated at checkout</span></div>
          <div class="sumline sumline--total"><span class="label">Estimated total</span><strong data-total>${money(cart.subtotal)}</strong></div>
          <a class="btn btn--primary btn--block" href="/checkout">Checkout</a>
          <div data-wa-slot></div>
          <p class="drawer__note">WhatsApp opens a pre-written message with your bag. The order is confirmed when we reply.</p>
        </aside>
      </div>
    </section>`;
  },
  mount(root) {
    setSeo({ title: 'Your bag — MEMÓRIA', noindex: true });
    onPageCleanup(cart.onChange(() => renderRoute({ scroll: false })));
    if (!cart.items.length) return;

    root.querySelectorAll('[data-line]').forEach((row) => {
      const id = row.dataset.line;
      row.querySelectorAll('[data-qty]').forEach((b) =>
        b.addEventListener('click', () => {
          const l = cart.items.find((x) => x.variantId === id);
          if (l) cart.setQty(id, l.qty + Number(b.dataset.qty));
        })
      );
      row.querySelector('[data-remove]').addEventListener('click', () => cart.remove(id));
    });

    const msg = root.querySelector('[data-coupon-msg]');
    const waSlot = root.querySelector('[data-wa-slot]');
    let seq = 0;
    const refresh = async () => {
      const mine = ++seq;
      waSlot.innerHTML = waButton(waLink(cartMessage(null)), 'Order via WhatsApp', 'btn--block');
      let q;
      try {
        q = await cart.quote();
      } catch {
        if (cart.code) msg.textContent = 'We couldn’t check that code right now. Please try again.';
        return;
      }
      if (mine !== seq) return;
      const discRow = root.querySelector('[data-disc-row]');
      const hasDisc = q.discount && Number(q.discount_total) > 0;
      discRow.hidden = !hasDisc;
      if (hasDisc) {
        root.querySelector('[data-disc-label]').textContent = `Discount (${q.discount.code || q.discount.name})`;
        root.querySelector('[data-disc]').textContent = `−${money(q.discount_total)}`;
      }
      if (!q.preview) root.querySelector('[data-sub]').textContent = money(q.subtotal);
      root.querySelector('[data-total]').textContent = money(Number(q.subtotal) - Number(q.discount_total || 0));
      msg.textContent = cart.code ? (hasDisc ? `${cart.code} applied.` : q.discount_error || '') : '';
      msg.classList.toggle('is-error', Boolean(cart.code && !hasDisc));
      if (q.errors?.length && !q.preview) msg.textContent = q.errors[0];
      waSlot.innerHTML = waButton(waLink(cartMessage(q)), 'Order via WhatsApp', 'btn--block');
    };
    root.querySelector('[data-coupon]').addEventListener('submit', (e) => {
      e.preventDefault();
      cart.setCode(e.target.code.value);
      refresh();
    });
    refresh();
  },
};
