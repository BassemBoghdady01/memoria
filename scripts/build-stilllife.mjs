/**
 * MEMÓRIA · Still-life builder (art direction "Afternoon Light").
 *
 * The bottle is never cut out and pasted onto another photograph. We start
 * from the real studio packshot and build the room around it:
 *
 *  1. the packshot keeps its own pixels and its own contact shadow;
 *  2. the white studio sweep becomes warm parchment plaster (the original
 *     shadow is carried across by multiplying, so the bottle still stands
 *     on the surface it was photographed on);
 *  3. one light for everything: a soft window patch from the upper left
 *     falls across wall and bottle together;
 *  4. the bottle casts a sun shadow away from the window: the black cap
 *     blocks the light, the amber glass lets amber light through;
 *  5. one grade + film grain over the whole frame, the same grade every
 *     other photo on the site gets (gradePhoto).
 *
 * A separate leaf-shadow layer (taken from a real photograph of leaf shadows
 * on plaster) is written alongside, to be multiplied over the frame in CSS
 * and drift very slowly.
 *
 *   node scripts/build-stilllife.mjs
 * → public/editorial/*.webp, src/js/data/editorial.json
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/editorial';
const PHOTO = 'brand-src/photography';
await mkdir(OUT, { recursive: true });

/* ———————————————————— helpers ———————————————————— */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}
/** float mask (0..1) → blurred float mask, via sharp */
async function blurMask(arr, W, H, sigma) {
  const u8 = Buffer.alloc(W * H);
  for (let i = 0; i < u8.length; i++) u8[i] = Math.round(clamp(arr[i]) * 255);
  if (sigma < 0.4) return arr;
  const { data } = await sharp(u8, { raw: { width: W, height: H, channels: 1 } })
    .blur(sigma)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 255;
  return out;
}
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');

/* The one grade. Warm balance, highlights rolled to parchment, shadows
   lifted to cocoa, gentle saturation trim, 35mm-like grain. */
function grade(r, g, b, rand, { grain = 0.014, warm = 1 } = {}) {
  // white balance toward late sun
  r *= 1 + 0.035 * warm;
  b *= 1 - 0.07 * warm;
  // saturation trim (keeps amber rich but not neon)
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  r = l + (r - l) * 0.9;
  g = l + (g - l) * 0.9;
  b = l + (b - l) * 0.9;
  // shoulder: no pure white anywhere
  const sh = (c) => (c < 0.82 ? c : 0.82 + (1 - Math.exp(-(c - 0.82) * 3.2)) * 0.14);
  r = sh(r);
  g = sh(g);
  b = sh(b);
  // toe: blacks lift to cocoa
  r = 0.06 + r * 0.93;
  g = 0.038 + g * 0.935;
  b = 0.022 + b * 0.94;
  const n = gauss(rand) * grain;
  return [r + n, g + n, b + n * 0.9];
}

/* ———————————————————— packshot ———————————————————— */

async function loadPackshot(slug, view) {
  const { data, info } = await sharp(`public/products/${slug}/${view}-1600.webp`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width,
    H = info.height;
  // bottle = saturated amber or near-black cap; the studio shadow is neutral grey
  const raw = new Float32Array(W * H);
  const cap = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3],
      g = data[i * 3 + 1],
      b = data[i * 3 + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const lum = (r + g + b) / 3;
    if (sat > 0.16 || lum < 105) raw[i] = 1;
    if (lum < 70 && sat < 0.45) cap[i] = 1;
  }
  // fill each row between its outer bottle pixels (glass highlights are near-white)
  const mask = new Float32Array(W * H);
  let top = H,
    bottom = 0,
    left = W,
    right = 0;
  for (let y = 0; y < H; y++) {
    let a = -1,
      z = -1;
    for (let x = 0; x < W; x++) if (raw[y * W + x]) {
      if (a < 0) a = x;
      z = x;
    }
    if (a >= 0 && z - a > 12) {
      for (let x = a; x <= z; x++) mask[y * W + x] = 1;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, a);
      right = Math.max(right, z);
    }
  }
  // the cap: dark pixels in the upper part of the bottle only
  const capEnd = top + (bottom - top) * 0.36;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (y > capEnd) cap[y * W + x] = 0;
  // close the cap rows too
  for (let y = top; y < capEnd; y++) {
    let a = -1,
      z = -1;
    for (let x = 0; x < W; x++) if (cap[y * W + x]) {
      if (a < 0) a = x;
      z = x;
    }
    if (a >= 0) for (let x = a; x <= z; x++) cap[y * W + x] = 1;
  }
  return { data, W, H, mask, cap, top, bottom, left, right };
}

