export type Vec = { x: number; y: number; z: number };
export type Mode = "match" | "bullpen" | "batting";
export type Camera = "pitcher" | "catcher" | "broadcast" | "ball" | "top";
export type Phase = "ready" | "windup" | "flight" | "inplay" | "result" | "between" | "finished";
export type PitchId =
  | "fastball"
  | "slider"
  | "curve"
  | "changeup"
  | "cutter"
  | "splitter"
  | "twoseam"
  | "sinker"
  | "forkball"
  | "sweeper";
/**
 * Pitch data table. Everything that makes one pitch different from another lives here:
 * - delta: speed change (km/h) from the pitcher's fastball
 * - breakX/breakY: mid-flight bend used by pitchMovement() (display and trajectory share it)
 * - control: multiplier on the control error (1 = fastball, higher = harder to locate)
 * - stamina: multiplier on the energy each pitch costs
 * - chase/whiff: how much more the AI batter chases it / swings through it
 * - soft: how much weaker the AI batter's contact is (more ground balls)
 * - wild: multiplier on the wild-pitch chance (pitches that dive into the dirt)
 */
export type PitchData = {
  id: PitchId;
  name: string;
  en: string;
  key: string;
  delta: number;
  breakX: number;
  breakY: number;
  color: string;
  desc: string;
  /** XP needed to learn this pitch. The four-seam fastball is known from day one. */
  cost: number;
  control: number;
  stamina: number;
  chase: number;
  whiff: number;
  soft: number;
  wild: number;
};
export const PITCHES: PitchData[] = [
  {
    id: "fastball",
    name: "포심",
    en: "4-SEAM",
    key: "1",
    delta: 0,
    breakX: 0.025,
    breakY: 0.05,
    color: "#e8b65a",
    desc: "빠른 직구로 스트라이크 존을 공략",
    cost: 0,
    control: 1,
    stamina: 1,
    chase: 0,
    whiff: 0,
    soft: 0,
    wild: 1,
  },
  {
    id: "slider",
    name: "슬라이더",
    en: "SLIDER",
    key: "2",
    delta: -11,
    breakX: 0.43,
    breakY: -0.1,
    color: "#85bde4",
    desc: "타자 바깥쪽으로 날카롭게 휘는 공",
    cost: 60,
    control: 1,
    stamina: 1,
    chase: 0.1,
    whiff: 0.09,
    soft: 0,
    wild: 1,
  },
  {
    id: "curve",
    name: "커브",
    en: "CURVE",
    key: "3",
    delta: -23,
    breakX: 0.1,
    breakY: 0.55,
    color: "#c2a4eb",
    desc: "큰 낙차로 타자의 타이밍을 빼앗기",
    cost: 120,
    control: 1,
    stamina: 1,
    chase: 0.1,
    whiff: 0.09,
    soft: 0,
    wild: 1.2,
  },
  {
    id: "changeup",
    name: "체인지업",
    en: "CHANGEUP",
    key: "4",
    delta: -18,
    breakX: -0.22,
    breakY: 0.12,
    color: "#8bceb6",
    desc: "직구와 같은 폼, 느린 도착 시간",
    cost: 90,
    control: 1,
    stamina: 1,
    chase: 0.1,
    whiff: 0.09,
    soft: 0,
    wild: 1,
  },
  {
    id: "cutter",
    name: "커터",
    en: "CUTTER",
    key: "5",
    delta: -5,
    breakX: 0.2,
    breakY: -0.02,
    color: "#e58f7a",
    desc: "직구처럼 오다 끝에서 짧게 꺾이는 공",
    cost: 160,
    control: 1,
    stamina: 1,
    chase: 0.1,
    whiff: 0.09,
    soft: 0,
    wild: 1,
  },
  {
    id: "splitter",
    name: "스플리터",
    en: "SPLITTER",
    key: "6",
    delta: -9,
    breakX: -0.05,
    breakY: 0.42,
    color: "#d9d27a",
    desc: "직구 궤적에서 뚝 떨어지는 결정구",
    cost: 200,
    control: 1,
    stamina: 1,
    chase: 0.1,
    whiff: 0.09,
    soft: 0,
    wild: 1.3,
  },
  {
    id: "twoseam",
    name: "투심",
    en: "2-SEAM",
    key: "7",
    delta: -3,
    breakX: -0.18,
    breakY: 0.06,
    color: "#f0c987",
    desc: "직구 구속으로 몸쪽으로 파고드는 공 · 약한 타구 유도",
    cost: 80,
    control: 1.05,
    stamina: 1,
    chase: 0.04,
    whiff: 0.03,
    soft: 0.04,
    wild: 1,
  },
  {
    id: "sinker",
    name: "싱커",
    en: "SINKER",
    key: "8",
    delta: -6,
    breakX: -0.24,
    breakY: 0.22,
    color: "#a8c48a",
    desc: "가라앉으며 휘는 공 · 땅볼 유도에 강함",
    cost: 110,
    control: 1.1,
    stamina: 1.05,
    chase: 0.06,
    whiff: 0.05,
    soft: 0.09,
    wild: 1.15,
  },
  {
    id: "forkball",
    name: "포크볼",
    en: "FORKBALL",
    key: "9",
    delta: -15,
    breakX: 0,
    breakY: 0.62,
    color: "#e4a2c0",
    desc: "가장 크게 떨어지는 결정구 · 제구가 어렵고 체력 소모가 큼",
    cost: 240,
    control: 1.3,
    stamina: 1.25,
    chase: 0.15,
    whiff: 0.14,
    soft: 0.03,
    wild: 1.7,
  },
  {
    id: "sweeper",
    name: "스위퍼",
    en: "SWEEPER",
    key: "0",
    delta: -16,
    breakX: 0.62,
    breakY: -0.04,
    color: "#7fd3e0",
    desc: "옆으로 크게 쓸고 나가는 공 · 헛스윙 유도, 제구 난이도 높음",
    cost: 220,
    control: 1.18,
    stamina: 1.1,
    chase: 0.12,
    whiff: 0.12,
    soft: 0,
    wild: 1.1,
  },
];
export const pitchData = (id: PitchId) => PITCHES.find((p) => p.id === id) ?? PITCHES[0];
// AI pitchers only use the four original pitch types.
const AI_PITCHES = 4;
/** Contact swing timing: the ideal moment as a share of the visible flight. */
export const SWING_SWEET = 0.92;
export const SWING_GOOD = 0.045;
/**
 * Tunable game-rule values in one place (the web counterpart of Unity Inspector fields).
 * Change numbers here; the rules read them, nothing else hard-codes them.
 */
export const RULES = {
  /** Wild pitch chance per pitch with runners on: base + fatigue * ((100 - energy) / 100)^2. */
  wildPitchBase: 0.004,
  wildPitchFatigue: 0.075,
  wildPitchMin: 0.002,
  wildPitchMax: 0.09,
  /** Hit by pitch: the ball at the plate is inside the batter's body box (m from plate center). */
  hbpInnerEdge: 0.7,
  hbpLow: 0.25,
  hbpHigh: 1.8,
  /** Runners' lead off the bag when a pitch or pickoff starts (m). */
  runnerLead: 3.2,
  /** Extra random lead an AI runner gambles with (m, 0..this). */
  runnerLeadGamble: 1.8,
  /** Runner reaction before going back on a pickoff / breaking on a wild pitch (s). */
  runnerReaction: 0.22,
  /** Extra random pickoff reaction when the runner is leaning the wrong way (s, 0..this). */
  runnerReactionGamble: 0.2,
  /** Stealing runner: lead and first-step delay after the pitcher's first move (s). */
  stealLead: 3.6,
  stealJump: 0.12,
  /** How much later (s, 0..this) a runner may read the pitcher's first move. */
  stealJumpGamble: 0.2,
  /** How much slower (s, 0..this) the catcher's exchange may be on a given throw. */
  catcherTransferGamble: 0.22,
  /** Pitcher's pickoff move before the ball leaves the hand (s) and its throw speed (m/s). */
  pickoffMove: 0.28,
  pickoffThrowSpeed: 30,
  /** How far before the bag a tag reaches a sliding runner (m). */
  tagReach: 0.4,
  /** A runner takes an extra base on a wild pitch only with this much time to spare (s). */
  advanceMargin: 0.25,
  /** Runners on a fly ball with fewer than two outs run at this share of full speed until it lands. */
  flyReadPace: 0.55,
  /** ...scaled down for shallow flies: full share at flyReadFar (m), 20% at flyReadNear or less. */
  flyReadNear: 30,
  flyReadFar: 90,
};
export type Stage = "high" | "pro";
/**
 * Difficulty profile per career stage. The pro stage is tuned to feel clearly harder than high
 * school without doubling everything.
 */
export const STAGES: Record<
  Stage,
  {
    name: string;
    /** Name of the post-season goal shown on the gauge. */
    goal: string;
    goalReward: string;
    /** AI pitcher base velocity (km/h) and how many of the PITCHES table it mixes in. */
    aiVelocity: number;
    aiPitchKinds: number;
    /** AI batter: added contact probability and plate-discipline (eye) points. */
    batterContact: number;
    batterEye: number;
    /** Player batting: timing window scale and range-hint scale. */
    swingWindow: number;
    hintScale: number;
    /** Fielders: chase speed (m/s), first-step reaction (s), throw speed (m/s). */
    fielderSpeed: number;
    fielderReaction: number;
    throwSpeed: number;
    /** Catcher on a steal: catch-to-release time (s) and arm speed (m/s). */
    catcherTransfer: number;
    catcherArm: number;
    /** AI runners' lead gamble scale (smaller = harder to pick off). */
    leadGamble: number;
    /** Scale of the gauge gain after each match. */
    gaugeGain: number;
  }
> = {
  high: {
    name: "고교",
    goal: "스카우트 평가",
    goalReward: "입단 제의",
    aiVelocity: 135,
    aiPitchKinds: 4,
    batterContact: 0,
    batterEye: 0,
    swingWindow: 1,
    hintScale: 1,
    fielderSpeed: 5.6,
    fielderReaction: 0.4,
    throwSpeed: 29,
    catcherTransfer: 0.78,
    catcherArm: 30,
    leadGamble: 1,
    gaugeGain: 1,
  },
  pro: {
    name: "프로",
    goal: "1군 신뢰도",
    goalReward: "1군 선발 로테이션 진입",
    aiVelocity: 142,
    aiPitchKinds: 6,
    batterContact: 0.06,
    batterEye: 8,
    swingWindow: 0.85,
    hintScale: 1.15,
    fielderSpeed: 6,
    fielderReaction: 0.34,
    throwSpeed: 31,
    catcherTransfer: 0.72,
    catcherArm: 31,
    leadGamble: 0.85,
    gaugeGain: 0.75,
  },
};
export const swingWindow = (difficulty: "easy" | "normal" | "hard", stage: Stage = "high") =>
  (difficulty === "easy" ? 0.26 : difficulty === "normal" ? 0.18 : 0.12) *
  STAGES[stage].swingWindow;
/** Wild-pitch chance for one pitch; rises sharply as the pitcher tires. */
export const wildPitchChance = (energy: number, pitchWild = 1) =>
  clamp(
    (RULES.wildPitchBase + RULES.wildPitchFatigue * ((100 - clamp(energy, 0, 100)) / 100) ** 2) *
      pitchWild,
    RULES.wildPitchMin,
    RULES.wildPitchMax,
  );
/** True when a pitch crossing the plate at (x, y) strikes a batter standing on `hand`'s side. */
export const hitsBatter = (p: { x: number; y: number }, hand: "R" | "L") =>
  (hand === "L" ? -p.x : p.x) >= RULES.hbpInnerEdge && p.y >= RULES.hbpLow && p.y <= RULES.hbpHigh;
/** Clear result type of a single pitch. */
export type PitchOutcome = "Strike" | "Ball" | "HitByPitch" | "Foul" | "InPlay" | "WildPitch";
/** Readable runner state, derived from the RunnerTrack fields (no second copy of the state). */
export type RunnerState = "Idle" | "Running" | "Stealing" | "Returning" | "Safe" | "Out";
/** Radius (m) of the batter's read of where the pitch will cross the plate. */
export const contactHintRadius = (contact: number) => clamp(0.5 - contact * 0.0035, 0.15, 0.5);
/** How far (m) the bat aim may miss the ball and still make contact. */
export const batReach = (contact: number, style: "contact" | "power" | "bunt") =>
  (0.12 + clamp(contact, 0, 99) * 0.001) * (style === "power" ? 0.75 : style === "bunt" ? 1.3 : 1);
