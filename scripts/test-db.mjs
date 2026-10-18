/**
 * MEMÓRIA · Database test suite.
 *
 * Runs every migration in supabase/migrations against an in-process
 * Postgres (PGlite) with minimal stand-ins for Supabase's auth and storage
 * schemas, then exercises the security model and commerce rules as the
 * three kinds of caller: anonymous shopper, signed-in non-admin, admin.
 *
 * Usage: node scripts/test-db.mjs
 */
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { readdir, readFile } from 'node:fs/promises';

const db = new PGlite({ extensions: { citext } });
let pass = 0;
let fail = 0;
const ok = (cond, label) => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
};
const rows = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await rows(sql, params))[0];
async function throws(sql, params) {
  try {
    await db.query(sql, params);
    return false;
  } catch {
    return true;
  }
}

/* — Supabase stand-ins — */
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);

const files = (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  try {
    await db.exec(await readFile(`supabase/migrations/${f}`, 'utf8'));
    ok(true, `migration ${f}`);
  } catch (e) {
    ok(false, `migration ${f}: ${e.message}`);
    process.exit(1);
  }
}
await db.exec(`grant select, insert, update, delete on storage.objects to authenticated;`);

const ADMIN = '00000000-0000-0000-0000-00000000a001';
const SHOPPER = '00000000-0000-0000-0000-00000000b001';
const asSuper = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
const asAnon = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
const asUser = (id) => db.exec(`reset role; select set_config('request.jwt.claim.sub', '${id}', false); set role authenticated;`);

/* — fixtures (as the database owner, i.e. what the owner would do in the dashboard) — */
await asSuper();
await db.exec(`
  insert into auth.users values ('${ADMIN}', 'owner@example.test'), ('${SHOPPER}', 'someone@example.test');
  insert into admin_profiles (user_id, full_name, role) values ('${ADMIN}', 'Test Owner', 'owner');
  insert into product_variants (product_id, sku, label, size_ml, price, sale_price)
    select id, 'TEST-LIQAA-100', '100 ml', 100, 1000, null from products where slug = 'liqaa';
  insert into product_variants (product_id, sku, label, size_ml, price, sale_price)
    select id, 'TEST-WAAD-100', '100 ml', 100, 800, 700 from products where slug = 'waad';
  update inventory set quantity = 5 where variant_id = (select id from product_variants where sku = 'TEST-LIQAA-100');
  update inventory set quantity = 1 where variant_id = (select id from product_variants where sku = 'TEST-WAAD-100');
  insert into shipping_zones (name, fee, free_shipping_threshold, estimated_delivery) values ('Greater Cairo', 60, 3000, '2-3 days');
  update governorates set zone_id = (select id from shipping_zones limit 1) where name_en in ('Cairo', 'Giza');
  insert into discounts (code, name, kind, value, active, usage_limit, per_customer_limit)
    values ('TEST10', 'Test ten percent', 'percentage', 10, true, 2, 1);
  insert into discounts (code, name, kind, value, active, min_order_amount)
    values ('BIGONLY', 'Fixed 100 over 5000', 'fixed', 100, true, 5000);
  insert into discounts (code, name, kind, value, active) values ('OFFCODE', 'Inactive', 'fixed', 50, false);
`);
const liqaa = (await one(`select id from product_variants where sku = 'TEST-LIQAA-100'`)).id;
const waad = (await one(`select id from product_variants where sku = 'TEST-WAAD-100'`)).id;
const cairo = (await one(`select id from governorates where name_en = 'Cairo'`)).id;
const aswan = (await one(`select id from governorates where name_en = 'Aswan'`)).id;

