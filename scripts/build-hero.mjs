/**
 * MEMÓRIA · Hero scene, composited per product.
 *
 * Scene: a sunlit window desk (licensed photo) whose garden view is
 * replaced by a hazy afternoon view over the Nile in Cairo (licensed
 * photo). The real bottle cut-out is then placed on the window ledge and
 * physically integrated: colour-matched to the room, backlit with a rim
 * of window light, warm light transmitted through the glass, a contact
 * shadow and a faint reflection on the polished ledge. The bottle's
 * printing, shape and cap are never redrawn.
 *
 * Writes public/campaign/hero-<slug>-<w>.webp (desktop, ~2.4:1) and
 * hero-m-<slug>-<w>.webp (mobile, 3:4) for every product, plus the plain
 * scene (no bottle) for the dashboard to fall back on.
 *
 * Usage: node scripts/build-hero.mjs [slug]
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const P = 'brand-src/photography/';
const OUT = 'public/campaign/';
await mkdir(OUT, { recursive: true });
const only = process.argv[2];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

async function rawOf(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/* ——— 1. the room, with Cairo outside the window ——— */
async function buildScene() {
  const desk = await rawOf(P + 'desk.jpg');
  const { w: W, h: H, data } = desk;
  const s = W / 1200; // the mask boxes were measured on a 1200-wide preview
  const box = (x0, y0, x1, y1) => [x0 * s, y0 * s, x1 * s, y1 * s];
  const keep = [box(398, 462, 488, 668), box(484, 572, 560, 672), box(628, 560, 732, 680), box(818, 560, 940, 692)];
  const winRight = 962 * s;
  const winBottom = 642 * s;
  /* window = everything inside the frame except the painted mullions and the
     objects on the ledge. Mullions are found geometrically: columns / row
     segments where cream "frame" colour dominates. */
  const isFrame = new Uint8Array(W * H);
  for (let y = 0; y < winBottom; y++) {
    for (let x = 0; x < winRight; x++) {
      const i = (y * W + x) * 3;
      const [hu, sa, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
      if (hu >= 12 && hu <= 58 && sa >= 0.1 && sa <= 0.62 && v > 0.4) isFrame[y * W + x] = 1;
    }
  }
  const colScore = new Float32Array(W);
  const y0 = Math.round(60 * s), y1 = Math.round(600 * s);
  for (let x = 0; x < winRight; x++) {
    let n = 0;
    for (let y = y0; y < y1; y++) n += isFrame[y * W + x];
    colScore[x] = n / (y1 - y0);
  }
  const seg = Math.round(300 * s);
  const rowScore = (x, y) => {
    const xs = Math.floor(x / seg) * seg;
    let n = 0, t = 0;
    for (let xx = xs; xx < Math.min(xs + seg, winRight); xx++) { n += isFrame[y * W + xx]; t++; }
    return t ? n / t : 0;
  };
  const rowCache = new Map();
  const mask = Buffer.alloc(W * H);
  for (let y = 0; y < winBottom; y++) {
    for (let x = 0; x < winRight; x++) {
      if (keep.some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)) {
        /* inside an object's box only the garden behind it is replaced */
        const i = (y * W + x) * 3;
        const [hu, sa, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
        if (!((hu >= 60 && hu <= 200 && sa > 0.18) || (sa > 0.42 && v > 0.5))) continue;
      }
      let frame = colScore[x] > 0.34;
      if (!frame) {
        const key = Math.floor(x / seg) * 100000 + y;
        let r = rowCache.get(key);
        if (r === undefined) rowCache.set(key, (r = rowScore(x, y)));
        frame = r > 0.36;
      }
      if (!frame) mask[y * W + x] = 255;
      else {
        /* garden colour that slipped into a frame row/column is still garden */
        const i = (y * W + x) * 3;
        const [hu, sa] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
        if ((hu >= 58 && hu <= 200 && sa > 0.15) || sa > 0.62) mask[y * W + x] = 255;
      }
    }
  }
  /* garden still visible under the curtain hem */
  for (let y = Math.round(500 * s); y < winBottom; y++) {
    for (let x = Math.round(winRight); x < Math.round(1012 * s); x++) {
      const i = (y * W + x) * 3;
      const [hu, sa] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
      if (hu >= 58 && hu <= 200 && sa > 0.15) mask[y * W + x] = 255;
    }
  }
  /* close small holes, soften edges */
  const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(1.4).extractChannel(0).raw().toBuffer();

  /* the view: Nile at Zamalek, graded to a hazy golden afternoon, softly out of focus */
  const vW = Math.round(1012 * s + 20 * s), vH = Math.round(winBottom + 20 * s);
  const nile = await sharp(P + 'nile.jpg')
    .resize(vW, vH, { fit: 'cover', position: 'centre' })
    .recomb([[1.12, 0.1, 0.0], [0.04, 1.0, 0.0], [0.0, 0.06, 0.74]])
    .modulate({ brightness: 1.22, saturation: 0.8 })
    .linear(0.85, 40)
    .blur(1.6)
    .raw()
    .toBuffer();

  const out = Buffer.from(data);
  for (let y = 0; y < vH && y < H; y++) {
    for (let x = 0; x < vW && x < W; x++) {
      const a = soft[y * W + x] / 255;
      if (!a) continue;
      const i = (y * W + x) * 3, j = (y * vW + x) * 3;
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(out[i + c] * (1 - a) + nile[j + c] * a);
    }
  }
  /* whole-room grade: afternoon warmth, a touch of teal kept in the shadows */
  return sharp(out, { raw: { width: W, height: H, channels: 3 } })
    .recomb([[1.08, 0.05, 0.0], [0.02, 0.97, 0.0], [0.0, 0.04, 0.86]])
    .modulate({ brightness: 1.0, saturation: 0.92 })
    .linear(1.12, -14)
    .png()
    .toBuffer();
}

/* ——— 2. the bottle, physically integrated ——— */
async function integrateBottle(sceneBuf, slug, { cx, baseY, height }) {
  const scene = await rawOf(sceneBuf);
  const cut = await sharp(`public/products/${slug}/cutout-01-1200.png`).resize({ height: Math.round(height) }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bw = cut.info.width, bh = cut.info.height, px = cut.data;
  const left = Math.round(cx - bw / 2), top = Math.round(baseY - bh);

  /* rim of window light: alpha edge, blurred, strongest on the window side (behind/left) */
  const alpha = Buffer.alloc(bw * bh);
  for (let i = 0; i < bw * bh; i++) alpha[i] = px[i * 4 + 3] > 200 ? 255 : 0;
  const eroded = await sharp(alpha, { raw: { width: bw, height: bh, channels: 1 } }).blur(9).linear(2.2, -255).extractChannel(0).raw().toBuffer();

  const out = Buffer.from(scene.data);
  const W = scene.w;
  const capEnd = Math.round(bh * 0.33); // the black wooden cap occupies roughly the top third
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const k = y * bw + x;
      const a = px[k * 4 + 3] / 255;
      if (!a) continue;
      const X = left + x, Y = top + y;
      if (X < 0 || Y < 0 || X >= W || Y >= scene.h) continue;
      let r = px[k * 4], g = px[k * 4 + 1], b = px[k * 4 + 2];
      /* colour match: the studio white light becomes warm room light */
      r = r * 1.0; g = g * 0.95; b = b * 0.86;
      /* light from the window passing through the liquid (glass body only) */
      if (y > capEnd) {
        const t = smooth(clamp((y - capEnd) / (bh - capEnd)));
        const glow = 0.1 * (1 - Math.abs(t - 0.45) * 1.6);
        r += 120 * glow; g += 62 * glow; b += 18 * glow;
      }
      /* rim light from behind */
      const rim = (1 - eroded[k] / 255) * (x < bw * 0.5 ? 0.4 : 0.22);
      r += 160 * rim; g += 132 * rim; b += 92 * rim;
      /* ambient occlusion towards the base */
      const ao = 1 - 0.18 * smooth(clamp((y - bh * 0.86) / (bh * 0.14)));
      r *= ao; g *= ao; b *= ao;
      const i = (Y * W + X) * 3;
      /* glass is not opaque: let a little of the window show through the body,
         never through the printing (bright) or the cap */
      const lum = (px[k * 4] + px[k * 4 + 1] + px[k * 4 + 2]) / 3;
      const see = y > capEnd && lum < 200 ? 0.13 * smooth(clamp((y - capEnd) / (bh * 0.08))) * (1 - smooth(clamp((y - bh * 0.88) / (bh * 0.1)))) : 0;
      r = r * (1 - see) + out[i] * see;
      g = g * (1 - see) + out[i + 1] * see;
      b = b * (1 - see) + out[i + 2] * see;
      out[i] = clamp(Math.round(out[i] * (1 - a) + r * a), 0, 255);
      out[i + 1] = clamp(Math.round(out[i + 1] * (1 - a) + g * a), 0, 255);
      out[i + 2] = clamp(Math.round(out[i + 2] * (1 - a) + b * a), 0, 255);
    }
  }

  /* contact shadow + soft forward shadow on the ledge */
  const shW = Math.round(bw * 1.5), shH = Math.round(bh * 0.09);
  const shadow = await sharp(Buffer.from(`<svg width="${shW}" height="${shH}"><defs><radialGradient id="g"><stop offset="0" stop-color="#000" stop-opacity="0.7"/><stop offset="0.55" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${shW / 2}" cy="${shH / 2}" rx="${shW / 2}" ry="${shH / 2}" fill="url(#g)"/></svg>`)).blur(3).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const sx = Math.round(cx - shW / 2), sy = Math.round(baseY - shH * 0.45);
  for (let y = 0; y < shH; y++) {
    for (let x = 0; x < shW; x++) {
      const a = (shadow.data[(y * shW + x) * 4 + 3] / 255) * 0.85;
      const X = sx + x, Y = sy + y;
      if (!a || X < 0 || Y < 0 || X >= W || Y >= scene.h) continue;
      if (Y < baseY - 2 && px[((Y - top) * bw + (X - left)) * 4 + 3] > 10) continue; // never over the glass
      const i = (Y * W + X) * 3;
      out[i] *= 1 - a; out[i + 1] *= 1 - a; out[i + 2] *= 1 - a;
    }
  }

  /* faint reflection in the polished ledge */
  const reflH = Math.round(bh * 0.16);
  for (let y = 0; y < reflH; y++) {
    const srcY = bh - 1 - y;
    const fade = 0.16 * (1 - y / reflH) ** 2;
    for (let x = 0; x < bw; x++) {
      const k = srcY * bw + x;
      const a = (px[k * 4 + 3] / 255) * fade;
      const X = left + x, Y = baseY + y;
      if (!a || X < 0 || X >= W || Y >= scene.h) continue;
      const i = (Y * W + X) * 3;
      out[i] = Math.round(out[i] * (1 - a) + px[k * 4] * 0.9 * a);
      out[i + 1] = Math.round(out[i + 1] * (1 - a) + px[k * 4 + 1] * 0.8 * a);
      out[i + 2] = Math.round(out[i + 2] * (1 - a) + px[k * 4 + 2] * 0.7 * a);
    }
  }
  return sharp(out, { raw: { width: W, height: scene.h, channels: 3 } }).png().toBuffer();
}

