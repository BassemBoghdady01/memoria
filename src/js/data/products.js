/**
 * MEMÓRIA · Product catalogue — single source of truth.
 *
 * ⚠ PLACEHOLDER DATA — names, notes, prices, stories and stock are
 * placeholder creative content awaiting the client's real product
 * information. Replace values here; every page reads from this file.
 *
 * `bottle` is legacy config (the illustrated renderer is retired — bottles
 * are photoreal renders in public/renders, see renderSrc below).
 * `mist` colours the fragrance-visualisation layers.
 * `finder` tags feed the "Find Your Memory" quiz scoring.
 */

export const CURRENCY = 'EGP';

export const products = [
  {
    id: 'p01',
    motifs: ['balcony','city'], // archival artwork for memory scenes
    slug: 'jasmine-dusk',
    number: '01',
    name: 'Jasmine Dusk',
    gender: 'her', // 'her' | 'him'
    fragranceFamily: 'Floral Amber',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2150 },
      { ml: 100, price: 2950 },
    ],
    shortDescription:
      'Night-blooming jasmine over warm amber — the balcony rail at sunset, the city softening below.',
    description:
      'Jasmine Dusk opens like an early evening: orange blossom and a breath of bergamot, before night jasmine unfolds against skin-warm amber and musk. It is a scent that stays close, the way a remembered evening does.',
    topNotes: ['Bergamot', 'Orange Blossom'],
    heartNotes: ['Night Jasmine', 'Rose Petal'],
    baseNotes: ['Amber', 'Soft Musk'],
    smellsLike: ['Warm', 'Floral', 'Familiar'],
    memoryStory:
      'A balcony above a quiet street. Someone waters the jasmine climbing the rail, and for one hour the whole building smells of dusk. This perfume keeps that hour.',
    memoryPlace: 'A balcony at sunset',
    archiveYear: '2010', // PLACEHOLDER year
    featured: true,
    stock: true,
    relatedProducts: ['rose-vellum', 'sunday-linen'],
    finder: { mood: ['floral', 'warm'], time: ['night', 'special'] },
    mist: '#d8a97a',
    tint: '#F2E3C2', // card plate ground
    world: { color: '#B66A4B' }, // the scene you enter when you spray it
    ad: 'Smells like staying ten more minutes.',
    bottle: {
      shape: 'shoulder',
      glass: '#c8b490',
      liquidTop: '#d8a460',
      liquidBottom: '#a96b38',
      cap: 'square',
      capColor: '#3e281b',
      level: 0.74,
    },
    noteIcons: ['blossom', 'petal', 'amber'],
  },
  {
    id: 'p02',
    motifs: ['letter','postcard'], // archival artwork for memory scenes
    slug: 'rose-vellum',
    number: '02',
    name: 'Rose Vellum',
    gender: 'her',
    fragranceFamily: 'Rose Chypre',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2250 },
      { ml: 100, price: 3100 },
    ],
    shortDescription:
      'Dried rose pressed between old pages — powdery iris, cedar and a trace of vanilla ink.',
    description:
      'Rose Vellum is a letter kept too long to send. A dusty Damascena rose is folded into iris and soft paper accords, resting on cedar and a whisper of vanilla — quiet, literary, and impossible to forget.',
    topNotes: ['Pink Pepper', 'Violet Leaf'],
    heartNotes: ['Damascena Rose', 'Iris', 'Paper Accord'],
    baseNotes: ['Cedarwood', 'Vanilla'],
    smellsLike: ['Powdery', 'Tender', 'Kept'],
    memoryStory:
      'A drawer of letters tied with string. Each envelope opened once, read a hundred times. The rose pressed inside the first one never lost its colour.',
    memoryPlace: 'A drawer of letters',
    archiveYear: '2014', // PLACEHOLDER year
    featured: false,
    stock: true,
    relatedProducts: ['jasmine-dusk', 'oud-memoir'],
    finder: { mood: ['floral', 'soft'], time: ['day', 'everyday'] },
    mist: '#c98d76',
    tint: '#F0DDC9',
    world: { color: '#9A5240' },
    ad: 'Some letters are worn, not sent.',
    bottle: {
      shape: 'oval',
      glass: '#c9b195',
      liquidTop: '#c07d63',
      liquidBottom: '#96543f',
      cap: 'dome',
      capColor: '#8a6a48',
      level: 0.7,
    },
    noteIcons: ['rose', 'letter', 'wood'],
  },
  {
    id: 'p03',
    motifs: ['linenline','city'], // archival artwork for memory scenes
    slug: 'sunday-linen',
    number: '03',
    name: 'Sunday Linen',
    gender: 'her',
    fragranceFamily: 'Citrus Musk',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 1950 },
      { ml: 100, price: 2700 },
    ],
    shortDescription:
      'White cotton drying in morning sun — neroli, clean musk and a cool trace of blue air.',
    description:
      'Sunday Linen is the brightest hour of the week: sheets on the roof line, neroli in the breeze, everything washed and beginning again. Citrus lifts into orange blossom before settling on the cleanest musk.',
    topNotes: ['Bergamot', 'Petitgrain'],
    heartNotes: ['Neroli', 'Orange Blossom', 'Cotton Accord'],
    baseNotes: ['White Musk', 'Blond Woods'],
    smellsLike: ['Clean', 'Bright', 'New'],
    memoryStory:
      'Morning on the roof. Linen snapping softly in the wind, the sun still gentle, the whole day unspent. Some mornings deserve to be bottled.',
    memoryPlace: 'A rooftop at nine in the morning',
    archiveYear: '2018', // PLACEHOLDER year
    featured: false,
    stock: true,
    relatedProducts: ['jasmine-dusk', 'vetiver-arcade'],
    finder: { mood: ['fresh', 'soft'], time: ['day', 'everyday'] },
    mist: '#e3d3ae',
    tint: '#F3EAC9',
    world: { color: '#5E8289' },
    ad: 'The week can wait until Monday.',
    bottle: {
      shape: 'column',
      glass: '#cfc0a4',
      liquidTop: '#e0cd9f',
      liquidBottom: '#bfa269',
      cap: 'tall',
      capColor: '#b5b0a6',
      level: 0.78,
    },
    noteIcons: ['citrus', 'linen', 'musk'],
  },
  {
    id: 'p04',
    motifs: ['felucca','city'], // archival artwork for memory scenes
    slug: 'nile-cedar',
    number: '04',
    name: 'Nile Cedar',
    gender: 'him',
    fragranceFamily: 'Woody Aromatic',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2100 },
      { ml: 100, price: 2900 },
    ],
    shortDescription:
      'Cool cedar over green papyrus — a north wind moving slow across open water.',
    description:
      'Nile Cedar walks the corniche at dusk. Cypress and river air open onto a heart of papyrus and dry cedar, grounded in vetiver — composed, unhurried, certain of where it is going.',
    topNotes: ['Cypress', 'River Air Accord'],
    heartNotes: ['Papyrus', 'Atlas Cedar'],
    baseNotes: ['Vetiver', 'Dry Musk'],
    smellsLike: ['Cool', 'Steady', 'Open'],
    memoryStory:
      'The corniche after work, the water turning pewter, feluccas leaning into the last light. The wind carries green and wood and river — and for a while, nothing needs solving.',
    memoryPlace: 'The corniche at dusk',
    archiveYear: '2006', // PLACEHOLDER year
    featured: false,
    stock: true,
    relatedProducts: ['vetiver-arcade', 'oud-memoir'],
    finder: { mood: ['fresh', 'woody'], time: ['day', 'everyday'] },
    mist: '#7fa3a8',
    tint: '#E4D9BC',
    world: { color: '#2F6670' },
    ad: 'Smells familiar. Isn’t.',
    bottle: {
      shape: 'apothecary',
      glass: '#b7ab90',
      liquidTop: '#3d7d88',
      liquidBottom: '#24505a',
      cap: 'wood',
      capColor: '#5a3522',
      level: 0.72,
    },
    noteIcons: ['leaf', 'reed', 'wood'],
  },
  {
    id: 'p05',
    motifs: ['study','shelf'], // archival artwork for memory scenes
    slug: 'oud-memoir',
    number: '05',
    name: 'Oud Memoir',
    gender: 'him',
    fragranceFamily: 'Amber Oud',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2600 },
      { ml: 100, price: 3600 },
    ],
    shortDescription:
      'Old books, worn leather, a thread of incense — a study where time reads slowly.',
    description:
      'Oud Memoir is written in a low voice. Saffron and incense open the door; oud and amber fill the room like late afternoon light on leather bindings. It lingers the way good stories do.',
    topNotes: ['Saffron', 'Incense'],
    heartNotes: ['Oud', 'Dark Rose'],
    baseNotes: ['Amber', 'Leather', 'Sandalwood'],
    smellsLike: ['Deep', 'Quiet', 'Lasting'],
    memoryStory:
      'A study with shutters half-closed. Shelves of books read twice, a chair that keeps its shape, smoke from an incense coil drawing slow letters in the air.',
    memoryPlace: 'A study in late afternoon',
    archiveYear: '2022', // PLACEHOLDER year
    featured: false,
    stock: true,
    relatedProducts: ['nile-cedar', 'rose-vellum'],
    finder: { mood: ['warm', 'bold', 'woody'], time: ['night', 'special'] },
    mist: '#8c6a4f',
    tint: '#E6D2B4',
    world: { color: '#3E281B' },
    ad: 'Some memories fade. This one has excellent projection.',
    bottle: {
      shape: 'block',
      glass: '#a89478',
      liquidTop: '#6b4326',
      liquidBottom: '#31200f',
      cap: 'heavy',
      capColor: '#2c1c11',
      level: 0.8,
    },
    noteIcons: ['smoke', 'book', 'amber'],
  },
  {
    id: 'p06',
    motifs: ['arcade','city'], // archival artwork for memory scenes
    slug: 'vetiver-arcade',
    number: '06',
    name: 'Vetiver Arcade',
    gender: 'him',
    fragranceFamily: 'Green Woody',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2050 },
      { ml: 100, price: 2850 },
    ],
    shortDescription:
      'Bitter orange and cut green over cool stone — downtown arcades just after rain.',
    description:
      'Vetiver Arcade is the smell of shade in a bright city: bitter orange peel, crushed leaves, and rain drying on stone, drawn down into rooted vetiver and a curl of smoke.',
    topNotes: ['Bitter Orange', 'Green Leaves'],
    heartNotes: ['Wet Stone Accord', 'Geranium'],
    baseNotes: ['Vetiver', 'Oakmoss', 'Smoke'],
    smellsLike: ['Green', 'Cool', 'Sharp'],
    memoryStory:
      'Downtown after rain — arcades of cool stone, shopfronts breathing out coffee and cologne, the pavement giving back the morning storm. Ten minutes of a city smelling brand new.',
    memoryPlace: 'A downtown arcade after rain',
    archiveYear: '2026', // PLACEHOLDER year
    featured: false,
    stock: true,
    relatedProducts: ['nile-cedar', 'sunday-linen'],
    finder: { mood: ['fresh', 'bold'], time: ['day', 'everyday'] },
    mist: '#97957e',
    tint: '#E7E0C4',
    world: { color: '#6E6B52' },
    ad: 'Downtown after rain. Bottled before it dried.',
    bottle: {
      shape: 'slim',
      glass: '#b3a88c',
      liquidTop: '#8b8a63',
      liquidBottom: '#5c5b41',
      cap: 'brass',
      capColor: '#8a6a48',
      level: 0.76,
    },
    noteIcons: ['citrus', 'leaf', 'smoke'],
  },
];

