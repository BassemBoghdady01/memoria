/**
 * MEMÓRIA · Bag store — localStorage-backed, event-driven.
 *
 * Lines hold only a variant id and a quantity. Names, images and prices
 * are read from the live catalogue each time, and the payable total is
 * always re-quoted by the database (quote()) — the browser never decides
 * what anything costs.
 */
import { getVariant, unitPrice } from '../data/catalog.js';
import { backendConfigured, rpc } from '../data/backend.js';

const KEY = 'memoria.bag.v2';
const CODE_KEY = 'memoria.bag.code';
const MAX_QTY = 10;
const bus = new EventTarget();

function read(k, fallback) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode: the bag simply won't persist */
  }
}

let lines = [];
let code = read(CODE_KEY, '') || '';

/** Call after the catalogue loads: drops lines that no longer exist or can't be bought. */
export function hydrateCart() {
  const raw = read(KEY, []);
  lines = (Array.isArray(raw) ? raw : []).filter((l) => {
    const hit = getVariant(l.variantId);
    return hit && hit.variant.price !== null && Number.isInteger(l.qty) && l.qty > 0;
  });
  emit(false);
}

function emit(persist = true) {
  if (persist) write(KEY, lines);
  bus.dispatchEvent(new CustomEvent('change'));
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) hydrateCart();
});

export const cart = {
  get items() {
    return lines
      .map((l) => {
        const hit = getVariant(l.variantId);
        if (!hit) return null;
        const unit = unitPrice(hit.variant);
        return { ...l, product: hit.product, variant: hit.variant, unit, lineTotal: unit * l.qty };
      })
      .filter(Boolean);
  },
  get count() {
    return lines.reduce((n, l) => n + l.qty, 0);
  },
  /** Display subtotal from published prices. The payable total comes from quote(). */
  get subtotal() {
    return this.items.reduce((n, l) => n + l.lineTotal, 0);
  },
  get code() {
    return code;
  },
  setCode(c) {
    code = String(c || '').trim().toUpperCase();
    write(CODE_KEY, code);
  },
  add(variantId, qty = 1) {
    const hit = getVariant(variantId);
    if (!hit || hit.variant.price === null || !hit.variant.inStock) return false;
    const line = lines.find((l) => l.variantId === variantId);
    if (line) line.qty = Math.min(line.qty + qty, MAX_QTY);
    else lines.push({ variantId, qty: Math.min(Math.max(1, qty), MAX_QTY) });
    emit();
    return true;
  },
  setQty(variantId, qty) {
    const line = lines.find((l) => l.variantId === variantId);
    if (!line) return;
    line.qty = Math.max(0, Math.min(MAX_QTY, qty));
    if (line.qty === 0) lines = lines.filter((l) => l !== line);
    emit();
  },
  remove(variantId) {
    lines = lines.filter((l) => l.variantId !== variantId);
    emit();
  },
  clear() {
    lines = [];
    code = '';
    write(CODE_KEY, '');
    emit();
  },
  payload() {
    return lines.map((l) => ({ variant_id: l.variantId, quantity: l.qty }));
  },
  /**
   * Server-side quote: validated prices, discount, shipping, stock.
   * In preview mode (no database) returns a local, clearly-flagged estimate.
   */
  async quote({ governorateId = null, phone = null, withCode = true } = {}) {
    if (!lines.length) return { ok: false, errors: ['Your bag is empty.'], lines: [], subtotal: 0, total: 0 };
    if (!backendConfigured) {
      const subtotal = this.subtotal;
      return {
        ok: false,
        preview: true,
        errors: ['Online checkout is not connected yet.'],
        subtotal,
        discount: null,
        discount_total: 0,
        discount_error: withCode && code ? 'Codes can be checked once checkout is connected.' : null,
        shipping_fee: 0,
        shipping_to_confirm: true,
        total: subtotal,
      };
    }
    return rpc('quote_cart', {
      p_items: this.payload(),
      p_code: withCode && code ? code : null,
      p_governorate_id: governorateId,
      p_phone: phone,
    });
  },
  onChange(fn) {
    bus.addEventListener('change', fn);
    return () => bus.removeEventListener('change', fn);
  },
};
