/**
 * MEMÓRIA · Order confirmation — read back from the database with the
 * guest's private token. Shows the real status: an order is "received"
 * and unpaid until the house confirms it; nothing here claims payment.
 */
import { esc, money } from '../utils.js';
import { rpc, backendConfigured } from '../data/backend.js';
import { icons } from '../components/icons.js';
import { settings } from '../data/catalog.js';
import { waLink, waButton } from '../components/whatsapp.js';
import { setSeo } from '../seo.js';

const PAY = { unpaid: 'Not paid yet', pending: 'Payment pending', paid: 'Paid', refunded: 'Refunded', partially_refunded: 'Partly refunded', failed: 'Payment failed' };
const STATUS = { pending: 'Received, awaiting confirmation', confirmed: 'Confirmed', processing: 'Being prepared', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' };

export default {
  title: 'Your order — MEMÓRIA',
  render(params) {
    return `<section class="container confirm" data-order="${esc(params.number)}"><p class="confirm__loading">Loading your order…</p></section>`;
  },
  async mount(root, params) {
    setSeo({ title: 'Your order — MEMÓRIA', noindex: true });
    const box = root.querySelector('[data-order]');
    const token = params.query.get('t');
    let o = null;
    if (backendConfigured && token) {
      try {
        o = await rpc('get_order_confirmation', { p_order_number: params.number, p_token: token });
      } catch {
        o = null;
      }
    }
    if (!o) {
      box.innerHTML = `
        <span class="stamp">Order ${esc(params.number)}</span>
        <h1>We couldn’t open this order.</h1>
        <p>The link may be incomplete. If you placed an order, keep your order number and contact us.</p>
        <div class="hero__ctas">${waButton(waLink(`Hello MEMÓRIA, I'm asking about order ${params.number}.`), 'Ask on WhatsApp')}<a class="btn" href="/shop">Back to the collection</a></div>`;
      return;
    }
    const method = (settings.payments?.methods || []).find((m) => m.id === o.payment_method);
    const first = String(o.customer_name || '').split(/\s+/)[0];
    box.innerHTML = `
      <span class="confirm__seal">${icons.check()}</span>
      <span class="stamp">Order ${esc(o.order_number)}</span>
      <h1>Thank you${first ? `, ${esc(first)}` : ''}. Your order is in.</h1>
      <p>We’ll call you to confirm availability and delivery. Please keep your order number.</p>
      <dl class="confirm__facts">
        <div><dt>Status</dt><dd>${esc(STATUS[o.status] || o.status)}</dd></div>
        <div><dt>Payment</dt><dd>${esc(method?.label || o.payment_method)} · ${esc(PAY[o.payment_status] || o.payment_status)}</dd></div>
      </dl>
      <div class="confirm__items">
        ${(o.items || [])
          .map((i) => `<div class="sumline"><span>${esc(i.product_name)} · ${esc(i.variant_label)} × ${i.quantity}</span><span>${money(i.line_total)}</span></div>`)
          .join('')}
        <div class="sumline"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
        ${Number(o.discount_total) > 0 ? `<div class="sumline"><span>Discount${o.discount_code ? ` (${esc(o.discount_code)})` : ''}</span><span>−${money(o.discount_total)}</span></div>` : ''}
        <div class="sumline"><span>Delivery</span><span>${o.shipping_to_confirm ? 'Confirmed by phone' : Number(o.shipping_fee) === 0 ? 'Free' : money(o.shipping_fee)}</span></div>
        <div class="sumline sumline--total"><span class="label">Total</span><strong>${money(o.total)}${o.shipping_to_confirm ? ' + delivery' : ''}</strong></div>
      </div>
      <div class="hero__ctas">
        ${waButton(waLink(`Hello MEMÓRIA, about my order ${o.order_number}.`), 'Questions? WhatsApp us')}
        <a class="btn" href="/shop">Continue shopping</a>
      </div>`;
  },
};
