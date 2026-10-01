"use client";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  Crosshair,
  Trophy,
  Dumbbell,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings2,
  CircleHelp,
  ChevronRight,
  ArrowUpRight,
  RotateCcw,
  Shield,
  Zap,
  Activity,
  BookOpen,
  Moon,
  Flag,
  Camera as CameraIcon,
  MousePointer2,
  Wind,
  Medal,
  Check,
  UserRound,
  Maximize2,
  Lock,
  CalendarDays,
  Sparkles,
  Footprints,
} from "lucide-react";
import { TrainingMinigame, TRAINING_GAMES } from "@/components/game/Minigames";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Toaster, toast } from "sonner";
import {
  BaseballEngine,
  PITCHES,
  ALL_PITCHES,
  HIDDEN_PITCHES,
  isHiddenPitch,
  SWING_GOOD,
  SWING_SWEET,
  BLESSINGS,
  DAY_ACTIONS,
  STAT_BASE,
  STAT_CAP,
  STAT_POINTS,
  TEAMS,
  teamOf,
  batReach,
  controlSpread,
  clamp,
  pitchMovement,
  swingWindow,
  matchTeams,
  STAGES,
  statCapOf,
  LEGEND_PITCHES,
  STAT_NAMES,
  STAT_INFO,
  HOME_LINEUP,
  playerLabel,
  type RecapLine,
  fastballSpeed,
  josa,
  type StatKey,
  type GameState,
  type Mode,
  type Camera,
  type Career,
} from "@/lib/game/engine";
import type { BaseballField } from "@/lib/game/field";
import type { SoftwareField } from "@/lib/game/software-field";

/**
 * The physical key as a lowercase letter/digit. With Korean input on, e.key is "ㄷ" for E and
 * "ㄹ" for F, so shortcuts read the key position (e.code) instead of the typed character.
 */
const keyOf = (e: KeyboardEvent) => {
  const letter = /^Key([A-Z])$/.exec(e.code),
    digit = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  if (letter) return letter[1].toLowerCase();
  if (digit) return digit[1];
  if (e.code === "Space") return " ";
  if (e.code === "Minus" || e.code === "NumpadSubtract") return "-";
  return e.key.toLowerCase();
};
const cameras: { id: Camera; label: string }[] = [
  { id: "pitcher", label: "투수" },
  { id: "catcher", label: "포수" },
  { id: "broadcast", label: "중계" },
  { id: "ball", label: "타구" },
  { id: "top", label: "탑뷰" },
];
const modes: { id: Mode; label: string; sub: string }[] = [
  { id: "match", label: "시즌 경기", sub: "투구 + 타격 · XP 획득" },
  { id: "bullpen", label: "불펜", sub: "투구 연습" },
  { id: "batting", label: "배팅 케이지", sub: "타격 연습" },
];
const statNames = STAT_NAMES;
/** Speed readout colour tier and label, so fast and slow pitches read differently at a glance. */
const speedTier = (kmh: number) =>
  !kmh
    ? { cls: "", label: "" }
    : kmh >= 160
      ? { cls: "blazing", label: "초강속구" }
      : kmh >= 145
        ? { cls: "fast", label: "강속구" }
        : kmh < 115
          ? { cls: "slow", label: "느린 공" }
          : { cls: "", label: "" };
/** Plain-word strengths and costs of a pitch, read from its data. */
const pitchTraits = (p: (typeof PITCHES)[number]) =>
  [
    p.whiff >= 0.12
      ? { text: "헛스윙 유도 강함", good: true }
      : p.whiff >= 0.09 && { text: "헛스윙 유도", good: true },
    p.soft >= 0.05 && { text: "땅볼·약한 타구 유도", good: true },
    p.soft > 0 && p.soft < 0.05 && { text: "약한 타구 유도", good: true },
    p.control >= 1.15 && { text: "제구 어려움", good: false },
    p.control > 1 && p.control < 1.15 && { text: "제구 약간 어려움", good: false },
    p.stamina >= 1.1 && { text: "체력 소모 큼", good: false },
    p.stamina < 1 && { text: "체력 소모 적음", good: true },
    !!p.flutter && { text: "예측 불가 흔들림", good: true },
    p.wild >= 1.2 && { text: "폭투 위험", good: false },
  ].filter(Boolean) as { text: string; good: boolean }[];
