/**
 * MEMÓRIA · Cart store — localStorage-backed, event-driven.
 * Ready to swap for a real commerce backend: the API surface
 * (add / setQty / remove / clear / totals) is backend-agnostic.
 */
import { getProduct } from '../data/products.js';

const KEY = 'memoria.cart.v1';
const bus = new EventTarget();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(raw)) return [];
    // Drop lines whose product/size no longer exists in the catalogue.
    return raw.filter((l) => {
      const p = getProduct(l.slug);
      return p && p.sizes.some((s) => s.ml === l.ml) && Number.isInteger(l.qty) && l.qty > 0;
    });
  } catch {
    return [];
  }
}

let items = load();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(items));
  bus.dispatchEvent(new CustomEvent('change'));
}

export const cart = {
  get items() {
    return items.map((l) => {
      const product = getProduct(l.slug);
      const size = product.sizes.find((s) => s.ml === l.ml);
      return { ...l, product, size, lineTotal: size.price * l.qty };
    });
  },
  get count() {
    return items.reduce((n, l) => n + l.qty, 0);
  },
  get subtotal() {
    return this.items.reduce((n, l) => n + l.lineTotal, 0);
  },
  add(slug, ml, qty = 1) {
    const product = getProduct(slug);
    if (!product || !product.sizes.some((s) => s.ml === ml)) return;
    const line = items.find((l) => l.slug === slug && l.ml === ml);
    if (line) line.qty = Math.min(line.qty + qty, 10);
    else items.push({ slug, ml, qty: Math.min(qty, 10) });
    persist();
  },
  setQty(slug, ml, qty) {
    const line = items.find((l) => l.slug === slug && l.ml === ml);
    if (!line) return;
    line.qty = Math.max(0, Math.min(10, qty));
    if (line.qty === 0) items = items.filter((l) => l !== line);
    persist();
  },
  remove(slug, ml) {
    items = items.filter((l) => !(l.slug === slug && l.ml === ml));
    persist();
  },
  clear() {
    items = [];
    persist();
  },
  onChange(fn) {
    bus.addEventListener('change', fn);
    return () => bus.removeEventListener('change', fn);
  },
};
