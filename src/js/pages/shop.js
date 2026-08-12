/**
 * MEMÓRIA · Shop — /shop /women /men (same page, preset filters).
 */
import { products, getByGender } from '../data/products.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';
import { openFinder } from '../components/finder.js';

const COPY = {
  all: {
    title: 'The Collection',
    lede: 'Six perfumes, twenty years in the making — three for her, three for him.',
    crumb: 'Shop',
  },
  her: {
    title: 'For Her',
    lede: 'Nº 01 – 03 · Jasmine at dusk, roses kept in letters, linen in morning sun.',
    crumb: 'Women',
  },
  him: {
    title: 'For Him',
    lede: 'Nº 04 – 06 · River cedar, a study of oud, green stone after rain.',
    crumb: 'Men',
  },
};

function makePage(gender) {
  const copy = COPY[gender];
  return {
    title: `${copy.title} — MEMÓRIA`,
    render() {
      const list = getByGender(gender === 'all' ? 'all' : gender);
      return `
      <section class="container">
        <div class="pagehead">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="/">Memória</a><span aria-hidden="true">/</span><span>${copy.crumb}</span>
          </nav>
          <h1 data-reveal>${copy.title}</h1>
          <p class="serif-lede" data-reveal>${copy.lede}</p>
        </div>
        <div class="shop__bar">
          <div class="filters filters--left" role="group" aria-label="Filter by">
            <a class="filter-tab" href="/shop" aria-pressed="${gender === 'all'}">All</a>
            <a class="filter-tab" href="/women" aria-pressed="${gender === 'her'}">Women</a>
            <a class="filter-tab" href="/men" aria-pressed="${gender === 'him'}">Men</a>
          </div>
          <span class="shop__count">${list.length} scent${list.length === 1 ? '' : 's'} · Eau de Parfum</span>
        </div>
        ${renderProductGrid(list)}
        <div class="homecoll__foot" data-reveal>
          <button class="btn" data-open-finder>Not sure? Find your memory</button>
        </div>
      </section>`;
    },
    mount(root) {
      mountProductCards(root);
      root.querySelector('[data-open-finder]')?.addEventListener('click', openFinder);
    },
  };
}

export const shopPage = makePage('all');
export const womenPage = makePage('her');
export const menPage = makePage('him');
