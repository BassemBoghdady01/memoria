/**
 * MEMÓRIA · History-API router.
 * Routes map to page modules: { title, render(params) -> html, mount(root, params) }.
 */
import { $, $$ } from './utils.js';
import { flushPage, scanReveals, scrollToTop, scrollToY, refreshTriggers } from './motion.js';

function safeDecode(v) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const routes = [];

export function register(pattern, page) {
  const keys = [];
  const rx = new RegExp(
    '^' +
      pattern
        .replace(/\/+$/, '')
        .replace(/:(\w+)/g, (_, k) => {
          keys.push(k);
          return '([^/]+)';
        })
        .replace(/\//g, '\\/') +
      '\\/?$'
  );
  routes.push({ rx, keys, page });
}

function match(path) {
  const clean = path.replace(/\/+$/, '') || '/';
  for (const r of routes) {
    const m = clean.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = safeDecode(m[i + 1])));
      return { page: r.page, params };
    }
  }
  return null;
}

export function redirect(from, to) {
  register(from, { title: 'MEMÓRIA', render: () => '', mount: () => navigate(to, { replace: true }) });
}

let notFoundPage = null;
export function setNotFound(page) {
  notFoundPage = page;
}

let currentPath = null;

export async function renderRoute({ scroll = true } = {}) {
  const path = location.pathname;
  const query = new URLSearchParams(location.search);
  const matched = match(path) || { page: notFoundPage, params: {} };
  const { page, params } = matched;
  params.query = query;

  flushPage();

  const main = $('#main');
  main.innerHTML = page.render(params);
  document.title = typeof page.title === 'function' ? page.title(params) : page.title;

  if (scroll) scrollToTop(true);
  updateActiveNav(path);
  try {
    await page.mount?.(main, params);
  } catch (err) {
    console.error('[MEMÓRIA] page error', err);
  }
  scanReveals(main);
  requestAnimationFrame(() => refreshTriggers());
  if (currentPath !== null && currentPath !== path) {
    /* let assistive tech know the view changed */
    main.focus({ preventScroll: true });
  }
  currentPath = path;
}

export function navigate(href, { replace = false } = {}) {
  const url = new URL(href, location.origin);
  if (url.origin !== location.origin) {
    window.open(href, '_blank', 'noopener');
    return;
  }
  const same = url.pathname === location.pathname && url.search === location.search;
  if (!same) {
    /* stamp the outgoing entry with its scroll position for Back/Forward */
    history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', location.href);
  }
  if (replace) history.replaceState({}, '', url);
  else if (!same) history.pushState({}, '', url);
  if (!same || url.pathname !== currentPath) renderRoute();
  else scrollToTop(false);
}

function updateActiveNav(path) {
  $$('[data-navlink]').forEach((a) => {
    const target = a.getAttribute('href');
    const active =
      target === path ||
      (target !== '/' && path.startsWith(target)) ||
      (target === '/shop' && (path === '/women' || path === '/men'));
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

export function initRouter() {
  // Intercept internal link clicks.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      a.target === '_blank' ||
      a.hasAttribute('download') ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    )
      return;
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    navigate(href);
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('popstate', (e) => {
    const y = e.state?.scrollY ?? 0;
    renderRoute({ scroll: false }).then(() => {
      requestAnimationFrame(() => scrollToY(y));
    });
  });
  renderRoute();
}
