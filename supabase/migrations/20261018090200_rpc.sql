-- MEMÓRIA · server-side commerce logic
-- Every price, discount and shipping fee a customer pays is computed here
-- from database records. The browser only ever sends variant ids,
-- quantities, a coupon code and a governorate.

-- ───────────────────────── helpers ─────────────────────────

-- Egyptian phone → digits-only international form (20XXXXXXXXXX).
create or replace function public.normalize_phone(p text)
returns text language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if d like '0020%' then d := substr(d, 3); end if;
  if d like '0%' and length(d) = 11 then d := '20' || substr(d, 2); end if;
  if d like '1%' and length(d) = 10 then d := '20' || d; end if;
  if d !~ '^20[0-9]{9,10}$' then return null; end if;
  return d;
end $$;

-- Internal pricing engine (not exposed to clients directly).
create or replace function public._price_cart(
  p_items jsonb,
  p_code text,
  p_governorate_id int,
  p_phone text
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  it jsonb;
  v record;
  lines jsonb := '[]'::jsonb;
  errors jsonb := '[]'::jsonb;
  qty int;
  unit numeric(12, 2);
  subtotal numeric(12, 2) := 0;
  d record;
  disc_id uuid;
  disc_code text;
  disc_name text;
  disc_amount numeric(12, 2) := 0;
  disc_error text;
  eligible numeric(12, 2);
  used_by_phone int;
  best_amount numeric(12, 2);
  zone record;
  ship_fee numeric(12, 2) := 0;
  ship_confirm boolean := false;
  ship_eta text;
  n_lines int := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Your bag is empty.'));
  end if;
  if jsonb_array_length(p_items) > 20 then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Too many lines in one order.'));
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    n_lines := n_lines + 1;
    begin
      qty := (it ->> 'quantity')::int;
    exception when others then
      qty := null;
    end;
    if qty is null or qty < 1 or qty > 10 then
      errors := errors || to_jsonb('Invalid quantity.'::text);
      continue;
    end if;

    select pv.id as variant_id, pv.label, pv.size_ml, pv.price, pv.sale_price, pv.active,
           p.id as product_id, p.name, p.slug, p.status, p.category_id, c.name as category_name,
           coalesce(inv.track_inventory, true) as track, coalesce(inv.quantity, 0) as stock,
           (select url from product_images pi where pi.product_id = p.id and pi.kind = 'gallery'
             order by pi.sort_order limit 1) as image_url
      into v
      from product_variants pv
      join products p on p.id = pv.product_id
      left join categories c on c.id = p.category_id
      left join inventory inv on inv.variant_id = pv.id
     where pv.id = (it ->> 'variant_id')::uuid;

    if not found or v.status <> 'published' or not v.active then
      errors := errors || to_jsonb('One of the items is no longer available.'::text);
      continue;
    end if;
    if v.price is null then
      errors := errors || to_jsonb((v.name || ' is not available for online ordering yet.')::text);
      continue;
    end if;
    if v.track and v.stock < qty then
      errors := errors || to_jsonb(
        case when v.stock = 0 then v.name || ' (' || v.label || ') is out of stock.'
             else 'Only ' || v.stock || ' left of ' || v.name || ' (' || v.label || ').' end);
      continue;
    end if;

    unit := coalesce(v.sale_price, v.price);
    subtotal := subtotal + unit * qty;
    lines := lines || jsonb_build_object(
      'variant_id', v.variant_id, 'product_id', v.product_id, 'slug', v.slug,
      'product_name', v.name, 'variant_label', v.label, 'size_ml', v.size_ml,
      'category_id', v.category_id, 'category_name', v.category_name, 'image_url', v.image_url,
      'unit_price', unit, 'regular_price', v.price, 'quantity', qty, 'line_total', unit * qty);
  end loop;

  -- ── discount: one per order, code first, otherwise best automatic offer ──
  for d in
    select * from discounts
     where active
       and (starts_at is null or starts_at <= now())
       and (ends_at is null or ends_at > now())
       and (case when nullif(trim(p_code), '') is not null
                 then code = trim(p_code)::citext
                 else code is null end)
  loop
    if d.usage_limit is not null and d.times_used >= d.usage_limit then
      disc_error := 'This code has reached its usage limit.';
      continue;
    end if;
    if d.min_order_amount is not null and subtotal < d.min_order_amount then
      disc_error := 'This code needs a minimum order of EGP ' || to_char(d.min_order_amount, 'FM999G999G990') || '.';
      continue;
    end if;
    if d.per_customer_limit is not null and normalize_phone(p_phone) is not null then
      select count(*) into used_by_phone from coupon_usage cu
       where cu.discount_id = d.id and cu.phone = normalize_phone(p_phone);
      if used_by_phone >= d.per_customer_limit then
        disc_error := 'This code has already been used with this phone number.';
        continue;
      end if;
    end if;
    select coalesce(sum((l ->> 'line_total')::numeric), 0) into eligible
      from jsonb_array_elements(lines) l
     where d.scope = 'order'
        or (d.scope = 'product' and (l ->> 'product_id')::uuid = any (d.product_ids))
        or (d.scope = 'category' and (l ->> 'category_id') is not null
            and (l ->> 'category_id')::uuid = any (d.category_ids));
    if eligible <= 0 then
      disc_error := 'This code does not apply to the items in your bag.';
      continue;
    end if;
    best_amount := case when d.kind = 'percentage' then round(eligible * d.value / 100, 2)
                        else least(d.value, eligible) end;
    if best_amount > disc_amount then
      disc_amount := best_amount;
      disc_id := d.id;
      disc_code := d.code::text;
      disc_name := d.name;
      disc_error := null;
    end if;
  end loop;
  if nullif(trim(p_code), '') is not null and disc_id is null and disc_error is null then
    disc_error := 'This code is not valid.';
  end if;

  -- ── shipping ──
  if p_governorate_id is not null then
    select z.* into zone
      from governorates g join shipping_zones z on z.id = g.zone_id and z.active
     where g.id = p_governorate_id and g.active;
    if found then
      ship_eta := zone.estimated_delivery;
      if zone.free_shipping_threshold is not null and (subtotal - disc_amount) >= zone.free_shipping_threshold then
        ship_fee := 0;
      else
        ship_fee := zone.fee;
      end if;
    else
      ship_confirm := true;
    end if;
  else
    ship_confirm := true;
  end if;

  return jsonb_build_object(
    'ok', jsonb_array_length(errors) = 0 and jsonb_array_length(lines) > 0,
    'errors', errors,
    'lines', lines,
    'subtotal', subtotal,
    'discount', case when disc_id is null then null else jsonb_build_object(
        'id', disc_id, 'code', disc_code, 'name', disc_name, 'amount', disc_amount) end,
    'discount_error', disc_error,
    'discount_total', disc_amount,
    'shipping_fee', ship_fee,
    'shipping_to_confirm', ship_confirm,
    'shipping_eta', ship_eta,
    'total', subtotal - disc_amount + ship_fee,
    'currency', 'EGP'
  );
end $$;

-- Public: price a bag (cart page, checkout summary, WhatsApp message).
create or replace function public.quote_cart(
  p_items jsonb,
  p_code text default null,
  p_governorate_id int default null,
  p_phone text default null
) returns jsonb
language sql stable security definer set search_path = public as $$
  select public._price_cart(p_items, p_code, p_governorate_id, p_phone);
$$;

-- Public: place an order. Guest checkout; no account needed.
create or replace function public.place_order(p jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  q jsonb;
  v_phone text := normalize_phone(p ->> 'phone');
  v_name text := trim(coalesce(p ->> 'full_name', ''));
  v_addr text := trim(coalesce(p ->> 'address_line', ''));
  v_pay text := p ->> 'payment_method';
  methods jsonb;
  cust_id uuid;
  ord record;
  l jsonb;
  recent int;
  disc jsonb;
begin
  if length(v_name) < 2 or length(v_name) > 120 then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Please enter your full name.'));
  end if;
  if v_phone is null then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Please enter a valid Egyptian mobile number.'));
  end if;
  if length(v_addr) < 6 or length(v_addr) > 400 then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Please enter your delivery address.'));
  end if;
  if (p ->> 'governorate_id') is null or not exists (
       select 1 from governorates where id = (p ->> 'governorate_id')::int and active) then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Please choose your governorate.'));
  end if;

  -- payment method must be one the business has switched on
  select value -> 'methods' into methods from store_settings where key = 'payments';
  if not exists (
       select 1 from jsonb_array_elements(coalesce(methods, '[]'::jsonb)) m
        where m ->> 'id' = v_pay and (m ->> 'enabled')::boolean) then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Please choose an available payment method.'));
  end if;

  -- light abuse guard: 5 orders per phone per hour
  select count(*) into recent from orders o2 where o2.phone = v_phone and o2.created_at > now() - interval '1 hour';
  if recent >= 5 then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array('Too many orders from this number. Please contact us on WhatsApp.'));
  end if;

  -- serialise competing orders for the same stock
  perform 1 from inventory
   where variant_id in (select (x ->> 'variant_id')::uuid from jsonb_array_elements(p -> 'items') x)
   for update;

  q := _price_cart(p -> 'items', p ->> 'discount_code', (p ->> 'governorate_id')::int, v_phone);
  if not (q ->> 'ok')::boolean then
    return jsonb_build_object('ok', false, 'errors', q -> 'errors');
  end if;
  if nullif(trim(p ->> 'discount_code'), '') is not null and q -> 'discount' = 'null'::jsonb then
    return jsonb_build_object('ok', false, 'errors', jsonb_build_array(coalesce(q ->> 'discount_error', 'This code is not valid.')));
  end if;
  -- the browser shows a total; refuse if it no longer matches the server's
  if (p ->> 'expected_total') is not null and (p ->> 'expected_total')::numeric <> (q ->> 'total')::numeric then
    return jsonb_build_object('ok', false, 'price_changed', true, 'quote', q,
      'errors', jsonb_build_array('Prices were updated. Please review your order total.'));
  end if;

  insert into customers (full_name, phone, email)
  values (v_name, v_phone, nullif(trim(p ->> 'email'), ''))
  on conflict (phone) do update
     set full_name = excluded.full_name,
         email = coalesce(excluded.email, customers.email)
  returning id into cust_id;

  disc := q -> 'discount';
  insert into orders (customer_id, customer_name, phone, email, governorate_id, city, address_line, address_notes,
                      shipping_zone_id, subtotal, discount_total, shipping_fee, shipping_to_confirm, total,
                      discount_id, discount_code, payment_method, payment_status, status, source, customer_note)
  values (cust_id, v_name, v_phone, nullif(trim(p ->> 'email'), ''), (p ->> 'governorate_id')::int,
          nullif(trim(p ->> 'city'), ''), v_addr, nullif(trim(p ->> 'address_notes'), ''),
          (select zone_id from governorates where id = (p ->> 'governorate_id')::int),
          (q ->> 'subtotal')::numeric, (q ->> 'discount_total')::numeric, (q ->> 'shipping_fee')::numeric,
          (q ->> 'shipping_to_confirm')::boolean, (q ->> 'total')::numeric,
          case when disc = 'null'::jsonb then null else (disc ->> 'id')::uuid end,
          case when disc = 'null'::jsonb then null else disc ->> 'code' end,
          v_pay, 'unpaid', 'pending', 'web', nullif(left(trim(p ->> 'customer_note'), 1000), ''))
  returning * into ord;

  for l in select * from jsonb_array_elements(q -> 'lines') loop
    insert into order_items (order_id, product_id, variant_id, product_name, variant_label, category_name,
                             image_url, unit_price, quantity, line_total)
    values (ord.id, (l ->> 'product_id')::uuid, (l ->> 'variant_id')::uuid, l ->> 'product_name',
            l ->> 'variant_label', l ->> 'category_name', l ->> 'image_url',
            (l ->> 'unit_price')::numeric, (l ->> 'quantity')::int, (l ->> 'line_total')::numeric);
    update inventory set quantity = quantity - (l ->> 'quantity')::int
     where variant_id = (l ->> 'variant_id')::uuid and track_inventory;
  end loop;

  if disc <> 'null'::jsonb then
    insert into coupon_usage (discount_id, order_id, customer_id, phone, amount)
    values ((disc ->> 'id')::uuid, ord.id, cust_id, v_phone, (disc ->> 'amount')::numeric);
    update discounts set times_used = times_used + 1 where id = (disc ->> 'id')::uuid;
  end if;

  return jsonb_build_object('ok', true, 'order_number', ord.order_number, 'access_token', ord.access_token,
                            'total', ord.total, 'shipping_to_confirm', ord.shipping_to_confirm);
end $$;

-- Return stock when an order is cancelled or returned (and take it again if reopened).
create or replace function public.order_restock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  was_out boolean := old.status in ('cancelled', 'returned');
  is_out boolean := new.status in ('cancelled', 'returned');
  sign int;
begin
  if was_out = is_out then return new; end if;
  sign := case when is_out then 1 else -1 end;
  update inventory inv
     set quantity = greatest(0, inv.quantity + sign * oi.quantity)
    from order_items oi
   where oi.order_id = new.id and oi.variant_id = inv.variant_id and inv.track_inventory;
  if is_out and new.discount_id is not null then
    update discounts set times_used = greatest(0, times_used - 1) where id = new.discount_id;
    delete from coupon_usage where order_id = new.id;
  end if;
  return new;
end $$;
create trigger orders_restock after update of status on public.orders
  for each row execute function public.order_restock();

-- Keep the order's payment status in step with recorded payments.
create or replace function public.payments_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  oid uuid := coalesce(new.order_id, old.order_id);
  received numeric;
  refunded numeric;
  due numeric;
  st text;
begin
  select coalesce(sum(amount) filter (where status = 'received'), 0),
         coalesce(sum(amount) filter (where status = 'refunded'), 0)
    into received, refunded from payments where order_id = oid;
  select total into due from orders where id = oid;
  st := case
          when refunded > 0 and refunded >= received then 'refunded'
          when refunded > 0 then 'partially_refunded'
          when received >= due and received > 0 then 'paid'
          when received > 0 then 'pending'
          else 'unpaid' end;
  update orders set payment_status = st where id = oid and payment_status is distinct from st;
  return null;
end $$;
create trigger payments_sync after insert or update or delete on public.payments
  for each row execute function public.payments_sync();

-- Public: the guest's own confirmation page (needs the secret token).
create or replace function public.get_order_confirmation(p_order_number text, p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'created_at', o.created_at, 'status', o.status,
    'payment_method', o.payment_method, 'payment_status', o.payment_status,
    'customer_name', o.customer_name, 'subtotal', o.subtotal, 'discount_total', o.discount_total,
    'discount_code', o.discount_code, 'shipping_fee', o.shipping_fee,
    'shipping_to_confirm', o.shipping_to_confirm, 'total', o.total,
    'items', (select jsonb_agg(jsonb_build_object('product_name', product_name, 'variant_label', variant_label,
                'quantity', quantity, 'unit_price', unit_price, 'line_total', line_total, 'image_url', image_url))
              from order_items where order_id = o.id))
  from orders o where o.order_number = p_order_number and o.access_token = p_token;
$$;

-- Public: whole published catalogue in one round trip (no stock counts, only availability).
create or replace function public.storefront_catalog()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'name', name) order by sort_order)
                   from categories), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(row_to_json(x)::jsonb order by x.sort_order, x.name) from (
      select p.id, p.slug, p.name, p.short_description, p.description, p.top_notes, p.heart_notes, p.base_notes,
             p.fragrance_family, p.concentration, p.story, p.featured, p.sort_order, p.seo_title, p.seo_description,
             (select jsonb_build_object('id', c.id, 'slug', c.slug, 'name', c.name) from categories c where c.id = p.category_id) as category,
             coalesce((select jsonb_agg(jsonb_build_object(
                  'id', v.id, 'label', v.label, 'size_ml', v.size_ml, 'price', v.price, 'sale_price', v.sale_price,
                  'in_stock', (not coalesce(i.track_inventory, true)) or coalesce(i.quantity, 0) > 0,
                  'low_stock', coalesce(i.track_inventory, true) and coalesce(i.quantity, 0) between 1 and coalesce(i.low_stock_threshold, 0))
                  order by v.sort_order, v.size_ml)
                from product_variants v left join inventory i on i.variant_id = v.id
               where v.product_id = p.id and v.active), '[]'::jsonb) as variants,
             coalesce((select jsonb_agg(jsonb_build_object('url', im.url, 'srcset', im.srcset, 'alt', im.alt,
                  'view', im.view_label, 'kind', im.kind) order by im.kind, im.sort_order)
                from product_images im where im.product_id = p.id), '[]'::jsonb) as images
        from products p where p.status = 'published') x), '[]'::jsonb),
    'settings', coalesce((select jsonb_object_agg(key, value) from store_settings where is_public), '{}'::jsonb),
    'governorates', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name_en', g.name_en, 'name_ar', g.name_ar)
                   order by g.sort_order, g.name_en) from governorates g where g.active), '[]'::jsonb)
  );
