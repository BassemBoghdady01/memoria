/**
 * MEMÓRIA · Checkout — guest checkout, server-priced.
 *
 * The summary is a live quote from the database (prices, discount,
 * delivery fee for the chosen governorate). place_order re-prices
 * everything server-side and refuses if the total shown here is stale.
 * Only payment methods the owner has enabled are offered.
 */
import { esc, money, toast } from '../utils.js';
import { cart } from '../store/cart.js';
import { governorates, settings } from '../data/catalog.js';
import { backendConfigured, rpc } from '../data/backend.js';
import { productPlate } from '../components/render.js';
import { navigate, renderRoute } from '../router.js';
import { onPageCleanup } from '../motion.js';
import { waLink, cartMessage, waButton } from '../components/whatsapp.js';
import { setSeo } from '../seo.js';

const methods = () => (settings.payments?.methods || []).filter((m) => m.enabled && !m.requires_gateway);

function summary() {
  return `
  <aside class="checkout__summary" aria-label="Order summary">
    <h2>Your order</h2>
    <div class="checkout__mini">
      ${cart.items
        .map(
          (l) => `
        <div class="miniline">
          <span class="cartline__thumb">${productPlate(l.product, { sizes: '64px', alt: '' })}</span>
          <span>
            <span class="miniline__name">${esc(l.product.name)}</span><br/>
            <span class="miniline__meta">${esc(l.variant.label)} × ${l.qty}</span>
          </span>
          <span class="miniline__price">${money(l.lineTotal)}</span>
        </div>`
        )
        .join('')}
    </div>
    <div class="coupon coupon--inline">
      <label for="co-code" class="label">Discount code</label>
      <div class="coupon__row">
        <input id="co-code" value="${esc(cart.code)}" autocomplete="off" spellcheck="false" maxlength="32" />
        <button class="btn btn--small" type="button" data-apply-code>Apply</button>
      </div>
      <p class="coupon__msg" data-coupon-msg aria-live="polite"></p>
    </div>
    <div class="sumline"><span>Subtotal</span><span data-q-sub>${money(cart.subtotal)}</span></div>
    <div class="sumline" data-q-disc-row hidden><span data-q-disc-label>Discount</span><span data-q-disc></span></div>
    <div class="sumline"><span>Delivery</span><span data-q-ship>Choose your governorate</span></div>
    <div class="sumline sumline--total"><span class="label">Total</span><strong data-q-total>${money(cart.subtotal)}</strong></div>
    <p class="drawer__note" data-q-eta></p>
  </aside>`;
}

