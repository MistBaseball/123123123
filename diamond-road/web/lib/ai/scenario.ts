/**
 * AI training ground episodes: one batted ball, from contact until the play is over.
 * The starting situation (outs, runners, the ball off the bat, abilities) is drawn from
 * lib/ai/config.ts. A situation is plain data, so the same one can be replayed with other
 * AIs for fair comparisons. Rules (forces, tags, fly outs, runs, the third out) are the
 * game engine's own.
 */
import { BaseballEngine, newCareer, type Chooser, type Player } from "../game/engine.ts";
import { AI_CONFIG, type AiConfig, type BallKind, type Range } from "./config.ts";
import type { Side } from "./agent.ts";

export type Ball = {
  kind: BallKind;
  speedKmh: number;
  distance: number;
  angle: number;
  flightTime: number;
};
export type Situation = {
  seed: number;
  outs: number;
  bases: [boolean, boolean, boolean];
  ball: Ball;
  /** speed, eye, power (arm) of the nine fielders. */
  fielders: [number, number, number][];
  /** Runners' (and the batter's) speed rating. */
  speed: number;
};

/** Small seeded random numbers (same seed, same play). */
export function lcg(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(1664525, n) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
const within = (r: Range, u: number) => r[0] + (r[1] - r[0]) * u;
const clampTo = (v: number, r: Range) => Math.min(r[1], Math.max(r[0], v));

export function randomBall(rnd: () => number, cfg: AiConfig = AI_CONFIG): Ball {
  const kinds = Object.entries(cfg.ball.kinds) as [BallKind, number][],
    total = kinds.reduce((s, [, w]) => s + w, 0);
  let u = rnd() * total,
    kind: BallKind = kinds[kinds.length - 1][0];
  for (const [k, w] of kinds) {
    u -= w;
    if (u < 0) {
      kind = k;
      break;
    }
  }
  const spec = cfg.ball[kind],
    speedKmh = within(spec.speedKmh, rnd()),
    distance = within(spec.distance, rnd()),
    f = cfg.ball.flight[kind],
    flightTime = clampTo(distance / ((speedKmh / 3.6) * f.factor), f.clamp),
    // Normal spread (Box–Muller), kept inside the foul lines.
    g = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()),
    deg = Math.max(
      -cfg.ball.direction.maxDeg,
      Math.min(cfg.ball.direction.maxDeg, g * cfg.ball.direction.spreadDeg),
    );
  return { kind, speedKmh, distance, angle: (deg * Math.PI) / 180, flightTime };
}

export function randomSituation(rnd: () => number, cfg: AiConfig = AI_CONFIG): Situation {
  const rating = () => Math.round(within(cfg.start.fielderRating, rnd()));
  let u = rnd(),
    outs = 2;
  for (let i = 0; i < 3; i++) {
    u -= cfg.start.outs[i];
    if (u < 0) {
      outs = i;
      break;
    }
  }
  return {
    seed: Math.floor(rnd() * 2 ** 31),
    outs,
    bases: [rnd() < cfg.start.bases[0], rnd() < cfg.start.bases[1], rnd() < cfg.start.bases[2]],
    ball: randomBall(rnd, cfg),
    fielders: Array.from({ length: 9 }, () => [rating(), rating(), rating()]),
    speed: Math.round(within(cfg.start.runnerSpeed, rnd())),
  };
}

const player = (speed: number, eye: number, power: number): Player => ({
  name: "",
  hand: "R",
  contact: 60,
  power,
  eye,
  speed,
});

export const engineFor = (sit: Situation) => new BaseballEngine(newCareer(), lcg(sit.seed));

/** Engine set up at the moment of contact (the play is live after this). */
export function startPlay(
  sit: Situation,
  runner: Chooser | null,
  holder: Chooser | null,
  g = engineFor(sit),
) {
  const team = sit.fielders.map(([sp, eye, pw]) => player(sp, eye, pw)),
    batter = player(sit.speed, 60, 60);
  Object.defineProperty(g, "fielders", { get: () => team, configurable: true });
  Object.defineProperty(g, "batter", { get: () => batter, configurable: true });
  const s = g.state;
  s.rainOn = false;
  s.weather = "clear";
  s.outs = sit.outs;
  s.bases = [...sit.bases];
  s.balls = 0;
  s.strikes = 0;
  g.runnerBrain = runner;
  g.fielderBrain = holder;
  g.battedBall(sit.ball);
  return g;
}

/** Something that earns a side reward at play time t. */
export type RewardEvent = { side: Side; t: number; r: number };

/** What happened on a play (for rewards, metrics and the training-ground screen). */
export type PlayStats = {
  runners: number;
  outs: number;
  runs: number;
  seconds: number;
  /** Runners who ran on past the base the hit gave them (an extra base), and those who
   * made it safely. */
  attempts: number;
  extraSafe: number;
  /** ...and those thrown out on it (the rest went back safely). */
  extraOut: number;
  /** Times runners turned around, and plays where one runner turned 3+ times ("dancing"). */
  reversals: number;
  dances: number;
  throws: number;
  /** Force and tag outs (a throw got there in time). */
  throwOuts: number;
  throwErrors: number;
  /** Throw decisions with an out on offer, how many took the surest one, how many held. */
  throwChances: number;
  throwCorrect: number;
  heldOnOut: number;
  /** Event rewards (no per-decision step cost): runners, fielders. */
  reward: [number, number];
};

