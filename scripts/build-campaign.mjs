/**
 * MEMÓRIA · Campaign imagery from licensed photography.
 *
 * Composites the hero and featured scenes from the Unsplash photographs in
 * brand-src/photography (credits in CREDITS.json) with one shared warm
 * colour grade, and exports responsive WebP sets to public/campaign/ plus
 * src/js/data/campaign.json. The perfume bottle is NOT baked in: the real
 * product cut-out is layered in the page, so it can be swapped from the
 * dashboard without rebuilding the scene.
 *
 * Usage: node scripts/build-campaign.mjs
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SRC = 'brand-src/photography/';
const OUT = 'public/campaign/';
await mkdir(OUT, { recursive: true });
const credits = JSON.parse(await readFile(SRC + 'CREDITS.json', 'utf8'));
const credit = (file) => credits.find((c) => c.file === file)?.photographer;

/* one grade for the whole world: warm, slightly lifted blacks, honey highlights */
async function grade(buf, { warmth = 1, contrast = 1.08, bright = 1 } = {}) {
  return sharp(buf)
    .modulate({ brightness: bright, saturation: 0.86 })
    .recomb([
      [1.06 * warmth, 0.04, 0],
      [0.02, 0.98, 0.0],
      [0, 0.02, 0.84 / warmth],
    ])
    .linear(contrast, -(128 * contrast) + 128 + 4)
    .toBuffer();
}

function vignette(w, h, strength = 0.55) {
  return Buffer.from(`<svg width="${w}" height="${h}"><defs><radialGradient id="v" cx="0.5" cy="0.45" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140c06" stop-opacity="${strength}"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#v)"/></svg>`);
}

/* alpha ramps built as raw pixels (reliable across sharp/libvips versions) */
function ramp(w, h, fn) {
  const a = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = Math.round(255 * Math.max(0, Math.min(1, fn(x, y))));
  return a;
}
async function withAlpha(buf, w, h, fn) {
  const rgb = await sharp(buf).resize(w, h).removeAlpha().raw().toBuffer();
  const a = ramp(w, h, fn);
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = a[i]; }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}
const smooth = (t) => t * t * (3 - 2 * t);

async function exportSet(name, buf, widths, quality = 80) {
  const meta = await sharp(buf).metadata();
  for (const w of widths) await sharp(buf).resize(w).webp({ quality }).toFile(`${OUT}${name}-${w}.webp`);
  const top = widths[widths.length - 1];
  return {
    src: `/campaign/${name}-${widths[Math.min(1, widths.length - 1)]}.webp`,
    srcset: widths.map((w) => `/campaign/${name}-${w}.webp ${w}w`).join(', '),
    width: top,
    height: Math.round((meta.height * top) / meta.width),
  };
}

/* ——— HERO (desktop 2400×1150): leaf-shadow wall on the left, the radio on its table at right ——— */
async function heroDesktop() {
  const W = 2400, H = 1150;
  /* the sunlit leaf-shadow wall (below the photo's own top edge), softened by a warm haze */
  const wall = await sharp(SRC + 'leaves.jpg').extract({ left: 0, top: 260, width: 2600, height: 1690 }).resize(W, H, { fit: 'cover', position: 'top' }).toBuffer();
  const haze = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#e9cfa6" opacity="0.32"/></svg>`);
  const wallSoft = await sharp(wall).composite([{ input: haze, blend: 'screen' }]).toBuffer();
  const wallG = await grade(wallSoft, { bright: 1.06, contrast: 0.94 });

  /* the radio on its table, running off the right edge like a campaign crop */
  const rH = 1040;
  const rW = Math.round((rH * 2600) / 1733);
  const cropL = 0;
  const cropR = Math.round(rW * 0.06);
  const radio = await sharp(SRC + 'radio.jpg').resize(rW, rH).extract({ left: cropL, top: 0, width: rW - cropL - cropR, height: rH }).toBuffer();
  const rw = (await sharp(radio).metadata()).width;
  const radioA = await withAlpha(await grade(radio, { bright: 1.12, contrast: 1.04 }), rw, rH, (x, y) => smooth(Math.min(1, x / 420)) * smooth(Math.min(1, y / 120)));

  /* carry the same tabletop across the frame: the wood front of the radio's own table, stretched */
  const tH = 150;
  const wood = await sharp(SRC + 'radio.jpg').extract({ left: 1700, top: 1560, width: 860, height: 170 }).resize(W, tH, { fit: 'fill' }).toBuffer();
  const woodA = await withAlpha(await grade(wood, { bright: 0.92 }), W, tH, (x, y) => smooth(Math.min(1, y / 26)));
  return sharp(wallG)
    .composite([
      { input: woodA, left: 0, top: H - tH },
      { input: radioA, left: W - rw, top: H - rH },
    ])
    .toBuffer()
    .then(async (base) => {
      /* the same leaf shadows fall across the radio side too, so it reads as one room */
      const shade = await sharp(wallG).modulate({ brightness: 1.35 }).toBuffer();
      const shadeA = await withAlpha(shade, W, H, (x, y) => 0.42 * smooth(Math.max(0, Math.min(1, (x - 800) / 600))) * (1 - smooth(Math.max(0, Math.min(1, (y - 700) / 300)))));
      return sharp(base)
        .composite([{ input: shadeA, blend: 'multiply' }, { input: vignette(W, H, 0.5), left: 0, top: 0 }])
        .jpeg({ quality: 92 })
        .toBuffer();
    });
}

