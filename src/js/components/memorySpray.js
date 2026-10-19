/**
 * MEMÓRIA · The Memory Spray — a scroll-driven commercial in four beats.
 *
 *  A  the room darkens, the camera moves in, the bottle turns through its
 *     four real photographed angles while light slides across the glass
 *  B  a fine spray leaves the bottle: a short
 *     dense burst, then thousands of droplets drifting and diffusing in
 *     the back-light (2D canvas, deterministic: scrolling up rewinds it)
 *  C  the mist opens onto a memory — sunlight through a curtain — revealed
 *     through a soft mask that follows the cloud
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
      <canvas class="spray2__mist" data-mist aria-hidden="true"></canvas>
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
  const canvas = $('[data-mist]');
  const ctx = canvas.getContext('2d');

  /* deterministic droplets */
  const N = mobile ? 420 : 1100;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const drops = Array.from({ length: N }, () => {
    const burst = rnd() < 0.45;
    const fine = rnd() < 0.6; // most droplets are tiny and sharp; the rest are soft haze
    return {
      t0: burst ? rnd() * 0.06 : 0.03 + rnd() * 0.3,
      speed: (burst ? 1.2 : 0.5) + rnd() * (burst ? 1.4 : 0.9),
      ang: -0.18 + (rnd() - 0.5) * (burst ? 0.26 : 0.9),
      drag: 1.6 + rnd() * 3.6,
      size: fine ? 0.5 + rnd() * 1.1 : 2 + rnd() * 4,
      fine,
      wob: rnd() * Math.PI * 2,
      rise: 0.03 + rnd() * 0.16,
      bright: 0.5 + rnd() * 0.5,
    };
  });

  /* soft round sprite, pre-rendered once */
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const sg = sprite.getContext('2d');
  const grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,244,226,1)');
  grad.addColorStop(0.35, 'rgba(255,236,210,0.55)');
  grad.addColorStop(1, 'rgba(255,230,200,0)');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 64, 64);

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };

  function drawMist(t, nozzle, fade) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (t <= 0 || fade <= 0) return;
    ctx.globalCompositeOperation = 'lighter';
    const unit = H;
    for (const d of drops) {
      const age = t - d.t0;
      if (age <= 0) continue;
      const travel = (d.speed / d.drag) * (1 - Math.exp(-d.drag * age));
      const spread = age * 0.3;
      const x = nozzle.x + Math.cos(d.ang) * travel * unit + Math.sin(d.wob + age * 3) * spread * unit * 0.25;
      const y = nozzle.y + Math.sin(d.ang) * travel * unit - d.rise * age * age * unit + Math.cos(d.wob + age * 2.3) * spread * unit * 0.18;
      const life = clamp(1 - age / (d.fine ? 0.55 : 1.0));
      const a = Math.min(1, age * 18) * life * life * d.bright * fade;
      if (a < 0.01) continue;
      const r = (d.fine ? d.size + age * 2.5 : d.size + age * 30) * (mobile ? 0.85 : 1);
      ctx.globalAlpha = a * (d.fine ? 0.75 : 0.11);
      ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    }
    /* the initial jet: a brief bright core leaving the nozzle */
    const jet = clamp(1 - t / 0.12) * fade;
    if (jet > 0) {
      const g = ctx.createRadialGradient(nozzle.x + 30, nozzle.y - 4, 0, nozzle.x + 30, nozzle.y - 4, H * 0.12);
      g.addColorStop(0, `rgba(255,246,232,${0.28 * jet})`);
      g.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(nozzle.x - 20, nozzle.y - H * 0.12, H * 0.3, H * 0.24);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

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
    /* B: spray (.36 → .7) */
    const sprayT = seg(p, 0.36, 0.72) * 0.9;
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

    /* mist: nozzle sits at the top of the collar, on screen */
    const br = bottle.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    /* the mist leaves from the neck, just under the cap, and drifts out into the light */
    const nozzle = { x: br.left - cr.left + br.width * 0.66, y: br.top - cr.top + br.height * (CAP_SPLIT + 0.02) };
    const mistFade = 1 - seg(p, 0.74, 0.86);
    drawMist(sprayT, nozzle, mistFade);
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  /* only work while the film is near the viewport */
  let active = false;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !active) {
      active = true;
      resize();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', resize);
      render();
    } else if (!e.isIntersecting && active) {
      active = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    }
  }, { rootMargin: '200px 0px' });
  io.observe(sec);
  onPageCleanup(() => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    if (raf) cancelAnimationFrame(raf);
  });
}
