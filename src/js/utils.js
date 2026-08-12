/**
 * MEMÓRIA · Small shared utilities.
 */
import { CURRENCY } from './data/products.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function esc(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function money(amount) {
  return `${CURRENCY} ${Number(amount).toLocaleString('en-EG')}`;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouch() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export function isNarrow() {
  return window.matchMedia('(max-width: 820px)').matches;
}

/** Trap focus inside a container while open (drawers/overlays). */
export function trapFocus(container, onEscape) {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key === 'Escape') {
      onEscape?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = $$(selector, container).filter((n) => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

let scrollLocks = 0;
export function lockScroll() {
  scrollLocks++;
  document.documentElement.style.overflow = 'hidden';
}
export function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.documentElement.style.overflow = '';
}

/** Tiny toast feedback. */
let toastEl = null;
let toastTimer = null;
export function toast(message) {
  if (!toastEl) {
    toastEl = el(`<div class="toast" role="status" aria-live="polite"></div>`);
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  requestAnimationFrame(() => toastEl.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
}
