/**
 * MEMÓRIA · Product catalogue — single source of truth.
 *
 * Product system per the client's approved bottle sheet:
 * one silhouette, six fragrances, three collections —
 * BLACK (Nº 01–02) · NILE (Nº 03–04) · TERRACOTTA (Nº 05–06).
 * Names and notes follow the sheet. Prices remain provisional
 * until the client confirms final pricing.
 */

export const CURRENCY = 'EGP';

export const products = [
  {
    id: 'p01',
    slug: 'jasmine-dusk',
    memoryMoment: '6:43 PM. The balcony door is open. Someone downstairs is playing a song you know.',
    number: '01',
    name: 'Jasmine Dusk',
    gender: 'her', // 'her' | 'him'
    collection: 'black',
    accent: '#26201D',
    fragranceFamily: 'Floral Amber',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2150 },
      { ml: 100, price: 2950 },
    ],
    shortDescription:
      'Night-blooming jasmine over warm amber — the balcony rail at sunset, the city softening below.',
    description:
      'Jasmine Dusk opens like an early evening: bergamot and pear brightened with pink pepper, before jasmine and orange blossom unfold against skin-warm amber, vanilla and sandalwood. It stays close, the way a remembered evening does.',
    topNotes: ['Bergamot', 'Pear', 'Pink Pepper'],
    heartNotes: ['Jasmine', 'Orange Blossom', 'Neroli'],
    baseNotes: ['Amber', 'Vanilla', 'Musk', 'Sandalwood'],
    smellsLike: ['Warm', 'Floral', 'Familiar'],
    memoryStory:
      'A balcony above a quiet street. Someone waters the jasmine climbing the rail, and for one hour the whole building smells of dusk. This perfume keeps that hour.',
    memoryPlace: 'A balcony at sunset',
    featured: true,
    stock: true,
    relatedProducts: ['rose-vellum', 'sunday-linen'],
    finder: { mood: ['floral', 'warm'], time: ['night', 'special'] },
    mist: '#d8a97a',
    tint: '#EAE1C8', // card plate ground
    world: { color: '#2B211C' }, // the scene you enter when you spray it
    ad: 'Smells like staying ten more minutes.',
  },
  {
    id: 'p02',
    slug: 'rose-vellum',
    memoryMoment: 'A letter that still smells faintly of her drawer.',
    number: '02',
    name: 'Rose Vellum',
    gender: 'her',
    collection: 'black',
    accent: '#26201D',
    fragranceFamily: 'Rose Chypre',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2250 },
      { ml: 100, price: 3100 },
    ],
    shortDescription:
      'Dried rose pressed between old pages — litchi, peony and a trace of vanilla ink.',
    description:
      'Rose Vellum is a letter kept too long to send. Litchi and raspberry open the envelope; a dusty Damascena rose is folded into peony and magnolia, resting on patchouli, vanilla and a whisper of cashmeran — quiet, literary, impossible to forget.',
    topNotes: ['Litchi', 'Raspberry', 'Pink Pepper'],
    heartNotes: ['Damascena Rose', 'Peony', 'Magnolia'],
    baseNotes: ['Patchouli', 'Vanilla', 'Musk', 'Cashmeran'],
    smellsLike: ['Powdery', 'Tender', 'Kept'],
    memoryStory:
      'A drawer of letters tied with string. Each envelope opened once, read a hundred times. The rose pressed inside the first one never lost its colour.',
    memoryPlace: 'A drawer of letters',
    featured: false,
    stock: true,
    relatedProducts: ['jasmine-dusk', 'oud-mosaic'],
    finder: { mood: ['floral', 'soft'], time: ['day', 'everyday'] },
    mist: '#c98d76',
    tint: '#E9DCC6',
    world: { color: '#241B18' },
    ad: 'Some letters are worn, not sent.',
  },
  {
    id: 'p03',
    slug: 'sunday-linen',
    memoryMoment: 'Sunday morning. Fresh sheets. The curtains moving before the room gets warm.',
    number: '03',
    name: 'Sunday Linen',
    gender: 'her',
    collection: 'nile',
    accent: '#2F6670',
    fragranceFamily: 'Citrus Musk',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 1950 },
      { ml: 100, price: 2700 },
    ],
    shortDescription:
      'White cotton drying in morning sun — aldehydes, iris and the cleanest musk.',
    description:
      'Sunday Linen is the brightest hour of the week: aldehydes sparkling over citrus and green leaves, white flowers and iris pressed into a cotton accord, everything washed and beginning again on musk, sandalwood and white amber.',
    topNotes: ['Aldehydes', 'Citrus', 'Green Leaves'],
    heartNotes: ['White Flowers', 'Iris', 'Cotton Accord'],
    baseNotes: ['Musk', 'Sandalwood', 'White Amber'],
    smellsLike: ['Clean', 'Bright', 'New'],
    memoryStory:
      'Morning on the roof. Linen snapping softly in the wind, the sun still gentle, the whole day unspent. Some mornings deserve to be bottled.',
    memoryPlace: 'A rooftop at nine in the morning',
    featured: false,
    stock: true,
    relatedProducts: ['jasmine-dusk', 'midnight-fig'],
    finder: { mood: ['fresh', 'soft'], time: ['day', 'everyday'] },
    mist: '#dcdccc',
    tint: '#E6E5D9',
    world: { color: '#5E8289' },
    ad: 'The week can wait until Monday.',
  },
  {
    id: 'p04',
    slug: 'midnight-fig',
    memoryMoment: 'The drive home after everyone else had gone.',
    number: '04',
    name: 'Midnight Fig',
    gender: 'him',
    collection: 'nile',
    accent: '#2F6670',
    fragranceFamily: 'Green Woody',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2100 },
      { ml: 100, price: 2900 },
    ],
    shortDescription:
      'A fig tree after dark — green skin, black pepper, a cool garden breathing.',
    description:
      'Midnight Fig walks out late. Fig and black pepper open over bergamot; violet, cypress and cardamom cool the heart; vetiver, patchouli and amberwood keep it out until morning.',
    topNotes: ['Fig', 'Black Pepper', 'Bergamot'],
    heartNotes: ['Violet', 'Cypress', 'Cardamom'],
    baseNotes: ['Vetiver', 'Patchouli', 'Amberwood'],
    smellsLike: ['Green', 'Dark', 'Unhurried'],
    memoryStory:
      'The garden after everyone left. The fig tree still warm from the day, the air green and peppered, one light on in the kitchen. This perfume stays out a little longer.',
    memoryPlace: 'A garden after midnight',
    featured: false,
    stock: true,
    relatedProducts: ['ambered-wood', 'sunday-linen'],
    finder: { mood: ['fresh', 'woody'], time: ['night', 'everyday'] },
    mist: '#7fa3a8',
    tint: '#DFE3DC',
    world: { color: '#2F6670' },
    ad: 'Smells familiar. Isn’t.',
  },
  {
    id: 'p05',
    slug: 'ambered-wood',
    memoryMoment: 'The old cabinet your father never replaced.',
    number: '05',
    name: 'Ambered Wood',
    gender: 'him',
    collection: 'terracotta',
    accent: '#B66A4B',
    fragranceFamily: 'Amber Woody',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2600 },
      { ml: 100, price: 3600 },
    ],
    shortDescription:
      'Warm stone at sunset — saffron, cedar and amber holding the day’s heat.',
    description:
      'Ambered Wood is the wall that kept the sun. Saffron and nutmeg strike first over bergamot; cedarwood, labdanum and geranium hold the middle; amber, sandalwood and tonka bean carry the warmth long after dark.',
    topNotes: ['Saffron', 'Nutmeg', 'Bergamot'],
    heartNotes: ['Cedarwood', 'Labdanum', 'Geranium'],
    baseNotes: ['Amber', 'Sandalwood', 'Tonka Bean'],
    smellsLike: ['Warm', 'Deep', 'Golden'],
    memoryStory:
      'Cairo after six. Stone giving back the day’s sun, streets slowing down, everything the colour of tea. Lean here a minute — the wall remembers.',
    memoryPlace: 'A warm wall at sunset',
    featured: false,
    stock: true,
    relatedProducts: ['midnight-fig', 'oud-mosaic'],
    finder: { mood: ['warm', 'bold', 'woody'], time: ['night', 'special'] },
    mist: '#c08a4e',
    tint: '#EFDFC5',
    world: { color: '#B66A4B' },
    ad: 'Some memories fade. This one has excellent projection.',
  },
  {
    id: 'p06',
    slug: 'oud-mosaic',
    memoryMoment: 'A room you haven’t entered in years — somehow still remembered perfectly.',
    number: '06',
    name: 'Oud Mosaic',
    gender: 'him',
    collection: 'terracotta',
    accent: '#B66A4B',
    fragranceFamily: 'Oud Amber',
    concentration: 'Eau de Parfum',
    sizes: [
      { ml: 50, price: 2050 },
      { ml: 100, price: 2850 },
    ],
    shortDescription:
      'Dark wood and rose in old light — oud laid piece by piece, like tilework.',
    description:
      'Oud Mosaic is built, not blended. Oud and saffron set the pattern with a flash of raspberry; rose, leather and incense colour it in; oud returns with patchouli, amber and guaiac wood. It finishes the way old rooms do — patiently.',
    topNotes: ['Oud', 'Saffron', 'Raspberry'],
    heartNotes: ['Rose', 'Leather', 'Incense'],
    baseNotes: ['Oud', 'Patchouli', 'Amber', 'Guaiac Wood'],
    smellsLike: ['Rich', 'Smoky', 'Lasting'],
    memoryStory:
      'A high-ceilinged room, late. Light through a screen laying patterns over the floor, incense from somewhere, wood that has heard everything. Some rooms you wear.',
    memoryPlace: 'An old room, patterned with light',
    featured: false,
    stock: true,
    relatedProducts: ['ambered-wood', 'rose-vellum'],
    finder: { mood: ['bold', 'woody', 'warm'], time: ['night', 'special'] },
    mist: '#a06a48',
    tint: '#EAD5B9',
    world: { color: '#8A4430' },
    ad: 'The oldest scent in the room. On purpose.',
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

export function collectionLabel(p) {
  return { black: 'Black Collection', nile: 'Nile Collection', terracotta: 'Terracotta Collection' }[p.collection] || '';
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
      collectionLabel(p),
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
