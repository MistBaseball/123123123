-- Diamond Road 명예의 전당 · 관리자 초기화 기능 (setup.sql 다음에 한 번 실행)
-- 아래 insert 줄의 작은따옴표 안 글자(관리자 비밀번호 자리)를 원하는 비밀번호로 바꾼 뒤 Run 하세요.
-- 비밀번호는 서버에 해시로만 저장되고 게임 코드에는 들어가지 않습니다.
-- 비밀번호를 바꾸고 싶으면 이 파일을 다른 비밀번호로 다시 실행하면 됩니다.

create table if not exists public.hof_admin (
  id integer primary key default 1 check (id = 1),
  code_hash text not null
);
alter table public.hof_admin enable row level security;
revoke all on public.hof_admin from anon, authenticated;

insert into public.hof_admin (id, code_hash)
values (1, encode(sha256(convert_to('여기에-관리자-비밀번호', 'UTF8')), 'hex'))
on conflict (id) do update set code_hash = excluded.code_hash;

create or replace function public.reset_hall_of_fame(code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if code is null or not exists (
    select 1 from public.hof_admin
    where code_hash = encode(sha256(convert_to(code, 'UTF8')), 'hex')
  ) then
    perform pg_sleep(1); -- 비밀번호 맞히기 시도를 느리게
    raise exception 'wrong admin code';
  end if;
  delete from public.hall_of_fame where true;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.reset_hall_of_fame(text) from public;
grant execute on function public.reset_hall_of_fame(text) to anon, authenticated;