console.log('\nAnonymous shopper');
await asAnon();
const cat = (await one(`select storefront_catalog() as c`)).c;
ok(cat.products.length === 7, `catalogue lists the 7 supplied scents (${cat.products.map((p) => p.name).join(', ')})`);
ok(cat.products.every((p) => p.images.length >= 5), 'every scent has its official images');
ok(cat.settings.whatsapp?.number === '201500007544', 'public settings include the WhatsApp number');
ok(!('company' in cat.settings) && !('invoice' in cat.settings), 'private settings are not exposed');
ok(JSON.stringify(cat).indexOf('"quantity"') === -1, 'stock counts are not exposed, only availability');
ok((await rows(`select * from orders`)).length === 0, 'cannot read orders');
ok((await rows(`select * from customers`)).length === 0, 'cannot read customers');
ok((await rows(`select * from discounts`)).length === 0, 'cannot read discount codes');
ok(await throws(`update product_variants set price = 1 where id = $1`, [liqaa]), 'cannot change a price');
ok(await throws(`insert into orders (customer_name, phone, address_line, subtotal, total, payment_method) values ('x','201000000000','addr',0,0,'cod')`), 'cannot insert an order directly');
ok(await throws(`select admin_dashboard(now() - interval '1 day', now())`), 'cannot call admin dashboard');
ok(await throws(`select _price_cart('[]'::jsonb, null, null, null)`), 'cannot call the internal pricing function');

const items = (arr) => JSON.stringify(arr);
let q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: liqaa, quantity: 2, price: 1 }]), cairo])).q;
ok(q.ok && Number(q.subtotal) === 2000, 'quote ignores a client-sent price (subtotal 2000)');
ok(Number(q.shipping_fee) === 60 && Number(q.total) === 2060, 'shipping fee comes from the zone (60)');
q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: liqaa, quantity: 3 }]), cairo])).q;
ok(Number(q.shipping_fee) === 0, 'free shipping over the zone threshold');
q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: liqaa, quantity: 1 }]), aswan])).q;
ok(q.shipping_to_confirm === true && Number(q.shipping_fee) === 0, 'unconfigured governorate → fee "to be confirmed", not invented');
q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: waad, quantity: 1 }]), cairo])).q;
ok(Number(q.subtotal) === 700, 'sale price applies (700)');
q = (await one(`select quote_cart($1::jsonb, 'test10', $2) as q`, [items([{ variant_id: liqaa, quantity: 1 }]), cairo])).q;
ok(Number(q.discount_total) === 100 && Number(q.total) === 960, 'coupon is case-insensitive and computed server-side');
q = (await one(`select quote_cart($1::jsonb, 'BIGONLY', $2) as q`, [items([{ variant_id: liqaa, quantity: 1 }]), cairo])).q;
ok(q.discount === null && /minimum/.test(q.discount_error), 'minimum-order rule enforced');
q = (await one(`select quote_cart($1::jsonb, 'OFFCODE', $2) as q`, [items([{ variant_id: liqaa, quantity: 1 }]), cairo])).q;
ok(q.discount === null && q.discount_error, 'inactive code rejected');
q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: waad, quantity: 2 }]), cairo])).q;
ok(!q.ok && /Only 1 left/.test(q.errors[0]), 'cannot order more than stock');
q = (await one(`select quote_cart($1::jsonb, null, $2) as q`, [items([{ variant_id: liqaa, quantity: 50 }]), cairo])).q;
ok(!q.ok, 'absurd quantity rejected');

const order = (extra = {}) => ({
  full_name: 'Test Customer',
  phone: '0100 123 4567',
  governorate_id: cairo,
  city: 'Zamalek',
  address_line: '12 Test Street, Apt 4',
  payment_method: 'cod',
  items: [{ variant_id: liqaa, quantity: 1 }],
  ...extra,
});
let r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ expected_total: 5 }))])).r;
ok(!r.ok && r.price_changed, 'order refused when the browser total was tampered with');
r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ payment_method: 'card' }))])).r;
ok(!r.ok, 'card payment refused while no gateway is enabled');
r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ phone: '123' }))])).r;
ok(!r.ok, 'invalid phone refused');
r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ discount_code: 'NOPE' }))])).r;
ok(!r.ok, 'unknown coupon refused at checkout');
r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ discount_code: 'TEST10', expected_total: 960 }))])).r;
ok(r.ok && /^MEM-\d+$/.test(r.order_number) && Number(r.total) === 960, `order placed: ${r.order_number}, EGP ${r.total}`);
const first = r;
r = (await one(`select place_order($1::jsonb) as r`, [JSON.stringify(order({ discount_code: 'TEST10' }))])).r;
ok(!r.ok, 'per-customer coupon limit enforced (same phone, second use)');
const conf = (await one(`select get_order_confirmation($1, $2) as c`, [first.order_number, first.access_token])).c;
ok(conf && conf.items.length === 1 && Number(conf.total) === 960, 'guest can read their own confirmation with the token');
const wrong = (await one(`select get_order_confirmation($1, gen_random_uuid()) as c`, [first.order_number])).c;
ok(wrong === null, 'confirmation hidden without the right token');

