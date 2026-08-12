/**
 * MEMÓRIA · The Archive — 20-year timeline of paper artifacts.
 * All eras/years are placeholders (see data/archive.js).
 */
import { el, esc, trapFocus, lockScroll, unlockScroll } from '../utils.js';
import { archiveEras } from '../data/archive.js';
import { renderMotif } from '../components/artwork.js';
import { icons } from '../components/icons.js';
import { onPageCleanup } from '../motion.js';

let lightbox = null;
let lbOpen = false;
let lbUntrap = null;
let lastFocus = null;

function ensureLightbox() {
  if (lightbox) return lightbox;
  lightbox = el(`
    <div class="lightbox" aria-hidden="true">
      <div class="lightbox__scrim" data-lb-close></div>
      <div class="lightbox__card" role="dialog" aria-modal="true" aria-label="Archive item">
        <button class="iconbtn lightbox__close" data-lb-close aria-label="Close">${icons.close()}</button>
        <div class="lightbox__img" data-lb-img></div>
        <div class="lightbox__body">
          <span class="stamp" data-lb-stamp></span>
          <h3 data-lb-title></h3>
          <p data-lb-text></p>
        </div>
      </div>
    </div>`);
  document.querySelector('#overlays').appendChild(lightbox);
  lightbox.querySelectorAll('[data-lb-close]').forEach((b) => b.addEventListener('click', closeLightbox));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lbOpen) closeLightbox();
  });
  return lightbox;
}

function openLightbox({ motif, caption, stamp, era }) {
  ensureLightbox();
  lastFocus = document.activeElement;
  lightbox.querySelector('[data-lb-img]').innerHTML = renderMotif(motif, { title: caption });
  lightbox.querySelector('[data-lb-stamp]').textContent = `${stamp} · ${era.year} — ${era.tag}`;
  lightbox.querySelector('[data-lb-title]').textContent = caption;
  lightbox.querySelector('[data-lb-text]').textContent = era.text;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  lockScroll();
  lbOpen = true;
  lbUntrap = trapFocus(lightbox.querySelector('.lightbox__card'), closeLightbox);
  lightbox.querySelector('[data-lb-close][aria-label]').focus();
}

function closeLightbox() {
  if (!lightbox || !lbOpen) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  unlockScroll();
  lbOpen = false;
  lbUntrap?.();
  lastFocus?.focus?.();
}

export default {
  title: 'The Archive — MEMÓRIA',
  render() {
    return `
    <section class="archive container">
      <div class="pagehead">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Memória</a><span aria-hidden="true">/</span><span>The Archive</span>
        </nav>
        <h1 data-reveal>The MEMÓRIA Archive</h1>
        <p class="serif-lede" data-reveal>
          Twenty years of labels, letters, sketches and light — an album, not a museum.
          Open any card; every artifact keeps a note from its year.
        </p>
        <p class="stamp" data-reveal>All years shown are placeholders until the house history is confirmed.</p>
      </div>

      <div class="archive__timeline">
        <span class="archive__spine" aria-hidden="true"></span>
        ${archiveEras
          .map(
            (era, ei) => `
          <div class="archive__era">
            <span class="archive__dot" aria-hidden="true"></span>
            <div class="archive__meta">
              <span class="year" data-reveal>${era.year}</span>
              <span class="stamp" data-reveal>${esc(era.tag)}</span>
              <h3 data-reveal>${esc(era.title)}</h3>
              <p data-reveal>${esc(era.text)}</p>
            </div>
            <div class="archive__cards">
              ${era.artifacts
                .map(
                  (a, ai) => `
                <button class="acard" style="--tilt:${a.tilt}deg; --reveal-delay:${ai * 120}ms" data-reveal
                        data-artifact="${ei}:${ai}" aria-haspopup="dialog">
                  <span class="acard__img">${renderMotif(a.motif, { title: esc(a.caption) })}</span>
                  <span class="acard__caption">
                    <span class="hand">${esc(a.caption)}</span>
                    <span class="stamp">${esc(a.stamp)}</span>
                  </span>
                </button>`
                )
                .join('')}
            </div>
          </div>`
          )
          .join('')}
      </div>

      <div class="archive__note">
        <p class="serif-lede" data-reveal>The next chapter is being written — perhaps by you.</p>
        <div class="hero__ctas" style="justify-content:center; margin-top:1.4rem" data-reveal>
          <a class="btn btn--primary" href="/shop">Shop the Collection</a>
          <a class="btn" href="/our-story">Read Our Story</a>
        </div>
      </div>
    </section>`;
  },
  mount(root) {
    root.querySelectorAll('[data-artifact]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const [ei, ai] = btn.dataset.artifact.split(':').map(Number);
        const era = archiveEras[ei];
        openLightbox({ ...era.artifacts[ai], era });
      })
    );
    onPageCleanup(() => closeLightbox());
  },
};
