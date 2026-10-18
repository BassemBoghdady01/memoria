/**
 * MEMÓRIA · Per-route SEO: description, canonical, Open Graph, JSON-LD.
 * The SPA updates these on every navigation; crawlers that run JS
 * (Google) read them, and index.html carries sensible defaults.
 */
const ORIGIN = (import.meta.env.VITE_SITE_URL || location.origin).replace(/\/$/, '');
const DEFAULT_DESC = 'MEMÓRIA — an Egyptian perfume house. Scents made to be remembered.';
const DEFAULT_IMG = '/products/liqaa/01-1600.webp';

function meta(attr, key, content) {
  let m = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!m) {
    m = document.createElement('meta');
    m.setAttribute(attr, key);
    document.head.appendChild(m);
  }
  m.setAttribute('content', content);
}

export function setSeo({ title, description, path = location.pathname, image, type = 'website', jsonLd = null, noindex = false } = {}) {
  const desc = (description || DEFAULT_DESC).slice(0, 300);
  const url = ORIGIN + path;
  const img = (image || DEFAULT_IMG).startsWith('http') ? image || DEFAULT_IMG : ORIGIN + (image || DEFAULT_IMG);
  if (title) document.title = title;
  meta('name', 'description', desc);
  meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  meta('property', 'og:title', title || document.title);
  meta('property', 'og:description', desc);
  meta('property', 'og:url', url);
  meta('property', 'og:image', img);
  meta('property', 'og:type', type);
  meta('property', 'og:site_name', 'MEMÓRIA');
  meta('name', 'twitter:card', 'summary_large_image');
  let canon = document.head.querySelector('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement('link');
    canon.rel = 'canonical';
    document.head.appendChild(canon);
  }
  canon.href = url;
  document.head.querySelectorAll('script[data-jsonld]').forEach((s) => s.remove());
  if (jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.jsonld = '';
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  }
}

export function productJsonLd(p, unitPrice) {
  const offers = p.variants
    .filter((v) => v.price !== null)
    .map((v) => ({
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: unitPrice(v),
      availability: v.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${ORIGIN}/product/${p.slug}`,
      name: v.label,
    }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    brand: { '@type': 'Brand', name: 'MEMÓRIA' },
    image: p.gallery.map((g) => ORIGIN + g.url),
    description: p.seoDescription || p.shortDescription || p.description || undefined,
    category: p.category?.name,
    ...(offers.length ? { offers } : {}),
  };
}
