/**
 * AI training ground: one round = workers `collect` plays with the current policies (now and
 * then against a past version of the other side), the `Learner` runs PPO on them, and every
 * so often `evaluate` plays a fixed set of situations against fixed opponents.
 * Runs the same in Node (scripts/train-ai.mjs, worker threads) and in the browser.
 */
import type { Chooser } from "../game/engine.ts";
import { AI_CONFIG, type AiConfig } from "./config.ts";
import { Adam } from "./net.ts";
import {
  NETS,
  chooser,
  exportBrains,
  importBrains,
  importPolicy,
  makeBrains,
  type Brains,
  type BrainsJson,
  type Decision,
  type NetName,
  type PoliciesJson,
  type Side,
} from "./agent.ts";
import { buildSamples, ppoUpdate, type Episode, type UpdateStats } from "./ppo.ts";
import { engineFor, lcg, randomSituation, runPlay, type PlayStats } from "./scenario.ts";
import { nearestThrow, safeRunner } from "./rules.ts";

export type Job = { current: PoliciesJson; pool: PoliciesJson[]; n: number; seed: number; cfg: AiConfig };
export type Collected = {
  episodes: Episode[];
  plays: number;
  /** Event rewards (without step costs) summed over the plays: runners, fielders. */
  reward: [number, number];
  outs: number;
  runs: number;
  seconds: number;
  pastPlays: number;
};

const emptyStats = (): PlayStats => ({
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
});
function addStats(a: PlayStats, b: PlayStats) {
  for (const k of Object.keys(a) as (keyof PlayStats)[])
    if (k === "reward") {
      a.reward[0] += b.reward[0];
      a.reward[1] += b.reward[1];
    } else (a[k] as number) += b[k] as number;
}

/** Worker side: plays `n` situations and records the learning sides' choices. */
export function collect(job: Job): Collected {
  const { cfg } = job,
    H = cfg.ppo.hidden,
    rnd = lcg(job.seed),
    cur = {
      runner: importPolicy(job.current.runner, 0, H),
      holder: importPolicy(job.current.holder, 1, H),
    },
    pool = job.pool.map((p) => ({
      runner: importPolicy(p.runner, 0, H),
      holder: importPolicy(p.holder, 1, H),
    })),
    out: Collected = {
      episodes: [],
      plays: job.n,
      reward: [0, 0],
      outs: 0,
      runs: 0,
      seconds: 0,
      pastPlays: 0,
    };
  for (let i = 0; i < job.n; i++) {
    const sit = randomSituation(rnd, cfg),
      g = engineFor(sit),
      clock = () => g.state.live?.elapsed ?? 0,
      log: Decision[] = [];
    let frozen: Side | -1 = -1,
      past = cur;
    if (pool.length && rnd() < cfg.league.pastOpponent) {
      frozen = rnd() < 0.5 ? 0 : 1;
      past = pool[Math.floor(rnd() * pool.length)];
      out.pastPlays++;
    }
    const run = chooser(frozen === 0 ? past.runner : cur.runner, 0, {
        rnd,
        log: frozen === 0 ? undefined : log,
        clock,
      }),
      hold = chooser(frozen === 1 ? past.holder : cur.holder, 1, {
        rnd,
        log: frozen === 1 ? undefined : log,
        clock,
      }),
      { events, stats } = runPlay(sit, run, hold, { g, cfg });
    out.episodes.push({ decisions: log, events, learn: [frozen !== 0, frozen !== 1] });
    out.reward[0] += stats.reward[0];
    out.reward[1] += stats.reward[1];
    out.outs += stats.outs;
    out.runs += stats.runs;
    out.seconds += stats.seconds;
  }
  return out;
}

export type RoundLog = {
  updates: number;
  plays: number;
  /** Average event reward per play (runners, fielders) and with the step costs. */
  reward: [number, number];
  rewardWithSteps: [number, number];
  outsPerPlay: number;
  runsPerPlay: number;
  seconds: number;
  pastShare: number;
} & UpdateStats;

