/**
 * MEMÓRIA · Scene photography for the gallery, the Memory Spray and the
 * heritage section — licensed Unsplash photos (credits in
 * brand-src/photography/CREDITS.json) graded into one warm world.
 * Writes public/campaign/scene-<id>-<w>.webp and src/js/data/scenes.json.
 *
 * Usage: node scripts/build-scenes.mjs
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const P = 'brand-src/photography/';
const OUT = 'public/campaign/';
const credits = JSON.parse(await readFile(P + 'CREDITS.json', 'utf8'));
const who = (f) => credits.find((c) => c.file === f)?.photographer || '';

/* id, file, crop (fractions), widths, grade */
const SCENES = [
  ['nile-dusk', 'felucca.jpg', null, 'warm'],
  ['curtain', 'curtain.jpg', [0, 0.12, 1, 0.66], 'warm'],
  ['city-window', 'citywindow.jpg', null, 'warm'],
  ['vanity', 'vanity.jpg', [0, 0.18, 1, 0.5], 'warm'],
  ['open-window', 'bigwindow.jpg', null, 'soft'],
  ['radio', 'radio.jpg', null, 'warm'],
  ['cairo-sunset', 'cairosunset.jpg', null, 'warm'],
  ['armchair', 'armchair.jpg', null, 'warm'],
  ['arcade', 'arcade.jpg', null, 'warm'],
  ['attic', 'attic.jpg', [0, 0.3, 1, 0.42], 'warm'],
  ['heritage-line', 'perfumeline.jpg', null, 'amber'],
  ['heritage-lab', 'labglass.jpg', null, 'amber'],
  ['heritage-apothecary', 'apothecary.jpg', null, 'sepia'],
  ['heritage-drawers', 'drawers.jpg', null, 'amber'],
];

async function grade(buf, kind) {
  let img = sharp(buf);
  if (kind === 'warm') img = img.recomb([[1.08, 0.06, 0], [0.02, 0.98, 0], [0, 0.03, 0.84]]).modulate({ saturation: 0.88 }).linear(1.05, -4);
  if (kind === 'soft') img = img.recomb([[1.06, 0.06, 0], [0.02, 0.98, 0], [0, 0.04, 0.86]]).modulate({ saturation: 0.8, brightness: 1.02 });
  if (kind === 'amber') img = img.recomb([[1.06, 0.04, 0], [0.02, 0.97, 0], [0, 0.02, 0.88]]).modulate({ saturation: 0.92 }).linear(1.08, -8);
  if (kind === 'sepia') img = img.modulate({ saturation: 0.35 }).recomb([[1.1, 0.08, 0], [0.03, 0.98, 0], [0, 0.02, 0.78]]).linear(1.06, -6);
  return img.toBuffer();
}

const out = {};
for (const [id, file, crop, kind] of SCENES) {
  let img = sharp(P + file);
  const m = await img.metadata();
  if (crop) img = sharp(P + file).extract({ left: Math.round(crop[0] * m.width), top: Math.round(crop[1] * m.height), width: Math.round(crop[2] * m.width), height: Math.round(crop[3] * m.height) });
  const g = await grade(await img.toBuffer(), kind);
  const widths = [800, 1600];
  for (const w of widths) await sharp(g).resize(w).webp({ quality: 76 }).toFile(`${OUT}scene-${id}-${w}.webp`);
  const gm = await sharp(g).metadata();
  out[id] = {
    src: `/campaign/scene-${id}-1600.webp`,
    srcset: widths.map((w) => `/campaign/scene-${id}-${w}.webp ${w}w`).join(', '),
    width: 1600,
    height: Math.round((gm.height * 1600) / gm.width),
    credit: `${who(file)} / Unsplash`,
  };
  console.log('scene', id);
}
await writeFile('src/js/data/scenes.json', JSON.stringify(out, null, 2) + '\n');
