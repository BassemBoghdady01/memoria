/**
 * MEMÓRIA · Our Story — the owner's own words, edited in the dashboard
 * (Content → Brand story, or the heritage text). Nothing about the founding
 * is invented here, and no stock photograph stands in for the house's
 * history: the images are the house's own bottles, in the house light.
 */
import { esc } from '../utils.js';
import { settings, products } from '../data/catalog.js';
import { productPlate } from '../components/render.js';
import { setSeo } from '../seo.js';
import ed from '../data/editorial.json';

export default {
  title: 'Our Story — MEMÓRIA',
  render() {
    const story = settings.home?.story || {};
    const her = settings.heritage || {};
    /* the owner's story if written; otherwise the approved heritage text */
    const title = story.body ? story.title : her.title;
    const script = story.body ? '' : her.script;
    const body = story.body || her.body || '';
    const paras = String(body).split(/\n{2,}/).filter(Boolean);
    const steps = (her.steps || []).slice(0, 4);
    const details = ed.details || [];
    const hero = ed.hero;
    return `
    <article class="story2">
      <header class="story2__head">
        <div class="story2__copy">
          <p class="ed-label" data-reveal>Our story</p>
          <h1 data-reveal>${esc(title || 'Rooted in memory. Inspired by Cairo.')}${script ? `<span>${esc(script)}</span>` : ''}</h1>
          ${paras.map((t) => `<p class="story2__body" data-reveal>${esc(t)}</p>`).join('')}
          ${her.years ? `<p class="story2__years" data-reveal><strong>${esc(String(her.years))}</strong> years of perfume craft · Cairo</p>` : ''}
        </div>
        ${
          story.image_url
            ? `<figure class="story2__img"><img src="${esc(story.image_url)}" alt="" loading="lazy"/></figure>`
            : hero
              ? `<figure class="story2__img" aria-hidden="true"><img src="/editorial/hero-m-liqaa-1080.webp" srcset="/editorial/hero-m-liqaa-720.webp 720w, /editorial/hero-m-liqaa-1080.webp 1080w" sizes="(max-width: 900px) 100vw, 40vw" alt="" loading="lazy" decoding="async"/></figure>`
              : ''
        }
      </header>

      ${
        steps.length
          ? `<ol class="edr__chapters story2__chapters">
        ${steps
          .map((s, i) => {
            const d = details[i];
            return `<li data-reveal style="--reveal-delay:${i * 90}ms">
              ${d ? `<span class="edr__img"><img src="/editorial/detail-${esc(d.name)}-800.webp" sizes="(max-width: 760px) 50vw, 22vw" srcset="/editorial/detail-${esc(d.name)}-400.webp 400w, /editorial/detail-${esc(d.name)}-800.webp 800w" alt="" loading="lazy" decoding="async"/></span>` : ''}
              <span class="edr__no">${String(i + 1).padStart(2, '0')}</span>
              <span class="edr__step">${esc(s)}</span>
            </li>`;
          })
          .join('')}
      </ol>`
          : ''
      }

      <section class="story2__shelf" aria-labelledby="shelf-title">
        <p class="ed-label" data-reveal>The collection</p>
        <h2 id="shelf-title" data-reveal>Seven scents, each named for a moment.</h2>
        <div class="story2__row">
          ${products
            .slice(0, 7)
            .map((p) => `<a href="/product/${esc(p.slug)}" class="story2__bottle" data-reveal>${productPlate(p, { sizes: '(max-width: 760px) 40vw, 13vw', alt: '' })}<span>${esc(p.name)}</span></a>`)
            .join('')}
        </div>
        <a class="ed-btn" href="/shop" data-reveal>Explore the collection</a>
      </section>
    </article>`;
  },
  mount() {
    setSeo({ title: 'Our Story — MEMÓRIA', description: 'MEMÓRIA — an Egyptian perfume house. Rooted in memory. Inspired by Cairo. Made to be remembered.', path: '/our-story' });
  },
};
