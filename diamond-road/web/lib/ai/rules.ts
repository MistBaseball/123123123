/**
 * Fixed rule-based opponents for measuring the learned AI (they never learn):
 * - safeRunner: only goes for a base he reaches a full second before the ball; otherwise the
 *   safest base he can take.
 * - nearestThrow: the ball holder always throws to the nearest base with a runner to get.
 * The game's own hand-written AI (null chooser) is the third, stronger yardstick.
 */
import type { Chooser } from "../game/engine.ts";

// Runner option row: [0] (ball − him)/2 as he sees it, [4] (base − where he is)/2.
export const safeRunner: Chooser = (_ctx, options) => {
  let pick = -1;
  for (let i = 0; i < options.length; i++)
    if (options[i][0] > 0.5 && (pick < 0 || options[i][4] > options[pick][4])) pick = i;
  if (pick >= 0) return pick;
  pick = 0;
  for (let i = 1; i < options.length; i++) if (options[i][0] > options[pick][0]) pick = i;
  return pick;
};

// Holder option row: [0] 1 = keep the ball, [10] distance to that bag / 60.
export const nearestThrow: Chooser = (_ctx, options) => {
  let pick = -1;
  for (let i = 0; i < options.length; i++)
    if (options[i][0] === 0 && (pick < 0 || options[i][10] < options[pick][10])) pick = i;
  return pick < 0 ? 0 : pick;
};