/* ——— HERO (mobile 1200×1700): radio and table across the lower half, wall light above ——— */
async function heroMobile() {
  const W = 1200, H = 1700;
  const wall = await grade(await sharp(SRC + 'leaves.jpg').extract({ left: 300, top: 0, width: 1300, height: 1950 }).resize(W, H, { fit: 'cover' }).toBuffer(), { bright: 1.28, contrast: 0.98 });
  const rH = 820;
  const rW = Math.round((rH * 2600) / 1733);
  const radio = await sharp(SRC + 'radio.jpg').resize(rW, rH).extract({ left: rW - W, top: 0, width: W, height: rH }).toBuffer();
  const radioA = await withAlpha(await grade(radio, { bright: 1.0 }), W, rH, (x, y) => smooth(Math.min(1, y / 220)) * smooth(Math.min(1, x / 260)));
  return sharp(wall).composite([{ input: radioA, left: 0, top: H - rH }, { input: vignette(W, H, 0.45), left: 0, top: 0 }]).jpeg({ quality: 92 }).toBuffer();
}

/* ——— FEATURED SCENE: the attic window, curtains and table, landscape crop ——— */
async function featured() {
  const crop = await sharp(SRC + 'attic.jpg').extract({ left: 0, top: 1350, width: 2600, height: 1500 }).toBuffer();
  const g = await grade(crop, { bright: 1.06, warmth: 1.04 });
  return sharp(g).composite([{ input: vignette(2600, 1500, 0.45), left: 0, top: 0 }]).jpeg({ quality: 92 }).toBuffer();
}

/* ——— paper, props ——— */
async function paperTile() {
  return grade(await sharp(SRC + 'parchment.jpg').resize(1600, 1600, { fit: 'cover' }).toBuffer(), { bright: 1.02, contrast: 0.98 });
}
async function prop(file, region, out = 1400) {
  const b = await sharp(SRC + file).extract(region).resize(out).toBuffer();
  return grade(b, { bright: 1.02 });
}

const manifest = {
  hero: { ...(await exportSet('hero', await heroDesktop(), [1200, 1800, 2400], 78)), credit: `${credit('leaves.jpg')} & ${credit('radio.jpg')} / Unsplash` },
  heroMobile: { ...(await exportSet('hero-mobile', await heroMobile(), [800, 1200], 78)) },
  featured: { ...(await exportSet('featured', await featured(), [900, 1500, 2200], 78)), credit: `${credit('attic.jpg')} / Unsplash` },
  paper: (await exportSet('paper', await paperTile(), [800, 1600], 72)),
  objects: [
    { id: 'dial', ...(await exportSet('obj-dial', await prop('dial.jpg', { left: 0, top: 0, width: 2600, height: 1733 }), [700, 1400])), alt: 'Close-up of an old radio tuning dial', caption: 'The station you always came back to.', credit: credit('dial.jpg'), interactive: true },
    { id: 'letters', ...(await exportSet('obj-letters', await prop('letters.jpg', { left: 0, top: 0, width: 2600, height: 1733 }), [700, 1400])), alt: 'Old handwritten letters in faded ink', caption: 'Letters kept long after they were answered.', credit: credit('letters.jpg') },
    { id: 'cassette', ...(await exportSet('obj-cassette', await prop('cassette.jpg', { left: 0, top: 0, width: 2600, height: 1733 }), [700, 1400])), alt: 'An audio cassette on dark wood', caption: 'A tape, rewound with a pencil.', credit: credit('cassette.jpg') },
    { id: 'photos', ...(await exportSet('obj-photos', await prop('photos.jpg', { left: 0, top: 0, width: 2600, height: 1950 }), [700, 1400])), alt: 'Old family photographs on a wooden table', caption: 'Faces from a summer you can still smell.', credit: credit('photos.jpg') },
    { id: 'keys', ...(await exportSet('obj-keys', await prop('keys.jpg', { left: 0, top: 900, width: 2600, height: 1950 }), [700, 1400])), alt: 'Old brass keys', caption: 'Keys to a house that isn’t there anymore.', credit: credit('keys.jpg') },
  ],
  props: {
    letters: (await exportSet('prop-letters', await prop('letters.jpg', { left: 1300, top: 300, width: 1300, height: 1300 }, 900), [450, 900])),
    photos: (await exportSet('prop-photos', await prop('photos.jpg', { left: 700, top: 300, width: 1300, height: 1500 }, 900), [450, 900])),
    envelopes: (await exportSet('prop-envelopes', await prop('envelopes.jpg', { left: 200, top: 100, width: 1700, height: 1500 }, 900), [450, 900])),
  },
  credits: credits.map((c) => ({ photographer: c.photographer, page: c.page })),
};

await writeFile('src/js/data/campaign.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('campaign images →', OUT);