$$;

-- ───────────────────────── admin RPCs ─────────────────────────

create or replace function public.admin_dashboard(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_admin() then raise exception 'not authorised' using errcode = '42501'; end if;
  with o as (select * from orders where created_at >= p_from and created_at < p_to),
       live as (select * from o where status not in ('cancelled', 'returned')),
       items as (select oi.*, o.payment_status from order_items oi join live o on o.id = oi.order_id)
  select jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    'orders_total', (select count(*) from o),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from o group by status) s), '{}'::jsonb),
    'by_payment_status', coalesce((select jsonb_object_agg(payment_status, jsonb_build_object('count', n, 'value', v))
         from (select payment_status, count(*) n, sum(total) v from o group by payment_status) s), '{}'::jsonb),
    'confirmed_revenue', (select coalesce(sum(amount), 0) from payments pm join o on o.id = pm.order_id where pm.status = 'received')
                       - (select coalesce(sum(amount), 0) from payments pm join o on o.id = pm.order_id where pm.status = 'refunded'),
    'paid_orders', (select count(*) from live where payment_status = 'paid'),
    'unpaid_value', (select coalesce(sum(total), 0) from live where payment_status in ('unpaid', 'pending')),
    'avg_order_value', (select coalesce(round(avg(total), 2), 0) from live),
    'pending_orders', (select count(*) from o where status = 'pending'),
    'completed_orders', (select count(*) from o where status = 'delivered'),
    'cancelled_orders', (select count(*) from o where status = 'cancelled'),
    'returned_orders', (select count(*) from o where status = 'returned'),
    'best_sellers', coalesce((select jsonb_agg(x) from (
         select product_name, sum(quantity) as units, sum(line_total) as revenue
           from items group by product_name order by units desc, revenue desc limit 10) x), '[]'::jsonb),
    'by_category', coalesce((select jsonb_agg(x) from (
         select coalesce(category_name, 'Uncategorised') as category, sum(quantity) as units, sum(line_total) as revenue
           from items group by 1 order by revenue desc) x), '[]'::jsonb),
    'trend', coalesce((select jsonb_agg(x order by x.day) from (
         select date_trunc('day', created_at at time zone 'Africa/Cairo')::date as day,
                count(*) as orders, sum(total) as order_value,
                sum(total) filter (where payment_status = 'paid') as paid_value
           from live group by 1) x), '[]'::jsonb),
    'discount_usage', coalesce((select jsonb_agg(x) from (
         select coalesce(d.code::text, d.name) as discount, count(*) as uses, sum(cu.amount) as amount
           from coupon_usage cu join o on o.id = cu.order_id join discounts d on d.id = cu.discount_id
          group by 1 order by uses desc) x), '[]'::jsonb),
    'recent_orders', coalesce((select jsonb_agg(x) from (
         select id, order_number, customer_name, total, status, payment_status, created_at
           from orders order by created_at desc limit 8) x), '[]'::jsonb),
    'low_stock', coalesce((select jsonb_agg(x) from (
         select p.name as product_name, v.label as variant_label, i.quantity, i.low_stock_threshold
           from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id
          where i.track_inventory and v.active and p.status <> 'archived' and i.quantity <= i.low_stock_threshold
          order by i.quantity, p.name) x), '[]'::jsonb)
  ) into r;
  return r;