/** Actions (training, rest, study) available each day before the day's match. */
export const DAY_ACTIONS = 5;
export const STAT_NAMES: Record<keyof Career["stats"], string> = {
  velocity: "구속",
  control: "제구",
  movement: "구위",
  stamina: "체력",
  contact: "컨택",
  power: "파워",
};
const statLabel = (k: keyof Career["stats"]) => STAT_NAMES[k];
/** Fictional pro clubs loosely inspired by the KBO (names deliberately changed). */
export const TEAMS: {
  id: string;
  city: string;
  name: string;
  color: string;
  scout: string;
  motto: string;
}[] = [
  {
    id: "pigeons",
    city: "한밭",
    name: "피죤스",
    color: "#f08a24",
    scout: "최강수",
    motto: "끝까지 날개를 접지 않는다",
  },
  {
    id: "pandas",
    city: "잠실",
    name: "판다스",
    color: "#2b3a8c",
    scout: "허경민호",
    motto: "뚝심 있는 곰 대신 판다의 끈기",
  },
  {
    id: "triples",
    city: "한강",
    name: "트리플스",
    color: "#c4123f",
    scout: "박용태",
    motto: "쌍둥이보다 하나 더",
  },
  {
    id: "villains",
    city: "고척",
    name: "빌런즈",
    color: "#7a1f3d",
    scout: "이정호",
    motto: "영웅보다 강한 악당들",
  },
  {
    id: "launchers",
    city: "인천",
    name: "런처스",
    color: "#ce0e2d",
    scout: "김광식",
    motto: "상륙 대신 발사",
  },
  {
    id: "magicians",
    city: "수원",
    name: "매지션스",
    color: "#1a1a1a",
    scout: "강백원",
    motto: "마법 같은 한 방",
  },
  {
    id: "raptors",
    city: "창원",
    name: "랩터스",
    color: "#1d467f",
    scout: "나성민",
    motto: "공룡의 후예, 더 빠르게",
  },
  {
    id: "pumas",
    city: "대구",
    name: "퓨마스",
    color: "#0b61a4",
    scout: "오승현",
    motto: "사자보다 날렵하게",
  },
  {
    id: "titans",
    city: "부산",
    name: "타이탄스",
    color: "#041e42",
    scout: "이대훈",
    motto: "거인보다 더 거대하게",
  },
  {
    id: "cheetahs",
    city: "광주",
    name: "치타스",
    color: "#c8102e",
    scout: "양현승",
    motto: "호랑이보다 빠른 발톱",
  },
];
export const teamOf = (id: string) => TEAMS.find((t) => t.id === id) ?? null;
/** [visiting team, our team]: high-school rivals, or our club against a rotating pro rival. */
export const matchTeams = (c: Pick<Career, "stage" | "club" | "day">): [string, string] => {
  const club = c.stage === "pro" ? teamOf(c.club) : null;
  if (!club) return ["한빛고", "하늘고"];
  const rivals = TEAMS.filter((t) => t.id !== club.id);
  return [rivals[c.day % rivals.length].name, club.name];
};
/** Player creation: every stat starts at STAT_BASE and STAT_POINTS are spread freely. */
export const STAT_BASE = 45;
export const STAT_POINTS = 100;
export const STAT_CAP = 80;
/** Starting-pitch roulette: rarer pitches have smaller weights. */
export const BLESSINGS: { id: PitchId; weight: number; tier: string }[] = [
  { id: "slider", weight: 30, tier: "축복" },
  { id: "changeup", weight: 28, tier: "축복" },
  { id: "curve", weight: 20, tier: "은총" },
  { id: "cutter", weight: 14, tier: "은총" },
  { id: "splitter", weight: 8, tier: "신탁" },
];
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const V = (x = 0, y = 0, z = 0): Vec => ({ x, y, z });
export function gaussian(rng = Math.random) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, rng()))) * Math.cos(2 * Math.PI * rng());
}
export function ballistic(
  start: Vec,
  end: Vec,
  speed: number,
): { velocity: Vec; duration: number } | null {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    dz = end.z - start.z,
    d2 = dx * dx + dy * dy + dz * dz,
    b = speed * speed - 9.81 * dy,
    disc = b * b - 9.81 * 9.81 * d2;
  if (speed <= 0 || !Number.isFinite(speed) || disc < 0 || b <= 0 || d2 < 1e-8) return null;
  const duration = Math.sqrt((2 * d2) / (b + Math.sqrt(disc)));
  return { duration, velocity: V(dx / duration, dy / duration + 4.905 * duration, dz / duration) };
}
export function insideZone(p: Vec) {
  return Math.abs(p.x) <= 0.2515 && p.y >= 0.5135 && p.y <= 1.3865;
}
// Looking out from home, first base is on the right (world -X).
export const BASES = [V(-19.4, 0.12, 19.4), V(0, 0.12, 38.8), V(19.4, 0.12, 19.4), V(0, 0.12, 0)];
export const DEFENSE = [
  V(0, 0, 18.44),
  V(0, 0, -1.25),
  V(-23, 0, 24),
  V(-10, 0, 35),
  V(11, 0, 33),
  V(23, 0, 24),
  V(34, 0, 62),
  V(0, 0, 76),
  V(-34, 0, 62),
];
export const BASE_PATH_LENGTH = Math.hypot(19.4, 19.4);
/** Fielder chase speed (m/s), first-step reaction (s) and glove reach (m) for batted balls. */
// Tuned so roughly a third of balls in play fall for hits (see scripts/check-game.mjs).
export const FIELDER_SPEED = STAGES.high.fielderSpeed;
export const FIELDER_REACTION = STAGES.high.fielderReaction;
export const CATCH_REACH = 1.2;
const HANG_BASE = 1.4;
const HANG_DIV = 38;
export function pitchMovement(id: PitchId, movement: number) {
  const p = PITCHES.find((p) => p.id === id)!,
    x = (p.breakX * movement) / 75,
    y = (p.breakY * movement) / 75;
  return {
    x,
    y,
    minX: Math.min(0, x),
    maxX: Math.max(0, x),
    minY: Math.min(0, y),
    maxY: Math.max(0, y),
  };
}
/**
 * Control error (m, one standard deviation) of the player's pitches. Lower stamina (energy),
 * higher effort and poor form all widen it; the control stat narrows it.
 */
export const controlSpread = (control: number, energy: number, effort: number, form: number) =>
  (0.022 + (100 - control) * 0.0019 + (100 - energy) * 0.0016 + (effort - 70) * 0.001) *
  (1 + (100 - form) * 0.003);
export type RunnerTrack = {
  id: number;
  from: number;
  progress: number;
  target: number;
  pace: number;
  delay: number;
  out: boolean;
  scoredAt: number | null;
  /** After a caught fly: retouch the original base, then run for home. */
  tagUp?: boolean;
  /** Broke for the next base with the pitch (E steal call). */
  stealing?: boolean;
  /** Full sprint pace; `pace` may be lower while a fly ball is still in the air. */
  fullPace?: number;
};
/** A runner is at rest when standing on the base it is heading to (or out). */
export const runnerSettled = (r: RunnerTrack) =>
  r.out || (Math.abs(r.progress - r.target) < 1e-6 && !r.tagUp);
