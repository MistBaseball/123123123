/// <reference lib="webworker" />
/**
 * AI training ground worker. Every worker plays situations (`collect`, `eval`); worker 0 also
 * keeps the Learner (networks, optimisers, pool of past versions) and runs the PPO update.
 * Messages carry an id; the answer comes back with the same id.
 */
import { AI_CONFIG } from "./config.ts";
import { Learner, collect, evaluate, type Collected, type Job, type Matchup } from "./trainer.ts";
import type { PoliciesJson } from "./agent.ts";

let learner: Learner | null = null;

type Msg =
  | { id: number; kind: "init"; checkpoint?: unknown }
  | { id: number; kind: "jobs"; workers: number; plays: number }
  | { id: number; kind: "collect"; job: Job }
  | { id: number; kind: "learn"; parts: Collected[]; save: boolean }
  | {
      id: number;
      kind: "eval";
      policies: PoliciesJson;
      n: number;
      seed: number;
      part: number;
      parts: number;
      only: Matchup[];
    };

self.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data,
    reply = (data: object) => (self as DedicatedWorkerGlobalScope).postMessage({ id: m.id, ...data });
  switch (m.kind) {
    case "init": {
      const restored = m.checkpoint
          ? Learner.restore(m.checkpoint as ReturnType<Learner["checkpoint"]>, AI_CONFIG)
          : null,
        l = restored ?? new Learner(AI_CONFIG);
      learner = l;
      reply({ updates: l.updates, plays: l.plays, policies: l.policies });
      break;
    }
    case "jobs":
      reply({ jobs: Array.from({ length: m.workers }, (_, i) => learner!.job(m.plays, i)) });
      break;
    case "collect":
      reply({ result: collect(m.job) });
      break;
    case "learn": {
      const log = learner!.learn(m.parts);
      reply({
        log,
        policies: learner!.policies,
        checkpoint: m.save ? learner!.checkpoint() : undefined,
      });
      break;
    }
    case "eval":
      reply({ sums: evaluate(m.policies, m.n, m.seed, AI_CONFIG, m.part, m.parts, m.only) });
      break;
  }
};
