/**
 * MEMÓRIA · Our Story — editorial, honest, placeholder-marked.
 * No illustrations: colour worlds, type, and the product itself.
 */
import { products, getProduct } from '../data/products.js';
import { bottleImg } from '../components/render.js';
import { gsap, motionOK, onPageCleanup } from '../motion.js';

function recPlate(world, now, place, meta) {
  return `
  <div class="worldplate" style="--world:${world}" data-reveal>
    <span class="worldplate__now">${now}</span>
    <strong class="worldplate__place">${place}</strong>
    <span class="worldplate__meta">${meta}</span>
    <span class="worldplate__fpo">Campaign still: developing — photography arrives with the shoot</span>
  </div>`;
}

export default {
  title: 'Our Story — MEMÓRIA',
  render() {
    return `
    <article>
      <header class="story-hero container">
        <span class="stamp" data-reveal>Est. twenty years ago* · Cairo</span>
        <h1 data-reveal>A perfume house that <em>keeps</em> what a city forgets.</h1>
        <p class="serif-lede" data-reveal>
          MEMÓRIA began with a simple belief: that a scent is the closest thing
          we have to time travel. For two decades we have made perfume the slow
          way — so that one day, one breath can carry you home.
        </p>
        <p class="stamp" data-reveal style="margin-top:1rem">* full history to be published — placeholder copy</p>
      </header>

      <section class="container story-block" aria-label="The beginning">
        <div class="story-block__art">
          ${recPlate('#B66A4B', 'Chapter I, as remembered:', 'One room. One accord. A lot of jasmine.', 'The first atelier · location on file')}
        </div>
        <div class="story-block__copy">
          <span class="stamp" data-reveal>Chapter I · The Beginning</span>
          <h2 data-reveal>One room, one accord</h2>
          <p data-reveal>
            Placeholder — the founding story belongs to the founders, and we will
            print it in their words. What we can say: it started small, it started
            in Cairo, and it started with jasmine.
          </p>
          <p data-reveal>
            Every scent in today’s collection still passes through the same slow
            ritual — blend, rest, remember, repeat — until the perfume stops
            smelling like ingredients and starts smelling like a place.
          </p>
        </div>
      </section>

      <figure class="story-quote container">
        <blockquote data-reveal>
          “We don’t sell bottles.<br/>We look after other people’s memories.”
        </blockquote>
        <figcaption class="stamp" data-reveal>— the house, on most days</figcaption>
      </figure>

      <section class="container story-block story-block--flip" aria-label="The craft">
        <div class="story-block__art">
          ${recPlate('#2F6670', 'Chapter II, in numbers:', 'Hundreds of trials. Six survivors.', 'The perfumer’s ledger · pages withheld')}
        </div>
        <div class="story-block__copy">
          <span class="stamp" data-reveal>Chapter II · The Craft</span>
          <h2 data-reveal>Slow by choice</h2>
          <p data-reveal>
            Six perfumes is not a small collection to us — it is an edited one.
            Each formula earned its place across years of versions, worn through
            summers and winters, until it could hold a memory without spilling it.
          </p>
          <p data-reveal>
            Three are for her. Three are for him. All of them are for the moment
            you’ll want to keep.
          </p>
        </div>
      </section>

      <section class="memstrip" aria-label="Today">
        <div class="container memstrip__inner">
          <div class="memstrip__copy">
            <span class="stamp" data-reveal>Chapter III · Today</span>
            <h2 data-reveal>The collection, <em>complete</em></h2>
            <p data-reveal>
              Twenty years distilled into six numbered scents. Begin anywhere —
              each bottle opens to the same city, at a different hour.
            </p>
            <a class="btn btn--primary" href="/shop" data-reveal>Shop the Collection</a>
          </div>
          <div class="memstrip__trio" data-story-stage>
            ${['rose-vellum', 'nile-cedar', 'jasmine-dusk']
              .map(
                (slug, i) => `
              <a class="memstrip__bottle" href="/product/${slug}" data-reveal style="--reveal-delay:${i * 120}ms">
                ${bottleImg(getProduct(slug), { w: 360 })}
              </a>`
              )
              .join('')}
          </div>
        </div>
      </section>
    </article>`;
  },
  mount(root) {
    if (motionOK()) {
      const bottles = root.querySelectorAll('.memstrip__bottle picture');
      bottles.forEach((b, i) => {
        const t = gsap.to(b, { y: -7 - i * 2, duration: 4.6 + i * 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        onPageCleanup(() => t.kill());
      });
    }
  },
};
