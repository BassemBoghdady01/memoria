/**
 * MEMÓRIA · Motion system.
 * GSAP + ScrollTrigger + Lenis, gated behind prefers-reduced-motion.
 * Pages register cleanups; the router flushes them on navigation.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion, isTouch, $$ } from './utils.js';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const motionOK = () => !prefersReducedMotion();

let lenis = null;

export function initSmoothScroll() {
  if (!motionOK() || isTouch()) {
    document.documentElement.classList.toggle('no-motion', !motionOK());
    return;
  }
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* Pause smooth scroll while an overlay/drawer owns the viewport, so
   panel contents can be wheel-scrolled natively. */
document.addEventListener('memoria:scroll-lock', () => lenis?.stop());
document.addEventListener('memoria:scroll-unlock', () => lenis?.start());

export function scrollToTop(immediate = true) {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }
  /* bypass `html { scroll-behavior: smooth }` for route changes */
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  requestAnimationFrame(() => (html.style.scrollBehavior = prev));
}

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { immediate: true });
  else {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    requestAnimationFrame(() => (html.style.scrollBehavior = prev));
  }
}

export function stopLenis() { lenis?.stop(); }
export function startLenis() { lenis?.start(); }

/* ——— Reveal-on-scroll ——— */
let revealObserver = null;

export function scanReveals(root = document) {
  if (!motionOK()) {
    $$('[data-reveal]', root).forEach((n) => n.classList.add('is-in'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
  }
  $$('[data-reveal]', root).forEach((n) => {
    if (!n.classList.contains('is-in')) revealObserver.observe(n);
  });
}

/* ——— Per-page cleanup registry ——— */
const cleanups = new Set();

export function onPageCleanup(fn) {
  cleanups.add(fn);
}

export function flushPage() {
  cleanups.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
  cleanups.clear();
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.globalTimeline.clear();
  /* drop reveal observations of the outgoing page's nodes */
  revealObserver?.disconnect();
  revealObserver = null;
}

export function refreshTriggers() {
  ScrollTrigger.refresh();
}

/* ——— Pointer tilt for bottles (2.5D) ——— */
export function attachTilt(stage, { max = 7, scale = 1.02 } = {}) {
  if (!motionOK() || isTouch()) return () => {};
  const bottle = stage.querySelector('.bottle');
  if (!bottle) return () => {};
  const qx = gsap.quickTo(bottle, 'rotationY', { duration: 0.7, ease: 'power3.out' });
  const qy = gsap.quickTo(bottle, 'rotationX', { duration: 0.7, ease: 'power3.out' });
  const qs = gsap.quickTo(bottle, 'scale', { duration: 0.7, ease: 'power3.out' });
  gsap.set(bottle, { transformPerspective: 700 });

  function onMove(e) {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    qx(nx * max * 2);
    qy(-ny * max);
    qs(scale);
  }
  function onLeave() {
    qx(0); qy(0); qs(1);
  }
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerleave', onLeave);
  return () => {
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerleave', onLeave);
  };
}

/* ——— Idle float for a bottle ——— */
export function floatBottle(stage, { y = 7, dur = 5 } = {}) {
  if (!motionOK()) return () => {};
  const bottle = stage.querySelector('.bottle');
  if (!bottle) return () => {};
  const tween = gsap.to(bottle, {
    y: -y,
    duration: dur,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
  return () => tween.kill();
}

/* ——— Light sweep across bottle glass ——— */
export function sweepBottle(stage, { every = 6 } = {}) {
  if (!motionOK()) return () => {};
  const sweep = stage.querySelector('.bottle [data-sweep]');
  if (!sweep) return () => {};
  const tween = gsap.fromTo(
    sweep,
    { attr: { x: '-60%' } },
    {
      attr: { x: '120%' },
      duration: 2.4,
      ease: 'power2.inOut',
      repeat: -1,
      repeatDelay: every,
    }
  );
  return () => tween.kill();
}

/* ——— Mist drift (fragrance visualisation) ——— */
export function driftMist(stage, { opacity = 0.5 } = {}) {
  const mists = $$('.mist', stage);
  if (!mists.length) return () => {};
  if (!motionOK()) {
    mists.forEach((m) => (m.style.opacity = opacity * 0.6));
    return () => {};
  }
  const tweens = [];
  mists.forEach((m, i) => {
    tweens.push(
      gsap.to(m, {
        opacity,
        duration: 2 + i,
        ease: 'sine.out',
        scrollTrigger: { trigger: stage, start: 'top 85%' },
      }),
      gsap.to(m, {
        x: `random(-26, 26)`,
        y: `random(-34, -10)`,
        scale: `random(0.92, 1.14)`,
        duration: 7 + i * 2.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        repeatRefresh: true,
      })
    );
  });
  return () => tweens.forEach((t) => t.kill());
}
