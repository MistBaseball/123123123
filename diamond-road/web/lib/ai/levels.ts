/**
 * The rival team's runner/fielder AI for each difficulty. Strength measured against the
 * hand-written AI on the same 1000 situations (reward per play, runners / fielders):
 * untrained −0.61 / −0.13, 100 updates −0.07 / −0.13, 800 updates −0.01 / +0.03,
 * 1500 updates +0.06 / +0.01. "Impossible" takes the strongest of each side.
 */
import type { BaseballEngine, Difficulty } from "../game/engine.ts";
import { chooser, importPolicy } from "./agent.ts";
import { AI_WEIGHTS } from "./weights.ts";

type Level = {
  runner: keyof typeof AI_WEIGHTS | null;
  fielder: keyof typeof AI_WEIGHTS | null;
  /** AI 성능: 1–5 and a short name for the settings. */
  meter: number;
  name: string;
  /** Longer description (tooltip). */
  detail: string;
};
export const AI_LEVELS: Record<Difficulty, Level> = {
  baby: {
    runner: "untrained",
    fielder: "untrained",
    meter: 1,
    name: "학습 전",
    detail: "학습 전 AI (판단이 서툼)",
  },
  easy: {
    runner: "learn100",
    fielder: "learn100",
    meter: 2,
    name: "학습 100번",
    detail: "100번 학습한 AI (기본보다 약함)",
  },
  normal: {
    runner: null,
    fielder: null,
    meter: 3,
    name: "기본",
    detail: "기본 AI (손으로 만든 규칙)",
  },
  hard: {
    runner: "learn800",
    fielder: "learn800",
    meter: 4,
    name: "학습 800번",
    detail: "800번 학습한 AI (수비가 기본보다 강함)",
  },
  impossible: {
    runner: "learn1500",
    fielder: "learn800",
    meter: 5,
    name: "최강",
    detail: "가장 강한 AI (주자 1500번 · 수비 800번 학습)",
  },
};

/** Sets the rival team's AI for this difficulty (best choices, no randomness). */
export function applyLevel(engine: BaseballEngine, d: Difficulty) {
  const lv = AI_LEVELS[d] ?? AI_LEVELS.normal,
    w = (k: string | null) => (k ? AI_WEIGHTS[k] : null),
    r = w(lv.runner),
    f = w(lv.fielder);
  engine.opponentAI = {
    runner: r ? chooser(importPolicy(r.runner, 0), 0, { greedy: true }) : null,
    fielder: f ? chooser(importPolicy(f.holder, 1), 1, { greedy: true }) : null,
  };
}
