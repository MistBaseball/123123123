/**
 * Hitboxes for the rules: simple capsules and boxes, not the animated 3D models (the rules
 * also run without graphics, in the balance simulator and the tests).
 *
 * - The batter's body at the plate (stance measured from the idle_bat clip): a pitch that
 *   touches any part of it is a hit by pitch, and the part is named.
 * - Runners: a body capsule plus a lead point (foot running, foot sliding, hand diving) that
 *   touches the bag. Only runners, the bags and the ball holder near them are ever checked.
 * - Tags: the ball holder's glove reaches `TAG_ARM` m from his body toward the runner.
 *
 * World axes as in engine.ts: home at the origin, the pitcher toward +Z, first base at −X.
 */
export type P3 = { x: number; y: number; z: number };
export type Capsule = { a: P3; b: P3; r: number; part: string };

const p = (x: number, y: number, z: number): P3 => ({ x, y, z });

/** Distance from point q to the segment a–b. */
export function segmentDistance(q: P3, a: P3, b: P3) {
  const abx = b.x - a.x,
    aby = b.y - a.y,
    abz = b.z - a.z,
    len = abx * abx + aby * aby + abz * abz,
    t = len
      ? Math.max(0, Math.min(1, ((q.x - a.x) * abx + (q.y - a.y) * aby + (q.z - a.z) * abz) / len))
      : 0;
  return Math.hypot(q.x - (a.x + abx * t), q.y - (a.y + aby * t), q.z - (a.z + abz * t));
}

/** Ball radius (m). */
export const BALL_R = 0.037;

/**
 * The right-handed batter's body in his stance beside the plate (bones of the idle_bat_r clip,
 * model at x = 0.82). A left-handed batter is the mirror image (x → −x).
 */
// (Hands before arms: where they overlap, the hands are named.)
const RIGHTY: Capsule[] = [
  { a: p(0.6, 1.55, 0.1), b: p(0.52, 1.62, 0.1), r: 0.12, part: "머리" },
  { a: p(0.81, 0.92, 0.06), b: p(0.68, 1.44, 0.09), r: 0.15, part: "몸통" },
  { a: p(0.5, 1.29, -0.01), b: p(0.57, 1.38, -0.22), r: 0.05, part: "손" },
  { a: p(0.66, 1.42, 0.22), b: p(0.45, 1.21, 0.21), r: 0.06, part: "팔" },
  { a: p(0.45, 1.21, 0.21), b: p(0.5, 1.29, -0.01), r: 0.05, part: "팔" },
  { a: p(0.73, 1.44, -0.15), b: p(0.74, 1.39, -0.37), r: 0.06, part: "팔" },
  { a: p(0.74, 1.39, -0.37), b: p(0.57, 1.38, -0.22), r: 0.05, part: "팔" },
  { a: p(0.8, 0.83, 0.15), b: p(0.64, 0.47, 0.3), r: 0.09, part: "다리" },
  { a: p(0.64, 0.47, 0.3), b: p(0.76, 0.14, 0.35), r: 0.07, part: "다리" },
  { a: p(0.76, 0.12, 0.35), b: p(0.61, 0.04, 0.4), r: 0.05, part: "발" },
  { a: p(0.83, 0.84, -0.04), b: p(0.66, 0.48, -0.17), r: 0.09, part: "다리" },
  { a: p(0.66, 0.48, -0.17), b: p(0.76, 0.15, -0.22), r: 0.07, part: "다리" },
  { a: p(0.76, 0.13, -0.22), b: p(0.62, 0.04, -0.29), r: 0.05, part: "발" },
];
const mirror = (c: Capsule): Capsule => ({
  ...c,
  a: p(-c.a.x, c.a.y, c.a.z),
  b: p(-c.b.x, c.b.y, c.b.z),
});
const LEFTY = RIGHTY.map(mirror);
export const batterBody = (hand: "R" | "L") => (hand === "L" ? LEFTY : RIGHTY);

/**
 * First point of a ball path (sampled points, in order) that touches the batter's body:
 * the body part and where. Null when the ball never touches him.
 */
export function ballHitsBody(path: P3[], hand: "R" | "L") {
  const body = batterBody(hand);
  for (let i = 0; i < path.length; i++) {
    const q = path[i];
    // Quick reject: nowhere near the batter's box.
    if ((hand === "L" ? -q.x : q.x) < 0.3 || q.z > 0.75 || q.z < -0.6) continue;
    for (const c of body)
      if (segmentDistance(q, c.a, c.b) <= c.r + BALL_R)
        return { part: c.part, point: { ...q }, index: i };
  }
  return null;
}

/** Half the width of a bag (38 cm) and of home plate, along the base path (m). */
export const BAG_HALF = 0.19;
/** Runner body radius (m) and how far his touching point leads his centre (m). */
export const RUNNER_R = 0.2;
export type RunnerPose = "run" | "slide" | "dive";
export const LEAD: Record<RunnerPose, number> = {
  // Upright: the stride puts a foot this far ahead of the hips.
  run: 0.3,
  // Feet first: the lead foot is about a leg's length ahead of the hips.
  slide: 0.95,
  // Head first (a dive back to the bag, or around a tag): the hand reaches farther.
  dive: 1.05,
};
/** How far before the bag's centre (m, along the path) the runner's centre is when he touches it. */
export const touchDistance = (pose: RunnerPose) => BAG_HALF + LEAD[pose];
/** The holder's tag: glove this far from his body centre, glove radius (m). */
export const TAG_ARM = 0.75;
export const GLOVE_R = 0.1;

/**
 * Does the ball holder at `holder` reach the runner with his glove? The runner's centre is at
 * `runner`, heading along `dir` (unit, ground plane; zero when standing) in this pose.
 */
export function tagReaches(holder: P3, runner: P3, dir: P3, pose: RunnerPose) {
  const reach = TAG_ARM + GLOVE_R,
    body = Math.hypot(runner.x - holder.x, runner.z - holder.z) - RUNNER_R,
    lead = LEAD[pose],
    leadX = runner.x + dir.x * lead,
    leadZ = runner.z + dir.z * lead,
    toLead = Math.hypot(leadX - holder.x, leadZ - holder.z);
  return Math.min(body, toLead) <= reach;
}

/** The capsules drawn for a runner (debug view): body and the reach to his touching point. */
export function runnerShapes(at: P3, dir: P3, pose: RunnerPose): Capsule[] {
  const lead = LEAD[pose],
    tip = p(at.x + dir.x * lead, pose === "run" ? 0.1 : 0.15, at.z + dir.z * lead);
  if (pose === "run")
    return [
      { a: p(at.x, 0.25, at.z), b: p(at.x, 1.55, at.z), r: RUNNER_R, part: "몸" },
      { a: p(at.x, 0.1, at.z), b: tip, r: 0.06, part: "발" },
    ];
  return [
    {
      a: p(at.x - dir.x * 0.6, 0.25, at.z - dir.z * 0.6),
      b: p(at.x, 0.25, at.z),
      r: RUNNER_R,
      part: "몸",
    },
    { a: p(at.x, 0.2, at.z), b: tip, r: 0.08, part: pose === "slide" ? "발" : "손" },
  ];
}
