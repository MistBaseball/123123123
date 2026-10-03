/**
 * Hall of fame: the player's ranking identity (nickname + 4-digit tag, per browser), the
 * career record sent after every match, and the public boards. Talks to Supabase's REST API
 * directly (no SDK): `rpc/submit_record` to write, the `hall_of_fame` table to read.
 */
import { HOF_KEY, HOF_URL } from "./hof-config";
import {
  DIFFICULTIES,
  difficultySetting,
  matchTeams,
  tierOf,
  type Career,
  type Difficulty,
  type Role,
  type Tier,
} from "./game/engine";

export type HofProfile = { nickname: string; tag: string };
export type HofRow = {
  player_id: string;
  nickname: string;
  tag: string;
  player_name: string;
  team: string;
  tier: Tier;
  day: number;
  games: number;
  wins: number;
  strikeouts: number;
  hits: number;
  runs: number;
  pro_day: number | null;
  first_day: number | null;
  mlb_day: number | null;
  dev: boolean;
  /** Caught with pine tar (missing before the v11.4 server update). */
  dishonor?: boolean;
  /** v11.18 server: board, role, stat total and the composite score. */
  difficulty?: Difficulty;
  role?: Role;
  stat_total?: number;
  score?: number;
};

const PROFILE_KEY = "diamond-road-hof-profile";
export const NICK_MAX = 12;
const COLUMNS =
  "player_id,nickname,tag,player_name,team,tier,day,games,wins,strikeouts,hits,runs,pro_day,first_day,mlb_day,dev,dishonor,difficulty,role,stat_total,score";

export const hofConfigured = () => !!HOF_URL && !!HOF_KEY;

export function loadProfile(): HofProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
    return p && typeof p.nickname === "string" && /^\d{4}$/.test(p.tag) ? p : null;
  } catch {
    return null;
  }
}
/**
 * The career's own nickname#tag (it travels with the save code); else this browser's, which a
 * new career here starts with.
 */
export function profileOf(c: Career): HofProfile | null {
  if (typeof c.hofNick === "string" && c.hofNick.trim() && /^\d{4}$/.test(c.hofTag ?? ""))
    return { nickname: c.hofNick.trim().slice(0, NICK_MAX), tag: c.hofTag! };
  return loadProfile();
}
/** Writes the nickname#tag into the career. True if it changed (save it). */
export function attachProfile(c: Career, p: HofProfile) {
  if (c.hofNick === p.nickname && c.hofTag === p.tag) return false;
  c.hofNick = p.nickname;
  c.hofTag = p.tag;
  return true;
}
/** Saves the ranking nickname; the 4-digit tag is made once and kept when the name changes. */
export function saveProfile(nickname: string, current: HofProfile | null = null): HofProfile | null {
  const name = nickname.trim().slice(0, NICK_MAX);
  if (!name) return null;
  const tag =
    current?.tag ?? loadProfile()?.tag ?? String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const p = { nickname: name, tag };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* private mode: the profile lasts for this visit */
  }
  return p;
}

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const uuid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : (() => {
        const h = randomHex(16);
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
      })();
/** Gives the career its ranking row id and secret (once). True if it changed (save it). */
export function ensureIdentity(c: Career) {
  if (c.hofId && c.hofSecret) return false;
  c.hofId ??= uuid();
  c.hofSecret ??= randomHex(16);
  return true;
}

