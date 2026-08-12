/**
 * MEMÓRIA · Our Story — editorial, honest, placeholder-marked.
 */
import { renderMotif } from '../components/artwork.js';
import { getFeatured } from '../data/products.js';
import { renderBottleStage } from '../components/bottle.js';
import { driftMist, floatBottle, onPageCleanup } from '../motion.js';

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
          <div class="acard" style="--tilt:-3deg" data-reveal>
            <div class="acard__img">${renderMotif('atelier', { title: 'The first atelier' })}</div>
            <div class="acard__caption"><span class="hand">the first room</span><span class="stamp">FIG. 01</span></div>
          </div>
          <div class="acard" style="--tilt:2.4deg; --reveal-delay:140ms" data-reveal>
            <div class="acard__img">${renderMotif('sketch', { title: 'Early bottle sketches' })}</div>
            <div class="acard__caption"><span class="hand">first sketches</span><span class="stamp">FIG. 02</span></div>
          </div>
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
          <div class="acard" style="--tilt:2.6deg" data-reveal>
            <div class="acard__img">${renderMotif('flask', { title: 'Maceration trials' })}</div>
            <div class="acard__caption"><span class="hand">trial upon trial</span><span class="stamp">FIG. 03</span></div>
          </div>
          <div class="acard" style="--tilt:-2deg; --reveal-delay:140ms" data-reveal>
            <div class="acard__img">${renderMotif('notes', { title: 'The perfumer’s notebook' })}</div>
            <div class="acard__caption"><span class="hand">the notebook</span><span class="stamp">FIG. 04</span></div>
          </div>
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
          <div class="memstrip__stack" data-story-stage>
            <div class="acard" style="--tilt:-2deg; top:6%; left:8%; position:absolute; width:56%;" data-reveal>
              <div class="acard__img">${renderMotif('collection', { title: 'The six-bottle collection' })}</div>
              <div class="acard__caption"><span class="hand">six, and enough</span><span class="stamp">VOL. VI</span></div>
            </div>
            <div style="position:absolute; right:4%; bottom:0; width:34%;" data-reveal>
              ${renderBottleStage(getFeatured(), { mists: 2 })}
            </div>
          </div>
        </div>
      </section>
    </article>`;
  },
  mount(root) {
    const stage = root.querySelector('[data-story-stage] .bottle-stage');
    if (stage) {
      onPageCleanup(floatBottle(stage, { y: 6 }));
      onPageCleanup(driftMist(stage.parentElement, { opacity: 0.4 }));
    }
  },
};
