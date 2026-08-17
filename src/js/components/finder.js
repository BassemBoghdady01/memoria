/**
 * MEMÓRIA · "Find Your Memory" — optional 3-step perfume finder.
 */
import { el, esc, money, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { icons } from './icons.js';
import { products, genderLabel, minPrice } from '../data/products.js';
import { bottleImg } from './render.js';
import { navigate } from '../router.js';

/* Personality-driven questions. Values still map onto the catalogue's
   finder tags (mood / who / time) so scoring stays unchanged. */
const STEPS = [
  {
    key: 'mood',
    q: 'Where are we going?',
    hint: 'Be honest. The Department can tell.',
    opts: [
      { v: 'warm', t: 'Dinner we shouldn’t be late for.', s: 'amber, low light, good company' },
      { v: 'bold', t: 'Somewhere with a dress code.', s: 'presence required at the door' },
      { v: 'soft', t: 'Nowhere. That’s the point.', s: 'linen, musk, the sofa' },
      { v: 'fresh', t: 'Out early, back late.', s: 'citrus, open windows' },
      { v: 'floral', t: 'Someone’s balcony.', s: 'jasmine, rose, an excuse' },
      { v: 'woody', t: 'A long walk, no destination.', s: 'cedar, vetiver, ground' },
    ],
  },
  {
    key: 'who',
    q: 'Who is wearing it?',
    hint: 'Scents are memories — borrow freely.',
    opts: [
      { v: 'her', t: 'Her.', s: 'Nº 01 – 03' },
      { v: 'him', t: 'Him.', s: 'Nº 04 – 06' },
      { v: 'either', t: 'Whoever gets there first.', s: 'the whole collection' },
    ],
  },
  {
    key: 'time',
    q: 'How should it behave?',
    hint: 'Projection is a personality trait.',
    opts: [
      { v: 'day', t: 'Keep the morning going.', s: 'light, open, near' },
      { v: 'night', t: 'Last until sunrise.', s: 'deeper, slower' },
      { v: 'everyday', t: 'Stay close. Mind its business.', s: 'a signature' },
      { v: 'special', t: 'Announce me at the door.', s: 'kept for moments' },
    ],
  },
];

function recommend(answers) {
  const scored = products
    .map((p) => {
      let score = 0;
      if (answers.who === 'either' || answers.who === p.gender) score += 3;
      else return { p, score: -1 };
      if (p.finder.mood.includes(answers.mood)) score += 3;
      if (p.finder.time.includes(answers.time)) score += 2;
      return { p, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.p);
}

let overlay = null;
let isOpen = false;
let untrap = null;
let step = 0;
let answers = {};
let lastFocus = null;

function ensure() {
  if (overlay) return overlay;
  overlay = el(`
    <div class="overlay" aria-hidden="true">
      <div class="overlay__scrim" data-close-finder></div>
      <div class="overlay__panel" role="dialog" aria-modal="true" aria-label="Find your memory">
        <div class="search__bar">
          ${icons.sparkle()}
          <span class="drawer__title" style="flex:1">Find Your Memory</span>
          <button class="iconbtn" data-close-finder aria-label="Close finder">${icons.close()}</button>
        </div>
        <div class="finder__body" data-finder-body data-lenis-prevent></div>
      </div>
    </div>`);
  document.querySelector('#overlays').appendChild(overlay);
  overlay.querySelectorAll('[data-close-finder]').forEach((b) => b.addEventListener('click', closeFinder));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeFinder();
  });
  return overlay;
}

function renderStep({ focusFirst = false } = {}) {
  const body = overlay.querySelector('[data-finder-body]');
  if (step < STEPS.length) {
    const s = STEPS[step];
    body.innerHTML = `
      <div class="finder__progress" aria-hidden="true">
        ${STEPS.map((_, i) => `<i class="${i < step ? 'is-done' : ''}"></i>`).join('')}
      </div>
      <h2 class="finder__q">${s.q}</h2>
      <p class="finder__hint">${s.hint}</p>
      <div class="finder__opts">
        ${s.opts
          .map(
            (o) => `
          <button class="finder__opt" data-val="${o.v}">
            <strong>${o.t}</strong>
            <span>${o.s}</span>
          </button>`
          )
          .join('')}
      </div>
      ${step > 0 ? `<div class="finder__back"><button class="link-line" data-back>← back</button></div>` : ''}`;
    body.querySelectorAll('[data-val]').forEach((b) =>
      b.addEventListener('click', () => {
        answers[s.key] = b.dataset.val;
        step++;
        renderStep({ focusFirst: true });
      })
    );
    body.querySelector('[data-back]')?.addEventListener('click', () => {
      step--;
      renderStep({ focusFirst: true });
    });
    if (focusFirst) body.querySelector('.finder__opt')?.focus();
  } else {
    const recs = recommend(answers);
    body.innerHTML = `
      <div class="finder__result-head">
        <span class="stamp">The Memory Department recommends</span>
        <p>${recs.length} scent${recs.length === 1 ? '' : 's'} from the collection. The Department is rarely wrong twice.</p>
      </div>
      <div class="finder__results">
        ${recs
          .map(
            (p) => `
          <button class="search__item" data-slug="${p.slug}">
            <span class="cartline__thumb">${bottleImg(p, { w: 360 })}</span>
            <span>
              <span class="search__itemname">Nº ${p.number} · ${esc(p.name)}</span><br/>
              <span class="search__itemmeta">${genderLabel(p.gender)} · ${esc(p.fragranceFamily)} · ${esc(p.smellsLike.join(', '))}</span>
            </span>
            <span class="search__itemprice">${money(minPrice(p))}</span>
          </button>`
          )
          .join('')}
      </div>
      <div class="finder__back">
        <button class="link-line" data-restart>start again</button>
      </div>`;
    body.querySelectorAll('[data-slug]').forEach((b) =>
      b.addEventListener('click', () => {
        closeFinder();
        navigate(`/product/${b.dataset.slug}`);
      })
    );
    body.querySelector('[data-restart]').addEventListener('click', () => {
      step = 0;
      answers = {};
      renderStep({ focusFirst: true });
    });
    if (focusFirst) body.querySelector('.search__item')?.focus();
  }
}

export function openFinder() {
  ensure();
  step = 0;
  answers = {};
  renderStep();
  lastFocus = document.activeElement;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  lockScroll();
  isOpen = true;
  untrap = trapFocus(overlay.querySelector('.overlay__panel'), closeFinder);
  overlay.querySelector('[data-close-finder][aria-label]').focus();
}

export function closeFinder() {
  if (!overlay || !isOpen) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  isOpen = false;
  untrap?.();
  lastFocus?.focus?.();
}
