/**
 * MEMÓRIA · Campaign photography manifest.
 * Licensed photographs processed by scripts/build-campaign.mjs into
 * public/campaign/ (credits kept with each image). Empty until supplied.
 */
import data from './campaign.json';
import { esc } from '../utils.js';

export const campaign = data;

/** Responsive <img> attributes for a manifest entry ({ src, srcset, width, height }). */
export function campaignImg(o, { sizes = '100vw' } = {}) {
  if (!o) return '';
  return [
    `src="${esc(o.src)}"`,
    o.srcset ? `srcset="${esc(o.srcset)}" sizes="${esc(o.sizes || sizes)}"` : '',
    o.width ? `width="${o.width}" height="${o.height}"` : '',
  ].join(' ');
}
