-- MEMÓRIA · Memory cards (the QR on the bottle).
-- A customer scans the QR, shares what the scent reminds them of plus their
-- name, mobile and birthday, and receives a personal single-use 10% code for
-- their next order. Entries are private (admins only); the browser can only
-- call submit_memory().

create table public.memory_entries (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null,                 -- normalize_phone() form, e.g. 2010XXXXXXXX
  birth_date  date not null,
  memory      text not null,
  code        text not null,
  discount_id uuid references public.discounts (id) on delete set null,
  source      text not null default 'qr',
  created_at  timestamptz not null default now()
);
create unique index memory_entries_phone_key on public.memory_entries (phone);
create index memory_entries_created_at on public.memory_entries (created_at desc);

alter table public.memory_entries enable row level security;
create policy "admins read memory entries" on public.memory_entries for select using (public.is_admin());
create policy "admins delete memory entries" on public.memory_entries for delete using (public.is_admin());
revoke all on public.memory_entries from anon;
revoke insert, update on public.memory_entries from authenticated;

create or replace function public.submit_memory(
  p_name text, p_phone text, p_birth_date date, p_memory text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name   text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_memory text := trim(coalesce(p_memory, ''));
  v_phone  text := normalize_phone(p_phone);
  v_code   text;
  v_disc   uuid;
  v_prev   memory_entries%rowtype;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    return jsonb_build_object('ok', false, 'field', 'name', 'error', 'Please enter your name.');
  end if;
  if v_phone is null then
    return jsonb_build_object('ok', false, 'field', 'phone', 'error', 'Please enter an Egyptian mobile number, e.g. 010 1234 5678.');
  end if;
  if p_birth_date is null or p_birth_date > current_date - interval '10 years' or p_birth_date < date '1900-01-01' then
    return jsonb_build_object('ok', false, 'field', 'birth_date', 'error', 'Please enter your date of birth.');
  end if;
  if char_length(v_memory) < 2 or char_length(v_memory) > 1000 then
    return jsonb_build_object('ok', false, 'field', 'memory', 'error', 'Tell us what MEMÓRIA reminds you of (up to 1,000 characters).');
  end if;

  -- One card per mobile number. The same person (same birthday) gets their code back.
  select * into v_prev from memory_entries where phone = v_phone;
  if found then
    if v_prev.birth_date = p_birth_date then
      return jsonb_build_object('ok', true, 'code', v_prev.code, 'existing', true);
    end if;
    return jsonb_build_object('ok', false, 'field', 'phone', 'error', 'This number already has a memory card.');
  end if;

  -- Flood guard: a printed QR never produces hundreds of cards an hour.
  if (select count(*) from memory_entries where created_at > now() - interval '1 hour') >= 300 then
    return jsonb_build_object('ok', false, 'error', 'We’re receiving a lot of memories right now. Please try again in a little while.');
  end if;

  loop
    v_code := 'MEM-' || (
      select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
        from generate_series(1, 6)
    );
    exit when not exists (select 1 from discounts where code = v_code::citext);
  end loop;

  insert into discounts (code, name, kind, value, scope, usage_limit, per_customer_limit, active)
  values (v_code, 'Memory card · ' || left(v_name, 60), 'percentage', 10, 'order', 1, 1, true)
  returning id into v_disc;

  insert into memory_entries (full_name, phone, birth_date, memory, code, discount_id)
  values (v_name, v_phone, p_birth_date, v_memory, v_code, v_disc);

  return jsonb_build_object('ok', true, 'code', v_code, 'existing', false);
exception when unique_violation then
  -- two submissions for the same number at the same moment
  return jsonb_build_object('ok', false, 'field', 'phone', 'error', 'This number already has a memory card.');
end $$;

revoke all on function public.submit_memory(text, text, date, text) from public;
grant execute on function public.submit_memory(text, text, date, text) to anon, authenticated;
