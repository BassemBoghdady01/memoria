/**
 * MEMÓRIA · Official product asset import.
 *
 * Takes the supplied product-photography folder (one sub-folder per scent,
 * files named MEMORIA_<SCENT>_<NN>_<View>.png on a white studio ground) and
 * produces web-ready, never-redrawn derivatives:
 *
 *   public/products/<slug>/<nn>-<w>.webp      white-ground views (480/960/1600)
 *   public/products/<slug>/cutout-<nn>-<w>.webp  transparent cut-outs of the
 *                                             front + three-quarter views, for
 *                                             compositing (hero, campaign)
 *   supabase/seed/product-assets.json         manifest: scent → images
 *
 * The bottle pixels are only resized and keyed — silhouette, cap, glass
 * colour and printing are left exactly as supplied.
 *
 * Usage: node scripts/import-product-assets.mjs <path-to-unzipped-folder>
 */
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/import-product-assets.mjs <folder>');
  process.exit(1);
}

const OUT = 'public/products';
const WIDTHS = [480, 960, 1600];
const CUTOUT_VIEWS = ['01', '02', '03', '04'];
const CUTOUT_WIDTHS = [600, 1200];
const VIEW_LABELS = {
  '01': 'Front',
  '02': 'Three-quarter',
  '03': 'Side',
  '04': 'Opposite three-quarter',
  '05': 'Elevated',
};

/* Flood-fill the white studio ground from the image border. Only pixels
   connected to the edge are removed, so light printing on the bottle
   (the scent name, MEMORIA) is never keyed out. */
async function cutout(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = new Uint8Array(w * h);
  /* studio ground and its soft grey floor shadow: neutral (unsaturated)
     and reasonably light. The bottle is saturated amber, the cap near-black. */
  const isGround = (i) => {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    return min > 120 && max - min < 16;
  };
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !isGround(i)) continue;
    bg[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  /* bottle = opaque; ground = transparent, except that the grey floor
     shadow becomes a real (black, semi-transparent) contact shadow */
  const mask = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;
  const soft = await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.1)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const a = soft[i] / 255;
    const lum = (r + g + b) / 3;
    const shadowA = bg[i] ? Math.max(0, Math.min(1, (238 - lum) / 120)) * 0.85 : 0;
    const outA = a + shadowA * (1 - a);
    rgba[i * 4] = outA ? Math.round((r * a) / outA) : 0;
    rgba[i * 4 + 1] = outA ? Math.round((g * a) / outA) : 0;
    rgba[i * 4 + 2] = outA ? Math.round((b * a) / outA) : 0;
    rgba[i * 4 + 3] = Math.round(outA * 255);
    if (outA > 0.03) {
      const x = i % w, y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const pad = 4;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .png()
    .toBuffer();
}

const manifest = [];
const scents = (await readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

for (const scent of scents) {
  const slug = scent.toLowerCase();
  const dir = join(OUT, slug);
  await mkdir(dir, { recursive: true });
  const files = (await readdir(join(SRC, scent))).filter((f) => /\.png$/i.test(f)).sort();
  const images = [];
  for (const f of files) {
    const m = f.match(/_(\d\d)_([A-Za-z_]+)\.png$/i);
    if (!m) {
      console.warn('  skipped (unexpected name):', f);
      continue;
    }
    const nn = m[1];
    const path = join(SRC, scent, f);
    for (const wpx of WIDTHS) {
      await sharp(path).resize(wpx).webp({ quality: 84 }).toFile(join(dir, `${nn}-${wpx}.webp`));
    }
    const img = {
      view: nn,
      label: VIEW_LABELS[nn] || m[2].replace(/_/g, ' '),
      source: f,
      src: `/products/${slug}/${nn}-960.webp`,
      srcset: WIDTHS.map((wpx) => `/products/${slug}/${nn}-${wpx}.webp ${wpx}w`).join(', '),
    };
    if (CUTOUT_VIEWS.includes(nn)) {
      const cut = await cutout(path);
      for (const wpx of CUTOUT_WIDTHS) {
        await sharp(cut).resize(wpx).webp({ quality: 88, alphaQuality: 90 }).toFile(join(dir, `cutout-${nn}-${wpx}.webp`));
      }
      await sharp(cut).resize(1200).png({ compressionLevel: 9 }).toFile(join(dir, `cutout-${nn}-1200.png`));
      img.cutout = `/products/${slug}/cutout-${nn}-1200.webp`;
      img.cutoutSrcset = CUTOUT_WIDTHS.map((wpx) => `/products/${slug}/cutout-${nn}-${wpx}.webp ${wpx}w`).join(', ');
    }
    images.push(img);
  }
  manifest.push({ scent, slug, name: scent, images });
  console.log(`${scent}: ${images.length} views`);
}

await mkdir('supabase/seed', { recursive: true });
await writeFile('supabase/seed/product-assets.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${manifest.length} scents → ${OUT}/ and supabase/seed/product-assets.json`);
