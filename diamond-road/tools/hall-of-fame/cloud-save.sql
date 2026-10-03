-- Diamond Road · 개인 저장 코드 (설정 → "내 저장 코드 발급받기")
-- Supabase SQL Editor에 통째로 붙여넣고 Run. 여러 번 실행해도 안전합니다(기존 저장은 그대로).
--
-- 코드(예: K7QF-2M9X) 하나에 선수 기록 하나가 저장됩니다. 게임은 공개 키로
-- cloud_save / cloud_load 두 함수만 부를 수 있고, 표 자체는 읽거나 쓸 수 없습니다.

create table if not exists public.cloud_saves (
  code text primary key check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cloud_saves enable row level security;
revoke all on public.cloud_saves from anon, authenticated;

create or replace function public.cloud_save(p_code text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code is null or p_code !~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$' then
    raise exception 'bad code';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 200000 then
    raise exception 'bad data';
  end if;
  insert into public.cloud_saves (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
  return true;
end;
$$;

create or replace function public.cloud_load(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select data from public.cloud_saves where code = upper(p_code);
$$;

revoke all on function public.cloud_save(text, jsonb) from public;
revoke all on function public.cloud_load(text) from public;
grant execute on function public.cloud_save(text, jsonb) to anon, authenticated;
grant execute on function public.cloud_load(text) to anon, authenticated;
