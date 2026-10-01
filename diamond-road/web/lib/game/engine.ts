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
  | "sweeper"
  | "screwball"
  | "palmball"
  | "eephus"
  | "knucklecurve"
  | "slurve"
  | "knuckle";
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
  /**
   * Knuckle-style wobble (m at movement 75): the ball zigzags inside a box of this size
   * around its path, in a direction chosen at release. 0/absent for ordinary pitches.
   */
  flutter?: number;
  /** Top speed (km/h) whatever the pitcher's velocity (the eephus is always a slow lob). */
  maxSpeed?: number;
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
    stamina: 1.1,
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
    stamina: 1.05,
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
    stamina: 1.3,
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
    stamina: 1.05,
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
    stamina: 1.4,
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
    desc: "옆으로 크게 쓸고 나가는 결정구 · 헛스윙 유도, 제구 난이도 높음",
    cost: 220,
    control: 1.18,
    stamina: 1.3,
    chase: 0.12,
    whiff: 0.12,
    soft: 0,
    wild: 1.1,
  },
  {
    // Breaks the "wrong" way: toward the pitcher's arm side and down (a reverse curve).
    id: "screwball",
    name: "스크류볼",
    en: "SCREWBALL",
    key: "=",
    delta: -19,
    breakX: -0.42,
    breakY: 0.36,
    color: "#f08fb0",
    desc: "슬라이더·커브와 반대로 휘며 떨어지는 역회전 공 · 팔에 부담이 커 체력 소모가 큼",
    cost: 260,
    control: 1.2,
    stamina: 1.25,
    chase: 0.13,
    whiff: 0.13,
    soft: 0.02,
    wild: 1.3,
  },
  {
    // Held deep in the palm: slow, little spin, a soft drop and a slight wobble.
    id: "palmball",
    name: "팜볼",
    en: "PALMBALL",
    key: "[",
    delta: -26,
    breakX: -0.08,
    breakY: 0.3,
    color: "#b9d98f",
    desc: "손바닥으로 감싸 던지는 느린 공 · 회전이 적어 살짝 흔들리며 떨어지고 약한 타구를 유도",
    cost: 150,
    control: 1.1,
    stamina: 0.95,
    chase: 0.1,
    whiff: 0.08,
    soft: 0.08,
    wild: 1.2,
    flutter: 0.04,
  },
  {
    // A high, slow lob that drops into the zone: the batter's timing falls apart.
    id: "eephus",
    name: "이퓨스볼",
    en: "EEPHUS",
    key: "]",
    delta: -60,
    breakX: 0,
    breakY: 0.12,
    color: "#9ad7f5",
    desc: "하늘 높이 떠서 천천히 떨어지는 초슬로볼 · 타이밍을 무너뜨리지만 읽히면 위험",
    cost: 120,
    control: 0.9,
    stamina: 0.5,
    chase: 0.08,
    whiff: 0.22,
    soft: 0.12,
    wild: 0.7,
    maxSpeed: 72,
  },
  {
    // Index finger dug into the ball: a harder, later-breaking curve.
    id: "knucklecurve",
    name: "너클 커브",
    en: "KNUCKLE CURVE",
    key: ";",
    delta: -17,
    breakX: 0.08,
    breakY: 0.6,
    color: "#b7a0ff",
    desc: "검지를 세워 강하게 채는 커브 · 빠르고 날카롭게 떨어지는 결정구",
    cost: 230,
    control: 1.2,
    stamina: 1.35,
    chase: 0.13,
    whiff: 0.15,
    soft: 0.03,
    wild: 1.4,
  },
  {
    // Between a slider and a curve: sideways and down at once.
    id: "slurve",
    name: "슬러브",
    en: "SLURVE",
    key: "'",
    delta: -14,
    breakX: 0.38,
    breakY: 0.38,
    color: "#ff9fd0",
    desc: "슬라이더처럼 옆으로, 커브처럼 아래로 휘는 대각선 결정구 · 헛스윙 유도",
    cost: 210,
    control: 1.15,
    stamina: 1.3,
    chase: 0.12,
    whiff: 0.14,
    soft: 0.02,
    wild: 1.2,
  },
];
/**
 * Hidden pitches: never sold in the shop or thrown by the AI. Each one unlocks by itself
 * when the player's stats meet its secret condition (see HIDDEN_UNLOCKS).
 */
export const HIDDEN_PITCHES: PitchData[] = [
  {
    id: "knuckle",
    name: "너클볼",
    en: "KNUCKLEBALL",
    key: "-",
    delta: -24,
    breakX: 0,
    breakY: 0.06,
    color: "#f3efd9",
    desc: "회전 없이 흔들리며 날아오는 마구 · 어디로 흔들릴지 아무도 모른다",
    cost: 0,
    control: 1.3,
    stamina: 0.6,
    chase: 0.16,
    whiff: 0.18,
    soft: 0.1,
    wild: 1.8,
    flutter: 0.16,
  },
];
/** Regular pitches first, then hidden ones. Use this for every id lookup. */
export const ALL_PITCHES: PitchData[] = [...PITCHES, ...HIDDEN_PITCHES];
export const isHiddenPitch = (id: PitchId) => HIDDEN_PITCHES.some((p) => p.id === id);
/** Secret unlock conditions (not shown anywhere in the UI). */
export const HIDDEN_UNLOCKS: { id: PitchId; test: (stats: Career["stats"]) => boolean }[] = [
  // Knuckleball: velocity never trained above the creation minimum, movement 75 or more.
  { id: "knuckle", test: (st) => st.velocity <= STAT_BASE && st.movement >= 75 },
];
export type Weather = "clear" | "rain";
/** Rain on/off from the settings, remembered in this browser (default on). */
const RAIN_KEY = "diamond-road-rain";
export const rainSetting = () => {
  try {
    return typeof localStorage === "undefined" || localStorage.getItem(RAIN_KEY) !== "off";
  } catch {
    return true;
  }
};
/**
 * The day's weather (fixed per day, so the daily screen can forecast it). Day 1 — the tutorial
 * match — is always clear; after that rain comes about RULES.rainChance of the days.
 */
export const weatherOf = (c: Pick<Career, "day" | "name" | "team">): Weather =>
  c.day > 1 && (hashName(`${c.day}|${c.name}|${c.team}|sky`) % 1000) / 1000 < RULES.rainChance
    ? "rain"
    : "clear";
/** Decisive pitch: any pitch whose description says "결정구" (data decides, no code list). */
export const isDecisive = (p: Pick<PitchData, "desc">) => p.desc.includes("결정구");
export const pitchData = (id: PitchId) => ALL_PITCHES.find((p) => p.id === id) ?? PITCHES[0];
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
  /** Diving catch: the fielder dives for a ball this far past his reach (m, fly / grounder). */
  diveReach: 3.0,
  /** Automatic fielding plans a catch this early (s) so the motion has its run-up. */
  planLead: 0.9,
  /** A dive leaves the ground this long before the glove meets the ball (s). */
  diveLead: 0.35,
  /** An outfielder takes over a grounder through the infield if he gets there this much sooner (s). */
  backupMargin: 0.25,
  /** A throw and a runner this close at a base (s) make a slow-motion replay of the call. */
  closePlay: 0.35,
  groundDiveReach: 4.0,
  /** Dive success: base chance at the edge of reach, + per point of (speed+eye)/2 over 65,
   *  − scaled by how far the ball is; capped. Rain takes some off. */
  diveBase: 0.45,
  diveSkill: 0.006,
  diveDistance: 0.38,
  diveMin: 0.08,
  diveMax: 0.85,
  diveRain: 0.15,
  /** After a dive: time on the ground (caught: before the throw; missed: before chasing again). */
  diveGetUp: 0.9,
  diveMissDown: 1.0,
  /** Every pitch's stamina cost × this (1.3 = 30% more than the original tuning). */
  staminaScale: 1.3,
  /** Decisive pitch ("결정구" in the description): the AI batter's contact −this. */
  decisiveContactDrop: 20,
  /** Limit break: free uses per match, then each extra one costs this much stamina. */
  limitBreakFree: 3,
  limitBreakEnergy: 25,
  /** Rain: chance per match, and the chance the game goes on at each new inning (coin toss). */
  rainChance: 0.1,
  rainContinue: 0.75,
  /** Rain: pitch control spread ×, km/h lost, stamina cost ×, base-running pace ×. */
  rainControl: 1.6,
  rainVelocity: 6,
  rainStamina: 1.25,
  rainRunPace: 0.9,
  /** Rain: fielders' first step (s) and arm ×; chance a fielder bobbles the pickup, and how long. */
  rainReaction: 0.08,
  rainArm: 0.9,
  rainBobble: 0.22,
  rainBobbleTime: 0.7,
  /** Rain: catcher — wild-pitch chance ×, catch-to-release (s) added, arm × on a steal. */
  rainWildPitch: 2.2,
  rainCatcherTransfer: 0.18,
  rainCatcherArm: 0.85,
  /** Hit by pitch: the ball at the plate is inside the batter's body box (m from plate center). */
  hbpInnerEdge: 0.7,
  hbpLow: 0.25,
  hbpHigh: 1.8,
  /** Runners' lead off the bag when a pitch or pickoff starts (m). */
  runnerLead: 3.2,
  /** Extra random lead an AI runner gambles with (m, 0..this). First pickoff ≈ 28% out. */
  runnerLeadGamble: 2.3,
  /** Runner reaction before going back on a pickoff / breaking on a wild pitch (s). */
  runnerReaction: 0.22,
  /** Extra random pickoff reaction when the runner is leaning the wrong way (s, 0..this). */
  runnerReactionGamble: 0.25,
  /**
   * Chance the runner still gambles on a big lead, per earlier pickoff at the same batter
   * (1st throw ≈ 23% out, 2nd ≈ 12%, 3rd ≈ 6%). Otherwise he keeps a short, safe lead.
   */
  pickoffCaution: 0.5,
  /** A pickoff throw costs this share of one pitch's energy. */
  pickoffEnergy: 0.6,
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
  /** Bunt: a slow roller that stops between these distances (m) at this speed (m/s). */
  buntMin: 3,
  buntMax: 12,
  buntSweet: 10,
  /** Bunts: the fielder's extra reaction (s) and pickup-to-throw time (s). */
  buntReaction: 0.3,
  buntHold: 0.5,
  buntSpeed: 5.5,
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
    /** Highest rating any stat can reach on this stage. */
    statCap: number;
    /** Multiplier on the stat gain from one training session. */
    trainGain: number;
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
    statCap: 100,
    trainGain: 1,
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
    statCap: 200,
    trainGain: 2,
  },
};
export const swingWindow = (
  difficulty: "easy" | "normal" | "hard",
  stage: Stage = "high",
  style: SwingStyle = "contact",
) =>
  (difficulty === "easy" ? 0.26 : difficulty === "normal" ? 0.18 : 0.12) *
  STAGES[stage].swingWindow *
  SWING_STYLES[style].window;
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
export type SwingStyle = "contact" | "power" | "bunt";
/**
 * What each swing style trades (the web counterpart of Inspector fields):
 * - reach / window: bat-area and timing-window multipliers (bigger = easier to hit)
 * - cut: a near miss within cut × reach and cut × window is fouled off instead (0 = never)
 * - foulBelow: contact weaker than this quality is a foul
 * - boost / spread: batted-ball quality after contact = q × (spread[0] + rng × spread[1]) + boost
 */
export const SWING_STYLES: Record<
  SwingStyle,
  {
    reach: number;
    window: number;
    cut: number;
    foulBelow: number;
    boost: number;
    spread: [number, number];
  }
> = {
  contact: { reach: 1.15, window: 1.15, cut: 1.5, foulBelow: 0.3, boost: 0.02, spread: [0.7, 0.2] },
  power: { reach: 0.4, window: 0.45, cut: 0, foulBelow: 0.5, boost: 0.1, spread: [0.7, 0.35] },
  bunt: { reach: 1.4, window: 1.3, cut: 0, foulBelow: 0.15, boost: 0, spread: [1, 0] },
};
/** How far (m) the bat aim may miss the ball and still make contact. */
export const batReach = (contact: number, style: SwingStyle) =>
  (0.12 + clamp(over(contact), 0, 150) * 0.001) * SWING_STYLES[style].reach;
/** Experience points: in-match plays, match result and daily actions. */
export const XP = {
  strikeout: 5,
  out: 2,
  walk: 2,
  hit: [0, 7, 10, 13, 20] as const,
  run: 4,
  complete: 40,
  win: 30,
  draw: 12,
  training: 8,
  rest: 3,
};
/** Actions (training, rest, study) available each day before the day's match. */
export const DAY_ACTIONS = 5;
export type StatKey = keyof Career["stats"];
export const STAT_NAMES: Record<StatKey, string> = {
  velocity: "구속",
  control: "제구",
  movement: "구위",
  // "지구력" so it is never confused with the current energy bar (체력).
  stamina: "지구력",
  contact: "컨택",
  power: "파워",
  speed: "주력",
};
/**
 * Ratings above 100 exist only in the pros (cap 200). Past 100 each point is worth `k` of a
 * point, so a 200 is clearly better than a 100 without breaking the physics.
 */
