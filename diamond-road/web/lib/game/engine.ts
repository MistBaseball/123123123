export type Vec = { x: number; y: number; z: number };
export type Mode = "match" | "bullpen" | "batting";
export type Camera = "pitcher" | "catcher" | "broadcast" | "ball" | "top";
export type Phase = "ready" | "windup" | "flight" | "inplay" | "result" | "between" | "finished";
export type PitchId = "fastball" | "slider" | "curve" | "changeup" | "cutter" | "splitter";
export const PITCHES: {
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
}[] = [
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
  },
];
// AI pitchers only use the four original pitch types.
const AI_PITCHES = 4;
/** Contact swing timing: the ideal moment as a share of the visible flight. */
export const SWING_SWEET = 0.92;
export const SWING_GOOD = 0.045;
export const swingWindow = (difficulty: "easy" | "normal" | "hard") =>
  difficulty === "easy" ? 0.26 : difficulty === "normal" ? 0.18 : 0.12;
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
export const FIELDER_SPEED = 5.6;
export const FIELDER_REACTION = 0.4;
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
export type RunnerTrack = {
  id: number;
  from: number;
  progress: number;
  target: number;
  pace: number;
  delay: number;
  out: boolean;
  scoredAt: number | null;
};
export function runnerPose(r: RunnerTrack) {
  const step = Math.min(3, Math.floor(r.progress)),
    t = clamp(r.progress - step, 0, 1),
    a = BASES[(step + 3) % 4],
    b = BASES[step];
  return {
    position: V(lerp(a.x, b.x, t), 0, lerp(a.z, b.z, t)),
    facing: V(b.x - a.x, 0, b.z - a.z),
    moving: !r.out && r.progress < r.target,
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
    const team = teamOf(this.state.career.team);
    if (mode === "match" && team) {
      this.state.detail = `${team.city} ${team.name} ${team.scout} 스카우트가 관중석에서 지켜봅니다`;
      this.state.log = [`${team.name} 스카우트 관전 · 하늘고 vs 한빛고`];
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
      pitch = ai
        ? PITCHES[Math.floor(this.rng() * AI_PITCHES)]
        : PITCHES.find((p) => p.id === s.selected)!;
    const fatigue = ai ? Math.max(0, s.pitchCount[0] - 25) * 0.18 : 100 - s.energy;
    const formPenalty = ai ? 0 : (100 - s.career.form) * 0.02;
    const speed = clamp(
      (ai ? 135 : 110 + stats.velocity * 0.43) +
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
    const sigma = ai
      ? 0.04
      : (0.022 + (100 - stats.control) * 0.0019 + fatigue * 0.0016 + (s.effort - 70) * 0.001) *
        (1 + (100 - s.career.form) * 0.003);
    const target = V(
        clamp(aim.x + gaussian(this.rng) * sigma, -1.05, 1.05),
        clamp(aim.y + gaussian(this.rng) * sigma, 0.09, 2.1),
        0,
      ),
      start = V(0.35, 1.85, 18.44),
      arc = ballistic(start, target, speed / 3.6)!;
    const slow = s.difficulty === "easy" ? 2.5 : s.difficulty === "normal" ? 1.8 : 1.2;
    // The batter reads a zone around the true crossing point. The true point is always inside.
    let hint: Flight["hint"] = null;
    if (ai) {
      const r = contactHintRadius(stats.contact),
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
    };
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
      if (s.timer <= 0) {
        s.phase = "flight";
        s.pitchCount[this.batting ? 0 : 1]++;
        s.practice.pitches++;
        if (!this.batting && s.mode === "match")
          s.energy = clamp(
            s.energy - (0.38 + (s.effort - 70) * 0.012) * (1.3 - s.career.stats.stamina / 180),
            0,
            100,
          );
      }
    } else if (s.phase === "flight" && s.flight) {
      const f = s.flight;
      f.elapsed += dt;
      const u = clamp(f.elapsed / f.visualDuration, 0, 1);
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
    if (this.batting) {
      if (f.swung) {
        const timing = f.swingTime / f.visualDuration - SWING_SWEET,
          spatial = Math.hypot(f.batAim.x - f.target.x, f.batAim.y - f.target.y),
          window = swingWindow(s.difficulty),
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
        if (zone) this.strike(false, "스트라이크 존 통과");
        else this.ball();
      }
    } else {
      const b = this.batter,
        edge = Math.max(Math.abs(f.target.x) / 0.25, Math.abs(f.target.y - 0.95) / 0.4),
        chase = clamp(0.46 - b.eye * 0.004 + (f.pitch !== "fastball" ? 0.1 : 0), 0.06, 0.45),
        swing = this.rng() < (zone ? 0.69 : chase * Math.max(0.1, 1.6 - edge * 0.5));
      if (swing) {
        const difficulty = s.difficulty === "hard" ? 0.1 : s.difficulty === "easy" ? -0.12 : 0,
          prob = clamp(
            0.3 +
              b.contact * 0.005 -
              (f.speed - 120) * 0.0035 +
              (100 - s.energy) * 0.002 -
              (f.pitch !== "fastball" ? 0.09 : 0) +
              difficulty,
            0.2,
            0.9,
          );
        if (this.rng() < prob) {
          const q = clamp(
            0.15 + this.rng() * 0.75 + b.power * 0.001 - Math.max(0, edge - 0.65) * 0.25,
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
    if (s.strikes >= 3) {
      s.outs++;
      if (!this.batting && s.mode === "match") {
        this.matchStrikeouts++;
        this.earn(3);
      }
      this.advanceBatter();
      this.result("STRIKEOUT", swing ? "헛스윙 삼진" : "루킹 삼진", this.batting ? "red" : "gold");
    } else this.result(swing ? "SWING & MISS" : "STRIKE", detail, this.batting ? "red" : "gold");
  }
  private foul() {
    const s = this.state;
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
    if (s.balls >= 4) {
      this.walk();
      if (this.batting) this.earn(1);
      this.result("BASE ON BALLS", "볼넷 · 타자 1루 진루", this.batting ? "gold" : "red");
    } else this.result("BALL", "스트라이크 존 바깥", this.batting ? "gold" : "neutral");
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
    const pace = ((6.2 + this.batter.speed * 0.02) / BASE_PATH_LENGTH) * (hr ? 1.65 : 1);
    const runners: RunnerTrack[] = [0, 1, 2, 3]
      .filter((i) => i === 0 || s.bases[i - 1])
      .map((i) => ({
        id: i,
        from: i,
        progress: i,
        target: hr || ground || s.outs === 2 ? Math.min(4, i + bases) : i === 0 ? 1 : i,
        pace,
        delay: i === 0 ? 0.12 : 0,
        out: false,
        scoredAt: null,
      }));
    s.live = {
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
          : "뜬공 · 기존 주자는 포구를 확인합니다";
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
    for (let t = 0.05; t <= 12; t += 0.05) {
      const p = this.liveBall(l, t);
      if (Math.hypot(p.x - from.x, p.z - from.z) / FIELDER_SPEED + FIELDER_REACTION <= t) return t;
    }
    return Infinity;
  }
  /** Earliest point on the ball's ground path the chasing fielder can reach in time. */
  private interceptPoint(l: LivePlay) {
    const wait = Math.max(0, FIELDER_REACTION - l.elapsed);
    for (let dt = 0.05; dt <= 12; dt += 0.05) {
      const t = l.elapsed + dt;
      if (t < Math.min(l.flightTime, l.elapsed + 0.05) && !l.ground) continue;
      const p = this.liveBall(l, t);
      if (Math.hypot(p.x - l.fielderPos.x, p.z - l.fielderPos.z) / FIELDER_SPEED + wait <= dt)
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
    return normal === fielder ? (base === 1 ? 0 : 4) : normal;
  }
  private forcedRunner(l: LivePlay, base: number) {
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
      null
    );
  }
  /** Throw flight time; it never lands before the covering fielder reaches the bag. */
  private throwTime(l: LivePlay, base: number) {
    const bag = BASES[base - 1],
      cover = l.defenders[this.receiver(base, l.fielder)],
      eta = Math.max(0, Math.hypot(cover.x - bag.x, cover.z - bag.z) - 0.9) / 8.2;
    return Math.max(0.22, distance(l.fielderPos, bag) / 29, eta + 0.02);
  }
  private chooseThrow(l: LivePlay, forceOnly = false) {
    const options: { base: number; priority: number }[] = [];
    for (let base = 1; base <= 4; base++) {
      const forced = this.forcedRunner(l, base),
        r = forced ?? (!forceOnly ? this.candidateRunner(l, base) : null);
      if (!r) continue;
      const travel = this.throwTime(l, base),
        arrival = (base - r.progress) / r.pace;
      if (travel + 0.08 < arrival) options.push({ base, priority: (forced ? 10 : 0) + base });
    }
    const best = options.sort((a, b) => b.priority - a.priority)[0]?.base;
    if (best || forceOnly) return best ?? 0;
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
      if (r.out || r.progress >= r.target) continue;
      const remainingDelay = Math.max(0, r.delay - previousTime),
        usable = Math.max(0, dt - remainingDelay),
        before = r.progress;
      let next = Math.min(r.target, before + r.pace * usable);
      const t = l.throw;
      // A non-forced runner must actually be tagged BEFORE touching the base.
      if (
        t?.receivedAt != null &&
        t.runnerId === r.id &&
        before < t.base - 1e-8 &&
        !this.forcedRunner(l, t.base)
      ) {
        const tagLine = t.base - 0.4 / BASE_PATH_LENGTH;
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
      if (l.fieldedAt !== null) events.push(l.fieldedAt + 0.3);
      if (l.throw) events.push(l.throw.startedAt + l.throw.duration);
      const next = events.filter((t) => t > l.elapsed + 1e-8).sort((a, b) => a - b)[0];
      const step = next === undefined ? remaining : Math.min(remaining, next - l.elapsed);
      this.stepLivePlay(step);
      remaining -= step;
    }
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
      const oldPos = { ...l.fielderPos },
        // Before landing: run to the catch point. After it lands: cut off the rolling ball.
        target = !l.ground && !l.bounced ? l.catchPoint : this.interceptPoint(l);
      if (!s.autoField && !this.batting) {
        const dx = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0),
          dz = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0),
          n = Math.hypot(dx, dz) || 1;
        l.fielderPos.x = clamp(l.fielderPos.x + (dx / n) * FIELDER_SPEED * dt, -85, 85);
        l.fielderPos.z = clamp(l.fielderPos.z + (dz / n) * FIELDER_SPEED * dt, -3, 105);
      } else {
        // The fielder needs a moment to read the ball before the first step.
        const moving = Math.max(0, l.elapsed - Math.max(previous, FIELDER_REACTION));
        if (moving > 0) this.moveFielder(l.fielderPos, target, moving, FIELDER_SPEED);
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
          this.retire(l, l.runners[0], 1, "fly", l.catchAt);
          for (const r of l.runners.slice(1)) {
            r.progress = r.from;
            r.target = r.from;
            r.scoredAt = null;
          }
          if (s.outs < 3 && l.quality > 0.6 && l.land.z > 55) {
            const third = l.runners.find((r) => r.from === 3);
            if (third) {
              third.target = 4;
              third.delay = l.elapsed + 0.18;
              l.sacrifice = true;
              s.detail = "플라이 아웃 · 3루 주자 태그업";
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
        for (const r of l.runners) r.target = Math.min(4, r.from + l.resultBases);
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
        s.detail = "공을 잡았습니다 · 곧바로 송구";
      }
    }
    if (l.fieldedAt !== null) {
      if (l.caughtFly) {
        s.ball = { ...l.fielderPos, y: 1.55 };
        if (
          l.elapsed - l.fieldedAt > 0.75 &&
          (s.outs >= 3 || l.runners.every((r) => r.out || r.progress >= r.target))
        )
          this.resolvePlay();
        return;
      }
      if (l.state === "포구") {
        s.ball = { ...l.fielderPos, y: 1.2 };
        if (l.elapsed - l.fieldedAt + 1e-8 >= 0.3)
          this.beginThrow(l, l.requestedBase ?? this.chooseThrow(l));
      }
      const t = l.throw;
      if (t) {
        const u = clamp((l.elapsed - t.startedAt) / t.duration, 0, 1),
          base = BASES[t.base - 1];
        s.ball = V(
          lerp(t.from.x, base.x, u),
          lerp(1.2, 1.05, u) + Math.sin(Math.PI * u) * 1.5,
          lerp(t.from.z, base.z, u),
        );
        if (
          l.elapsed + 1e-8 >= t.startedAt + t.duration &&
          t.receivedAt === null &&
          Math.hypot(l.defenders[t.receiver].x - base.x, l.defenders[t.receiver].z - base.z) < 1
        ) {
          t.receivedAt = l.elapsed;
          l.state = "보유";
          const forced = this.forcedRunner(l, t.base);
          if (forced && t.runnerId === forced.id) this.retire(l, forced, t.base, "force");
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
    const settled = l.runners.every((r) => r.out || r.progress >= r.target);
    if (
      s.outs >= 3 ||
      (settled &&
        (l.throw?.receivedAt != null ||
          l.state === "보유" ||
          // Never announce the result while the ball is still loose (safety timeout only).
          (l.fieldedAt === null && l.elapsed > l.flightTime + 15)))
    )
      this.resolvePlay();
  }
  private resolvePlay() {
    const s = this.state,
      l = s.live;
    if (!l || s.phase !== "inplay") return;
    const thirdOut = s.outs >= 3 ? l.outs.at(-1) : null;
    const cancelRuns =
      thirdOut &&
      (thirdOut.force ||
        thirdOut.kind === "fly" ||
        (thirdOut.runnerId === 0 && thirdOut.base === 1));
    const scored = l.runners.filter(
      (r) =>
        !r.out && r.scoredAt !== null && !cancelRuns && (!thirdOut || r.scoredAt! < thirdOut.time),
    ).length;
    const next = [false, false, false];
    for (const r of l.runners)
      if (!r.out && r.progress >= 1 && r.progress < 4) next[Math.floor(r.progress) - 1] = true;
    s.bases = next;
    this.addRuns(scored);
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
      message = "FLY OUT";
      detail =
        l.sacrifice && scored ? "뜬공 포구 · 태그업으로 1득점" : "땅에 닿기 전 포구 · 타자 아웃";
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
  steal() {
    const s = this.state;
    if (!this.batting || s.mode !== "match" || s.phase !== "ready" || s.paused) return false;
    const from = s.bases[1] && !s.bases[2] ? 1 : s.bases[0] && !s.bases[1] ? 0 : -1;
    if (from < 0) return false;
    const success = this.rng() < 0.62 + this.batter.speed * 0.002;
    s.bases[from] = false;
    if (success) s.bases[from + 1] = true;
    else s.outs++;
    this.result(
      success ? "STOLEN BASE" : "CAUGHT STEALING",
      success ? `${from + 2}루 도루 성공` : `${from + 2}루 도루 저지`,
      success ? "gold" : "red",
    );
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
    s.detail = `한빛고 ${s.score[0]} : ${s.score[1]} 하늘고`;
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
        7 + this.matchStrikeouts + s.hits[1] - s.score[0] + (s.score[1] > s.score[0] ? 5 : 0),
        3,
        18,
      );
      const before = c.scout;
      c.scout = clamp(c.scout + gain, 0, 100);
      s.lastScout = { before, after: c.scout };
      const team = teamOf(c.team);
      // The dream comes true: the watching club offers a contract at 100.
      if (team && c.scout >= 100 && !c.draft) {
        c.draft = `${team.city} ${team.name} 입단`;
        c.history = [`${team.name} 스카우트의 입단 제의! 꿈이 이루어졌다`, ...c.history];
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
  draft() {
    const c = this.state.career;
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
