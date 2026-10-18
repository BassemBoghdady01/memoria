/**
 * MEMÓRIA · Search overlay — fast, minimal, keyboard friendly.
 */
import { el, esc, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { searchProducts, products } from '../data/catalog.js';
import { productImg } from './render.js';
import { priceLabel } from './productCard.js';
import { navigate } from '../router.js';

let overlay = null;
let isOpen = false;
let untrap = null;
let activeIndex = -1;
let results = [];
let lastFocus = null;

/* Global shortcut registered at boot (module is imported by chrome.js),
   so Ctrl/Cmd-K works before the overlay has ever been opened. */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) closeSearch();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isOpen ? closeSearch() : openSearch();
  }
});

function ensure() {
  if (overlay) return overlay;
  overlay = el(`
    <div class="overlay" aria-hidden="true">
      <div class="overlay__scrim" data-close-search></div>
      <div class="overlay__panel" role="dialog" aria-modal="true" aria-label="Search perfumes">
        <div class="search__bar">
          ${icons.search()}
          <input class="search__input" type="search" placeholder="Search scents…"
                 aria-label="Search perfumes" autocomplete="off" spellcheck="false" />
          <button class="iconbtn" data-close-search aria-label="Close search">${icons.close()}</button>
        </div>
        <div class="search__results" data-results data-lenis-prevent aria-live="polite"></div>
        <div class="search__kbd" aria-hidden="true">
          <span>↑↓ browse</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>`);
  document.querySelector('#overlays').appendChild(overlay);

  const input = overlay.querySelector('.search__input');
  const resultsEl = overlay.querySelector('[data-results]');

  const renderHint = () => {
    resultsEl.innerHTML = `
      <div class="search__hint">
        <span class="stamp">try “jasmine”, “Nº 04”, “oud”…</span>
        Search by scent name, note or family.
      </div>`;
    results = [];
    activeIndex = -1;
  };

  const renderResults = (q) => {
    results = searchProducts(q);
    activeIndex = results.length ? 0 : -1;
    if (!q.trim()) return renderHint();
    if (!results.length) {
      resultsEl.innerHTML = `
        <div class="search__hint">
          <span class="stamp">No match for “${esc(q)}”</span>
          Try a scent name: ${products.map((p) => esc(p.name)).join(', ')}.
        </div>`;
      return;
    }
    resultsEl.innerHTML = results
      .map(
        (p, i) => `
        <button class="search__item ${i === activeIndex ? 'is-active' : ''}" data-slug="${esc(p.slug)}">
          <span class="cartline__thumb">${productImg(p, { sizes: '64px', alt: '' })}</span>
          <span>
            <span class="search__itemname">${esc(p.name)}</span><br/>
            <span class="search__itemmeta">${esc([p.category?.name, p.family].filter(Boolean).join(' · '))}</span>
          </span>
          <span class="search__itemprice">${esc(priceLabel(p))}</span>
        </button>`
      )
      .join('');
    resultsEl.querySelectorAll('[data-slug]').forEach((b) =>
      b.addEventListener('click', () => go(b.dataset.slug))
    );
  };

  const go = (slug) => {
    closeSearch();
    navigate(`/product/${slug}`);
  };

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      activeIndex = (activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      resultsEl.querySelectorAll('.search__item').forEach((n, i) => n.classList.toggle('is-active', i === activeIndex));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      go(results[activeIndex].slug);
    }
  });

  overlay.querySelectorAll('[data-close-search]').forEach((b) => b.addEventListener('click', closeSearch));

  renderHint();
  return overlay;
}

export function openSearch() {
  ensure();
  lastFocus = document.activeElement;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  lockScroll();
  isOpen = true;
  untrap = trapFocus(overlay.querySelector('.overlay__panel'), closeSearch);
  const input = overlay.querySelector('.search__input');
  input.value = '';
  input.dispatchEvent(new Event('input'));
  setTimeout(() => input.focus(), 60);
}

export function closeSearch() {
  if (!overlay || !isOpen) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  isOpen = false;
  untrap?.();
  lastFocus?.focus?.();
}