/** resample a float mask with sharp (scale s) */
async function scaleMask(arr, W, H, w, h) {
  const u8 = Buffer.alloc(W * H);
  for (let i = 0; i < u8.length; i++) u8[i] = Math.round(arr[i] * 255);
  const { data } = await sharp(u8, { raw: { width: W, height: H, channels: 1 } }).resize(w, h, { kernel: 'lanczos3' }).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 255;
  return out;
}

/* ———————————————————— plaster ———————————————————— */

let plasterCache = null;
async function plasterTexture(W, H) {
  // soft mottling of lime plaster: a few octaves of smoothed noise
  const key = `${W}x${H}`;
  if (plasterCache?.key === key) return plasterCache.tex;
  const tex = new Float32Array(W * H);
  const r = rng(42);
  for (const [div, amp] of [[90, 0.55], [28, 0.3], [7, 0.15]]) {
    const w = Math.max(4, Math.round(W / div)),
      h = Math.max(4, Math.round(H / div));
    const n = Buffer.alloc(w * h);
    for (let i = 0; i < n.length; i++) n[i] = Math.round(clamp(128 + gauss(r) * 40, 0, 255));
    const { data } = await sharp(n, { raw: { width: w, height: h, channels: 1 } })
      .resize(W, H, { kernel: 'cubic' })
      .blur(Math.max(1, W / div / 3))
      .extractChannel(0)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < tex.length; i++) tex[i] += ((data[i] - 128) / 128) * amp * 0.1;
  }
  plasterCache = { key, tex };
  return tex;
}

/* ———————————————————— window light ———————————————————— */

/** soft four-pane window patch projected on the wall (upper left → lower right) */
async function windowPatch(W, H, p) {
  const m = new Float32Array(W * H);
  const { cx, cy, w, h, skew, bar } = p; // in px
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // un-skew into the window's own frame
      const v = (y - cy) / h + 0.5;
      const u = (x - cx - (y - cy) * skew) / w + 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const inBarU = Math.abs(u - 0.5) < bar / 2;
      const inBarV = Math.abs(v - 0.5) < bar / 2;
      m[y * W + x] = inBarU || inBarV ? 0 : 1;
    }
  // a sheer curtain softens the edges
  return blurMask(m, W, H, p.soft);
}

/** leaf shadows from a real photograph, normalised to "how much light is blocked" */
async function leafLayer(W, H, crop) {
  const meta = await sharp(`${PHOTO}/leaves.jpg`).metadata();
  const region = {
    left: Math.round(meta.width * crop[0]),
    top: Math.round(meta.height * crop[1]),
    width: Math.round(meta.width * (crop[2] - crop[0])),
    height: Math.round(meta.height * (crop[3] - crop[1])),
  };
  const base = sharp(`${PHOTO}/leaves.jpg`).extract(region).resize(W, H, { fit: 'cover' }).greyscale();
  const l = await base.clone().blur(1.2).raw().toBuffer();
  const env = await base.clone().blur(Math.max(20, W / 22)).raw().toBuffer();
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = clamp(1 - l[i] / Math.max(40, env[i] * 1.15));
  return out;
}

/* ———————————————————— the still life ———————————————————— */

/**
 * @param o.slug, o.view       packshot
 * @param o.W, o.H             canvas
 * @param o.cx, o.base, o.bh   bottle centre x, base line y, bottle height (px)
 * @param o.win                window patch {cx, cy, w, h, skew, bar, soft} (fractions of W/H)
 * @param o.leaves             leaf crop of the source photo
 */
