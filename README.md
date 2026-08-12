# MEMÓRIA — Every Scent Holds a Memory

Premium e-commerce website for the MEMÓRIA perfume house.
**Rooted in memory. Inspired by Cairo. Made to be remembered.**

Modern shopping. Old memories. — the visual experience is nostalgic and archival;
the shopping experience is fast, clear and conventional.

## Run it

```bash
npm install
npm run dev        # development — http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build — http://localhost:4173
npm run assets     # rebuild optimised logo variants from brand-src/
```

## What's inside

| Route | Page |
|---|---|
| `/` | Homepage — cinematic hero, collection with filters, zoom-to-scent scroll scene, memory chapter, pinned six-scent showcase, archive teaser, finder band, values |
| `/shop` `/women` `/men` | The collection with gender filters |
| `/product/:slug` | Product page — gallery, notes, sizes, buy box, memory story, "smells like", related; sticky Add-to-Bag bar on mobile |
| `/our-story` | Editorial house story (placeholder copy, clearly marked) |
| `/archive` | 20-year timeline of paper artifacts with lightbox (placeholder years) |
| `/cart` `/checkout` | Bag page and demo checkout with validation + order confirmation |
| `/search` | Full search page (also: search overlay everywhere, Ctrl/Cmd-K) |
| `/account` | Stub — "accounts opening soon" |

Plus: slide-out cart drawer, "Find Your Memory" 3-question perfume finder,
mobile navigation drawer, toast feedback.

## Brand assets

- `brand-src/` — the **original supplied assets, untouched**: logo SVG (raster
  brush lettering + luminance mask) and the official colour-palette sheet.
- `scripts/build-brand-assets.mjs` composites the logo's colour layer with its
  mask into trimmed transparent PNG/WebP variants in `public/brand/`
  (brown for light surfaces, parchment-tinted for dark — same letterforms, never redrawn).
- The palette in `src/styles/tokens.css` uses the sheet's exact hex values.

## Architecture

Vanilla-JS SPA on Vite. No framework lock-in; a real commerce backend can slot
into the cart store and checkout without touching the UI.

```
src/js/
  main.js            bootstrap (fonts, chrome, routes)
  router.js          History-API router, page modules, active-nav state
  motion.js          GSAP + ScrollTrigger + Lenis, reveal system,
                     tilt/float/sweep/mist helpers, per-page cleanup registry
  utils.js           DOM/format/a11y helpers (focus trap, scroll lock, toast)
  store/cart.js      localStorage cart — add/setQty/remove/clear/subscribe
  data/products.js   ★ single source of truth for all six perfumes
  data/archive.js    ★ timeline eras (ALL placeholder-marked)
  components/        bottle renderer, artwork motifs, icons, chrome (header/
                     footer/ribbon/mobile nav), cart drawer, search overlay,
                     product card, finder
  pages/             home, shop, product, story, archive, cart, checkout, misc
src/styles/          tokens → base → components → home → pages
```

### Bottles & artwork
No product photography was supplied, so each perfume is a layered SVG
illustration (glass, liquid, printed label, cap, animated light sweep) —
six distinct silhouettes driven from `products.js`. Archive imagery is a
duotone line-art motif library (`components/artwork.js`) — evocative paper
artifacts, never fake photographs.

### Motion
- Hero: slow push-in, pointer parallax, floating bottle, drifting mist
- Cards: pointer-follow 2.5D tilt + periodic light sweep
- Signature scene: pinned zoom-to-bottle; copy fades, mist blooms, a memory
  (polaroids) emerges behind the fragrance
- Six-scent showcase: pinned sequence on desktop, snap carousel on mobile
- Everything honours `prefers-reduced-motion` with complete static fallbacks

## Placeholders awaiting real business data

Search the codebase for `PLACEHOLDER`:
- product names, notes, stories, prices (`data/products.js`)
- archive years/eras (`data/archive.js`)
- "Est. twenty years ago*" markers on the story page
- checkout is a demo — no payment processed, integration point marked

No fabricated founders, awards, dates or claims anywhere.

## QA scripts (dev-only)

```bash
node scripts/qa-screens.mjs      # screenshot all routes × 3 viewports → qa/
node scripts/qa-scroll.mjs / desktop 16   # scroll-through capture
node scripts/qa-flows.mjs        # end-to-end funnel: shop → product → drawer
                                 # → checkout → confirmation, search, finder,
                                 # lightbox, mobile nav + sticky bar
```
