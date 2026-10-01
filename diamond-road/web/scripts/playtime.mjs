// Playtime estimate: a bot plays whole careers on the real engine rules.
// Real time = engine clock (every tick) + human think/menu time (assumptions in T).
// Usage (web folder): node --experimental-strip-types scripts/playtime.mjs [normal|good] [seed]
//   INN=9 for 9-inning matches.
import { BaseballEngine, newCareer, tierOf, PITCHES } from "../lib/game/engine.ts";

const PROFILE = process.argv[2] ?? "normal";
const P = {
  normal: { aim: 0.07, timing: 0.07, pitchAim: 0.14, train: 0.6, think: 2.5 },
  good: { aim: 0.04, timing: 0.045, pitchAim: 0.09, train: 0.9, think: 2.0 },
}[PROFILE];
// Human time outside the engine clock (seconds).
const T = {
  minigame: 25, // one training minigame incl. reading the result
  rest: 4,
  dayScreen: 20, // morning screen, choosing, shop browsing
  matchIntro: 10,
  matchRecap: 20, // end-of-match screen + night recap
  inningBreak: 4,
  replay: 7, // slow-motion TV window holds the next batter
  story: 90, // draft / pro entrance story screens
};

let seedN = Number(process.argv[3] ?? 1);
const rng = () => {
  seedN = (Math.imul(1664525, seedN) + 1013904223) >>> 0;
  return seedN / 4294967296;
};
const gauss = () => {
  let u = 0,
    v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const c = newCareer();
c.created = true;
c.team = "triples";
c.name = "테스트";
const g = new BaseballEngine(c, rng);
let real = 0;
const milestones = {};
const stats = { matches: 0, wins: 0, k: 0, hits: 0, runsAllowed: 0, matchSec: [] };
const TRAIN = ["bullpen", "weights", "breaking", "batting", "power", "running", "sprint"];
let ti = 0;

function morning() {
  const car = g.state.career;
  real += T.dayScreen;
  while (car.actions > 0) {
    if (car.energy < 45) {
      g.train("rest");
      real += T.rest;
      continue;
    }
    let ok = false;
    for (let k = 0; k < TRAIN.length && !ok; k++) {
      ok = g.train(TRAIN[ti++ % TRAIN.length], P.train).ok;
    }
    if (!ok) g.train("rest");
    real += ok ? T.minigame : T.rest;
  }
  // Shop: buy the cheapest pitch we can afford.
  const shop = PITCHES.filter((p) => p.cost && !car.pitches.includes(p.id)).sort(
    (a, b) => a.cost - b.cost,
  );
  for (const p of shop) if (car.xp >= p.cost) g.buyPitch(p.id);
}

function match() {
  g.start("match", Number(process.env.INN ?? 3));
  const s = () => g.state;
  const dt = 1 / 30;
  let t0 = real,
    lastReplay = s().replay,
    swingAt = null,
    flightSeen = null;
  real += T.matchIntro;
  let guard = 0;
  while (s().phase !== "finished" && guard++ < 200000) {
    const st = s();
    if (st.phase === "between") {
      real += T.inningBreak;
      g.continueInning();
      continue;
    }
    if (st.phase === "ready" && !g.batting) {
      real += P.think;
      const owned = st.career.pitches;
      g.selectPitch(owned[Math.floor(rng() * owned.length)]);
      g.throwAt(gauss() * P.pitchAim, 0.85 + gauss() * P.pitchAim * 1.2);
      continue;
    }
    if (st.phase === "flight" && g.batting && st.flight && flightSeen !== st.flight) {
      flightSeen = st.flight;
      const f = st.flight,
        inZone = Math.abs(f.target.x) < 0.24 && f.target.y > 0.48 && f.target.y < 1.12;
      swingAt =
        rng() < (inZone ? 0.78 : 0.25) ? f.visualDuration * (0.92 + gauss() * P.timing) : null;
      const h = f.hint ?? f.target;
      g.setAim(h.x + gauss() * P.aim, h.y + gauss() * P.aim);
    }
    if (st.phase === "flight" && g.batting && swingAt !== null && st.flight.elapsed >= swingAt) {
      g.swing();
      swingAt = null;
    }
    g.tick(dt);
    real += dt;
    if (s().replay !== lastReplay) {
      lastReplay = s().replay;
      real += T.replay;
    }
  }
  real += T.matchRecap;
  const st = s();
  stats.matches++;
  if (st.score[1] > st.score[0]) stats.wins++;
  stats.k += g.matchStrikeouts ?? 0;
  stats.hits += st.hits[1];
  stats.runsAllowed += st.score[0];
  stats.matchSec.push(real - t0);
}

const tierName = () => {
  const car = g.state.career;
  return car.stage === "high" ? "high" : tierOf(car);
};
let days = 0;
while (days < 400) {
  days++;
  const before = tierName();
  morning();
  match();
  const car = g.state.career;
  if (car.stage === "high" && car.draft && !milestones.draft) {
    milestones.draft = { day: car.day - 1, min: +(real / 60).toFixed(1) };
    real += T.story;
    g.enterPro();
    // enterPro starts a match screen; the next loop's start() replaces it.
  }
  if (tierName() === "first" && before === "farm" && !milestones.first)
    milestones.first = { day: car.day - 1, min: +(real / 60).toFixed(1) };
  const scouts = Object.values(car.mlbScouts ?? {});
  if (scouts.some((v) => v >= 100) && !milestones.mlbOffer)
    milestones.mlbOffer = { day: car.day - 1, min: +(real / 60).toFixed(1) };
  if (scouts.length && scouts.every((v) => v >= 100) && !milestones.allOffers) {
    milestones.allOffers = { day: car.day - 1, min: +(real / 60).toFixed(1) };
    break;
  }
}
const ms = stats.matchSec;
console.log(
  JSON.stringify({
    profile: PROFILE,
    seed: process.argv[3] ?? 1,
    milestones,
    matchMin: +(ms.reduce((a, b) => a + b, 0) / ms.length / 60).toFixed(2),
    perMatch: {
      win: +(stats.wins / stats.matches).toFixed(2),
      k: +(stats.k / stats.matches).toFixed(1),
      hits: +(stats.hits / stats.matches).toFixed(1),
      runsAllowed: +(stats.runsAllowed / stats.matches).toFixed(1),
    },
    stats: g.state.career.stats,
  }),
);