/**
 * Plays a situation to the end with the given AIs (null = the hand-written AI) and returns
 * the reward events of both sides and the play's numbers.
 */
export function runPlay(
  sit: Situation,
  runner: Chooser | null,
  holder: Chooser | null,
  opts: { g?: BaseballEngine; dt?: number; cfg?: AiConfig } = {},
) {
  const cfg = opts.cfg ?? AI_CONFIG,
    dt = opts.dt ?? 1 / 60,
    g = opts.g ?? engineFor(sit),
    before = g.state.score[0] + g.state.score[1],
    stats: PlayStats = {
      runners: 0,
      outs: 0,
      runs: 0,
      seconds: 0,
      attempts: 0,
      extraSafe: 0,
      extraOut: 0,
      reversals: 0,
      dances: 0,
      throws: 0,
      throwOuts: 0,
      throwErrors: 0,
      throwChances: 0,
      throwCorrect: 0,
      heldOnOut: 0,
      reward: [0, 0],
    };
  g.throwObserver = (_ctx, options, pick) => {
    // Throw options have [0] = 0 and [1] = (runner arrival − ball arrival)/2.
    let best = -1;
    for (let i = 0; i < options.length; i++)
      if (options[i][0] === 0 && options[i][1] > 0 && (best < 0 || options[i][1] > options[best][1]))
        best = i;
    if (best < 0) return;
    stats.throwChances++;
    if (pick === best) stats.throwCorrect++;
    if (options[pick][0] === 1 && options[best][1] > 0.25) stats.heldOnOut++;
  };
  startPlay(sit, runner, holder, g);
  const l = g.state.live!,
    natural = l.runners.map((r) => r.target),
    most = l.runners.map((r) => r.progress),
    reach = l.runners.map(() => [0, 0, 0, 0, 0] as number[]),
    events: RewardEvent[] = [];
  let miscues = 0,
    lastThrow = l.throw,
    n = 0;
  const watch = () => {
    l.runners.forEach((r, i) => {
      most[i] = Math.max(most[i], r.progress);
      for (let b = r.from + 1; b <= 4; b++)
        if (r.progress >= b - 1e-9 && !reach[i][b]) reach[i][b] = l.elapsed || 1e-6;
    });
    if ((l.miscues ?? 0) > miscues && lastThrow?.wild) {
      events.push({ side: 1, t: l.elapsed, r: cfg.reward.fielder.throwError });
      stats.throwErrors++;
    }
    miscues = l.miscues ?? 0;
    lastThrow = l.throw;
  };
  watch();
  while (g.state.phase === "inplay" && n++ < 4000) {
    g.tick(dt);
    watch();
  }
  const s = g.state,
    runs = s.score[0] + s.score[1] - before,
    over = s.outs >= 3,
    R = cfg.reward;
  // Runs that counted: the first `runs` runners home (a third out cancels later ones).
  const counted = new Set(
    l.runners
      .filter((r) => !r.out && r.scoredAt !== null)
      .sort((a, b) => a.scoredAt! - b.scoredAt!)
      .slice(0, runs)
      .map((r) => r.id),
  );
  l.outs.forEach((o, k) => {
    events.push({ side: 0, t: o.time, r: R.runner.out });
    events.push({ side: 1, t: o.time, r: R.fielder.out + (k > 0 ? R.fielder.doublePlay : 0) });
    if (o.kind !== "fly") stats.throwOuts++;
  });
  l.runners.forEach((r, i) => {
    // He really ran on past that base (not just thought about it).
    const tried = natural[i] < 4 && most[i] > natural[i] + 0.15;
    if (tried) stats.attempts++;
    if (r.out) {
      if (tried) stats.extraOut++;
      return;
    }
    const scored = counted.has(r.id),
      kept = scored ? 3 : over ? r.from : Math.min(3, Math.floor(r.progress + 1e-9));
    for (let b = r.from + 1; b <= kept; b++) {
      const t = reach[i][b] || l.elapsed;
      events.push({ side: 0, t, r: R.runner.advance[b - 1] });
      events.push({ side: 1, t, r: R.fielder.advance });
    }
    if (scored) {
      events.push({ side: 0, t: r.scoredAt!, r: R.runner.run });
      events.push({ side: 1, t: r.scoredAt!, r: R.fielder.run });
    }
    if (tried && (scored || (!over && Math.floor(r.progress + 1e-9) > natural[i])))
      stats.extraSafe++;
  });
  for (const e of events) stats.reward[e.side] += e.r;
  stats.reversals = l.runners.reduce((s, r) => s + (r.reversals ?? 0), 0);
  stats.dances = l.runners.some((r) => (r.reversals ?? 0) >= 3) ? 1 : 0;
  stats.runners = l.runners.length;
  stats.outs = l.outs.length;
  stats.runs = runs;
  stats.seconds = l.elapsed;
  stats.throws = l.throws;
  g.throwObserver = null;
  return { g, events, stats };
}
