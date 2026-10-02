/**
 * Hall of fame: the player's ranking identity (nickname + 4-digit tag, per browser), the
 * career record sent after every match, and the public boards. Talks to Supabase's REST API
 * directly (no SDK): `rpc/submit_record` to write, the `hall_of_fame` table to read.
 */
import { HOF_KEY, HOF_URL } from "./hof-config";
import { matchTeams, tierOf, type Career, type Tier } from "./game/engine";

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
};

const PROFILE_KEY = "diamond-road-hof-profile";
export const NICK_MAX = 12;
const COLUMNS =
  "player_id,nickname,tag,player_name,team,tier,day,games,wins,strikeouts,hits,runs,pro_day,first_day,mlb_day,dev";

export const hofConfigured = () => !!HOF_URL && !!HOF_KEY;

export function loadProfile(): HofProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
    return p && typeof p.nickname === "string" && /^\d{4}$/.test(p.tag) ? p : null;
  } catch {
    return null;
  }
}
/** Saves the ranking nickname; the 4-digit tag is made once and kept when the name changes. */
export function saveProfile(nickname: string): HofProfile | null {
  const name = nickname.trim().slice(0, NICK_MAX);
  if (!name) return null;
  const tag = loadProfile()?.tag ?? String(Math.floor(Math.random() * 10000)).padStart(4, "0");
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
  };
}

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
  id: string;
  label: string;
  order: string;
  filter?: string;
  value: (r: HofRow) => string;
};
export const TIER_LABEL: Record<Tier, string> = {
  high: "고교",
  farm: "2군",
  first: "1군",
  mlb: "MLB",
};
export const BOARDS: Board[] = [
  {
    id: "overall",
    label: "종합",
    order: "tier_rank.desc,wins.desc,games.asc",
    value: (r) => `${TIER_LABEL[r.tier]} · ${r.wins}승`,
  },
  { id: "wins", label: "승리", order: "wins.desc,games.asc", value: (r) => `${r.wins}승` },
  {
    id: "strikeouts",
    label: "탈삼진",
    order: "strikeouts.desc,games.asc",
    value: (r) => `${r.strikeouts}K`,
  },
  { id: "hits", label: "안타", order: "hits.desc,games.asc", value: (r) => `${r.hits}안타` },
  {
    id: "pro",
    label: "최단 입단",
    order: "pro_day.asc,games.asc",
    filter: "pro_day=not.is.null",
    value: (r) => `${r.pro_day}일차`,
  },
  {
    id: "mlb",
    label: "최단 MLB",
    order: "mlb_day.asc,games.asc",
    filter: "mlb_day=not.is.null",
    value: (r) => `${r.mlb_day}일차`,
  },
];

export async function fetchBoard(board: Board, limit = 50): Promise<HofRow[]> {
  const url =
    `${HOF_URL}/rest/v1/hall_of_fame?select=${COLUMNS}&order=${board.order}&limit=${limit}` +
    (board.filter ? `&${board.filter}` : "");
  // Ask for the 「불명예」 column too; a server without it yet (old setup.sql) answers 400.
  let res = await fetch(url.replace(`select=${COLUMNS}`, `select=${COLUMNS},dishonor`), {
    headers: headers(),
  });
  if (res.status === 400) res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as HofRow[];
}

/** How a ranking line names a player: 선수 이름 (닉네임#태그). */
export const displayName = (r: Pick<HofRow, "player_name" | "nickname" | "tag">) =>
  `${r.player_name} (${r.nickname}#${r.tag})`;
