-- MEMÓRIA · admin helpers: customer aggregates, order notes, product delete guard

-- order timeline can also carry free-text notes
alter table public.order_status_history drop constraint if exists order_status_history_field_check;
alter table public.order_status_history add constraint order_status_history_field_check
  check (field in ('status', 'payment_status', 'note'));

-- customers with their purchase history, for the dashboard
create or replace function public.admin_customers(p_search text default null)
returns table (
  id uuid, full_name text, phone text, email citext, notes text, created_at timestamptz,
  orders_count bigint, completed_count bigint, completed_value numeric, paid_value numeric, last_order_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not authorised' using errcode = '42501'; end if;
  return query
    select c.id, c.full_name, c.phone, c.email, c.notes, c.created_at,
           count(o.id),
           count(o.id) filter (where o.status = 'delivered'),
           coalesce(sum(o.total) filter (where o.status = 'delivered'), 0),
           coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0),
           max(o.created_at)
      from customers c
      left join orders o on o.customer_id = c.id
     where p_search is null or p_search = ''
        or c.full_name ilike '%' || p_search || '%'
        or c.phone like '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
        or c.email ilike '%' || p_search || '%'
     group by c.id
     order by max(o.created_at) desc nulls last, c.created_at desc
     limit 500;
end $$;
revoke all on function public.admin_customers(text) from public, anon;
grant execute on function public.admin_customers(text) to authenticated;

-- products that already appear on orders are archived, never hard-deleted
create or replace function public.guard_product_delete()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.order_items where product_id = old.id) then
    raise exception 'This product has orders. Archive it instead of deleting it.';
  end if;
  return old;
end $$;
create trigger products_guard_delete before delete on public.products
  for each row execute function public.guard_product_delete();
