-- MEMÓRIA · Row Level Security
-- Public (anon / any signed-in non-admin): read the published catalogue,
-- active shipping data and public settings. Nothing else.
-- Admins (rows in admin_profiles): full management.
-- Orders are only ever created through place_order() (security definer).

alter table public.admin_profiles        enable row level security;
alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.product_variants      enable row level security;
alter table public.inventory             enable row level security;
alter table public.product_images        enable row level security;
alter table public.shipping_zones        enable row level security;
alter table public.governorates          enable row level security;
alter table public.customers             enable row level security;
alter table public.discounts             enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;
alter table public.coupon_usage          enable row level security;
alter table public.payments              enable row level security;
alter table public.invoices              enable row level security;
alter table public.store_settings        enable row level security;
alter table public.audit_logs            enable row level security;

-- ── public read ──
create policy "public reads categories" on public.categories
  for select using (true);
create policy "public reads published products" on public.products
  for select using (status = 'published' or public.is_admin());
create policy "public reads variants of published products" on public.product_variants
  for select using (
    public.is_admin() or (active and exists (
      select 1 from public.products p where p.id = product_id and p.status = 'published'))
  );
create policy "public reads images of published products" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "public reads active zones" on public.shipping_zones
  for select using (active or public.is_admin());
create policy "public reads governorates" on public.governorates
  for select using (active or public.is_admin());
create policy "public reads public settings" on public.store_settings
  for select using (is_public or public.is_admin());

-- ── admin write (catalogue, shipping, settings) ──
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage zones" on public.shipping_zones for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage governorates" on public.governorates for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

-- ── admin only (private business data) ──
create policy "admins manage customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage discounts" on public.discounts for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read orders" on public.orders for select using (public.is_admin());
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read order items" on public.order_items for select using (public.is_admin());
create policy "admins read order history" on public.order_status_history for select using (public.is_admin());
create policy "admins add order notes" on public.order_status_history for insert with check (public.is_admin());
create policy "admins read coupon usage" on public.coupon_usage for select using (public.is_admin());
create policy "admins manage payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read invoices" on public.invoices for select using (public.is_admin());
create policy "admins void invoices" on public.invoices for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit log" on public.audit_logs for select using (public.is_admin());

-- admin profiles: every admin sees the team; only the owner changes it.
-- There is deliberately no self-signup path: a new auth user has no row
-- here and therefore no rights at all.
create policy "admins read team" on public.admin_profiles for select using (public.is_admin());
create policy "owner manages team" on public.admin_profiles for all using (public.is_owner()) with check (public.is_owner());

-- Orders/items are never deleted or inserted directly from a client.
revoke insert, delete on public.orders, public.order_items from anon, authenticated;
revoke all on public.audit_logs from anon;
revoke insert, update, delete on public.audit_logs from authenticated;
revoke usage on sequence public.order_number_seq from anon, authenticated;

-- Only admins may write prices: belt and braces on top of RLS.
revoke insert, update, delete on public.products, public.product_variants, public.inventory,
  public.discounts, public.store_settings, public.shipping_zones from anon;