export const over = (v: number, k = 0.5) => (v <= 100 ? v : 100 + (v - 100) * k);
/** Player fastball speed (km/h) at 100% effort: 153 at a rating of 100, 170 at 200. */
export const fastballSpeed = (velocity: number) =>
  velocity <= 100 ? 110 + velocity * 0.43 : 153 + (velocity - 100) * 0.17;
/** Energy one pitch costs at this effort (%) and stamina rating (before the pitch's own cost). */
export const pitchEnergyCost = (effort: number, stamina: number) =>
  (0.38 + (effort - 70) * 0.012) * (1.3 - over(stamina) / 180) * RULES.staminaScale;
/** Batted-ball carry multiplier from the batter's power rating. */
export const carryScale = (power: number) => 0.78 + over(power) / 240;
/** Base-running speed (m/s) for a speed rating. */
export const runSpeed = (speed: number) => 6.2 + over(speed) * 0.02;
/** Batted balls that travel farther than this (m) are home runs. */
export const HOME_RUN_DISTANCE = 104;
/**
 * How sharply the pitcher's pitches bite against AI batters (1 at a movement of 65): scales each
 * pitch's chase / whiff / weak-contact data and slightly lowers contact on every pitch.
 */
export const movementBite = (movement: number) => clamp(over(movement), 0, 150) / 65;
/**
 * What each stat does, in plain words, with a live number from the same formulas the game
 * uses. `metric` turns a rating into that number (lower is better when `lowerIsBetter`).
 */
export const STAT_INFO: Record<
  StatKey,
  {
    role: "투구" | "타격" | "주루";
    what: string;
    label: string;
    unit: string;
    digits: number;
    lowerIsBetter?: boolean;
    metric: (v: number) => number;
    /** Training card that raises it, as in "<training> 훈련으로 상승". */
    training: string;
  }
> = {
  velocity: {
    role: "투구",
    what: "공의 빠르기. 빠를수록 타자가 늦게 반응해 헛스윙과 빗맞은 타구가 늘어요.",
    label: "전력 포심",
    unit: "km/h",
    digits: 0,
    metric: fastballSpeed,
    training: "하체·코어",
  },
  control: {
    role: "투구",
    what: "던진 공이 노린 지점에 얼마나 가깝게 가는지. 낮으면 볼넷·사구·한가운데 실투가 늘어요.",
    label: "목표 오차",
    unit: "cm",
    digits: 1,
    lowerIsBetter: true,
    metric: (v) => controlSpread(v, 100, 90, 100) * 100,
    training: "불펜 피칭",
  },
  movement: {
    role: "투구",
    what: "변화구가 휘는 크기와 공의 위력. 높을수록 타자가 헛스윙하고 약하게 맞혀요.",
    label: "슬라이더 휨",
    unit: "cm",
    digits: 0,
    metric: (v) => {
      const m = pitchMovement("slider", v);
      return Math.hypot(m.x, m.y) * 100;
    },
    training: "변화구 그립",
  },
  stamina: {
    role: "투구",
    what: "던질 때 체력이 줄어드는 속도. 높을수록 경기 후반까지 구속과 제구가 유지되고 폭투가 줄어요.",
    label: "100구당 체력 소모",
    unit: "",
    digits: 0,
    lowerIsBetter: true,
    // A four-seam fastball at the default effort (the pitch's own cost factor included).
    metric: (v) => pitchEnergyCost(90, v) * pitchData("fastball").stamina * 100,
    training: "러닝",
  },
  contact: {
    role: "타격",
    what: "타석에서 공을 맞히는 능력. 배트 판정이 넓어지고 공이 올 범위가 좁게 보여요.",
    label: "배트 판정 반경",
    unit: "cm",
    digits: 1,
    metric: (v) => batReach(v, "contact") * 100,
    training: "타격",
  },
  power: {
    role: "타격",
    what: `타구를 멀리 보내는 힘. ${HOME_RUN_DISTANCE} m를 넘기면 홈런이에요.`,
    label: "정타 비거리",
    unit: "m",
    digits: 0,
    metric: (v) => (8 + 0.81 * 115) * carryScale(v),
    training: "장타",
  },
  speed: {
    role: "주루",
    what: "베이스 사이를 달리는 빠르기. 내야 안타, 한 베이스 더 가기, 도루가 쉬워져요.",
    label: "홈→1루",
    unit: "초",
    digits: 2,
    lowerIsBetter: true,
    metric: (v) => BASE_PATH_LENGTH / runSpeed(v),
    training: "스프린트",
  },
};
const statLabel = (k: StatKey) => STAT_NAMES[k];
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
/**
 * Major-league clubs (fictional). In the first team, all of their scouts watch at once; each
 * values something different (focus), so their evaluations rise at different speeds.
 */
export const MLB_TEAMS: {
  id: string;
  city: string;
  name: string;
  color: string;
  scout: string;
  focus: "strikeouts" | "wins" | "hits" | "runs";
  likes: string;
}[] = [
  {
    id: "harbor",
    city: "New York",
    name: "Harbor Knights",
    color: "#2f5aa8",
    scout: "Mike Johnson",
    focus: "strikeouts",
    likes: "탈삼진",
  },
  {
    id: "sunset",
    city: "Los Angeles",
    name: "Sunset Blaze",
    color: "#e0663a",
    scout: "Carlos Rivera",
    focus: "wins",
    likes: "승리",
  },
  {
    id: "bay",
    city: "Boston",
    name: "Bay Hammers",
    color: "#b23a48",
    scout: "Kevin O'Connor",
    focus: "hits",
    likes: "팀 타격",
  },
  {
    id: "lake",
    city: "Chicago",
    name: "Lake Wolves",
    color: "#3d8f6a",
    scout: "Derek Smith",
    focus: "runs",
    likes: "최소 실점",
  },
];
export const mlbTeamOf = (id: string | undefined) => MLB_TEAMS.find((t) => t.id === id) ?? null;
/** Career ladder: high school → pro 2nd team → pro 1st team → major league. */
export type Tier = "high" | "farm" | "first" | "mlb";
export const tierOf = (c: Pick<Career, "stage" | "proGoal" | "league">): Tier =>
  c.stage !== "pro" ? "high" : c.league === "mlb" ? "mlb" : c.proGoal ? "first" : "farm";
/** Player ratings around each tier: mean ± spread (pro scale). */
export const TIER_RATINGS: Record<Exclude<Tier, "high">, { mean: number; spread: number }> = {
  farm: { mean: 120, spread: 30 },
  first: { mean: 170, spread: 30 },
  mlb: { mean: 225, spread: 25 },
};
/** What the career gauge measures in this tier. */
export const gaugeName = (c: Pick<Career, "stage" | "proGoal" | "league">) =>
  ({ high: "스카우트 평가", farm: "1군 신뢰도", first: "1군 신뢰도", mlb: "무한 모드" })[tierOf(c)];
export const TIER_NAMES: Record<Tier, string> = {
  high: "고교",
  farm: "프로 2군",
  first: "프로 1군",
  mlb: "MLB",
};
/** [visiting team, our team]: high-school rivals, pro clubs (2군 teams first), or MLB clubs. */
export const matchTeams = (
  c: Pick<Career, "stage" | "club" | "day" | "proGoal" | "league" | "mlbClub">,
): [string, string] => {
  const tier = tierOf(c);
  if (tier === "mlb") {
    const club = mlbTeamOf(c.mlbClub) ?? MLB_TEAMS[0],
      rivals = MLB_TEAMS.filter((t) => t.id !== club.id);
    return [rivals[c.day % rivals.length].name, club.name];
  }
  const club = c.stage === "pro" ? teamOf(c.club) : null;
  if (!club) return [opponentSchool(c.day).name, HOME_SCHOOL];
  const rivals = TEAMS.filter((t) => t.id !== club.id),
    suffix = tier === "farm" ? " 2군" : "";
  return [rivals[c.day % rivals.length].name + suffix, club.name + suffix];
};
/** Player creation: every stat starts at STAT_BASE and STAT_POINTS are spread freely. */
export const STAT_BASE = 45;
export const STAT_POINTS = 100;
export const STAT_CAP = 80;
/** Starting-pitch roulette: rarer pitches have smaller weights. */
export const BLESSINGS: { id: PitchId; weight: number; tier: string }[] = [
  { id: "changeup", weight: 20, tier: "축복" },
  { id: "twoseam", weight: 18, tier: "축복" },
  { id: "curve", weight: 13, tier: "은총" },
  { id: "cutter", weight: 11, tier: "은총" },
  { id: "sinker", weight: 10, tier: "은총" },
  { id: "palmball", weight: 7, tier: "은총" },
  { id: "splitter", weight: 6, tier: "신탁" },
  { id: "sweeper", weight: 5, tier: "신탁" },
  { id: "forkball", weight: 4, tier: "신탁" },
  { id: "eephus", weight: 3, tier: "신탁" },
  { id: "screwball", weight: 3, tier: "신탁" },
];
/** Every new player starts with these; the roulette adds one more. */
export const STARTING_PITCHES: PitchId[] = ["fastball", "slider"];
/** Word plus the Korean particle that fits its last syllable, e.g. josa("커브", "을를") = "커브를". */
export const josa = (word: string, pair: "이가" | "을를" | "은는" | "과와") => {
  const code = word.charCodeAt(word.length - 1) - 0xac00,
    batchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (batchim ? pair[0] : pair[1]);
};
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
/** Reference speed (km/h) whose on-screen travel time is not stretched by speed. */
export const SPEED_LOOK_REF = 135;
/**
 * On-screen travel time of a pitch (s). The difficulty slows every pitch down for reaction
 * time, and the speed term widens the gap between slow and fast pitches beyond the physical
 * one, so 170 km/h looks clearly faster than 130 km/h. Swing timing uses shares of this time.
 */
export const visualFlightTime = (
  duration: number,
  speed: number,
  difficulty: "easy" | "normal" | "hard",
) =>
  duration *
  (difficulty === "easy" ? 2.5 : difficulty === "normal" ? 1.8 : 1.2) *
  clamp((SPEED_LOOK_REF / speed) ** 0.9, 0.72, 1.4);
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
/** How far (m) from the ball a chasing fielder stops and catches a fly / picks up a grounder. */
export const CATCH_REACH = 1.6;
export const GROUND_REACH = 2.2;
const HANG_BASE = 1.4;
const HANG_DIV = 38;
export function pitchMovement(id: PitchId, movement: number) {
  const p = pitchData(id),
    scale = over(movement, 0.4) / 75,
    x = p.breakX * scale,
    y = p.breakY * scale,
    flutter = (p.flutter ?? 0) * scale;
  return {
    x,
    y,
    /** Knuckle wobble amplitude (m); the box below already includes it. */
    flutter,
    minX: Math.min(0, x) - flutter,
    maxX: Math.max(0, x) + flutter,
    minY: Math.min(0, y) - flutter,
    maxY: Math.max(0, y) + flutter,
  };
}
/**
 * Knuckle wobble at flight share u (0–1) for a release seed: zero at release and at the plate,
 * never larger than the flutter amplitude, so it stays inside the pitchMovement() box.
 */
export const flutterOffset = (flutter: number, u: number, seed: number) => {
  const env = Math.sin(Math.PI * u);
  return {
    x: flutter * env * Math.sin(2 * Math.PI * 2.3 * u + seed),
    y: flutter * env * Math.sin(2 * Math.PI * 1.6 * u + seed * 1.7 + 1),
  };
};
/**
 * Control error (m, one standard deviation) of the player's pitches. Lower stamina (energy),
 * higher effort and poor form all widen it; the control stat narrows it.
 */
export const controlSpread = (control: number, energy: number, effort: number, form: number) =>
  Math.max(
    0.008,
    (0.022 +
      (100 - Math.min(control, 100)) * 0.0019 -
      Math.max(0, control - 100) * 0.00012 +
      (100 - energy) * 0.0016 +
      (effort - 70) * 0.001) *
      (1 + (100 - form) * 0.003),
  );
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
  /** Last base he touched while advancing, and when (play time, s): judges close plays. */
  touched?: { base: number; at: number };
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
/** One line of the end-of-match recap: what happened and how many points it was worth. */
export type RecapLine = { label: string; value: number };
export type Player = {
  name: string;
  /** Nickname shown in front of the name, e.g. [번개맨]. */
  nick?: string;
  hand: "R" | "L";
  contact: number;
  power: number;
  eye: number;
  speed: number;
  /** A pro-club player: ratings on the pro scale (150 ± 50), see proForm(). */
  pro?: boolean;
};
/** Our school. The player bats first in its lineup; the eight teammates never change. */
export const HOME_SCHOOL = "미산고";
export const HOME_LINEUP: Player[] = [
  { name: "", hand: "R", contact: 0, power: 0, eye: 66, speed: 0 },
  { name: "고하운", nick: "번개맨", hand: "R", contact: 76, power: 55, eye: 66, speed: 92 },
  { name: "옥동규", nick: "미산고 요정", hand: "L", contact: 72, power: 45, eye: 70, speed: 99 },
  { name: "김영호", nick: "발렌시아", hand: "R", contact: 99, power: 99, eye: 99, speed: 99 },
  { name: "유동권", nick: "진격의 거인", hand: "R", contact: 58, power: 99, eye: 52, speed: 28 },
  { name: "양서준", nick: "야구괴인", hand: "L", contact: 95, power: 95, eye: 75, speed: 62 },
  { name: "송대현", nick: "면접의", hand: "R", contact: 92, power: 90, eye: 90, speed: 88 },
  { name: "이지섭", nick: "그냥 웃김", hand: "R", contact: 55, power: 98, eye: 50, speed: 30 },
  { name: "아모스", nick: "몽골의", hand: "L", contact: 99, power: 84, eye: 99, speed: 74 },
];
/** "[별호] 이름", or just the name. */
export const playerLabel = (p: Pick<Player, "name" | "nick">) =>
  p.nick ? `[${p.nick}] ${p.name}` : p.name;