/** A stat's live effect, e.g. "138 km/h", from the same formula the game uses. */
const statMetric = (k: StatKey, v: number) => {
  const i = STAT_INFO[k],
    n = i.metric(v);
  return `${i.digits ? n.toFixed(i.digits) : Math.round(n)}${i.unit ? " " + i.unit : ""}`;
};
/** How much one more point changes the effect, e.g. "+0.4 km/h" or "−0.2 cm". */
const statStep = (k: StatKey, v: number) => {
  const i = STAT_INFO[k],
    d = i.metric(v + 1) - i.metric(v),
    digits = Math.abs(d) < 0.95 ? (Math.abs(d) < 0.095 ? 2 : 1) : 0;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(digits)}${i.unit ? " " + i.unit : ""}`;
};
/**
 * Training page: what every stat does, with its current value and live in-game effect, so the
 * player can see what a training session will actually change.
 */
function StatGuide({ c }: { c: Career }) {
  const cap = statCapOf(c);
  return (
    <section className="stat-guide" aria-labelledby="stat-guide-title">
      <header>
        <h2 id="stat-guide-title">내 능력치와 효과</h2>
        <p>
          숫자는 지금 능력치로 게임에서 실제로 쓰이는 값입니다. 훈련으로 1 오를 때마다 오른쪽처럼
          바뀝니다. 최대 {cap}
          {c.stage === "pro" || c.legend ? "" : " (프로에 가면 200까지)"}.
        </p>
      </header>
      <ol>
        {(Object.keys(STAT_INFO) as StatKey[]).map((k) => {
          const i = STAT_INFO[k],
            v = c.stats[k];
          return (
            <li key={k} className={`stat-row role-${i.role === "투구" ? "pitch" : "bat"}`}>
              <div className="stat-name">
                <span className="stat-role">{i.role}</span>
                <strong>{statNames[k]}</strong>
                <b>{v}</b>
                <Progress value={(v / cap) * 100} aria-label={`${statNames[k]} ${v}`} />
              </div>
              <p className="stat-what">{i.what}</p>
              <div className="stat-effect">
                <span>{i.label}</span>
                <strong>{statMetric(k, v)}</strong>
                <small>{v >= cap ? "최대치에 도달" : `+1마다 ${statStep(k, v)}`}</small>
                <em>{i.training} 훈련으로 상승</em>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Field({ engine }: { engine: BaseballEngine }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let field: BaseballField | SoftwareField | undefined,
      frame = 0,
      disposed = false,
      last = performance.now();
    const setup = async () => {
      if (!host.current) return;
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2");
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        try {
          const { BaseballField } = await import("@/lib/game/field");
          if (!disposed && host.current) field = new BaseballField(host.current, engine);
          return;
        } catch {}
      }
      const { SoftwareField } = await import("@/lib/game/software-field");
      if (!disposed && host.current) {
        field = new SoftwareField(host.current, engine);
        setError("호환 그래픽 모드");
      }
    };
    void setup().catch(() => setError("야구장을 불러오지 못했습니다. 새로고침해 주세요."));
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      engine.tick(dt);
      field?.update(dt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      field?.dispose();
    };
  }, [engine]);
  // Keep React-owned labels outside the renderer-owned canvas container.
  return (
    <>
      <div className="field-render" ref={host} />
      {error && (
        <p className={error === "호환 그래픽 모드" ? "graphics-mode" : "render-error"}>{error}</p>
      )}
    </>
  );
}

function BaseMap({ bases }: { bases: boolean[] }) {
  return (
    <svg
      className="base-map"
      viewBox="0 0 76 68"
      aria-label={`1루 ${bases[0] ? "주자 있음" : "비어 있음"}, 2루 ${bases[1] ? "주자 있음" : "비어 있음"}, 3루 ${bases[2] ? "주자 있음" : "비어 있음"}`}
      role="img"
    >
      <path d="M38 9 64 34 38 59 12 34Z" fill="none" stroke="#50626a" strokeWidth="1.4" />
      {[
        [61, 34, 0],
        [38, 12, 1],
        [15, 34, 2],
      ].map(([x, y, i]) => (
        <rect
          key={i}
          x={x - 5}
          y={y - 5}
          width="10"
          height="10"
          transform={`rotate(45 ${x} ${y})`}
          fill={bases[i] ? "#e9b85b" : "#415158"}
        />
      ))}
      <path d="M33 56h10v5l-5 4-5-4Z" fill="#f2eee3" />
    </svg>
  );
}
function CountDots({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  return (
    <div className="count-dots">
      <span>{label}</span>
      <div>
        {Array.from({ length: max }, (_, i) => (
          <i key={i} style={{ background: i < count ? color : undefined }} />
        ))}
      </div>
    </div>
  );
}
/** Scoreboard badge: the team's first letter, in the club color when it is a pro club. */
function TeamLogo({ name }: { name: string }) {
  const club = TEAMS.find((t) => t.name === name);
  return (
    <span
      className="team-logo"
      style={club ? ({ background: club.color, color: "#fff" } as React.CSSProperties) : undefined}
    >
      {name.slice(0, 1)}
    </span>
  );
}
function Scoreboard({ s }: { s: GameState }) {
  const [away, home] = matchTeams(s.career);
  return (
    <div className="scoreboard">
      <div className="board-match">
        <span className="live-label">{s.mode === "match" ? "시즌" : "연습"}</span>
        <span>
          {s.mode === "match"
            ? `${s.maxInnings}이닝 시즌 경기`
            : s.mode === "bullpen"
              ? "불펜 피칭"
              : "배팅 케이지"}
        </span>
      </div>
      <div className={`team away ${s.half === "top" ? "at-bat" : ""}`}>
        <TeamLogo name={away} />
        <span>
          {away}
          <small>원정</small>
        </span>
        <strong>{s.score[0]}</strong>
      </div>
      <div className="inning">
        <span>
          {s.inning} <b>{s.half === "top" ? "▲" : "▼"}</b>
        </span>
        <small>{s.half === "top" ? "초" : "말"}</small>
      </div>
      <div className={`team home ${s.half === "bottom" ? "at-bat" : ""}`}>
        <strong>{s.score[1]}</strong>
        <span>
          {home}
          <small>홈</small>
        </span>
        <TeamLogo name={home} />
      </div>
      <div className="counts">
        <CountDots label="B" count={s.balls} max={3} color="#9fc9a8" />
        <CountDots label="S" count={s.strikes} max={2} color="#e9b85b" />
        <CountDots label="O" count={s.outs} max={3} color="#e88770" />
      </div>
      <BaseMap bases={s.bases} />
    </div>
  );
}

function AimPad({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const batting = engine.batting;
  // Batting uses the catcher camera, where world +X is on the left; mirror to match the screen.
  const side = batting ? -1 : 1;
  const toX = (x: number) => ((side * x + 0.7) / 1.4) * 280,
    toY = (y: number) => ((1.85 - y) / 1.7) * 240;
  const flight = s.flight,
    flying = s.phase === "flight" && !!flight;
  const locked = flight && (s.phase === "windup" || flying);
  const aim = locked ? (batting ? (flight.swung ? flight.batAim : s.aim) : flight.aim) : s.aim;
  const progress = flying ? clamp(flight.elapsed / flight.visualDuration, 0, 1) : 0;
  const previous = batting ? s.batFeedback : null;
  const hint = batting && locked ? flight.hint : null;
  const activePitch = ALL_PITCHES.find((p) => p.id === (locked ? flight.pitch : s.selected))!;
  const movement = pitchMovement(
    activePitch.id,
    locked ? flight.movement : s.career.stats.movement,
  );
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    engine.setAim(
      side * (((e.clientX - b.left) / b.width) * 1.4 - 0.7),
      1.85 - ((e.clientY - b.top) / b.height) * 1.7,
    );
  };
  const action = () => (batting ? engine.swing() : engine.throwAt());
  return (
    <div
      className="aim-pad"
      role="button"
      tabIndex={0}
      aria-label={
        batting ? "타격 조준판: 마우스 조준, 클릭 스윙" : "투구 조준판: 마우스 조준, 클릭 투구"
      }
      onPointerMove={move}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        move(e);
        action();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!e.repeat) action();
        }
      }}
    >
      <svg viewBox="0 0 280 240" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="aimgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#ffffff" strokeOpacity=".035" />
          </pattern>
        </defs>
        <rect width="280" height="240" fill="url(#aimgrid)" />
        <rect
          x={Math.min(toX(-0.215), toX(0.215))}
          y={toY(1.35)}
          width={(0.43 / 1.4) * 280}
          height={(0.8 / 1.7) * 240}
          fill="#eac270"
          fillOpacity=".055"
          stroke="#c7ccb6"
          strokeOpacity=".65"
        />
        {[1, 2].map((i) => (
          <g key={i}>
            <path
              d={`M${toX(-0.215 + (i * 0.43) / 3)} ${toY(1.35)}V${toY(0.55)}`}
              stroke="#ccd0bc"
              strokeOpacity=".2"
            />
            <path
              d={`M${toX(-0.215)} ${toY(0.55 + (i * 0.8) / 3)}H${toX(0.215)}`}
              stroke="#ccd0bc"
              strokeOpacity=".2"
            />
          </g>
        ))}
        {!batting && (
          <g className="movement-envelope" stroke={activePitch.color}>
            <rect
              x={toX(aim.x + movement.minX)}
              y={toY(aim.y + movement.maxY)}
              width={Math.max(3, (movement.maxX - movement.minX) * 200)}
              height={Math.max(3, ((movement.maxY - movement.minY) * 240) / 1.7)}
              fill={activePitch.color}
              fillOpacity=".14"
              strokeOpacity=".6"
              strokeDasharray="4 3"
              rx="2"
            />
            <path
              d={`M${toX(aim.x)} ${toY(aim.y)}L${toX(aim.x + movement.x)} ${toY(aim.y + movement.y)}`}
              fill="none"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <circle
              cx={toX(aim.x + movement.x)}
              cy={toY(aim.y + movement.y)}
              r="4"
              fill={activePitch.color}
            />
          </g>
        )}
        {!batting &&
          s.history
            .slice()
            .reverse()
            .map((p, i) => (
              <circle
                key={i}
                cx={toX(p.x)}
                cy={toY(p.y)}
                r="5"
                opacity={0.3 + i * 0.075}
                fill={p.kind === "strike" ? "#e5b85c" : "#85bde4"}
              />
            ))}
        {hint && (
          <g className="arrival-hint">
            <defs>
              <radialGradient id="hintglow">
                <stop offset="0" stopColor="#fff8df" stopOpacity=".26" />
                <stop offset=".65" stopColor="#fff8df" stopOpacity=".12" />
                <stop offset="1" stopColor="#fff8df" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse
              cx={toX(hint.x)}
              cy={toY(hint.y)}
              rx={(hint.r / 1.4) * 280 * 1.15}
              ry={(hint.r / 1.7) * 240 * 1.15}
              fill="url(#hintglow)"
            />
          </g>
        )}
        {previous && !locked && (
          <g opacity=".8">
            <circle cx={toX(previous.ball.x)} cy={toY(previous.ball.y)} r="6" fill="#f6f3dd" />
            {previous.batAim && (
              <g
                transform={`translate(${toX(previous.batAim.x)} ${toY(previous.batAim.y)})`}
                stroke="#e59ab4"
                strokeWidth="2"
              >
                <circle r="12" fill="none" />
                <path d="M-5-5 5 5M-5 5 5-5" />
              </g>
            )}
          </g>
        )}
        <g transform={`translate(${toX(aim.x)} ${toY(aim.y)})`} stroke="#f1c771" strokeWidth="1.6">
          {batting && (
            <ellipse
              rx={(batReach(engine.batter.contact, s.swingStyle) / 1.4) * 280}
              ry={(batReach(engine.batter.contact, s.swingStyle) / 1.7) * 240}
              fill="#f1c771"
              fillOpacity=".06"
              strokeOpacity=".5"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}
          <circle r="11" fill="none" />
          <path d="M-17 0h10M7 0h10M0-17v10M0 7v10" />
          <circle r="2" fill="#f1c771" stroke="none" />
        </g>
        {batting && flying && (
          <circle
            cx={toX(s.ball.x)}
            cy={toY(s.ball.y)}
            r={3 + progress * 4}
            fill="#fff8df"
            stroke="#152932"
            strokeWidth="1.5"
          />
        )}
        <path d="M127 217h26v8l-13 8-13-8Z" fill="#9aa9a6" fillOpacity=".4" />
      </svg>
      <span className="pad-top">
        {batting ? `포수 시점 · 흐린 원 = 공 도착 범위` : "투수 방향 기준 · 색 영역은 최대 휨"}
      </span>
      {batting && flying && <TimingBar s={s} className="pad-timing" />}
      <span className="pad-action">
        {batting
          ? flying
            ? "원 안으로 조준 → 금색 구간에서 클릭"
            : previous?.batAim
              ? "분홍색: 이전 스윙 지점"
              : "클릭 / Space로 스윙"
          : "클릭하여 투구"}
      </span>
    </div>
  );
}
/** Shared timing bar: faint = contact window, bright = perfect timing, white = ball now. */
function TimingBar({ s, className }: { s: GameState; className: string }) {
  const f = s.flight,
    progress = f ? clamp(f.elapsed / f.visualDuration, 0, 1) : 0,
    w = swingWindow(s.difficulty, s.career.stage, s.swingStyle),
    pct = (v: number) => `${clamp(v, 0, 1) * 100}%`;
  return (
    <div className={className} aria-label={`투구 진행 ${Math.round(progress * 100)}%`}>
      <i
        className="contact-window"
        style={{ left: pct(SWING_SWEET - w), right: `calc(100% - ${pct(SWING_SWEET + w)})` }}
      />
      <i
        className="perfect-window"
        style={{
          left: pct(SWING_SWEET - SWING_GOOD),
          right: `calc(100% - ${pct(SWING_SWEET + SWING_GOOD)})`,
        }}
      />
      <b style={{ left: pct(progress) }} />
    </div>
  );
}
function PitchMovementGuide({ s }: { s: GameState }) {
  const f = s.phase === "windup" || s.phase === "flight" ? s.flight : null;
  const p = ALL_PITCHES.find((p) => p.id === (f?.pitch ?? s.selected))!,
    m = pitchMovement(p.id, f?.movement ?? s.career.stats.movement);
  if (m.flutter > 0)
    return (
      <p className="pp-desc" aria-label={p.name + " 움직임"}>
        <i style={{ background: p.color }} />
        <span>
          <b>{p.name}</b> {p.desc}
          <small>
            날아오는 동안 상하좌우 최대 {Math.round(m.flutter * 100)} cm 흔들림 · 방향은 던질 때마다
            무작위 (조준판의 색 영역)
          </small>
        </span>
      </p>
    );
  return (
    <p className="pp-desc" aria-label={p.name + " 움직임"}>
      <i style={{ background: p.color }} />
      <span>
        <b>{p.name}</b> {p.desc}
        <small>
          최대 휨 {m.x >= 0 ? "→" : "←"} {Math.abs(m.x * 100).toFixed(0)} cm ·{" "}
          {m.y >= 0 ? "↑" : "↓"} {Math.abs(m.y * 100).toFixed(0)} cm (조준판의 색 영역)
        </small>
      </span>
    </p>
  );
}
function BattingFeedback({ s }: { s: GameState }) {
  const f = s.batFeedback;
  if (!f)
    return (
      <p className="pp-desc bat-tip">
        <span>
          <b>흐린 빛</b> = 공이 올 범위, <b>점선 원</b> = 배트가 닿는 범위. 원을 빛에 겹치고 위쪽
          게이지 <b>금색</b>에서 스윙!
        </span>
      </p>
    );
  const label = {
    early: "스윙이 빨랐어요",
    good: "좋은 타이밍",
    late: "스윙이 늦었어요",
    take: "공을 지켜봤어요",
  }[f.timing];
  return (
    <p className={`pp-desc bat-feedback-line ${f.contact ? "contact" : ""}`} role="status">
      <span>
        <b>{label}</b> · {f.contact ? "배트에 맞음" : f.timing === "take" ? "노 스윙" : "헛스윙"}
        {f.offsetMs !== null && (
          <small>
            타이밍 {f.offsetMs > 0 ? "+" : ""}
            {f.offsetMs} ms · 조준 오차 {f.errorCm} cm
          </small>
        )}
      </span>
    </p>
  );
}
function LineScore({ s }: { s: GameState }) {
  return (
    <div className="line-score">
      <table>
        <caption className="sr-only">이닝별 점수</caption>
        <thead>
          <tr>
            <th>팀</th>
            {Array.from({ length: s.maxInnings }, (_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
            <th>R</th>
            <th>H</th>
            <th>E</th>
          </tr>
        </thead>
        <tbody>
          {matchTeams(s.career).map((name, i) => (
            <tr key={name}>
              <th>{name}</th>
              {s.lines[i].map((n, j) => (
                <td className={j === s.inning - 1 ? "current" : ""} key={j}>
                  {j < s.inning ? n : "—"}
                </td>
              ))}
              <td className="total">{s.score[i]}</td>
              <td>{s.hits[i]}</td>
              <td>{s.errors[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Both teams' strength side by side (lineup averages, defense, starting pitcher). */
function TeamStrength({ engine }: { engine: BaseballEngine }) {
  const teams = [engine.teamStrength(false), engine.teamStrength(true)],
    rows: [string, "contact" | "power" | "eye" | "speed" | "defense"][] = [
      ["컨택", "contact"],
      ["파워", "power"],
      ["선구", "eye"],
      ["주력", "speed"],
      ["수비", "defense"],
    ];
  return (
    <div className="team-strength" aria-label="양 팀 전력">
      <span className="eyebrow">양 팀 전력 · 라인업 평균</span>
      <div className="ts-grid">
        <span />
        {teams.map((t, i) => (
          <strong key={i} className={i ? "home" : "away"}>
            {t.name}
          </strong>
        ))}
        {rows.map(([label, k]) => (
          <Fragment key={k}>
            <span className="ts-label">{label}</span>
            {teams.map((t, i) => {
              const v = t[k],
                better = v > teams[1 - i][k];
              return (
                <span
                  key={i}
                  className={`ts-cell ${i ? "home" : "away"} ${better ? "better" : ""}`}
                >
                  <i style={{ width: `${Math.min(100, v)}%` }} />
                  <b>{v}</b>
                </span>
              );
            })}
          </Fragment>
        ))}
        <span className="ts-label">선발</span>
        {teams.map((t, i) => (
          <span key={i} className="ts-pitcher">
            {t.pitcher} <small>{t.velocity} km/h</small>
          </span>
        ))}
      </div>
    </div>
  );
}
function CareerView({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const c = s.career;
  const [name, setName] = useState(c.name);
  // The save loads after the first render; follow the stored name once it arrives.
  useEffect(() => setName(c.name), [c.name]);
  return (
    <section className="career-view embedded">
      <div className="section-intro shop-intro">
        <div>
          <h2>나의 선수와 진로</h2>
          <p>
            {c.stage === "pro"
              ? `${teamOf(c.club)?.name ?? "프로"} 소속 프로 시즌. 하루의 선택이 내일의 선수를 만듭니다.`
              : "고교 마지막 시즌. 하루의 선택이 내일의 선수를 만듭니다."}
          </p>
        </div>
        <span className="season-stamp">
          {c.stage === "pro" ? "프로 1년차" : "고교 3학년"}{" "}
          <b>DAY {String(c.day).padStart(2, "0")}</b>
        </span>
      </div>
      <div className="career-grid">
        <article className="player-card">
          <div className="jersey-number">18</div>
          <div className="player-card-top">
            <span>
              {c.stage === "pro"
                ? `${teamOf(c.club)?.city ?? ""} ${teamOf(c.club)?.name ?? ""}`
                : "미산고등학교 야구부"}
            </span>
            <Shield size={24} />
          </div>
          <div className="player-card-bottom">
            <h2>{c.name}</h2>
            <p>{c.stage === "pro" ? "프로 1년차 우완 투수" : "고교 3학년 우완 투수"}</p>
            <div className="player-rating">
              <strong>
                {Math.round(
                  Object.values(c.stats).reduce((a, b) => a + b, 0) / Object.values(c.stats).length,
                )}
              </strong>
              <span>종합 능력</span>
            </div>
          </div>
        </article>
        <div className="career-main">
          <article className="panel">
            <div className="panel-heading">
              <h2>선수 정보</h2>
              <span>보유 {c.xp} XP</span>
            </div>
            <div className="known-pitches">
              <span>보유 구종</span>
              {ALL_PITCHES.filter((p) => c.pitches.includes(p.id)).map((p) => (
                <b key={p.id} style={{ borderColor: p.color }}>
                  {p.name}
                </b>
              ))}
            </div>
            <form
              className="rename"
              onSubmit={(e) => {
                e.preventDefault();
                if (engine.rename(name)) toast.success("선수 이름을 저장했습니다");
              }}
            >
              <label htmlFor="player-name">선수 이름</label>
              <input
                id="player-name"
                maxLength={12}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className="subtle-button" type="submit">
                저장
              </button>
            </form>
          </article>
          <article className="panel scout-panel">
            <div className="panel-heading">
              <h2>{c.stage === "pro" ? "프로 리포트" : "스카우트 리포트"}</h2>
              <Medal size={20} />
            </div>
            <ScoutMeter s={s} big />
            <p>
              {c.stage === "pro"
                ? c.proGoal
                  ? `${STAGES.pro.goalReward} 달성! 프로 무대에서 계속 성장하세요.`
                  : `프로 데뷔 시즌. 경기를 마칠 때마다 감독의 신뢰가 오르고, 100점이면 ${STAGES.pro.goalReward}입니다.`
                : c.draft
                  ? `진로 확정: ${c.draft}`
                  : "시즌 경기를 마칠 때마다 탈삼진·안타·승리에 따라 평가가 3~18점 오릅니다. 100점이 되면 입단 제의를 받습니다."}
            </p>
          </article>
        </div>
        <article className="panel career-log">
          <div className="panel-heading">
            <h2>시즌 기록</h2>
            <Flag size={18} />
          </div>
          <div className="record-grid">
            {[
              ["경기", c.games],
              ["승리", c.wins],
              ["탈삼진", c.strikeouts],
              ["안타", c.hits],
            ].map(([k, v]) => (
              <div key={k}>
                <b>{v}</b>
                <span>{k}</span>
              </div>
            ))}
          </div>
          {c.stage !== "pro" && (
            <>
              <h3>미산고 라인업</h3>
              <p className="muted small">
                나는 1번 타자. 2~9번은 동료가 자기 능력치로 타석에 서고, 스윙은 모두 내가 조작한다.
              </p>
              <ol className="team-lineup">
                {HOME_LINEUP.map((p, i) => (
                  <li key={i}>
                    <span>{i + 1}</span>
                    <strong>
                      {i === 0 ? (
                        c.name
                      ) : (
                        <>
                          <em>[{p.nick}]</em> {p.name}
                        </>
                      )}
                    </strong>
                    <small>
                      {i === 0
                        ? `컨 ${c.stats.contact} · 파 ${c.stats.power} · 주 ${c.stats.speed}`
                        : `컨 ${p.contact} · 파 ${p.power} · 주 ${p.speed}`}
                    </small>
                  </li>
                ))}
              </ol>
            </>
          )}
          <h3>나의 야구 일지</h3>
          <ol>
            {c.history.map((item, i) => (
              <li key={i}>
                <span>{String(c.history.length - i).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
          <p className="muted small">
            {s.saveStatus}
            <br />이 기기의 선수 기록만 저장됩니다.
          </p>
        </article>
      </div>
    </section>
  );
}

const trainings: {
  id: string;
  stat?: StatKey;
  icon: typeof Target;
  name: string;
  desc: string;
  gain: string;
  cost: number;
}[] = [
  {
    id: "bullpen",
    stat: "control" as StatKey,
    icon: Target,
    name: "불펜 피칭",
    desc: "모서리를 찌르는 한 구",
    gain: "제구 +0~2",
    cost: 18,
  },
  {
    id: "weights",
    stat: "velocity" as StatKey,
    icon: Dumbbell,
    name: "하체·코어",
    desc: "강한 하체에서 나오는 구속",
    gain: "구속 +0~2",
    cost: 22,
  },
  {
    id: "breaking",
    stat: "movement" as StatKey,
    icon: Wind,
    name: "변화구 그립",
    desc: "회전으로 만드는 다른 궤적",
    gain: "구위 +0~2",
    cost: 18,
  },
  {
    id: "running",
    stat: "stamina" as StatKey,
    icon: Activity,
    name: "장거리 러닝",
    desc: "마지막 이닝까지 흔들림 없이",
    gain: "지구력 +0~2",
    cost: 16,
  },
  {
    id: "sprint",
    stat: "speed" as StatKey,
    icon: Footprints,
    name: "스프린트",
    desc: "한 베이스를 더 훔치는 다리",
    gain: "주력 +0~2",
    cost: 16,
  },
  {
    id: "batting",
    stat: "contact" as StatKey,
    icon: Crosshair,
    name: "타격 훈련",
    desc: "공을 끝까지 보고 정확하게",
    gain: "컨택 +0~2",
    cost: 20,
  },
  {
    id: "power",
    stat: "power" as StatKey,
    icon: Zap,
    name: "장타 훈련",
    desc: "배트에 싣는 힘",
    gain: "파워 +0~2",
    cost: 22,
  },
  {
    id: "study",
    icon: BookOpen,
    name: "수업·영상 분석",
    desc: "책상에서도 이어지는 야구",
    gain: "컨디션 +2~6",
    cost: 6,
  },
  {
    id: "rest",
    icon: Moon,
    name: "충분한 휴식",
    desc: "잘 쉬는 것도 실력",
    gain: "체력 +38 · 컨디션 +8",
    cost: -38,
  },
];
function LifeView({
  engine,
  s,
  onPlay,
  onPractice,
}: {
  engine: BaseballEngine;
  s: GameState;
  onPlay: () => void;
  onPractice: (mode: Mode) => void;
}) {
  const c = s.career,
    out = c.actions <= 0,
    live = engine.matchActive;
  const [game, setGame] = useState<string | null>(null);
  const step = live || out ? 1 : 0;
  const headline = live
    ? "경기가 한창입니다. 그라운드로 돌아가세요."
    : out
      ? "오전 훈련 끝. 이제 경기장으로 향할 시간."
      : c.actions === DAY_ACTIONS
        ? "새로운 아침. 오늘은 무엇을 쌓을까?"
        : "땀이 식기 전에, 하나 더?";
  return (
    <section className="training-view life-view">
      <div className="section-intro">
        <div>
          <span className="eyebrow">
            {c.stage === "pro"
              ? `프로 1년차 · ${teamOf(c.club)?.name ?? ""} · ${c.name}`
              : `고교 3학년 · 마지막 시즌 · ${c.name}`}
          </span>
          <h1>{headline}</h1>
          <p>
            아침에는 행동력 {DAY_ACTIONS}으로 훈련·수업·휴식을 하고, 오후에는 시즌 경기를 치릅니다.
            경기가 끝나면 밤이 지나고 다음 날이 시작됩니다.
          </p>
        </div>
        <span className="season-stamp">
          시즌 <b>DAY {String(c.day).padStart(2, "0")}</b>
        </span>
      </div>
      <div className="life-timeline" aria-label={`DAY ${c.day} 하루 흐름`}>
        <div className={`life-step ${step === 0 ? "now" : "done"}`}>
          <span>아침 · 훈련</span>
          <strong>
            행동력 {c.actions}/{DAY_ACTIONS}
          </strong>
          <span className="action-pips" aria-hidden="true">
            {Array.from({ length: DAY_ACTIONS }, (_, i) => (
              <i key={i} className={i < c.actions ? "on" : ""} />
            ))}
          </span>
        </div>
        <ChevronRight className="life-arrow" size={18} />
        <div className={`life-step ${step === 1 ? "now" : ""}`}>
          <span>오후 · 시즌 경기</span>
          <strong>{live ? "경기 중" : `${matchTeams(c)[1]} vs ${matchTeams(c)[0]}`}</strong>
          <small>삼진·안타·승리로 XP</small>
        </div>
        <ChevronRight className="life-arrow" size={18} />
        <div className="life-step">
          <span>밤 · 휴식</span>
          <strong>다음 날로</strong>
          <small>체력 +25 · 행동력 {DAY_ACTIONS}</small>
        </div>
        <button className="primary-button life-cta" onClick={onPlay}>
          <span>
            <Play size={16} />
            {live ? "경기로 돌아가기" : "경기장으로 향하기"}
          </span>
          {!live && !out && <small>남은 행동력은 사라집니다</small>}
        </button>
      </div>
      <ScoutMeter s={s} />
      <div className="condition-bar">
        <div>
          <Activity />
          <span>현재 체력</span>
          <strong>
            {Math.round(c.energy)}
            <small>/ 100</small>
          </strong>
          <Progress value={c.energy} />
        </div>
        <div>
          <Zap />
          <span>컨디션</span>
          <strong>
            {c.form}
            <small>/ 100</small>
          </strong>
          <Progress value={c.form} />
        </div>
        <div>
          <Trophy />
          <span>보유 경험치</span>
          <strong>
            {c.xp}
            <small>XP</small>
          </strong>
        </div>
      </div>
      <StatGuide c={c} />
      <h2 className="training-title">오늘의 훈련</h2>
      <div className="training-grid">
        {trainings.map((t) => (
          <button
            className={`training-card ${t.id === "rest" ? "rest-card" : ""}`}
            key={t.id}
            disabled={c.energy < t.cost || live || out}
            onClick={() => {
              if (t.id !== "rest") {
                setGame(t.id);
                return;
              }
              const r = engine.train(t.id);
              r.ok ? toast.success(r.message) : toast.error(r.message);
            }}
          >
            <t.icon size={26} />
            <h2>{t.name}</h2>
            <p>{t.desc}</p>
            {t.stat ? (
              <dl className="training-stat">
                <dt>
                  {statNames[t.stat]} <b>{c.stats[t.stat]}</b>
                </dt>
                <dd>
                  {STAT_INFO[t.stat].label} {statMetric(t.stat, c.stats[t.stat])}
                </dd>
              </dl>
            ) : (
              <dl className="training-stat">
                <dt>{t.id === "rest" ? "현재 체력" : "컨디션"}</dt>
                <dd>
                  {t.id === "rest"
                    ? `${Math.round(c.energy)} / 100 · 낮으면 구속·제구가 떨어지고 폭투가 늘어요`
                    : `${c.form} / 100 · 낮으면 구속·제구·타구 질이 떨어져요`}
                </dd>
              </dl>
            )}
            {TRAINING_GAMES[t.id] && (
              <span className="mg-tag">미니게임 · {TRAINING_GAMES[t.id].title}</span>
            )}
            <div>
              <b>{c.stage === "pro" ? t.gain.replace("+0~2", "+0~4") : t.gain}</b>
              <span>
                {t.cost > 0 ? `체력 −${t.cost}` : "체력 회복"}
                <ArrowUpRight size={15} />
              </span>
            </div>
          </button>
        ))}
      </div>
      <TrainingMinigame
        kind={game}
        name={trainings.find((t) => t.id === game)?.name ?? ""}
        onCancel={() => setGame(null)}
        onFinish={(q) => {
          const r = engine.train(game!, q);
          setGame(null);
          r.ok ? toast.success(r.message) : toast.error(r.message);
        }}
      />
      <div className="practice-row">
        <span>
          <Target size={16} /> 자율 연습 <small>행동력·XP 없이 조작 연습</small>
        </span>
        <button className="subtle-button" onClick={() => onPractice("bullpen")}>
          불펜 피칭
        </button>
        <button className="subtle-button" onClick={() => onPractice("batting")}>
          배팅 케이지
        </button>
      </div>
      <div className="section-intro shop-intro">
        <div>
          <h2>구종 상점</h2>
          <p>
            경기에서 모은 경험치로 새 구종을 익힙니다. 익힌 구종은 투구 플랜에서 바로 선택됩니다.
          </p>
        </div>
        <span className="season-stamp">
          보유 <b>{c.xp} XP</b>
        </span>
      </div>
      <div className="pitch-shop">
        {PITCHES.map((p) => {
          const owned = c.pitches.includes(p.id),
            m = pitchMovement(p.id, c.stats.movement);
          return (
            <article
              key={p.id}
              className={`shop-card ${owned ? "owned" : ""}`}
              style={{ "--pitch-color": p.color } as React.CSSProperties}
            >
              <div>
                <i />
                <strong>{p.name}</strong>
                <small>{p.en}</small>
              </div>
              <p>{p.desc}</p>
              <span className="shop-meta">
                {p.delta ? `포심보다 ${-p.delta} km/h 느림` : "가장 빠른 공"} · 휨{" "}
                {Math.round(Math.hypot(m.x, m.y) * 100)} cm
              </span>
              {pitchTraits(p).length > 0 && (
                <span className="shop-traits">
                  {pitchTraits(p).map((t) => (
                    <i key={t.text} className={t.good ? "good" : "bad"}>
                      {t.text}
                    </i>
                  ))}
                </span>
              )}
              <button
                className={owned ? "subtle-button" : "primary-button"}
                disabled={owned || c.xp < p.cost}
                onClick={() => {
                  const r = engine.buyPitch(p.id);
                  r.ok ? toast.success(r.message) : toast.error(r.message);
                }}
              >
                {owned ? (
                  <>
                    <Check size={15} /> 보유 중
                  </>
                ) : (
                  <>
                    {c.xp < p.cost ? <Lock size={15} /> : <ArrowUpRight size={15} />}
                    {p.cost} XP로 습득
                  </>
                )}
              </button>
            </article>
          );
        })}
        {HIDDEN_PITCHES.map((p) => {
          const owned = c.pitches.includes(p.id),
            m = pitchMovement(p.id, c.stats.movement);
          // Until unlocked the card shows nothing about the pitch or its condition.
          return owned ? (
            <article
              key={p.id}
              className="shop-card owned hidden"
              style={{ "--pitch-color": p.color } as React.CSSProperties}
            >
              <div>
                <i />
                <strong>{p.name}</strong>
                <small>{p.en}</small>
                <em className="hidden-badge">히든</em>
              </div>
              <p>{p.desc}</p>
              <span className="shop-meta">
                포심보다 {-p.delta} km/h 느림 · 흔들림 최대 {Math.round(m.flutter * 100)} cm
              </span>
              <span className="shop-traits">
                {pitchTraits(p).map((t) => (
                  <i key={t.text} className={t.good ? "good" : "bad"}>
                    {t.text}
                  </i>
                ))}
              </span>
              <button className="subtle-button" disabled>
                <Check size={15} /> 보유 중 · <kbd>{p.key}</kbd> 키
              </button>
            </article>
          ) : (
            <article
              key={p.id}
              className="shop-card hidden locked"
              style={{ "--pitch-color": "#c9a8ff" } as React.CSSProperties}
            >
              <div>
                <i />
                <strong>???</strong>
                <small>HIDDEN</small>
                <em className="hidden-badge">히든</em>
              </div>
              <p>정체를 알 수 없는 구종. 경험치로는 익힐 수 없습니다.</p>
              <span className="shop-meta">해금 조건 비공개</span>
              <button className="subtle-button" disabled>
                <Lock size={15} /> 어떤 조건을 만족하면 깨어납니다
              </button>
            </article>
          );
        })}
      </div>
      <div className="training-note">
        <BookOpen size={18} />
        <p>
          훈련·수업·휴식은 행동력을 1씩 씁니다. 미니게임 결과(아쉬움·좋음·완벽)에 따라 능력치가 0~2
          오르고, 바로 다음 투구와 타석부터 반영됩니다. 경기를 마치면 밤사이 체력이 25 회복되고
          행동력이 다시 {DAY_ACTIONS}이 됩니다.
        </p>
      </div>
      <CareerView engine={engine} s={s} />
    </section>
  );
}

const PRESETS: { name: string; desc: string; add: Career["stats"] }[] = [
  {
    name: "정통파 에이스",
    desc: "빠른 공과 체력으로 윽박지르는 투수",
    add: { velocity: 28, control: 14, movement: 14, stamina: 20, contact: 8, power: 8, speed: 8 },
  },
  {
    name: "기교파",
    desc: "제구와 변화로 타자를 요리하는 투수",
    add: { velocity: 8, control: 28, movement: 28, stamina: 14, contact: 8, power: 4, speed: 10 },
  },
  {
    name: "투타 겸업",
    desc: "마운드와 타석 모두에서 빛나는 선수",
    add: { velocity: 15, control: 14, movement: 14, stamina: 9, contact: 18, power: 18, speed: 12 },
  },
];
const statKeys = Object.keys(statNames) as (keyof Career["stats"])[];
/** First screen: choose a name and spread the starting stat points. */
function CreationDialog({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const needsTeam = !s.career.team;
  // New players: story → dream club → name & stats. Older saves only pick a club.
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState("");
  useEffect(() => {
    if (!s.career.created) {
      setStep(0);
      setTeam("");
    }
  }, [s.career.created]);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Career["stats"]>(() => {
    const p = PRESETS[0].add;
    return Object.fromEntries(statKeys.map((k) => [k, STAT_BASE + p[k]])) as Career["stats"];
  });
  const left = STAT_POINTS - statKeys.reduce((a, k) => a + stats[k] - STAT_BASE, 0);
  const bump = (k: keyof Career["stats"], d: number) =>
    setStats((st) => {
      const v = st[k] + d;
      if (v < STAT_BASE || v > STAT_CAP || (d > 0 && left < d)) return st;
      return { ...st, [k]: v };
    });
  return (
    <Dialog open={!s.career.created || needsTeam}>
      <DialogContent className="creation-dialog" showCloseButton={false}>
        {s.career.created || step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>꿈의 구단을 고르세요</DialogTitle>
              <DialogDescription>
                고른 구단의 스카우트가 이번 시즌 미산고의 모든 경기를 지켜봅니다. 스카우트 평가
                100점을 채우면 그 구단의 입단 제의를 받습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="team-grid">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  className={`team-card ${team === t.id ? "selected" : ""}`}
                  style={{ "--team-color": t.color } as React.CSSProperties}
                  onClick={() => setTeam(t.id)}
                >
                  <small>{t.city}</small>
                  <strong>{t.name}</strong>
                  <span>{t.motto}</span>
                </button>
              ))}
            </div>
            {teamOf(team) && (
              <p className="team-pick">
                <b>
                  {teamOf(team)!.city} {teamOf(team)!.name}
                </b>{" "}
                {teamOf(team)!.scout} 스카우트가 당신을 지켜보기로 했습니다.
              </p>
            )}
            <button
              className="primary-button"
              disabled={!team}
              onClick={() => {
                if (s.career.created) engine.chooseTeam(team);
                else setStep(2);
              }}
            >
              이 구단을 목표로 <ChevronRight size={16} />
            </button>
          </>
        ) : step === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>프롤로그</DialogTitle>
              <DialogDescription>고교 3학년, 마지막 가을.</DialogDescription>
            </DialogHeader>
            <div className="story">
              <p>
                열 살 때 아버지 손을 잡고 처음 간 프로야구 경기장. 조명탑 아래 마운드에 선 투수가
                공을 뿌리던 그 밤, 당신은 결심했다.{" "}
                <b>언젠가 저 유니폼을 입고 저 마운드에 서겠다.</b>
              </p>
              <p>
                그리고 지금, 미산고 야구부 3학년. 드래프트까지 남은 기회는 이번 시즌뿐이다. 매일
                아침 훈련으로 몸을 만들고, 오후에는 시즌 경기에서 스카우트 앞에 선다.
              </p>
              <p>
                관중석 어딘가에 꿈의 구단 스카우트가 앉아 있다. <b>평가 100점</b>을 채우면, 그
                구단이 당신의 이름을 부를 것이다.
              </p>
            </div>
            <button className="primary-button" onClick={() => setStep(1)}>
              꿈의 구단 고르기 <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>선수 등록</DialogTitle>
              <DialogDescription>
                {teamOf(team)?.name} 입단을 꿈꾸는 미산고 3학년 투수. 이름을 정하고 능력치{" "}
                {STAT_POINTS}
                포인트를 나눠 주세요. 각 능력은 {STAT_BASE}에서 시작해 최대 {STAT_CAP}까지 올릴 수
                있습니다.
              </DialogDescription>
            </DialogHeader>
            <label className="creation-name">
              선수 이름
              <input
                maxLength={12}
                value={name}
                placeholder="예: 김하늘"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="creation-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className="subtle-button"
                  onClick={() =>
                    setStats(
                      Object.fromEntries(
                        statKeys.map((k) => [k, STAT_BASE + p.add[k]]),
                      ) as Career["stats"],
                    )
                  }
                >
                  <strong>{p.name}</strong>
                  <small>{p.desc}</small>
                </button>
              ))}
            </div>
            <div className="creation-stats">
              {statKeys.map((k) => (
                <div key={k} className="creation-stat">
                  <span>
                    {statNames[k]}
                    <small>
                      {STAT_INFO[k].label} {statMetric(k, stats[k])}
                    </small>
                  </span>
                  <button aria-label={`${statNames[k]} 내리기`} onClick={() => bump(k, -5)}>
                    −
                  </button>
                  <b>{stats[k]}</b>
                  <button aria-label={`${statNames[k]} 올리기`} onClick={() => bump(k, 5)}>
                    +
                  </button>
                  <Progress value={((stats[k] - STAT_BASE) / (STAT_CAP - STAT_BASE)) * 100} />
                  <p>{STAT_INFO[k].what}</p>
                </div>
              ))}
            </div>
            <p className={`creation-left ${left === 0 ? "done" : ""}`}>
              남은 포인트 <b>{left}</b>
              {left > 0
                ? " · 모두 분배해야 등록할 수 있습니다"
                : !name.trim()
                  ? " · 선수 이름을 입력하면 등록할 수 있습니다"
                  : " · 준비 완료"}
            </p>
            <button
              className="primary-button"
              disabled={left !== 0 || !name.trim()}
              onClick={() => {
                engine.chooseTeam(team);
                const r = engine.createPlayer(name, stats);
                r.ok
                  ? toast.success(`${name.trim()}, ${teamOf(team)?.name}을 향한 시즌 시작!`)
                  : toast.error(r.message);
              }}
            >
              이 선수로 시즌 시작 <ChevronRight size={16} />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
/** Dream-club scout evaluation, optionally animating from a previous value. */
function ScoutMeter({
  s,
  before,
  after,
  big = false,
}: {
  s: GameState;
  before?: number;
  after?: number;
  big?: boolean;
}) {
  const pro = s.career.stage === "pro",
    t = teamOf(pro ? s.career.club : s.career.team),
    now = Math.round(after ?? s.career.scout),
    prev = before === undefined ? null : Math.round(before),
    gain = prev === null ? 0 : now - prev;
  if (!t) return null;
  return (
    <div
      className={`scout-meter ${big ? "big" : ""}`}
      style={{ "--team-color": t.color } as React.CSSProperties}
    >
      <div className="scout-meter-head">
        <span>
          <b>
            {t.city} {t.name}
          </b>{" "}
          {pro ? STAGES.pro.goal : `${t.scout} 스카우트 평가`}
        </span>
        <strong>
          {prev !== null && gain > 0 && <small>{prev} →</small>}
          {now}
          <em>/100</em>
          {gain > 0 && <i>+{gain}</i>}
        </strong>
      </div>
      <div className="scout-bar">
        {prev !== null && <span className="prev" style={{ width: `${prev}%` }} />}
        <span className="now" style={{ width: `${now}%` }} />
      </div>
      {now >= 100 ? (
        <small className="scout-note">
          {pro ? `${STAGES.pro.goalReward}!` : "입단 제의를 받았습니다!"}
        </small>
      ) : (
        <small className="scout-note">
          {pro ? STAGES.pro.goalReward : "입단 제의"}까지 {100 - now}점
        </small>
      )}
    </div>
  );
}
/** End of the day: a short recap before the next morning. */
/** Why the scout gauge and XP moved: one line per reason, adding up to the totals. */
function RecapBreakdown({
  scoutParts,
  xpParts,
  scoutLabel,
}: {
  scoutParts: RecapLine[];
  xpParts: RecapLine[];
  scoutLabel: string;
}) {
  const block = (title: string, lines: RecapLine[], unit: string) => {
    const total = lines.reduce((a, p) => a + p.value, 0);
    return (
      <section>
        <h4>
          {title}
          <b>
            {total >= 0 ? "+" : ""}
            {total}
            {unit}
          </b>
        </h4>
        <ul>
          {lines.map((p, i) => (
            <li key={i} className={p.value < 0 ? "minus" : ""}>
              <span>{p.label}</span>
              <b>
                {p.value >= 0 ? "+" : ""}
                {p.value}
              </b>
            </li>
          ))}
        </ul>
      </section>
    );
  };
  if (!scoutParts.length && !xpParts.length) return null;
  return (
    <div className="recap-breakdown">
      {scoutParts.length > 0 && block(scoutLabel, scoutParts, "")}
      {xpParts.length > 0 && block("경험치", xpParts, " XP")}
    </div>
  );
}
function NightDialog({
  s,
  recap,
  onClose,
}: {
  s: GameState;
  recap: {
    day: number;
    message: string;
    score: string;
    xp: number;
    scout: { before: number; after: number } | null;
    scoutParts: RecapLine[];
    xpParts: RecapLine[];
  } | null;
  onClose: () => void;
}) {
  const t = teamOf(s.career.team),
    dream =
      s.career.stage !== "pro" &&
      !!recap?.scout &&
      recap.scout.before < 100 &&
      recap.scout.after >= 100;
  if (dream && t)
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="dream-dialog"
          style={{ "--team-color": t.color } as React.CSSProperties}
        >
          <DialogHeader>
            <DialogTitle>
              <Trophy size={20} /> {t.city} {t.name} 입단 제의!
            </DialogTitle>
            <DialogDescription>DAY {recap?.day}, 경기가 끝난 뒤 더그아웃 앞.</DialogDescription>
          </DialogHeader>
          <div className="story">
            <p>
              시즌 내내 관중석을 지키던 {t.scout} 스카우트가 다가와 손을 내밀었다. &ldquo;
              {s.career.name} 선수, 우리 {t.name}에서 함께 던져 보지 않겠나?&rdquo;
            </p>
            <p>
              열 살 때 꿈꿨던 그 유니폼.{" "}
              <b>
                {t.city} {t.name}
              </b>
              의 이름이 드디어 당신을 불렀다.
            </p>
          </div>
          <ScoutMeter s={s} before={recap!.scout!.before} after={recap!.scout!.after} big />
          <button className="primary-button" onClick={onClose}>
            입단식으로 <ChevronRight size={16} />
          </button>
        </DialogContent>
      </Dialog>
    );
  return (
    <Dialog open={!!recap} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="night-dialog">
        <DialogHeader>
          <DialogTitle>
            <Moon size={18} /> DAY {recap?.day}, 하루가 저물었다
          </DialogTitle>
          <DialogDescription>
            기숙사 불이 꺼지고, 오늘의 경기가 머릿속에서 다시 재생된다.
          </DialogDescription>
        </DialogHeader>
        {recap?.scout && (
          <ScoutMeter s={s} before={recap.scout.before} after={recap.scout.after} big />
        )}
        {recap && (
          <RecapBreakdown
            scoutParts={recap.scoutParts}
            xpParts={recap.xpParts}
            scoutLabel={s.career.stage === "pro" ? STAGES.pro.goal : "스카우트 평가"}
          />
        )}
        <div className="night-recap">
          <div>
            <span>오늘의 경기</span>
            <strong>{recap?.message}</strong>
            <small>{recap?.score}</small>
          </div>
          <div>
            <span>획득 경험치</span>
            <strong>+{recap?.xp} XP</strong>
            <small>보유 {s.career.xp} XP</small>
          </div>
          <div>
            <span>밤사이 회복</span>
            <strong>체력 {Math.round(s.career.energy)}</strong>
            <small>행동력 {DAY_ACTIONS} 충전</small>
          </div>
        </div>
        <button className="primary-button" onClick={onClose}>
          DAY {s.career.day} 아침 맞이하기 <ChevronRight size={16} />
        </button>
      </DialogContent>
    </Dialog>
  );
}
/**
 * Signing ending: shown once the dream club's contract is in hand and before pro mode opens.
 * It cannot be skipped by clicking outside; the button moves the same player to the pros.
 */
function EndingDialog({
  engine,
  s,
  blocked,
  onPro,
}: {
  engine: BaseballEngine;
  s: GameState;
  blocked: boolean;
  onPro: () => void;
}) {
  const c = s.career,
    t = teamOf(c.club);
  if (!t || c.proUnlocked || blocked) return null;
  return (
    <Dialog open>
      <DialogContent
        className="dream-dialog ending-dialog"
        style={{ "--team-color": t.color } as React.CSSProperties}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <Trophy size={20} /> {t.city} {t.name} 입단식
          </DialogTitle>
          <DialogDescription>고교 3학년의 마지막 시즌, 그 끝에서.</DialogDescription>
        </DialogHeader>
        <div className="story">
          <p>
            미산고 마운드에서 던진 공 하나하나가 결국 여기까지 왔다. 새벽 러닝, 불펜의 땀, 관중석의
            {` ${t.scout}`} 스카우트를 의식하며 던진 승부구들.
          </p>
          <p>
            입단식 날, {josa(c.name, "은는")} {t.name}의 유니폼을 받아 들었다. 등번호 18. &ldquo;
            {t.motto}.&rdquo; 구단의 슬로건이 가슴에 새겨진다.
          </p>
          <p>
            <b>
              고교 무대를 넘어 {t.city} {t.name}에 입단했다. 이제 프로 무대에서 뛰게 되었다.
            </b>
          </p>
        </div>
        <div className="night-recap">
          <div>
            <span>고교 통산</span>
            <strong>
              {c.games}경기 {c.wins}승
            </strong>
            <small>
              탈삼진 {c.strikeouts} · 안타 {c.hits}
            </small>
          </div>
          <div>
            <span>프로 모드 해금</span>
            <strong>난이도 상승</strong>
            <small>더 빠른 공 · 더 끈질긴 타자 · 더 빠른 수비</small>
          </div>
          <div>
            <span>새 목표</span>
            <strong>{STAGES.pro.goal} 100</strong>
            <small>{STAGES.pro.goalReward}</small>
          </div>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            if (engine.enterPro()) {
              toast.success(`${t.name} 소속 프로 선수로 첫날을 맞았습니다`);
              onPro();
            } else toast.error("진행 중인 경기를 먼저 마쳐 주세요.");
          }}
        >
          프로 무대로 <ChevronRight size={16} />
        </button>
      </DialogContent>
    </Dialog>
  );
}
const CONFETTI_COLORS = ["#e8b65a", "#f4d48c", "#85bde4", "#c9a8ff", "#8bceb6", "#e58f7a", "#fff"];
/** Falling paper confetti over the whole screen (pure CSS, clicks pass through). */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 220,
        spin: 360 + Math.random() * 900,
        size: 6 + Math.random() * 7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return createPortal(
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.45,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}
/**
 * Fanfare for a secret condition: a hidden pitch (e.g. the knuckleball) or the legend start.
 * The conditions themselves are never shown.
 */
function HiddenDialog({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const legend = s.hiddenUnlock === "legend",
    p = s.hiddenUnlock && !legend ? ALL_PITCHES.find((x) => x.id === s.hiddenUnlock) : null;
  // Wait until creation and the starting roulette are out of the way.
  const open = (legend || !!p) && s.career.created && !!s.career.team && s.career.blessing !== "";
  useEffect(() => {
    if (open) engine.fanfare();
  }, [open, engine]);
  if (!open) return null;
  return (
    <>
      <Confetti />
      <Dialog open onOpenChange={(v) => !v && engine.clearHiddenUnlock()}>
        <DialogContent className="hidden-pitch-dialog">
          <DialogHeader>
            <DialogTitle>
              <Sparkles size={18} /> 히든 조건을 만족했습니다!
            </DialogTitle>
            <DialogDescription>
              {legend
                ? "그 이름을 듣는 순간, 모두가 숨을 멈췄습니다."
                : "아무도 가르쳐 주지 않은 공이 손끝에서 깨어났습니다."}
            </DialogDescription>
          </DialogHeader>
          {legend ? (
            <div
              className="hidden-pitch-card legend"
              style={{ "--pitch-color": "#e8b65a" } as React.CSSProperties}
            >
              <small>??? · TWO-WAY LEGEND</small>
              <strong>이도류 전설</strong>
              <p>
                모든 능력치 {STAGES.pro.statCap} · 직구 최고{" "}
                {Math.round(fastballSpeed(STAGES.pro.statCap))} km/h
              </p>
              <ul>
                {LEGEND_PITCHES.map((id) => {
                  const x = ALL_PITCHES.find((x) => x.id === id)!;
                  return (
                    <li key={id} className="good">
                      {x.name}
                    </li>
                  );
                })}
              </ul>
              <span>고교 무대에서도 능력치 상한 {STAGES.pro.statCap}</span>
            </div>
          ) : (
            p && (
              <div
                className="hidden-pitch-card"
                style={{ "--pitch-color": p.color } as React.CSSProperties}
              >
                <small>HIDDEN PITCH · {p.en}</small>
                <strong>{p.name}</strong>
                <p>{p.desc}</p>
                <ul>
                  {pitchTraits(p).map((t) => (
                    <li key={t.text} className={t.good ? "good" : "bad"}>
                      {t.text}
                    </li>
                  ))}
                </ul>
                <span>
                  투구 플랜에서 <kbd>{p.key}</kbd> 키로 선택
                </span>
              </div>
            )
          )}
          <button className="primary-button" onClick={() => engine.clearHiddenUnlock()}>
            받아들이기 <Play size={16} />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
/** Starting roulette: "a blessing from the baseball gods" grants one random pitch. */
function BlessingDialog({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [reel, setReel] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const won = ALL_PITCHES.find((p) => p.id === s.career.blessing);
  const tier = BLESSINGS.find((b) => b.id === s.career.blessing)?.tier;
  const open =
    (s.career.created && !!s.career.team && s.career.blessing === "") || phase !== "idle";
  const CARD = 128;
  const spin = () => {
    const id = engine.receiveBlessing();
    if (!id) return;
    // A long reel of random pitches that stops on the granted one.
    const items = Array.from({ length: 34 }, () => {
      // The reel shows pitches as often as they can actually come up.
      let r = Math.random() * BLESSINGS.reduce((a, b) => a + b.weight, 0);
      return (BLESSINGS.find((b) => (r -= b.weight) < 0) ?? BLESSINGS[0]).id as string;
    });
    items[30] = id;
    setReel(items);
    setOffset(0);
    setPhase("spinning");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setOffset(30 * CARD + (Math.random() - 0.5) * CARD * 0.5)),
    );
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && phase === "done") setPhase("idle");
      }}
    >
      <DialogContent className="blessing-dialog" showCloseButton={phase === "done"}>
        <DialogHeader>
          <DialogTitle>
            <Sparkles size={18} /> 야구의 신이 내리는 은총
          </DialogTitle>
          <DialogDescription>
            고교 마지막 시즌의 첫날. 마운드에 선 당신에게 신이 구종 하나를 선물합니다. 포심·슬라이더
            말고 여덟 구종 가운데 무엇이 손끝에 깃들지는 하늘만이 압니다.
          </DialogDescription>
        </DialogHeader>
        <div className={`blessing-reel ${phase}`}>
          <div
            className="reel-strip"
            style={{
              transform: `translateX(calc(50% - ${CARD / 2}px - ${offset}px))`,
              transition:
                phase === "spinning" && offset
                  ? "transform 4.2s cubic-bezier(.08,.7,.12,1)"
                  : "none",
            }}
            onTransitionEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              setOffset(30 * CARD);
              setPhase("done");
            }}
          >
            {(reel.length ? reel : BLESSINGS.map((b) => b.id)).map((id, i) => {
              const p = ALL_PITCHES.find((p) => p.id === id)!;
              const b = BLESSINGS.find((b) => b.id === id)!;
              return (
                <div
                  key={i}
                  className={`reel-card tier-${b.tier} ${phase === "done" && i === 30 ? "winner" : ""}`}
                  style={{ "--pitch-color": p.color, width: CARD } as React.CSSProperties}
                >
                  <small>{b.tier}</small>
                  <strong>{p.name}</strong>
                  <span>{p.en}</span>
                </div>
              );
            })}
          </div>
          <i className="reel-pointer" />
        </div>
        {phase === "done" && won ? (
          <div className="blessing-result">
            <span className={`tier-badge tier-${tier}`}>{tier}</span>
            <h3>{josa(won.name, "이가")} 손끝에 깃들었다</h3>
            <p>{won.desc} · 포심·슬라이더와 함께 바로 던질 수 있습니다.</p>
            <button className="primary-button" onClick={() => setPhase("idle")}>
              은총을 받고 훈련 시작 <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="blessing-result">
            <div className="blessing-odds">
              {[...new Set(BLESSINGS.map((b) => b.tier))].map((tier) => {
                const list = BLESSINGS.filter((b) => b.tier === tier);
                return (
                  <div key={tier} className={`odds-tier tier-${tier}`}>
                    <b>
                      {tier} {list.reduce((a, b) => a + b.weight, 0)}%
                    </b>
                    {list.map((b) => (
                      <span key={b.id}>
                        {ALL_PITCHES.find((p) => p.id === b.id)!.name} <em>{b.weight}%</em>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
            <button className="primary-button" disabled={phase === "spinning"} onClick={spin}>
              <Sparkles size={16} />
              {phase === "spinning" ? "신의 뜻을 기다리는 중…" : "기도하고 룰렛 돌리기"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const TUTORIAL_KEY = "diamond-road-tutorial-v2";
type TourTrack = "life" | "pitch" | "bat";
type TourStep = {
  title: string;
  body: string;
  /** CSS selector of the thing being explained; it gets a gold outline. */
  target?: string;
  /** Action steps move on by themselves once the player does it. */
  wait?: "pitch" | "throw" | "result";
};
/**
 * Three short tours: the daily screen (training), and the first inning of the first match from
 * the mound and from the batter's box. Reading steps pause the game; P turns the tutorial off.
 */
const TOURS: Record<TourTrack, TourStep[]> = {
  life: [
    {
      title: "하루는 아침 → 오후 → 밤",
      body: "아침에는 행동력 5로 훈련·수업·휴식을 하고, 오후에는 시즌 경기를 한 번 치러요. 경기가 끝나면 밤이 지나 다음 날이 됩니다. 오른쪽 '경기장으로 향하기'를 누르면 남은 행동력은 사라져요.",
      target: ".life-timeline",
    },
    {
      title: "목표: 꿈의 구단 스카우트 평가 100",
      body: "고른 구단의 스카우트가 모든 시즌 경기를 지켜봐요. 경기가 끝날 때마다 탈삼진·안타·승리에 따라 평가가 오르고, 100이 되면 입단 제의를 받아 프로 무대로 갑니다.",
      target: ".scout-meter",
    },
    {
      title: "체력 · 컨디션 · 경험치",
      body: "체력은 훈련과 투구로 줄고, 낮으면 구속과 제구가 떨어지고 폭투가 늘어요. 컨디션은 수업·휴식으로 오르며 공과 타구의 질에 영향을 줘요. 경험치(XP)는 경기에서 모아 새 구종을 사는 데 씁니다.",
      target: ".condition-bar",
    },
    {
      title: "내 능력치와 효과",
      body: "7가지 능력치가 실제로 무엇을 바꾸는지 숫자로 보여 줘요. 예를 들어 구속 64면 전력 포심이 몇 km/h인지 나옵니다. 고교 때는 100까지, 프로에 가면 200까지 오를 수 있어요.",
      target: ".stat-guide",
    },
    {
      title: "훈련 카드",
      body: "카드를 누르면 미니게임 설명이 먼저 나오고, 결과(아쉬움·좋음·완벽)에 따라 능력치가 0~2 올라요. 훈련 하나에 행동력 1과 카드에 적힌 체력이 들어요. 카드 안 상자에는 지금 능력치와 효과가 보입니다.",
      target: ".training-grid",
    },
    {
      title: "쉬는 것도 실력",
      body: "체력이 모자라면 훈련 카드가 눌리지 않아요. '충분한 휴식'은 체력과 컨디션을 회복하고, '수업·영상 분석'은 퀴즈로 컨디션을 올려요.",
      target: ".rest-card",
    },
    {
      title: "자율 연습",
      body: "불펜(투구)과 배팅 케이지(타격)는 행동력과 경험치 없이 조작만 연습하는 곳이에요. 경기 전에 손을 풀기 좋아요.",
      target: ".practice-row",
    },
    {
      title: "구종 상점",
      body: "경기에서 모은 경험치로 새 구종을 익혀요. 카드의 태그는 그 공의 장점(헛스윙 유도 등)과 단점(제구 어려움 등)이에요. 익힌 구종은 투구 플랜에서 바로 고를 수 있습니다.",
      target: ".pitch-shop",
    },
    {
      title: "이제 경기장으로",
      body: "훈련을 마쳤으면 '경기장으로 향하기'를 누르세요. 첫 경기의 1회는 튜토리얼 이닝이라 투구와 타격을 하나씩 안내해 드려요. 튜토리얼은 언제든 P로 끌 수 있어요.",
      target: ".life-cta",
    },
  ],
  pitch: [
    {
      title: "튜토리얼 이닝 · 마운드에 섰어요",
      body: "1회 초, 우리는 수비이고 당신은 투수입니다. 오른쪽 '투구 플랜'을 위에서부터 따라가면 한 구를 던질 수 있어요. 읽는 동안 경기는 멈춰 있어요.",
      target: ".pitch-panel",
    },
    {
      title: "상대 타자",
      body: "지금 타석의 상대 선수예요. 좌타·우타와 컨택(맞히기)·파워(멀리 치기)·선구(볼 고르기)·주력이 학교마다, 선수마다 정해져 있어요. 선구가 높은 타자에게는 볼이 잘 안 통해요.",
      target: ".pp-rival",
    },
    {
      title: "① 구종 고르기",
      body: "숫자키나 버튼으로 구종을 고르세요. 버튼의 km/h는 지금 강도로 던졌을 때의 구속이에요. 다른 구종을 하나 골라 보세요.",
      target: ".pp-pitches",
      wait: "pitch",
    },
    {
      title: "구종의 움직임",
      body: "고른 구종이 어느 방향으로 얼마나 휘는지 cm로 알려 줘요. 조준판의 색 영역도 같은 휨이에요. 휨은 '구위' 능력치가 높을수록 커집니다.",
      target: ".pp-desc",
    },
    {
      title: "② 투구 강도",
      body: "왼쪽으로 내리면 느리지만 정확하고, 오른쪽으로 올리면 빠르지만 덜 정확하고 체력도 더 들어요. 결정구는 세게, 볼카운트가 불리하면 정확하게.",
      target: "[data-tour=effort]",
    },
    {
      title: "③ 목표 지점과 제구 오차",
      body: "조준판(또는 3D 화면의 스트라이크 존)에서 공을 보낼 곳을 고르세요. 공은 노린 곳에서 '제구 오차'만큼 벗어나요. 존 모서리를 노리면 치기 어렵지만 볼이 되기 쉬워요.",
      target: ".aim-pad",
    },
    {
      title: "직접 던져 보기",
      body: "조준판(또는 3D 화면의 스트라이크 존)에서 노릴 곳을 클릭하면 바로 던져요. 마우스를 올려 둔 채 Space를 눌러도 돼요. 지금 한 구를 던져 보세요!",
      target: ".aim-pad",
      wait: "throw",
    },
    {
      title: "판정 확인",
      body: "볼·스트라이크·파울·타구 결과가 화면 가운데와 아래 '직전 플레이'에 나와요. 판정이 나오면 다음으로 넘어가요.",
      target: ".field-bottom",
      wait: "result",
    },
    {
      title: "볼카운트와 점수판",
      body: "B(볼) 4개면 볼넷, S(스트라이크) 3개면 삼진, O(아웃) 3개면 공수 교대예요. 2스트라이크 뒤의 파울은 카운트가 늘지 않아요. 몸에 맞으면 사구로 1루에 보내요.",
      target: ".scoreboard",
    },
    {
      title: "투수 체력",
      body: "공을 던질수록 체력이 줄고, 낮아지면 구속·제구가 떨어지고 폭투가 잦아져요. 아래 줄에 지금 제구 오차(±cm)와 체력 때문에 떨어진 구속이 보여요. 체력은 '지구력' 능력치가 높을수록 천천히 줄어요.",
      target: ".pp-stamina",
    },
    {
      title: "고의4구 · 견제 · 초기화",
      body: "'고의4구'는 타자를 바로 1루에 보내요. 주자가 있으면 '견제' 버튼이나 F로 견제구를 던져 리드한 주자를 잡을 수 있어요(같은 타자에게 계속 던지면 주자가 조심해요). 연습에서는 R로 공을 초기화해요.",
      target: ".pp-actions",
    },
    {
      title: "타구가 나오면",
      body: "수비수가 자동으로 공을 쫓아 잡고, 주자와 공 중 누가 먼저 베이스에 닿는지로 아웃·세이프가 정해져요. 뜬공이 잡히면 주자는 원래 베이스로 돌아가야 해요. 설정에서 자동 수비를 끄면 WASD로 직접 움직이고 1~4로 송구할 베이스를 골라요.",
      target: ".game-stage",
    },
    {
      title: "카메라",
      body: "투수·포수·중계·타구·탑뷰 카메라를 숫자 버튼이나 C로 바꿀 수 있어요. 타구가 나오면 자동으로 타구 카메라로 바뀌어요(설정에서 끌 수 있어요). 이제 이닝을 마무리해 보세요!",
      target: ".camera-row",
    },
  ],
  bat: [
    {
      title: "튜토리얼 이닝 · 공격 차례",
      body: "1회 말, 이제 우리가 칩니다. 당신은 1번 타자이고, 2~9번은 미산고 동료가 자기 컨택·파워·주력으로 타석에 서요. 스윙은 모든 타석을 당신이 직접 조작해요. 오른쪽에 상대 학교 에이스의 구속·제구·구종 수가 나와요.",
      target: ".pitch-panel",
    },
    {
      title: "스윙 종류",
      body: "컨택: 넓게 맞히고, 아슬아슬하게 빗나가면 파울로 버텨요. 강타: 범위가 아주 좁지만 맞으면 멀리 날아가요. 번트: 짧게 굴려 주자를 보내요(2스트라이크 번트 파울은 삼진).",
      target: ".pp-swings",
    },
    {
      title: "조준: 흐릿한 빛과 노란 원",
      body: "상대가 던지면 화면에 흐릿한 빛이 생겨요. 공은 반드시 그 안으로 와요. 마우스를 움직이면 노란 원(배트가 닿는 범위)이 따라와요. 공이 지나갈 곳에 원을 겹치세요. 타석에 선 타자의 컨택이 높을수록 빛은 작고 원은 커져요.",
      target: ".game-stage",
    },
    {
      title: "타이밍 게이지",
      body: "투구가 시작되면 화면 위에 얇은 게이지가 나와요. 흐린 금색은 맞힐 수 있는 구간, 밝은 금색은 좋은 타이밍이에요. 그때 클릭하거나 Space를 누르세요. 치지 않고 기다리면 볼을 골라낼 수 있어요.",
      target: ".game-stage",
    },
    {
      title: "결과 피드백",
      body: "스윙 뒤에는 타이밍이 빨랐는지 늦었는지, 조준이 몇 cm 빗나갔는지가 여기에 나와요. 다음 공에 바로 고쳐 보세요.",
      target: ".pp-desc",
    },
    {
      title: "도루 사인",
      body: "1루에 주자가 있고 2루가 비어 있으면 E 또는 이 버튼으로 도루 사인을 내요. 다음 투구와 함께 주자가 뛰고, 포수 송구와 누가 먼저 2루에 닿는지로 판정해요. 발이 빠른 주자일수록 유리해요.",
      target: ".steal-button",
    },
    {
      title: "직접 쳐 보기",
      body: "이제 상대 투수가 던집니다. 빛을 보고 원을 맞추고, 밝은 금색 구간에서 클릭! 공 하나의 결과가 나오면 튜토리얼이 끝나요.",
      target: ".game-stage",
      wait: "result",
    },
  ],
};
function TutorialCoach({
  track,
  step,
  onNext,
  onSkip,
}: {
  track: TourTrack;
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const steps = TOURS[track],
    t = steps[step];
  // Spotlight: the page is dimmed except for the element being explained. Its box is tracked
  // every frame so the hole follows scrolling, layout changes and smooth scrolls.
  const [spot, setSpot] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!t?.target) {
      setSpot(null);
      return;
    }
    let raf = 0,
      el: Element | null = document.querySelector(t.target);
    // Jump (not glide) so the hole is right even on slow machines.
    el?.scrollIntoView({ block: track === "life" ? "center" : "nearest" });
    const pad = 6,
      measure = () => {
        if (!el?.isConnected) el = document.querySelector(t.target!);
        const r = el?.getBoundingClientRect();
        setSpot((prev) => {
          if (!r || r.width === 0) return null;
          const next = {
            x: r.left - pad,
            y: r.top - pad,
            w: r.width + pad * 2,
            h: r.height + pad * 2,
          };
          return prev &&
            Math.abs(prev.x - next.x) < 0.5 &&
            Math.abs(prev.y - next.y) < 0.5 &&
            Math.abs(prev.w - next.w) < 0.5 &&
            Math.abs(prev.h - next.h) < 0.5
            ? prev
            : next;
        });
      },
      loop = () => {
        measure();
        raf = requestAnimationFrame(loop);
      };
    loop();
    // Scrolling and resizing re-measure at once, without waiting for the next frame.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [t, track]);
  if (!t) return null;
  const last = step === steps.length - 1;
  // Card position: bottom-left as usual; if that would cover the highlight, sit right above or
  // below it (then beside it, then a corner). Always left/top so it slides instead of jumping.
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth,
    vh = typeof window === "undefined" ? 800 : window.innerHeight,
    cw = Math.min(400, vw - 40),
    ch = 240,
    gap = 14,
    fit = (x: number, y: number) => ({
      left: clamp(x, 20, vw - cw - 20),
      top: clamp(y, 20, vh - ch - 20),
    }),
    clear = (p: { left: number; top: number }) =>
      !spot ||
      p.left + cw < spot.x ||
      spot.x + spot.w < p.left ||
      p.top + ch < spot.y ||
      spot.y + spot.h < p.top,
    candidates = [
      fit(20, vh - ch - 20),
      ...(spot
        ? [
            fit(spot.x, spot.y - ch - gap),
            fit(spot.x, spot.y + spot.h + gap),
            fit(spot.x + spot.w + gap, spot.y),
            fit(spot.x - cw - gap, spot.y),
          ]
        : []),
      fit(vw - cw - 20, vh - ch - 20),
      fit(vw - cw - 20, 20),
      fit(20, 20),
    ],
    corner: React.CSSProperties = candidates.find(clear) ?? candidates[0];
  return createPortal(
    <>
      {spot && (
        <div
          className="tutorial-spot"
          aria-hidden="true"
          style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
        />
      )}
      <aside className="tutorial-coach floating" style={corner} aria-label="튜토리얼">
        <div className="tutorial-head">
          <span>
            {track === "life"
              ? "하루 일정 안내"
              : track === "pitch"
                ? "튜토리얼 이닝 · 투수"
                : "튜토리얼 이닝 · 타자"}
          </span>
          <span>
            {step + 1} / {steps.length}
          </span>
        </div>
        <div className="tutorial-progress" aria-hidden="true">
          {steps.map((_, i) => (
            <i key={i} className={i <= step ? "on" : ""} />
          ))}
        </div>
        <h3>{t.title}</h3>
        <p>{t.body}</p>
        <div className="tutorial-actions">
          <button className="subtle-button" onClick={onSkip}>
            튜토리얼 끄기 <kbd>P</kbd>
          </button>
          {t.wait ? (
            <span className="tutorial-wait">
              {t.wait === "pitch"
                ? "구종을 고르면 다음으로"
                : t.wait === "throw"
                  ? "공을 던지면 다음으로"
                  : "결과가 나오면 다음으로"}
            </span>
          ) : (
            <button className="primary-button" onClick={onNext}>
              {last ? "알겠어요" : "다음"} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
/** Developer-mode password (a simple lock for testers, not real security). */
const DEV_CODE = "1324";
export default function DiamondGame() {
  const [engine] = useState(() => new BaseballEngine());
  // Development only: lets browser tests drive the engine. Stripped from production builds.
  if (import.meta.env.DEV) (window as unknown as { __engine?: BaseballEngine }).__engine = engine;
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [view, setView] = useState<"life" | "game">("life"),
    [recap, setRecap] = useState<{
      day: number;
      message: string;
      score: string;
      xp: number;
      scout: { before: number; after: number } | null;
      scoutParts: RecapLine[];
      xpParts: RecapLine[];
    } | null>(null),
    [help, setHelp] = useState(false),
    [settings, setSettings] = useState(false),
    [devUnlocked, setDevUnlocked] = useState(false),
    [devCode, setDevCode] = useState(""),
    [manualPause, setManualPause] = useState(false),
    [pending, setPending] = useState<Mode | null>(null),
    [tour, setTour] = useState<{ track: TourTrack; step: number } | null>(null);
  // Which tours are finished (stored per browser; separate from the career save).
  const readTours = (): Record<TourTrack, boolean> => {
    try {
      const v = JSON.parse(localStorage.getItem(TUTORIAL_KEY) ?? "{}");
      return { life: !!v.life, pitch: !!v.pitch, bat: !!v.bat };
    } catch {
      return { life: true, pitch: true, bat: true };
    }
  };
  const saveTours = (v: Record<TourTrack, boolean>) => {
    try {
      localStorage.setItem(TUTORIAL_KEY, JSON.stringify(v));
    } catch {}
  };
  const finishTour = (track: TourTrack) => {
    saveTours({ ...readTours(), [track]: true });
    setTour(null);
  };
  /** P: the whole tutorial off (all three tours). */
  const endTutorial = () => {
    saveTours({ life: true, pitch: true, bat: true });
    setTour(null);
  };
  const stage = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const [innings, setInnings] = useState(3);
  const batting = engine.batting;
  const newGame = (mode: Mode) => {
    if (engine.matchActive) {
      setPending(mode);
      return;
    }
    engine.start(mode, innings);
    setManualPause(false);
  };
  useEffect(() => {
    engine.load();
    engine.onSound((kind) => {
      try {
        const a = audio.current ?? (audio.current = new AudioContext());
        if (a.state === "suspended") void a.resume();
        if (kind === "fanfare") {
          // Short brass-like arpeggio, then a held major chord.
          const notes: [number, number, number][] = [
            [523.25, 0, 0.14],
            [659.25, 0.14, 0.14],
            [783.99, 0.28, 0.14],
            [1046.5, 0.42, 0.5],
            [523.25, 0.95, 0.9],
            [659.25, 0.95, 0.9],
            [783.99, 0.95, 0.9],
            [1046.5, 0.95, 0.9],
          ];
          for (const [f, at, len] of notes) {
            const o = a.createOscillator(),
              g = a.createGain(),
              t = a.currentTime + at;
            o.type = "sawtooth";
            o.frequency.setValueAtTime(f, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.035, t + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, t + len);
            o.connect(g);
            g.connect(a.destination);
            o.start(t);
            o.stop(t + len + 0.05);
          }
          return;
        }
        const osc = a.createOscillator(),
          gain = a.createGain();
        osc.type = kind === "hit" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(
          kind === "hit" ? 550 : kind === "swing" ? 200 : 760,
          a.currentTime,
        );
        osc.frequency.exponentialRampToValueAtTime(90, a.currentTime + 0.13);
        gain.gain.setValueAtTime(0.05, a.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.17);
        osc.connect(gain);
        gain.connect(a.destination);
        osc.start();
        osc.stop(a.currentTime + 0.18);
      } catch {}
    });
    return () => {
      void audio.current?.close();
    };
  }, [engine]);
  // Start each tour the first time its moment comes: the daily screen once the player exists,
  // the mound and the batter's box in the first inning of a season match.
  useEffect(() => {
    if (tour || !s.career.created || !s.career.team || s.career.blessing === "") return;
    const done = readTours();
    if (view === "life" && !done.life) setTour({ track: "life", step: 0 });
    else if (view === "game" && s.mode === "match" && s.inning === 1 && s.phase !== "finished") {
      if (!engine.batting && !done.pitch && s.phase === "ready")
        setTour({ track: "pitch", step: 0 });
      else if (engine.batting && !done.bat && (s.phase === "ready" || s.phase === "between"))
        setTour({ track: "bat", step: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view,
    s.mode,
    s.inning,
    s.half,
    s.phase,
    s.career.created,
    s.career.team,
    s.career.blessing,
    tour,
  ]);
  useEffect(() => {
    if (view !== "life" && tour?.track === "life") finishTour("life");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  // Action steps move on when the player does the thing.
  const tourStart = useRef({ selected: s.selected, sawPitch: false });
  useEffect(() => {
    tourStart.current = { selected: s.selected, sawPitch: false };
    // Only when a new step begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour?.track, tour?.step]);
  useEffect(() => {
    if (!tour) return;
    const t = TOURS[tour.track][tour.step],
      next = () =>
        tour.step >= TOURS[tour.track].length - 1
          ? finishTour(tour.track)
          : setTour({ ...tour, step: tour.step + 1 });
    if (s.phase === "windup" || s.phase === "flight") tourStart.current.sawPitch = true;
    if (t?.wait === "pitch" && s.selected !== tourStart.current.selected) next();
    else if (t?.wait === "throw" && (s.phase === "windup" || s.phase === "flight")) next();
    else if (
      t?.wait === "result" &&
      tourStart.current.sawPitch &&
      ["result", "between", "finished"].includes(s.phase)
    )
      next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, s.selected, s.phase]);
  // Reading a step in a match pauses the game; action steps let it run.
  const tourPause = !!tour && tour.track !== "life" && !TOURS[tour.track][tour.step]?.wait;
  useEffect(() => {
    engine.set(
      "paused",
      view !== "game" || help || settings || !!pending || manualPause || tourPause,
    );
  }, [view, help, settings, pending, manualPause, engine, tourPause]);
  const tutorialRef = useRef(tour);
  tutorialRef.current = tour;
  // On the daily screen the game's key handler is off, so P is caught here.
  useEffect(() => {
    if (view !== "life" || !tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyP" && !(e.target as HTMLElement)?.closest?.("input,textarea"))
        endTutorial();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tour]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        view !== "game" ||
        help ||
        settings ||
        pending ||
        target?.closest?.("input,textarea,[role=combobox]")
      )
        return;
      const k = keyOf(e);
      // A focused slider (투구 강도) keeps its arrow keys; every other shortcut still works.
      if (target?.closest?.("[role=slider]") && k.startsWith("arrow")) return;
      engine.keys.add(k);
      if (e.repeat) return;
      // During the tutorial P skips it; otherwise P / Esc pause the game.
      if (k === "p" && tutorialRef.current !== null) {
        endTutorial();
        return;
      }
      if (k === "p" || k === "escape") {
        setManualPause((v) => !v);
        return;
      }
      if (engine.state.paused) return;
      if (engine.state.phase === "inplay" && engine.state.live) {
        if (["1", "2", "3", "4"].includes(k)) engine.selectThrowBase(Number(k));
      } else {
        const p = ALL_PITCHES.find((p) => p.key === k);
        if (p) engine.selectPitch(p.id);
      }
      if (k === " " && !target?.closest?.("button,[role=button],[role=slider]")) {
        e.preventDefault();
        engine.batting ? engine.swing() : engine.throwAt();
      }
      if (k === "c") {
        const i = cameras.findIndex((c) => c.id === engine.state.camera);
        engine.set("camera", cameras[(i + 1) % 5].id);
      }
      if (k === "r") engine.resetPitch();
      if (k === "e") engine.steal();
      // F: pickoff throw to the lowest occupied base.
      if (k === "f") engine.pickoff(engine.state.bases.findIndex(Boolean) + 1);
      if (k.startsWith("arrow")) {
        e.preventDefault();
        const a = engine.state.aim,
          side = engine.batting ? -1 : 1;
        engine.setAim(
          a.x + side * (k === "arrowright" ? 0.04 : k === "arrowleft" ? -0.04 : 0),
          a.y + (k === "arrowup" ? 0.04 : k === "arrowdown" ? -0.04 : 0),
        );
        engine.emit();
      }
    };
    const up = (e: KeyboardEvent) => engine.keys.delete(keyOf(e));
    const blur = () => {
      engine.keys.clear();
      setManualPause(true);
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [engine, view, help, settings, pending]);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => unknown };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const abort = new AbortController();
    const tools: Tool[] = [
      {
        name: "read_baseball_state",
        description: "현재 경기의 이닝, 카운트, 점수, 조작 가능 상태와 선수 기록 조회",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => ({
          phase: engine.state.phase,
          mode: engine.state.mode,
          paused: engine.state.paused,
          inning: engine.state.inning,
          half: engine.state.half,
          score: engine.state.score,
          balls: engine.state.balls,
          strikes: engine.state.strikes,
          outs: engine.state.outs,
          bases: engine.state.bases,
          pitch: engine.state.selected,
          lastResult: engine.state.lastResult,
        }),
      },
      {
        name: "select_baseball_pitch",
        description: "다음 투구의 구종 선택. 대기 중에만 가능",
        inputSchema: {
          type: "object",
          properties: { pitch: { type: "string", enum: ALL_PITCHES.map((p) => p.id) } },
          required: ["pitch"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const p = (input as { pitch: string })?.pitch;
          if (!ALL_PITCHES.some((x) => x.id === p) || engine.state.phase !== "ready")
            throw new Error("유효한 구종과 투구 대기 상태가 필요합니다");
          engine.selectPitch(p as GameState["selected"]);
          return { pitch: engine.state.selected };
        },
      },
      {
        name: "throw_baseball_at_target",
        description:
          "홈플레이트 목표점을 지정하고 실제 한 구를 투구. x는 좌우 미터, y는 지상 높이 미터",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", minimum: -0.7, maximum: 0.7 },
            y: { type: "number", minimum: 0.15, maximum: 1.85 },
          },
          required: ["x", "y"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const p = input as { x: number; y: number };
          if (
            !p ||
            !Number.isFinite(p.x) ||
            !Number.isFinite(p.y) ||
            Math.abs(p.x) > 0.7 ||
            p.y < 0.15 ||
            p.y > 1.85
          )
            throw new Error("조준 범위를 벗어났습니다");
          if (!engine.throwAt(p.x, p.y)) throw new Error("지금은 투구할 수 없습니다");
          return { phase: engine.state.phase, target: engine.state.flight?.aim };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: abort.signal })).catch(() => {});
      } catch {}
    }
    return () => abort.abort();
  }, [engine]);
  const pitch = ALL_PITCHES.find((p) => p.id === s.selected)!;
  const hiddenOwned = s.career.pitches.filter(isHiddenPitch).length,
    regularOwned = s.career.pitches.length - hiddenOwned;
  const canPitch = s.phase === "ready" && !s.paused;
  const status =
    s.phase === "inplay"
      ? s.live?.state
      : s.phase === "ready"
        ? batting
          ? "타격 준비"
          : "투구 준비"
        : s.phase === "windup"
          ? "와인드업"
          : s.phase === "flight"
            ? "승부 중"
            : s.phase === "between"
              ? "공수 교대"
              : s.phase === "finished"
                ? "경기 종료"
                : "투구 결과";
  return (
    <main className="diamond-app">
      <Toaster theme="dark" position="bottom-center" />
      <CreationDialog engine={engine} s={s} />
      <BlessingDialog engine={engine} s={s} />
      <HiddenDialog engine={engine} s={s} />
      <NightDialog s={s} recap={recap} onClose={() => setRecap(null)} />
      <EndingDialog
        engine={engine}
        s={s}
        blocked={!!recap || view !== "life"}
        onPro={() => setView("life")}
      />
      <header className="app-header">
        <a
          className="brand"
          href="#"
          aria-label="다이아몬드 로드"
          onClick={(e) => {
            e.preventDefault();
            setView("life");
          }}
        >
          <span className="brand-mark">D</span>
          <span>
            DIAMOND <b>ROAD</b>
            <small>{s.career.stage === "pro" ? "프로 투수" : "고교 에이스"}</small>
          </span>
        </a>
        <button
          className="life-status"
          onClick={() => setView("life")}
          aria-label="오늘 하루 일정 보기"
        >
          <CalendarDays size={16} />
          <b>DAY {s.career.day}</b>
          <span>
            {view === "game" && s.mode !== "match"
              ? "자율 연습 중"
              : engine.matchActive || (view === "game" && s.mode === "match")
                ? "오후 · 시즌 경기"
                : s.career.actions > 0
                  ? `아침 · 행동력 ${s.career.actions}/${DAY_ACTIONS}`
                  : "오후 · 경기 전"}
          </span>
        </button>
        <div className="header-actions">
          <span className="prototype-tag">
            플레이 테스트 <b>05</b>
          </span>
          <button className="icon-button" onClick={() => setHelp(true)} aria-label="조작법">
            <CircleHelp size={20} />
          </button>
          <button className="icon-button" onClick={() => setSettings(true)} aria-label="설정">
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <div className="game-view" hidden={view !== "game"}>
        <div className="mode-row">
          <div className="mode-buttons">
            <button className="back-to-day" onClick={() => setView("life")}>
              ← 하루 일정
              <span>{s.mode === "match" ? "경기는 일시 정지" : "연습 끝내기"}</span>
            </button>
            <button className="active">
              {modes.find((m) => m.id === s.mode)!.label}
              <span>{modes.find((m) => m.id === s.mode)!.sub}</span>
            </button>
          </div>
          <span className="park-label">
            <Flag size={14} />
            미산 야구장 <span>15:00 · 맑음</span>
          </span>
        </div>
        <div className="game-layout">
          <section className="game-main">
            <Scoreboard s={s} />
            <div
              className={`game-stage ${batting && (s.phase === "windup" || s.phase === "flight") ? "batting-live" : ""}`}
              ref={stage}
            >
              <Field engine={engine} />
              {tour && tour.track !== "life" && view === "game" && (
                <TutorialCoach
                  track={tour.track}
                  step={tour.step}
                  onNext={() =>
                    tour.step >= TOURS[tour.track].length - 1
                      ? finishTour(tour.track)
                      : setTour({ ...tour, step: tour.step + 1 })
                  }
                  onSkip={endTutorial}
                />
              )}
              <div className="field-top">
                <div className="chip-stack">
                  <span className="inning-chip">{batting ? "공격 · 타격" : "수비 · 투구"}</span>
                  {s.mode === "match" && (
                    <span className="xp-chip">
                      DAY {s.career.day} · 경기 XP +{s.matchXp}
                    </span>
                  )}
                  {s.mode === "match" && s.career.stage === "pro" && teamOf(s.career.club) && (
                    <span
                      className="xp-chip scout-chip"
                      style={
                        { "--team-color": teamOf(s.career.club)!.color } as React.CSSProperties
                      }
                    >
                      🏟 {teamOf(s.career.club)!.name} · {STAGES.pro.goal}{" "}
                      {Math.round(s.career.scout)}
                    </span>
                  )}
                  {s.mode === "match" && s.career.stage !== "pro" && teamOf(s.career.team) && (
                    <span
                      className="xp-chip scout-chip"
                      style={
                        { "--team-color": teamOf(s.career.team)!.color } as React.CSSProperties
                      }
                    >
                      👀 {teamOf(s.career.team)!.name} 스카우트 관전 · 평가{" "}
                      {Math.round(s.career.scout)}
                    </span>
                  )}
                </div>
                <div className="field-actions">
                  <button
                    className="glass-button"
                    onClick={() => setManualPause((v) => !v)}
                    aria-label={manualPause ? "경기 재개" : "일시 정지"}
                  >
                    {manualPause ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button
                    className="glass-button"
                    aria-label={s.sound ? "소리 끄기" : "소리 켜기"}
                    onClick={() => engine.set("sound", !s.sound)}
                  >
                    {s.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <button
                    className="glass-button"
                    aria-label="전체 화면"
                    onClick={() => {
                      if (document.fullscreenElement) void document.exitFullscreen();
                      else
                        void stage.current
                          ?.requestFullscreen()
                          .catch(() => toast("브라우저에서 전체 화면을 지원하지 않습니다"));
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
              {batting && (s.phase === "flight" || s.phase === "windup") && s.flight && (
                <div className="timing-gauge">
                  <span>
                    {s.phase === "windup"
                      ? "준비"
                      : s.flight.swung
                        ? "스윙!"
                        : Math.abs(s.flight.elapsed / s.flight.visualDuration - SWING_SWEET) <=
                            SWING_GOOD
                          ? "지금!"
                          : "타이밍"}
                  </span>
                  <TimingBar s={s} className="timing-track" />
                </div>
              )}
              <div
                className={`field-message ${s.resultTone} ${s.phase === "result" ? "big-result" : ""}`}
                aria-live="polite"
                hidden={batting && (s.phase === "flight" || s.phase === "windup")}
              >
                <strong>{s.message}</strong>
                <span>{s.detail}</span>
              </div>
              <div className="field-bottom">
                <div className="pitcher-badge">
                  <span className="uniform-number">18</span>
                  <div>
                    <small>
                      {batting
                        ? `${(s.order[1] % 9) + 1}번 타자${engine.playerUp ? " · 나" : ""}`
                        : "마운드"}
                    </small>
                    <strong>{batting ? playerLabel(engine.batter) : s.career.name}</strong>
                    <span>
                      {batting
                        ? `${engine.batter.hand === "L" ? "좌" : "우"}타 · 컨택 ${engine.batter.contact} · 파워 ${engine.batter.power} · 주력 ${engine.batter.speed}`
                        : `우완 투수 · ${matchTeams(s.career)[1]}`}
                    </span>
                  </div>
                </div>
                <div className={`speed-readout ${speedTier(s.lastSpeed).cls}`}>
                  <b>{s.lastSpeed || "—"}</b>
                  <span>
                    km/h<small>{s.lastPitch}</small>
                    {speedTier(s.lastSpeed).label && <em>{speedTier(s.lastSpeed).label}</em>}
                  </span>
                </div>
              </div>
              {(manualPause || s.phase === "between" || s.phase === "finished") && (
                <div className="game-overlay">
                  <span className="eyebrow">DIAMOND ROAD</span>
                  <h2>{manualPause ? "잠시, 숨 고르기." : s.message}</h2>
                  <p>{manualPause ? "준비되면 경기를 이어가세요." : s.detail}</p>
                  {!manualPause && s.phase === "finished" && (
                    <>
                      {s.lastScout && (
                        <ScoutMeter
                          s={s}
                          before={s.lastScout.before}
                          after={s.lastScout.after}
                          big
                        />
                      )}
                      <RecapBreakdown
                        scoutParts={s.lastScoutParts}
                        xpParts={s.lastXpParts}
                        scoutLabel={s.career.stage === "pro" ? STAGES.pro.goal : "스카우트 평가"}
                      />
                      <p>
                        경험치 <b>+{s.lastXpGain} XP</b> 획득 · 보유 {s.career.xp} XP
                      </p>
                    </>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (manualPause) setManualPause(false);
                      else if (s.phase === "between") engine.continueInning();
                      else {
                        setRecap({
                          day: s.career.day - 1,
                          message: s.message,
                          score: (([away, home]) =>
                            `${home} ${s.score[1]} : ${s.score[0]} ${away}`)(
                            matchTeams({ ...s.career, day: s.career.day - 1 }),
                          ),
                          xp: s.lastXpGain,
                          scout: s.lastScout,
                          scoutParts: s.lastScoutParts,
                          xpParts: s.lastXpParts,
                        });
                        engine.start("match");
                        setView("life");
                      }
                    }}
                  >
                    <Play size={17} />
                    {manualPause
                      ? "경기 재개"
                      : s.phase === "between"
                        ? s.half === "top"
                          ? "타격 시작"
                          : "다음 이닝 투구"
                        : "하루 마무리하기"}
                  </button>
                </div>
              )}
            </div>
            <div className="camera-row">
              <span>
                <CameraIcon size={15} />
                카메라
              </span>
              <div>
                {cameras.map((c, i) => (
                  <button
                    key={c.id}
                    className={s.camera === c.id ? "active" : ""}
                    onClick={() => engine.set("camera", c.id)}
                  >
                    {c.label}
                    <small>{i + 1}</small>
                  </button>
                ))}
              </div>
              <kbd>C</kbd>
            </div>
            <div className="below-field">
              <LineScore s={s} />
              <div className="match-report">
                <span className="eyebrow">직전 플레이</span>
                <p>{s.log[0]}</p>
                <span>
                  투구 {s.pitchCount[1]} · 스트라이크{" "}
                  {s.practice.pitches
                    ? Math.round((s.practice.strikes / s.practice.pitches) * 100)
                    : 0}
                  %
                </span>
              </div>
              {s.mode === "match" && <TeamStrength engine={engine} />}
            </div>
          </section>
          <aside className="pitch-panel compact">
            <div className="pp-head">
              <h2>{batting ? "타격 플랜" : "투구 플랜"}</h2>
              <span className="status-pill">{status}</span>
            </div>
            {!batting && (
              <div className="pp-rival">
                <span className="pp-order">
                  {String((s.order[batting ? 1 : 0] % 9) + 1).padStart(2, "0")}
                </span>
                <span className="pp-rival-name">
                  <small>
                    {batting ? "현재 타자" : "상대 타자"} ·{" "}
                    {engine.batter.hand === "L" ? "좌" : "우"}타
                  </small>
                  <strong>{engine.batter.name}</strong>
                </span>
                <span className="pp-rival-stats">
                  <span>
                    컨택 <b>{engine.batter.contact}</b>
                  </span>
                  <span>
                    파워 <b>{engine.batter.power}</b>
                  </span>
                  <span>
                    선구 <b>{engine.batter.eye}</b>
                  </span>
                  <span>
                    주력 <b>{engine.batter.speed}</b>
                  </span>
                </span>
              </div>
            )}
            {batting && s.mode !== "bullpen" && (
              <div className="pp-rival">
                <span className="pp-order">{String((s.order[1] % 9) + 1).padStart(2, "0")}</span>
                <span className="pp-rival-name">
                  <small>
                    {engine.awayRoster.name} 에이스 ·{" "}
                    {engine.awayRoster.ace.hand === "L" ? "좌" : "우"}투
                  </small>
                  <strong>{engine.awayRoster.ace.name}</strong>
                </span>
                <span className="pp-rival-stats">
                  <span>
                    구속 <b>{STAGES[s.career.stage].aiVelocity + engine.awayRoster.ace.velocity}</b>
                  </span>
                  <span>
                    제구{" "}
                    <b>
                      {engine.awayRoster.ace.control <= 0.85
                        ? "A"
                        : engine.awayRoster.ace.control <= 1.05
                          ? "B"
                          : engine.awayRoster.ace.control <= 1.2
                            ? "C"
                            : "D"}
                    </b>
                  </span>
                  <span>
                    구종{" "}
                    <b>
                      {Math.min(
                        STAGES[s.career.stage].aiPitchKinds,
                        engine.awayRoster.ace.kinds + 2,
                      )}
                    </b>
                  </span>
                </span>
              </div>
            )}
            {!batting ? (
              <>
                <div className="pp-step">
                  <h3>
                    <i>1</i> 구종
                    <small>
                      숫자키로 선택 · 보유 {regularOwned}/{PITCHES.length}
                      {hiddenOwned > 0 && <em className="hidden-count"> · 히든 {hiddenOwned}</em>}
                    </small>
                  </h3>
                  <div className="pp-pitches">
                    {ALL_PITCHES.filter((p) => s.career.pitches.includes(p.id)).map((p) => (
                      <button
                        key={p.id}
                        className={
                          (s.selected === p.id ? "selected " : "") +
                          (isHiddenPitch(p.id) ? "hidden-pitch" : "")
                        }
                        disabled={s.phase !== "ready"}
                        title={p.desc}
                        onClick={() => engine.selectPitch(p.id)}
                        style={{ "--pitch-color": p.color } as React.CSSProperties}
                      >
                        <span className="pp-pitch-name">
                          <kbd>{p.key}</kbd>
                          {p.name}
                        </span>
                        <small>
                          {Math.round(
                            fastballSpeed(s.career.stats.velocity) +
                              p.delta -
                              (100 - s.effort) * 0.09,
                          )}{" "}
                          km/h
                        </small>
                      </button>
                    ))}
                  </div>
                  {regularOwned < PITCHES.length && (
                    <p className="pp-more">
                      남은 {PITCHES.length - regularOwned}개 구종은 하루 일정의 구종 상점에서
                      경험치로 익힙니다.
                    </p>
                  )}
                  <PitchMovementGuide s={s} />
                </div>
                <div className="pp-step" data-tour="effort">
                  <h3>
                    <i>2</i> 투구 강도 <b>{s.effort}%</b>
                    <small>왼쪽 제구 · 오른쪽 구속</small>
                  </h3>
                  <Slider
                    aria-label="투구 강도"
                    value={[s.effort]}
                    min={70}
                    max={100}
                    step={1}
                    disabled={s.phase !== "ready"}
                    onValueChange={(v) => engine.set("effort", v[0])}
                  />
                </div>
              </>
            ) : (
              <div className="pp-step">
                <h3>
                  <i>1</i> 스윙
                  <small>타이밍 + 조준</small>
                </h3>
                <div className="pp-swings">
                  {[
                    { id: "contact", name: "컨택", sub: "넓게 · 아슬하면 파울" },
                    { id: "power", name: "강타", sub: "아주 좁게 · 장타" },
                    { id: "bunt", name: "번트", sub: "짧게 굴려 진루" },
                  ].map((p) => (
                    <button
                      className={s.swingStyle === p.id ? "selected" : ""}
                      key={p.id}
                      onClick={() => engine.set("swingStyle", p.id as GameState["swingStyle"])}
                    >
                      <strong>{p.name}</strong>
                      <small>{p.sub}</small>
                    </button>
                  ))}
                </div>
                <BattingFeedback s={s} />
                {s.mode === "match" && (
                  <button
                    className={`subtle-button steal-button ${s.stealCall ? "selected" : ""}`}
                    disabled={
                      !(canPitch || (s.phase === "result" && s.outs < 3 && !s.paused)) ||
                      !s.bases[0] ||
                      s.bases[1]
                    }
                    onClick={() => engine.steal()}
                    aria-pressed={s.stealCall}
                  >
                    {s.stealCall
                      ? "도루 사인 ON · 다음 투구에 2루로"
                      : s.stealTrack
                        ? "1루 주자 도루 중!"
                        : "1루 주자 도루 사인"}{" "}
                    <kbd>E</kbd>
                  </button>
                )}
                <p className="pp-keys">화면에서 조준 · 클릭/Space 스윙 · E 도루 사인</p>
              </div>
            )}
            {!batting && (
              <>
                <div className="pp-step">
                  <h3>
                    <i>3</i> 목표 지점
                    <small>지난 공 오차 {s.lastError.toFixed(1)} cm</small>
                  </h3>
                  <AimPad engine={engine} s={s} />
                </div>
                <div className="pp-actions">
                  {/* No throw button: moving the mouse to it dragged the aim off the pad. */}
                  <span className="throw-hint">
                    <MousePointer2 size={15} />
                    <span>
                      조준판 클릭 또는 <kbd>Space</kbd> → {pitch.name} 던지기
                    </span>
                  </span>
                  <button
                    className="subtle-button"
                    disabled={!canPitch || s.mode !== "match"}
                    onClick={() => engine.intentionalWalk()}
                  >
                    고의4구
                  </button>
                  {s.mode === "match" && s.bases.some(Boolean) && (
                    <span className="pickoff-buttons" aria-label="견제">
                      {[1, 2, 3]
                        .filter((b) => s.bases[b - 1])
                        .map((b) => (
                          <button
                            key={b}
                            className="subtle-button"
                            disabled={!canPitch}
                            onClick={() => engine.pickoff(b)}
                          >
                            {b}루 견제
                          </button>
                        ))}
                    </span>
                  )}
                  <button
                    className="subtle-button"
                    onClick={() => engine.resetPitch()}
                    disabled={s.mode === "match" && s.phase !== "result"}
                    aria-label={s.mode === "match" ? "다음 투구" : "공 초기화"}
                  >
                    <RotateCcw size={14} /> <kbd>R</kbd>
                  </button>
                </div>
                <div className="pp-stamina">
                  <span>
                    <Activity size={13} /> 투수 체력
                  </span>
                  <Progress value={s.energy} aria-label="투수 체력" />
                  <b>{Math.round(s.energy)}</b>
                  <small className="pp-fatigue">
                    제구 오차 ±
                    {Math.round(
                      controlSpread(s.career.stats.control, s.energy, s.effort, s.career.form) *
                        100,
                    )}{" "}
                    cm
                    {s.energy <= 97 &&
                      ` · 체력 저하로 +${Math.round(
                        (controlSpread(s.career.stats.control, s.energy, s.effort, s.career.form) -
                          controlSpread(s.career.stats.control, 100, s.effort, s.career.form)) *
                          100,
                      )} cm, 구속 −${((100 - s.energy) * 0.065).toFixed(1)} km/h`}
                  </small>
                </div>
              </>
            )}
          </aside>
        </div>
        <div className="controls-footer">
          <span>
            <MousePointer2 size={15} />
            <b>조준 + 클릭</b> 투구 / 스윙
          </span>
          <span>
            <kbd>1–0</kbd> 구종 · <kbd>1–4</kbd> 송구 · <kbd>F</kbd> 견제 · <kbd>E</kbd> 도루
          </span>
          <span>
            <kbd>WASD</kbd> 수동 수비
          </span>
          <span>
            <kbd>P</kbd> 일시 정지
          </span>
          <button onClick={() => setHelp(true)}>
            조작법 보기 <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      {view === "life" && (
        <LifeView
          engine={engine}
          s={s}
          onPlay={() => {
            setView("game");
            if (!engine.matchActive && (s.mode !== "match" || s.phase === "finished"))
              newGame("match");
          }}
          onPractice={(mode) => {
            if (engine.matchActive) setPending(mode);
            else engine.start(mode, innings);
            setView("game");
          }}
        />
      )}
      {view === "life" && tour?.track === "life" && (
        <TutorialCoach
          track="life"
          step={tour.step}
          onNext={() =>
            tour.step >= TOURS.life.length - 1
              ? finishTour("life")
              : setTour({ ...tour, step: tour.step + 1 })
          }
          onSkip={endTutorial}
        />
      )}
      <footer className="app-footer">
        <span>
          DIAMOND ROAD <b>·</b> 웹 플레이 테스트 05
        </span>
        <span>선수 기록 자동 저장 · 경기 진행은 현재 세션에 유지</span>
      </footer>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="help-dialog">
          <DialogHeader>
            <DialogTitle>마운드부터 시작해 보세요.</DialogTitle>
            <DialogDescription>
              투구 · 타격 · 주루 · 수비를 한 경기에서 점검합니다.
            </DialogDescription>
          </DialogHeader>
          <button
            className="subtle-button tutorial-replay"
            onClick={() => {
              // Replay everything: the daily screen now, the mound and the plate in the next
              // first inning.
              saveTours({ life: false, pitch: false, bat: false });
              setHelp(false);
              setView("life");
              setTour({ track: "life", step: 0 });
            }}
          >
            튜토리얼 다시 보기
          </button>
          <div className="help-steps">
            <section>
              <h3>투구</h3>
              <ul>
                <li>
                  숫자키나 버튼으로 구종을 고르고, 조준판이나 스트라이크 존을 클릭해 던집니다.
                </li>
                <li>노린 곳에서 제구 오차만큼 벗어납니다. 체력·컨디션이 낮으면 더 벗어납니다.</li>
                <li>
                  주자가 있으면 <kbd>F</kbd> 또는 견제 버튼으로 견제구를 던질 수 있습니다.
                </li>
                <li>지친 투수는 폭투가 늘어납니다. 타자 몸에 맞으면 사구로 1루에 보냅니다.</li>
              </ul>
            </section>
            <section>
              <h3>타격</h3>
              <ul>
                <li>상대가 3아웃을 당하면 우리 공격입니다.</li>
                <li>
                  흐릿한 빛은 공이 올 범위(공은 항상 그 안), 노란 점선 원은 배트가 닿는 범위입니다.
                </li>
                <li>공을 끝까지 보고 조준한 뒤, 위쪽 게이지의 밝은 금색 구간에서 클릭합니다.</li>
                <li>
                  1루에 주자가 있으면 <kbd>E</kbd>로 도루 사인. 투구와 함께 뛰고 포수 송구와 도착
                  순서로 판정됩니다.
                </li>
              </ul>
            </section>
            <section>
              <h3>주루·수비</h3>
              <ul>
                <li>타자와 주자는 공이 살아 있는 동안 계속 달립니다.</li>
                <li>
                  뜬공이 떨어지기 전에 잡히면 타자 아웃, 주자는 원래 베이스로 돌아갑니다. 공이 먼저
                  가면 아웃입니다.
                </li>
                <li>땅볼은 공과 주자 중 누가 먼저 베이스에 닿는지로 포스·태그 아웃을 정합니다.</li>
                <li>
                  설정에서 자동 수비를 끄면 <kbd>WASD</kbd>로 수비수를 움직이고 <kbd>1</kbd>–
                  <kbd>4</kbd>로 송구 베이스를 고릅니다.
                </li>
              </ul>
            </section>
            <section>
              <h3>하루 일정과 성장</h3>
              <ul>
                <li>
                  아침에는 행동력 5로 훈련·수업·휴식, 오후에는 시즌 경기, 밤이 지나면 다음 날.
                </li>
                <li>
                  훈련 미니게임 결과에 따라 능력치가 0~2 오릅니다. 능력치마다 하는 일은 하루 일정의
                  &lsquo;내 능력치와 효과&rsquo;에 나옵니다.
                </li>
                <li>경기에서 모은 경험치로 구종 상점에서 새 구종을 익힙니다.</li>
                <li>
                  꿈의 구단 스카우트 평가가 100이 되면 입단하고, 같은 선수로 더 어려운 프로 무대가
                  열립니다(새 목표: 1군 신뢰도).
                </li>
              </ul>
            </section>
          </div>
          <details className="prototype-notes">
            <summary>이번 웹 점검판의 범위</summary>
            <p>
              직접 플레이: 10구종, 조준 오차, 중력 궤적, 좌·우타 AI, 스윙, 번트, 주루, 도루(E),
              견제, 사구, 폭투, 포구·송구, 볼넷·삼진·파울·안타·홈런·병살·희생플라이·고의4구,
              3/9이닝, 5개 카메라, 훈련·스카우트·입단 스토리·프로 모드.
            </p>
            <p>
              웹용으로 단순화: 구종 회전 효과는 보정 궤적, 타구는 능력치와 난수로 정하며,
              포구·송구·주루는 실제 이동 위치와 도착 시간으로 판정합니다. 고교 생활은 하루 단위
              훈련/수업/휴식, 프로 모드는 같은 경기 시스템에 높은 난이도와 새 목표를 더한
              단계입니다. 연장전·보크·부상·교체·세부 공식 기록과 프로 리그 장기 운영은 구현되어 있지
              않습니다. 동점 경기는 무승부로 끝납니다. Unity 프로젝트와 별도인 점검용 게임입니다.
            </p>
            <p>
              투구 조준판의 좌우와 변화량은 투수 방향 기준입니다. 색 영역은 기본 포물선 대비 최대
              휨이며, 최종 도착 범위나 제구 오차 범위가 아닙니다. 표시 구속은 게임 내 물리 구속이며,
              반응 시간을 위해 공 이동은 난이도에 따라 느리게 보여 주고, 구속 차이가 잘 보이도록
              빠른 공은 더 빠르게, 느린 공은 더 느리게 보여 줍니다.
            </p>
          </details>
          <button className="primary-button" onClick={() => setHelp(false)}>
            플레이로 돌아가기 <Play size={16} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="settings-dialog">
          <DialogHeader>
            <DialogTitle>경기 설정</DialogTitle>
            <DialogDescription>나에게 맞는 속도와 조작으로 플레이하세요.</DialogDescription>
          </DialogHeader>
          <div className="dev-mode">
            <h4>
              개발자 모드 <small>테스트용 · 선수 기록에 바로 저장</small>
            </h4>
            {!devUnlocked ? (
              <form
                className="dev-lock"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (devCode === DEV_CODE) {
                    setDevUnlocked(true);
                    toast.success("개발자 모드를 열었습니다");
                  } else toast.error("비밀번호가 틀렸습니다");
                  setDevCode("");
                }}
              >
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={12}
                  placeholder="비밀번호"
                  aria-label="개발자 모드 비밀번호"
                  value={devCode}
                  onChange={(e) => setDevCode(e.target.value)}
                />
                <button className="subtle-button" type="submit">
                  <Lock size={14} /> 잠금 해제
                </button>
              </form>
            ) : (
              <div>
                {([100, 200] as const).map((v) => (
                  <button
                    key={v}
                    className="subtle-button"
                    onClick={() => {
                      engine.devSetStats(v);
                      toast.success(
                        `모든 능력치를 ${v}로 올렸습니다${v === 200 ? " (상한 200 해금)" : ""}`,
                      );
                    }}
                  >
                    능력치 {v} 해금
                  </button>
                ))}
                <button
                  className="subtle-button"
                  onClick={() => {
                    engine.devUnlockPitches();
                    toast.success("모든 구종을 열었습니다 (히든 구종 포함)");
                  }}
                >
                  모든 구종 열기
                </button>
              </div>
            )}
          </div>
          <div className="settings-row">
            <label>난이도</label>
            <Select
              value={s.difficulty}
              onValueChange={(v) => engine.set("difficulty", v as GameState["difficulty"])}
            >
              <SelectTrigger aria-label="난이도">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">쉬움 · 여유로운 타이밍</SelectItem>
                <SelectItem value="normal">보통</SelectItem>
                <SelectItem value="hard">어려움 · 빠른 승부</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="settings-row">
            <label>다음 경기 길이</label>
            <Select value={String(innings)} onValueChange={(v) => setInnings(Number(v))}>
              <SelectTrigger aria-label="다음 경기 길이">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3이닝 · 빠른 점검</SelectItem>
                <SelectItem value="9">9이닝 · 전체 경기</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="settings-row">
            <label htmlFor="auto-field">
              자동 수비<small>끄면 WASD 이동 · 1–4 송구</small>
            </label>
            <Switch
              id="auto-field"
              checked={s.autoField}
              onCheckedChange={(v) => engine.set("autoField", v)}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="auto-camera">상황별 카메라 전환</label>
            <Switch
              id="auto-camera"
              checked={s.autoCamera}
              onCheckedChange={(v) => engine.set("autoCamera", v)}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="name-tags">수비수 이름 표시</label>
            <Switch
              id="name-tags"
              checked={s.nameTags}
              onCheckedChange={(v) => engine.set("nameTags", v)}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="game-sound">효과음</label>
            <Switch
              id="game-sound"
              checked={s.sound}
              onCheckedChange={(v) => engine.set("sound", v)}
            />
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setSettings(false);
              newGame(s.mode);
            }}
          >
            설정으로 새 경기
          </button>
          <button
            className="subtle-button"
            onClick={() => {
              if (
                window.confirm(
                  "선수 기록을 지우고 처음부터 시작할까요? (은총 룰렛을 다시 돌립니다)",
                )
              ) {
                engine.resetCareer();
                setSettings(false);
                setView("life");
              }
            }}
          >
            선수 처음부터 다시 시작
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pending}
        onOpenChange={(v) => {
          if (!v) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 플레이로 전환할까요?</DialogTitle>
            <DialogDescription>
              진행 중인 경기 점수는 초기화됩니다. 저장된 선수 능력과 완료한 경기 기록은 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <button
            className="primary-button"
            onClick={() => {
              if (pending) engine.start(pending, innings);
              setPending(null);
              setManualPause(false);
            }}
          >
            전환하기
          </button>
          <button className="subtle-button" onClick={() => setPending(null)}>
            현재 경기 계속하기
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