function vignette(w, h, s = 0.42) {
  return Buffer.from(`<svg width="${w}" height="${h}"><defs><radialGradient id="v" cx="0.55" cy="0.48" r="0.78"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#120a05" stop-opacity="${s}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#v)"/></svg>`);
}

async function exportSet(name, buf, widths) {
  for (const w of widths) await sharp(buf).resize(w).webp({ quality: 80 }).toFile(`${OUT}${name}-${w}.webp`);
}

const scene = await buildScene();
const { width: W, height: H } = await sharp(scene).metadata();
/* the ledge top runs at ~73.6% of the photo's height */
const ledge = Math.round(H * 0.736);

/* desktop frame: wide crop with the ledge near the bottom */
const dTop = Math.round(H * 0.27), dH = Math.round(H * 0.565);
/* mobile frame: portrait crop around the bottle */
const mW = Math.round(H * 0.56), mLeft = Math.round(W * 0.535 - mW / 2), mTop = 0, mH = H;

await writeFile('src/js/data/hero.json', JSON.stringify({ products: [] }, null, 2));
const assets = JSON.parse(await readFile('supabase/seed/product-assets.json', 'utf8'));
const done = [];
for (const a of assets) {
  if (only && a.slug !== only) continue;
  const comp = await integrateBottle(scene, a.slug, { cx: W * 0.535, baseY: ledge, height: dH * 0.6 });
  const desktop = await sharp(comp).extract({ left: 0, top: dTop, width: W, height: dH }).composite([{ input: vignette(W, dH) }]).png().toBuffer();
  await exportSet(`hero-${a.slug}`, desktop, [1280, 1920, 2600]);
  const mobile = await sharp(comp).extract({ left: mLeft, top: mTop, width: mW, height: mH }).composite([{ input: vignette(mW, mH, 0.35) }]).png().toBuffer();
  await exportSet(`hero-m-${a.slug}`, mobile, [720, 1080]);
  done.push(a.slug);
  console.log('hero', a.slug);
}
await exportSet('hero-scene', await sharp(scene).extract({ left: 0, top: dTop, width: W, height: dH }).png().toBuffer(), [1280, 2600]);
await writeFile('src/js/data/hero.json', JSON.stringify({ products: done, widths: [1280, 1920, 2600], mobileWidths: [720, 1080], credit: 'Fabio Tura & 11th gate / Unsplash' }, null, 2) + '\n');
