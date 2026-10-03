/**
 * PPO for the two learning sides. A side's decisions on a play form one trajectory in time
 * order; each decision is paid the rewards that happen from its moment until that side's
 * next decision (plus the per-decision step cost). Advantages: GAE(γ, λ). Update: clipped
 * surrogate, several epochs of minibatches, entropy bonus; value nets by squared error.
 */
import type { AiConfig } from "./config.ts";
import { backward, forward, type Adam } from "./net.ts";
import {
  optionScores,
  policyOf,
  softmax,
  valueOf,
  type Brains,
  type Decision,
  type NetName,
  type Side,
} from "./agent.ts";
import type { RewardEvent } from "./scenario.ts";

/** One play as the learner gets it. learn[side]: false when that side was a past version. */
export type Episode = { decisions: Decision[]; events: RewardEvent[]; learn: [boolean, boolean] };

type Sample = {
  side: Side;
  ctx: number[];
  options: number[][];
  pick: number;
  logp: number;
  adv: number;
  ret: number;
};

const h = new Float64Array(256);

/** Per-decision returns and advantages (with the policy as it is now = the one that played). */
export function buildSamples(b: Brains, episodes: Episode[], cfg: AiConfig) {
  const { gamma, lambda } = cfg.ppo,
    samples: Sample[] = [],
    reward = [0, 0],
    steps = [cfg.reward.runner.step, cfg.reward.fielder.step];
  for (const ep of episodes)
    for (const side of [0, 1] as Side[]) {
      if (!ep.learn[side]) continue;
      const ds = ep.decisions.filter((d) => d.side === side);
      if (!ds.length) continue;
      const ev = ep.events.filter((e) => e.side === side),
        r = ds.map((d, i) => {
          const end = i + 1 < ds.length ? ds[i + 1].t : Infinity;
          // Rewards from this decision until the next one (ties go to the later decision).
          return (
            steps[side] +
            ev
              .filter((e) => e.t >= d.t && e.t < end)
              .reduce((s, e) => s + e.r, 0)
          );
        }),
        v = ds.map((d) => forward(valueOf(b, side), d.ctx, h));
      reward[side] += r.reduce((s, x) => s + x, 0);
      let gae = 0;
      for (let i = ds.length - 1; i >= 0; i--) {
        const next = i + 1 < ds.length ? v[i + 1] : 0,
          delta = r[i] + gamma * next - v[i];
        gae = delta + gamma * lambda * gae;
        const d = ds[i],
          p = softmax(optionScores(policyOf(b, side), d.ctx, d.options));
        samples.push({
          side,
          ctx: d.ctx,
          options: d.options,
          pick: d.pick,
          logp: Math.log(p[d.pick] + 1e-12),
          adv: gae,
          ret: gae + v[i],
        });
      }
    }
  return { samples, reward };
}

export type UpdateStats = {
  samples: [number, number];
  policyLoss: number;
  valueLoss: number;
  entropy: number;
  clipFrac: number;
  kl: number;
};

export function ppoUpdate(
  b: Brains,
  opt: Record<NetName, Adam>,
  samples: Sample[],
  cfg: AiConfig,
  rnd: () => number,
): UpdateStats {
  const { clip, epochs, minibatch, lr, valueLr, entropy } = cfg.ppo,
    stats: UpdateStats = {
      samples: [0, 0],
      policyLoss: 0,
      valueLoss: 0,
      entropy: 0,
      clipFrac: 0,
      kl: 0,
    };
  // Advantages normalised per side.
  for (const side of [0, 1] as Side[]) {
    const s = samples.filter((x) => x.side === side);
    stats.samples[side] = s.length;
    if (s.length < 2) continue;
    const mean = s.reduce((a, x) => a + x.adv, 0) / s.length,
      sd = Math.sqrt(s.reduce((a, x) => a + (x.adv - mean) ** 2, 0) / s.length) || 1;
    for (const x of s) x.adv = (x.adv - mean) / sd;
  }
  const hidden = b.runner.hid,
    hs = Array.from({ length: 6 }, () => new Float64Array(hidden)),
    hv = new Float64Array(hidden);
  let seen = 0;
  for (let e = 0; e < epochs; e++) {
    const order = samples.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let start = 0; start < order.length; start += minibatch) {
      const batch = order.slice(start, start + minibatch),
        grads: Record<NetName, Float64Array> = {
          runner: new Float64Array(b.runner.p.length),
          holder: new Float64Array(b.holder.p.length),
          runnerValue: new Float64Array(b.runnerValue.p.length),
          holderValue: new Float64Array(b.holderValue.p.length),
        },
        count = { runner: 0, holder: 0 };
      for (const k of batch) {
        const x = samples[k],
          net = policyOf(b, x.side),
          g = x.side === 0 ? grads.runner : grads.holder,
          xs = x.options.map((o) => [...x.ctx, ...o]);
        while (hs.length < xs.length) hs.push(new Float64Array(hidden));
        const p = softmax(xs.map((row, i) => forward(net, row, hs[i]))),
          logp = Math.log(p[x.pick] + 1e-12),
          ratio = Math.exp(logp - x.logp),
          H = -p.reduce((s, q) => s + (q > 0 ? q * Math.log(q) : 0), 0),
          clipped = (x.adv > 0 && ratio > 1 + clip) || (x.adv < 0 && ratio < 1 - clip);
        if (e === epochs - 1) {
          stats.policyLoss += -Math.min(ratio * x.adv, Math.max(1 - clip, Math.min(1 + clip, ratio)) * x.adv);
          stats.entropy += H;
          stats.clipFrac += clipped ? 1 : 0;
          stats.kl += x.logp - logp;
          seen++;
        }
        // d(loss)/d(score_i): clipped surrogate (zero when the clip is active) + entropy bonus.
        const dlogp = clipped ? 0 : -x.adv * ratio;
        for (let i = 0; i < xs.length; i++) {
          const dz =
            dlogp * ((i === x.pick ? 1 : 0) - p[i]) +
            entropy * p[i] * (Math.log(p[i] + 1e-12) + H);
          if (dz !== 0) backward(net, xs[i], hs[i], dz, g);
        }
        count[x.side === 0 ? "runner" : "holder"]++;
        const vnet = valueOf(b, x.side),
          v = forward(vnet, x.ctx, hv),
          err = v - x.ret;
        backward(vnet, x.ctx, hv, err, x.side === 0 ? grads.runnerValue : grads.holderValue);
        if (e === epochs - 1) stats.valueLoss += err * err;
      }
      for (const [k, n] of [
        ["runner", count.runner],
        ["holder", count.holder],
        ["runnerValue", count.runner],
        ["holderValue", count.holder],
      ] as [NetName, number][]) {
        if (!n) continue;
        const g = grads[k];
        for (let i = 0; i < g.length; i++) g[i] /= n;
        opt[k].step(b[k].p as Float64Array, g, k.endsWith("Value") ? valueLr : lr);
      }
    }
  }
  if (seen) {
    stats.policyLoss /= seen;
    stats.valueLoss /= seen;
    stats.entropy /= seen;
    stats.clipFrac /= seen;
    stats.kl /= seen;
  }
  return stats;
}

