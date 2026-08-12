/**
 * MEMÓRIA · Site chrome — tagline ribbon, header, mobile nav, footer.
 */
import { $, el, toast, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { cart } from '../store/cart.js';
import { openCartDrawer } from './cartDrawer.js';
import { openSearch } from './searchOverlay.js';

const LOGO = '/brand/logo-brown-560.png';
const LOGO_CREAM = '/brand/logo-cream-560.png';

/* Tagline supplied on the brand palette sheet — used verbatim. */
const TAGLINE = ['Rooted in memory', 'Inspired by Cairo', 'Made to be remembered', 'Twenty years of scents'];

export function renderRibbon() {
  const items = TAGLINE.map(
    (t) => `<span class="ribbon__item"><span>${t}</span><span class="ribbon__dot" aria-hidden="true"></span></span>`
  ).join('');
  $('#ribbon').innerHTML = `
    <div class="ribbon" aria-hidden="true">
      <div class="ribbon__track">${items}${items}${items}</div>
    </div>`;
}

export function renderHeader() {
  const header = $('#header');
  header.innerHTML = `
    <div class="header">
      <div class="container header__inner">
        <nav class="header__nav header__nav--left" aria-label="Shop">
          <button class="iconbtn header__burger" data-open-mobilenav aria-label="Open menu">${icons.menu()}</button>
          <a class="header__navlink" data-navlink href="/shop">Shop</a>
          <a class="header__navlink" data-navlink href="/women">Women</a>
          <a class="header__navlink" data-navlink href="/men">Men</a>
        </nav>
        <a class="header__logo" href="/" aria-label="MEMÓRIA — home">
          <img src="${LOGO}" alt="MEMÓRIA" width="560" height="142" />
        </a>
        <nav class="header__nav header__nav--right" aria-label="House">
          <a class="header__navlink" data-navlink href="/our-story">Our Story</a>
          <a class="header__navlink" data-navlink href="/archive">The Archive</a>
          <div class="header__icons">
            <button class="iconbtn" data-open-search aria-label="Search">${icons.search()}</button>
            <a class="iconbtn" href="/account" aria-label="Account">${icons.account()}</a>
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
          <a class="mobilenav__link" href="/shop">Shop <span class="stamp">All six</span></a>
          <a class="mobilenav__link" href="/women">Women <span class="stamp">Nº 01–03</span></a>
          <a class="mobilenav__link" href="/men">Men <span class="stamp">Nº 04–06</span></a>
          <a class="mobilenav__link" href="/our-story">Our Story <span class="stamp">Est. 20 yrs</span></a>
          <a class="mobilenav__link" href="/archive">The Archive <span class="stamp">Vol. I–VI</span></a>
        </nav>
        <div class="mobilenav__foot">
          <button class="btn btn--small" data-open-search-mobile>${icons.search()} Search</button>
          <a class="btn btn--small" href="/account">${icons.account()} Account</a>
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
  const openNav = () => {
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
  $('#footer').innerHTML = `
    <div class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <img src="${LOGO_CREAM}" alt="MEMÓRIA" width="560" height="142" />
          <p>A perfume house rooted in memory, inspired by Cairo — twenty years of scents in six bottles.</p>
        </div>
        <div class="footer__col">
          <h3>Shop</h3>
          <ul>
            <li><a href="/shop">The Collection</a></li>
            <li><a href="/women">Women · Nº 01–03</a></li>
            <li><a href="/men">Men · Nº 04–06</a></li>
            <li><a href="/cart">Your Bag</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h3>The House</h3>
          <ul>
            <li><a href="/our-story">Our Story</a></li>
            <li><a href="/archive">The Archive</a></li>
            <li><a href="/search">Search</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noopener">Instagram ↗</a></li>
          </ul>
        </div>
        <div class="footer__col footer__news">
          <h3>Letters from the House</h3>
          <p>New scents, old stories — an occasional letter, never noise.</p>
          <form class="footer__newsform" data-newsletter>
            <label class="sr-only" for="news-email" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Email address</label>
            <input id="news-email" type="email" required placeholder="your@address.com" autocomplete="email" />
            <button type="submit">Join</button>
          </form>
          <p class="footer__newsnote">Postmarked Cairo · Sent seldom</p>
        </div>
      </div>
      <div class="container footer__close">
        <p class="footer__closing">Every scent leaves something behind.</p>
        <p class="footer__legal">MEMÓRIA © — Catalogue Vol. VI · All six scents</p>
      </div>
    </div>`;

  $('#footer [data-newsletter]').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input.value) return;
    input.value = '';
    toast('Thank you — your letter is on its way.');
  });
}
