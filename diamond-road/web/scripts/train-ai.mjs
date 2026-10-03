// Headless PPO self-play training for the runner / fielder AI (same code as the training
// ground). Settings: lib/ai/config.ts; override any of them with CFG='{"ppo":{"lr":0.0005}}'.
//   node scripts/train-ai.mjs <rounds> [run-folder]
// Env: THREADS (default: cores), FROM (checkpoint to continue from).
// Writes <run-folder>/train.jsonl (round + eval lines), checkpoints/ckpt-<updates>.json,
// latest.json.
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const here = new URL(import.meta.url);
if (!isMainThread) {
  const { collect, evaluate } = await import("../lib/ai/trainer.ts");
  parentPort.on("message", (m) => {
    if (m.kind === "collect") parentPort.postMessage(collect(m.job));
    else parentPort.postMessage(evaluate(m.policies, m.n, m.seed, m.cfg, m.part, m.parts));
  });
} else {
  const { Learner, mergeEval, summarize } = await import("../lib/ai/trainer.ts");
  const { AI_CONFIG } = await import("../lib/ai/config.ts");
  const merge = (a, b) => {
    for (const [k, v] of Object.entries(b))
      a[k] = v && typeof v === "object" && !Array.isArray(v) ? merge({ ...(a[k] ?? {}) }, v) : v;
    return a;
  };
  const cfg = merge(structuredClone(AI_CONFIG), JSON.parse(process.env.CFG ?? "{}"));
  const rounds = Number(process.argv[2] ?? 500),
    dir = process.argv[3] ?? `ai-runs/run-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`,
    threads = Number(process.env.THREADS ?? os.cpus().length);
  fs.mkdirSync(path.join(dir, "checkpoints"), { recursive: true });
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(cfg, null, 2));
  const logFile = path.join(dir, "train.jsonl"),
    write = (o) => fs.appendFileSync(logFile, JSON.stringify(o) + "\n");
  let learner = new Learner(cfg);
  if (process.env.FROM) learner = Learner.restore(JSON.parse(fs.readFileSync(process.env.FROM, "utf8")), cfg);
  const pool = Array.from({ length: threads }, () => new Worker(here));
  const ask = (w, m) =>
    new Promise((res, rej) => {
      const fail = (e) => (w.off("message", done), rej(e)),
        done = (v) => (w.off("error", fail), res(v));
      w.once("message", done);
      w.once("error", fail);
      w.postMessage(m);
    });
  const evaluateNow = async () => {
    const parts = await Promise.all(
      pool.map((w, i) =>
        ask(w, { kind: "eval", policies: learner.policies, n: cfg.evalPlays, seed: 424242, cfg, part: i, parts: threads }),
      ),
    );
    const sum = summarize(mergeEval(parts)),
      line = { kind: "eval", updates: learner.updates, plays: learner.plays, ...sum };
    write(line);
    const m = sum.matchups,
      f = (x) => (x === null ? "-" : x);
    console.log(
      `[eval ${learner.updates}] duel 주자 ${f(sum.duel.runner)}% 수비 ${f(sum.duel.fielder)}% | ` +
        `vs hand 주자 ${sum.vsHand.runner.mean}±${sum.vsHand.runner.se} 수비 ${sum.vsHand.fielder.mean}±${sum.vsHand.fielder.se} | ` +
        `runner reward L-H ${f(m["L-H"].runnerReward)} vs H-H ${f(m["H-H"].runnerReward)} | ` +
        `fielder reward H-L ${f(m["H-L"].fielderReward)} vs H-H ${f(m["H-H"].fielderReward)} | ` +
        `out L-H ${f(m["L-H"].runnerOut)}% H-H ${f(m["H-H"].runnerOut)}% | extra L ${f(m["L-H"].extraTry)}%/${f(m["L-H"].extraSafe)}% H ${f(m["H-H"].extraTry)}%/${f(m["H-H"].extraSafe)}% | ` +
        `rightBase L ${f(m["H-L"].rightBase)}% H ${f(m["H-H"].rightBase)}% | held-on-out L ${f(m["H-L"].heldOnOut)}% | passive ${f(sum.passive)}% | turns L ${f(m["L-H"].reversals)} H ${f(m["H-H"].reversals)} dance L ${f(m["L-H"].dances)}% | runs L-H ${f(m["L-H"].runs)} L-L ${f(m["L-L"].runs)} H-H ${f(m["H-H"].runs)} | sec L-L ${f(m["L-L"].seconds)}`,
    );
  };
  const t0 = Date.now(),
    save = (name) => fs.writeFileSync(path.join(dir, name), JSON.stringify(learner.checkpoint()));
  for (let r = 0; r < rounds; r++) {
    if (learner.updates % cfg.evalEvery === 0) await evaluateNow();
    const parts = await Promise.all(
      pool.map((w, i) => ask(w, { kind: "collect", job: learner.job(cfg.ppo.plays, i) })),
    );
    const log = learner.learn(parts);
    write({ kind: "round", ...log, secs: (Date.now() - t0) / 1000 });
    if (log.updates % 10 === 0)
      console.log(
        `round ${log.updates} plays ${log.plays} reward 주자 ${log.reward[0].toFixed(3)} 수비 ${log.reward[1].toFixed(3)} ` +
          `outs ${log.outsPerPlay.toFixed(2)} runs ${log.runsPerPlay.toFixed(2)} sec ${log.seconds.toFixed(1)} ` +
          `samples ${log.samples.join("/")} H ${log.entropy.toFixed(2)} kl ${log.kl.toFixed(4)} clip ${log.clipFrac.toFixed(2)} vloss ${log.valueLoss.toFixed(3)} ` +
          `${((Date.now() - t0) / 1000).toFixed(0)}s`,
      );
    if (log.updates % cfg.checkpointEvery === 0) save(`checkpoints/ckpt-${log.updates}.json`);
  }
  await evaluateNow();
  save("latest.json");
  console.log("saved", path.join(dir, "latest.json"));
  for (const w of pool) await w.terminate();
}