/** Holds the networks, the optimisers and the pool of past versions. */
export class Learner {
  cfg: AiConfig;
  brains: Brains;
  opt: Record<NetName, Adam>;
  pool: PoliciesJson[] = [];
  updates = 0;
  plays = 0;
  rnd: () => number;
  constructor(cfg: AiConfig = AI_CONFIG) {
    this.cfg = cfg;
    this.brains = makeBrains(lcg(cfg.seed), cfg.ppo.hidden);
    this.rnd = lcg(cfg.seed * 7919 + 17);
    this.opt = Object.fromEntries(
      NETS.map((k) => [k, new Adam(this.brains[k].p.length)]),
    ) as Record<NetName, Adam>;
  }
  get policies(): PoliciesJson {
    return { runner: Array.from(this.brains.runner.p), holder: Array.from(this.brains.holder.p) };
  }
  /** Work for worker `w` this round (seeded: same seed and settings, same training). */
  job(n: number, w: number): Job {
    return {
      current: this.policies,
      pool: this.pool,
      n,
      seed: (this.cfg.seed * 1000003 + this.updates * 131 + w * 7) >>> 0,
      cfg: this.cfg,
    };
  }
  learn(parts: Collected[]): RoundLog {
    const episodes = parts.flatMap((p) => p.episodes),
      plays = parts.reduce((s, p) => s + p.plays, 0),
      { samples, reward } = buildSamples(this.brains, episodes, this.cfg),
      learnt = [0, 1].map((side) => episodes.filter((e) => e.learn[side]).length || 1),
      stats = ppoUpdate(this.brains, this.opt, samples, this.cfg, this.rnd);
    this.updates++;
    this.plays += plays;
    if (this.updates % this.cfg.league.snapshotEvery === 0) {
      this.pool.push(this.policies);
      if (this.pool.length > this.cfg.league.poolSize) this.pool.shift();
    }
    const sum = (f: (p: Collected) => number) => parts.reduce((s, p) => s + f(p), 0);
    return {
      updates: this.updates,
      plays: this.plays,
      reward: [sum((p) => p.reward[0]) / plays, sum((p) => p.reward[1]) / plays],
      rewardWithSteps: [reward[0] / learnt[0], reward[1] / learnt[1]],
      outsPerPlay: sum((p) => p.outs) / plays,
      runsPerPlay: sum((p) => p.runs) / plays,
      seconds: sum((p) => p.seconds) / plays,
      pastShare: sum((p) => p.pastPlays) / plays,
      ...stats,
    };
  }
  checkpoint() {
    return {
      version: 1,
      seed: this.cfg.seed,
      hidden: this.cfg.ppo.hidden,
      updates: this.updates,
      plays: this.plays,
      brains: exportBrains(this.brains),
      pool: this.pool,
      opt: Object.fromEntries(
        NETS.map((k) => [k, { m: Array.from(this.opt[k].m), v: Array.from(this.opt[k].v), t: this.opt[k].t }]),
      ),
    };
  }
  static restore(j: ReturnType<Learner["checkpoint"]>, cfg: AiConfig = AI_CONFIG) {
    const l = new Learner(cfg),
      b = importBrains(j.brains as BrainsJson, cfg.ppo.hidden);
    if (!b) return null;
    l.brains = b;
    l.updates = j.updates ?? 0;
    l.plays = j.plays ?? 0;
    l.pool = Array.isArray(j.pool) ? j.pool : [];
    for (const k of NETS) {
      const o = j.opt?.[k];
      if (o && o.m?.length === l.opt[k].m.length) {
        l.opt[k].m.set(o.m);
        l.opt[k].v.set(o.v);
        l.opt[k].t = o.t;
      }
    }
    return l;
  }
}

/* ---------------------------------------------------------------- evaluation */

/** Who plays: L learned (best choices), H the game's hand-written AI, S safe runner,
 * N nearest-base thrower. Matchups are runners-fielders. */
export const MATCHUPS = ["L-L", "L-H", "L-N", "H-L", "S-L", "H-H", "S-N"] as const;
export type Matchup = (typeof MATCHUPS)[number];
export type EvalSums = {
  plays: number;
  stats: Record<Matchup, PlayStats>;
  /** Learned runners: choices with a base a full second ahead of the ball, and how many
   * of those stayed or went back (the "stand still" strategy). */
  passive: { chances: number; stayed: number };
  /** Learned vs learned against hand-written vs hand-written, same situation. */
  duel: { runner: number; fielder: number };
  /** Same-situation reward differences against the hand-written AI (sum, sum of squares):
   * learned runners (L-H − H-H, runner reward), learned fielders (H-L − H-H, fielder reward). */
  paired: { runner: [number, number]; fielder: [number, number] };
};

