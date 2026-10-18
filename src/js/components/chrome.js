/**
 * MEMÓRIA · Site chrome — tagline ribbon, header, mobile nav, footer.
 */
import { $, esc, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { openSearch } from './searchOverlay.js';
import { settings, usedCategories, products } from '../data/catalog.js';

/* 320px variants — the chrome renders the mark at ~110px wide, so 320
   is already ~3× density; the 560/900/1400 sizes serve larger uses. */
const LOGO = '/brand/logo-black-560.png';
const LOGO_CREAM = '/brand/logo-cream-320.png';

/* Announcement bar — owner-written in the dashboard (Content → Announcement). */
/* Black ticker. Owner announcement first (Dashboard → Website content), then house lines. */
const HOUSE_LINES = ['Made to be remembered', 'Rooted in memory', 'Inspired by Cairo', 'Delivery across Egypt', 'Order on WhatsApp'];

export function renderRibbon() {
  const a = settings.announcement || {};
  const lines = [...(a.enabled && a.text ? [a.text] : []), ...HOUSE_LINES];
  const items = lines
    .map((t, i) => `<span class="ribbon__item"><span>${i === 0 && a.enabled && a.text ? `<em>${esc(t)}</em>` : esc(t)}</span><span class="ribbon__dot" aria-hidden="true"></span></span>`)
    .join('');
  const host = $('#ribbon');
  host.innerHTML = `
    ${a.enabled && a.text ? `<p class="sr-only">${esc(a.text)}</p>` : ''}
    <div class="ribbon" aria-hidden="true"><div class="ribbon__track">${items}${items}${items}${items}</div></div>`;
  new IntersectionObserver(([e]) => host.classList.toggle('is-offscreen', !e.isIntersecting)).observe(host);
}

export function renderHeader() {
  const header = $('#header');
  const cats = usedCategories().slice(0, 3);
  header.innerHTML = `
    <div class="header">
      <div class="container header__inner">
        <nav class="header__nav header__nav--left" aria-label="Shop">
          <button class="iconbtn header__burger" data-open-mobilenav aria-label="Open menu">${icons.menu()}</button>
          <a class="header__navlink" data-navlink href="/shop">Shop</a>
          ${cats.map((c) => `<a class="header__navlink" data-navlink href="/shop?c=${esc(c.slug)}">${esc(c.name)}</a>`).join('')}
        </nav>
        <a class="header__logo" href="/" aria-label="MEMÓRIA — home">
          <img src="${LOGO}" alt="MEMÓRIA" width="560" height="141" />
        </a>
        <nav class="header__nav header__nav--right" aria-label="House">
          <a class="header__navlink" data-navlink href="/our-story">Our Story</a>
          <a class="header__navlink" data-navlink href="/help">Care</a>
          <div class="header__icons">
            <button class="iconbtn" data-open-search aria-label="Search">${icons.search()}</button>
            <button class="iconbtn" data-open-cart aria-label="Open bag">
              ${icons.bag()}
              <span class="iconbtn__count" data-cart-count hidden>0</span>
            </button>
          </div>
        </nav>
      </div>
    </div>

    <div class="mobilenav" data-mobilenav aria-hidden="true">
      <div class="mobilenav__scrim" data-close-mobilenav></div>
      <div class="mobilenav__panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="mobilenav__top">
          <img src="${LOGO}" alt="MEMÓRIA" />
          <button class="iconbtn" data-close-mobilenav aria-label="Close menu">${icons.close()}</button>
        </div>
        <nav class="mobilenav__links" aria-label="Mobile">
          <a class="mobilenav__link" href="/shop">Shop <span class="stamp">${products.length} scents</span></a>
          ${cats.map((c) => `<a class="mobilenav__link" href="/shop?c=${esc(c.slug)}">${esc(c.name)}</a>`).join('')}
          <a class="mobilenav__link" href="/our-story">Our Story</a>
          <a class="mobilenav__link" href="/help">Customer care</a>
        </nav>
        <div class="mobilenav__foot">
          <button class="btn btn--small" data-open-search-mobile>${icons.search()} Search</button>
          <p class="stamp">Rooted in memory · Inspired by Cairo</p>
        </div>
      </div>
    </div>`;

  const bar = header.querySelector('.header');
  const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* cart count */
  const countEl = header.querySelector('[data-cart-count]');
  const syncCount = () => {
    const n = cart.count;
    countEl.textContent = n;
    countEl.hidden = n === 0;
  };
  cart.onChange(syncCount);
  syncCount();

  header.querySelector('[data-open-cart]').addEventListener('click', () => openCartDrawer());
  header.querySelector('[data-open-search]').addEventListener('click', () => openSearch());

  /* mobile nav */
  const nav = header.querySelector('[data-mobilenav]');
  let untrap = null;
  let navLastFocus = null;
  const openNav = () => {
    navLastFocus = document.activeElement;
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden', 'false');
    lockScroll();
    untrap = trapFocus(nav.querySelector('.mobilenav__panel'), closeNav);
    nav.querySelector('[data-close-mobilenav][aria-label]')?.focus();
  };
  const closeNav = () => {
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    unlockScroll();
    untrap?.();
    navLastFocus?.focus?.();
  };
  header.querySelector('[data-open-mobilenav]').addEventListener('click', openNav);
  nav.querySelectorAll('[data-close-mobilenav]').forEach((b) => b.addEventListener('click', closeNav));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
  nav.querySelector('[data-open-search-mobile]').addEventListener('click', () => {
    closeNav();
    openSearch();
  });
}

export function renderFooter() {
  const c = settings.contact || {};
  const so = settings.social || {};
  const wa = settings.whatsapp || {};
  const socials = [
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
    ['tiktok', 'TikTok'],
  ].filter(([k]) => /^https?:\/\//.test(so[k] || ''));
  const cats = usedCategories();
  $('#footer').innerHTML = `
    <div class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <img src="${LOGO_CREAM}" alt="MEMÓRIA" width="320" height="81" loading="lazy" />
          <p>Rooted in memory. Inspired by Cairo. Made to be remembered.</p>
        </div>
        <div class="footer__col">
          <h3>Shop</h3>
          <ul>
            <li><a href="/shop">All perfumes</a></li>
            ${cats.map((x) => `<li><a href="/shop?c=${esc(x.slug)}">${esc(x.name)}</a></li>`).join('')}
            <li><a href="/cart">Your bag</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h3>MEMÓRIA</h3>
          <ul>
            <li><a href="/our-story">Our story</a></li>
            <li><a href="/search">Search</a></li>
            ${socials.map(([k, label]) => `<li><a href="${esc(so[k])}" target="_blank" rel="noopener">${label} ↗</a></li>`).join('')}
          </ul>
        </div>
        <div class="footer__col">
          <h3>Help</h3>
          <ul>
            <li><a href="/help#shipping">Delivery</a></li>
            <li><a href="/help#contact">Contact</a></li>
            ${wa.display ? `<li>WhatsApp ${esc(wa.display)}</li>` : ''}
            ${c.email ? `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : ''}
          </ul>
        </div>
      </div>
      <div class="container footer__egyptrow">
        <p class="footer__egypt">Made in Egypt, for people who carry memories<br/><span dir="rtl" lang="ar">صُنع في مصر — لمن يحملون الذكريات</span></p>
      </div>
      <div class="container footer__close">
        <p class="footer__closing">Every scent leaves something behind.</p>
        <p class="footer__legal">MEMÓRIA © ${new Date().getFullYear()}</p>
      </div>
    </div>`;
}
