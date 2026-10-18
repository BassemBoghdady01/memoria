-- MEMÓRIA · core commerce schema
-- Catalogue, inventory, customers, orders, discounts, payments, invoices,
-- shipping, store settings, admin profiles and audit log.
-- Money is numeric(12,2) in EGP. All customer-facing writes go through
-- security-definer RPCs (see 20261018090200_rpc.sql); tables are locked
-- down by RLS (20261018090100_rls.sql).

create extension if not exists citext;

-- ───────────────────────── admin ─────────────────────────
create table public.admin_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'admin' check (role in ('owner', 'admin', 'staff')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and role = 'owner'
  );
$$;

-- ───────────────────────── catalogue ─────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name               text not null check (length(name) between 1 and 120),
  category_id        uuid references public.categories (id) on delete set null,
  short_description  text,
  description        text,
  top_notes          text[] not null default '{}',
  heart_notes        text[] not null default '{}',
  base_notes         text[] not null default '{}',
  fragrance_family   text,
  concentration      text,
  -- editorial storytelling (memory line, story, palette); free-form, optional
  story              jsonb not null default '{}'::jsonb,
  status             text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured           boolean not null default false,
  sort_order         int not null default 0,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index products_status_idx on public.products (status, sort_order);
create index products_category_idx on public.products (category_id);

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  sku         text unique,
  label       text not null,                      -- e.g. "100 ml"
  size_ml     int check (size_ml is null or size_ml > 0),
  price       numeric(12, 2) check (price is null or price >= 0),   -- null = not priced yet, cannot be bought
  sale_price  numeric(12, 2) check (sale_price is null or sale_price >= 0),
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sale_below_price check (sale_price is null or price is null or sale_price < price)
);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);

create table public.inventory (
  variant_id           uuid primary key references public.product_variants (id) on delete cascade,
  quantity             int not null default 0 check (quantity >= 0),
  low_stock_threshold  int not null default 3 check (low_stock_threshold >= 0),
  track_inventory      boolean not null default true,
  updated_at           timestamptz not null default now()
);

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  url           text not null,
  srcset        text,
  storage_path  text,                              -- set when uploaded to Storage
  alt           text,
  view_label    text,
  kind          text not null default 'gallery' check (kind in ('gallery', 'cutout')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, kind, sort_order);

-- ───────────────────────── shipping ─────────────────────────
create table public.shipping_zones (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  fee                      numeric(12, 2) not null check (fee >= 0),
  free_shipping_threshold  numeric(12, 2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  estimated_delivery       text,
  active                   boolean not null default true,
  sort_order               int not null default 0,
  created_at               timestamptz not null default now()
);

create table public.governorates (
  id          serial primary key,
  name_en     text not null unique,
  name_ar     text not null,
  zone_id     uuid references public.shipping_zones (id) on delete set null,
  active      boolean not null default true,
  sort_order  int not null default 0
);

-- ───────────────────────── customers ─────────────────────────
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null unique,                -- normalised: digits only, 20XXXXXXXXXX
  email       citext,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────── discounts ─────────────────────────
create table public.discounts (
  id                  uuid primary key default gen_random_uuid(),
  code                citext unique,               -- null = automatic offer (no code)
  name                text not null,
  kind                text not null check (kind in ('percentage', 'fixed')),
  value               numeric(12, 2) not null check (value > 0),
  scope               text not null default 'order' check (scope in ('order', 'product', 'category')),
  product_ids         uuid[] not null default '{}',
  category_ids        uuid[] not null default '{}',
  min_order_amount    numeric(12, 2) check (min_order_amount is null or min_order_amount >= 0),
  starts_at           timestamptz,
  ends_at             timestamptz,
  usage_limit         int check (usage_limit is null or usage_limit > 0),
  per_customer_limit  int check (per_customer_limit is null or per_customer_limit > 0),
  times_used          int not null default 0,
  active              boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint pct_max check (kind <> 'percentage' or value <= 100),
  constraint dates_ok check (starts_at is null or ends_at is null or starts_at < ends_at),
  constraint code_format check (code is null or code ~ '^[A-Za-z0-9_-]{3,32}$')
);

-- ───────────────────────── orders ─────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default ('MEM-' || nextval('public.order_number_seq')::text),
  access_token       uuid not null default gen_random_uuid(),   -- lets the guest view their confirmation
  customer_id        uuid references public.customers (id) on delete set null,
  customer_name      text not null,
  phone              text not null,
  email              citext,
  governorate_id     int references public.governorates (id),
  city               text,
  address_line       text not null,
  address_notes      text,
  shipping_zone_id   uuid references public.shipping_zones (id),
  subtotal           numeric(12, 2) not null check (subtotal >= 0),
  discount_total     numeric(12, 2) not null default 0 check (discount_total >= 0),
  shipping_fee       numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  shipping_to_confirm boolean not null default false,  -- no zone/fee configured for the governorate yet
  total             numeric(12, 2) not null check (total >= 0),
  discount_id        uuid references public.discounts (id) on delete set null,
  discount_code      text,
  payment_method     text not null,
  payment_status     text not null default 'unpaid'
                       check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'partially_refunded', 'failed')),
  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  source             text not null default 'web' check (source in ('web', 'whatsapp', 'manual')),
  customer_note      text,
  internal_note      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_customer_idx on public.orders (customer_id);