async function stillLife(o) {
  const { W, H } = o;
  const P = await loadPackshot(o.slug, o.view);
  const s = o.bh / (P.bottom - P.top);
  const sw = Math.round(P.W * s),
    shh = Math.round(P.H * s);
  const ox = Math.round(o.cx - ((P.left + P.right) / 2) * s);
  const oy = Math.round(o.base - P.bottom * s);

  // packshot pixels, scaled
  const pk = await sharp(P.data, { raw: { width: P.W, height: P.H, channels: 3 } }).resize(sw, shh, { kernel: 'lanczos3' }).raw().toBuffer();
  const mk = await scaleMask(P.mask, P.W, P.H, sw, shh);
  const ck = await scaleMask(P.cap, P.W, P.H, sw, shh);

  // place on a white canvas (the studio sweep is white, so the seam vanishes)
  const img = new Float32Array(W * H * 3).fill(1);
  const M = new Float32Array(W * H);
  const C = new Float32Array(W * H);
  for (let y = 0; y < shh; y++) {
    const Y = y + oy;
    if (Y < 0 || Y >= H) continue;
    for (let x = 0; x < sw; x++) {
      const X = x + ox;
      if (X < 0 || X >= W) continue;
      const i = Y * W + X,
        j = y * sw + x;
      img[i * 3] = pk[j * 3] / 255;
      img[i * 3 + 1] = pk[j * 3 + 1] / 255;
      img[i * 3 + 2] = pk[j * 3 + 2] / 255;
      M[i] = mk[j];
      C[i] = ck[j];
    }
  }
  // soften the packshot's own square edge in case it falls inside the canvas
  const edge = Math.max(20, sw * 0.04);
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const x = X - ox,
        y = Y - oy;
      if (x < 0 || y < 0 || x >= sw || y >= shh) continue;
      const d = Math.min(x, y, sw - 1 - x, shh - 1 - y);
      if (d < edge) {
        const t = d / edge,
          i = (Y * W + X) * 3;
        for (let c = 0; c < 3; c++) img[i + c] = 1 - (1 - img[i + c]) * t;
      }
    }

  // —— 2 · plaster: white sweep → parchment, original contact shadow carried across
  const tex = await plasterTexture(W, H);
  const wallTop = [0.92, 0.87, 0.79],
    wallLow = [0.96, 0.92, 0.85],
    floor = [0.975, 0.94, 0.87];
  const bottleTint = [1.0, 0.975, 0.93];
  const out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const k = smooth(0, o.base / H, t);
    const f = smooth(o.base / H - 0.06, o.base / H + 0.04, t);
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = M[i];
      for (let c = 0; c < 3; c++) {
        let plaster = wallTop[c] + (wallLow[c] - wallTop[c]) * k;
        plaster = plaster + (floor[c] - plaster) * f;
        plaster *= 1 + tex[i] * 0.45;
        const tone = m * bottleTint[c] + (1 - m) * plaster;
        out[i * 3 + c] = img[i * 3 + c] * tone;
      }
    }
  }

  // —— 3 · window light
  const win = await windowPatch(W, H, {
    cx: o.win.cx * W,
    cy: o.win.cy * H,
    w: o.win.w * W,
    h: o.win.h * H,
    skew: o.win.skew,
    bar: o.win.bar,
    soft: o.win.soft * W,
  });

  // —— 4 · cast shadow: sheared up the wall, away from the window
  const shear = o.shear ?? 0.5,
    squash = o.squash ?? 0.88;
  const shCap = new Float32Array(W * H),
    shBody = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const dy = o.base - y;
    if (dy < -4) continue;
    const sy = Math.round(o.base - Math.max(0, dy) / squash);
    if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < W; x++) {
      const sx = Math.round(x - Math.max(0, dy) * shear);
      if (sx < 0 || sx >= W) continue;
      const j = sy * W + sx;
      shCap[y * W + x] = C[j];
      shBody[y * W + x] = Math.max(0, M[j] - C[j]);
    }
  }
  if (process.env.DEBUG_MAPS) {
    const d2 = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) { d2[i * 3] = M[i] * 255; d2[i * 3 + 1] = C[i] * 255; }
    await sharp(d2, { raw: { width: W, height: H, channels: 3 } }).resize(900).png().toFile(`qa/rd/mc-${o.view}-${W}.png`);
    console.error("P", P.top, P.bottom, P.left, P.right, "s", s, sw, shh, ox, oy);
  }
  if (process.env.DEBUG_MAPS) {
    const dbg = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) { dbg[i * 3] = win[i] * 255; dbg[i * 3 + 1] = shCap[i] * 255; dbg[i * 3 + 2] = shBody[i] * 255; }
    await sharp(dbg, { raw: { width: W, height: H, channels: 3 } }).resize(900).jpeg().toFile(`qa/rd/maps-${o.view}-${W}.jpg`);
  }
  const capNear = await blurMask(shCap, W, H, o.bh * 0.006);
  const capFar = await blurMask(shCap, W, H, o.bh * 0.03);
  const bodyNear = await blurMask(shBody, W, H, o.bh * 0.008);
  const bodyFar = await blurMask(shBody, W, H, o.bh * 0.035);
  // amber glass transmits warm light; a brighter caustic pools in the middle
  const amberT = [0.4, 0.19, 0.07];

  const amb = o.amb || [0.745, 0.715, 0.68];
  const sun = o.sun || [0.5, 0.37, 0.2];
  for (let y = 0; y < H; y++) {
    const far = clamp((o.base - y) / o.bh);
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const occCap = capNear[i] * (1 - far) + capFar[i] * far;
      const occBody = bodyNear[i] * (1 - far) + bodyFar[i] * far;
      const notOnBottle = 1 - M[i];
      for (let c = 0; c < 3; c++) {
        const through = 1 - notOnBottle * (occCap + occBody * (1 - amberT[c]));
        const light = amb[c] + sun[c] * win[i] * clamp(through) * 1.0;
        out[i * 3 + c] *= light / 0.92;
      }
    }
  }

  // —— 5 · grade, vignette, grain
  const rand = rng(o.seed || 7);
  const buf = Buffer.alloc(W * H * 3);
  const vx = o.vignette?.x ?? 0.62,
    vy = o.vignette?.y ?? 0.5;
  let edgeSum = [0, 0, 0],
    edgeN = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = x / W - vx,
        dyy = y / H - vy;
      const v = 1 - 0.16 * clamp((dx * dx + dyy * dyy) * 2.2);
      const [r, g, b] = grade(out[i * 3] * v, out[i * 3 + 1] * v, out[i * 3 + 2] * v, rand, { grain: o.grain ?? 0.012 });
      buf[i * 3] = Math.round(clamp(r) * 255);
      buf[i * 3 + 1] = Math.round(clamp(g) * 255);
      buf[i * 3 + 2] = Math.round(clamp(b) * 255);
    }
  // average colour along the left edge (used to blend the page into the photo)
  for (let y = Math.round(H * 0.3); y < H * 0.7; y++) {
    const i = y * W + 2;
    edgeSum[0] += buf[i * 3] / 255;
    edgeSum[1] += buf[i * 3 + 1] / 255;
    edgeSum[2] += buf[i * 3 + 2] / 255;
    edgeN++;
  }
  const edgeColour = hex(edgeSum[0] / edgeN, edgeSum[1] / edgeN, edgeSum[2] / edgeN);

  // leaf layer: white = untouched, shadows only where the sun falls
  let leafBuf = null;
  if (o.leaves) {
    const leaf = await leafLayer(W, H, o.leaves);
    leafBuf = Buffer.alloc(W * H * 3);
    const tint = [0.86, 0.79, 0.74];
    for (let i = 0; i < W * H; i++) {
      const a = leaf[i] * win[i] * 0.5;
      for (let c = 0; c < 3; c++) leafBuf[i * 3 + c] = Math.round((1 - a * (1 - tint[c])) * 255);
    }
  }
  return { buf, leafBuf, edgeColour };
}

