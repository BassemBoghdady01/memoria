/**
 * MEMÓRIA · The Memory Spray — a scroll-driven commercial in four beats.
 *
 *  A  the room darkens, the camera moves in, the bottle turns through its
 *     four real photographed angles while light slides across the glass
 *  B  warm light gathers behind the glass, like sun coming through a
 *     curtain (no drawn particles: a soft bloom, nothing more)
 *  C  the light opens onto a memory — sunlight through a curtain — revealed
 *     through a soft widening mask
 *  D  the memory settles back behind the bottle, the line and the action
 *
 * Native sticky positioning (no scroll hijack); progress is read from the
 * section's position. A skip link jumps past it. Reduced motion gets a
 * still composition with the same line and button.
 */
import { esc } from '../utils.js';
import { onPageCleanup } from '../motion.js';

const TURN = ['04', '01', '02', '03'];
const CAP_SPLIT = 0.285; // the cap ends ~28.5% down the cut-out

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const seg = (p, a, b) => clamp((p - a) / (b - a));

export function memorySpraySection(p, scene, { line = 'Some memories never leave. They become a scent.' } = {}) {
  if (!p) return '';
  const cut = (v, w = 1200) => `/products/${p.slug}/cutout-${v}-${w}.webp`;
  return `
  <section class="spray2" id="memory-spray" aria-labelledby="spray-line" data-spray2>
    <a class="spray2__skip" href="#after-spray">Skip the film ↓</a>
    <div class="spray2__stage" data-stage>
      <div class="spray2__room" aria-hidden="true">${scene ? `<img src="${esc(scene.src.replace('1600', '800'))}" alt="" loading="lazy" decoding="async"/>` : ''}</div>
      <div class="spray2__memory" aria-hidden="true" data-memory>
        ${scene ? `<img src="${esc(scene.src)}" srcset="${esc(scene.srcset)}" sizes="100vw" alt="" loading="lazy" decoding="async"/>` : ''}
      </div>
      <i class="spray2__shade" data-shade aria-hidden="true"></i>
      <div class="spray2__bottle" data-bottle aria-hidden="true">
        <div class="spray2__frames">
          ${TURN.map((v, i) => `<img class="spray2__frame ${v === '01' ? 'is-on' : ''}" data-frame="${i}" src="${cut(v, 600)}" srcset="${cut(v, 600)} 600w, ${cut(v)} 1200w" sizes="40vh" alt="" loading="lazy" decoding="async"/>`).join('')}
        </div>
        <div class="spray2__glass" style="-webkit-mask-image:url(${cut('01', 600)});mask-image:url(${cut('01', 600)})"><i class="spray2__sheen" data-sheen></i></div>
      </div>
      <i class="spray2__bloom" data-bloom aria-hidden="true"></i>
      <div class="spray2__copy">
        <p class="spray2__kicker" data-kicker>The memory spray</p>
        <h2 class="spray2__line" id="spray-line" data-line>${esc(line)}</h2>
        <div class="spray2__cta" data-cta>
          <a class="btn btn--ink-light" href="/product/${esc(p.slug)}">Discover this fragrance</a>
          <span class="spray2__name">${esc(p.name)}</span>
        </div>
      </div>
    </div>
  </section>
  <div id="after-spray" aria-hidden="true"></div>`;
}

export function mountMemorySpray(root, { reduced = false, mobile = false } = {}) {
  const sec = root.querySelector('[data-spray2]');
  if (!sec) return;
  if (reduced) {
    sec.classList.add('spray2--still');
    return;
  }
  const $ = (s) => sec.querySelector(s);
  const frames = [...sec.querySelectorAll('[data-frame]')];
  const bottle = $('[data-bottle]');
  const sheen = $('[data-sheen]');
  const shade = $('[data-shade]');
  const memory = $('[data-memory]');
  const kicker = $('[data-kicker]');
  const lineEl = $('[data-line]');
  const cta = $('[data-cta]');
  const bloom = $('[data-bloom]');

  let lastFrame = -1;
  let raf = 0;
  const render = () => {
    raf = 0;
    const r = sec.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = clamp(-r.top / Math.max(1, total));

    /* A: approach + turn (0 → .32) */
    const a = ease(seg(p, 0, 0.32));
    const fi = Math.min(TURN.length - 1, Math.round(seg(p, 0.02, 0.26) * (TURN.length - 1) * 1.0));
    /* the turn goes 04 → 01 → 02 → 03 and returns to 01 for the spray */
    const frameIdx = p < 0.28 ? fi : 1;
    if (frameIdx !== lastFrame) {
      frames.forEach((f, i) => f.classList.toggle('is-on', i === frameIdx));
      lastFrame = frameIdx;
    }
    /* B: light gathers (.34 → .6) */
    const glow = ease(seg(p, 0.34, 0.6));
    /* C: memory opens (.5 → .72), holds, D: settles (.8 → .92) */
    const open = ease(seg(p, 0.5, 0.72));
    const close = ease(seg(p, 0.8, 0.92));
    const mem = open * (1 - close * 0.82);

    const scale = 0.78 + a * 0.42 - close * 0.18;
    const shiftX = mobile ? 0 : -open * 22 * (1 - close) - close * 17;
    const shiftY = mobile ? -close * 10 : 0;
    const bottleFade = 1 - open * 0.78 * (1 - close);
    bottle.style.transform = `translate3d(${shiftX}vw, ${(1 - a) * 6 + shiftY}vh, 0) scale(${scale})`;
    bottle.style.opacity = bottleFade;
    sheen.style.transform = `translateX(${-120 + seg(p, 0.05, 0.34) * 240}%)`;
    shade.style.opacity = 0.35 + a * 0.5 - open * 0.45 * (1 - close);
    memory.style.opacity = mem;
    memory.style.setProperty('--r', `${12 + open * 95}%`);
    memory.style.setProperty('--b', `${(1 - open) * 14}px`);
    memory.style.setProperty('--s', 1.08 - open * 0.08);
    kicker.style.opacity = 1 - seg(p, 0.08, 0.2);
    lineEl.style.opacity = seg(p, 0.86, 0.94);
    lineEl.style.transform = `translateY(${(1 - seg(p, 0.86, 0.94)) * 16}px)`;
    cta.style.opacity = seg(p, 0.9, 0.97);
    cta.style.pointerEvents = p > 0.9 ? 'auto' : 'none';

    /* the bloom grows behind the bottle, then gives way to the memory */
    bloom.style.opacity = String(glow * (1 - open * 0.7) * (1 - close));
    bloom.style.transform = `translate(-50%, -50%) scale(${0.6 + glow * 0.9 + open * 0.6})`;
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  /* only work while the film is near the viewport */
  let active = false;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !active) {
      active = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      render();
    } else if (!e.isIntersecting && active) {
      active = false;
      window.removeEventListener('scroll', onScroll);
    }
  }, { rootMargin: '200px 0px' });
  io.observe(sec);
  onPageCleanup(() => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
  });
}
