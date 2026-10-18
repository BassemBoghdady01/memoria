/**
 * MEMÓRIA · Shop — /shop (?c=<category>), /women, /men.
 * Filters are built from the categories products actually use.
 */
import { esc } from '../utils.js';
import { products, getByCategory, usedCategories, categories } from '../data/catalog.js';
import { renderProductGrid, mountProductCards } from '../components/productCard.js';
import { setSeo } from '../seo.js';

function makePage(fixed) {
  const pick = (params) => fixed || params.query.get('c') || 'all';
  return {
    title: (params) => {
      const c = categories.find((x) => x.slug === pick(params));
      return `${c ? c.name : 'The Collection'} — MEMÓRIA`;
    },
    render(params) {
      const slug = pick(params);
      const cat = categories.find((x) => x.slug === slug);
      const list = getByCategory(cat ? slug : 'all');
      const tabs = usedCategories();
      return `
      <section class="container shop">
        <div class="pagehead">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${esc(cat ? cat.name : 'Collection')}</span>
          </nav>
          <h1 data-reveal>${esc(cat ? cat.name : 'The Collection')}</h1>
          <p class="serif-lede" data-reveal>${products.length} scents, one bottle, each holding a different memory.</p>
        </div>
        <div class="shop__bar">
          ${
            tabs.length
              ? `<nav class="filters filters--left" aria-label="Filter by category">
            <a class="filter-tab" href="/shop" ${!cat ? 'aria-current="true"' : ''}>All</a>
            ${tabs.map((t) => `<a class="filter-tab" href="/shop?c=${esc(t.slug)}" ${cat?.slug === t.slug ? 'aria-current="true"' : ''}>${esc(t.name)}</a>`).join('')}
          </nav>`
              : '<span></span>'
          }
          <span class="shop__count">${list.length} scent${list.length === 1 ? '' : 's'}</span>
        </div>
        ${renderProductGrid(list)}
      </section>`;
    },
    mount(root, params) {
      const slug = pick(params);
      const cat = categories.find((x) => x.slug === slug);
      setSeo({
        title: `${cat ? cat.name : 'The Collection'} — MEMÓRIA`,
        description: `Shop ${cat ? cat.name.toLowerCase() + ' ' : ''}perfumes by MEMÓRIA. Prices in EGP, delivery across Egypt.`,
        path: cat ? `/shop?c=${cat.slug}` : '/shop',
      });
      mountProductCards(root);
    },
  };
}

export const shopPage = makePage(null);
export const womenPage = makePage('women');
export const menPage = makePage('men');