async function writeSizes(buf, W, H, name, widths, q = 84) {
  for (const w of widths) {
    await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
      .resize(w)
      .webp({ quality: q, smartSubsample: true })
      .toFile(`${OUT}/${name}-${w}.webp`);
  }
}

/** grade a licensed memory photograph with the same grade as the still lifes */
async function gradePhoto(file, name, W, H, widths, { position = 'centre', exposure = 1 } = {}) {
  const { data } = await sharp(`${PHOTO}/${file}`).resize(W, H, { fit: 'cover', position }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rand = rng(11);
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = grade((data[i * 3] / 255) * exposure, (data[i * 3 + 1] / 255) * exposure, (data[i * 3 + 2] / 255) * exposure, rand, { grain: 0.016, warm: 0.6 });
    buf[i * 3] = Math.round(clamp(r) * 255);
    buf[i * 3 + 1] = Math.round(clamp(g) * 255);
    buf[i * 3 + 2] = Math.round(clamp(b) * 255);
  }
  await writeSizes(buf, W, H, name, widths, 82);
}

/* ———————————————————— the frames ———————————————————— */

const manifest = {};

// HERO · desktop 16:9 — bottle on the right third, open plaster on the left
{
  const W = 2560,
    H = 1440;
  const r = await stillLife({
    slug: 'liqaa',
    view: '01',
    W,
    H,
    cx: W * 0.7,
    base: H * 0.865,
    bh: H * 0.64,
    win: { cx: 0.7, cy: 0.5, w: 0.52, h: 1.08, skew: -0.42, bar: 0.05, soft: 0.005 },
    leaves: [0.05, 0.08, 0.72, 0.9],
    shear: 0.62,
    vignette: { x: 0.6, y: 0.5 },
    seed: 3,
  });
  await writeSizes(r.buf, W, H, 'hero-liqaa', [1280, 1920, 2560]);
  await writeSizes(r.leafBuf, W, H, 'hero-liqaa-leaves', [1280, 1920], 80);
  manifest.hero = { w: W, h: H, widths: [1280, 1920, 2560], leaves: [1280, 1920], edge: r.edgeColour };
}

