-- Diamond Road 명예의 전당 · Supabase SQL Editor에서 한 번만 실행하세요.
-- 읽기: 누구나 (비밀값 열은 제외). 쓰기: submit_record 함수로만, 자기 기록의 비밀값을 알 때만.
-- 비정상 수치는 CHECK 조건으로 거부됩니다.
-- 다시 실행해도 안전합니다(기록은 지워지지 않음). 새 버전이 나오면 이 파일을 다시 Run 하세요.

create table if not exists public.hall_of_fame (
  player_id uuid primary key,
  secret_hash text not null,
  nickname text not null check (char_length(nickname) between 1 and 12),
  tag text not null check (tag ~ '^[0-9]{4}$'),
  player_name text not null check (char_length(player_name) between 1 and 16),
  team text not null default '' check (char_length(team) <= 40),
  tier text not null check (tier in ('high', 'farm', 'first', 'mlb')),
  tier_rank smallint not null check (tier_rank between 0 and 3),
  day integer not null check (day between 1 and 100000),
  games integer not null check (games between 0 and 100000),
  wins integer not null check (wins between 0 and games),
  strikeouts integer not null check (strikeouts between 0 and games * 60),
  hits integer not null check (hits between 0 and games * 60),
  runs integer not null check (runs between 0 and games * 60),
  pro_day integer check (pro_day between 1 and day),
  first_day integer check (first_day between 1 and day),
  mlb_day integer check (mlb_day between 1 and day),
  dev boolean not null default false,
  dishonor boolean not null default false,
  updated_at timestamptz not null default now()
);
-- v11.4: 파인타르 적발 칭호 「불명예」 (예전 표에 열 추가).
alter table public.hall_of_fame add column if not exists dishonor boolean not null default false;
-- v11.18: 난이도별 랭킹(그 선수가 경기한 가장 쉬운 난이도), 역할, 능력치 합, 종합 점수.
alter table public.hall_of_fame add column if not exists difficulty text not null default 'normal'
  check (difficulty in ('baby', 'easy', 'normal', 'hard', 'impossible'));
alter table public.hall_of_fame add column if not exists role text not null default 'two-way'
  check (role in ('two-way', 'pitcher', 'batter'));
alter table public.hall_of_fame add column if not exists stat_total integer not null default 0
  check (stat_total between 0 and 3000);
-- 종합 점수 = 단계(고교 0 · 2군 100 · 1군 200 · MLB 300) + 승리×10 + 탈삼진 + 안타×2 + 득점×2 + 능력치 합÷10
alter table public.hall_of_fame add column if not exists score integer
  generated always as (tier_rank * 100 + wins * 10 + strikeouts + hits * 2 + runs * 2 + stat_total / 10) stored;

alter table public.hall_of_fame enable row level security;
drop policy if exists "hall of fame is public" on public.hall_of_fame;
create policy "hall of fame is public" on public.hall_of_fame
  for select to anon, authenticated using (true);

-- 표를 직접 쓰는 권한은 없음. 읽기는 비밀값(secret_hash)을 뺀 열만.
revoke all on public.hall_of_fame from anon, authenticated;
grant select (player_id, nickname, tag, player_name, team, tier, tier_rank, day, games, wins,
  strikeouts, hits, runs, pro_day, first_day, mlb_day, dev, dishonor, difficulty, role, stat_total,
  score, updated_at)
  on public.hall_of_fame to anon, authenticated;

create or replace function public.submit_record(rec jsonb, secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := rec->>'tier';
begin
  if secret is null or char_length(secret) < 16 then
    raise exception 'bad secret';
  end if;
  insert into public.hall_of_fame as cur (
    player_id, secret_hash, nickname, tag, player_name, team, tier, tier_rank, day, games, wins,
    strikeouts, hits, runs, pro_day, first_day, mlb_day, dev, dishonor, difficulty, role,
    stat_total, updated_at
  ) values (
    (rec->>'player_id')::uuid,
    encode(sha256(convert_to(secret, 'UTF8')), 'hex'),
    rec->>'nickname',
    rec->>'tag',
    rec->>'player_name',
    coalesce(rec->>'team', ''),
    t,
    array_position(array['high', 'farm', 'first', 'mlb'], t) - 1,
    (rec->>'day')::int,
    (rec->>'games')::int,
    (rec->>'wins')::int,
    (rec->>'strikeouts')::int,
    (rec->>'hits')::int,
    (rec->>'runs')::int,
    (rec->>'pro_day')::int,
    (rec->>'first_day')::int,
    (rec->>'mlb_day')::int,
    coalesce((rec->>'dev')::boolean, false),
    coalesce((rec->>'dishonor')::boolean, false),
    coalesce(rec->>'difficulty', 'normal'),
    coalesce(rec->>'role', 'two-way'),
    coalesce((rec->>'stat_total')::int, 0),
    now()
  )
  on conflict (player_id) do update set
    nickname = excluded.nickname,
    tag = excluded.tag,
    player_name = excluded.player_name,
    team = excluded.team,
    tier = excluded.tier,
    tier_rank = excluded.tier_rank,
    day = excluded.day,
    games = excluded.games,
    wins = excluded.wins,
    strikeouts = excluded.strikeouts,
    hits = excluded.hits,
    runs = excluded.runs,
    pro_day = excluded.pro_day,
    first_day = excluded.first_day,
    mlb_day = excluded.mlb_day,
    -- 개발자 배지는 한 번 붙으면 지워지지 않는다.
    dev = cur.dev or excluded.dev,
    -- 불명예도 한 번 붙으면 지워지지 않는다.
    dishonor = cur.dishonor or excluded.dishonor,
    -- 난이도: 게임이 선수마다 "경기한 가장 쉬운 난이도"를 기록해서 보낸다(v12.1).
    -- (예전에는 서버가 더 쉬운 쪽으로만 바꿨는데, 선수를 만들자마자 '보통'으로 먼저 올라가
    --  그 뒤 어려움·불가능으로 한 기록도 계속 '보통'에 묶였다.)
    difficulty = excluded.difficulty,
    role = excluded.role,
    stat_total = excluded.stat_total,
    updated_at = now()
  -- v11.12: 경기 수·날짜가 줄어드는 기록(다른 컴퓨터에 남은 옛 기록)은 받지 않는다.
  where cur.secret_hash = excluded.secret_hash
    and (excluded.games, excluded.day) >= (cur.games, cur.day);
end;
$$;

revoke all on function public.submit_record(jsonb, text) from public;
grant execute on function public.submit_record(jsonb, text) to anon, authenticated;