/** Position names in DEFENSE order. */
export const POSITIONS = [
  "투수",
  "포수",
  "1루수",
  "2루수",
  "유격수",
  "3루수",
  "좌익수",
  "중견수",
  "우익수",
];
/**
 * Lineup slot playing each DEFENSE position. Ours: the player pitches (slot 0), 김영호 at
 * shortstop, the fastest legs (옥동규, 고하운) up the middle, the slow sluggers at C and 1B.
 */
export const HOME_POSITIONS = [0, 7, 4, 2, 3, 6, 5, 1, 8];
/** Opponents: the ace pitches; lineup slots by position (slot 8 is the DH). */
export const AWAY_POSITIONS = [-1, 7, 4, 1, 2, 5, 3, 0, 6];
/**
 * A fielder's skill as multipliers of the stage's base values (1 at rating 65):
 * speed → chase speed, eye → first-step reaction (lower is quicker), power → throwing arm.
 */
export const fieldSkill = (p: Pick<Player, "speed" | "eye" | "power">) => ({
  run: clamp(1 + (p.speed - 65) * 0.004, 0.8, 1.2),
  react: clamp(1 - (p.eye - 65) * 0.004, 0.82, 1.15),
  arm: clamp(1 + (p.power - 65) * 0.004, 0.84, 1.2),
});
/** Team averages for the strength panel. */
export const teamRatings = (players: Player[]) => {
  const avg = (k: "contact" | "power" | "eye" | "speed") =>
    Math.round(players.reduce((a, p) => a + p[k], 0) / Math.max(1, players.length));
  return { contact: avg("contact"), power: avg("power"), eye: avg("eye"), speed: avg("speed") };
};
/** Kept for older code paths: our teammates (slot 0 is filled in from the career). */
export const RIVALS = HOME_LINEUP;
/** An AI team's ace: km/h above the stage's base speed, control spread multiplier, pitch mix. */
export type Ace = {
  name: string;
  hand: "R" | "L";
  velocity: number;
  control: number;
  kinds: number;
};
export type Roster = { name: string; style: string; lineup: Player[]; ace: Ace };
/**
 * Rival high schools. A new one comes each match day; each has its own style and strength, and
 * its players (made from the school's name) are the same every time you meet them.
 */
export const SCHOOLS: {
  name: string;
  strength: number;
  style: "speed" | "power" | "contact" | "balanced";
}[] = [
  { name: "한빛고", strength: 58, style: "balanced" },
  { name: "청운고", strength: 62, style: "speed" },
  { name: "동해고", strength: 66, style: "power" },
  { name: "새벽고", strength: 56, style: "contact" },
  { name: "백송고", strength: 64, style: "balanced" },
  { name: "금강고", strength: 70, style: "power" },
  { name: "은하고", strength: 60, style: "contact" },
  { name: "해솔고", strength: 63, style: "speed" },
  { name: "보람고", strength: 55, style: "balanced" },
  { name: "태백고", strength: 72, style: "contact" },
  { name: "서림고", strength: 61, style: "power" },
  { name: "가람고", strength: 67, style: "speed" },
];
export const STYLE_NAMES = {
  speed: "발 빠른 팀",
  power: "장타 팀",
  contact: "정교한 팀",
  balanced: "균형 잡힌 팀",
} as const;
const SURNAMES = "김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허남심노".split("");
const GIVEN = "민서준도윤시우하지현예건우진태영성재호수빈현석동훈승찬유원규한결".split("");
/** English names for major-league rosters (fictional players). */
const EN_FIRST =
  "Jake Ryan Tyler Cody Mason Logan Austin Blake Evan Nolan Caleb Owen Luke Dylan Grant Shane Trevor Wyatt Cole Brady Miguel Diego Luis Rafael Marco Hiroshi Kenji Daniel Victor Andre".split(
    " ",
  );
const EN_LAST =
  "Miller Carter Brooks Hayes Turner Parker Collins Reed Morgan Foster Bennett Sullivan Hughes Price Ramirez Torres Castillo Ortega Mendez Navarro Walker Fisher Coleman Barnes Tanaka Sato Kim Park Wright Lawson".split(
    " ",
  );
const hashName = (text: string) => {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
/** Batting-order roles: leadoff speed, table-setters, the heart of the order, the bottom. */
const SLOT_ROLES = [
  { contact: 6, power: -12, eye: 4, speed: 18 },
  { contact: 8, power: -6, eye: 6, speed: 8 },
  { contact: 8, power: 8, eye: 6, speed: 0 },
  { contact: 0, power: 20, eye: -2, speed: -12 },
  { contact: 2, power: 12, eye: 0, speed: -6 },
  { contact: 0, power: 2, eye: 0, speed: 0 },
  { contact: -4, power: -2, eye: -2, speed: 2 },
  { contact: -8, power: -8, eye: -4, speed: 6 },
  { contact: -10, power: -10, eye: -4, speed: 10 },
];
const STYLE_BONUS = {
  speed: { contact: 2, power: -4, eye: 0, speed: 10 },
  power: { contact: -3, power: 10, eye: -2, speed: -4 },
  contact: { contact: 8, power: -4, eye: 6, speed: 0 },
  balanced: { contact: 2, power: 2, eye: 2, speed: 2 },
};
const rosterCache = new Map<string, Roster>();
/** The fixed roster of a team: same names and ratings every time (seeded by the team name). */
export function makeRoster(
  name: string,
  strength: number,
  style: keyof typeof STYLE_BONUS = "balanced",
): Roster {
  const key = `${name}|${strength}|${style}`,
    cached = rosterCache.get(key);
  if (cached) return cached;
  let seed = hashName(name);
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296,
    pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)],
    used = new Set<string>(),
    person = () => {
      let n = "";
      do n = pick(SURNAMES) + pick(GIVEN) + pick(GIVEN);
      while (used.has(n) || n[1] === n[2]);
      used.add(n);
      return n;
    },
    bonus = STYLE_BONUS[style],
    rate = (base: number) => Math.round(clamp(base + (rnd() - 0.5) * 10, 35, 95));
  const lineup = SLOT_ROLES.map((r) => ({
    name: person(),
    hand: (rnd() < 0.32 ? "L" : "R") as "L" | "R",
    contact: rate(strength + r.contact + bonus.contact),
    power: rate(strength + r.power + bonus.power),
    eye: rate(strength + r.eye + bonus.eye),
    speed: rate(strength + r.speed + bonus.speed),
  }));
  const roster: Roster = {
    name,
    style: STYLE_NAMES[style],
    lineup,
    ace: {
      name: person(),
      hand: rnd() < 0.3 ? "L" : "R",
      velocity: Math.round((strength - 62) * 0.45 + (rnd() - 0.5) * 4),
      control:
        Math.round(clamp(1.25 - (strength - 50) * 0.014 + (rnd() - 0.5) * 0.15, 0.7, 1.4) * 100) /
        100,
      kinds: strength >= 68 ? 4 : strength >= 60 ? 3 : 2,
    },
  };
  rosterCache.set(key, roster);
  return roster;
}
/** Pro ratings: average 150, spread ±50 (100–200). */
export const PRO_MEAN = 150;
export const PRO_SPREAD = 50;
/**
 * A pro club's fixed roster (seeded by the club name). Ratings are 150 ± 50 by batting-order
 * role; the ace's speed and control come from his own rating on the same scale.
 */
export function makeProRoster(name: string, mean = PRO_MEAN, spread = PRO_SPREAD): Roster {
  const key = `${name}|pro|${mean}|${spread}`,
    cached = rosterCache.get(key);
  if (cached) return cached;
  let seed = hashName(name) ^ 0x5bd1e995;
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296,
    pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)],
    used = new Set<string>(),
    // Major-league clubs have English names; Korean clubs Korean ones.
    english = MLB_TEAMS.some((t) => t.name === name),
    person = () => {
      let n = "";
      if (english)
        do n = `${pick(EN_FIRST)} ${pick(EN_LAST)}`;
        while (used.has(n));
      else
        do n = pick(SURNAMES) + pick(GIVEN) + pick(GIVEN);
        while (used.has(n) || n[1] === n[2]);
      used.add(n);
      return n;
    },
    rate = (role: number) =>
      Math.round(clamp(mean + role + (rnd() - 0.5) * 2 * spread, mean - spread, mean + spread));
  const lineup: Player[] = SLOT_ROLES.map((r) => ({
    name: person(),
    hand: (rnd() < 0.32 ? "L" : "R") as "L" | "R",
    contact: rate(r.contact),
    power: rate(r.power),
    eye: rate(r.eye),
    speed: rate(r.speed),
    pro: true,
  }));
  const aceRating = rate(0),
    strength = proForm(aceRating);
  const roster: Roster = {
    name,
    style: "프로",
    lineup,
    ace: {
      name: person(),
      hand: rnd() < 0.3 ? "L" : "R",
      velocity: Math.round((strength - 62) * 0.45 + (rnd() - 0.5) * 4),
      control:
        Math.round(clamp(1.25 - (strength - 50) * 0.014 + (rnd() - 0.5) * 0.15, 0.7, 1.4) * 100) /
        100,
      kinds: 4,
    },
  };
  rosterCache.set(key, roster);
  return roster;
}
/**
 * What a pro rating means in the game formulas: 150 (pro average) plays like the 80-rated pro
 * rosters the pro stage was tuned with; 100 like 60, 200 like 100.
 */
export const proForm = (v: number) => 80 + (v - PRO_MEAN) * 0.4;
/** The player as the formulas see him (pro players mapped by proForm, everyone else as is). */
export const formOf = (p: Player): Player =>
  p.pro
    ? {
        ...p,
        contact: proForm(p.contact),
        power: proForm(p.power),
        eye: proForm(p.eye),
        speed: proForm(p.speed),
      }
    : p;
/** Share of the player's average stat gain that the teammates gain too. */
export const TEAM_GROWTH = 0.75;
/** Today's rival school (a different one each match day). */
export const opponentSchool = (day: number) => SCHOOLS[(Math.max(1, day) - 1) % SCHOOLS.length];
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
    /** Base-running speed (added later; older saves get the default). */
    speed: number;
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
  /** Secret "오타니" start: stats may stay above the high-school cap (optional, older saves lack it). */
  legend?: boolean;
  /** Rating points every teammate has gained with the player (optional, older saves: 0). */
  teamBoost?: number;
  /** "mlb" after signing with a major-league club (absent = Korean pro league). */
  league?: "mlb";
  /** Major-league club signed with (MLB_TEAMS id). */
  mlbClub?: string;
  /** First team: each MLB club scout's evaluation (0–100). */
  mlbScouts?: Record<string, number>;
  /** Turned every MLB club down: stays home with the stat cap raised to 250. */
  limitless?: boolean;
  /** Developer mode: stat cap lifted for testing (250). */
  devCap?: number;
};
/** Highest a stat can go for this career (the pro cap for a legend start). */
export const statCapOf = (
  c: Pick<Career, "stage" | "legend" | "league" | "limitless" | "devCap">,
) =>
  Math.max(
    c.devCap ?? 0,
    c.league === "mlb" || c.limitless
      ? LIMITLESS_CAP
      : c.legend
        ? STAGES.pro.statCap
        : STAGES[c.stage].statCap,
  );
