/**
 * MEMÓRIA brand asset pipeline.
 *
 * Source of truth: brand-src/memoria-logo.svg (supplied by the client).
 * The SVG embeds two rasters: a colour layer and a luminance mask.
 * This script composites them into transparent, trimmed, optimised logo
 * variants. The letterforms are never redrawn — only masked, trimmed,
 * resized and (for the dark-surface variant) tinted.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/brand';
await mkdir(OUT, { recursive: true });

const colorLayer = 'brand-src/logo-color.png'; // brown brush lettering on black
const maskLayer = 'brand-src/logo-mask.png';   // luminance mask (white = opaque)

// 1. Raw channels.
const { data: rgb, info } = await sharp(colorLayer)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// linear(1.45, -50) crushes noise in the mask's black background to full
// transparency while keeping brush edges soft.
const { data: alpha } = await sharp(maskLayer)
  .extractChannel('red')
  .linear(1.45, -50)
  .raw()
  .toBuffer({ resolveWithObject: true });

// 2. Interleave into RGBA.
const px = info.width * info.height;
const rgba = Buffer.alloc(px * 4);
for (let i = 0; i < px; i++) {
  rgba[i * 4] = rgb[i * 3];
  rgba[i * 4 + 1] = rgb[i * 3 + 1];
  rgba[i * 4 + 2] = rgb[i * 3 + 2];
  rgba[i * 4 + 3] = alpha[i];
}

const composited = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
const trimmed = await composited.trim({ threshold: 10 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();
console.log(`trimmed logo: ${meta.width}x${meta.height}, alpha: ${meta.hasAlpha}`);

// 3. Brown (primary) variants.
for (const w of [1400, 900, 560, 320]) {
  await sharp(trimmed).resize({ width: w }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-brown-${w}.png`);
  await sharp(trimmed).resize({ width: w }).webp({ quality: 88 }).toFile(`${OUT}/logo-brown-${w}.webp`);
}

// 4. Parchment-tinted variant for dark surfaces (same letterforms, tinted only).
//    Fill = Parchment Beige #E8DDC8 from the supplied palette.
const { data: trgba, info: tinfo } = await sharp(trimmed).raw().toBuffer({ resolveWithObject: true });
const cream = Buffer.from(trgba);
for (let i = 0; i < tinfo.width * tinfo.height; i++) {
  cream[i * 4] = 0xe8;
  cream[i * 4 + 1] = 0xdd;
  cream[i * 4 + 2] = 0xc8;
}
const creamImg = sharp(cream, { raw: { width: tinfo.width, height: tinfo.height, channels: 4 } });
const creamPng = await creamImg.png().toBuffer();
for (const w of [900, 560, 320]) {
  await sharp(creamPng).resize({ width: w }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-cream-${w}.png`);
  await sharp(creamPng).resize({ width: w }).webp({ quality: 88 }).toFile(`${OUT}/logo-cream-${w}.webp`);
}

console.log('brand assets written to', OUT);
