/**
 * MEMÓRIA · Checkout — modern, clear, friction-free.
 * Demo storefront: validates locally, simulates order placement,
 * and is structured for a real payment backend to slot in later.
 */
import { esc, money, toast } from '../utils.js';
import { cart } from '../store/cart.js';
import { renderBottle } from '../components/bottle.js';
import { icons } from '../components/icons.js';
import { navigate, renderRoute } from '../router.js';
import { onPageCleanup } from '../motion.js';

function summary() {
  const items = cart.items;
  return `
  <aside class="checkout__summary" aria-label="Order summary">
    <h2>Your Order</h2>
    <div class="checkout__mini">
      ${items
        .map(
          (l) => `
        <div class="miniline">
          <span class="cartline__thumb">${renderBottle(l.product, { label: false })}</span>
          <span>
            <span class="miniline__name">Nº ${l.product.number} · ${esc(l.product.name)}</span><br/>
            <span class="miniline__meta">${l.ml} ml × ${l.qty}</span>
          </span>
          <span class="miniline__price">${money(l.lineTotal)}</span>
        </div>`
        )
        .join('')}
    </div>
    <div class="sumline"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
    <div class="sumline"><span>Delivery</span><span>Confirmed by phone</span></div>
    <div class="sumline sumline--total">
      <span class="label">Total</span>
      <strong>${money(cart.subtotal)}</strong>
    </div>
  </aside>`;
}

export default {
  title: 'Checkout — MEMÓRIA',
  render() {
    if (!cart.items.length) {
      return `
      <section class="container shop__empty">
        <p>Your bag is empty — there is nothing to check out yet.</p>
        <a class="btn btn--primary" href="/shop">Shop the Collection</a>
      </section>`;
    }
    return `
    <section class="container checkout">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Memória</a><span aria-hidden="true">/</span>
          <a href="/cart">Bag</a><span aria-hidden="true">/</span><span>Checkout</span>
        </nav>
        <h1>Checkout</h1>
      </div>
      <div class="checkout__layout">
        <form class="checkout__form" data-checkout-form novalidate>
          <section class="checkout__step">
            <h2><span class="num">1</span> Contact</h2>
            <div class="checkout__grid">
              <div class="field">
                <label for="co-name">Full name</label>
                <input id="co-name" name="name" autocomplete="name" required />
                <span class="field__error">Please enter your name.</span>
              </div>
              <div class="field">
                <label for="co-phone">Phone</label>
                <input id="co-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required />
                <span class="field__error">Please enter a phone number.</span>
              </div>
              <div class="field field--full">
                <label for="co-email">Email</label>
                <input id="co-email" name="email" type="email" autocomplete="email" required />
                <span class="field__error">Please enter a valid email.</span>
              </div>
            </div>
          </section>

          <section class="checkout__step">
            <h2><span class="num">2</span> Delivery</h2>
            <div class="checkout__grid">
              <div class="field field--full">
                <label for="co-address">Street address</label>
                <input id="co-address" name="address" autocomplete="street-address" required />
                <span class="field__error">Please enter your address.</span>
              </div>
              <div class="field">
                <label for="co-city">City</label>
                <input id="co-city" name="city" autocomplete="address-level2" required />
                <span class="field__error">Please enter your city.</span>
              </div>
              <div class="field">
                <label for="co-notes">Delivery notes <span style="text-transform:none;letter-spacing:0;color:var(--paper-grey)">(optional)</span></label>
                <input id="co-notes" name="notes" />
              </div>
            </div>
          </section>

          <section class="checkout__step">
            <h2><span class="num">3</span> Payment</h2>
            <label class="payopt">
              <input type="radio" name="payment" value="cod" checked />
              <span>
                <strong>Cash on delivery</strong>
                <span>Pay when your parcel arrives.</span>
              </span>
            </label>
            <label class="payopt is-disabled">
              <input type="radio" name="payment" value="card" disabled />
              <span>
                <strong>Card payment</strong>
                <span>Online payment is being prepared — coming soon.</span>
              </span>
            </label>
          </section>

          <button class="btn btn--primary btn--block" type="submit">Place Order — ${money(cart.subtotal)}</button>
          <p class="drawer__note">Demo checkout — no payment is processed and no data leaves your browser.</p>
        </form>
        ${summary()}
      </div>
    </section>`;
  },

  mount(root) {
    /* If the bag is edited via the header drawer while on /checkout,
       re-render so items and totals never go stale. */
    let placing = false;
    onPageCleanup(
      cart.onChange(() => {
        if (!placing) renderRoute({ scroll: false });
      })
    );

    const form = root.querySelector('[data-checkout-form]');
    if (!form) return;

    /* aria wiring for validation messages */
    form.querySelectorAll('.field input[required]').forEach((input, i) => {
      const err = input.closest('.field').querySelector('.field__error');
      if (err) {
        err.id = `co-err-${i}`;
        input.setAttribute('aria-describedby', err.id);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cart.items.length) return;
      let valid = true;
      form.querySelectorAll('.field input[required]').forEach((input) => {
        const field = input.closest('.field');
        const ok = input.checkValidity() && input.value.trim().length > 0;
        field.classList.toggle('has-error', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok) valid = false;
      });
      if (!valid) {
        form.querySelector('.field.has-error input')?.focus();
        toast('A few details are missing — check the highlighted fields.');
        return;
      }
      placing = true;

      /* Simulated order placement (backend integration point). */
      const orderNo = `MEM-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const name = form.querySelector('#co-name').value.trim().split(/\s+/)[0];
      cart.clear();

      const main = document.querySelector('#main');
      main.innerHTML = `
        <section class="container confirm">
          <span class="confirm__seal">${icons.check()}</span>
          <span class="stamp">Order ${orderNo} · Demo</span>
          <h1>Thank you, ${esc(name)} — it’s on its way to memory.</h1>
          <p>We’ll call to confirm delivery. Your bottle will arrive hand-wrapped,
          with a small card for the story you’re about to give it.</p>
          <div class="hero__ctas">
            <a class="btn btn--primary" href="/shop">Continue Shopping</a>
            <a class="btn" href="/archive">Visit the Archive</a>
          </div>
        </section>`;
      window.scrollTo({ top: 0 });
    });
  },
};