/** Stat cap in the major league, or for staying home after turning every MLB club down. */
export const LIMITLESS_CAP = 250;
/** Limit break (G): every stat counts as this for one inning. */
export const LIMIT_BREAK = 300;
/** Cheer (T): opponents' ratings drop by this for one inning. */
export const CHEER_DROP = 15;
/** Secret name: typing it on the creation screen starts a two-way legend. */
export const isLegendName = (name: string) => /^오타니(쇼헤이)?$/.test(name.replace(/\s/g, ""));
/** Pitches the legend start begins with (no roulette). */
export const LEGEND_PITCHES: PitchId[] = [
  "fastball",
  "curve",
  "sinker",
  "cutter",
  "slider",
  "sweeper",
  "splitter",
];
export const newCareer = (): Career => ({
  version: 1,
  name: "나의 선수",
  day: 1,
  energy: 100,
  form: 76,
  stats: {
    velocity: 64,
    control: 65,
    movement: 62,
    stamina: 66,
    contact: 60,
    power: 56,
    speed: 60,
  },
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
  pitches: [...STARTING_PITCHES],
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
  /** Knuckle wobble phase, rolled at release. */
  seed?: number;
  /** Limit break was armed for this pitch: every player stat counts as 300 for it and its play. */
  limit?: boolean;
  /** The AI batter swung at this pitch (for the swing animation; set when the pitch arrives). */
  aiSwing?: boolean;
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
  /** A bunt: deadened roller that barely rolls on after it slows. */
  bunt?: boolean;
  /** Extra first-step delay for this play's fielder (s): charging and barehanding a bunt. */
  reactionExtra?: number;
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
  /** How the ball was fielded (for the animation and the callout). */
  catchStyle?: "catch" | "jump" | "dive" | "ground";
  /** When the dive or jump happened (s from play start). */
  catchMoment?: number;
  /** A dive was tried on this ball (one per play); the fielder is down until this time. */
  diveTried?: boolean;
  downUntil?: number;
  /** Who made the dive (the play may then pass to a backup fielder). */
  diver?: number;
  /**
   * Automatic fielding decides a catch or dive a moment early (`RULES.planLead`), so the
   * animation can show the run-up, crouch and take-off. `gap` is how far he would be from the
   * ball on foot (the same number the rules use); a dive's outcome is rolled when it is
   * planned, and he flies from `launch` to `end` between `launchAt` and `at`.
   */
  plan?: {
    style: "catch" | "jump" | "dive" | "none";
    at: number;
    gap: number;
    foot: Vec;
    success?: boolean;
    end?: Vec;
    ball?: Vec;
    launchAt?: number;
    launch?: Vec;
  };
  /** An outfielder took over a grounder that got through the infield. */
  backedUp?: boolean;
  /** Low, hard liner (the fielder may have to leap for it). */
  lineDrive?: boolean;
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
  /** Show name tags above the fielders. */
  nameTags: boolean;
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
  /** Why the gauge and XP moved after the last finished match (lines add up to the totals). */
  lastScoutParts: RecapLine[];
  lastXpParts: RecapLine[];
  /** Result type of the last pitch. */
  lastOutcome: PitchOutcome | null;
  /** E pressed: the runner on first goes with the next pitch (STEAL_READY). */
  stealCall: boolean;
  /** The stealing runner while the pitch is being delivered (null otherwise). */
  stealTrack: RunnerTrack | null;
  /** Pickoff throws during this plate appearance; runners shorten their lead after each. */
  pickoffs: number;
  /** First team: each MLB scout's evaluation before/after the last match. */
  lastMlb: { id: string; before: number; after: number }[];
  /** Today's weather (rain changes the whole match) and the rain coin toss between innings. */
  weather: Weather;
  coin: { result: "go" | "cancel" } | null;
  /** Big centre-screen callout ("폭투", "풀카운트"); `id` changes each time one fires. */
  flash: { text: string; tone: string; id: number } | null;
  /**
   * Fielding highlight (diving/jumping catch, diving stop): the 3D view shows it again in a
   * small slow-motion "TV" window. `fielder` made it at play time `at` (s); `id` is new each time.
   */
  replay: {
    text: string;
    fielder: number;
    at: number;
    id: number;
    /** Close play at a base: the runner (track id), the base, and the call. */
    base?: { runner: number; base: number; out: boolean };
  } | null;
  /** The 3D view is still showing a replay: the next batter/inning waits for it. */
  replayBusy: boolean;
  /** Settings: rain may fall (off = always clear). Kept in this browser. */
  rainOn: boolean;
  /** The match was called off by rain. */
  rainedOut: boolean;
  /** Limit break: uses this match, and armed for the very next pitch. */
  limitUsed: number;
  limitArmed: boolean;
  /** Cheer (T) used in this match, and the inning it is active in (0 = none). */
  cheerUsed: boolean;
  cheerInning: number;
  /** A hidden condition just met: a hidden pitch, or the "legend" start (UI shows a reveal). */
  hiddenUnlock: PitchId | "legend" | null;
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
  nameTags: true,
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
  log: [`${HOME_SCHOOL} vs ${opponentSchool(career.day).name} · 경기 준비`],
  practice: { pitches: 0, strikes: 0, hits: 0, best: 0 },
  career,
  saveStatus: "이 브라우저에 자동 저장",
  lastResult: "",
  batFeedback: null,
  matchXp: 0,
  lastXpGain: 0,
  lastScout: null,
  lastScoutParts: [],
  lastXpParts: [],
  lastOutcome: null,
  stealCall: false,
  stealTrack: null,
  pickoffs: 0,
  hiddenUnlock: null,
  lastMlb: [],
  cheerUsed: false,
  cheerInning: 0,
  weather: mode === "match" && rainSetting() ? weatherOf(career) : "clear",
  rainOn: rainSetting(),
  coin: null,
  rainedOut: false,
  flash: null,
  replay: null,
  replayBusy: false,
  limitUsed: 0,
  limitArmed: false,
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
  /** Our team: 미산고 in high school, the signed club in the pros. Slot 0 is the player. */
  get homeRoster(): Roster {
    const c = this.state.career,
      club = c.stage === "pro" ? teamOf(c.club) : null;
    const tier = tierOf(c);
    if (tier === "mlb") {
      const r = TIER_RATINGS.mlb;
      return makeProRoster(this.teams[1], r.mean, r.spread);
    }
    const r = TIER_RATINGS[tier === "first" ? "first" : "farm"];
    return club
      ? makeProRoster(this.teams[1], r.mean, r.spread)
      : { name: HOME_SCHOOL, style: "", lineup: HOME_LINEUP, ace: makeRoster(HOME_SCHOOL, 60).ace };
  }
  /** Today's opponent: a rival high school (new each day) or a rival pro club. */
  get awayRoster(): Roster {
    const c = this.state.career,
      [away] = matchTeams(c);
    const tier = tierOf(c);
    if (tier === "mlb" || (tier !== "high" && teamOf(c.club))) {
      const r = TIER_RATINGS[tier as Exclude<Tier, "high">];
      return makeProRoster(away, r.mean, r.spread);
    }
    const school = opponentSchool(c.day);
    return makeRoster(school.name, school.strength, school.style);
  }
  /**
   * Our hitter in lineup slot i: the player leads off (slot 0, career stats); slots 1–8 are the
   * teammates with their own contact, power, eye and speed. The user swings for all of them.
   */
  ourRunner(i: number): Player {
    const c = this.state.career,
      p = this.homeRoster.lineup[i % 9];
    if (i % 9 === 0)
      return {
        ...p,
        name: c.name,
        nick: "",
        hand: "R",
        contact: this.playerStats.contact,
        power: this.playerStats.power,
        speed: this.playerStats.speed,
        pro: false,
      };
    // Teammates grow with the player (TEAM_GROWTH of his average gain), up to the stage cap.
    const boost = Math.floor(c.teamBoost ?? 0),
      cap = STAGES[c.stage].statCap,
      up = (v: number) => Math.min(cap, Math.max(v, v + boost));
    return boost
      ? { ...p, contact: up(p.contact), power: up(p.power), eye: up(p.eye), speed: up(p.speed) }
      : p;
  }
  /** Our at-bat in slot i: the same player who then runs the bases. */
  private ourBatter(i: number): Player {
    return this.ourRunner(i);
  }
  /** True when the player character (leadoff, slot 0) is at the plate. */
  get playerUp() {
    return this.batting && (this.state.mode !== "match" || this.state.order[1] % 9 === 0);
  }
  /** The nine fielders now on defense, in DEFENSE order (index 0 = pitcher). */
  get fielders(): Player[] {
    return this.defenseOf(!this.batting);
  }
  /** Nine fielders of our team (home) or the rival (away), in DEFENSE order. */
  defenseOf(home: boolean): Player[] {
    if (home) return HOME_POSITIONS.map((slot) => this.ourRunner(slot));
    const r = this.awayRoster,
      // The ace fields like an average player of his team (pro scale in the pros).
      pro = !!r.lineup[0]?.pro,
      avg = teamRatings(r.lineup);
    return AWAY_POSITIONS.map((slot) =>
      this.cheered(
        slot < 0
          ? pro
            ? { name: r.ace.name, hand: r.ace.hand, ...avg, pro }
            : { name: r.ace.name, hand: r.ace.hand, contact: 50, power: 66, eye: 62, speed: 58 }
          : r.lineup[slot],
      ),
    );
  }
  /** Team strength for the panel: batting/running averages, defense, and the pitcher. */
  teamStrength(home: boolean) {
    const hitters = home
        ? Array.from({ length: 9 }, (_, i) => this.ourRunner(i))
        : this.awayRoster.lineup.map((p) => this.cheered(p)),
      d = this.defenseOf(home).slice(1),
      r = this.awayRoster;
    return {
      name: this.teams[home ? 1 : 0],
      ...teamRatings(hitters),
      defense: Math.round(d.reduce((a, p) => a + (p.speed + p.eye + p.power) / 3, 0) / d.length),
      pitcher: home ? this.state.career.name : r.ace.name,
      velocity: Math.round(
        home
          ? fastballSpeed(this.playerStats.velocity)
          : this.stageRules.aiVelocity + r.ace.velocity,
      ),
    };
  }
  /** Chase speed (m/s), first-step reaction (s) and throw speed (m/s) of fielder i. */
  fielderStats(i: number, l?: Pick<LivePlay, "reactionExtra" | "throwSpeed">) {
    const k = fieldSkill(
        this.fielders[i] ? formOf(this.fielders[i]) : { speed: 65, eye: 65, power: 65 },
      ),
      st = this.stageRules;
    return {
      speed: st.fielderSpeed * k.run,
      reaction:
        st.fielderReaction * k.react +
        (l?.reactionExtra ?? 0) +
        (this.raining ? RULES.rainReaction : 0),
      arm: (l?.throwSpeed ?? st.throwSpeed) * k.arm * (this.raining ? RULES.rainArm : 1),
    };
  }
  get batter(): Player {
    const s = this.state;
    // Batting practice is always the player; in a match the lineup slot decides.
    return this.batting
      ? this.ourBatter(s.mode === "match" ? s.order[1] : 0)
      : this.cheered(this.awayRoster.lineup[s.order[0] % 9]);
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
  /** One-off fanfare for a hidden condition; plays even when match sounds are off. */
  fanfare() {
    this.soundCallback("fanfare");
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
          keys = Object.keys(newCareer().stats) as (keyof Career["stats"])[],
          // Stats added after the first release may be missing from older saves.
          required = keys.filter((k) => k !== "speed");
        if (
          c?.version !== 1 ||
          typeof c.name !== "string" ||
          !c.stats ||
          !required.every((k) => typeof c.stats[k] === "number" && Number.isFinite(c.stats[k])) ||
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
        const cap =
          c.devCap === LIMITLESS_CAP ||
          (c.stage === "pro" && (c.league === "mlb" || c.limitless === true))
            ? LIMITLESS_CAP
            : c.stage === "pro" || c.legend === true
              ? STAGES.pro.statCap
              : STAGES.high.statCap;
        keys.forEach((k) => {
          const v = c.stats[k];
          if (typeof v === "number" && Number.isFinite(v)) clean.stats[k] = clamp(v, 0, cap);
        });
        // Saves made before the pitch shop already had the original four pitches.
        const known = Array.isArray(c.pitches)
          ? c.pitches.filter((id: unknown) => ALL_PITCHES.some((p) => p.id === id))
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
        clean.legend = c.legend === true;
        // Major-league fields (added later): only meaningful in the pros.
        clean.league =
          clean.stage === "pro" && c.league === "mlb" && mlbTeamOf(c.mlbClub) ? "mlb" : undefined;
        clean.mlbClub = clean.league ? c.mlbClub : undefined;
        clean.limitless = clean.stage === "pro" && c.limitless === true;
        clean.devCap = c.devCap === LIMITLESS_CAP ? LIMITLESS_CAP : undefined;
        clean.mlbScouts = Object.fromEntries(
          MLB_TEAMS.map((t) => {
            const v = c.mlbScouts?.[t.id];
            return [t.id, typeof v === "number" && Number.isFinite(v) ? clamp(v, 0, 100) : 0];
          }),
        );
        clean.teamBoost =
          typeof c.teamBoost === "number" && Number.isFinite(c.teamBoost)
            ? clamp(c.teamBoost, 0, 200)
            : 0;
        this.state.career = clean;
        this.state.energy = clean.energy;
        // The match being prepared belongs to the loaded day: its weather too.
        if (this.state.mode === "match" && !this.matchActive)
          this.state.weather = this.state.rainOn ? weatherOf(clean) : "clear";
        if (this.checkHiddenPitches()) this.persist();
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
      ALL_PITCHES.some((p) => p.id === id) &&
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
    this.state.nameTags = previous.nameTags;
    // Rain setting carries over; with rain off every match is clear.
    this.state.rainOn = previous.rainOn;
    if (!previous.rainOn) this.state.weather = "clear";
    this.state.hiddenUnlock = previous.hiddenUnlock;
    this.recorded = false;
    this.matchStrikeouts = 0;
    this.xpParts.clear();
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
  /** Adds in-match XP for season matches only, tallied by reason for the end-of-match recap. */
  private earn(xp: number, reason: string) {
    const s = this.state;
    if (s.mode !== "match" || s.phase === "finished") return;
    s.matchXp += xp;
    const part = this.xpParts.get(reason) ?? { count: 0, xp: 0 };
    part.count++;
    part.xp += xp;
    this.xpParts.set(reason, part);
  }
  /** In-match XP by reason (reset each match). */
  private xpParts = new Map<string, { count: number; xp: number }>();
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
      stats = this.playerStats,
      stage = this.stageRules,
      pitch = ai
        ? PITCHES[
            Math.floor(
              this.rng() *
                Math.min(PITCHES.length, stage.aiPitchKinds, this.awayRoster.ace.kinds + 2),
            )
          ]
        : pitchData(s.selected);
    const fatigue = ai ? Math.max(0, s.pitchCount[0] - 25) * 0.18 : 100 - s.energy;
    const formPenalty = ai ? 0 : (100 - s.career.form) * 0.02;
    const speed = clamp(
      (ai
        ? stage.aiVelocity + this.awayRoster.ace.velocity - (this.cheerActive ? 3 : 0)
        : fastballSpeed(stats.velocity)) +
        pitch.delta -
        fatigue * 0.065 -
        (100 - s.effort) * 0.09 -
        formPenalty -
        (this.raining ? RULES.rainVelocity : 0) +
        gaussian(this.rng) * 0.9,
      60,
      pitch.maxSpeed ?? 190,
    );
    const aim = ai
      ? V(gaussian(this.rng) * 0.29, 0.95 + gaussian(this.rng) * 0.34, 0)
      : { ...s.aim };
    const sigma =
      (ai
        ? 0.04 * this.awayRoster.ace.control * (this.cheerActive ? 1.08 : 1)
        : controlSpread(stats.control, s.energy, s.effort, s.career.form)) *
      pitch.control *
      (this.raining ? RULES.rainControl : 1);
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
      this.rng() <
        wildPitchChance(ai ? 100 - fatigue : s.energy, pitch.wild) *
          (this.raining ? RULES.rainWildPitch : 1);
    if (wild) {
      target.y = 0.09 + this.rng() * 0.12;
      target.x = clamp(target.x * 1.6, -0.6, 0.6);
    }
    const arc = ballistic(start, target, speed / 3.6)!;
    // The batter reads a zone around the true crossing point. The true point is always inside.
    let hint: Flight["hint"] = null;
    if (ai) {
      const r = contactHintRadius(formOf(this.batter).contact) * stage.hintScale,
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
      visualDuration: visualFlightTime(arc.duration, speed, s.difficulty),
      elapsed: 0,
      pitch: pitch.id,
      speed,
      movement: ai ? 65 : stats.movement,
      swung: false,
      swingTime: 0,
      batAim: { ...s.aim },
      hint,
      wild,
      seed: this.rng() * Math.PI * 2,
      // An armed limit break is spent on this pitch (ours or the rival's, i.e. our swing).
      limit: s.limitArmed,
    };
    s.limitArmed = false;
    // STEAL_READY → the runner on first breaks with the pitcher's first move.
    s.stealTrack = null;
    if (s.stealCall && s.mode === "match" && this.batting && s.bases[0] && !s.bases[1]) {
      const pace = this.runnerPace(formOf(this.runnerOnFirst).speed);
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
              pitchEnergyCost(s.effort, this.playerStats.stamina) *
                pitchData(s.flight?.pitch ?? "fastball").stamina *
                (this.raining ? RULES.rainStamina : 1),
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
      // A replay on screen holds the next batter/inning (at most 12 s, in case it never ends).
      if (s.timer <= 0 && (!s.replayBusy || s.timer < -12)) this.next();
    }
    if (this.emitClock > 0.05) {
      this.emitClock = 0;
      this.emit();
    }
  }
  /** Base-running pace (bases per second) for a runner with this speed rating. */
  runnerPace(speed: number) {
    return (runSpeed(speed) / BASE_PATH_LENGTH) * (this.raining ? RULES.rainRunPace : 1);
  }
  /** Our runner on first is taken to be the previous batter in the order. */
  get runnerOnFirst(): Player {
    return this.ourRunner(this.state.order[1] + 8);
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
      bend = Math.sin(Math.PI * u),
      wobble = flutterOffset(m.flutter, u, f.seed ?? 0);
    return V(
      f.start.x + f.velocity.x * t + m.x * bend + wobble.x,
      f.start.y + f.velocity.y * t - 4.905 * t * t + m.y * bend + wobble.y,
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
          style = SWING_STYLES[s.swingStyle],
          window = swingWindow(s.difficulty, s.career.stage, s.swingStyle),
          reach = batReach(formOf(this.batter).contact, s.swingStyle),
          contact = Math.abs(timing) < window && spatial < reach,
          // Contact swing: a near miss is fouled off, so the batter survives the pitch.
          cut =
            !contact &&
            style.cut > 0 &&
            Math.abs(timing) < window * style.cut &&
            spatial < reach * style.cut;
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
              formOf(this.batter).contact * 0.001,
            0,
            1,
          );
          if (q < style.foulBelow) this.foul();
          else this.contact(q, timing);
        } else if (cut) this.foul("배트 끝에 걸려 파울로 걷어냈습니다");
        else
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
      // A decisive pitch takes 20 off the AI batter's contact (never off the player's).
      const b0 = formOf(this.batter),
        b = isDecisive(data) ? { ...b0, contact: b0.contact - RULES.decisiveContactDrop } : b0,
        eye = b.eye + stage.batterEye,
        // The pitcher's movement rating sharpens each pitch's bite (1 = rating 65).
        bite = movementBite(f.movement),
        edge = Math.max(Math.abs(f.target.x) / 0.25, Math.abs(f.target.y - 0.95) / 0.4),
        chase = clamp(0.46 - eye * 0.004 + data.chase * bite, 0.06, 0.45);
      if (hbp) {
        this.hitByPitch();
        return;
      }
      const swing = this.rng() < (zone ? 0.69 : chase * Math.max(0.1, 1.6 - edge * 0.5));
      f.aiSwing = swing;
      if (swing) {
        const difficulty = s.difficulty === "hard" ? 0.1 : s.difficulty === "easy" ? -0.12 : 0,
          prob = clamp(
            0.3 +
              b.contact * 0.005 -
              (f.speed - 120) * 0.0035 +
              (100 - s.energy) * 0.002 -
              data.whiff * bite -
              (bite - 1) * 0.08 +
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
              data.soft * bite,
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
        this.earn(XP.strikeout, "탈삼진");
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
  private foul(detail = "") {
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
    this.result(
      "FOUL",
      detail ? `${detail} · 카운트 ${s.balls}-${s.strikes}` : "파울 · 2스트라이크 이후 카운트 유지",
    );
  }
  private ball() {
    const s = this.state;
    s.balls++;
    s.lastOutcome = "Ball";
    if (s.balls >= 4) {
      // Ball four forces the runner from first anyway, so a steal attempt is moot.
      s.stealTrack = null;
      this.walk();
      if (this.batting) this.earn(XP.walk, "볼넷·사구");
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
    if (this.batting) this.earn(XP.walk, "볼넷·사구");
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
    s.pickoffs = 0;
    s.order[this.batting ? 1 : 0]++;
  }
  addRuns(n: number) {
    const s = this.state;
    if (!n) return;
    const i = this.batting ? 1 : 0;
    s.score[i] += n;
    s.lines[i][s.inning - 1] = (s.lines[i][s.inning - 1] ?? 0) + n;
    if (i === 0 && s.mode === "match") this.matchRuns += n;
    if (i === 1) for (let k = 0; k < n; k++) this.earn(XP.run, "득점");
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
    const bunt = this.batting && s.swingStyle === "bunt";
    if (this.batting) {
      const style = SWING_STYLES[s.swingStyle];
      q =
        clamp(q - (100 - s.career.form) * 0.001, 0, 1) *
          (style.spread[0] + this.rng() * style.spread[1]) +
        style.boost;
      q = clamp(q, 0, 1.15);
    }
    // A bunt is deadened in front of the plate: a slow roller toward one foul line (early
    // timing → third-base side). A clean bunt hugs the line and dies around RULES.buntSweet m,
    // past the catcher and short of the pitcher; a poor one drifts toward the middle and comes
    // off too short or too hard.
    if (bunt) q = 0.18;
    const side = timing < 0 ? 1 : timing > 0 ? -1 : this.rng() < 0.5 ? 1 : -1,
      miss = 1 - clamp(quality, 0, 1),
      angle = bunt
        ? side * clamp(0.62 - miss * 0.6 + (this.rng() - 0.5) * 0.2, 0.05, 0.72)
        : clamp(timing * 4 + (this.rng() - 0.5) * 1.05, -0.76, 0.76),
      range = bunt
        ? clamp(RULES.buntSweet + (this.rng() - 0.5) * 2 * miss * 5, RULES.buntMin, RULES.buntMax)
        : (8 + q * q * 115) * carryScale(formOf(this.batter).power),
      land = V(Math.sin(angle) * range, 0.12, Math.cos(angle) * range);
    let fielder = 2,
      best = Infinity;
    DEFENSE.forEach((p, i) => {
      // The catcher only fields bunts; everything else goes to the seven fielders in front.
      if (i === 1 && !bunt) return;
      const d = distance(p, land);
      if (d < best) {
        best = d;
        fielder = i;
      }
    });
    const hr = range > HOME_RUN_DISTANCE,
      bases = hr ? 4 : range > 78 ? 3 : range > 46 ? 2 : 1,
      ground = q <= 0.42;
    const lineDrive = !ground && !hr && this.rng() < 0.4;
    const flightTime = bunt
        ? range / RULES.buntSpeed
        : hr
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
    const pace = this.runnerPace(formOf(this.batter).speed) * (hr ? 1.65 : 1),
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
          // On a bunt the runners have their lead and break as soon as the ball is down.
          progress: jump
            ? jump.progress
            : i > 0 && bunt
              ? i + RULES.runnerLead / BASE_PATH_LENGTH
              : i,
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
      hold: bunt ? RULES.buntHold : 0.3,
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
      bunt,
      reactionExtra: bunt ? RULES.buntReaction : 0,
      resultBases: bases,
      runnerStart: [...s.bases],
      ground,
      bounced: ground,
      flightTime,
      height,
      lineDrive,
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
        if (i === 1 && !bunt) return;
        const t = this.interceptTime(l, p, i);
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
        v0 = (len / l.flightTime) * (l.bunt ? 0.25 : l.ground ? 1.15 : 0.3),
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
        ? 0.12 + (l.bunt ? 0.15 : 0.55) * Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u)
        : lerp(l.start.y, l.land.y, u) + Math.sin(u * Math.PI) * l.height,
      lerp(l.start.z, l.land.z, u),
    );
  }
  private interceptTime(l: LivePlay, from: Vec, who = l.fielder) {
    const { speed: fielderSpeed, reaction: fielderReaction } = this.fielderStats(who, l);
    for (let t = 0.05; t <= 12; t += 0.05) {
      const p = this.liveBall(l, t);
      if (Math.hypot(p.x - from.x, p.z - from.z) / fielderSpeed + fielderReaction <= t) return t;
    }
    return Infinity;
  }
  /** Earliest point on the ball's ground path the chasing fielder can reach in time. */
  private interceptPoint(l: LivePlay) {
    const { speed: fielderSpeed, reaction: fielderReaction } = this.fielderStats(l.fielder, l),
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
  /** Leap rule for a fly he reaches (see the fly catch). */
  private jumpCatch(l: LivePlay, gap: number) {
    return (l.lineDrive && gap > 1.15) || (Math.hypot(l.land.x, l.land.z) > 80 && gap > 0.6);
  }
  /**
   * Fly ball, automatic fielding: `planLead` s before the catch, predict where his run puts
   * him (straight at the catch point, as the movement code does) and settle catch/leap/dive.
   */
  private planFly(l: LivePlay) {
    if (
      l.plan ||
      l.ground ||
      l.bounced ||
      l.kind !== "batted" ||
      l.elapsed + 1e-8 < l.catchAt - RULES.planLead ||
      l.elapsed >= l.catchAt
    )
      return;
    const { speed, reaction } = this.fielderStats(l.fielder, l),
      move = Math.max(0, l.catchAt - Math.max(l.elapsed, reaction, this.downTime(l))),
      dx = l.catchPoint.x - l.fielderPos.x,
      dz = l.catchPoint.z - l.fielderPos.z,
      d = Math.hypot(dx, dz),
      step = Math.min(d, speed * move),
      foot = V(
        l.fielderPos.x + (d ? (dx / d) * step : 0),
        0,
        l.fielderPos.z + (d ? (dz / d) * step : 0),
      ),
      gap = d - step;
    if (gap <= CATCH_REACH)
      l.plan = { style: this.jumpCatch(l, gap) ? "jump" : "catch", at: l.catchAt, gap, foot };
    else if (gap <= RULES.diveReach && !l.bunt && l.fielder !== 1) {
      const success = this.rng() < this.diveChance(l.fielder, gap, RULES.diveReach, CATCH_REACH),
        k = success ? 0.85 : 0.6;
      l.plan = {
        style: "dive",
        at: l.catchAt,
        gap,
        foot,
        success,
        end: V(lerp(foot.x, l.catchPoint.x, k), 0, lerp(foot.z, l.catchPoint.z, k)),
        launchAt: Math.max(l.elapsed, l.catchAt - RULES.diveLead),
      };
    } else l.plan = { style: "none", at: l.catchAt, gap, foot };
    if (l.plan.style !== "none") l.catchMoment = l.catchAt;
  }
  /**
   * Grounder, automatic fielding: look a third of a second ahead; if the ball will pass him
   * just out of reach (closest approach between GROUND_REACH and groundDiveReach), plan the
   * diving stop for that moment (outcome rolled now, as the instant check used to).
   */
  private planGroundDive(l: LivePlay) {
    const { speed } = this.fielderStats(l.fielder, l),
      p0 = l.fielderPos,
      tgt = this.interceptPoint(l),
      d0 = Math.hypot(tgt.x - p0.x, tgt.z - p0.z);
    let prev = Infinity,
      prevT = 0,
      prevPos = p0,
      prevBall = this.liveBall(l, l.elapsed);
    for (let k = 0; k <= 12; k++) {
      const t = k * 0.03,
        b = this.liveBall(l, l.elapsed + t),
        step = Math.min(d0, speed * t),
        fp = V(
          p0.x + (d0 ? ((tgt.x - p0.x) / d0) * step : 0),
          0,
          p0.z + (d0 ? ((tgt.z - p0.z) / d0) * step : 0),
        ),
        g = Math.hypot(b.x - fp.x, b.z - fp.z);
      if (g < GROUND_REACH) return; // he gets it on foot
      if (k > 0 && g >= prev) {
        if (prev <= RULES.groundDiveReach && prevBall.y < 1.1) {
          const at = l.elapsed + prevT,
            success =
              this.rng() < this.diveChance(l.fielder, prev, RULES.groundDiveReach, GROUND_REACH),
            kk = success ? 0.85 : 0.5;
          l.plan = {
            style: "dive",
            at,
            gap: prev,
            foot: prevPos,
            ball: prevBall,
            success,
            end: V(lerp(prevPos.x, prevBall.x, kk), 0, lerp(prevPos.z, prevBall.z, kk)),
            launchAt: Math.max(l.elapsed, at - RULES.diveLead),
          };
        }
        return;
      }
      prev = g;
      prevT = t;
      prevPos = fp;
      prevBall = b;
    }
  }
  /** Seconds the chasing fielder is still down after his own missed dive. */
  private downTime(l: LivePlay) {
    return l.diver === l.fielder ? (l.downUntil ?? 0) : 0;
  }
  /** Earliest play time fielder `who`, from where he stands now, can reach the loose ball. */
  private interceptFrom(l: LivePlay, who: number) {
    const { speed, reaction } = this.fielderStats(who, l),
      from = l.defenders[who],
      wait = Math.max(
        0,
        reaction - l.elapsed,
        (who === l.diver ? (l.downUntil ?? 0) : 0) - l.elapsed,
      );
    for (let dt = 0.05; dt <= 12; dt += 0.05) {
      const p = this.liveBall(l, l.elapsed + dt);
      if (Math.hypot(p.x - from.x, p.z - from.z) / speed + wait <= dt) return l.elapsed + dt;
    }
    return Infinity;
  }
  /**
   * A grounder that got past the infielder chasing it (through the hole, or past a missed
   * dive): the outfielder who gets there first takes over, and the runners read the new
   * play — each takes the next base if he beats the pickup and throw there.
   */
  private backUp(l: LivePlay) {
    if (l.kind !== "batted" || !l.ground || l.bunt || l.backedUp || l.fielder >= 6) return;
    // He is about to dive for it: let the dive decide first.
    if (l.plan?.style === "dive" && !l.diveTried) return;
    const ball = this.state.ball,
      past = Math.hypot(ball.x, ball.z) > Math.hypot(l.fielderPos.x, l.fielderPos.z) + 1.5;
    if (!past && !(l.diver === l.fielder && l.elapsed < (l.downUntil ?? 0))) return;
    let best = l.fielder,
      soonest = this.interceptFrom(l, l.fielder) - RULES.backupMargin;
    for (const i of [6, 7, 8]) {
      const t = this.interceptFrom(l, i);
      if (t < soonest) {
        soonest = t;
        best = i;
      }
    }
    if (best === l.fielder) return;
    l.backedUp = true;
    l.fielder = best;
    l.fielderPos = l.defenders[best];
    this.state.detail = "공이 내야를 빠져나갔습니다 · 외야수가 처리";
    // Runners re-read the play (lead runner first; nobody passes the runner ahead).
    const pickup = soonest + l.hold;
    let ahead = 5;
    for (const r of [...l.runners].filter((x) => !x.out).sort((a, b) => b.progress - a.progress)) {
      if (r.progress <= r.target + 1e-9)
        while (r.target < 4 && (r.target + 1 < ahead || r.target + 1 === 4)) {
          const next = r.target + 1,
            pace = r.fullPace ?? r.pace,
            runAt = l.elapsed + Math.max(0, r.delay - l.elapsed) + (next - r.progress) / pace;
          if (runAt + RULES.advanceMargin >= this.throwArrival(l, next, pickup)) break;
          r.target = next;
          r.pace = pace;
        }
      ahead = r.target === 4 ? 5 : r.target;
    }
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
      l.runners.find(
        (r) =>
          !r.out &&
          base < 4 &&
          r.target === base &&
          r.progress > base + 1e-8 &&
          // A batter coming back after overrunning first cannot be tagged out.
          !(r.from === 0 && base === 1 && !l.caughtFly),
      ) ?? null
    );
  }
  /** Chance a diving attempt by fielder i succeeds when the ball is `gap` m away. */
  diveChance(i: number, gap: number, reach: number, near: number) {
    const p = this.fielders[i] ? formOf(this.fielders[i]) : { speed: 65, eye: 65 },
      skill = (p.speed + p.eye) / 2;
    return clamp(
      RULES.diveBase +
        (skill - 65) * RULES.diveSkill -
        ((gap - near) / Math.max(0.1, reach - near)) * RULES.diveDistance -
        (this.raining ? RULES.diveRain : 0),
      RULES.diveMin,
      RULES.diveMax,
    );
  }
  /** A fielding highlight: replayed in slow motion in the 3D view's small TV window. */
  private highlight(l: LivePlay, text: string, at: number) {
    this.replayId++;
    this.state.replay = { text, fielder: l.fielder, at, id: this.replayId };
    this.log(text + "!");
  }
  private replayId = 0;
  /**
   * Bang-bang play at a base (throw and runner within RULES.closePlay seconds): replayed in
   * slow motion with the call. Runs right after the force/tag decision at the catch.
   */
  private closePlay(l: LivePlay, t: FieldThrow) {
    const r = l.runners.find((x) => x.id === t.runnerId);
    if (!r || !t.receivedAt) return;
    let margin: number,
      out = r.out;
    if (r.touched?.base === t.base) margin = t.receivedAt - r.touched.at;
    else if (r.progress < t.base - 1e-8 && r.target >= t.base) {
      // Still on his way: a non-forced runner is tagged as he arrives, a forced one is out.
      margin = (t.base - r.progress) / r.pace;
      out = true;
    } else return;
    if (margin > RULES.closePlay) return;
    this.replayId++;
    this.state.replay = {
      text: out ? "아웃" : "세이프",
      fielder: t.receiver,
      at: t.receivedAt,
      id: this.replayId,
      base: { runner: r.id, base: t.base, out },
    };
  }
  /** Throw speed of the fielder holding the ball (the pitcher's pickoff throw is fixed). */
  private armOf(l: LivePlay) {
    return l.kind === "pickoff" ? l.throwSpeed : this.fielderStats(l.fielder, l).arm;
  }
  /** Throw flight time; it never lands before the covering fielder reaches the bag. */
  private throwTime(l: LivePlay, base: number) {
    const bag = BASES[base - 1],
      cover = l.defenders[this.receiver(base, l.fielder)],
      eta = Math.max(0, Math.hypot(cover.x - bag.x, cover.z - bag.z) - 0.9) / 8.2;
    return Math.max(0.22, distance(l.fielderPos, bag) / this.armOf(l), eta + 0.02);
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
    if (!this.batting) this.earn(XP.out, "수비 아웃");
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
      const reach = Math.floor(next + 1e-9);
      if (reach > Math.floor(before + 1e-9))
        r.touched = { base: reach, at: previousTime + remainingDelay + (reach - before) / r.pace };
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
      // A fielder still on the ground after a missed dive cannot cover yet.
      if (i === l.diver && l.elapsed < (l.downUntil ?? 0)) continue;
      this.moveFielder(l.defenders[i], BASES[base - 1], dt);
    }
    if (l.resultBases === 4) {
      s.ball = this.liveBall(l, l.elapsed);
      if (l.elapsed >= l.flightTime && l.runners.every((r) => r.progress >= r.target))
        this.resolvePlay();
      return;
    }
    if (l.fieldedAt === null) this.backUp(l);
    const auto = s.autoField || this.batting;
    if (l.fieldedAt === null && auto) this.planFly(l);
    if (l.fieldedAt === null) {
      const { speed: fielderSpeed, reaction: fielderReaction } = this.fielderStats(l.fielder, l),
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
        // The fielder needs a moment to read the ball before the first step (and to get up
        // after a missed dive).
        const moving = Math.max(
          0,
          l.elapsed - Math.max(previous, fielderReaction, this.downTime(l)),
        );
        const plan = l.plan;
        if (
          plan?.end &&
          plan.launchAt !== undefined &&
          l.elapsed + 1e-8 >= plan.launchAt &&
          l.elapsed <= plan.at + 1e-8
        ) {
          // In the air: from the take-off spot to where the dive ends.
          plan.launch ??= { ...l.fielderPos };
          const u = clamp(
            (l.elapsed - plan.launchAt) / Math.max(1e-3, plan.at - plan.launchAt),
            0,
            1,
          );
          l.fielderPos.x = lerp(plan.launch.x, plan.end.x, u);
          l.fielderPos.z = lerp(plan.launch.z, plan.end.z, u);
        } else if (moving > 0) this.moveFielder(l.fielderPos, target, moving, fielderSpeed);
      }
      s.ball = this.liveBall(l, l.elapsed);
      if (!l.ground && !l.bounced && previous < l.catchAt - 1e-8 && l.elapsed + 1e-8 >= l.catchAt) {
        const fraction = clamp((l.catchAt - previous) / dt, 0, 1),
          atCatch = V(
            lerp(oldPos.x, l.fielderPos.x, fraction),
            0,
            lerp(oldPos.z, l.fielderPos.z, fraction),
          );
        const plan = l.plan && l.plan.style !== "none" ? l.plan : null,
          // Planned: the on-foot gap he would have had (the dive itself moved him already).
          gap = plan
            ? plan.gap
            : Math.hypot(atCatch.x - l.catchPoint.x, atCatch.z - l.catchPoint.z);
        // Just out of reach: the fielder dives for it (once). Skill and luck decide.
        let dove = false;
        if (
          gap > CATCH_REACH &&
          gap <= RULES.diveReach &&
          !l.diveTried &&
          l.kind === "batted" &&
          !l.bunt &&
          l.fielder !== 1
        ) {
          l.diveTried = true;
          l.diver = l.fielder;
          l.catchMoment = l.catchAt;
          dove = true;
          const made =
            plan?.style === "dive"
              ? !!plan.success
              : this.rng() < this.diveChance(l.fielder, gap, RULES.diveReach, CATCH_REACH);
          if (made) {
            l.catchStyle = "dive";
            // He ends up where the ball was, on the ground: getting up delays any throw.
            const end =
              plan?.end ??
              V(lerp(atCatch.x, l.catchPoint.x, 0.85), 0, lerp(atCatch.z, l.catchPoint.z, 0.85));
            atCatch.x = end.x;
            atCatch.z = end.z;
            l.hold += RULES.diveGetUp;
            this.highlight(l, "다이빙 캐치", l.catchAt);
          } else {
            l.catchStyle = "dive";
            l.downUntil = l.catchAt + RULES.diveMissDown;
            const end =
              plan?.end ??
              V(lerp(atCatch.x, l.catchPoint.x, 0.6), 0, lerp(atCatch.z, l.catchPoint.z, 0.6));
            l.fielderPos.x = end.x;
            l.fielderPos.z = end.z;
            s.detail = "몸을 날렸지만 글러브 끝에서 빠졌습니다!";
          }
        }
        if (gap <= CATCH_REACH || (dove && l.catchStyle === "dive" && l.downUntil === undefined)) {
          if (!dove) {
            // A leap only when he gets there just in time: a hard liner a step away, or a ball
            // at the wall he is still running to (not one he waits under).
            const jump = plan ? plan.style === "jump" : this.jumpCatch(l, gap);
            l.catchStyle = jump ? "jump" : "catch";
            if (jump) {
              l.catchMoment = l.catchAt;
              this.highlight(l, "점프 캐치", l.catchAt);
            }
          }
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
        // The ball is down. A runner who already rounded the base he is owed reads the play:
        // he takes the next one only if he beats the fielder's pickup and throw there;
        // otherwise he goes back to the base he just passed (a batter who overran first is
        // safe going back).
        const pickup = Math.max(l.elapsed, this.interceptTime(l, l.fielderPos)) + l.hold;
        for (const r of l.runners) {
          r.pace = r.fullPace ?? r.pace;
          const owed = Math.min(4, r.from + l.resultBases),
            next = Math.min(4, Math.ceil(r.progress - 1e-9));
          if (next <= owed) r.target = owed;
          else {
            const runAt = l.elapsed + (next - r.progress) / r.pace,
              throwAt = this.throwArrival(l, next, pickup);
            r.target = runAt + RULES.advanceMargin < throwAt ? next : Math.floor(r.progress + 1e-9);
          }
        }
        s.message = "FAIR BALL";
        s.detail = "타구가 땅에 닿았습니다 · 주자 진루";
      }
      // A grounder about to get past him: one diving stop, if he is up and ready.
      const ballGap = Math.hypot(s.ball.x - l.fielderPos.x, s.ball.z - l.fielderPos.z);
      let diveStop = false;
      const canDive =
        l.ground &&
        l.kind === "batted" &&
        !l.bunt &&
        l.fielder !== 1 &&
        !l.diveTried &&
        l.elapsed + 1e-8 >= Math.max(fielderReaction, this.downTime(l));
      // Automatic fielding sees the ball coming a moment ahead (for the take-off motion).
      if (canDive && auto && !l.plan) this.planGroundDive(l);
      const planned = canDive && auto && l.plan?.style === "dive" ? l.plan : null;
      if (
        planned
          ? l.elapsed + 1e-8 >= planned.at
          : canDive &&
            !auto &&
            ballGap >= GROUND_REACH &&
            ballGap <= RULES.groundDiveReach &&
            s.ball.y < 1.1
      ) {
        // The ball is going by right now (closest it will get) and he cannot reach it on foot.
        const ahead = this.liveBall(l, l.elapsed + 0.05),
          away =
            !!planned || Math.hypot(ahead.x - l.fielderPos.x, ahead.z - l.fielderPos.z) >= ballGap;
        if (away) {
          l.diveTried = true;
          l.diver = l.fielder;
          l.catchStyle = "dive";
          l.catchMoment = l.elapsed;
          if (
            planned
              ? planned.success
              : this.rng() <
                this.diveChance(l.fielder, ballGap, RULES.groundDiveReach, GROUND_REACH)
          ) {
            diveStop = true;
            l.fielderPos.x = planned?.end?.x ?? lerp(l.fielderPos.x, s.ball.x, 0.85);
            l.fielderPos.z = planned?.end?.z ?? lerp(l.fielderPos.z, s.ball.z, 0.85);
            l.hold += RULES.diveGetUp;
            this.highlight(l, "호수비", l.elapsed);
          } else {
            l.downUntil = l.elapsed + RULES.diveMissDown;
            l.fielderPos.x = planned?.end?.x ?? lerp(l.fielderPos.x, s.ball.x, 0.5);
            l.fielderPos.z = planned?.end?.z ?? lerp(l.fielderPos.z, s.ball.z, 0.5);
            s.detail = "다이빙했지만 공이 빠져나갔습니다!";
          }
        }
      }
      if (
        diveStop ||
        (l.bounced &&
          // Not while in the air on a planned dive (the dive itself decides).
          !(
            l.plan?.style === "dive" &&
            !l.diveTried &&
            l.elapsed + 1e-8 >= (l.plan.launchAt ?? Infinity)
          ) &&
          // Nobody fields the ball before reacting to it (the catcher stands next to a bunt).
          l.elapsed + 1e-8 >= Math.max(fielderReaction, this.downTime(l)) &&
          Math.hypot(s.ball.x - l.fielderPos.x, s.ball.z - l.fielderPos.z) < GROUND_REACH &&
          s.ball.y < 1.1)
      ) {
        if (!diveStop) l.catchStyle = l.ground ? "ground" : "catch";
        l.catchMoment ??= l.elapsed;
        l.fieldedAt = l.elapsed;
        l.state = "포구";
        s.detail =
          l.kind === "wild"
            ? "포수가 빠진 공을 잡았습니다 · 송구 판단"
            : "공을 잡았습니다 · 곧바로 송구";
        // Wet ball: sometimes the fielder bobbles it and loses time before the throw.
        if (this.raining && this.rng() < RULES.rainBobble) {
          l.hold += RULES.rainBobbleTime;
          s.detail = "빗물에 미끄러져 공을 더듬었습니다!";
          this.log("빗속 수비 실수 · 공을 더듬음");
        }
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
          this.closePlay(l, t);
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
        this.earn(
          XP.hit[Math.min(4, n)],
          n >= 4 ? "홈런" : n === 3 ? "3루타" : n === 2 ? "2루타" : "안타",
        );
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
      message = "폭투";
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
      pace = this.runnerPace(formOf(this.batting ? this.runnerOnFirst : this.batter).speed);
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
    const chase = this.interceptTime(l, l.defenders[1], 1) + l.hold;
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
    s.message = "폭투";
    s.detail = "공이 포수 뒤로 빠졌습니다 · 주자 진루 시도";
    this.callout("폭투", this.batting ? "gold" : "red");
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
    return Math.max(pickup + Math.max(0.22, distance(at, bag) / this.armOf(l)), eta + 0.02);
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
      hold:
        stage.catcherTransfer +
        this.rng() * RULES.catcherTransferGamble +
        (this.raining ? RULES.rainCatcherTransfer : 0),
      throwSpeed: stage.catcherArm * (this.raining ? RULES.rainCatcherArm : 1),
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
    // Runners who have already been thrown at this plate appearance rarely gamble again.
    const leaning = this.rng() < RULES.pickoffCaution ** s.pickoffs,
      caution = leaning ? 1 : 0.3,
      gamble = RULES.runnerLeadGamble * this.stageRules.leadGamble * caution,
      runners = this.baseRunners(RULES.runnerLead, RULES.runnerReaction);
    s.pickoffs++;
    s.energy = clamp(
      s.energy -
        pitchEnergyCost(s.effort, this.playerStats.stamina) *
          RULES.pickoffEnergy *
          (this.raining ? RULES.rainStamina : 1),
      0,
      100,
    );
    for (const r of runners) {
      r.progress = r.from + (RULES.runnerLead + this.rng() * gamble) / BASE_PATH_LENGTH;
      // Only the runner being thrown at dives back; the others just step back to the bag.
      r.delay =
        r.from === base
          ? RULES.runnerReaction +
            this.rng() * RULES.runnerReactionGamble * this.stageRules.leadGamble * caution
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
    // The sign can be given before the pitch, or while the last play's result is shown.
    const between = s.phase === "result" && s.outs < 3;
    if (!this.batting || s.mode !== "match" || (s.phase !== "ready" && !between) || s.paused)
      return false;
    if (!s.bases[0] || s.bases[1]) return false;
    s.stealCall = !s.stealCall;
    // Keep the result of the last play on screen; the steal button shows the sign.
    if (between) {
      this.emit();
      return true;
    }
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
      // Rain: before every new inning (never before the first) a coin decides if play goes on.
      if (this.raining && s.half === "bottom") {
        s.coin = { result: this.rng() < RULES.rainContinue ? "go" : "cancel" };
        s.message = "빗줄기가 거세다";
        s.detail = "동전 던지기로 경기 진행 여부를 정합니다";
      }
      this.emit();
      return;
    }
    this.ready();
  }
  /** Shows a big centre-screen callout. */
  callout(text: string, tone = "gold") {
    this.flashId++;
    this.state.flash = { text, tone, id: this.flashId };
  }
  private flashId = 0;
  private fullCountKey = "";
  private ready() {
    const s = this.state;
    // 3 balls, 2 strikes: once per plate appearance, announce the full count.
    const key = `${s.inning}|${s.half}|${s.order[0]}|${s.order[1]}`;
    if (s.mode === "match" && s.balls === 3 && s.strikes === 2 && this.fullCountKey !== key) {
      this.fullCountKey = key;
      this.callout("풀카운트", "gold");
    }
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
    if (s.coin?.result === "cancel") {
      this.rainout();
      return;
    }
    s.coin = null;
    s.bases = [false, false, false];
    s.pickoffs = 0;
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
  /** Rain called the match: it ends here and counts with the current score. */
  rainout() {
    const s = this.state;
    if (s.mode !== "match" || s.phase === "finished") return;
    s.rainedOut = true;
    s.coin = null;
    this.finish();
  }
  private finish() {
    const s = this.state;
    s.phase = "finished";
    s.message = s.rainedOut
      ? "우천취소"
      : s.score[1] > s.score[0]
        ? "VICTORY"
        : s.score[1] === s.score[0]
          ? "DRAW"
          : "GAME OVER";
    const [away, home] = this.teams;
    s.detail = `${s.rainedOut ? `${s.inning - (s.half === "bottom" ? 0 : 1)}회까지 · 현재 점수로 결과 처리 · ` : ""}${away} ${s.score[0]} : ${s.score[1]} ${home}`;
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
      // Scout gauge: every reason as its own line; caps and the pro scale are lines too, so the
      // recap always adds up to the real gain.
      const won = s.score[1] > s.score[0],
        drew = s.score[1] === s.score[0],
        parts: RecapLine[] = [{ label: "경기 출전", value: 7 }];
      if (this.matchStrikeouts)
        parts.push({ label: `탈삼진 ${this.matchStrikeouts}개`, value: this.matchStrikeouts });
      if (s.hits[1]) parts.push({ label: `팀 안타 ${s.hits[1]}개`, value: s.hits[1] });
      if (s.score[0]) parts.push({ label: `실점 ${s.score[0]}`, value: -s.score[0] });
      if (won) parts.push({ label: "승리", value: 5 });
      const raw = parts.reduce((a, p) => a + p.value, 0),
        bounded = clamp(raw, 3, 18);
      if (bounded !== raw)
        parts.push({
          label: bounded > raw ? "최소 보장(3)" : "한 경기 최대(18)",
          value: bounded - raw,
        });
      const scaled = clamp(Math.round(bounded * this.stageRules.gaugeGain), 2, 18);
      if (scaled !== bounded)
        parts.push({ label: `프로 기준 ×${this.stageRules.gaugeGain}`, value: scaled - bounded });
      const gain = scaled;
      const before = c.scout;
      c.scout = clamp(c.scout + gain, 0, 100);
      if (c.scout - before < gain)
        parts.push({ label: "평가 최대 100", value: c.scout - before - gain });
      s.lastScout = { before, after: c.scout };
      s.lastScoutParts = parts;
      const team = teamOf(c.team);
      // The dream comes true: the watching club offers a contract at 100.
      if (c.stage === "high" && team && c.scout >= 100 && !c.draft) {
        c.draft = `${team.city} ${team.name} 입단`;
        c.club = team.id;
        c.history = [`${team.name} 스카우트의 입단 제의! 꿈이 이루어졌다`, ...c.history];
      }
      // Pro stage: the same gauge is the manager's trust; full trust opens the rotation.
      if (c.stage === "pro" && c.scout >= 100 && !c.proGoal && c.league !== "mlb") {
        c.proGoal = true;
        c.mlbScouts = Object.fromEntries(MLB_TEAMS.map((t) => [t.id, 0]));
        c.history = [`${STAGES.pro.goalReward}! 2군을 졸업하고 1군으로 올라섰다`, ...c.history];
      } else if (tierOf(c) === "first") {
        // Major-league scouts all watch the first team; each likes something different.
        // A scout at 100 waits: the player keeps playing until he signs (or turns all down).
        const scouts = c.mlbScouts ?? Object.fromEntries(MLB_TEAMS.map((t) => [t.id, 0]));
        s.lastMlb = MLB_TEAMS.map((t) => {
          const before = scouts[t.id] ?? 0,
            liked =
              t.focus === "strikeouts"
                ? this.matchStrikeouts * 1.2
                : t.focus === "wins"
                  ? won
                    ? 7
                    : drew
                      ? 2
                      : 0
                  : t.focus === "hits"
                    ? s.hits[1] * 0.9
                    : Math.max(0, 6 - s.score[0]) * 1.2,
            gain = Math.round(clamp(bounded * 0.45 + liked, 2, 16));
          scouts[t.id] = clamp(before + gain, 0, 100);
          if (before < 100 && scouts[t.id] >= 100)
            c.history = [`${t.city} ${t.name} 스카우트가 계약 제안을 들고 기다린다`, ...c.history];
          return { id: t.id, before, after: scouts[t.id] };
        });
        c.mlbScouts = scouts;
      }
      const xpParts: RecapLine[] = [...this.xpParts].map(([label, p]) => ({
        label: `${label} ×${p.count}`,
        value: p.xp,
      }));
      xpParts.push({ label: "경기 완주", value: XP.complete });
      if (won) xpParts.push({ label: "승리", value: XP.win });
      else if (drew) xpParts.push({ label: "무승부", value: XP.draw });
      const xp = xpParts.reduce((a, p) => a + p.value, 0);
      s.lastXpParts = xpParts;
      c.xp += xp;
      s.lastXpGain = xp;
      s.detail += ` · 경험치 +${xp} XP`;
      c.history = [
        `${c.day - 1}일차 경기 · ${won ? "승리" : drew ? "무승부" : "패배"} ${s.score[1]}:${s.score[0]} · +${xp} XP · 스카우트 +${c.scout - before}`,
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
        running: { cost: 16, stat: "stamina", gain: 1, name: "장거리 러닝" },
        sprint: { cost: 16, stat: "speed", gain: 1, name: "스프린트·주루 훈련" },
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
    const cap = statCapOf(c);
    if (o.stat && c.stats[o.stat] >= cap)
      return { ok: false, message: "이미 최고 능력치입니다. 다른 훈련을 선택하세요." };
    const q = clamp(Number.isFinite(quality) ? quality : 0, 0, 1),
      grade = q >= 0.85 ? "완벽" : q >= 0.4 ? "좋음" : "아쉬움";
    if (o.stat) o.gain = (q >= 0.85 ? 2 : q >= 0.4 ? 1 : 0) * this.stageRules.trainGain;
    else if (kind === "study") o.gain = Math.round(2 + q * 4);
    c.energy = clamp(c.energy - o.cost, 0, 100);
    c.actions--;
    c.xp += kind === "rest" ? XP.rest : XP.training;
    if (o.stat) {
      const before = c.stats[o.stat];
      c.stats[o.stat] = clamp(before + o.gain, 0, cap);
      // The team grows too: TEAM_GROWTH of the rise in the player's average (7 stats).
      const rise = c.stats[o.stat] - before,
        n = Object.keys(c.stats).length;
      c.teamBoost = (c.teamBoost ?? 0) + (rise / n) * TEAM_GROWTH;
    } else c.form = clamp(c.form + o.gain, 0, 100);
    if (o.stat) c.form = clamp(c.form - 2, 0, 100);
    c.scout = clamp(c.scout + (o.stat ? 0.5 : 0), 0, 100);
    c.history = [
      `${c.day}일차 · ${o.name}${o.stat ? ` (${grade}) +${o.gain}` : ""}`,
      ...c.history,
    ].slice(0, 12);
    this.checkHiddenPitches();
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
    c.history = [
      `신이 내린 ${pick.tier} · ${josa(p.name, "을를")} 손에 넣었다`,
      ...c.history,
    ].slice(0, 12);
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
    if (isLegendName(c.name)) {
      // Hidden start: every stat at 200, seven pitches, and no roulette.
      c.legend = true;
      for (const k of keys) c.stats[k] = STAGES.pro.statCap;
      c.pitches = [...LEGEND_PITCHES];
      c.blessing = "legend";
      c.history = [`??? · 히든 조건 달성 · 이도류 전설이 고교 무대에 섰다`, ...c.history];
      this.state.hiddenUnlock = "legend";
    }
    this.checkHiddenPitches();
    this.persist();
    this.emit();
    return { ok: true, message: "선수 등록 완료" };
  }
  /**
   * Developer mode: every stat to 100 or 200. 200 also lifts the stat cap to 200 for this
   * career (even in high school), so later training and reloading keep it.
   */
  devSetStats(value: 100 | 200 | 250) {
    const c = this.state.career;
    if (value === 200) c.legend = true;
    if (value === LIMITLESS_CAP) c.devCap = LIMITLESS_CAP;
    for (const k of Object.keys(c.stats) as StatKey[]) c.stats[k] = value;
    c.history = [`개발자 모드 · 모든 능력치 ${value}`, ...c.history].slice(0, 12);
    this.persist();
    this.emit();
  }
  /**
   * Developer mode: the stage's gauge to 99 (scout evaluation in high school, first-team
   * trust in the pros), so the next good match reaches the goal.
   */
  /**
   * Developer mode: the stage's gauge straight to 100, with what 100 brings: the high-school
   * contract (signing ending), promotion to the 1st team, or every MLB offer at once.
   */
  devGauge100() {
    const c = this.state.career,
      tier = tierOf(c);
    if (tier === "mlb") return false;
    if (tier === "first") c.mlbScouts = Object.fromEntries(MLB_TEAMS.map((t) => [t.id, 100]));
    else if (tier === "farm") {
      c.scout = 100;
      c.proGoal = true;
      c.mlbScouts = Object.fromEntries(MLB_TEAMS.map((t) => [t.id, 0]));
    } else {
      const team = teamOf(c.team);
      if (!team) return false;
      c.scout = 100;
      if (!c.draft) {
        c.draft = `${team.city} ${team.name} 입단`;
        c.club = team.id;
      }
    }
    c.history = [`개발자 모드 · ${gaugeName(c)} 100`, ...c.history].slice(0, 12);
    this.persist();
    this.start("match");
    return true;
  }
  /** Developer mode: end the current season match as a 3:0 win (rewards as after a real game). */
  devWin() {
    const s = this.state;
    if (s.mode !== "match" || s.phase === "finished") this.start("match");
    Object.assign(this.state, {
      inning: this.state.maxInnings,
      half: "bottom",
      outs: 3,
      score: [0, 3],
      phase: "result",
      flight: null,
      live: null,
    });
    this.state.lines[1][this.state.maxInnings - 1] = 3;
    this.next();
    return this.state.phase === "finished";
  }
  devGauge99() {
    const c = this.state.career;
    c.scout = tierOf(c) === "first" ? 100 : 99;
    // In the first team the gauges that matter are the MLB scouts.
    if (tierOf(c) === "first") c.mlbScouts = Object.fromEntries(MLB_TEAMS.map((t) => [t.id, 99]));
    c.history = [`개발자 모드 · ${gaugeName(c)} 99`, ...c.history].slice(0, 12);
    this.persist();
    this.emit();
  }
  /** Today's weather as the daily screen forecasts it (always clear with rain turned off). */
  get forecast(): Weather {
    return this.state.rainOn ? weatherOf(this.state.career) : "clear";
  }
  /** Settings: turn rain on or off. Off also stops the rain in the current match. */
  setRain(on: boolean) {
    const s = this.state;
    s.rainOn = on;
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(RAIN_KEY, on ? "on" : "off");
    } catch {}
    if (!on) {
      s.weather = "clear";
      s.coin = null;
    } else if (s.mode === "match" && !this.matchActive) s.weather = weatherOf(s.career);
    this.emit();
  }
  /** Developer mode: make it rain on this match now (a new match if the last one is over). */
  devRain() {
    if (this.state.mode !== "match" || this.state.phase === "finished") this.start("match");
    const s = this.state;
    s.weather = "rain";
    this.log("개발자 모드 · 비가 내리기 시작했다");
    this.emit();
    return true;
  }
  /** Rain is falling on this season match. */
  get raining() {
    return this.state.mode === "match" && this.state.weather === "rain";
  }
  /** Cheer is lowering the rivals this inning. */
  get cheerActive() {
    const s = this.state;
    return s.mode === "match" && s.cheerInning > 0 && s.cheerInning === s.inning;
  }
  /** Limit break is on this inning. */
  get limitActive() {
    const s = this.state;
    if (s.mode !== "match") return false;
    // Armed: waiting for the next pitch. Then it lasts for that one pitch (and the play it
    // makes) only; the next pitch is back to normal.
    return (
      s.limitArmed ||
      (!!s.flight?.limit && s.phase !== "ready" && s.phase !== "between" && s.phase !== "finished")
    );
  }
  /** Stamina the next limit break costs (0 while free uses remain). */
  get limitCost() {
    return this.state.limitUsed >= RULES.limitBreakFree ? RULES.limitBreakEnergy : 0;
  }
  /** Limit break is unlocked: every stat at 250. */
  get canLimitBreak() {
    return Object.values(this.state.career.stats).every((v) => v >= LIMITLESS_CAP);
  }
  /** The player's stats as the game uses them right now (300 across the board in a limit break). */
  get playerStats(): Career["stats"] {
    const st = this.state.career.stats;
    if (!this.limitActive) return st;
    return Object.fromEntries(Object.keys(st).map((k) => [k, LIMIT_BREAK])) as Career["stats"];
  }
  /** A rival player while our cheer squad is at work: every rating −15. */
  cheered(p: Player): Player {
    return this.cheerActive
      ? {
          ...p,
          contact: p.contact - CHEER_DROP,
          power: p.power - CHEER_DROP,
          eye: p.eye - CHEER_DROP,
          speed: p.speed - CHEER_DROP,
        }
      : p;
  }
  /** T: our cheerleaders and fans rattle the rivals for one inning. Once per match, pros only. */
  cheer() {
    const s = this.state;
    if (s.mode !== "match" || s.career.stage !== "pro" || s.cheerUsed || s.phase === "finished")
      return false;
    s.cheerUsed = true;
    s.cheerInning = s.inning;
    this.log(`${s.inning}회 · 응원단과 팬들의 함성! 상대 능력치 −${CHEER_DROP}`);
    this.sound("hit");
    this.emit();
    return true;
  }
  /**
   * G: limit break for the very next pitch (pitching or batting): every stat 300 for that one
   * pitch and its play. Needs every stat at 250. Three free uses a match, then stamina −25 each.
   */
  limitBreak() {
    const s = this.state;
    if (
      s.mode !== "match" ||
      !this.canLimitBreak ||
      this.limitActive ||
      (s.phase !== "ready" && s.phase !== "between")
    )
      return false;
    const cost = this.limitCost;
    if (s.energy < cost) return false;
    s.energy -= cost;
    s.limitUsed++;
    s.limitArmed = true;
    this.log(
      `한계 돌파 ${s.limitUsed}회째${cost ? ` · 체력 −${cost}` : " · 무료"} · 다음 1구 모든 능력치 ${LIMIT_BREAK}`,
    );
    this.sound("hit");
    this.emit();
    return true;
  }
  /** MLB clubs whose scout has reached 100 (contract offers on the table). */
  get mlbOffers() {
    const c = this.state.career;
    return tierOf(c) === "first" && !c.limitless
      ? MLB_TEAMS.filter((t) => (c.mlbScouts?.[t.id] ?? 0) >= 100)
      : [];
  }
  /** Sign with an MLB club whose scout reached 100: hard mode, endless play. */
  signMlb(id: string) {
    const c = this.state.career,
      t = mlbTeamOf(id);
    if (!t || !this.mlbOffers.includes(t) || this.matchActive) return false;
    c.league = "mlb";
    c.mlbClub = t.id;
    // New club, new teammates: the team growth starts again.
    c.teamBoost = 0;
    c.history = [`${t.city} ${t.name}와 계약! MLB 하드 모드가 시작된다`, ...c.history].slice(0, 12);
    this.persist();
    this.start("match");
    return true;
  }
  /** Every MLB scout at 100 and all turned down: stay home, stat cap 250 (for the player only). */
  refuseMlb() {
    const c = this.state.career;
    if (tierOf(c) !== "first" || c.limitless || this.mlbOffers.length < MLB_TEAMS.length)
      return false;
    c.limitless = true;
    c.history = [
      `MLB의 모든 제안을 거절했다 · 한계가 사라진다 (능력치 상한 ${LIMITLESS_CAP})`,
      ...c.history,
    ].slice(0, 12);
    this.persist();
    this.emit();
    return true;
  }
  /**
   * Adds any hidden pitch whose secret condition the current stats meet. Once learned it
   * stays, even if the stats change later. Returns the newly unlocked pitch or null.
   */
  checkHiddenPitches(): PitchId | null {
    const c = this.state.career;
    let found: PitchId | null = null;
    for (const h of HIDDEN_UNLOCKS) {
      if (c.pitches.includes(h.id) || !h.test(c.stats)) continue;
      c.pitches = [...c.pitches, h.id];
      c.history = [
        `??? · 히든 구종 ${josa(pitchData(h.id).name, "을를")} 깨우쳤다`,
        ...c.history,
      ].slice(0, 12);
      found = h.id;
    }
    if (found) this.state.hiddenUnlock = found;
    return found;
  }
  clearHiddenUnlock() {
    this.state.hiddenUnlock = null;
    this.emit();
  }
  /** Developer mode: learn every pitch (hidden ones too) without spending XP. */
  devUnlockPitches() {
    const c = this.state.career;
    c.pitches = ALL_PITCHES.map((p) => p.id);
    if (!c.blessing) c.blessing = "none";
    c.history = ["개발자 모드 · 모든 구종 열기", ...c.history].slice(0, 12);
    this.persist();
    this.emit();
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
    return { ok: true, message: `${josa(p.name, "을를")} 익혔습니다! 투구 플랜에서 선택하세요.` };
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
    // New club, new teammates: the team growth starts again from zero.
    c.teamBoost = 0;
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