console.log('\nSigned-in user who is not an admin');
await asUser(SHOPPER);
ok((await rows(`select * from orders`)).length === 0, 'cannot read orders');
ok(await throws(`select admin_dashboard(now() - interval '1 day', now())`), 'cannot call admin dashboard');
ok(await throws(`insert into admin_profiles (user_id, role) values ('${SHOPPER}', 'owner')`), 'cannot make themselves an admin');
await throws(`update product_variants set price = 1 where id = $1`, [liqaa]);
await asSuper();
ok(Number((await one(`select price from product_variants where id = $1`, [liqaa])).price) === 1000, 'cannot change a price (RLS leaves it at 1000)');

console.log('\nAdmin');
await asUser(ADMIN);
await asSuper();
ok(Number((await one(`select quantity from inventory where variant_id = $1`, [liqaa])).quantity) === 4, 'stock decremented by the order (5 → 4)');
await asUser(ADMIN);
const ord = await one(`select * from orders where order_number = $1`, [first.order_number]);
ok(ord && ord.payment_status === 'unpaid' && ord.status === 'pending', 'admin sees the order: pending + unpaid');
ok(Number((await one(`select unit_price from order_items where order_id = $1`, [ord.id])).unit_price) === 1000, 'order item stores a price snapshot');
await db.query(`update product_variants set price = 1500 where id = $1`, [liqaa]);
ok(Number((await one(`select unit_price from order_items where order_id = $1`, [ord.id])).unit_price) === 1000, 'snapshot unchanged after a price change');
await db.query(`update orders set status = 'confirmed' where id = $1`, [ord.id]);
const hist = await rows(`select * from order_status_history where order_id = $1 order by id`, [ord.id]);
ok(hist.length === 2 && hist[1].to_value === 'confirmed' && hist[1].changed_by === ADMIN, 'status change recorded with who changed it');
let dash = (await one(`select admin_dashboard(now() - interval '1 day', now() + interval '1 minute') as d`)).d;
ok(Number(dash.confirmed_revenue) === 0 && Number(dash.unpaid_value) === 960, 'unpaid order is not counted as revenue');
await db.query(`insert into payments (order_id, method, amount) values ($1, 'cod', 960)`, [ord.id]);
ok((await one(`select payment_status from orders where id = $1`, [ord.id])).payment_status === 'paid', 'recording a payment marks the order paid');
dash = (await one(`select admin_dashboard(now() - interval '1 day', now() + interval '1 minute') as d`)).d;
ok(Number(dash.confirmed_revenue) === 960 && dash.best_sellers[0]?.product_name === 'LIQAA', 'dashboard revenue + best seller from real records');
ok(dash.discount_usage[0]?.uses === 1 || Number(dash.discount_usage[0]?.uses) === 1, 'discount usage reported');
const inv1 = (await one(`select admin_issue_invoice($1) as i`, [ord.id])).i;
const inv1b = (await one(`select admin_issue_invoice($1) as i`, [ord.id])).i;
ok(inv1.invoice_number === 'MEM-INV-00001' && inv1b.invoice_number === inv1.invoice_number, 'invoice issued once per order (MEM-INV-00001)');
await db.query(`update orders set status = 'cancelled' where id = $1`, [ord.id]);
await asSuper();
ok(Number((await one(`select quantity from inventory where variant_id = $1`, [liqaa])).quantity) === 5, 'cancelling returns the stock');
ok(Number((await one(`select times_used from discounts where code = 'TEST10'`)).times_used) === 0, 'cancelling releases the coupon use');
const audits = await rows(`select * from audit_logs where entity = 'product_variants' and actor_id = $1`, [ADMIN]);
ok(audits.length >= 1 && audits[0].details.price, 'price change written to the audit log with the admin id');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