export default {
  title: 'Checkout — MEMÓRIA',
  render() {
    if (!cart.items.length) {
      return `
      <section class="container shop__empty shop__empty--page">
        <h1>Your bag is empty.</h1>
        <p>There’s nothing to check out yet.</p>
        <a class="btn btn--primary" href="/shop">Explore the collection</a>
      </section>`;
    }
    const pay = methods();
    const live = backendConfigured;
    return `
    <section class="container checkout">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">/</span><a href="/cart">Bag</a><span aria-hidden="true">/</span><span aria-current="page">Checkout</span>
        </nav>
        <h1>Checkout</h1>
        <p class="checkout__guest">Guest checkout. No account needed.</p>
      </div>
      ${
        !live
          ? `<div class="notice notice--warn" role="status">Online checkout isn’t connected yet. You can send this order on WhatsApp instead.
            <div class="notice__cta">${waButton(waLink(cartMessage(null)), 'Order via WhatsApp')}</div></div>`
          : ''
      }
      <div class="checkout__layout">
        <form class="checkout__form" data-checkout-form novalidate>
          <section class="checkout__step">
            <h2><span class="num">1</span> Contact</h2>
            <div class="checkout__grid">
              <div class="field">
                <label for="co-name">Full name</label>
                <input id="co-name" name="full_name" autocomplete="name" required minlength="2" maxlength="120" />
                <span class="field__error">Please enter your full name.</span>
              </div>
              <div class="field">
                <label for="co-phone">Mobile number</label>
                <input id="co-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="01X XXXX XXXX"
                  pattern="[+0-9 \\-]{10,17}" />
                <span class="field__error">Please enter an Egyptian mobile number, e.g. 010 1234 5678.</span>
              </div>
              <div class="field field--full">
                <label for="co-email">Email <span class="field__opt">(optional)</span></label>
                <input id="co-email" name="email" type="email" autocomplete="email" />
                <span class="field__error">Please check the email address.</span>
              </div>
            </div>
          </section>

          <section class="checkout__step">
            <h2><span class="num">2</span> Delivery</h2>
            <div class="checkout__grid">
              <div class="field">
                <label for="co-gov">Governorate</label>
                <select id="co-gov" name="governorate_id" required autocomplete="address-level1">
                  <option value="">Choose…</option>
                  ${governorates.map((g) => `<option value="${g.id}">${esc(g.name_en)} · ${esc(g.name_ar)}</option>`).join('')}
                </select>
                <span class="field__error">Please choose your governorate.</span>
              </div>
              <div class="field">
                <label for="co-city">City / area</label>
                <input id="co-city" name="city" autocomplete="address-level2" required maxlength="120" />
                <span class="field__error">Please enter your city or area.</span>
              </div>
              <div class="field field--full">
                <label for="co-address">Street address, building, floor, apartment</label>
                <input id="co-address" name="address_line" autocomplete="street-address" required minlength="6" maxlength="400" />
                <span class="field__error">Please enter your full address.</span>
              </div>
              <div class="field field--full">
                <label for="co-notes">Delivery notes <span class="field__opt">(optional)</span></label>
                <input id="co-notes" name="address_notes" maxlength="300" placeholder="Landmark, best time to call…" />
              </div>
            </div>
          </section>

          <section class="checkout__step">
            <h2><span class="num">3</span> Payment</h2>
            ${
              pay.length
                ? pay
                    .map(
                      (m, i) => `
              <label class="payopt">
                <input type="radio" name="payment_method" value="${esc(m.id)}" ${i === 0 ? 'checked' : ''} />
                <span><strong>${esc(m.label)}</strong>${m.description ? `<span>${esc(m.description)}</span>` : ''}</span>
              </label>`
                    )
                    .join('')
                : `<p class="notice">No payment method is available online right now. Please order via WhatsApp.</p>`
            }
          </section>

          <div class="field field--full">
            <label for="co-note">Note for the house <span class="field__opt">(optional)</span></label>
            <textarea id="co-note" name="customer_note" rows="2" maxlength="1000" placeholder="A gift message, a question…"></textarea>
          </div>

          <p class="checkout__error" data-form-error role="alert" hidden></p>
          <button class="btn btn--primary btn--block" type="submit" data-submit ${!live || !pay.length ? 'disabled' : ''}>Place order</button>
          <p class="drawer__note">You’ll get an order number straight away. We confirm availability and delivery by phone; nothing is charged online.</p>
          <div data-wa-slot></div>
        </form>
        ${summary()}
      </div>
    </section>`;
  },

  mount(root) {
    setSeo({ title: 'Checkout — MEMÓRIA', noindex: true });
    let placing = false;
    onPageCleanup(
      cart.onChange(() => {
        if (!placing) renderRoute({ scroll: false });
      })
    );
    const form = root.querySelector('[data-checkout-form]');
    if (!form) return;

    const $ = (s) => root.querySelector(s);
    const submit = $('[data-submit]');
    const errorBox = $('[data-form-error]');
    const codeInput = $('#co-code');
    const codeMsg = $('[data-coupon-msg]');
    let lastQuote = null;
    let seq = 0;

    const govId = () => Number(form.governorate_id.value) || null;
    const renderQuote = (q) => {
      lastQuote = q;
      if (!q.preview) $('[data-q-sub]').textContent = money(q.subtotal);
      const hasDisc = q.discount && Number(q.discount_total) > 0;
      $('[data-q-disc-row]').hidden = !hasDisc;
      if (hasDisc) {
        $('[data-q-disc-label]').textContent = `Discount (${q.discount.code || q.discount.name})`;
        $('[data-q-disc]').textContent = `−${money(q.discount_total)}`;
      }
      $('[data-q-ship]').textContent = !govId()
        ? 'Choose your governorate'
        : q.shipping_to_confirm
          ? 'Confirmed by phone'
          : Number(q.shipping_fee) === 0
            ? 'Free'
            : money(q.shipping_fee);
      $('[data-q-total]').textContent = money(q.total) + (q.shipping_to_confirm && govId() ? ' + delivery' : '');
      $('[data-q-eta]').textContent = q.shipping_eta ? `Estimated delivery: ${q.shipping_eta}` : '';
      codeMsg.textContent = cart.code ? (hasDisc ? `${cart.code} applied.` : q.discount_error || '') : '';
      codeMsg.classList.toggle('is-error', Boolean(cart.code && !hasDisc));
      if (!q.preview && q.errors?.length) {
        errorBox.hidden = false;
        errorBox.textContent = q.errors.join(' ');
      } else if (!q.preview) errorBox.hidden = true;
      root.querySelector('[data-wa-slot]').innerHTML = waButton(waLink(cartMessage(q)), 'Or order via WhatsApp', 'btn--block btn--ghost');
    };
    const requote = async () => {
      const mine = ++seq;
      try {
        const q = await cart.quote({ governorateId: govId(), phone: form.phone.value || null });
        if (mine === seq) renderQuote(q);
      } catch {
        if (mine === seq) {
          errorBox.hidden = false;
          errorBox.textContent = 'We couldn’t reach the store to price your order. Please check your connection and try again.';
        }
      }
    };
    form.governorate_id.addEventListener('change', requote);
    $('[data-apply-code]').addEventListener('click', () => {
      cart.setCode(codeInput.value);
      requote();
    });
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        cart.setCode(codeInput.value);
        requote();
      }
    });
    requote();

    form.querySelectorAll('.field [required], .field input[type=email]').forEach((input, i) => {
      const err = input.closest('.field').querySelector('.field__error');
      if (err) {
        err.id = `co-err-${i}`;
        input.setAttribute('aria-describedby', err.id);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (placing || !backendConfigured) return;
      let valid = true;
      form.querySelectorAll('.field [required], .field input[type=email]').forEach((input) => {
        const ok = input.checkValidity() && (!input.required || input.value.trim().length > 0);
        input.closest('.field').classList.toggle('has-error', !ok);
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok) valid = false;
      });
      if (!valid) {
        form.querySelector('.field.has-error input, .field.has-error select')?.focus();
        toast('A few details are missing. Please check the highlighted fields.');
        return;
      }
      placing = true;
      submit.disabled = true;
      submit.textContent = 'Placing your order…';
      errorBox.hidden = true;
      const fd = new FormData(form);
      const payload = {
        ...Object.fromEntries(fd.entries()),
        governorate_id: govId(),
        discount_code: cart.code || null,
        items: cart.payload(),
        expected_total: lastQuote && !lastQuote.preview ? Number(lastQuote.total) : null,
      };
      try {
        const r = await rpc('place_order', { p: payload });
        if (!r.ok) {
          if (r.price_changed && r.quote) renderQuote(r.quote);
          errorBox.hidden = false;
          errorBox.textContent = (r.errors || ['We couldn’t place your order.']).join(' ');
          errorBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        cart.clear();
        navigate(`/order/${encodeURIComponent(r.order_number)}?t=${encodeURIComponent(r.access_token)}`, { replace: true });
      } catch {
        errorBox.hidden = false;
        errorBox.textContent = 'Something went wrong while placing your order. Nothing was charged. Please try again, or order via WhatsApp.';
      } finally {
        placing = false;
        submit.disabled = false;
        submit.textContent = 'Place order';
      }
    });
  },
};