// HERO · mobile 9:16 — headline on plaster above, bottle below
{
  const W = 1080,
    H = 1920;
  const r = await stillLife({
    slug: 'liqaa',
    view: '01',
    W,
    H,
    cx: W * 0.5,
    base: H * 0.925,
    bh: H * 0.4,
    win: { cx: 0.62, cy: 0.66, w: 1.0, h: 0.66, skew: -0.42, bar: 0.045, soft: 0.01 },
    leaves: [0.08, 0.1, 0.62, 0.92],
    shear: 0.42,
    vignette: { x: 0.5, y: 0.62 },
    seed: 5,
  });
  await writeSizes(r.buf, W, H, 'hero-m-liqaa', [720, 1080]);
  await writeSizes(r.leafBuf, W, H, 'hero-m-liqaa-leaves', [720, 1080], 80);
  manifest.heroMobile = { w: W, h: H, widths: [720, 1080], leaves: [720, 1080], edge: r.edgeColour };
}

// FEATURED · LIQAA packshot plate, 4:5, same room, same light
{
  const W = 1600,
    H = 2000;
  const r = await stillLife({
    slug: 'liqaa',
    view: '04',
    W,
    H,
    cx: W * 0.5,
    base: H * 0.83,
    bh: H * 0.58,
    win: { cx: 0.6, cy: 0.5, w: 0.9, h: 0.95, skew: -0.42, bar: 0.045, soft: 0.008 },
    leaves: null,
    shear: 0.4,
    vignette: { x: 0.5, y: 0.5 },
    seed: 9,
  });
  await writeSizes(r.buf, W, H, 'plate-liqaa', [800, 1200, 1600]);
  manifest.plate = { liqaa: { w: W, h: H, widths: [800, 1200, 1600], edge: r.edgeColour } };
}

// MEMORY · the moment LIQAA is named after (licensed photo, same grade)
await gradePhoto('armchair.jpg', 'memory-liqaa', 1600, 2000, [800, 1200, 1600], { position: 'centre', exposure: 0.98 });
manifest.memory = { liqaa: { w: 1600, h: 2000, widths: [800, 1200, 1600], credit: 'armchair.jpg' } };

await writeFile('src/js/data/editorial.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(manifest);