/* ——— Selectors ——— */

export function getProduct(slug) {
  return products.find((p) => p.slug === slug) || null;
}

export function getByGender(gender) {
  if (!gender || gender === 'all') return products;
  return products.filter((p) => p.gender === gender);
}

export function getFeatured() {
  return products.find((p) => p.featured) || products[0];
}

export function getRelated(product, count = 2) {
  const rel = (product.relatedProducts || [])
    .map((slug) => getProduct(slug))
    .filter(Boolean);
  if (rel.length >= count) return rel.slice(0, count);
  const fill = products.filter((p) => p.slug !== product.slug && !rel.includes(p));
  return [...rel, ...fill].slice(0, count);
}

export function minPrice(product) {
  return Math.min(...product.sizes.map((s) => s.price));
}

export function genderLabel(g) {
  return g === 'her' ? 'For Her' : g === 'him' ? 'For Him' : 'For All';
}

/** Photoreal bottle render paths (public/renders, built by scripts/build-bottle-renders.mjs). */
export function renderSrc(p, w = 720) {
  const n = Number(p.number);
  return { webp: `/renders/no${n}-${w}.webp`, png: `/renders/no${n}-${w}.png` };
}

export function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products.filter((p) => {
    const hay = [
      p.name,
      `no ${p.number}`,
      `nº ${p.number}`,
      `n ${p.number}`,
      p.number,
      genderLabel(p.gender),
      p.gender === 'her' ? 'women woman her female' : 'men man him male',
      p.fragranceFamily,
      p.concentration,
      ...p.topNotes,
      ...p.heartNotes,
      ...p.baseNotes,
      p.shortDescription,
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