end $$;

-- Issue (or return the existing) invoice for an order. Numbering is
-- sequential per the owner's settings and gap-free under concurrency.
create or replace function public.admin_issue_invoice(p_order_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  existing invoices;
  ord orders;
  cfg jsonb;
  num int;
  inv invoices;
begin
  if not is_admin() then raise exception 'not authorised' using errcode = '42501'; end if;
  select * into existing from invoices where order_id = p_order_id and not void order by issued_at desc limit 1;
  if found then return to_jsonb(existing); end if;
  select * into ord from orders where id = p_order_id;
  if not found then raise exception 'order not found'; end if;

  select value into cfg from store_settings where key = 'invoice' for update;
  num := coalesce((cfg ->> 'next_number')::int, 1);
  update store_settings set value = jsonb_set(coalesce(cfg, '{}'::jsonb), '{next_number}', to_jsonb(num + 1))
   where key = 'invoice';

  insert into invoices (order_id, invoice_number, company_snapshot, customer_snapshot, items_snapshot, totals_snapshot, created_by)
  values (
    ord.id,
    coalesce(cfg ->> 'prefix', 'INV-') || lpad(num::text, coalesce((cfg ->> 'padding')::int, 5), '0'),
    coalesce((select value from store_settings where key = 'company'), '{}'::jsonb),
    jsonb_build_object('name', ord.customer_name, 'phone', ord.phone, 'email', ord.email,
      'address', ord.address_line, 'city', ord.city, 'address_notes', ord.address_notes,
      'governorate', (select name_en from governorates where id = ord.governorate_id)),
    (select jsonb_agg(jsonb_build_object('product_name', product_name, 'variant_label', variant_label,
       'quantity', quantity, 'unit_price', unit_price, 'line_total', line_total)) from order_items where order_id = ord.id),
    jsonb_build_object('order_number', ord.order_number, 'order_date', ord.created_at, 'subtotal', ord.subtotal,
      'discount_total', ord.discount_total, 'discount_code', ord.discount_code, 'shipping_fee', ord.shipping_fee,
      'total', ord.total, 'payment_method', ord.payment_method, 'payment_status', ord.payment_status,
      'tax_note', cfg ->> 'footer_note'),
    auth.uid())
  returning * into inv;
  return to_jsonb(inv);
end $$;

-- ───────────────────────── grants ─────────────────────────
revoke all on function public._price_cart(jsonb, text, int, text) from public, anon, authenticated;
grant execute on function public.quote_cart(jsonb, text, int, text) to anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_confirmation(text, uuid) to anon, authenticated;
grant execute on function public.storefront_catalog() to anon, authenticated;
revoke all on function public.admin_dashboard(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard(timestamptz, timestamptz) to authenticated;
revoke all on function public.admin_issue_invoice(uuid) from public, anon;
grant execute on function public.admin_issue_invoice(uuid) to authenticated;
