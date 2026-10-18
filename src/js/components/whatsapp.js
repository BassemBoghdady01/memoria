/**
 * MEMÓRIA · WhatsApp ordering.
 *
 * An additional way to order — never a replacement for checkout, and
 * never a confirmed or paid order: it only opens a pre-written message
 * the customer chooses to send. The number lives in store settings
 * (editable in the dashboard). Messages use current published prices and
 * only discounts the database has validated.
 */
import { settings, unitPrice } from '../data/catalog.js';
import { cart } from '../store/cart.js';
import { esc } from '../utils.js';

const fmt = (n) => Number(n).toLocaleString('en-EG', { maximumFractionDigits: 2 });

export function whatsappNumber() {
  const wa = settings.whatsapp || {};
  if (wa.enabled === false) return null;
  const digits = String(wa.number || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

export function waLink(text) {
  const n = whatsappNumber();
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function productMessage(product, variant, qty = 1) {
  const price = unitPrice(variant);
  return [
    'Hello MEMÓRIA,',
    'I would like to order:',
    '',
    `Product: ${product.name}`,
    `Size: ${variant?.label || 'to be confirmed'}`,
    `Quantity: ${qty}`,
    price !== null && price !== undefined ? `Price: ${fmt(price)} EGP${qty > 1 ? ` each (${fmt(price * qty)} EGP)` : ''}` : 'Price: please confirm',
    '',
    'Please confirm availability and delivery details.',
  ].join('\n');
}

export function enquiryMessage(product) {
  return ['Hello MEMÓRIA,', '', `I'm interested in ${product.name}.`, 'Could you share sizes, price and availability?'].join('\n');
}

/** quote = result of cart.quote() — only its validated discount is used. */
export function cartMessage(quote) {
  const items = cart.items;
  const out = ['Hello MEMÓRIA,', 'I would like to order:', ''];
  items.forEach((l, i) => {
    out.push(`${i + 1}. ${l.product.name} — ${l.variant.label} × ${l.qty} — ${fmt(l.unit)} EGP each (${fmt(l.lineTotal)} EGP)`);
  });
  const subtotal = cart.subtotal;
  out.push('', `Subtotal: ${fmt(subtotal)} EGP`);
  let total = subtotal;
  if (quote?.discount && Number(quote.discount_total) > 0) {
    out.push(`Discount (${quote.discount.code || quote.discount.name}): −${fmt(quote.discount_total)} EGP`);
    total -= Number(quote.discount_total);
  }
  if (quote && !quote.preview && !quote.shipping_to_confirm && quote.shipping_fee !== undefined) {
    out.push(`Delivery: ${Number(quote.shipping_fee) === 0 ? 'Free' : `${fmt(quote.shipping_fee)} EGP`}`);
    total += Number(quote.shipping_fee);
  }
  out.push(`Estimated total: ${fmt(total)} EGP`, '', 'Please confirm availability and delivery details.');
  return out.join('\n');
}

const WA_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.96 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.74 2.74 0 0 0-.86 2.04 4.76 4.76 0 0 0 1 2.53 10.9 10.9 0 0 0 4.18 3.7c1.56.67 2.17.73 2.95.61.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z"/></svg>`;
export const waIcon = () => WA_ICON;

export function waButton(href, label = 'Order via WhatsApp', cls = '') {
  if (!href) return '';
  return `<a class="btn btn--wa ${cls}" href="${esc(href)}" target="_blank" rel="noopener" data-wa>${WA_ICON}<span>${esc(label)}</span></a>`;
}

/** Discreet floating support button; lifts above sticky buy bars (see .wa-float in CSS). */
export function mountWhatsAppFloat() {
  const href = waLink('Hello MEMÓRIA, I have a question.');
  if (!href || document.querySelector('.wa-float')) return;
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat with MEMÓRIA on WhatsApp');
  a.innerHTML = WA_ICON;
  document.body.appendChild(a);
  /* appear after the first screen, so it never sits on top of hero CTAs */
  const sync = () => a.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.55);
  window.addEventListener('scroll', sync, { passive: true });
  sync();
}