export function evaluate(
  p: PoliciesJson,
  n: number,
  seed: number,
  cfg: AiConfig = AI_CONFIG,
  part = 0,
  parts = 1,
  /** Only these matchups (the training ground's quick check: L-L, H-H, L-H, H-L). */
  only: readonly Matchup[] = MATCHUPS,
): EvalSums {
  const H = cfg.ppo.hidden,
    runL = importPolicy(p.runner, 0, H),
    holdL = importPolicy(p.holder, 1, H),
    rnd = lcg(seed),
    sits = Array.from({ length: n }, () => randomSituation(rnd, cfg)),
    sums: EvalSums = {
      plays: 0,
      stats: Object.fromEntries(MATCHUPS.map((m) => [m, emptyStats()])) as Record<Matchup, PlayStats>,
      passive: { chances: 0, stayed: 0 },
      duel: { runner: 0, fielder: 0 },
      paired: { runner: [0, 0], fielder: [0, 0] },
    };
  const fielderReward: Partial<Record<Matchup, number>> = {};
  for (let i = part; i < n; i += parts) {
    const sit = sits[i];
    sums.plays++;
    const reward: Partial<Record<Matchup, number>> = {};
    for (const m of only) {
      const [rk, dk] = m.split("-"),
        log: Decision[] = [],
        runner: Chooser | null =
          rk === "L" ? chooser(runL, 0, { greedy: true, log }) : rk === "S" ? safeRunner : null,
        holder: Chooser | null =
          dk === "L" ? chooser(holdL, 1, { greedy: true }) : dk === "N" ? nearestThrow : null,
        { stats } = runPlay(sit, runner, holder, { cfg });
      addStats(sums.stats[m], stats);
      reward[m] = stats.reward[0];
      fielderReward[m] = stats.reward[1];
      if (rk === "L")
        for (const d of log) {
          const chance = d.options.some((o) => o[4] > 0 && o[0] > 0.5);
          if (!chance) continue;
          sums.passive.chances++;
          if (d.options[d.pick][4] <= 0) sums.passive.stayed++;
        }
    }
    const dr = (reward["L-H"] ?? 0) - (reward["H-H"] ?? 0),
      df = (fielderReward["H-L"] ?? 0) - (fielderReward["H-H"] ?? 0);
    sums.paired.runner[0] += dr;
    sums.paired.runner[1] += dr * dr;
    sums.paired.fielder[0] += df;
    sums.paired.fielder[1] += df * df;
    const ll = reward["L-L"] ?? 0,
      hh = reward["H-H"] ?? 0;
    if (ll > hh + 1e-9) sums.duel.runner++;
    else if (ll < hh - 1e-9) sums.duel.fielder++;
  }
  return sums;
}

export function mergeEval(parts: EvalSums[]): EvalSums {
  const out: EvalSums = {
    plays: 0,
    stats: Object.fromEntries(MATCHUPS.map((m) => [m, emptyStats()])) as Record<Matchup, PlayStats>,
    passive: { chances: 0, stayed: 0 },
    duel: { runner: 0, fielder: 0 },
    paired: { runner: [0, 0], fielder: [0, 0] },
  };
  for (const p of parts) {
    out.plays += p.plays;
    for (const m of MATCHUPS) addStats(out.stats[m], p.stats[m]);
    out.passive.chances += p.passive.chances;
    out.passive.stayed += p.passive.stayed;
    out.duel.runner += p.duel.runner;
    out.duel.fielder += p.duel.fielder;
    for (const k of ["runner", "fielder"] as const)
      for (const i of [0, 1]) out.paired[k][i] += p.paired[k][i];
  }
  return out;
}

const rate = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : null);
const avg = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 1000 : null);

/** The numbers for the log: rates in %, averages per play. */
export function summarize(e: EvalSums) {
  const per = Object.fromEntries(
    MATCHUPS.map((m) => {
      const s = e.stats[m];
      return [
        m,
        {
          runnerOut: rate(s.outs, s.runners),
          extraTry: rate(s.attempts, s.runners),
          extraSafe: rate(s.extraSafe, s.attempts),
          extraOut: rate(s.extraOut, s.attempts),
          reversals: avg(s.reversals, e.plays),
          dances: rate(s.dances, e.plays),
          runs: avg(s.runs, e.plays),
          rightBase: rate(s.throwCorrect, s.throwChances),
          throwOut: rate(s.throwOuts, s.throws),
          heldOnOut: rate(s.heldOnOut, s.throwChances),
          throwErrors: avg(s.throwErrors, e.plays),
          runnerReward: avg(s.reward[0], e.plays),
          fielderReward: avg(s.reward[1], e.plays),
          seconds: avg(s.seconds, e.plays),
        },
      ];
    }),
  );
  // Mean same-situation gain over the hand-written AI and its standard error.
  const gain = ([s1, s2]: [number, number]) => {
    const n = e.plays,
      mean = n ? s1 / n : 0,
      se = n > 1 ? Math.sqrt(Math.max(0, s2 / n - mean * mean) / (n - 1)) : 0;
    return { mean: Math.round(mean * 1000) / 1000, se: Math.round(se * 1000) / 1000 };
  };
  return {
    plays: e.plays,
    vsHand: { runner: gain(e.paired.runner), fielder: gain(e.paired.fielder) },
    matchups: per,
    passive: rate(e.passive.stayed, e.passive.chances),
    duel: { runner: rate(e.duel.runner, e.duel.runner + e.duel.fielder), fielder: rate(e.duel.fielder, e.duel.runner + e.duel.fielder) },
  };
}
export type { BrainsJson };
