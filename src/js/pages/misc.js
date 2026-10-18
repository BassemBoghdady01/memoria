/**
 * MEMÓRIA · Search page, account stub, 404.
 */
import { esc } from '../utils.js';
import { icons } from '../components/icons.js';
import { searchProducts, settings } from '../data/catalog.js';
import { setSeo } from '../seo.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';

export const searchPage = {
  title: 'Search — MEMÓRIA',
  render(params) {
    const q = params.query.get('q') || '';
    return `
    <section class="container">
      <div class="pagehead">
        <h1 data-reveal>Search the Collection</h1>
        <p class="serif-lede" data-reveal>A name, a note, anything you half-remember.</p>
      </div>
      <form class="searchpage__box" data-search-form role="search">
        ${icons.search()}
        <input type="search" name="q" value="${esc(q)}" placeholder="Search scents…"
               aria-label="Search perfumes" autocomplete="off" />
      </form>
      <div class="searchpage__results" data-search-results aria-live="polite"></div>
    </section>`;
  },
  mount(root, params) {
    setSeo({ title: 'Search — MEMÓRIA', noindex: true });
    const form = root.querySelector('[data-search-form]');
    const input = form.querySelector('input');
    const results = root.querySelector('[data-search-results]');
    let disposeCards = () => {};

    const run = (q) => {
      const found = searchProducts(q);
      disposeCards();
      disposeCards = () => {};
      if (!q.trim()) {
        results.innerHTML = `<div class="shop__empty"><p>Type to search the collection.</p></div>`;
        return;
      }
      if (!found.length) {
        results.innerHTML = `
          <div class="shop__empty">
            <p>Nothing matches “${esc(q)}”.</p>
            <a class="btn" href="/shop">Browse everything instead</a>
          </div>`;
        return;
      }
      results.innerHTML = renderProductGrid(found);
      results.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('is-in'));
      disposeCards = mountProductCards(results);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      history.replaceState({}, '', `/search?q=${encodeURIComponent(input.value)}`);
      run(input.value);
    });
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => run(input.value), 200);
    });
    run(input.value);
    if (!input.value) input.focus();
  },
};

export const accountPage = {
  title: 'Account — MEMÓRIA',
  render() {
    return `
    <section class="container account">
      <span class="stamp" data-reveal>Members’ Ledger · Opening Soon</span>
      <h1 data-reveal>Accounts are being bound.</h1>
      <p data-reveal>
        Soon you’ll be able to keep your orders, addresses and favourite scents
        in one place. Until then, everything works beautifully as a guest.
      </p>
      <a class="btn btn--primary" href="/shop" data-reveal>Shop the Collection</a>
    </section>`;
  },
};

export const helpPage = {
  title: 'Customer care — MEMÓRIA',
  render() {
    const c = settings.contact || {};
    const ship = settings.shipping_info || {};
    const social = settings.social || {};
    const wa = settings.whatsapp || {};
    const rows = [
      ['shipping', 'Delivery', ship.details || ship.summary || 'Delivery fees for your governorate are shown at checkout. Where a fee isn’t listed yet, we confirm it by phone before dispatch.'],
      ['contact', 'Contact', [wa.display && `WhatsApp: ${wa.display}`, c.phone && `Phone: ${c.phone}`, c.email && `Email: ${c.email}`, c.address, c.hours].filter(Boolean).join('\n') || 'Message us on WhatsApp.'],
      ['social', 'Follow', ['instagram', 'facebook', 'tiktok'].filter((k) => social[k]).map((k) => `${k[0].toUpperCase() + k.slice(1)}: ${social[k]}`).join('\n')],
    ].filter(([, , d]) => d);
    return `
    <section class="container helppage">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Customer care</span></nav>
        <h1 data-reveal>Customer care</h1>
      </div>
      <dl class="helplist">
        ${rows.map(([id, t, d]) => `<div class="helplist__row" id="${id}" data-reveal><dt>${t}</dt><dd>${esc(d).replace(/\n/g, '<br/>')}</dd></div>`).join('')}
      </dl>
      <div style="text-align:center; margin-top:2.4rem" data-reveal><a class="btn btn--primary" href="/shop">Shop the collection</a></div>
    </section>`;
  },
  mount() {
    setSeo({ title: 'Customer care — MEMÓRIA', path: '/help' });
  },
};

export const notFoundPage = {
  title: 'Page not found — MEMÓRIA',
  render() {
    return `
    <section class="container notfound">
      <span class="stamp">404</span>
      <h1>Some pages fade like old ink.</h1>
      <p>The page you’re after isn’t in our records — but the perfumes are all here.</p>
      <div class="hero2__ctas" style="justify-content:center">
        <a class="btn btn--primary" href="/">Return Home</a>
        <a class="btn" href="/shop">Shop the Collection</a>
      </div>
    </section>`;
  },
};
