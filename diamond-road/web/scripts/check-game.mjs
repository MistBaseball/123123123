import assert from "node:assert/strict";
import {
  BaseballEngine,
  newCareer,
  ballistic,
  insideZone,
  V,
  PITCHES,
  distance,
  BASES,
  runnerPose,
  playerYaw,
  pitchMovement,
  contactHintRadius,
  batReach,
  DAY_ACTIONS,
  BLESSINGS,
  TEAMS,
} from "../lib/game/engine.ts";

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`PASS ${name}`);
};
const seed = (n) => () => {
  n = (Math.imul(1664525, n) + 1013904223) >>> 0;
  return n / 4294967296;
};
// Most checks exercise every pitch, so give the test pitcher the whole repertoire.
const allPitches = () => {
  const c = newCareer();
  c.pitches = PITCHES.map((p) => p.id);
  return c;
};
const advance = (g, n = 400) => {
  for (let i = 0; i < n; i++) g.tick(1 / 60);
};
const finishPlay = (g, dt = 1 / 60) => {
  let n = 0;
  while (g.state.phase === "inplay" && n++ < 3000) g.tick(dt);
  assert.equal(g.state.phase, "result", "live play must settle");
};

check("Ballistic endpoint and release-speed invariants over the whole aiming zone", () => {
  for (const speed of [90, 110, 135, 165])
    for (const x of [-0.7, 0, 0.7])
      for (const y of [0.15, 0.95, 1.85]) {
        const start = V(0.35, 1.85, 18.44),
          target = V(x, y, 0),
          p = ballistic(start, target, speed / 3.6);
        assert(p);
        const t = p.duration,
          end = V(
            start.x + p.velocity.x * t,
            start.y + p.velocity.y * t - 4.905 * t * t,
            start.z + p.velocity.z * t,
          );
        assert(distance(end, target) < 1e-9);
        assert(Math.abs(Math.hypot(p.velocity.x, p.velocity.y, p.velocity.z) - speed / 3.6) < 1e-8);
      }
  assert.equal(ballistic(V(), V(0, 0, 1000), 1), null);
  assert.equal(ballistic(V(), V(0, 0, 18), NaN), null);
});
check("Strike-zone boundary includes baseball radius", () => {
  assert(insideZone(V(0.25, 0.52, 0)));
  assert(!insideZone(V(0.26, 0.52, 0)));
  assert(!insideZone(V(0, 1.4, 0)));
});
check("All pitch types arrive at locked target, double-click cannot launch another ball", () => {
  for (const p of PITCHES) {
    const g = new BaseballEngine(allPitches(), seed(42));
    g.start("bullpen");
    g.selectPitch(p.id);
    assert.equal(g.state.selected, p.id);
    assert(g.throwAt(0.1, 1.1));
    const target = { ...g.state.flight.target };
    g.setAim(-0.6, 0.2);
    assert.equal(g.throwAt(), false);
    assert(distance(g.pitchPosition(1), target) < 1e-8);
    g.state.career.stats.movement = 99;
    assert(distance(g.pitchPosition(1), target) < 1e-8);
    advance(g, 110);
    assert.equal(g.state.practice.pitches, 1);
  }
});
check("Pause freezes ball and counters, reset only aborts practice pitches", () => {
  const g = new BaseballEngine(newCareer(), seed(9));
  g.throwAt();
  g.set("paused", true);
  advance(g);
  assert.equal(g.state.phase, "windup");
  assert.equal(g.state.pitchCount[1], 0);
  g.set("paused", false);
  advance(g, 45);
  assert.equal(g.state.phase, "flight");
  g.resetPitch();
  assert.equal(g.state.phase, "flight");
  g.start("bullpen");
  g.throwAt();
  g.resetPitch();
  assert.equal(g.state.phase, "ready");
  assert.equal(g.state.flight, null);
});
check("Intentional walks apply forced advances for all eight base configurations", () => {
  const expected = [
    [true, false, false],
    [true, true, false],
    [true, true, false],
    [true, true, true],
    [true, false, true],
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ];
  for (let mask = 0; mask < 8; mask++) {
    const g = new BaseballEngine();
    g.state.bases = [!!(mask & 1), !!(mask & 2), !!(mask & 4)];
    assert(g.intentionalWalk());
    assert.deepEqual(g.state.bases, expected[mask]);
    assert.equal(g.state.score[0], mask === 7 ? 1 : 0);
    assert.equal(g.state.pitchCount[1], 0);
  }
});
check("Four balls walk, three strikes retire batter, two-strike foul remains two strikes", () => {
  const g = new BaseballEngine();
  for (let i = 0; i < 4; i++) g.ball();
  assert(g.state.bases[0]);
  assert.equal(g.state.balls, 0);
  for (let i = 0; i < 3; i++) g.strike(true, "test");
  assert.equal(g.state.outs, 1);
  assert.equal(g.state.strikes, 0);
  g.state.strikes = 2;
  g.foul();
  assert.equal(g.state.strikes, 2);
  assert.equal(g.state.outs, 1);
  g.state.half = "bottom";
  g.state.swingStyle = "bunt";
  g.foul();
  assert.equal(g.state.outs, 2);
  assert.equal(g.state.strikes, 0);
});
check("Single/double/triple/home run preserve runners and runs", () => {
  for (let n = 1; n <= 4; n++) {
    const g = new BaseballEngine();
    g.state.bases = [true, true, true];
    g.advanceRunners(n);
    assert.equal(g.state.score[0], n);
    assert.equal(g.state.bases.filter(Boolean).length, 4 - n);
  }
});
check("No sacrifice run on third out", () => {
  const g = new BaseballEngine(newCareer(), () => 0.1);
  g.state.half = "bottom";
  g.state.outs = 2;
  g.state.bases = [false, false, true];
  g.state.swingStyle = "bunt";
  g.contact(0.2);
  finishPlay(g);
  assert.equal(g.state.outs, 3);
  assert.equal(g.state.score[1], 0);
});
check("Manual fielding honors occupied force base and invalid throw choices", () => {
  const g = new BaseballEngine(newCareer(), () => 0.7);
  g.state.autoField = false;
  g.state.bases = [true, false, false];
  g.contact(0.25);
  Object.assign(g.state.live.fielderPos, g.state.live.land);
  assert(g.selectThrowBase(2));
  finishPlay(g);
  assert.equal(g.state.outs, 1);
  assert.deepEqual(g.state.bases, [true, false, false]);
  const b = new BaseballEngine(newCareer(), () => 0.7);
  b.state.autoField = false;
  b.contact(0.25);
  Object.assign(b.state.live.fielderPos, b.state.live.land);
  assert(b.selectThrowBase(3));
  finishPlay(b);
  assert.equal(b.state.outs, 0);
  assert(b.state.bases[0]);
});
check("Base circuit is home-first-second-third-home, and both renderers face along it", () => {
  assert(BASES[0].x < 0 && BASES[2].x > 0, "first is right from catcher looking +Z");
  for (let i = 0; i < 4; i++) {
    const r = { progress: i + 0.5, target: 4, out: false },
      p = runnerPose(r),
      a = BASES[(i + 3) % 4],
      b = BASES[i];
    assert.equal(p.position.x, (a.x + b.x) / 2);
    assert.equal(p.position.z, (a.z + b.z) / 2);
    const yaw = playerYaw(p.facing),
      facing = V(-Math.sin(yaw), 0, -Math.cos(yaw));
    assert(facing.x * p.facing.x + facing.z * p.facing.z > 0);
  }
});
check("A batter already on second cannot be retired by a late throw to first", () => {
  for (const auto of [false, true]) {
    const g = new BaseballEngine(newCareer(), () => 0.5);
    g.state.autoField = auto;
    g.contact(0.6);
    const l = g.state.live;
    l.ground = true;
    l.bounced = true;
    l.flightTime = 0.1;
    l.elapsed = 1;
    l.resultBases = 2;
    l.runners[0].progress = 2;
    l.runners[0].target = 2;
    Object.assign(l.fielderPos, l.land);
    if (!auto) assert(g.selectThrowBase(1));
    finishPlay(g);
    assert.equal(g.state.outs, 0);
    assert.deepEqual(g.state.bases, [false, true, false]);
    assert.equal(g.state.message, "DOUBLE");
    if (auto) assert.equal(l.throws, 0);
  }
});
check("Automatic second baseman chooses a live force runner, not an already-safe batter", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.state.bases = [true, false, false];
  g.contact(0.35);
  const l = g.state.live;
  l.fielder = 3;
  l.fielderPos = l.defenders[3];
  l.elapsed = 1;
  l.flightTime = 0.1;
  l.fieldedAt = 0.7;
  l.state = "포구";
  Object.assign(l.fielderPos, BASES[1]);
  l.runners[0].progress = 1;
  l.runners[0].target = 1;
  l.runners[1].progress = 1.4;
  finishPlay(g);
  assert.equal(l.outs.length, 1);
  assert.equal(l.outs[0].runnerId, 1);
  assert.equal(l.outs[0].base, 2);
  assert(!l.runners[0].out);
});
check("Throwing to an occupied non-force base does not retire its safe runner", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.state.autoField = false;
  g.state.bases = [false, true, false];
  g.contact(0.3);
  const l = g.state.live;
  l.runners.find((r) => r.from === 2).target = 2;
  Object.assign(l.fielderPos, l.land);
  g.selectThrowBase(2);
  finishPlay(g);
  assert.equal(g.state.outs, 0);
  assert.deepEqual(g.state.bases, [true, true, false]);
});
check("Non-force outs require a tag on a runner between bases", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.state.autoField = false;
  g.state.bases = [true, false, false];
  g.contact(0.3);
  const l = g.state.live;
  l.elapsed = 1;
  l.flightTime = 0.1;
  l.fieldedAt = 0.5;
  l.state = "포구";
  l.runners[0].out = true;
  g.state.outs = 1;
  l.runners[1].progress = 1.7;
  Object.assign(l.fielderPos, BASES[1]);
  Object.assign(l.defenders[3], BASES[1]);
  g.selectThrowBase(2);
  finishPlay(g);
  assert.equal(g.state.outs, 2);
  assert.equal(l.outs[0].kind, "tag");
  assert(l.runners[1].progress < 2);
  assert.equal(g.state.message, "TAG OUT");
});
check("Fly catch immediately retires batter, holds runners and never throws to first", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.state.bases = [true, true, false];
  g.contact(0.6);
  const l = g.state.live;
  // A routine fly: the fielder is already under the ball.
  l.fielderPos.x = l.catchPoint.x;
  l.fielderPos.z = l.catchPoint.z;
  while (g.state.phase === "inplay" && !l.caughtFly) {
    assert.equal(l.runners[1].progress, 1);
    assert.equal(l.runners[2].progress, 2);
    g.tick(1 / 60);
  }
  assert(l.caughtFly);
  assert.equal(g.state.outs, 1);
  assert.equal(g.state.message, "FLY OUT");
  assert(l.fieldedAt < l.flightTime);
  assert.equal(l.throw, null);
  finishPlay(g);
  assert.equal(l.throws, 0);
  assert.deepEqual(g.state.bases, [true, true, false]);
  assert.equal(g.state.hits[0], 0);
});
check("Missed air catch lands safely; a ground pickup cannot become a fly out", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.state.autoField = false;
  g.contact(0.65);
  const l = g.state.live;
  Object.assign(l.fielderPos, V(80, 0, -2));
  while (!l.bounced) g.tick(1 / 60);
  assert.equal(g.state.outs, 0);
  assert(!l.caughtFly);
  while (l.runners.some((r) => r.progress < r.target) && g.state.phase === "inplay") g.tick(1 / 60);
  finishPlay(g);
  assert.equal(g.state.outs, 0);
  assert.equal(g.state.message, "DOUBLE");
});
check("Deep fly tag-up starts only after catch; third-out fly cancels all runs", () => {
  for (const outs of [0, 2]) {
    const g = new BaseballEngine(newCareer(), () => 0.5);
    g.state.bases = [false, false, true];
    g.state.outs = outs;
    g.contact(0.8);
    const l = g.state.live;
    finishPlay(g);
    assert(l.caughtFly);
    assert.equal(l.throws, 0);
    assert.equal(g.state.outs, outs + 1);
    assert.equal(g.state.score[0], outs === 2 ? 0 : 1);
    if (outs === 0) assert(l.runners[1].scoredAt > l.fieldedAt);
  }
});
check("Pitch movement ranges match the whole actual trajectory at every tested rating", () => {
  for (const p of PITCHES)
    for (const rating of [0, 62, 99]) {
      const g = new BaseballEngine(allPitches(), seed(15));
      g.state.career.stats.movement = rating;
      g.selectPitch(p.id);
      g.throwAt();
      const f = g.state.flight,
        m = pitchMovement(p.id, rating);
      for (let i = 0; i <= 100; i++) {
        const u = i / 100,
          t = f.duration * u,
          ball = g.pitchPosition(u),
          x = ball.x - (f.start.x + f.velocity.x * t),
          y = ball.y - (f.start.y + f.velocity.y * t - 4.905 * t * t);
        assert(x >= m.minX - 1e-8 && x <= m.maxX + 1e-8);
        assert(y >= m.minY - 1e-8 && y <= m.maxY + 1e-8);
        if (i === 50) {
          assert(Math.abs(x - m.x) < 1e-8);
          assert(Math.abs(y - m.y) < 1e-8);
        }
      }
    }
  assert(pitchMovement("slider", 62).x > pitchMovement("fastball", 62).x);
  assert(pitchMovement("changeup", 62).x < 0);
});
check("Close force plays agree at 30, 60 and 144 fps; simultaneous arrival is safe", () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 144])
    for (const offset of [-0.005, 0, 0.005]) {
      const g = new BaseballEngine(newCareer(), () => 0.5);
      g.state.autoField = false;
      g.contact(0.3);
      const l = g.state.live;
      l.elapsed = 1;
      l.fieldedAt = 0.5;
      l.state = "포구";
      Object.assign(l.fielderPos, BASES[0]);
      Object.assign(l.defenders[2], BASES[0]);
      l.runners[0].progress = 1 - l.runners[0].pace * (0.22 + offset);
      g.beginThrow(l, 1);
      finishPlay(g, dt);
      assert.equal(g.state.outs, offset > 0 ? 1 : 0);
      if (offset > 0) assert(Math.abs(l.outs[0].time - 1.22) < 1e-8);
    }
});
check("Three outs swap sides only after explicit continue action", () => {
  const g = new BaseballEngine();
  g.state.phase = "result";
  g.state.outs = 3;
  g.next();
  assert.equal(g.state.phase, "between");
  assert.equal(g.state.half, "top");
  g.continueInning();
  assert.equal(g.state.half, "bottom");
  assert.equal(g.state.outs, 0);
  assert.equal(g.state.camera, "catcher");
  g.state.phase = "result";
  g.state.outs = 3;
  g.next();
  g.continueInning();
  assert.equal(g.state.inning, 2);
  assert.equal(g.state.half, "top");
});
check("Walk-off victory and skipped home half; tie at regulation is a draw", () => {
  const a = new BaseballEngine();
  a.state.inning = 3;
  a.state.half = "bottom";
  a.state.score = [1, 2];
  a.state.phase = "result";
  a.next();
  assert.equal(a.state.phase, "finished");
  assert.equal(a.state.career.wins, 1);
  const b = new BaseballEngine();
  b.state.inning = 3;
  b.state.outs = 3;
  b.state.score = [0, 1];
  b.state.phase = "result";
  b.next();
  assert.equal(b.state.phase, "finished");
  const c = new BaseballEngine();
  c.state.inning = 3;
  c.state.half = "bottom";
  c.state.outs = 3;
  c.state.phase = "result";
  c.next();
  assert.equal(c.state.message, "DRAW");
  assert.equal(c.state.career.games, 1);
  c.next();
  assert.equal(c.state.career.games, 1);
});
check("Abandoned games do not leak strikeouts or conceded runs to saved career", () => {
  const g = new BaseballEngine();
  g.state.strikes = 2;
  g.strike(true, "test");
  g.addRuns(2);
  assert.equal(g.state.career.strikeouts, 0);
  assert.equal(g.state.career.runs, 0);
  g.start("bullpen");
  assert.equal(g.state.career.strikeouts, 0);
  assert.equal(g.state.career.games, 0);
});
check(
  "Five actions per day; finishing a match advances the day; live match blocks training",
  () => {
    const g = new BaseballEngine();
    assert(g.train("bullpen").ok);
    assert.equal(g.state.career.stats.control, 66);
    assert.equal(g.state.career.day, 1);
    assert.equal(g.state.career.energy, 82);
    assert.equal(g.state.career.actions, DAY_ACTIONS - 1);
    for (let i = 1; i < DAY_ACTIONS; i++) assert(g.train(i % 2 ? "rest" : "study").ok);
    assert.equal(g.state.career.actions, 0);
    assert(!g.train("rest").ok, "no actions left today");
    g.state.inning = 3;
    g.state.half = "bottom";
    g.state.outs = 3;
    g.state.phase = "result";
    g.next();
    assert.equal(g.state.phase, "finished");
    assert.equal(g.state.career.day, 2);
    assert.equal(g.state.career.actions, DAY_ACTIONS);
    assert(g.train("rest").ok);
    assert.equal(g.state.career.energy, 100);
    g.start("match");
    g.throwAt();
    assert(!g.train("weights").ok);
    g.start("bullpen");
    g.state.career.energy = 5;
    assert(!g.train("weights").ok);
    assert(!g.train("unknown").ok);
  },
);
check("Match XP is credited on finish and buys locked pitches", () => {
  const g = new BaseballEngine();
  assert.deepEqual(g.state.career.pitches, ["fastball"]);
  g.selectPitch("slider");
  assert.equal(g.state.selected, "fastball", "locked pitch cannot be selected");
  assert(!g.buyPitch("slider").ok, "no XP yet");
  g.state.strikes = 2;
  g.strike(true, "test");
  assert.equal(g.state.matchXp, 3);
  assert.equal(g.state.career.xp, 0, "XP is credited only when the match ends");
  g.state.inning = 3;
  g.state.half = "bottom";
  g.state.outs = 3;
  g.state.score = [0, 1];
  g.state.phase = "result";
  g.next();
  assert.equal(g.state.career.xp, 3 + 20 + 15);
  assert.equal(g.state.lastXpGain, 38);
  g.state.career.xp = 70;
  assert(g.buyPitch("slider").ok);
  assert.equal(g.state.career.xp, 10);
  assert(!g.buyPitch("slider").ok, "cannot buy twice");
  g.start("bullpen");
  g.selectPitch("slider");
  assert.equal(g.state.selected, "slider");
  const practice = new BaseballEngine();
  practice.start("bullpen");
  practice.state.strikes = 2;
  practice.strike(true, "test");
  assert.equal(practice.state.matchXp, 0, "practice modes give no match XP");
});
check("Batting range hint always contains the pitch and shrinks as contact rises", () => {
  for (const contact of [20, 60, 99]) {
    const g = new BaseballEngine(newCareer(), seed(contact));
    g.state.career.stats.contact = contact;
    g.start("batting");
    for (let i = 0; i < 40; i++) {
      g.launch(true);
      const f = g.state.flight;
      assert(f.hint);
      assert.equal(f.hint.r, contactHintRadius(contact));
      assert(Math.hypot(f.hint.x - f.target.x, f.hint.y - f.target.y) < f.hint.r);
      g.resetPitch();
    }
  }
  assert(contactHintRadius(99) < contactHintRadius(60));
  assert(contactHintRadius(60) < contactHintRadius(20));
  assert(
    batReach(60, "contact") < contactHintRadius(60),
    "the range alone must not guarantee contact",
  );
  assert(batReach(60, "power") < batReach(60, "contact"));
  const pitcher = new BaseballEngine();
  pitcher.throwAt();
  assert.equal(pitcher.state.flight.hint, null, "no hint for the player's own pitches");
});
check("Fatigue and form affect velocity and control with identical random samples", () => {
  const a = new BaseballEngine(newCareer(), seed(3)),
    c = newCareer();
  c.energy = 15;
  c.form = 25;
  const b = new BaseballEngine(c, seed(3));
  a.throwAt(0, 0.95);
  b.throwAt(0, 0.95);
  assert(a.state.flight.speed > b.state.flight.speed);
  assert(
    distance(a.state.flight.aim, a.state.flight.target) <
      distance(b.state.flight.aim, b.state.flight.target),
  );
});
check("Draft milestones and thresholds are reachable and finalized once", () => {
  for (const [scout, result] of [
    [30, "대학 진학"],
    [50, "육성선수 계약"],
    [80, "프로 구단 지명"],
  ]) {
    const g = new BaseballEngine();
    assert(!g.draft().ok);
    g.state.career.games = 3;
    g.state.career.scout = scout;
    assert(g.draft().ok);
    assert.equal(g.state.career.draft, result);
    assert(!g.draft().ok);
  }
});
check(
  "Six complete seeded games (five 3-inning and one 9-inning) end without invalid state",
  () => {
    for (let seedId = 1; seedId <= 6; seedId++) {
      const g = new BaseballEngine(newCareer(), seed(seedId));
      g.start("match", seedId === 6 ? 9 : 3);
      let ticks = 0;
      while (g.state.phase !== "finished" && ticks++ < 100000) {
        const s = g.state;
        if (s.phase === "ready" && !g.batting) g.throwAt(((seedId % 3) - 1) * 0.12, 0.9);
        if (s.phase === "between") g.continueInning();
        if (
          s.phase === "flight" &&
          g.batting &&
          s.flight.elapsed / s.flight.visualDuration > 0.88 &&
          !s.flight.swung
        ) {
          g.setAim(s.flight.target.x, s.flight.target.y);
          g.swing();
        }
        g.tick(1 / 30);
        assert(s.outs >= 0 && s.outs <= 3);
        assert(s.balls >= 0 && s.balls < 4);
        assert(s.strikes >= 0 && s.strikes < 3);
        assert(s.bases.length === 3);
        assert(s.score.every((v) => Number.isInteger(v) && v >= 0));
        assert(Number.isFinite(s.ball.x + s.ball.y + s.ball.z));
      }
      assert.equal(g.state.phase, "finished", `seed ${seedId} did not finish`);
      assert.equal(g.state.career.games, 1);
      assert.equal(
        g.state.lines[0].reduce((a, b) => a + b, 0),
        g.state.score[0],
      );
      assert.equal(
        g.state.lines[1].reduce((a, b) => a + b, 0),
        g.state.score[1],
      );
    }
  },
);
check("Batting feedback separates timing, aim error and taking a pitch", () => {
  const cases = [
    { ratio: 0.2, x: 0, y: 0.95, timing: "early", contact: false },
    { ratio: 0.92, x: 0, y: 0.95, timing: "good", contact: true },
    { ratio: 0.99, x: 0, y: 0.95, timing: "late", contact: true },
    { ratio: 0.92, x: 0.8, y: 1.7, timing: "good", contact: false },
  ];
  for (const test of cases) {
    const g = new BaseballEngine(newCareer(), seed(17));
    g.start("batting");
    g.launch(true);
    g.state.phase = "flight";
    const f = g.state.flight;
    f.target = V(0, 0.95, 0);
    f.elapsed = f.visualDuration * test.ratio;
    g.setAim(test.x, test.y);
    assert(g.swing());
    const fixedAim = { ...f.batAim };
    g.setAim(-0.5, 0.2);
    g.resolvePitch();
    const result = g.state.batFeedback;
    assert.equal(result.timing, test.timing);
    assert.equal(result.contact, test.contact);
    assert.deepEqual(result.batAim, fixedAim);
    assert.equal(result.errorCm, Math.round(Math.hypot(test.x, test.y - 0.95) * 100));
    assert(Number.isFinite(result.offsetMs));
    g.resetPitch();
    assert.equal(g.state.batFeedback, null);
  }
  const take = new BaseballEngine(newCareer(), seed(8));
  take.start("batting");
  take.launch(true);
  take.resolvePitch();
  assert.equal(take.state.batFeedback.timing, "take");
  assert.equal(take.state.batFeedback.offsetMs, null);
  assert.equal(take.state.batFeedback.batAim, null);
});
check("Starting blessing grants exactly one random extra pitch, weighted by rarity", () => {
  const seen = {};
  for (let i = 1; i <= 400; i++) {
    const rng = seed(i);
    rng(); // consecutive small seeds give nearly equal first values
    const g = new BaseballEngine(newCareer(), rng);
    const id = g.receiveBlessing();
    assert(BLESSINGS.some((b) => b.id === id));
    assert.deepEqual(g.state.career.pitches, ["fastball", id]);
    assert.equal(g.state.career.blessing, id);
    assert.equal(g.receiveBlessing(), null, "only once per career");
    seen[id] = (seen[id] ?? 0) + 1;
  }
  assert.equal(Object.keys(seen).length, BLESSINGS.length, "every pitch can come up");
  assert(seen.slider > seen.splitter, "rare pitches come up less often");
});
check("Balls in play: fly outs are not dominant and the result waits for the fielder", () => {
  const out = { fly: 0, hit: 0, total: 0 };
  for (let i = 1; i <= 600; i++) {
    const g = new BaseballEngine(newCareer(), seed(i));
    const r = seed(i * 7 + 3);
    g.contact(0.21 + r() * 0.75, (r() - 0.5) * 0.2);
    const l = g.state.live;
    finishPlay(g);
    if (l.resultBases < 4 && !l.caughtFly) assert(l.fieldedAt !== null, "result before fielding");
    out.total++;
    if (l.caughtFly) out.fly++;
    else if (!l.outs.length) out.hit++;
  }
  assert(out.fly / out.total < 0.45, `fly out rate ${out.fly / out.total}`);
  assert(out.hit / out.total > 0.25, `hit rate ${out.hit / out.total}`);
});
check("Landed balls keep rolling; a throw is caught the moment it reaches the bag", () => {
  let rolled = 0,
    throws = 0;
  for (let i = 1; i <= 300; i++) {
    const g = new BaseballEngine(newCareer(), seed(i * 13 + 5));
    const r = seed(i * 7 + 3);
    r();
    g.state.bases = [r() < 0.4, r() < 0.3, false];
    g.contact(0.21 + r() * 0.75, (r() - 0.5) * 0.2);
    const l = g.state.live;
    if (l.resultBases < 4) {
      const after = g.liveBall(l, l.flightTime + 0.6);
      if (Math.hypot(after.x, after.z) > Math.hypot(l.land.x, l.land.z) + 0.5) rolled++;
    }
    let n = 0;
    while (g.state.phase === "inplay" && n++ < 5000) {
      g.tick(1 / 60);
      const t = l.throw;
      if (t && l.elapsed >= t.startedAt + t.duration + 1e-6) {
        assert.notEqual(t.receivedAt, null, "ball reached the bag with nobody to catch it");
        throws++;
      }
    }
  }
  assert(rolled > 250, `balls rolled after landing: ${rolled}`);
  assert(throws > 0);
});
check("A fielder still throws when the runner is close; holds only when everyone is safe", () => {
  const g = new BaseballEngine(newCareer(), () => 0.5);
  g.contact(0.3);
  const l = g.state.live;
  l.elapsed = 1;
  l.fieldedAt = 0.9;
  l.state = "포구";
  Object.assign(l.fielderPos, V(0, 0, 40));
  l.runners[0].progress = 0.97;
  assert.equal(g.chooseThrow(l), 1, "late throw to first instead of standing still");
  l.runners[0].progress = 1;
  l.runners[0].target = 1;
  assert.equal(g.chooseThrow(l), 0);
});
check("Creation spends exactly the stat budget; minigame quality sets the training gain", () => {
  const g = new BaseballEngine();
  assert.equal(g.state.career.created, false);
  const even = {
    velocity: 62,
    control: 62,
    movement: 62,
    stamina: 61,
    contact: 61,
    power: 62,
  };
  assert(!g.createPlayer("과다", { ...even, power: 80 }).ok, "over budget");
  assert(!g.createPlayer("범위", { ...even, velocity: 90, control: 34 }).ok, "outside 45–80");
  assert(g.createPlayer("  김하늘  ", even).ok);
  assert.equal(g.state.career.name, "김하늘");
  assert(g.state.career.created);
  assert.deepEqual(g.state.career.stats, even);
  for (const [q, gain] of [
    [0.1, 0],
    [0.6, 1],
    [0.95, 2],
  ]) {
    const before = g.state.career.stats.contact;
    g.state.career.energy = 100;
    g.state.career.actions = DAY_ACTIONS;
    const r = g.train("batting", q);
    assert(r.ok);
    assert.equal(g.state.career.stats.contact - before, gain);
  }
});
check("Dream club scout watches season matches; reaching 100 brings the contract", () => {
  const g = new BaseballEngine();
  assert(!g.chooseTeam("not-a-team"));
  assert(g.chooseTeam(TEAMS[0].id));
  g.start("match");
  assert(g.state.detail.includes(TEAMS[0].name), "scout is announced at the ballpark");
  g.state.career.scout = 95;
  g.state.inning = 3;
  g.state.half = "bottom";
  g.state.outs = 3;
  g.state.score = [0, 2];
  g.state.phase = "result";
  g.next();
  assert.deepEqual(g.state.lastScout, { before: 95, after: 100 });
  assert.equal(g.state.career.draft, `${TEAMS[0].city} ${TEAMS[0].name} 입단`);
  const low = new BaseballEngine();
  low.chooseTeam(TEAMS[1].id);
  low.state.inning = 3;
  low.state.half = "bottom";
  low.state.outs = 3;
  low.state.phase = "result";
  low.next();
  assert(low.state.lastScout.after > low.state.lastScout.before);
  assert.equal(low.state.career.draft, "");
});
console.log(`\n${passed} gameplay checks passed.`);
