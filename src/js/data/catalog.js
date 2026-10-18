/**
 * MEMÓRIA · Catalogue store.
 *
 * Single runtime source of product data for every page. Filled once at
 * boot from the database (storefront_catalog) — nothing about a product
 * (name, price, notes, images) is hardcoded in components.
 */
import { backendConfigured, rpc } from './backend.js';

export const CURRENCY = 'EGP';

export const products = [];
export const categories = [];
export const governorates = [];
export const settings = {};
export const catalogState = { mode: backendConfigured ? 'live' : 'preview', loaded: false, error: null };

function normalise(raw) {
  const images = raw.images || [];
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category || null,
    shortDescription: raw.short_description || '',
    description: raw.description || '',
    notes: {
      top: raw.top_notes || [],
      heart: raw.heart_notes || [],
      base: raw.base_notes || [],
    },
    family: raw.fragrance_family || '',
    concentration: raw.concentration || '',
    story: raw.story || {},
    featured: Boolean(raw.featured),
    seoTitle: raw.seo_title || '',
    seoDescription: raw.seo_description || '',
    variants: (raw.variants || []).map((v) => ({
      id: v.id,
      label: v.label,
      sizeMl: v.size_ml,
      price: v.price === null || v.price === undefined ? null : Number(v.price),
      salePrice: v.sale_price === null || v.sale_price === undefined ? null : Number(v.sale_price),
      inStock: v.in_stock !== false,
      lowStock: Boolean(v.low_stock),
    })),
    gallery: images.filter((i) => i.kind !== 'cutout'),
    cutouts: images.filter((i) => i.kind === 'cutout'),
  };
}

/* Preview mode: build the same payload from the seed files the database is seeded from. */
async function previewPayload() {
  const [{ default: facts }, { default: assets }] = await Promise.all([
    import('../../../supabase/seed/catalog.json'),
    import('../../../supabase/seed/product-assets.json'),
  ]);
  const cats = facts.categories.map((c, i) => ({ id: `cat-${c.slug}`, slug: c.slug, name: c.name, sort: i }));
  const productsOut = assets
    .map((a, i) => {
      const f = facts.products.find((p) => p.slug === a.slug) || {};
      const cat = cats.find((c) => c.slug === f.category);
      return {
        id: `preview-${a.slug}`,
        slug: a.slug,
        name: f.name || a.name,
        category: cat ? { id: cat.id, slug: cat.slug, name: cat.name } : null,
        short_description: f.short_description,
        description: f.description,
        top_notes: f.top_notes,
        heart_notes: f.heart_notes,
        base_notes: f.base_notes,
        fragrance_family: f.fragrance_family,
        concentration: f.concentration,
        story: f.story,
        featured: f.featured,
        sort_order: f.sort_order ?? i,
        variants: (f.variants || []).map((v, j) => ({
          id: `preview-${a.slug}-${j}`,
          label: v.label || `${v.size_ml} ml`,
          size_ml: v.size_ml,
          price: v.price ?? null,
          sale_price: v.sale_price ?? null,
          in_stock: true,
        })),
        images: [
          ...a.images.map((im) => ({ url: im.src, srcset: im.srcset, alt: `${f.name || a.name} by MEMÓRIA, ${im.label.toLowerCase()} view`, view: im.label, kind: 'gallery' })),
          ...a.images.filter((im) => im.cutout).map((im) => ({ url: im.cutout, srcset: im.cutoutSrcset, alt: `${f.name || a.name} by MEMÓRIA`, view: im.label, kind: 'cutout' })),
        ],
      };
    })
    .sort((x, y) => x.sort_order - y.sort_order);
  const publicSettings = Object.fromEntries(
    Object.entries(facts.settings)
      .filter(([, s]) => s.public)
      .map(([k, s]) => [k, s.value])
  );
  return {
    categories: cats,
    products: productsOut,
    settings: publicSettings,
    governorates: facts.governorates.map(([en, ar], i) => ({ id: i + 1, name_en: en, name_ar: ar })),
  };
}

export async function loadCatalog() {
  try {
    const data = backendConfigured ? await rpc('storefront_catalog') : await previewPayload();
    products.splice(0, products.length, ...data.products.map(normalise));
    categories.splice(0, categories.length, ...data.categories);
    governorates.splice(0, governorates.length, ...data.governorates);
    Object.keys(settings).forEach((k) => delete settings[k]);
    Object.assign(settings, data.settings || {});
    catalogState.loaded = true;
  } catch (e) {
    catalogState.error = e;
    console.error('[MEMÓRIA] catalogue failed to load', e);
  }
  return catalogState;
}

/* ——— selectors ——— */

export function getProduct(slug) {
  return products.find((p) => p.slug === slug) || null;
}

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

export function getVariant(variantId) {
  for (const p of products) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
}

export function getByCategory(slug) {
  if (!slug || slug === 'all') return products;
  return products.filter((p) => p.category?.slug === slug);
}

export function usedCategories() {
  return categories.filter((c) => products.some((p) => p.category?.slug === c.slug));
}

export function getFeatured() {
  const slug = settings.home?.featured_slug;
  return getProduct(slug) || products.find((p) => p.featured) || products[0] || null;
}

export function getRelated(product, count = 3) {
  const same = products.filter((p) => p.slug !== product.slug && p.category?.slug && p.category?.slug === product.category?.slug);
  const rest = products.filter((p) => p.slug !== product.slug && !same.includes(p));
  return [...same, ...rest].slice(0, count);
}

/* ——— prices: always as published by the database ——— */

export const unitPrice = (v) => (v ? (v.salePrice ?? v.price) : null);

export function pricedVariants(p) {
  return p.variants.filter((v) => v.price !== null);
}

export function isPurchasable(p) {
  return pricedVariants(p).some((v) => v.inStock);
}

export function isSoldOut(p) {
  const priced = pricedVariants(p);
  return priced.length > 0 && priced.every((v) => !v.inStock);
}

export function defaultVariant(p) {
  const priced = pricedVariants(p);
  return priced.find((v) => v.inStock) || priced[0] || p.variants[0] || null;
}

export function fromPrice(p) {
  const prices = pricedVariants(p).map(unitPrice);
  return prices.length ? Math.min(...prices) : null;
}

/* ——— images: the supplied product photography only ——— */

export function primaryImage(p) {
  return p.gallery[0] || null;
}

export function cutoutImage(p, view = 'Front') {
  return p.cutouts.find((c) => c.view === view) || p.cutouts[0] || null;
}

export function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products.filter((p) => {
    const hay = [
      p.name,
      p.category?.name,
      p.family,
      p.concentration,
      p.shortDescription,
      ...p.notes.top,
      ...p.notes.heart,
      ...p.notes.base,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
