-- MEMÓRIA · quantity offers ("any 2 or more at EGP X each") and best-offer selection.
-- discounts.kind 'unit_price': every eligible bottle is charged `value` once the
-- bag holds at least `min_quantity` eligible bottles. min_quantity also works
-- as a threshold for percentage / fixed offers.

alter table public.discounts drop constraint if exists discounts_kind_check;
alter table public.discounts add constraint discounts_kind_check check (kind in ('percentage', 'fixed', 'unit_price'));
alter table public.discounts drop constraint if exists pct_max;
alter table public.discounts add constraint pct_max check (kind <> 'percentage' or value <= 100);
alter table public.discounts add column if not exists min_quantity int check (min_quantity is null or min_quantity > 0);

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
  eligible_qty int;
  code_given boolean := nullif(trim(p_code), '') is not null;
  code_matched boolean := false;
  code_amount numeric(12, 2);
  code_error text;
  disc_kind text;
  disc_unit numeric(12, 2);
  disc_min_qty int;
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

  -- ── discount: one per order. Automatic offers (no code) and the entered code
  -- are all evaluated; the customer always gets the single best one. Offers
  -- never stack unless the owner builds one offer that covers both.
  for d in
    select * from discounts
     where active
       and (starts_at is null or starts_at <= now())
       and (ends_at is null or ends_at > now())
       and (code is null or (code_given and code = trim(p_code)::citext))
  loop
    if d.code is not null then code_matched := true; end if;
    if d.usage_limit is not null and d.times_used >= d.usage_limit then
      if d.code is not null then code_error := 'This code has reached its usage limit.'; end if;
      continue;
    end if;
    if d.min_order_amount is not null and subtotal < d.min_order_amount then
      if d.code is not null then code_error := 'This code needs a minimum order of EGP ' || to_char(d.min_order_amount, 'FM999G999G990') || '.'; end if;
      continue;
    end if;
    if d.per_customer_limit is not null and normalize_phone(p_phone) is not null then
      select count(*) into used_by_phone from coupon_usage cu
       where cu.discount_id = d.id and cu.phone = normalize_phone(p_phone);
      if used_by_phone >= d.per_customer_limit then
        if d.code is not null then code_error := 'This code has already been used with this phone number.'; end if;
        continue;
      end if;
    end if;
    select coalesce(sum((l ->> 'line_total')::numeric), 0), coalesce(sum((l ->> 'quantity')::int), 0),
           coalesce(sum(greatest(0, (l ->> 'unit_price')::numeric - d.value) * (l ->> 'quantity')::int), 0)
      into eligible, eligible_qty, best_amount
      from jsonb_array_elements(lines) l
     where d.scope = 'order'
        or (d.scope = 'product' and (l ->> 'product_id')::uuid = any (d.product_ids))
        or (d.scope = 'category' and (l ->> 'category_id') is not null
            and (l ->> 'category_id')::uuid = any (d.category_ids));
    if eligible <= 0 then
      if d.code is not null then code_error := 'This code does not apply to the items in your bag.'; end if;
      continue;
    end if;
    if d.min_quantity is not null and eligible_qty < d.min_quantity then
      if d.code is not null then code_error := 'This code needs at least ' || d.min_quantity || ' eligible bottles.'; end if;
      continue;
    end if;
    if d.kind <> 'unit_price' then
      best_amount := case when d.kind = 'percentage' then round(eligible * d.value / 100, 2)
                          else least(d.value, eligible) end;
    end if;
    if d.code is not null then code_amount := best_amount; end if;
    if best_amount > disc_amount then
      disc_amount := best_amount;
      disc_id := d.id;
      disc_code := d.code::text;
      disc_name := d.name;
      disc_kind := d.kind;
      disc_unit := case when d.kind = 'unit_price' then d.value end;
      disc_min_qty := d.min_quantity;
    end if;
  end loop;
  if code_given then
    if not code_matched then
      disc_error := 'This code is not valid.';
    elsif code_error is not null then
      disc_error := code_error;
    elsif disc_code is null or disc_code <> upper(trim(p_code)) and lower(disc_code) <> lower(trim(p_code)) then
      disc_error := 'Your bag already has a better offer, so this code was not added.';
    end if;
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
        'id', disc_id, 'code', disc_code, 'name', disc_name, 'amount', disc_amount,
        'kind', disc_kind, 'unit_price', disc_unit, 'min_quantity', disc_min_qty) end,
    'discount_error', disc_error,
    'discount_total', disc_amount,
    'shipping_fee', ship_fee,
    'shipping_to_confirm', ship_confirm,
    'shipping_eta', ship_eta,
    'total', subtotal - disc_amount + ship_fee,
    'currency', 'EGP'
  );
end $$;


revoke all on function public._price_cart(jsonb, text, int, text) from public, anon, authenticated;
