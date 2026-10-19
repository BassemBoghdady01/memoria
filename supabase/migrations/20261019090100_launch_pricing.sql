-- MEMÓRIA · owner-approved launch pricing (19 Oct 2026):
-- regular EGP 1,200, promotional EGP 999, any 2 or more bottles at EGP 899 each.
-- Bottle size and stock levels were not supplied, so the size label is generic
-- and stock is not tracked yet. All of this is editable in the dashboard.
insert into public.product_variants (product_id, sku, label, price, sale_price, sort_order)
select id, 'MEM-' || upper(slug), 'Bottle', 1200, 999, 0 from public.products
on conflict (sku) do nothing;
update public.inventory set track_inventory = false
 where variant_id in (select id from public.product_variants where sku like 'MEM-%');
insert into public.discounts (name, kind, value, min_quantity, scope, active)
select 'Any 2 or more — EGP 899 each', 'unit_price', 899, 2, 'order', true
 where not exists (select 1 from public.discounts where kind = 'unit_price' and code is null);
insert into public.store_settings (key, value, is_public) values
  ('offer', '{"enabled":true,"headline":"Choose any 2 — EGP 899 each","detail":"Mix any fragrances. Applied automatically in your bag."}'::jsonb, true),
  ('heritage', '{"years":25,"title":"25 Years of Crafting Scents.","script":"A Lifetime of Memories.","body":"For 25 years, our journey has been shaped by the art of fragrance. From carefully crafted compositions to the moments they become part of, we believe a perfume is never just a scent. It''s a place, a person, a feeling — a memory waiting to return.","steps":["Craftsmanship","Fragrance","Emotion","Memory"]}'::jsonb, true)
on conflict (key) do nothing;
