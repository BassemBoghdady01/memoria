/**
 * MEMÓRIA · Our Story — the owner's own words, edited in the dashboard
 * (Content → Brand story). Nothing about the founding is invented here.
 */
import { esc } from '../utils.js';
import { settings, products } from '../data/catalog.js';
import { productCutout } from '../components/render.js';
import { campaign, campaignImg } from '../data/campaign.js';
import { setSeo } from '../seo.js';
import scenes from '../data/scenes.json';

export default {
  title: 'Our Story — MEMÓRIA',
  render() {
    const story = settings.home?.story || {};
    const her = settings.heritage || {};
    /* the owner's story if written; otherwise the approved heritage text */
    const s = story.body ? story : { title: her.title ? `${her.title} ${her.script || ''}`.trim() : '', body: her.body || '', image_url: story.image_url };
    const paras = String(s.body || '').split(/\n{2,}/).filter(Boolean);
    const obj = (campaign.objects || []).find((o) => o.id === 'keys') || (campaign.objects || [])[0];
    return `
    <article class="storypage">
      <header class="container storypage__head">
        <p class="label" data-reveal>Our story</p>
        <h1 data-reveal>${esc(s.title || 'Rooted in memory. Inspired by Cairo.')}</h1>
        ${!paras.length ? '<p class="serif-lede" data-reveal>Made to be remembered.</p>' : ''}
      </header>
      <section class="container storypage__body">
        <div class="storypage__copy">
          ${paras.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}
          <a class="btn btn--primary" href="/shop" data-reveal>Explore the collection</a>
        </div>
        <div class="storypage__art" aria-hidden="true">
          ${s.image_url ? `<img src="${esc(s.image_url)}" alt="" loading="lazy"/>` : scenes['heritage-line'] ? `<img src="${esc(scenes['heritage-line'].src)}" srcset="${esc(scenes['heritage-line'].srcset)}" sizes="(max-width: 900px) 100vw, 45vw" alt="" loading="lazy"/>` : obj ? `<img ${campaignImg(obj, { sizes: '(max-width: 900px) 100vw, 40vw' })} alt="" loading="lazy"/>` : ''}
        </div>
      </section>
      <section class="container storypage__shelf" aria-label="The collection">
        ${products
          .slice(0, 7)
          .map((p) => `<a href="/product/${esc(p.slug)}" class="storypage__bottle" aria-label="${esc(p.name)}">${productCutout(p, { sizes: '12vw' })}<span>${esc(p.name)}</span></a>`)
          .join('')}
      </section>
    </article>`;
  },
  mount() {
    setSeo({ title: 'Our Story — MEMÓRIA', description: 'MEMÓRIA — an Egyptian perfume house. Rooted in memory. Inspired by Cairo. Made to be remembered.', path: '/our-story' });
  },
};
