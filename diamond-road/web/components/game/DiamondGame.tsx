"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  SWING_GOOD,
  SWING_SWEET,
  clamp,
  pitchMovement,
  swingWindow,
  type GameState,
  type Mode,
  type Camera,
  type Career,
} from "@/lib/game/engine";
import type { BaseballField } from "@/lib/game/field";
import type { SoftwareField } from "@/lib/game/software-field";

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
const statNames: Record<keyof Career["stats"], string> = {
  velocity: "구속",
  control: "제구",
  movement: "구위",
  stamina: "체력",
  contact: "컨택",
  power: "파워",
};

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
function Scoreboard({ s }: { s: GameState }) {
  return (
    <div className="scoreboard">
      <div className="board-match">
        <span className="live-label">{s.mode === "match" ? "EXHIBITION" : "PRACTICE"}</span>
        <span>
          {s.mode === "match"
            ? `${s.maxInnings}이닝 연습 경기`
            : s.mode === "bullpen"
              ? "불펜 피칭"
              : "배팅 케이지"}
        </span>
      </div>
      <div className={`team away ${s.half === "top" ? "at-bat" : ""}`}>
        <span className="team-logo">HB</span>
        <span>
          한빛고<small>AWAY</small>
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
          하늘고<small>HOME</small>
        </span>
        <span className="team-logo">HN</span>
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
  const activePitch = PITCHES.find((p) => p.id === (locked ? flight.pitch : s.selected))!;
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
            <ellipse
              cx={toX(hint.x)}
              cy={toY(hint.y)}
              rx={(hint.r / 1.4) * 280}
              ry={(hint.r / 1.7) * 240}
              fill="#fff8df"
              fillOpacity=".12"
              stroke="#fff8df"
              strokeOpacity=".45"
              strokeDasharray="4 4"
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
    w = swingWindow(s.difficulty),
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
  const p = PITCHES.find((p) => p.id === (f?.pitch ?? s.selected))!,
    m = pitchMovement(p.id, f?.movement ?? s.career.stats.movement);
  return (
    <div className="pitch-movement-guide" aria-label={p.name + " 움직임 범위"}>
      <div className="movement-heading">
        <span>
          <i style={{ background: p.color }} />
          {p.name} 최대 휨
        </span>
        <small>기본 포물선 대비</small>
      </div>
      <div className="movement-values">
        <span>
          가로{" "}
          <b>
            {m.x >= 0 ? "오른쪽" : "왼쪽"} 0–{Math.abs(m.x * 100).toFixed(1)} cm
          </b>
        </span>
        <span>
          세로{" "}
          <b>
            {m.y >= 0 ? "위" : "아래"} 0–{Math.abs(m.y * 100).toFixed(1)} cm
          </b>
        </span>
      </div>
      <p>
        색 영역은 비행 중 휘는 범위입니다. 최종 도착 목표는 조준점이며, 제구 오차가 따로 적용됩니다.
      </p>
    </div>
  );
}
function BattingFeedback({ s }: { s: GameState }) {
  const f = s.batFeedback;
  if (!f)
    return (
      <p className="bat-help">
        투구가 시작되면 <b>흐린 원</b>이 공이 올 범위입니다.
        <br />원 안에 조준하고, 위쪽 게이지의 <b>금색 구간</b>에서 클릭하세요.
        <br />
        컨택 능력이 높을수록 원이 작아집니다.
      </p>
    );
  const label = {
    early: "스윙이 빨랐어요",
    good: "좋은 타이밍",
    late: "스윙이 늦었어요",
    take: "공을 지켜봤어요",
  }[f.timing];
  return (
    <div className={`bat-feedback ${f.contact ? "contact" : ""}`} role="status">
      <strong>
        {label}
        <span>{f.contact ? "배트에 맞음" : f.timing === "take" ? "노 스윙" : "헛스윙"}</span>
      </strong>
      <p>
        {f.offsetMs !== null
          ? `타이밍 ${f.offsetMs > 0 ? "+" : ""}${f.offsetMs} ms · 조준 오차 ${f.errorCm} cm`
          : "다음 공의 위치와 타이밍을 읽어 보세요."}
      </p>
    </div>
  );
}
function LineScore({ s }: { s: GameState }) {
  return (
    <div className="line-score">
      <table>
        <caption className="sr-only">이닝별 점수</caption>
        <thead>
          <tr>
            <th>TEAM</th>
            {Array.from({ length: s.maxInnings }, (_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
            <th>R</th>
            <th>H</th>
            <th>E</th>
          </tr>
        </thead>
        <tbody>
          {["한빛고", "하늘고"].map((name, i) => (
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

function CareerView({ engine, s }: { engine: BaseballEngine; s: GameState }) {
  const c = s.career;
  const [name, setName] = useState(c.name);
  return (
    <section className="career-view">
      <div className="section-intro">
        <div>
          <span className="eyebrow">ROAD TO THE PROS</span>
          <h1>내 이름을, 다음 라인업에.</h1>
          <p>고교 마지막 시즌. 하루의 선택이 내일의 선수를 만듭니다.</p>
        </div>
        <span className="season-stamp">
          고교 3학년 <b>DAY {String(c.day).padStart(2, "0")}</b>
        </span>
      </div>
      <div className="career-grid">
        <article className="player-card">
          <div className="jersey-number">18</div>
          <div className="player-card-top">
            <span>HANEUL HIGH SCHOOL</span>
            <Shield size={24} />
          </div>
          <div className="player-card-bottom">
            <span className="eyebrow">RHP · TWO-WAY PROSPECT</span>
            <h2>{c.name}</h2>
            <p>우투 · 선발 투수</p>
            <div className="player-rating">
              <strong>{Math.round(Object.values(c.stats).reduce((a, b) => a + b, 0) / 6)}</strong>
              <span>
                OVERALL
                <br />
                종합 능력
              </span>
            </div>
          </div>
        </article>
        <div className="career-main">
          <article className="panel">
            <div className="panel-heading">
              <h2>선수 능력</h2>
              <span>보유 {c.xp} XP</span>
            </div>
            <div className="stat-grid">
              {Object.entries(c.stats).map(([key, val]) => (
                <div className="stat" key={key}>
                  <span>{statNames[key as keyof Career["stats"]]}</span>
                  <b>{val}</b>
                  <Progress value={val} aria-label={statNames[key as keyof Career["stats"]]} />
                </div>
              ))}
            </div>
            <div className="known-pitches">
              <span>보유 구종</span>
              {PITCHES.filter((p) => c.pitches.includes(p.id)).map((p) => (
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
              <h2>스카우트 리포트</h2>
              <Medal size={20} />
            </div>
            <div className="scout-number">
              <strong>{Math.round(c.scout)}</strong>
              <span>
                / 100
                <small>
                  {c.scout >= 65
                    ? "프로 지명권 진입"
                    : c.scout >= 42
                      ? "육성선수 후보"
                      : "성장 가능성을 지켜보는 중"}
                </small>
              </span>
            </div>
            <Progress value={c.scout} aria-label="스카우트 평가" />
            <div className="scout-thresholds">
              <span>0 관찰</span>
              <span>42 육성</span>
              <span>65 지명</span>
            </div>
            <p>
              {c.draft
                ? `이번 시즌 진로: ${c.draft}`
                : "공식 경기를 마치면 평가가 올라갑니다. 3경기 이후 시즌 결산을 할 수 있습니다."}
            </p>
            <button
              className="primary-button"
              disabled={c.games < 3 || !!c.draft}
              onClick={() => {
                const r = engine.draft();
                r.ok ? toast.success(r.message) : toast.error(r.message);
              }}
            >
              시즌 결산 · 진로 확인 <ChevronRight size={16} />
            </button>
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

const trainings = [
  {
    id: "bullpen",
    icon: Target,
    name: "불펜 피칭",
    desc: "모서리를 찌르는 한 구",
    gain: "제구 +2",
    cost: 18,
  },
  {
    id: "weights",
    icon: Dumbbell,
    name: "하체·코어",
    desc: "강한 하체에서 나오는 구속",
    gain: "구속 +2",
    cost: 22,
  },
  {
    id: "breaking",
    icon: Wind,
    name: "변화구 그립",
    desc: "회전으로 만드는 다른 궤적",
    gain: "구위 +2",
    cost: 18,
  },
  {
    id: "running",
    icon: Activity,
    name: "러닝",
    desc: "마지막 이닝까지 흔들림 없이",
    gain: "체력 능력 +2",
    cost: 16,
  },
  {
    id: "batting",
    icon: Crosshair,
    name: "타격 훈련",
    desc: "공을 끝까지 보고 정확하게",
    gain: "컨택 +2",
    cost: 20,
  },
  { id: "power", icon: Zap, name: "장타 훈련", desc: "배트에 싣는 힘", gain: "파워 +2", cost: 22 },
  {
    id: "study",
    icon: BookOpen,
    name: "수업·영상 분석",
    desc: "책상에서도 이어지는 야구",
    gain: "컨디션 +4",
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
function TrainingView({
  engine,
  s,
  onPlay,
}: {
  engine: BaseballEngine;
  s: GameState;
  onPlay: () => void;
}) {
  const c = s.career,
    trained = c.trainedDay === c.day;
  return (
    <section className="training-view">
      <div className="section-intro">
        <div>
          <span className="eyebrow">A LITTLE BETTER, EVERY DAY</span>
          <h1>오늘은 무엇을 쌓을까요?</h1>
          <p>
            {engine.matchActive
              ? "경기 진행 중입니다. 경기를 마치거나 불펜으로 전환한 뒤 훈련하세요."
              : "하루에 훈련(또는 휴식)은 한 번. 그다음 경기를 치르면 다음 날이 됩니다."}
          </p>
        </div>
        <span className="season-stamp">
          시즌 훈련 <b>DAY {String(c.day).padStart(2, "0")}</b>
        </span>
      </div>
      <div className="day-plan" aria-label={`DAY ${c.day} 일정`}>
        <CalendarDays size={20} />
        <strong>DAY {c.day}</strong>
        <ol>
          <li className={trained ? "done" : "now"}>
            <b>1</b> 훈련 1회 {trained ? "· 완료" : "· 지금 선택"}
          </li>
          <li className={trained ? "now" : ""}>
            <b>2</b> 시즌 경기 · XP 획득
          </li>
          <li>
            <b>3</b> 구종 상점에서 XP 사용
          </li>
        </ol>
        <button className="primary-button" onClick={onPlay}>
          <Play size={16} />
          {engine.matchActive ? "경기로 돌아가기" : "오늘의 경기 시작"}
        </button>
      </div>
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
      <div className="training-grid">
        {trainings.map((t, i) => (
          <button
            className={`training-card ${t.id === "rest" ? "rest-card" : ""}`}
            key={t.id}
            disabled={c.energy < t.cost || engine.matchActive || trained}
            onClick={() => {
              const r = engine.train(t.id);
              r.ok ? toast.success(r.message) : toast.error(r.message);
            }}
          >
            <span className="training-index">{String(i + 1).padStart(2, "0")}</span>
            <t.icon size={29} />
            <h2>{t.name}</h2>
            <p>{t.desc}</p>
            <div>
              <b>{t.gain}</b>
              <span>
                {t.cost > 0 ? `체력 −${t.cost}` : "회복"}
                <ArrowUpRight size={15} />
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="section-intro shop-intro">
        <div>
          <span className="eyebrow">PITCH SHOP</span>
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
                구속 {p.delta ? p.delta : "±0"} km/h · 휨 {Math.round(Math.hypot(m.x, m.y) * 100)}{" "}
                cm
              </span>
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
      </div>
      <div className="training-note">
        <BookOpen size={18} />
        <p>
          훈련한 능력은 다음 투구와 타격부터 반영됩니다. 낮은 체력은 구속과 제구에, 낮은 컨디션은
          집중력에 영향을 줍니다. 컨택이 오르면 타격 때 보이는 공의 도착 범위가 작아집니다. 경기를
          마치면 밤사이 체력이 12 회복됩니다.
        </p>
      </div>
    </section>
  );
}

export default function DiamondGame() {
  const [engine] = useState(() => new BaseballEngine());
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [view, setView] = useState("game"),
    [help, setHelp] = useState(false),
    [settings, setSettings] = useState(false),
    [manualPause, setManualPause] = useState(false),
    [pending, setPending] = useState<Mode | null>(null);
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
  useEffect(() => {
    engine.set("paused", view !== "game" || help || settings || !!pending || manualPause);
  }, [view, help, settings, pending, manualPause, engine]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        view !== "game" ||
        help ||
        settings ||
        pending ||
        (e.target as HTMLElement)?.closest("input,textarea,[role=slider],[role=combobox]")
      )
        return;
      const k = e.key.toLowerCase();
      engine.keys.add(k);
      if (e.repeat) return;
      if (k === "p" || k === "escape") {
        setManualPause((v) => !v);
        return;
      }
      if (engine.state.paused) return;
      if (engine.state.phase === "inplay" && engine.state.live) {
        if (["1", "2", "3", "4"].includes(k)) engine.selectThrowBase(Number(k));
      } else {
        const p = PITCHES.find((p) => p.key === k);
        if (p) engine.selectPitch(p.id);
      }
      if (k === " " && !(e.target as HTMLElement).closest("button,[role=button]")) {
        e.preventDefault();
        engine.batting ? engine.swing() : engine.throwAt();
      }
      if (k === "c") {
        const i = cameras.findIndex((c) => c.id === engine.state.camera);
        engine.set("camera", cameras[(i + 1) % 5].id);
      }
      if (k === "r") engine.resetPitch();
      if (k === "e") engine.steal();
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
    const up = (e: KeyboardEvent) => engine.keys.delete(e.key.toLowerCase());
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
          properties: { pitch: { type: "string", enum: PITCHES.map((p) => p.id) } },
          required: ["pitch"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const p = (input as { pitch: string })?.pitch;
          if (!PITCHES.some((x) => x.id === p) || engine.state.phase !== "ready")
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
  const pitch = PITCHES.find((p) => p.id === s.selected)!;
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
      <header className="app-header">
        <a
          className="brand"
          href="#"
          aria-label="다이아몬드 로드"
          onClick={(e) => {
            e.preventDefault();
            setView("game");
          }}
        >
          <span className="brand-mark">D</span>
          <span>
            DIAMOND <b>ROAD</b>
            <small>고교 에이스</small>
          </span>
        </a>
        <Tabs value={view} onValueChange={setView} className="main-nav">
          <TabsList variant="line">
            <TabsTrigger value="game">
              <Flag />
              플레이
            </TabsTrigger>
            <TabsTrigger value="training">
              <Dumbbell />
              훈련
            </TabsTrigger>
            <TabsTrigger value="career">
              <Trophy />내 선수
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="header-actions">
          <span className="prototype-tag">
            PLAYABLE PROTOTYPE <b>04</b>
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
            {modes.map((m) => (
              <button
                key={m.id}
                className={s.mode === m.id ? "active" : ""}
                onClick={() => {
                  if (s.mode !== m.id) newGame(m.id);
                }}
              >
                {m.label}
                <span>{m.sub}</span>
              </button>
            ))}
          </div>
          <span className="park-label">
            <Flag size={14} />
            하늘 야구장 <span>15:00 · 맑음</span>
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
              <div className="field-top">
                <div className="chip-stack">
                  <span className="inning-chip">
                    {batting ? "OFFENSE · 타격" : "DEFENSE · 투구"}
                  </span>
                  {s.mode === "match" && (
                    <span className="xp-chip">
                      DAY {s.career.day} · 경기 XP +{s.matchXp}
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
                className={`field-message ${s.resultTone} ${s.phase === "result" || s.phase === "inplay" ? "big-result" : ""}`}
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
                    <small>{batting ? "AT BAT" : "ON THE MOUND"}</small>
                    <strong>{batting ? engine.batter.name : s.career.name}</strong>
                    <span>
                      {batting
                        ? `${engine.batter.hand === "L" ? "좌" : "우"}타 · 컨택 ${engine.batter.contact}`
                        : "우완 투수 · 하늘고"}
                    </span>
                  </div>
                </div>
                <div className="speed-readout">
                  <b>{s.lastSpeed || "—"}</b>
                  <span>
                    km/h<small>{s.lastPitch}</small>
                  </span>
                </div>
              </div>
              {(manualPause || s.phase === "between" || s.phase === "finished") && (
                <div className="game-overlay">
                  <span className="eyebrow">DIAMOND ROAD</span>
                  <h2>{manualPause ? "잠시, 숨 고르기." : s.message}</h2>
                  <p>{manualPause ? "준비되면 경기를 이어가세요." : s.detail}</p>
                  {!manualPause && s.phase === "finished" && (
                    <p>
                      경험치 <b>+{s.lastXpGain} XP</b> 획득 · 보유 {s.career.xp} XP
                      <br />
                      DAY {s.career.day} 시작: 훈련 1회 → 다음 경기
                    </p>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (manualPause) setManualPause(false);
                      else if (s.phase === "between") engine.continueInning();
                      else newGame("match");
                    }}
                  >
                    <Play size={17} />
                    {manualPause
                      ? "경기 재개"
                      : s.phase === "between"
                        ? s.half === "top"
                          ? "타격 시작"
                          : "다음 이닝 투구"
                        : "새 경기"}
                  </button>
                  {s.phase === "finished" && !manualPause && (
                    <button className="subtle-button" onClick={() => setView("training")}>
                      훈련 · 구종 상점으로
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="camera-row">
              <span>
                <CameraIcon size={15} />
                CAMERA
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
                <span className="eyebrow">LAST PLAY</span>
                <p>{s.log[0]}</p>
                <span>
                  투구 {s.pitchCount[1]} · 스트라이크{" "}
                  {s.practice.pitches
                    ? Math.round((s.practice.strikes / s.practice.pitches) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </section>
          <aside className="pitch-panel">
            <div className="panel-heading">
              <h2>{batting ? "타격 플랜" : "투구 플랜"}</h2>
              <span className="status-pill">{status}</span>
            </div>
            <div className="rival-card">
              <span className="rival-order">
                {String((s.order[batting ? 1 : 0] % 9) + 1).padStart(2, "0")}
              </span>
              <div>
                <small>
                  {batting ? "현재 타자" : "상대 타자"} · {engine.batter.hand === "L" ? "좌" : "우"}
                  타
                </small>
                <strong>{engine.batter.name}</strong>
              </div>
              <div className="rival-stats">
                <span>
                  CON <b>{engine.batter.contact}</b>
                </span>
                <span>
                  POW <b>{engine.batter.power}</b>
                </span>
                <span>
                  EYE <b>{engine.batter.eye}</b>
                </span>
              </div>
            </div>
            {!batting ? (
              <>
                <div className="control-label">
                  <span>구종 선택</span>
                  <small>
                    단축키 1–{PITCHES.length} · 보유 {s.career.pitches.length}/{PITCHES.length}
                  </small>
                </div>
                <div className="pitch-list">
                  {PITCHES.map((p) => {
                    const owned = s.career.pitches.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        className={`${s.selected === p.id ? "selected" : ""} ${owned ? "" : "locked"}`}
                        disabled={s.phase !== "ready" || !owned}
                        title={owned ? undefined : `훈련 탭의 구종 상점에서 ${p.cost} XP로 습득`}
                        onClick={() => engine.selectPitch(p.id)}
                        style={{ "--pitch-color": p.color } as React.CSSProperties}
                      >
                        <kbd>{owned ? p.key : <Lock size={12} />}</kbd>
                        <span>
                          {p.name}
                          <small>{owned ? p.en : `${p.cost} XP`}</small>
                        </span>
                        <b>
                          {Math.round(
                            110 +
                              s.career.stats.velocity * 0.43 +
                              p.delta -
                              (100 - s.effort) * 0.09,
                          )}
                          <small>km/h</small>
                        </b>
                        <svg width="38" height="26" viewBox="0 0 38 26" aria-hidden="true">
                          <path
                            d={
                              p.id === "fastball"
                                ? "M2 23 33 3"
                                : p.id === "slider"
                                  ? "M2 23Q30 21 33 3"
                                  : p.id === "curve"
                                    ? "M2 23Q5-8 33 7"
                                    : p.id === "cutter"
                                      ? "M2 23Q26 14 33 4"
                                      : p.id === "splitter"
                                        ? "M2 23Q12 -4 32 9"
                                        : "M2 23Q30 6 32 2"
                            }
                            fill="none"
                            stroke={p.color}
                            strokeWidth="2"
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <p className="pitch-description">{pitch.desc}</p>
                <div className="effort">
                  <div className="control-label">
                    <label id="effort-label">투구 강도</label>
                    <b>{s.effort}%</b>
                  </div>
                  <Slider
                    aria-labelledby="effort-label"
                    value={[s.effort]}
                    min={70}
                    max={100}
                    step={1}
                    disabled={s.phase !== "ready"}
                    onValueChange={(v) => engine.set("effort", v[0])}
                  />
                  <div className="range-caption">
                    <span>제구 중심</span>
                    <span>구속 중심</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="control-label">
                  <span>스윙 선택</span>
                  <small>타이밍 + 조준</small>
                </div>
                <div className="swing-options">
                  {[
                    { id: "contact", name: "컨택", sub: "넓은 타격 범위" },
                    { id: "power", name: "강공", sub: "좁은 범위 · 긴 비거리" },
                    { id: "bunt", name: "번트", sub: "짧게 굴리기" },
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
              </>
            )}
            <div className="control-label target-label">
              <span>{batting ? "타격 조준" : "목표 지점"}</span>
              <Crosshair size={16} />
            </div>
            <AimPad engine={engine} s={s} />
            {!batting && <PitchMovementGuide s={s} />}
            <div className="aim-coordinates">
              <span>X {s.aim.x.toFixed(2)} m</span>
              <span>Y {s.aim.y.toFixed(2)} m</span>
              <span>
                {batting
                  ? `배트 오차 ${s.batFeedback?.errorCm != null ? `${s.batFeedback.errorCm} cm` : "—"}`
                  : `오차 ${s.lastError.toFixed(1)} cm`}
              </span>
            </div>
            <button
              className="primary-button throw-button"
              disabled={batting ? s.phase !== "flight" || s.paused : !canPitch}
              onClick={() => (batting ? engine.swing() : engine.throwAt())}
            >
              <MousePointer2 size={17} />
              {batting ? "스윙" : `${pitch.name} 던지기`}
              <kbd>CLICK</kbd>
            </button>
            <div className="tactics">
              {batting ? (
                <button
                  disabled={
                    !canPitch ||
                    !((s.bases[1] && !s.bases[2]) || (s.bases[0] && !s.bases[1])) ||
                    s.mode !== "match"
                  }
                  onClick={() => engine.steal()}
                >
                  도루 <kbd>E</kbd>
                </button>
              ) : (
                <button
                  disabled={!canPitch || s.mode !== "match"}
                  onClick={() => engine.intentionalWalk()}
                >
                  고의4구 <span>IBB</span>
                </button>
              )}
              <button
                onClick={() => engine.resetPitch()}
                disabled={s.mode === "match" && s.phase !== "result"}
              >
                <RotateCcw size={14} />
                {s.mode === "match" ? "다음 투구" : "공 초기화"}
                <kbd>R</kbd>
              </button>
            </div>
            <div className="stamina">
              <div className="control-label">
                <span>
                  <Activity size={14} />
                  투수 체력
                </span>
                <b>
                  {Math.round(s.energy)}
                  <small>/100</small>
                </b>
              </div>
              <Progress value={s.energy} aria-label="투수 체력" />
            </div>
          </aside>
        </div>
        <div className="controls-footer">
          <span>
            <MousePointer2 size={15} />
            <b>조준 + 클릭</b> 투구 / 스윙
          </span>
          <span>
            <kbd>1–6</kbd> 구종 · <kbd>1–4</kbd> 송구
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
      {view === "training" && (
        <TrainingView
          engine={engine}
          s={s}
          onPlay={() => {
            setView("game");
            if (!engine.matchActive && (s.mode !== "match" || s.phase === "finished"))
              newGame("match");
          }}
        />
      )}
      {view === "career" && <CareerView engine={engine} s={s} />}
      <footer className="app-footer">
        <span>
          DIAMOND ROAD <b>·</b> WEB PLAYTEST 04
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
          <div className="help-steps">
            <p>
              <b>01 투구</b> 구종을 고르고 오른쪽 조준판을 클릭하세요. 선택한 목표에 제구·피로도
              오차가 적용됩니다.
            </p>
            <p>
              <b>02 타격</b> 3아웃 후 공격 이닝입니다. 투구가 시작되면 스트라이크 존 근처에 흐린
              원이 나타납니다. 공은 반드시 그 원 안으로 옵니다. 원 안을 조준하고 화면 위쪽 게이지의
              금색 구간에서 클릭하거나 Space를 누르세요. 컨택 능력이 오를수록 원이 작아집니다.
            </p>
            <p>
              <b>03 주루·수비</b> 주자는 홈·1루·2루·3루 순서로 달립니다. 플라이 포구는 즉시 아웃.
              땅볼은 공과 주자의 도착 순서로 포스·태그 아웃을 판정합니다. 출루 후 E로 도루. 설정에서
              자동 수비를 끄면 WASD로 움직이고 1–4로 송구 베이스를 정합니다.
            </p>
            <p>
              <b>04 하루 일정</b> 하루에 훈련(또는 휴식) 1회 → 시즌 경기 1회. 경기를 끝내면 다음
              날이 됩니다. 경기에서 삼진·아웃·안타·득점·승리로 경험치(XP)를 모으고, 훈련 탭의 구종
              상점에서 새 구종을 삽니다. 3경기를 마치면 시즌 진로를 확인할 수 있습니다.
            </p>
          </div>
          <details className="prototype-notes">
            <summary>이번 웹 점검판의 범위</summary>
            <p>
              직접 플레이: 4구종, 조준 오차, 중력 궤적, 좌·우타 AI, 스윙, 번트, 주루, 도루,
              포구·송구, 볼넷·삼진·파울·안타·홈런·병살·희생플라이·고의4구, 3/9이닝, 5개 카메라,
              훈련·스카우트·진로.
            </p>
            <p>
              웹용으로 단순화: 구종 회전 효과는 보정 궤적, 타구는 능력치와 난수로 정하며,
              포구·송구·주루는 실제 이동 위치와 도착 시간으로 판정합니다. 고교 생활은 하루 단위
              훈련/수업/휴식, 프로 진출은 시즌 결산까지 체험합니다. 연장전·견제·보크·부상·교체·세부
              공식 기록과 프로 리그 장기 운영은 구현되어 있지 않습니다. 동점 경기는 무승부로
              끝납니다. Unity 프로젝트와 별도인 점검용 게임입니다.
            </p>
            <p>
              투구 조준판의 좌우와 변화량은 투수 방향 기준입니다. 색 영역은 기본 포물선 대비 최대
              휨이며, 최종 도착 범위나 제구 오차 범위가 아닙니다. 표시 구속은 게임 내 물리 구속이며,
              반응 시간을 위해 공 이동은 난이도에 따라 느리게 보여 줍니다.
            </p>
          </details>
          <button className="primary-button" onClick={() => setHelp(false)}>
            플레이로 돌아가기 <Play size={16} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>경기 설정</DialogTitle>
            <DialogDescription>나에게 맞는 속도와 조작으로 플레이하세요.</DialogDescription>
          </DialogHeader>
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
