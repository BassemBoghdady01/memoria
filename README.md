# MEMÓRIA — Every Scent Holds a Memory

Storefront and owner dashboard for the MEMÓRIA perfume house (Egypt).

```bash
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev                  # storefront http://localhost:5173, dashboard /admin
npm run build                # sitemap/robots + production build → dist/
npm run test:db              # 53 database/security checks on an in-process Postgres
```

Without Supabase variables the storefront runs in **preview mode**: the catalogue
comes from the seed files and checkout is disabled (WhatsApp ordering still works).

## Architecture

- **Storefront** (`index.html`, `src/js`): vanilla JS SPA on Vite. Loads the whole
  published catalogue from `storefront_catalog()` once, then routes client-side.
- **Dashboard** (`admin/index.html`, `src/admin`): separate bundle at `/admin`,
  Supabase Auth sign-in, every view lazy-loaded.
- **Database** (`supabase/migrations`): Postgres with RLS on every table.
  Customers can only call `storefront_catalog`, `quote_cart`, `place_order` and
  `get_order_confirmation`; prices, discounts, shipping and stock are decided in
  the database. Order items store price snapshots; status/payment history and an
  audit log are written by triggers.

## Product assets

`npm run import:products <folder>` turns the supplied photography (one folder per
scent, `MEMORIA_<SCENT>_<NN>_<View>.png`) into web sizes and transparent cut-outs
in `public/products/`, and writes `supabase/seed/product-assets.json`.
Product facts live in `supabase/seed/catalog.json`; `npm run seed:build` regenerates
the seed migration and lists anything missing. After launch, edit products in the
dashboard instead.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the readiness checklist, Supabase setup,
owner provisioning and Vercel steps. Nothing is deployed without the owner's approval.
