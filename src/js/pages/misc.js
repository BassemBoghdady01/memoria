/**
 * MEMÓRIA · Search page, account stub, 404.
 */
import { esc } from '../utils.js';
import { icons } from '../components/icons.js';
import { searchProducts } from '../data/products.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';

export const searchPage = {
  title: 'Search — MEMÓRIA',
  render(params) {
    const q = params.query.get('q') || '';
    return `
    <section class="container">
      <div class="pagehead">
        <h1 data-reveal>Search the Collection</h1>
        <p class="serif-lede" data-reveal>A name, a number, a note — anything you half-remember.</p>
      </div>
      <form class="searchpage__box" data-search-form role="search">
        ${icons.search()}
        <input type="search" name="q" value="${esc(q)}" placeholder="jasmine, Nº 04, cedar…"
               aria-label="Search perfumes" autocomplete="off" />
      </form>
      <div class="searchpage__results" data-search-results aria-live="polite"></div>
    </section>`;
  },
  mount(root, params) {
    const form = root.querySelector('[data-search-form]');
    const input = form.querySelector('input');
    const results = root.querySelector('[data-search-results]');
    let disposeCards = () => {};

    const run = (q) => {
      const found = searchProducts(q);
      disposeCards();
      disposeCards = () => {};
      if (!q.trim()) {
        results.innerHTML = `<div class="shop__empty"><p>Type to search the six scents of the collection.</p></div>`;
        return;
      }
      if (!found.length) {
        results.innerHTML = `
          <div class="shop__empty">
            <p>Nothing in the archive for “${esc(q)}”.</p>
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
  title: 'Help — MEMÓRIA',
  render() {
    const rows = [
      ['shipping', 'Shipping', 'Delivery options and times will be published here once confirmed.'],
      ['returns', 'Returns', 'The exchange and return policy will be published here once confirmed.'],
      ['contact', 'Contact', 'A direct line to the house is being set up. For now, the hotline on the homepage reaches us.'],
      ['faq', 'FAQ', 'Common questions and their answers will be collected here.'],
    ];
    return `
    <section class="container helppage">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Memória</a><span aria-hidden="true">/</span><span>Help</span>
        </nav>
        <h1 data-reveal>Customer Care</h1>
        <p class="serif-lede" data-reveal>The practical part of the house. Details below are being finalised.</p>
      </div>
      <dl class="helplist">
        ${rows
          .map(
            ([id, t, d]) => `
          <div class="helplist__row" id="${id}" data-reveal>
            <dt>${t}</dt>
            <dd>${d}</dd>
          </div>`
          )
          .join('')}
      </dl>
      <div style="text-align:center; margin-top:2.4rem" data-reveal>
        <a class="btn btn--primary" href="/shop">Shop the Collection</a>
      </div>
    </section>`;
  },
};

export const notFoundPage = {
  title: 'Page not found — MEMÓRIA',
  render() {
    return `
    <section class="container notfound">
      <span class="stamp">404 · Not in the Catalogue</span>
      <h1>Some pages fade like old ink.</h1>
      <p>The page you’re after isn’t in our records — but the perfumes are all here.</p>
      <div class="hero2__ctas" style="justify-content:center">
        <a class="btn btn--primary" href="/">Return Home</a>
        <a class="btn" href="/shop">Shop the Collection</a>
      </div>
    </section>`;
  },
};