create index orders_phone_idx on public.orders (phone);

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  variant_id     uuid references public.product_variants (id) on delete set null,
  -- price snapshot: history never changes when the catalogue does
  product_name   text not null,
  variant_label  text not null,
  category_name  text,
  image_url      text,
  unit_price     numeric(12, 2) not null check (unit_price >= 0),
  quantity       int not null check (quantity between 1 and 20),
  line_total     numeric(12, 2) not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id           bigserial primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  field        text not null check (field in ('status', 'payment_status')),
  from_value   text,
  to_value     text not null,
  note         text,
  changed_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.coupon_usage (
  id           uuid primary key default gen_random_uuid(),
  discount_id  uuid not null references public.discounts (id) on delete cascade,
  order_id     uuid not null references public.orders (id) on delete cascade,
  customer_id  uuid references public.customers (id) on delete set null,
  phone        text,
  amount       numeric(12, 2) not null,
  created_at   timestamptz not null default now(),
  unique (discount_id, order_id)
);
create index coupon_usage_discount_phone_idx on public.coupon_usage (discount_id, phone);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  method        text not null,
  amount        numeric(12, 2) not null check (amount > 0),
  status        text not null default 'received' check (status in ('received', 'refunded', 'failed')),
  provider      text,
  provider_ref  text,
  received_at   timestamptz not null default now(),
  notes         text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

-- ───────────────────────── invoices ─────────────────────────
create table public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete restrict,
  invoice_number     text not null unique,
  issued_at          timestamptz not null default now(),
  company_snapshot   jsonb not null,
  customer_snapshot  jsonb not null,
  items_snapshot     jsonb not null,
  totals_snapshot    jsonb not null,
  void               boolean not null default false,
  created_by         uuid references auth.users (id) on delete set null
);
create index invoices_order_idx on public.invoices (order_id);

-- ───────────────────────── settings & audit ─────────────────────────
create table public.store_settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,   -- readable by the storefront
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

create table public.audit_logs (
  id          bigserial primary key,
  actor_id    uuid,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- ───────────────────────── triggers ─────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger variants_touch before update on public.product_variants for each row execute function public.touch_updated_at();
create trigger inventory_touch before update on public.inventory for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
create trigger discounts_touch before update on public.discounts for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();

-- every variant gets an inventory row
create or replace function public.variant_inventory_row()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inventory (variant_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger variant_inventory after insert on public.product_variants for each row execute function public.variant_inventory_row();

-- order status / payment status history
create or replace function public.order_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, field, from_value, to_value, note, changed_by)
    values (new.id, 'status', null, new.status, 'Order placed', auth.uid());
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, field, from_value, to_value, changed_by)
    values (new.id, 'status', old.status, new.status, auth.uid());
  end if;
  if new.payment_status is distinct from old.payment_status then
    insert into public.order_status_history (order_id, field, from_value, to_value, changed_by)
    values (new.id, 'payment_status', old.payment_status, new.payment_status, auth.uid());
  end if;
  return new;
end $$;
create trigger orders_history after insert or update on public.orders for each row execute function public.order_history();

-- generic audit trail for admin-managed tables
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid text;
  diff jsonb;
begin
  if tg_op = 'DELETE' then
    rid := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'key', to_jsonb(old) ->> 'variant_id');
    diff := to_jsonb(old);
  elsif tg_op = 'INSERT' then
    rid := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(new) ->> 'variant_id');
    diff := to_jsonb(new);
  else
    rid := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(new) ->> 'variant_id');
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into diff
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value and n.key not in ('updated_at');
    if diff is null then return new; end if;
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), tg_table_name, rid, diff);
  return coalesce(new, old);
end $$;

create trigger audit_products after insert or update or delete on public.products for each row execute function public.audit_row();
create trigger audit_variants after insert or update or delete on public.product_variants for each row execute function public.audit_row();
create trigger audit_inventory after update on public.inventory for each row execute function public.audit_row();
create trigger audit_images after insert or delete on public.product_images for each row execute function public.audit_row();
create trigger audit_discounts after insert or update or delete on public.discounts for each row execute function public.audit_row();
create trigger audit_settings after insert or update or delete on public.store_settings for each row execute function public.audit_row();
create trigger audit_zones after insert or update or delete on public.shipping_zones for each row execute function public.audit_row();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function public.audit_row();
create trigger audit_invoices after insert or update on public.invoices for each row execute function public.audit_row();
create trigger audit_admins after insert or update or delete on public.admin_profiles for each row execute function public.audit_row();
create trigger audit_orders after update or delete on public.orders for each row execute function public.audit_row();
create trigger audit_customers after update or delete on public.customers for each row execute function public.audit_row();
