/**
 * The learned runner and fielder AI (AI training ground).
 *
 * Each decision scores every legal option with a small policy network (play context + that
 * option's numbers → one score); the choice is drawn from the softmax of the scores while
 * learning, the best one when playing for real. Each side also has a value network (play
 * context → expected reward from here) for PPO's advantages.
 */
import { AI_CTX, AI_HOLDER, AI_RUNNER, type Chooser } from "../game/engine.ts";
import { forward, makeNet, type Net } from "./net.ts";

export type Side = 0 | 1; // 0 runners, 1 fielder with the ball
export type Brains = { runner: Net; holder: Net; runnerValue: Net; holderValue: Net };
export const NETS = ["runner", "holder", "runnerValue", "holderValue"] as const;
export type NetName = (typeof NETS)[number];

export function makeBrains(rnd: () => number, hidden = 24): Brains {
  return {
    runner: makeNet(AI_CTX + AI_RUNNER, hidden, rnd),
    holder: makeNet(AI_CTX + AI_HOLDER, hidden, rnd),
    runnerValue: makeNet(AI_CTX, hidden, rnd),
    holderValue: makeNet(AI_CTX, hidden, rnd),
  };
}
export const policyOf = (b: Brains, side: Side) => (side === 0 ? b.runner : b.holder);
export const valueOf = (b: Brains, side: Side) => (side === 0 ? b.runnerValue : b.holderValue);

/** One choice made during a play (to learn from afterwards). t: play time in s. */
export type Decision = { side: Side; t: number; ctx: number[]; options: number[][]; pick: number };

const scratch = new Float64Array(256);
export function optionScores(net: Net, ctx: number[], options: number[][], hs?: Float64Array[]) {
  return options.map((o, i) => forward(net, [...ctx, ...o], hs?.[i] ?? scratch));
}
export function softmax(z: number[]) {
  const m = Math.max(...z),
    e = z.map((v) => Math.exp(v - m)),
    sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

/**
 * A Chooser for the engine. greedy: always the best option; log: record the choices
 * (with the play time from `clock`) for learning or metrics.
 */
export function chooser(
  net: Net,
  side: Side,
  opts: { greedy?: boolean; rnd?: () => number; log?: Decision[]; clock?: () => number } = {},
): Chooser {
  const rnd = opts.rnd ?? Math.random;
  return (ctx, options) => {
    const z = optionScores(net, ctx, options);
    let pick = 0;
    if (opts.greedy) {
      for (let i = 1; i < z.length; i++) if (z[i] > z[pick]) pick = i;
    } else {
      const p = softmax(z);
      let u = rnd();
      pick = p.length - 1;
      for (let i = 0; i < p.length; i++) {
        u -= p[i];
        if (u < 0) {
          pick = i;
          break;
        }
      }
    }
    opts.log?.push({
      side,
      t: opts.clock?.() ?? 0,
      ctx: ctx.slice(),
      options: options.map((o) => o.slice()),
      pick,
    });
    return pick;
  };
}

/** Plain arrays for messages and files. */
export type BrainsJson = Record<NetName, number[]>;
export const exportBrains = (b: Brains): BrainsJson =>
  Object.fromEntries(NETS.map((k) => [k, Array.from(b[k].p)])) as BrainsJson;
export function importBrains(j: Partial<BrainsJson>, hidden = 24): Brains | null {
  const b = makeBrains(Math.random, hidden);
  for (const k of NETS) {
    const src = j?.[k];
    if (!Array.isArray(src) || src.length !== b[k].p.length) return null;
    b[k].p.set(src);
  }
  return b;
}
/** Only the two policies (what a past opponent or the game needs). */
export type PoliciesJson = { runner: number[]; holder: number[] };
export function importPolicy(arr: number[], side: Side, hidden = 24): Net {
  const n = makeNet(AI_CTX + (side === 0 ? AI_RUNNER : AI_HOLDER), hidden, Math.random);
  n.p.set(arr);
  return n;
}
