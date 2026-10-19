# MEMÓRIA — production readiness & deployment

Status as of 19 Oct 2026: **live in production** at https://memoria-rose-beta.vercel.app (Vercel project `memoria`, approved by the owner on 19 Oct 2026). Database: Supabase project `smcprvnjxdkyqfldgyhf` (eu-central-1).

Remaining owner actions: create the owner login (Supabase → Authentication → Users → Add user, then grant admin access — section 3), switch off public sign-ups, set the Supabase Site URL to the live address, confirm cash on delivery, add delivery zones/fees, bottle size and stock levels, and connect a custom domain when ready (Vercel → Domains, then update VITE_SITE_URL).

## 1. Readiness checklist

| Area | State | What's needed |
|---|---|---|
| Git | Clean history; checkpoint tag `pre-production-build-2026-10-18` and branch `checkpoint/pre-production-build` | Push to a private GitHub repo for Vercel |
| Product imagery | 7 scents × 5 views imported from the supplied archive | Owner to confirm each bottle's printing matches the real packaging (the archive README says they are generated visualisations based on LIQAA photographs) |
| Product data | Names only | **Prices (EGP), sizes, gender category, notes, descriptions** for all 7 scents. Until then products show "Price on request" and can't be bought online |
| Database | Migrations in `supabase/migrations/`, 53 automated checks pass locally (`npm run test:db`) | Create the Supabase project, apply migrations, re-run checks against it |
| Admin auth | Sign-in only, `admin_profiles`-gated, RLS on every table | Provision the owner (section 3); disable public sign-ups in Supabase Auth |
| Checkout | Guest checkout; totals, discounts, shipping, stock computed in the database | Test a real order end-to-end on the live project |
| Payments | Only **Cash on delivery** is enabled in the seed. InstaPay is off. Card is locked off | Owner to confirm COD is offered; card needs a gateway merchant account (Paymob / Fawry / Kashier) and a server-side integration (not built) |
| Shipping | All 27 governorates seeded; **no zones or fees** (not invented) | Owner enters zones, fees, thresholds, delivery estimates in Dashboard → Shipping |
| WhatsApp | +20 150 000 7544 (temporary), editable in Dashboard → Store settings | Confirm the final number |
| Invoices | Branded sales invoice, sequential numbering, PDF + print | Company legal details; tax fields stay empty until verified. Not an ETA e-invoice |
| Email | **Not implemented** (no transactional email provider) | Decide whether order emails are needed; would require Resend/Postmark + an Edge Function |
| Hero photography | Layout ready for a licensed campaign photo; current hero uses the real bottle on a dark studio ground | Approve licensed photos, or supply a campaign shoot |
| Brand story | Empty (no invented history) | Owner writes it in Dashboard → Website content |
| SEO | Per-page titles/descriptions, canonical, Open Graph, Product JSON-LD, sitemap, robots | Set `VITE_SITE_URL` to the real domain |
| Domain | — | Point DNS to Vercel |

## 2. Supabase setup

1. Create a project (region close to Egypt, e.g. `eu-central-1`).
2. Apply the migrations in order (Supabase CLI: `supabase link` then `supabase db push`, or paste each file from `supabase/migrations/` into the SQL editor in filename order).
3. **Authentication → Providers → Email**: keep email/password; **turn off "Allow new users to sign up"**.
4. **Authentication → URL configuration**: set Site URL to the production domain; add `https://<domain>/admin`.
5. Run `get_advisors` / Database → Advisors and resolve any security warnings.

## 3. Provisioning the owner account (no public sign-up)

1. Supabase → Authentication → Users → **Invite user** (owner's email). They set a password from the email link.
2. In the SQL editor:
   ```sql
   insert into public.admin_profiles (user_id, full_name, role)
   select id, 'Owner name', 'owner' from auth.users where email = 'owner@example.com';
   ```
3. Further staff: invite the same way, then `role = 'admin'` (or `'staff'`). The owner can deactivate team members in SQL (`update admin_profiles set active = false …`).

## 4. Vercel deployment (after approval)

1. Import the GitHub repo in Vercel. Framework preset: **Vite**. `vercel.json` already sets the build, rewrites (storefront SPA + `/admin`), security headers and caching.
2. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL` — project URL
   - `VITE_SUPABASE_ANON_KEY` — anon/publishable key (safe in the browser; RLS protects data)
   - `VITE_SITE_URL` — e.g. `https://memoria.example`
   - **Never** add the service-role key or any payment secret as a `VITE_` variable.
3. Deploy a **Preview** first and run the QA list below against it; promote to Production only after sign-off.
4. Add the domain in Vercel → Domains and update DNS.

## 5. Pre-launch QA (run against the live database)

- [ ] `npm run test:db` passes; repeat the anon/non-admin checks against the live project
- [ ] Owner signs in at `/admin`; a non-admin account is refused
- [ ] Edit a price in the dashboard → storefront shows it after reload
- [ ] Place a COD order; it appears in Orders as Pending/Unpaid; stock decreases
- [ ] Apply a valid code, an expired code, a code below its minimum
- [ ] Change status to Cancelled → stock returns
- [ ] Record a payment → order shows Paid → revenue appears on Overview
- [ ] Generate, print and download an invoice
- [ ] WhatsApp buttons open the configured number with the right message
- [ ] Mobile: hero, product page sticky bar, checkout, floating WhatsApp button clear of controls
- [ ] Lighthouse on mobile: performance, accessibility, SEO

## 6. Not built yet (decisions needed)

- Online card payments (needs merchant account + server integration with webhooks)
- Transactional email/SMS
- Customer accounts (guest checkout only, as requested)
- Arabic storefront translation
