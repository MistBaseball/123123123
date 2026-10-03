/**
 * AI training ground settings: batted-ball distribution, starting situations, rewards and
 * PPO / self-play settings. Change the numbers here; nothing else needs to change.
 */
export type BallKind = "ground" | "line" | "fly" | "bunt";
export type Range = [number, number];

export const AI_CONFIG = {
  seed: 1,

  /** The batter is part of the world, not a learner: every play starts from a ball drawn here. */
  ball: {
    /** Share of each kind of batted ball (normalised). */
    kinds: { ground: 0.45, line: 0.2, fly: 0.3, bunt: 0.05 } as Record<BallKind, number>,
    /** Exit speed (km/h) and distance (m) of each kind. Ground balls: distance where the ball
     * gets to the fielders' area; flies over 104 m leave the park (home run). */
    ground: { speedKmh: [80, 150] as Range, distance: [10, 32] as Range },
    line: { speedKmh: [110, 165] as Range, distance: [30, 90] as Range },
    fly: { speedKmh: [100, 165] as Range, distance: [35, 112] as Range },
    bunt: { speedKmh: [20, 40] as Range, distance: [4, 12] as Range },
    /** Flight time = distance / (speed × factor), clamped to `clamp` (seconds). */
    flight: {
      ground: { factor: 0.6, clamp: [0.45, 2.2] as Range },
      line: { factor: 0.85, clamp: [0.9, 3] as Range },
      fly: { factor: 0.45, clamp: [1.8, 4.5] as Range },
      bunt: { factor: 0.66, clamp: [0.8, 2.6] as Range },
    },
    /** Direction: degrees from the middle (+ = third-base side), normal spread, kept fair. */
    direction: { spreadDeg: 22, maxDeg: 43 },
  },

  /** Starting situation, drawn fresh for every play. */
  start: {
    /** Chance of 0, 1 and 2 outs. */
    outs: [1 / 3, 1 / 3, 1 / 3],
    /** Chance of a runner on 1st, 2nd, 3rd. */
    bases: [0.55, 0.4, 0.3],
    /** Fielders' speed/eye/arm and the runners' speed (ratings). */
    fielderRating: [45, 85] as Range,
    runnerSpeed: [40, 90] as Range,
  },

  reward: {
    fielder: {
      out: 1,
      /** Extra for every out after the first on the same play. */
      doublePlay: 0.5,
      run: -1,
      /** Every base a runner (or the batter) gains. */
      advance: -0.2,
      throwError: -0.3,
      /** Every decision ("step"). */
      step: -0.01,
    },
    runner: {
      /** Reaching 1st, 2nd, 3rd (farther bases are worth more); home is `run`. */
      advance: [0.2, 0.25, 0.3],
      run: 1,
      /** Bigger than all the advance rewards together (0.75). */
      out: -1,
      step: -0.01,
    },
  },

  ppo: {
    gamma: 0.99,
    lambda: 0.95,
    clip: 0.2,
    epochs: 4,
    minibatch: 512,
    lr: 0.001,
    valueLr: 0.002,
    entropy: 0.01,
    /** Plays per worker per round (one PPO update per round). */
    plays: 48,
    hidden: 24,
  },

  /** Self-play against past versions, so neither side runs away and collapses. */
  league: {
    /** Save both sides into the pool every N updates. */
    snapshotEvery: 20,
    poolSize: 20,
    /** Chance a play is against a past version of the other side (only one side learns). */
    pastOpponent: 0.3,
  },

  checkpointEvery: 100,
  evalEvery: 50,
  evalPlays: 400,
};
export type AiConfig = typeof AI_CONFIG;