export function runnerState(r: RunnerTrack): RunnerState {
  if (r.out) return "Out";
  if (r.progress > r.target + 1e-6 || r.tagUp) return "Returning";
  if (r.progress < r.target - 1e-6) return r.stealing ? "Stealing" : "Running";
  return Math.abs(r.progress - r.from) < 1e-6 ? "Idle" : "Safe";
}
export function runnerPose(r: RunnerTrack) {
  const step = Math.min(3, Math.floor(r.progress)),
    t = clamp(r.progress - step, 0, 1),
    a = BASES[(step + 3) % 4],
    b = BASES[step];
  return {
    position: V(lerp(a.x, b.x, t), 0, lerp(a.z, b.z, t)),
    // Runners going back to retouch a base face the base behind them.
    facing: r.progress > r.target ? V(a.x - b.x, 0, a.z - b.z) : V(b.x - a.x, 0, b.z - a.z),
    moving: !r.out && Math.abs(r.progress - r.target) > 1e-6,
    visible: !r.out && r.progress < 4,
  };
}
// Player models face local -Z, unlike Object3D.lookAt's +Z convention.
export const playerYaw = (direction: Vec) => Math.atan2(-direction.x, -direction.z);
type FieldThrow = {
  from: Vec;
  base: number;
  receiver: number;
  startedAt: number;
  duration: number;
  receivedAt: number | null;
  runnerId: number | null;
};
type PlayOut = {
  runnerId: number;
  base: number;
  force: boolean;
  time: number;
  kind: "fly" | "force" | "tag";
};
export type Player = {
  name: string;
  hand: "R" | "L";
  contact: number;
  power: number;
  eye: number;
  speed: number;
};
export const RIVALS: Player[] = [
  { name: "김도윤", hand: "L", contact: 68, power: 48, eye: 63, speed: 80 },
  { name: "이준호", hand: "R", contact: 71, power: 53, eye: 69, speed: 71 },
  { name: "박시우", hand: "L", contact: 76, power: 72, eye: 70, speed: 65 },
  { name: "강태오", hand: "R", contact: 62, power: 88, eye: 57, speed: 45 },
  { name: "정민재", hand: "R", contact: 66, power: 67, eye: 64, speed: 58 },
  { name: "윤서준", hand: "L", contact: 64, power: 57, eye: 73, speed: 69 },
  { name: "최지호", hand: "R", contact: 57, power: 48, eye: 58, speed: 72 },
  { name: "한유찬", hand: "R", contact: 54, power: 52, eye: 55, speed: 61 },
  { name: "오지훈", hand: "L", contact: 52, power: 42, eye: 62, speed: 77 },
];
export type Career = {
  version: 1;
  name: string;
  day: number;
  energy: number;
  form: number;
  stats: {
    velocity: number;
    control: number;
    movement: number;
    stamina: number;
    contact: number;
    power: number;
  };
  scout: number;
  xp: number;
  games: number;
  wins: number;
  strikeouts: number;
  hits: number;
  runs: number;
  outs: number;
  draft: string;
  history: string[];
  /** Learned pitch types (bought with XP). */
  pitches: PitchId[];
  /** Actions left today; refilled to DAY_ACTIONS when a match ends the day. */
  actions: number;
  /** Pitch granted by the starting roulette ("" = not received yet). */
  blessing: string;
  /** Name and starting stats were chosen on the creation screen. */
  created: boolean;
  /** Dream club (TEAMS id). Its scout watches every season match. */
  team: string;
  /** Current career stage. "pro" after the signing ending. */
  stage: Stage;
  /** Club the player signed with (TEAMS id, "" = not signed yet). */
  club: string;
  /** The signing ending was watched and pro play is open. */
  proUnlocked: boolean;
  /** The pro goal (STAGES.pro.goalReward) has been reached. */
  proGoal: boolean;
};
export const newCareer = (): Career => ({
  version: 1,
  name: "나의 선수",
  day: 1,
  energy: 100,
  form: 76,
  stats: { velocity: 64, control: 65, movement: 62, stamina: 66, contact: 60, power: 56 },
  scout: 22,
  xp: 0,
  games: 0,
  wins: 0,
  strikeouts: 0,
  hits: 0,
  runs: 0,
  outs: 0,
  draft: "",
  history: ["고교 3학년, 마지막 시즌의 첫날."],
  pitches: ["fastball"],
  actions: DAY_ACTIONS,
  blessing: "",
  created: false,
  team: "",
  stage: "high",
  club: "",
  proUnlocked: false,
  proGoal: false,
});
export type Flight = {
  start: Vec;
  target: Vec;
  aim: Vec;
  velocity: Vec;
  duration: number;
  visualDuration: number;
  elapsed: number;
  pitch: PitchId;
  speed: number;
  movement: number;
  swung: boolean;
  swingTime: number;
  batAim: Vec;
  /** Batting only: faint area around the true crossing point; smaller with higher contact. */
  hint: { x: number; y: number; r: number } | null;
  /** Decided at release from the pitcher's stamina: the catcher cannot hold this pitch. */
  wild: boolean;
};
export type BatFeedback = {
  timing: "early" | "good" | "late" | "take";
  offsetMs: number | null;
  errorCm: number | null;
  contact: boolean;
  ball: Vec;
  batAim: Vec | null;
};
export type LivePlay = {
  /**
   * batted: ball put in play (runners[0] is the batter).
   * wild: wild pitch, the catcher chases the ball to the backstop.
   * steal: the catcher throws to second on an E steal call.
   * pickoff: the pitcher throws to a base instead of home.
   */
  kind: "batted" | "wild" | "steal" | "pickoff";
  /** Time from fielding the ball to releasing the throw (s). */
  hold: number;
  /** Throw speed of the current fielder (m/s). */
  throwSpeed: number;
  /** Ball/strike call of the pitch that started a wild/steal play, shown with the verdict. */
  call: string;
  start: Vec;
  land: Vec;
  duration: number;
  elapsed: number;
  fielder: number;
  fielderPos: Vec;
  state: "추적" | "포구" | "송구" | "보유";
  throwBase: number;
  manual: boolean;
  quality: number;
  resultBases: number;
  runnerStart: boolean[];
  ground: boolean;
  bounced: boolean;
  flightTime: number;
  height: number;
  catchAt: number;
  catchPoint: Vec;
  caughtFly: boolean;
  fieldedAt: number | null;
  defenders: Vec[];
  runners: RunnerTrack[];
  throw: FieldThrow | null;
  requestedBase: number | null;
  throws: number;
  outs: PlayOut[];
  error: boolean;
  sacrifice: boolean;
};
export type GameState = {
  mode: Mode;
  phase: Phase;
  paused: boolean;
  inning: number;
  half: "top" | "bottom";
  maxInnings: number;
  score: [number, number];
  lines: [number[], number[]];
  hits: [number, number];
  errors: [number, number];
  balls: number;
  strikes: number;
  outs: number;
  bases: boolean[];
  order: [number, number];
  pitchCount: [number, number];
  energy: number;
  camera: Camera;
  autoCamera: boolean;
  autoField: boolean;
  aim: Vec;
  selected: PitchId;
  effort: number;
  difficulty: "easy" | "normal" | "hard";
  swingStyle: "contact" | "power" | "bunt";
  sound: boolean;
  message: string;
  detail: string;
  resultTone: string;
  timer: number;
  flight: Flight | null;
  live: LivePlay | null;
  ball: Vec;
  lastSpeed: number;
  lastError: number;
  lastPitch: string;
  history: { x: number; y: number; kind: string; pitch: string }[];
  log: string[];
  practice: { pitches: number; strikes: number; hits: number; best: number };
  career: Career;
  saveStatus: string;
  lastResult: string;
  batFeedback: BatFeedback | null;
  /** XP earned so far in the current season match, credited when the match finishes. */
  matchXp: number;
  lastXpGain: number;
  /** Dream-club scout evaluation before/after the last finished match. */
  lastScout: { before: number; after: number } | null;
  /** Result type of the last pitch. */
  lastOutcome: PitchOutcome | null;
  /** E pressed: the runner on first goes with the next pitch (STEAL_READY). */
  stealCall: boolean;
  /** The stealing runner while the pitch is being delivered (null otherwise). */
  stealTrack: RunnerTrack | null;
};
const initial = (career: Career, mode: Mode = "match", maxInnings = 3): GameState => ({
  mode,
  phase: "ready",
  paused: false,
  inning: 1,
  half: mode === "batting" ? "bottom" : "top",
  maxInnings,
  score: [0, 0],
  lines: [Array(maxInnings).fill(0), Array(maxInnings).fill(0)],
  hits: [0, 0],
  errors: [0, 0],
  balls: 0,
  strikes: 0,
  outs: 0,
  bases: [false, false, false],
  order: [0, 0],
  pitchCount: [0, 0],
  energy: career.energy,
  camera: mode === "batting" ? "catcher" : "pitcher",
  autoCamera: true,
  autoField: true,
  aim: V(0, 0.95, 0),
  selected: "fastball",
  effort: 90,
  difficulty: "normal",
  swingStyle: "contact",
  sound: false,
  message: mode === "batting" ? "타석에 들어섰습니다" : "첫 공, 어디로 던질까요?",
  detail:
    mode === "batting"
      ? "공을 기다린 뒤 클릭해 스윙하세요"
      : "스트라이크 존 또는 오른쪽 조준판을 클릭해 투구",
  resultTone: "neutral",
  timer: 1.6,
  flight: null,
  live: null,
  ball: V(0.35, 1.85, 18.44),
  lastSpeed: 0,
  lastError: 0,
  lastPitch: "—",
  history: [],
  log: ["하늘고 vs 한빛고 · 경기 준비"],
  practice: { pitches: 0, strikes: 0, hits: 0, best: 0 },
  career,
  saveStatus: "이 브라우저에 자동 저장",
  lastResult: "",
  batFeedback: null,
  matchXp: 0,
  lastXpGain: 0,
  lastScout: null,
  lastOutcome: null,
  stealCall: false,
  stealTrack: null,
});
export class BaseballEngine {
  private matchStrikeouts = 0;
  private matchHits = 0;
  private matchRuns = 0;
  state: GameState;
  private listeners = new Set<() => void>();
  private snapshot: GameState;
  private rng: () => number;
  private emitClock = 0;
  private recorded = false;
  private soundCallback: (kind: string) => void = () => {};
  keys = new Set<string>();
  constructor(career = newCareer(), rng = Math.random) {
    this.state = initial(career);
    this.snapshot = { ...this.state };
    this.rng = rng;
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snapshot;
  emit() {
    this.snapshot = { ...this.state };
    this.listeners.forEach((fn) => fn());
  }
  get batting() {
    return (
      this.state.mode === "batting" || (this.state.mode === "match" && this.state.half === "bottom")
    );
  }
  get batter(): Player {
    const s = this.state;
    return this.batting
      ? {
          ...RIVALS[s.order[1] % 9],
          name: s.order[1] % 9 === 0 ? s.career.name : RIVALS[s.order[1] % 9].name,
          contact: s.career.stats.contact,
          power: s.career.stats.power,
        }
      : RIVALS[s.order[0] % 9];
  }
  onSound(fn: (kind: string) => void) {
    this.soundCallback = fn;
  }
  /** Difficulty profile of the current career stage (high school or pro). */
  get stageRules() {
    return STAGES[this.state.career.stage] ?? STAGES.high;
  }
  /** [visiting team, our team] for the scoreboard and the log. */
  get teams(): [string, string] {
    return matchTeams(this.state.career);
  }
  sound(kind: string) {
    if (this.state.sound) this.soundCallback(kind);
  }
  log(text: string) {
    this.state.log = [text, ...this.state.log].slice(0, 16);
  }
  persist() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("diamond-road-career-v1", JSON.stringify(this.state.career));
        this.state.saveStatus = "이 브라우저에 자동 저장됨";
      }
    } catch {
      this.state.saveStatus = "저장 공간 사용 불가 · 현재 플레이는 유지";
    }
  }
  load() {
    try {
      const raw = localStorage.getItem("diamond-road-career-v1");
      if (raw) {
        const c = JSON.parse(raw),
          keys = Object.keys(newCareer().stats) as (keyof Career["stats"])[];
        if (
          c?.version !== 1 ||
          typeof c.name !== "string" ||
          !c.stats ||
          !keys.every((k) => typeof c.stats[k] === "number" && Number.isFinite(c.stats[k])) ||
          ![
            c.day,
            c.energy,
            c.form,
            c.scout,
            c.games,
            c.xp,
            c.wins,
            c.strikeouts,
            c.hits,
            c.runs,
            c.outs,
          ].every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0) ||
          !Array.isArray(c.history) ||
          !c.history.every((v: unknown) => typeof v === "string") ||
          typeof c.draft !== "string"
        )
          throw new Error("Invalid save");
        const clean = newCareer();
        Object.assign(clean, c);
        clean.name = c.name.slice(0, 12) || "나의 선수";
        clean.energy = clamp(c.energy, 0, 100);
        clean.form = clamp(c.form, 0, 100);
        clean.scout = clamp(c.scout, 0, 100);
        clean.history = c.history.slice(0, 12);
        clean.stats = { ...newCareer().stats };
        keys.forEach((k) => (clean.stats[k] = clamp(c.stats[k], 0, 99)));
        // Saves made before the pitch shop already had the original four pitches.
        const known = Array.isArray(c.pitches)
          ? c.pitches.filter((id: unknown) => PITCHES.some((p) => p.id === id))
          : PITCHES.slice(0, AI_PITCHES).map((p) => p.id);
        clean.pitches = Array.from(new Set<PitchId>(["fastball", ...known]));
        clean.actions =
          typeof c.actions === "number" && Number.isFinite(c.actions)
            ? clamp(Math.round(c.actions), 0, DAY_ACTIONS)
            : DAY_ACTIONS;
        // Pre-shop saves already own four pitches, so they skip the starting roulette.
        clean.blessing =
          typeof c.blessing === "string" ? c.blessing : Array.isArray(c.pitches) ? "" : "legacy";
        delete (clean as Partial<{ trainedDay: number }>).trainedDay;
        // Players saved before the creation screen existed keep their name and stats.
        clean.created = typeof c.created === "boolean" ? c.created : true;
        clean.team = typeof c.team === "string" && teamOf(c.team) ? c.team : "";
        // Pro-stage fields (added later): older saves are high-school careers. A save that
        // already holds the dream-club contract keeps it and will see the signing ending.
        clean.club =
          typeof c.club === "string" && teamOf(c.club)
            ? c.club
            : clean.team && clean.draft.endsWith("입단")
              ? clean.team
              : "";
        clean.proUnlocked = c.proUnlocked === true && !!clean.club;
        clean.stage = c.stage === "pro" && clean.proUnlocked ? "pro" : "high";
        clean.proGoal = c.proGoal === true && clean.stage === "pro";
        this.state.career = clean;
        this.state.energy = clean.energy;
      }
    } catch {
      this.state.saveStatus = "저장 데이터를 읽지 못해 기본 선수로 시작";
    }
    this.emit();
  }
  set<K extends keyof GameState>(key: K, value: GameState[K]) {
    this.state[key] = value;
    this.emit();
  }
  setAim(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.state.aim = V(clamp(x, -0.95, 0.95), clamp(y, 0.12, 1.98), 0);
  }
  selectPitch(id: PitchId) {
    if (
      PITCHES.some((p) => p.id === id) &&
      this.state.career.pitches.includes(id) &&
      this.state.phase === "ready"
    ) {
      this.state.selected = id;
      this.emit();
    }
  }
  start(mode: Mode, maxInnings = this.state.maxInnings) {
    const previous = this.state;
    this.state = initial(previous.career, mode, maxInnings === 9 ? 9 : 3);
    this.state.sound = previous.sound;
    this.state.difficulty = previous.difficulty;
    this.state.autoField = previous.autoField;
    this.state.autoCamera = previous.autoCamera;
    this.recorded = false;
    this.matchStrikeouts = 0;
    this.matchHits = 0;
    this.matchRuns = 0;
    this.keys.clear();
    const team = teamOf(this.state.career.team),
      [away, home] = this.teams;
    if (mode === "match") this.state.log = [`${home} vs ${away} · 경기 준비`];
    if (mode === "match" && this.state.career.stage === "pro") {
      const club = teamOf(this.state.career.club)!;
      this.state.detail = `프로 무대 · ${club.city} ${club.name} 소속으로 ${away}와 맞붙습니다`;
    } else if (mode === "match" && team) {
      this.state.detail = `${team.city} ${team.name} ${team.scout} 스카우트가 관중석에서 지켜봅니다`;
      this.state.log = [`${team.name} 스카우트 관전 · ${home} vs ${away}`];
    }
    this.emit();
  }
  /** Adds in-match XP for season matches only; practice modes do not give XP. */
  private earn(xp: number) {
    if (this.state.mode === "match" && this.state.phase !== "finished") this.state.matchXp += xp;
  }
  throwAt(x = this.state.aim.x, y = this.state.aim.y) {
    const s = this.state;
    if (
      s.phase !== "ready" ||
      s.paused ||
      this.batting ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return false;
    this.setAim(x, y);
    this.launch(false);
    return true;
  }
  private launch(ai: boolean) {
    const s = this.state,
      stats = s.career.stats,
      stage = this.stageRules,
      pitch = ai
        ? PITCHES[Math.floor(this.rng() * Math.min(PITCHES.length, stage.aiPitchKinds))]
        : pitchData(s.selected);
    const fatigue = ai ? Math.max(0, s.pitchCount[0] - 25) * 0.18 : 100 - s.energy;
    const formPenalty = ai ? 0 : (100 - s.career.form) * 0.02;
    const speed = clamp(
      (ai ? stage.aiVelocity : 110 + stats.velocity * 0.43) +
        pitch.delta -
        fatigue * 0.065 -
        (100 - s.effort) * 0.09 -
        formPenalty +
        gaussian(this.rng) * 0.9,
      85,
      170,
    );
    const aim = ai
      ? V(gaussian(this.rng) * 0.29, 0.95 + gaussian(this.rng) * 0.34, 0)
      : { ...s.aim };
    const sigma =
      (ai ? 0.04 : controlSpread(stats.control, s.energy, s.effort, s.career.form)) * pitch.control;
    const target = V(
        clamp(aim.x + gaussian(this.rng) * sigma, -1.05, 1.05),
        clamp(aim.y + gaussian(this.rng) * sigma, 0.09, 2.1),
        0,
      ),
      start = V(0.35, 1.85, 18.44);
    // Stamina check at release: a tired arm sometimes buries the pitch where the catcher
    // cannot hold it. It only matters (and is only rolled) with runners on base.
    const wild =
      s.mode === "match" &&
      s.bases.some(Boolean) &&
      this.rng() < wildPitchChance(ai ? 100 - fatigue : s.energy, pitch.wild);
    if (wild) {
      target.y = 0.09 + this.rng() * 0.12;
      target.x = clamp(target.x * 1.6, -0.6, 0.6);
    }
    const arc = ballistic(start, target, speed / 3.6)!;
    const slow = s.difficulty === "easy" ? 2.5 : s.difficulty === "normal" ? 1.8 : 1.2;
    // The batter reads a zone around the true crossing point. The true point is always inside.
    let hint: Flight["hint"] = null;
    if (ai) {
      const r = contactHintRadius(stats.contact) * stage.hintScale,
        angle = this.rng() * Math.PI * 2,
        off = r * 0.8 * Math.sqrt(this.rng());
      hint = { x: target.x + Math.cos(angle) * off, y: target.y + Math.sin(angle) * off, r };
    }
    s.flight = {
      start,
      target,
      aim,
      velocity: arc.velocity,
      duration: arc.duration,
      visualDuration: arc.duration * slow,
      elapsed: 0,
      pitch: pitch.id,
      speed,
      movement: ai ? 65 : stats.movement,
      swung: false,
      swingTime: 0,
      batAim: { ...s.aim },
      hint,
      wild,
    };
    // STEAL_READY → the runner on first breaks with the pitcher's first move.
    s.stealTrack = null;
    if (s.stealCall && s.mode === "match" && this.batting && s.bases[0] && !s.bases[1]) {
      const pace = this.runnerPace(this.runnerOnFirst.speed);
      s.stealTrack = {
        id: 1,
        from: 1,
        progress: 1 + RULES.stealLead / BASE_PATH_LENGTH,
        target: 2,
        pace,
        fullPace: pace,
        delay: RULES.stealJump + this.rng() * RULES.stealJumpGamble,
        out: false,
        scoredAt: null,
        stealing: true,
      };
    }
    s.stealCall = false;
    s.phase = "windup";
    s.batFeedback = null;
    s.timer = 0.62;
    s.lastSpeed = Math.round(speed);
    s.lastPitch = pitch.name;
    s.ball = { ...start };
    s.live = null;
    s.message = ai ? "타이밍을 기다리세요" : "목표 지점 고정";
    s.detail = ai
      ? "흐린 원 = 공이 올 범위 · 조준 후 클릭 / Space"
      : `${pitch.name} · ${Math.round(speed)} km/h`;
    s.resultTone = "neutral";
    this.sound("wind");
    this.emit();
  }
  swing() {
    const s = this.state,
      f = s.flight;
    if (!this.batting || s.paused || s.phase !== "flight" || !f || f.swung) return false;
    f.swung = true;
    f.swingTime = f.elapsed;
    f.batAim = { ...s.aim };
    this.sound("swing");
    s.message = "스윙!";
    this.emit();
    return true;
  }
  tick(dt: number) {
    const s = this.state;
    if (s.paused) return;
    dt = Math.min(0.05, Math.max(0, dt));
    this.emitClock += dt;
    if (s.phase === "ready" && this.batting) {
      s.timer -= dt;
      if (s.timer <= 0) this.launch(true);
    } else if (s.phase === "windup") {
      s.timer -= dt;
      this.runSteal(dt);
      if (s.timer <= 0) {
        s.phase = "flight";
        s.pitchCount[this.batting ? 0 : 1]++;
        s.practice.pitches++;
        if (!this.batting && s.mode === "match")
          s.energy = clamp(
            s.energy -
              (0.38 + (s.effort - 70) * 0.012) *
                (1.3 - s.career.stats.stamina / 180) *
                pitchData(s.flight?.pitch ?? "fastball").stamina,
            0,
            100,
          );
      }
    } else if (s.phase === "flight" && s.flight) {
      const f = s.flight,
        before = f.elapsed;
      f.elapsed += dt;
      const u = clamp(f.elapsed / f.visualDuration, 0, 1);
      // The pitch is shown slowed down; the stealing runner moves in real (unslowed) time.
      this.runSteal(
        (Math.min(f.elapsed, f.visualDuration) - Math.min(before, f.visualDuration)) *
          (f.duration / f.visualDuration),
      );
      s.ball = this.pitchPosition(u);
      if (u >= 1) this.resolvePitch();
    } else if (s.phase === "inplay" && s.live) {
      this.tickLivePlay(dt);
    } else if (s.phase === "result") {
      s.timer -= dt;
      if (s.timer <= 0) this.next();
    }
    if (this.emitClock > 0.05) {
      this.emitClock = 0;
      this.emit();
    }
  }
  /** Base-running pace (bases per second) for a runner with this speed rating. */
  runnerPace(speed: number) {
    return (6.2 + speed * 0.02) / BASE_PATH_LENGTH;
  }
  /** Our runner on first is taken to be the previous batter in the order. */
  get runnerOnFirst(): Player {
    return RIVALS[(this.state.order[1] + 8) % 9];
  }
  /** Moves the E-steal runner during the delivery (dt in real game seconds). */
  private runSteal(dt: number) {
    const r = this.state.stealTrack;
    if (!r || dt <= 0) return;
    const usable = Math.max(0, dt - r.delay);
    r.delay = Math.max(0, r.delay - dt);
    r.progress = Math.min(r.target, r.progress + r.pace * usable);
  }
  pitchPosition(u: number): Vec {
    const f = this.state.flight;
    if (!f) return V(0.35, 1.85, 18.44);
    const t = f.duration * u,
      m = pitchMovement(f.pitch, f.movement),
      bend = Math.sin(Math.PI * u);
    return V(
      f.start.x + f.velocity.x * t + m.x * bend,
      f.start.y + f.velocity.y * t - 4.905 * t * t + m.y * bend,
      f.start.z + f.velocity.z * t,
    );
  }
  private result(message: string, detail: string, tone = "neutral", hold = 1.8) {
    const s = this.state;
    s.phase = "result";
    s.message = message;
    s.detail = detail;
    s.resultTone = tone;
    s.timer = hold;
    s.lastResult = message;
    this.log(message + (detail ? ` · ${detail}` : ""));
    this.sound(tone === "gold" ? "hit" : "call");
    this.emit();
  }
  private resolvePitch() {
    const s = this.state,
      f = s.flight!,
      zone = insideZone(f.target);
    s.lastError = Math.hypot(f.target.x - f.aim.x, f.target.y - f.aim.y) * 100;
    s.history = [
      { x: f.target.x, y: f.target.y, kind: zone ? "strike" : "ball", pitch: f.pitch },
      ...s.history,
    ].slice(0, 8);
    if (zone) s.practice.strikes++;
    if (s.mode === "bullpen") {
      this.result(
        zone ? "STRIKE" : "BALL",
        `조준 오차 ${s.lastError.toFixed(1)} cm · ${s.lastSpeed} km/h`,
        zone ? "gold" : "neutral",
      );
      return;
    }
    const stage = this.stageRules,
      data = pitchData(f.pitch),
      // Hit by pitch: decided by where this ball actually crossed the plate (control error,
      // pitch movement and the batter's side), not by a separate dice roll.
      hbp = hitsBatter(f.target, this.batter.hand);
    if (this.batting) {
      if (f.swung) {
        const timing = f.swingTime / f.visualDuration - SWING_SWEET,
          spatial = Math.hypot(f.batAim.x - f.target.x, f.batAim.y - f.target.y),
          window = swingWindow(s.difficulty, s.career.stage),
          reach = batReach(s.career.stats.contact, s.swingStyle),
          contact = Math.abs(timing) < window && spatial < reach;
        s.batFeedback = {
          timing: Math.abs(timing) <= SWING_GOOD ? "good" : timing < 0 ? "early" : "late",
          offsetMs: Math.round(timing * f.visualDuration * 1000),
          errorCm: Math.round(spatial * 100),
          contact,
          ball: { ...f.target },
          batAim: { ...f.batAim },
        };
        if (contact) {
          const q = clamp(
            1 -
              (Math.abs(timing) / window) * 0.65 -
              (spatial / reach) * 0.3 +
              s.career.stats.contact * 0.001,
            0,
            1,
          );
          if (q < 0.32) this.foul();
          else this.contact(q, timing);
        } else
          this.strike(
            true,
            Math.abs(timing) > 0.2
              ? timing < 0
                ? "스윙이 빨랐습니다"
                : "스윙이 늦었습니다"
              : "배트 중심에서 벗어났습니다",
          );
      } else {
        s.batFeedback = {
          timing: "take",
          offsetMs: null,
          errorCm: null,
          contact: false,
          ball: { ...f.target },
          batAim: null,
        };
        if (hbp) this.hitByPitch();
        else if (zone) this.strike(false, "스트라이크 존 통과");
        else this.ball();
      }
    } else {
      const b = this.batter,
        eye = b.eye + stage.batterEye,
        edge = Math.max(Math.abs(f.target.x) / 0.25, Math.abs(f.target.y - 0.95) / 0.4),
        chase = clamp(0.46 - eye * 0.004 + data.chase, 0.06, 0.45);
      if (hbp) {
        this.hitByPitch();
        return;
      }
      const swing = this.rng() < (zone ? 0.69 : chase * Math.max(0.1, 1.6 - edge * 0.5));
      if (swing) {
        const difficulty = s.difficulty === "hard" ? 0.1 : s.difficulty === "easy" ? -0.12 : 0,
          prob = clamp(
            0.3 +
              b.contact * 0.005 -
              (f.speed - 120) * 0.0035 +
              (100 - s.energy) * 0.002 -
              data.whiff +
              stage.batterContact +
              difficulty,
            0.2,
            0.9,
          );
        if (this.rng() < prob) {
          const q = clamp(
            0.15 +
              this.rng() * 0.75 +
              b.power * 0.001 -
              Math.max(0, edge - 0.65) * 0.25 -
              data.soft,
            0.05,
            1,
          );
          if (this.rng() < 0.19 || q < 0.25) this.foul();
          else this.contact(q, (this.rng() - 0.5) * 0.2);
        } else this.strike(true, "변화와 구속으로 헛스윙 유도");
      } else if (zone) this.strike(false, "스트라이크 존 통과");
      else this.ball();
    }
  }
  private strike(swing: boolean, detail: string) {
    const s = this.state;
    s.strikes++;
    s.lastOutcome = "Strike";
    if (s.strikes >= 3) {
      s.outs++;
      if (!this.batting && s.mode === "match") {
        this.matchStrikeouts++;
        this.earn(3);
      }
      this.advanceBatter();
      this.settlePitch(
        "STRIKEOUT",
        swing ? "헛스윙 삼진" : "루킹 삼진",
        this.batting ? "red" : "gold",
      );
    } else
      this.settlePitch(swing ? "SWING & MISS" : "STRIKE", detail, this.batting ? "red" : "gold");
  }
  private foul() {
    const s = this.state;
    s.lastOutcome = "Foul";
    // A foul is a dead ball: a stealing runner goes back to first.
    s.stealTrack = null;
    if (this.batting && s.swingStyle === "bunt" && s.strikes === 2) {
      s.outs++;
      this.advanceBatter();
      this.result("STRIKEOUT", "2스트라이크에서 번트 파울 · 삼진", "red");
      return;
    }
    if (s.strikes < 2) s.strikes++;
    this.result("FOUL", "파울 · 2스트라이크 이후 카운트 유지");
  }
  private ball() {
    const s = this.state;
    s.balls++;
    s.lastOutcome = "Ball";
    if (s.balls >= 4) {
      // Ball four forces the runner from first anyway, so a steal attempt is moot.
      s.stealTrack = null;
      this.walk();
      if (this.batting) this.earn(1);
      this.result("BASE ON BALLS", "볼넷 · 타자 1루 진루", this.batting ? "gold" : "red");
    } else this.settlePitch("BALL", "스트라이크 존 바깥", this.batting ? "gold" : "neutral");
  }
  /** Hit by pitch: the batter takes first and forced runners move up one base. */
  hitByPitch() {
    const s = this.state;
    s.lastOutcome = "HitByPitch";
    s.stealTrack = null;
    if (s.history[0]) s.history[0].kind = "ball";
    this.walk();
    if (this.batting) this.earn(1);
    this.result(
      "HIT BY PITCH",
      "몸에 맞는 공 · 타자 1루, 밀려난 주자 진루",
      this.batting ? "gold" : "red",
    );
  }
  /**
   * After a ball/strike call: a wild pitch or a running steal turns into a live base play;
   * otherwise the call is announced as usual.
   */
  private settlePitch(message: string, detail: string, tone: string) {
    const s = this.state,
      f = s.flight;
    if (s.mode === "match" && s.outs < 3 && f?.wild && s.bases.some(Boolean)) {
      this.startWildPitch(`${message} · ${detail}`);
      return;
    }
    if (s.mode === "match" && s.outs < 3 && s.stealTrack) {
      this.startStealThrow(`${message} · ${detail}`);
      return;
    }
    s.stealTrack = null;
    this.result(message, detail, tone);
  }
  advanceBatter() {
    const s = this.state;
    s.balls = 0;
    s.strikes = 0;
    s.order[this.batting ? 1 : 0]++;
  }
  addRuns(n: number) {
    const s = this.state;
    if (!n) return;
    const i = this.batting ? 1 : 0;
    s.score[i] += n;
    s.lines[i][s.inning - 1] = (s.lines[i][s.inning - 1] ?? 0) + n;
    if (i === 0 && s.mode === "match") this.matchRuns += n;
    if (i === 1) this.earn(2 * n);
  }
  walk() {
    const s = this.state;
    if (s.bases[0]) {
      if (s.bases[1]) {
        if (s.bases[2]) this.addRuns(1);
        s.bases[2] = true;
      }
      s.bases[1] = true;
    }
    s.bases[0] = true;
    this.advanceBatter();
  }
  intentionalWalk() {
    const s = this.state;
    if (s.mode !== "match" || this.batting || s.phase !== "ready" || s.paused) return false;
    this.walk();
    this.result("INTENTIONAL WALK", "고의4구 · 강제 진루 적용");
    return true;
  }
  contact(quality: number, timing = 0) {
    const s = this.state;
    this.sound("hit");
    let q = quality;
    if (this.batting)
      q = clamp(q - (100 - s.career.form) * 0.001, 0, 1) * (0.7 + this.rng() * 0.28);
    if (this.batting && s.swingStyle === "power") q = clamp(q + 0.13, 0, 1.15);
    if (this.batting && s.swingStyle === "bunt") q = 0.18;
    const angle = clamp(timing * 4 + (this.rng() - 0.5) * 1.05, -0.76, 0.76),
      range = (8 + q * q * 115) * (0.78 + this.batter.power / 240),
      land = V(Math.sin(angle) * range, 0.12, Math.cos(angle) * range);
    let fielder = 2,
      best = Infinity;
    DEFENSE.forEach((p, i) => {
      if (i === 1) return;
      const d = distance(p, land);
      if (d < best) {
        best = d;
        fielder = i;
      }
    });
    const hr = range > 104,
      bases = hr ? 4 : range > 78 ? 3 : range > 46 ? 2 : 1,
      ground = q <= 0.42;
    const lineDrive = !ground && !hr && this.rng() < 0.4;
    const flightTime = hr
        ? 4.5
        : ground
          ? clamp(range / 24, 0.55, 1.8)
          : lineDrive
            ? clamp(range / 32, 1.1, 2.7)
            : clamp(HANG_BASE + range / HANG_DIV, 1.8, 4.2),
      height = hr ? 25 : lineDrive ? 3.5 : q > 0.7 ? 17 : 9;
    // Find the descending, glove-height point of this exact flight.
    let lo = 0.5,
      hi = 1;
    for (let i = 0; i < 24; i++) {
      const u = (lo + hi) / 2;
      if (lerp(0.8, 0.12, u) + Math.sin(Math.PI * u) * height > 1.55) lo = u;
      else hi = u;
    }
    const catchU = (lo + hi) / 2,
      catchPoint = V(land.x * catchU, 1.55, land.z * catchU),
      defenders = DEFENSE.map((p) => ({ ...p }));
    const pace = this.runnerPace(this.batter.speed) * (hr ? 1.65 : 1),
      // With fewer than two outs, runners read a fly ball: they keep going, but at a
      // careful pace until it lands, so a catch can still send them back.
      reading = !hr && !ground && s.outs < 2,
      steal = s.stealTrack;
    const runners: RunnerTrack[] = [0, 1, 2, 3]
      .filter((i) => i === 0 || s.bases[i - 1])
      .map((i) => {
        const jump = i === 1 && steal ? steal : null,
          share = clamp(
            (range - RULES.flyReadNear) / (RULES.flyReadFar - RULES.flyReadNear),
            0.2,
            1,
          ),
          own = i > 0 && reading ? pace * RULES.flyReadPace * share : pace;
        return {
          id: i,
          from: i,
          progress: jump ? jump.progress : i,
          // Batter and runners all run while the ball is alive; nobody waits on a base.
          target: Math.min(4, i + bases),
          pace: jump ? pace : own,
          fullPace: pace,
          delay: i === 0 ? 0.12 : 0,
          out: false,
          scoredAt: null,
        };
      });
    s.stealTrack = null;
    s.lastOutcome = "InPlay";
    s.live = {
      kind: "batted",
      hold: 0.3,
      throwSpeed: this.stageRules.throwSpeed,
      call: "",
      start: V(0, 0.8, 0),
      land,
      duration: Math.max(5, 4 / pace + 1),
      elapsed: 0,
      fielder,
      fielderPos: defenders[fielder],
      state: "추적",
      throwBase: 0,
      manual: false,
      quality: q,
      resultBases: bases,
      runnerStart: [...s.bases],
      ground,
      bounced: ground,
      flightTime,
      height,
      catchAt: flightTime * catchU,
      catchPoint,
      caughtFly: false,
      fieldedAt: null,
      defenders,
      runners,
      throw: null,
      requestedBase: null,
      throws: 0,
      outs: [],
      error: false,
      sacrifice: false,
    };
    if (ground) {
      // Grounders are chased by whoever can cut the rolling ball off first.
      const l = s.live;
      let soonest = Infinity;
      DEFENSE.forEach((p, i) => {
        if (i === 1) return;
        const t = this.interceptTime(l, p);
        if (t < soonest) {
          soonest = t;
          l.fielder = i;
        }
      });
      l.fielderPos = l.defenders[l.fielder];
    }
    s.phase = "inplay";
    // In-play text only describes the ball; the verdict comes when the fielder acts.
    s.message = hr ? "담장을 향해!" : ground ? "땅볼 타구" : "뜬공 타구";
    s.detail = ground
      ? "땅볼 · 주자가 다음 베이스로 달립니다"
      : hr
        ? "홈런 타구"
        : s.outs === 2
          ? "2아웃 · 주자는 타구와 함께 출발"
          : "뜬공 · 주자는 달리면서 포구를 확인합니다";
    s.resultTone = "gold";
    this.emit();
  }
  selectThrowBase(base: number) {
    const s = this.state,
      l = s.live;
    if (
      s.phase !== "inplay" ||
      !l ||
      s.paused ||
      this.batting ||
      l.kind !== "batted" ||
      l.caughtFly ||
      l.state === "송구" ||
      base < 1 ||
      base > 4
    )
      return false;
    l.requestedBase = base;
    l.throwBase = base;
    l.manual = true;
    this.emit();
    return true;
  }
  private liveBall(l: LivePlay, time: number): Vec {
    // A wild pitch skips to the backstop and stops there.
    if (l.kind === "wild" && time >= l.flightTime) return { ...l.land };
    if (time > l.flightTime && l.resultBases < 4) {
      // After landing the ball keeps rolling and slows down on the grass.
      const len = Math.hypot(l.land.x - l.start.x, l.land.z - l.start.z) || 1,
        dirX = (l.land.x - l.start.x) / len,
        dirZ = (l.land.z - l.start.z) / len,
        v0 = (len / l.flightTime) * (l.ground ? 1.15 : 0.3),
        decel = l.ground ? 5 : 6,
        tau = Math.min(time - l.flightTime, v0 / decel),
        roll = v0 * tau - 0.5 * decel * tau * tau,
        maxRoll = Math.max(0, 104 - Math.hypot(l.land.x, l.land.z));
      const d = Math.min(roll, maxRoll);
      return V(l.land.x + dirX * d, 0.12, l.land.z + dirZ * d);
    }
    const u = clamp(time / l.flightTime, 0, 1);
    return V(
      lerp(l.start.x, l.land.x, u),
      l.ground
        ? 0.12 + 0.55 * Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u)
        : lerp(l.start.y, l.land.y, u) + Math.sin(u * Math.PI) * l.height,
      lerp(l.start.z, l.land.z, u),
    );
  }
  private interceptTime(l: LivePlay, from: Vec) {
    const { fielderSpeed, fielderReaction } = this.stageRules;
    for (let t = 0.05; t <= 12; t += 0.05) {
      const p = this.liveBall(l, t);
      if (Math.hypot(p.x - from.x, p.z - from.z) / fielderSpeed + fielderReaction <= t) return t;
    }
    return Infinity;
  }
  /** Earliest point on the ball's ground path the chasing fielder can reach in time. */
  private interceptPoint(l: LivePlay) {
    const { fielderSpeed, fielderReaction } = this.stageRules,
      wait = Math.max(0, fielderReaction - l.elapsed);
    for (let dt = 0.05; dt <= 12; dt += 0.05) {
      const t = l.elapsed + dt;
      if (t < Math.min(l.flightTime, l.elapsed + 0.05) && !l.ground) continue;
      const p = this.liveBall(l, t);
      if (Math.hypot(p.x - l.fielderPos.x, p.z - l.fielderPos.z) / fielderSpeed + wait <= dt)
        return p;
    }
    return this.liveBall(l, l.elapsed + 12);
  }
  private moveFielder(p: Vec, target: Vec, dt: number, speed = 8.2) {
    const d = Math.hypot(target.x - p.x, target.z - p.z),
      k = d ? Math.min(1, (dt * speed) / d) : 0;
    p.x = lerp(p.x, target.x, k);
    p.z = lerp(p.z, target.z, k);
  }
  private receiver(base: number, fielder: number) {
    const normal = [2, 3, 5, 1][base - 1];
    // When the catcher chases a ball (wild pitch), the pitcher covers home.
    return normal === fielder ? (base === 1 || base === 4 ? 0 : 4) : normal;
  }
  private forcedRunner(l: LivePlay, base: number) {
    // Forces exist only while the batter is running to first (never after a caught fly,
    // and never on a steal, pickoff or wild pitch).
    if (l.kind !== "batted" || l.caughtFly) return null;
    const r = l.runners.find((r) => r.from === base - 1 && !r.out);
    if (!r || r.progress >= base - 1e-8) return null;
    // Retiring any trailing forced runner removes the force on runners ahead.
    return Array.from({ length: base }, (_, i) =>
      l.runners.some((r) => r.from === i && !r.out),
    ).every(Boolean)
      ? r
      : null;
  }
  private candidateRunner(l: LivePlay, base: number) {
    return (
      this.forcedRunner(l, base) ??
      l.runners.find(
        (r) => !r.out && r.progress > base - 1 && r.progress < base - 1e-8 && r.target >= base,
      ) ??
      this.returningRunner(l, base)
    );
  }
  /** A runner heading back to `base` (caught fly or pickoff) who has not touched it yet. */
  private returningRunner(l: LivePlay, base: number) {
    return (
      l.runners.find((r) => !r.out && base < 4 && r.target === base && r.progress > base + 1e-8) ??
      null
    );
  }
  /** Throw flight time; it never lands before the covering fielder reaches the bag. */
  private throwTime(l: LivePlay, base: number) {
    const bag = BASES[base - 1],
      cover = l.defenders[this.receiver(base, l.fielder)],
      eta = Math.max(0, Math.hypot(cover.x - bag.x, cover.z - bag.z) - 0.9) / 8.2;
    return Math.max(0.22, distance(l.fielderPos, bag) / l.throwSpeed, eta + 0.02);
  }
  /**
   * Picks the base to throw to. forceOnly: only a force out (relay). sureOnly: only a throw
   * that beats its runner (after a caught fly, nobody throws just to hold runners).
   */
  private chooseThrow(l: LivePlay, forceOnly = false, sureOnly = false) {
    const options: { base: number; priority: number }[] = [];
    for (let base = 1; base <= 4; base++) {
      const forced = this.forcedRunner(l, base),
        r = forced ?? (!forceOnly ? this.candidateRunner(l, base) : null);
      if (!r) continue;
      const travel = this.throwTime(l, base),
        wait = Math.max(0, r.delay - l.elapsed),
        arrival = Math.abs(base - r.progress) / r.pace + wait;
      if (travel + 0.08 < arrival) options.push({ base, priority: (forced ? 10 : 0) + base });
    }
    const best = options.sort((a, b) => b.priority - a.priority)[0]?.base;
    if (best || forceOnly || sureOnly) return best ?? 0;
    // No sure out: still throw ahead of the lead runner who is still running.
    const running = l.runners
      .filter((r) => !r.out && r.progress < r.target - 1e-6)
      .sort((a, b) => b.progress - a.progress)[0];
    return running ? Math.min(4, Math.floor(running.progress + 1e-9) + 1) : 0;
  }
  private beginThrow(l: LivePlay, base: number) {
    if (!base) {
      l.state = "보유";
      l.throwBase = 0;
      this.state.detail = "주자가 모두 베이스에 도착 · 공을 내야로 돌려보냅니다";
      return;
    }
    const r = this.candidateRunner(l, base);
    l.throw = {
      from: { ...l.fielderPos, y: 1.2 },
      base,
      receiver: this.receiver(base, l.fielder),
      startedAt: l.elapsed,
      duration: this.throwTime(l, base),
      receivedAt: null,
      runnerId: r?.id ?? null,
    };
    l.throws++;
    l.throwBase = base;
    l.state = "송구";
    this.state.detail = (base === 4 ? "홈" : base + "루") + " 송구 · 공과 주자의 도착 순서 판정";
  }
  private retire(
    l: LivePlay,
    r: RunnerTrack,
    base: number,
    kind: PlayOut["kind"],
    time = l.elapsed,
  ) {
    if (r.out || this.state.outs >= 3) return;
    r.out = true;
    l.outs.push({ runnerId: r.id, base, force: kind === "force", time, kind });
    this.state.outs++;
    if (!this.batting) this.earn(1);
    this.state.message = kind === "fly" ? "FLY OUT" : kind === "tag" ? "TAG OUT" : "FORCE OUT";
    this.state.detail =
      kind === "fly"
        ? "땅에 닿기 전 포구 · 타자 아웃"
        : (base === 4 ? "홈" : base + "루") +
          (kind === "tag" ? "에서 주자 태그" : "에 공이 먼저 도착");
    this.sound("call");
  }
  private advanceLiveRunners(l: LivePlay, dt: number, previousTime: number) {
    for (const r of l.runners) {
      if (r.out) continue;
      const remainingDelay = Math.max(0, r.delay - previousTime),
        usable = Math.max(0, dt - remainingDelay);
      if (r.progress > r.target + 1e-9) {
        // RETURN: going back to retouch the base (caught fly or pickoff).
        const back = Math.max(r.target, r.progress - r.pace * usable);
        if (back <= r.target + 1e-9 && r.tagUp) {
          const reached = previousTime + remainingDelay + (r.progress - r.target) / r.pace;
          r.tagUp = false;
          r.target = 4;
          r.delay = reached + 0.18;
        }
        r.progress = back;
        continue;
      }
      if (r.progress >= r.target) continue;
      const before = r.progress;
      let next = Math.min(r.target, before + r.pace * usable);
      const t = l.throw;
      // A non-forced runner must actually be tagged BEFORE touching the base.
      if (
        t?.receivedAt != null &&
        t.runnerId === r.id &&
        before < t.base - 1e-8 &&
        !this.forcedRunner(l, t.base)
      ) {
        const tagLine = t.base - RULES.tagReach / BASE_PATH_LENGTH;
        if (next >= tagLine) {
          r.progress = Math.max(before, tagLine);
          this.retire(
            l,
            r,
            t.base,
            "tag",
            previousTime + remainingDelay + Math.max(0, tagLine - before) / r.pace,
          );
          continue;
        }
      }
      r.progress = next;
      if (next >= 4 && r.scoredAt === null)
        r.scoredAt = previousTime + remainingDelay + (4 - before) / r.pace;
    }
  }
  private tickLivePlay(dt: number) {
    // Split at ball events so a 30/60 fps boundary cannot change a close play.
    let remaining = dt;
    while (remaining > 1e-8 && this.state.phase === "inplay") {
      const l = this.state.live!,
        events = [l.flightTime, l.catchAt];
      if (l.fieldedAt !== null) events.push(l.fieldedAt + l.hold);
      if (l.throw) events.push(l.throw.startedAt + l.throw.duration);
      const next = events.filter((t) => t > l.elapsed + 1e-8).sort((a, b) => a - b)[0];
      const step = next === undefined ? remaining : Math.min(remaining, next - l.elapsed);
      this.stepLivePlay(step);
      remaining -= step;
    }
  }
  /** After a caught fly: throw behind a runner only when the ball beats him back to his bag. */
  private chooseDoubleOff(l: LivePlay) {
    for (let base = 3; base >= 1; base--) {
      const r = this.returningRunner(l, base);
      if (!r) continue;
      const wait = Math.max(0, r.delay - l.elapsed);
      if (this.throwTime(l, base) + 0.08 < (r.progress - base) / r.pace + wait) return base;
    }
    return 0;
  }
  private stepLivePlay(dt: number) {
    const s = this.state,
      l = s.live!,
      previous = l.elapsed;
    l.elapsed += dt;
    this.advanceLiveRunners(l, dt, previous);
    // Cover the bags while the selected fielder follows the ball.
    for (let base = 1; base <= 4; base++) {
      const i = this.receiver(base, l.fielder);
      this.moveFielder(l.defenders[i], BASES[base - 1], dt);
    }
    if (l.resultBases === 4) {
      s.ball = this.liveBall(l, l.elapsed);
      if (l.elapsed >= l.flightTime && l.runners.every((r) => r.progress >= r.target))
        this.resolvePlay();
      return;
    }
    if (l.fieldedAt === null) {
      const { fielderSpeed, fielderReaction } = this.stageRules,
        oldPos = { ...l.fielderPos },
        // Before landing: run to the catch point. After it lands: cut off the rolling ball.
        target = !l.ground && !l.bounced ? l.catchPoint : this.interceptPoint(l);
      if (!s.autoField && !this.batting) {
        const dx = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0),
          dz = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0),
          n = Math.hypot(dx, dz) || 1;
        l.fielderPos.x = clamp(l.fielderPos.x + (dx / n) * fielderSpeed * dt, -85, 85);
        l.fielderPos.z = clamp(l.fielderPos.z + (dz / n) * fielderSpeed * dt, -20, 105);
      } else {
        // The fielder needs a moment to read the ball before the first step.
        const moving = Math.max(0, l.elapsed - Math.max(previous, fielderReaction));
        if (moving > 0) this.moveFielder(l.fielderPos, target, moving, fielderSpeed);
      }
      s.ball = this.liveBall(l, l.elapsed);
      if (!l.ground && !l.bounced && previous < l.catchAt - 1e-8 && l.elapsed + 1e-8 >= l.catchAt) {
        const fraction = clamp((l.catchAt - previous) / dt, 0, 1),
          atCatch = V(
            lerp(oldPos.x, l.fielderPos.x, fraction),
            0,
            lerp(oldPos.z, l.fielderPos.z, fraction),
          );
        if (Math.hypot(atCatch.x - l.catchPoint.x, atCatch.z - l.catchPoint.z) <= CATCH_REACH) {
          l.caughtFly = true;
          l.fieldedAt = l.catchAt;
          l.state = "포구";
          l.throwBase = 0;
          l.fielderPos.x = atCatch.x;
          l.fielderPos.z = atCatch.z;
          // Caught: the batter is out; he is not a runner who goes back.
          this.retire(l, l.runners[0], 1, "fly", l.catchAt);
          // Every other runner turns around at once (RETURN) and sprints back.
          for (const r of l.runners.slice(1)) {
            r.target = r.from;
            r.scoredAt = null;
            r.stealing = false;
            r.pace = r.fullPace ?? r.pace;
          }
          if (s.outs < 3 && l.quality > 0.6 && l.land.z > 55) {
            const third = l.runners.find((r) => r.from === 3);
            if (third) {
              if (third.progress <= third.from + 1e-9) {
                third.target = 4;
                third.delay = l.elapsed + 0.18;
              } else third.tagUp = true;
              l.sacrifice = true;
              s.detail = "플라이 아웃 · 3루 주자 귀루 후 태그업";
            }
          }
        } else if (!s.autoField && !this.batting && distance(DEFENSE[l.fielder], l.catchPoint) < 18)
          l.error = true;
      }
      if (!l.caughtFly && l.elapsed + 1e-8 >= l.flightTime && !l.bounced) {
        l.bounced = true;
        // Extra bases depend on how far the fielder still is from the ball, capped by distance.
        const gap = Math.hypot(l.fielderPos.x - l.land.x, l.fielderPos.z - l.land.z);
        l.resultBases = Math.min(l.resultBases, 1 + (gap > 9 ? 1 : 0) + (gap > 22 ? 1 : 0));
        // The ball is down: everyone sprints on; nobody turns back toward a passed base.
        for (const r of l.runners) {
          r.pace = r.fullPace ?? r.pace;
          r.target = Math.min(4, Math.max(r.from + l.resultBases, Math.ceil(r.progress - 1e-9)));
        }
        s.message = "FAIR BALL";
        s.detail = "타구가 땅에 닿았습니다 · 주자 진루";
      }
      if (
        l.bounced &&
        Math.hypot(s.ball.x - l.fielderPos.x, s.ball.z - l.fielderPos.z) < 1.5 &&
        s.ball.y < 1.1
      ) {
        l.fieldedAt = l.elapsed;
        l.state = "포구";
        s.detail =
          l.kind === "wild"
            ? "포수가 빠진 공을 잡았습니다 · 송구 판단"
            : "공을 잡았습니다 · 곧바로 송구";
      }
    }
    if (l.fieldedAt !== null) {
      if (l.caughtFly && !l.throw) {
        s.ball = { ...l.fielderPos, y: 1.55 };
        if (l.state === "포구") {
          if (l.elapsed - l.fieldedAt + 1e-8 < l.hold) return;
          // Doubled off only if the throw beats the returning runner to his base.
          const base = s.outs < 3 ? this.chooseDoubleOff(l) : 0;
          if (base) this.beginThrow(l, base);
          else l.state = "보유";
        }
        if (!l.throw) {
          if (l.elapsed - l.fieldedAt > 0.75 && (s.outs >= 3 || l.runners.every(runnerSettled)))
            this.resolvePlay();
          return;
        }
      }
      if (l.state === "포구") {
        s.ball = { ...l.fielderPos, y: l.kind === "batted" ? 1.2 : 1.4 };
        if (l.elapsed - l.fieldedAt + 1e-8 >= l.hold)
          this.beginThrow(l, l.requestedBase ?? this.chooseThrow(l));
      }
      const t = l.throw;
      if (t) {
        const u = clamp((l.elapsed - t.startedAt) / t.duration, 0, 1),
          base = BASES[t.base - 1];
        s.ball = V(
          lerp(t.from.x, base.x, u),
          lerp(1.2, 1.05, u) + Math.sin(Math.PI * u) * (l.kind === "batted" ? 1.5 : 0.6),
          lerp(t.from.z, base.z, u),
        );
        if (
          l.elapsed + 1e-8 >= t.startedAt + t.duration &&
          t.receivedAt === null &&
          Math.hypot(l.defenders[t.receiver].x - base.x, l.defenders[t.receiver].z - base.z) < 1
        ) {
          t.receivedAt = l.elapsed;
          l.state = "보유";
          const forced = this.forcedRunner(l, t.base),
            back = this.returningRunner(l, t.base);
          if (forced && t.runnerId === forced.id) this.retire(l, forced, t.base, "force");
          else if (back && back.progress > t.base + RULES.tagReach / BASE_PATH_LENGTH)
            // The ball beat the runner back to the bag: tagged before he could touch it.
            this.retire(l, back, t.base, "tag");
          else
            s.detail =
              (t.base === 4 ? "홈" : t.base + "루") + " 포구 · 베이스에 도착한 주자는 세이프";
          if (
            forced?.out &&
            s.outs < 3 &&
            l.throws === 1 &&
            (s.autoField || this.batting) &&
            t.base > 1
          ) {
            l.fielder = t.receiver;
            l.fielderPos = l.defenders[t.receiver];
            const relay = this.chooseThrow(l, true);
            if (relay) {
              l.fieldedAt = l.elapsed;
              l.throw = null;
              l.requestedBase = relay;
              l.state = "포구";
            }
          }
        }
      }
    }
    const settled = l.runners.every(runnerSettled);
    if (
      s.outs >= 3 ||
      (settled &&
        (l.throw?.receivedAt != null ||
          (l.state === "보유" && !l.throw) ||
          // Never announce the result while the ball is still loose (safety timeout only).
          (l.fieldedAt === null && l.elapsed > l.flightTime + 15)))
    )
      this.resolvePlay();
  }
  /** Runs that count on this play, and the base each surviving runner ends on. */
  private settleRunners(l: LivePlay, cancelRuns: boolean) {
    const s = this.state,
      thirdOut = s.outs >= 3 ? l.outs.at(-1) : null;
    const scored = l.runners.filter(
      (r) =>
        !r.out && r.scoredAt !== null && !cancelRuns && (!thirdOut || r.scoredAt! < thirdOut.time),
    ).length;
    const next = [false, false, false];
    for (const r of l.runners)
      if (!r.out && r.progress >= 1 && r.progress < 4) next[Math.floor(r.progress) - 1] = true;
    s.bases = next;
    this.addRuns(scored);
    return scored;
  }
  private resolvePlay() {
    const s = this.state,
      l = s.live;
    if (!l || s.phase !== "inplay") return;
    if (l.kind !== "batted") {
      this.resolveBasePlay(l);
      return;
    }
    const thirdOut = s.outs >= 3 ? l.outs.at(-1) : null;
    const cancelRuns =
      !!thirdOut &&
      (thirdOut.force ||
        thirdOut.kind === "fly" ||
        (thirdOut.runnerId === 0 && thirdOut.base === 1));
    const scored = this.settleRunners(l, cancelRuns);
    const force = l.outs.some((o) => o.force),
      batter = l.runners[0],
      n = Math.min(4, Math.floor(batter.progress));
    const hit = !l.caughtFly && !force && n >= 1;
    if (hit && !l.error) {
      s.hits[this.batting ? 1 : 0]++;
      if (this.batting && s.mode === "match") {
        this.matchHits++;
        this.earn(n >= 4 ? 10 : 3 + n);
      }
    }
    if (l.error) s.errors[this.batting ? 0 : 1]++;
    if (hit) {
      s.practice.hits++;
      s.practice.best = Math.max(s.practice.best, Math.round(distance(V(), l.land)));
    }
    this.advanceBatter();
    let message = "",
      detail = "";
    if (l.caughtFly) {
      const doubled = l.outs.find((o) => o.kind === "tag");
      message = doubled ? "DOUBLE PLAY" : "FLY OUT";
      detail = doubled
        ? `뜬공 포구 · 귀루하던 주자를 ${doubled.base}루에서 태그 · 병살`
        : l.sacrifice && scored
          ? "뜬공 포구 · 태그업으로 1득점"
          : l.runners.length > 1
            ? "땅에 닿기 전 포구 · 타자 아웃, 주자 귀루"
            : "땅에 닿기 전 포구 · 타자 아웃";
    } else if (l.outs.length >= 2) {
      message = "DOUBLE PLAY";
      detail = "연속 포스 아웃 · 병살";
    } else if (l.outs.length) {
      const out = l.outs[0];
      message = out.kind === "tag" ? "TAG OUT" : out.runnerId === 0 ? "OUT" : "FIELDER’S CHOICE";
      detail =
        (out.base === 4 ? "홈" : out.base + "루") +
        (out.kind === "tag" ? " 태그 아웃" : " 포스 아웃") +
        (out.runnerId !== 0 ? " · 타자 출루" : "");
    } else if (l.error) {
      message = "ERROR";
      detail = "포구 실패로 출루";
    } else {
      message = n === 4 ? "HOME RUN" : n === 3 ? "TRIPLE" : n === 2 ? "DOUBLE" : "SINGLE";
      detail = n === 4 ? "담장을 넘겼습니다!" : n + "루타 · 주자 도착 확인";
    }
    this.result(
      message,
      detail,
      l.outs.length ? (this.batting ? "red" : "gold") : this.batting ? "gold" : "red",
      2.3,
    );
  }
  /** Verdict of a steal, pickoff or wild-pitch play. The batter and the count stay as they are. */
  private resolveBasePlay(l: LivePlay) {
    const s = this.state,
      scored = this.settleRunners(l, false),
      out = l.outs[0],
      where = (b: number) => (b === 4 ? "홈" : b + "루"),
      call = l.call ? ` · ${l.call}` : "";
    let message = "",
      detail = "",
      good: boolean;
    if (l.kind === "pickoff") {
      message = out ? "PICKOFF OUT" : "SAFE";
      detail = out
        ? `${where(out.base)} 견제사 · 귀루보다 태그가 빨랐습니다`
        : `${where(l.throwBase)} 견제 · 주자가 먼저 귀루했습니다`;
      good = !!out !== this.batting;
    } else if (l.kind === "steal") {
      message = out ? "CAUGHT STEALING" : "STOLEN BASE";
      detail =
        (out ? "2루 도루 저지 · 송구가 먼저 도착" : "2루 도루 성공 · 주자가 먼저 도착") + call;
      good = !out === this.batting;
    } else {
      s.lastOutcome = "WildPitch";
      message = "WILD PITCH";
      detail =
        "폭투 · 포수가 공을 놓쳤습니다 · " +
        (scored ? `${scored}점 득점 · ` : "") +
        (out
          ? `${where(out.base)} 태그 아웃`
          : l.runners.some((r) => r.progress > r.from + 1e-6)
            ? "주자 진루"
            : "주자는 베이스에 머뭅니다") +
        call;
      good = this.batting;
    }
    this.result(message, detail, good ? "gold" : "red", 2.3);
  }
  advanceRunners(n: number) {
    const s = this.state;
    let runs = 0;
    const next = [false, false, false];
    for (let i = 2; i >= 0; i--)
      if (s.bases[i]) {
        if (i + n >= 3) runs++;
        else next[i + n] = true;
      }
    if (n >= 4) runs++;
    else next[n - 1] = true;
    s.bases = next;
    this.addRuns(runs);
  }
  /** Base runners still on their bags at the start of a non-batted play, with a lead. */
  private baseRunners(lead: number, reaction: number): RunnerTrack[] {
    const s = this.state,
      pace = this.runnerPace(this.batting ? this.runnerOnFirst.speed : this.batter.speed);
    return [1, 2, 3]
      .filter((i) => s.bases[i - 1])
      .map((i) => ({
        id: i,
        from: i,
        progress: i + lead / BASE_PATH_LENGTH,
        target: i,
        pace,
        fullPace: pace,
        delay: reaction,
        out: false,
        scoredAt: null,
      }));
  }
  /** Shared shape of the steal / pickoff / wild-pitch plays (no batted ball, no batter runner). */
  private basePlay(
    kind: LivePlay["kind"],
    fielder: number,
    runners: RunnerTrack[],
    opts: Partial<LivePlay>,
  ): LivePlay {
    const defenders = DEFENSE.map((p) => ({ ...p })),
      at = { ...defenders[fielder] };
    return {
      kind,
      hold: 0.3,
      throwSpeed: this.stageRules.throwSpeed,
      call: "",
      start: at,
      land: at,
      duration: 6,
      elapsed: 0,
      fielder,
      fielderPos: defenders[fielder],
      state: "포구",
      throwBase: 0,
      manual: false,
      quality: 0,
      resultBases: 1,
      runnerStart: [...this.state.bases],
      ground: true,
      bounced: true,
      flightTime: 0,
      height: 0,
      catchAt: 0,
      catchPoint: at,
      caughtFly: false,
      fieldedAt: 0,
      defenders,
      runners,
      throw: null,
      requestedBase: null,
      throws: 0,
      outs: [],
      error: false,
      sacrifice: false,
      ...opts,
    };
  }
  /**
   * Wild pitch: the catcher cannot hold the ball, it skips to the backstop and the runners
   * take what the catcher's chase allows. The ball's path depends on how badly it missed.
   */
  private startWildPitch(call: string) {
    const s = this.state,
      f = s.flight!,
      side = f.target.x === 0 ? (this.rng() < 0.5 ? -1 : 1) : Math.sign(f.target.x),
      reach = clamp(9 + Math.abs(f.target.x) * 9 + (0.25 - f.target.y) * 30, 8, 18),
      // It has already skipped past the catcher's glove when the play starts.
      start = V(clamp(f.target.x * 1.5, -1.2, 1.2), 0.12, -3.2),
      land = V(clamp(f.target.x + side * reach * 0.45, -16, 16), 0.12, -reach),
      runners = this.baseRunners(RULES.runnerLead, RULES.runnerReaction);
    s.stealTrack = null;
    s.lastOutcome = "WildPitch";
    const l = this.basePlay("wild", 1, runners, {
      call,
      start,
      land,
      flightTime: Math.max(0.5, distance(start, land) / 14),
      fieldedAt: null,
      state: "추적",
    });
    // Each runner (lead runner first) reads the catcher's chase: he takes a base when he
    // beats the pickup-and-throw with time to spare, a second one if the ball got far
    // enough away. A runner never passes the one ahead of him.
    const chase = this.interceptTime(l, l.defenders[1]) + l.hold;
    let limit = 5;
    for (const r of [...runners].sort((a, b) => b.from - a.from)) {
      let target = r.from;
      for (const base of [r.from + 1, r.from + 2]) {
        if (base > 4 || base >= limit) break;
        const throwAt = this.throwArrival(l, base, chase),
          runAt = r.delay + (base - r.progress) / r.pace;
        if (runAt + RULES.advanceMargin >= throwAt) break;
        target = base;
      }
      r.target = target;
      limit = target === 4 ? 5 : target;
    }
    s.live = l;
    s.phase = "inplay";
    s.message = "WILD PITCH!";
    s.detail = "공이 포수 뒤로 빠졌습니다 · 주자 진루 시도";
    s.resultTone = this.batting ? "gold" : "red";
    this.sound("call");
    this.emit();
  }
  /** When a throw from where the ball will be picked up reaches `base` (s from play start). */
  private throwArrival(l: LivePlay, base: number, pickup: number) {
    const bag = BASES[base - 1],
      at = this.liveBall(l, pickup),
      cover = l.defenders[this.receiver(base, l.fielder)],
      eta = Math.max(0, Math.hypot(cover.x - bag.x, cover.z - bag.z) - 0.9) / 8.2;
    return Math.max(pickup + Math.max(0.22, distance(at, bag) / l.throwSpeed), eta + 0.02);
  }
  /** E-steal: the pitch reached the catcher, who throws to second. Arrival order decides. */
  private startStealThrow(call: string) {
    const s = this.state,
      stage = this.stageRules,
      runner = s.stealTrack!,
      others = this.baseRunners(RULES.runnerLead, RULES.runnerReaction).filter((r) => r.from !== 1);
    s.stealTrack = null;
    const l = this.basePlay("steal", 1, [{ ...runner }, ...others], {
      call,
      hold: stage.catcherTransfer + this.rng() * RULES.catcherTransferGamble,
      throwSpeed: stage.catcherArm,
      requestedBase: 2,
    });
    // The middle infielder broke for the bag when the runner went (about one delivery ago).
    const cover = l.defenders[this.receiver(2, 1)];
    this.moveFielder(cover, BASES[1], 1);
    l.start = V(s.flight?.target.x ?? 0, s.flight?.target.y ?? 1, 0);
    s.ball = { ...l.fielderPos, y: 1 };
    s.live = l;
    s.phase = "inplay";
    s.message = "도루!";
    s.detail = "포수가 공을 잡자마자 2루로 송구합니다";
    s.resultTone = "neutral";
    this.emit();
  }
  /**
   * Pickoff: instead of pitching, the pitcher throws to a base. The runner dives back from his
   * lead; the fielder tags him if the ball wins the race to the bag.
   */
  pickoff(base: number) {
    const s = this.state;
    if (
      s.mode !== "match" ||
      this.batting ||
      s.phase !== "ready" ||
      s.paused ||
      base < 1 ||
      base > 3 ||
      !s.bases[base - 1]
    )
      return false;
    const gamble = RULES.runnerLeadGamble * this.stageRules.leadGamble,
      runners = this.baseRunners(RULES.runnerLead, RULES.runnerReaction);
    for (const r of runners) {
      r.progress = r.from + (RULES.runnerLead + this.rng() * gamble) / BASE_PATH_LENGTH;
      // Only the runner being thrown at dives back; the others just step back to the bag.
      r.delay =
        r.from === base
          ? RULES.runnerReaction +
            this.rng() * RULES.runnerReactionGamble * this.stageRules.leadGamble
          : 0.4;
    }
    const l = this.basePlay("pickoff", 0, runners, {
      hold: RULES.pickoffMove,
      throwSpeed: RULES.pickoffThrowSpeed,
      requestedBase: base,
    });
    // The first baseman holds the runner on; at second and third the fielder breaks for the
    // bag on the pitcher's sign, a moment before the throw.
    if (base === 1) Object.assign(l.defenders[2], V(BASES[0].x - 1.2, 0, BASES[0].z + 0.6));
    else this.moveFielder(l.defenders[this.receiver(base, 0)], BASES[base - 1], 0.9);
    s.flight = null;
    s.ball = { ...l.fielderPos, y: 1.6 };
    s.live = l;
    s.phase = "inplay";
    s.message = "견제!";
    s.detail = `${base}루 견제구 · 주자 귀루`;
    s.resultTone = "neutral";
    this.sound("wind");
    this.emit();
    return true;
  }
  /**
   * E: steal call for the runner on first (STEAL_READY). He breaks with the next pitch;
   * pressing again cancels. Only first → second for now.
   */
  steal() {
    const s = this.state;
    if (!this.batting || s.mode !== "match" || s.phase !== "ready" || s.paused) return false;
    if (!s.bases[0] || s.bases[1]) return false;
    s.stealCall = !s.stealCall;
    s.message = s.stealCall ? "도루 사인!" : "도루 취소";
    s.detail = s.stealCall
      ? "투수가 투구를 시작하면 1루 주자가 2루로 뜁니다"
      : "1루 주자는 그대로 대기합니다";
    this.emit();
    return true;
  }
  next() {
    const s = this.state;
    if (s.phase !== "result") return;
    if (s.mode !== "match") {
      s.balls = 0;
      s.strikes = 0;
      s.outs = 0;
      s.bases = [false, false, false];
      this.ready();
      return;
    }
    if (s.inning >= s.maxInnings && s.half === "bottom" && s.score[1] > s.score[0]) {
      this.finish();
      return;
    }
    if (s.outs >= 3) {
      if (s.half === "top" && s.inning >= s.maxInnings && s.score[1] > s.score[0]) {
        this.finish();
        return;
      }
      if (s.half === "bottom" && s.inning >= s.maxInnings) {
        this.finish();
        return;
      }
      s.phase = "between";
      s.message = s.half === "top" ? "공수 교대 · 우리의 공격" : "공수 교대 · 마운드로";
      s.detail = "준비되면 다음 이닝을 시작하세요";
      this.emit();
      return;
    }
    this.ready();
  }
  private ready() {
    const s = this.state;
    s.phase = "ready";
    s.flight = null;
    s.live = null;
    s.stealTrack = null;
    // A steal call only stands while there is still a runner on first and second is open.
    if (!this.batting || !s.bases[0] || s.bases[1]) s.stealCall = false;
    s.timer = 1.6;
    s.ball = V(0.35, 1.85, 18.44);
    s.message = this.batting ? "다음 공을 기다리세요" : "다음 승부를 준비하세요";
    s.detail = this.batting ? "조준 후 클릭 / Space 스윙" : "목표 지점을 클릭하면 투구합니다";
    s.resultTone = "neutral";
    this.emit();
  }
  continueInning() {
    const s = this.state;
    if (s.phase !== "between") return;
    s.bases = [false, false, false];
    s.outs = 0;
    s.strikes = 0;
    s.balls = 0;
    if (s.half === "top") s.half = "bottom";
    else {
      s.half = "top";
      s.inning++;
      s.energy = clamp(s.energy + 4, 0, 100);
    }
    if (s.autoCamera) s.camera = this.batting ? "catcher" : "pitcher";
    this.ready();
  }
  private finish() {
    const s = this.state;
    s.phase = "finished";
    s.message =
      s.score[1] > s.score[0] ? "VICTORY" : s.score[1] === s.score[0] ? "DRAW" : "GAME OVER";
    const [away, home] = this.teams;
    s.detail = `${away} ${s.score[0]} : ${s.score[1]} ${home}`;
    if (!this.recorded) {
      this.recorded = true;
      const c = s.career;
      c.games++;
      if (s.score[1] > s.score[0]) c.wins++;
      c.strikeouts += this.matchStrikeouts;
      c.hits += this.matchHits;
      c.runs += this.matchRuns;
      c.outs += (s.inning - 1) * 3 + (s.half === "bottom" ? 3 : s.outs);
      // A finished match closes the day; a night's sleep restores a little energy.
      c.energy = clamp(Math.round(s.energy) + 25, 0, 100);
      c.day++;
      c.actions = DAY_ACTIONS;
      c.form = clamp(c.form - 4, 0, 100);
      const gain = clamp(
        Math.round(
          clamp(
            7 + this.matchStrikeouts + s.hits[1] - s.score[0] + (s.score[1] > s.score[0] ? 5 : 0),
            3,
            18,
          ) * this.stageRules.gaugeGain,
        ),
        2,
        18,
      );
      const before = c.scout;
      c.scout = clamp(c.scout + gain, 0, 100);
      s.lastScout = { before, after: c.scout };
      const team = teamOf(c.team);
      // The dream comes true: the watching club offers a contract at 100.
      if (c.stage === "high" && team && c.scout >= 100 && !c.draft) {
        c.draft = `${team.city} ${team.name} 입단`;
        c.club = team.id;
        c.history = [`${team.name} 스카우트의 입단 제의! 꿈이 이루어졌다`, ...c.history];
      }
      // Pro stage: the same gauge is the manager's trust; full trust opens the rotation.
      if (c.stage === "pro" && c.scout >= 100 && !c.proGoal) {
        c.proGoal = true;
        c.history = [`${STAGES.pro.goalReward}! 감독이 선발 한 자리를 맡겼다`, ...c.history];
      }
      const won = s.score[1] > s.score[0],
        xp = s.matchXp + 20 + (won ? 15 : s.score[1] === s.score[0] ? 5 : 0);
      c.xp += xp;
      s.lastXpGain = xp;
      s.detail += ` · 경험치 +${xp} XP`;
      c.history = [
        `${c.day - 1}일차 경기 · ${won ? "승리" : s.score[1] === s.score[0] ? "무승부" : "패배"} ${s.score[1]}:${s.score[0]} · +${xp} XP · 스카우트 +${gain}`,
        ...c.history,
      ].slice(0, 12);
      this.persist();
    }
    this.emit();
  }
  resetPitch() {
    const s = this.state;
    if (s.mode === "match") {
      if (s.phase === "result") this.next();
      return;
    }
    s.balls = 0;
    s.strikes = 0;
    s.batFeedback = null;
    this.ready();
  }
  get matchActive() {
    const s = this.state;
    return (
      s.mode === "match" &&
      s.phase !== "finished" &&
      (s.pitchCount[0] + s.pitchCount[1] > 0 || s.order[0] + s.order[1] > 0 || s.phase === "windup")
    );
  }
  /** quality 0–1 comes from the training minigame (0.6 = an ordinary session). */
  train(kind: string, quality = 0.6) {
    if (this.matchActive)
      return {
        ok: false,
        message: "경기 중에는 훈련할 수 없습니다. 경기를 마치거나 연습 모드로 전환하세요.",
      };
    const s = this.state,
      c = s.career,
      options: Record<
        string,
        { cost: number; stat?: keyof Career["stats"]; gain: number; name: string }
      > = {
        bullpen: { cost: 18, stat: "control", gain: 1, name: "불펜 제구 훈련" },
        weights: { cost: 22, stat: "velocity", gain: 1, name: "하체·코어 훈련" },
        breaking: { cost: 18, stat: "movement", gain: 1, name: "변화구 그립 훈련" },
        running: { cost: 16, stat: "stamina", gain: 1, name: "러닝·회복력 훈련" },
        batting: { cost: 20, stat: "contact", gain: 1, name: "타격 훈련" },
        power: { cost: 22, stat: "power", gain: 1, name: "타격 파워 훈련" },
        study: { cost: 6, gain: 4, name: "영상 분석·학교 수업" },
        rest: { cost: -38, gain: 8, name: "휴식·컨디션 회복" },
      },
      o = options[kind];
    if (!o) return { ok: false, message: "알 수 없는 훈련" };
    if (c.actions <= 0)
      return {
        ok: false,
        message: "오늘 행동력을 모두 썼습니다. 경기를 치르면 다음 날로 넘어갑니다.",
      };
    if (c.energy < o.cost) return { ok: false, message: "체력이 부족합니다. 먼저 휴식하세요." };
    if (o.stat && c.stats[o.stat] >= 99)
      return { ok: false, message: "이미 최고 능력치입니다. 다른 훈련을 선택하세요." };
    const q = clamp(Number.isFinite(quality) ? quality : 0, 0, 1),
      grade = q >= 0.85 ? "완벽" : q >= 0.4 ? "좋음" : "아쉬움";
    if (o.stat) o.gain = q >= 0.85 ? 2 : q >= 0.4 ? 1 : 0;
    else if (kind === "study") o.gain = Math.round(2 + q * 4);
    c.energy = clamp(c.energy - o.cost, 0, 100);
    c.actions--;
    c.xp += kind === "rest" ? 2 : 5;
    if (o.stat) c.stats[o.stat] = clamp(c.stats[o.stat] + o.gain, 0, 99);
    else c.form = clamp(c.form + o.gain, 0, 100);
    if (o.stat) c.form = clamp(c.form - 2, 0, 100);
    c.scout = clamp(c.scout + (o.stat ? 0.5 : 0), 0, 100);
    c.history = [
      `${c.day}일차 · ${o.name}${o.stat ? ` (${grade}) +${o.gain}` : ""}`,
      ...c.history,
    ].slice(0, 12);
    s.energy = c.energy;
    this.persist();
    this.emit();
    return {
      ok: true,
      grade,
      gain: o.gain,
      message: `${o.name} ${o.stat ? `${grade} · ${statLabel(o.stat)} +${o.gain}` : "완료"} · 남은 행동력 ${c.actions}/${DAY_ACTIONS}`,
    };
  }
  /** Starting roulette: grants one random pitch once per career. Returns the pitch or null. */
  receiveBlessing() {
    const c = this.state.career;
    if (c.blessing) return null;
    const pool = BLESSINGS.filter((b) => !c.pitches.includes(b.id));
    if (!pool.length) {
      c.blessing = "none";
      return null;
    }
    let roll = this.rng() * pool.reduce((a, b) => a + b.weight, 0);
    const pick = pool.find((b) => (roll -= b.weight) < 0) ?? pool[pool.length - 1];
    const p = PITCHES.find((p) => p.id === pick.id)!;
    c.pitches = [...c.pitches, pick.id];
    c.blessing = pick.id;
    c.history = [`신이 내린 ${pick.tier} · ${p.name}을(를) 손에 넣었다`, ...c.history].slice(0, 12);
    this.persist();
    this.emit();
    return pick.id;
  }
  chooseTeam(id: string) {
    const t = teamOf(id);
    if (!t) return false;
    this.state.career.team = id;
    this.persist();
    this.emit();
    return true;
  }
  /** Creation screen: validates the point spread, then starts the career. */
  createPlayer(name: string, stats: Career["stats"]) {
    const keys = Object.keys(newCareer().stats) as (keyof Career["stats"])[],
      spent = keys.reduce((a, k) => a + (stats[k] - STAT_BASE), 0);
    if (
      !keys.every(
        (k) => Number.isInteger(stats[k]) && stats[k] >= STAT_BASE && stats[k] <= STAT_CAP,
      ) ||
      spent > STAT_POINTS
    )
      return { ok: false, message: "능력치 분배가 올바르지 않습니다." };
    const c = this.state.career;
    c.name = name.trim().slice(0, 12) || "나의 선수";
    c.stats = { ...stats };
    c.created = true;
    c.history = [`${c.name}, 고교 3학년 마지막 시즌을 시작하다.`];
    this.persist();
    this.emit();
    return { ok: true, message: "선수 등록 완료" };
  }
  resetCareer() {
    this.state.career = newCareer();
    this.persist();
    this.start("match");
  }
  buyPitch(id: PitchId) {
    const c = this.state.career,
      p = PITCHES.find((p) => p.id === id);
    if (!p) return { ok: false, message: "알 수 없는 구종" };
    if (c.pitches.includes(id)) return { ok: false, message: "이미 익힌 구종입니다." };
    if (c.xp < p.cost)
      return { ok: false, message: `경험치가 ${p.cost - c.xp} XP 부족합니다. 경기를 더 치르세요.` };
    c.xp -= p.cost;
    c.pitches = [...c.pitches, id];
    c.history = [`${c.day}일차 · 새 구종 ${p.name} 습득 (−${p.cost} XP)`, ...c.history].slice(
      0,
      12,
    );
    this.persist();
    this.emit();
    return { ok: true, message: `${p.name}을(를) 익혔습니다! 투구 플랜에서 선택하세요.` };
  }
  rename(name: string) {
    const n = name.trim().slice(0, 12);
    if (!n) return false;
    this.state.career.name = n;
    this.persist();
    this.emit();
    return true;
  }
  /**
   * After the signing ending: the same player continues on the pro stage. Pro mode stays
   * unlocked in the save; the gauge now measures the manager's trust (new goal).
   */
  enterPro() {
    const c = this.state.career,
      club = teamOf(c.club);
    if (!club || this.matchActive) return false;
    if (c.stage === "pro") return true;
    c.stage = "pro";
    c.proUnlocked = true;
    c.proGoal = false;
    c.scout = 30;
    c.energy = 100;
    c.actions = DAY_ACTIONS;
    c.history = [
      `${club.city} ${club.name} 입단식 · 프로 무대 데뷔를 준비하다`,
      ...c.history,
    ].slice(0, 12);
    this.persist();
    this.start("match");
    return true;
  }
  draft() {
    const c = this.state.career;
    if (c.stage === "pro") return { ok: false, message: "이미 프로 무대에서 뛰고 있습니다." };
    if (c.games < 3)
      return { ok: false, message: "스카우트가 평가하려면 공식 경기 3회가 필요합니다." };
    if (c.draft) return { ok: false, message: "이번 시즌의 진로가 이미 결정되었습니다." };
    c.draft = c.scout >= 65 ? "프로 구단 지명" : c.scout >= 42 ? "육성선수 계약" : "대학 진학";
    c.history = [`시즌 결산 · ${c.draft}`, ...c.history].slice(0, 12);
    this.persist();
    this.emit();
    return { ok: true, message: c.draft };
  }
}