/** The row this career sends (the same numbers the career screen shows). */
export function recordOf(c: Career, p: HofProfile) {
  const day = Math.max(1, c.day),
    games = Math.max(0, c.games);
  return {
    player_id: c.hofId,
    nickname: p.nickname.slice(0, NICK_MAX),
    tag: p.tag,
    player_name: (c.name || "선수").slice(0, 16),
    team: matchTeams(c)[1].slice(0, 40),
    tier: tierOf(c),
    day,
    games,
    wins: Math.min(c.wins, games),
    strikeouts: c.strikeouts,
    hits: c.hits,
    runs: c.runs,
    pro_day: c.proDay ?? null,
    first_day: c.firstDay ?? null,
    mlb_day: c.mlbDay ?? null,
    // Badge only where the developer password was opened during this career.
    dev: !!(c.devUsed || c.devCap),
    dishonor: !!c.dishonor,
    // The board: the easiest difficulty this career has played a match on.
    // (No match yet and none recorded: the difficulty set now.)
    difficulty: c.minDifficulty ?? (c.games ? "normal" : difficultySetting()),
    role: c.role ?? "two-way",
    stat_total: statTotal(c),
  };
}
export const statTotal = (c: Career) =>
  Math.round(Object.values(c.stats).reduce((a, v) => a + v, 0));
const TIER_POINTS: Record<Tier, number> = { high: 0, farm: 100, first: 200, mlb: 300 };
/** Composite score (same formula as the server's `score` column, setup.sql). */
export const scoreOf = (c: Career) =>
  TIER_POINTS[tierOf(c)] +
  c.wins * 10 +
  c.strikeouts +
  c.hits * 2 +
  c.runs * 2 +
  Math.floor(statTotal(c) / 10);
export const SCORE_RULE =
  "종합 점수 = 단계(고교 0 · 2군 100 · 1군 200 · MLB 300) + 승리×10 + 탈삼진 + 안타×2 + 득점×2 + 능력치 합÷10";
export const ROLE_LABEL: Record<Role, string> = {
  "two-way": "투타 겸업",
  pitcher: "투수",
  batter: "타자",
};

const headers = (): Record<string, string> => ({
  apikey: HOF_KEY,
  "Content-Type": "application/json",
  // Legacy anon keys are JWTs and also go in Authorization; new publishable keys must not.
  ...(HOF_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${HOF_KEY}` } : {}),
});

export async function submitRecord(c: Career, p: HofProfile): Promise<boolean> {
  if (!hofConfigured() || !c.hofId || !c.hofSecret) return false;
  try {
    const res = await fetch(`${HOF_URL}/rest/v1/rpc/submit_record`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ rec: recordOf(c, p), secret: c.hofSecret }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Admin: wipes every ranking row (server checks its own admin password, see reset.sql). */
export async function resetHallOfFame(code: string): Promise<number> {
  const res = await fetch(`${HOF_URL}/rest/v1/rpc/reset_hall_of_fame`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(res.status === 404 ? "no-function" : "wrong-code");
  return Number(await res.json()) || 0;
}

export type Board = {
  id: Difficulty;
  label: string;
  order: string;
  filter: string;
  value: (r: HofRow) => string;
};
export const TIER_LABEL: Record<Tier, string> = {
  high: "고교",
  farm: "2군",
  first: "1군",
  mlb: "MLB",
};
/** One board per difficulty (hardest first), ranked by the composite score. */
export const BOARDS: Board[] = DIFFICULTIES.map((d) => ({
  id: d.id,
  label: d.label,
  order: "score.desc,games.asc",
  filter: `difficulty=eq.${d.id}`,
  value: (r: HofRow) => `${r.score ?? 0}점`,
}));

export async function fetchBoard(board: Board, limit = 50): Promise<HofRow[]> {
  const url =
    `${HOF_URL}/rest/v1/hall_of_fame?select=${COLUMNS}&order=${board.order}&limit=${limit}` +
    `&${board.filter}`;
  const res = await fetch(url, { headers: headers() });
  // A server without the v11.18 columns yet (setup.sql not run again) answers 400.
  if (res.status === 400) throw new Error("old-server");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as HofRow[];
}

/** How a ranking line names a player: 선수 이름 (닉네임#태그). */
export const displayName = (r: Pick<HofRow, "player_name" | "nickname" | "tag">) =>
  `${r.player_name} (${r.nickname}#${r.tag})`;
