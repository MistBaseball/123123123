"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/** Which minigame each training uses. Rest has no minigame. */
export const TRAINING_GAMES: Record<
  string,
  { game: GameKind; title: string; how: string; steps: string[]; controls: string; score: string }
> = {
  bullpen: {
    game: "aim",
    title: "코너 공략",
    how: "포수 미트가 가리키는 곳을 정확히 찌르는 제구 훈련입니다.",
    steps: [
      "스트라이크 존(3×3 칸) 안에 금색 과녁이 하나씩 나타납니다.",
      "과녁은 약 1.4초 뒤 작아지며 사라집니다. 사라지기 전에 클릭하세요.",
      "모두 8개가 나옵니다.",
    ],
    controls: "마우스 클릭 · 휴대폰은 터치",
    score: "7개 이상 완벽(+2) · 4개 이상 좋음(+1) · 3개 이하 아쉬움(+0)",
  },
  weights: {
    game: "charge",
    title: "스쿼트 힘 모으기",
    how: "하체에 힘을 끝까지 모았다가 한 번에 밀어 올리는 훈련입니다.",
    steps: [
      "Space(또는 버튼)를 누르고 있으면 힘 게이지가 점점 빠르게 찹니다.",
      "초록 구간에서 손을 떼면 성공, 끝까지 차면 과부하로 실패합니다.",
      "3세트이며, 세트마다 초록 구간이 조금씩 좁아집니다.",
    ],
    controls: "Space 누르고 있다가 떼기 · 버튼 누르고 있다가 떼기",
    score: "초록 한가운데 100점 · 초록 70점 · 조금 모자람 40점 — 평균 85 이상 완벽, 40 이상 좋음",
  },
  breaking: {
    game: "memory",
    title: "그립 기억하기",
    how: "코치가 보여 주는 변화구 그립 순서를 손에 익히는 훈련입니다.",
    steps: [
      "검지·중지·엄지·손목 버튼이 차례로 빛납니다. 순서를 기억하세요.",
      '"이제 따라 누르세요"가 나오면 같은 순서로 누릅니다.',
      "3개 → 4개 → 5개, 3단계입니다. 틀리면 그 자리에서 끝납니다.",
    ],
    controls: "버튼 클릭 · 터치",
    score: "3단계 모두 성공 완벽 · 2단계 이상 좋음 · 1단계 이하 아쉬움",
  },
  running: {
    game: "pace",
    title: "페이스 유지",
    how: "마지막 이닝까지 버티는 지구력은 일정한 페이스에서 나옵니다.",
    steps: [
      "Space(또는 버튼)를 누르고 있으면 속도가 오르고, 떼면 내려갑니다.",
      "흰 바늘을 초록 페이스 구간 안에 두세요. 구간은 천천히 움직입니다.",
      "10초 동안 구간 안에 있던 시간이 점수입니다.",
    ],
    controls: "Space 누르기/떼기 · 버튼 누르기/떼기",
    score: "구간 안 70% 이상 완벽 · 35% 이상 좋음 · 그 미만 아쉬움",
  },
  sprint: {
    game: "mash",
    title: "전력 질주",
    how: "홈에서 1루까지 한 걸음이라도 빨리. 주력을 키우는 전력 질주입니다.",
    steps: [
      "시작하면 6초 타이머가 돌아갑니다.",
      "Space를 누를 때마다 선수가 앞으로 달립니다. 최대한 빠르게 연타하세요.",
      "42번을 누르면 결승선 통과로 바로 끝납니다.",
    ],
    controls: 'Space 연타 · "달려!" 버튼 연타',
    score: "결승선 도착 완벽 · 절반 이상 좋음 · 그 미만 아쉬움",
  },
  batting: {
    game: "timing",
    title: "티 배팅",
    how: "공을 끝까지 보고 배트 중심에 맞히는 타이밍 훈련입니다.",
    steps: [
      "하얀 공이 왼쪽에서 오른쪽으로 날아옵니다. 공마다 속도가 다릅니다.",
      "공이 금색 타격 구간 한가운데를 지날 때 스윙하세요.",
      "모두 5구, 스윙하지 않고 지나가면 헛스윙입니다.",
    ],
    controls: "Space · Enter · 화면 클릭",
    score: "정타 100 · 잘 맞음 70 · 빗맞음 35 — 평균 85 이상 완벽, 40 이상 좋음",
  },
  power: {
    game: "power",
    title: "풀스윙",
    how: "배트에 체중을 싣는 순간을 몸에 익히는 장타 훈련입니다.",
    steps: [
      "흰 막대가 게이지 위를 왼쪽↔오른쪽으로 오갑니다.",
      "오른쪽 끝 빨간 구간(최대 출력)에 들어왔을 때 멈추세요.",
      "3번 시도하며, 시도할수록 막대가 빨라집니다.",
    ],
    controls: "Space · Enter · 게이지 클릭",
    score: "빨강 100점 · 금색 70점 · 가운데 40점 — 평균 85 이상 완벽, 40 이상 좋음",
  },
  study: {
    game: "quiz",
    title: "야구 규칙 수업",
    how: "교실에서도 야구는 계속됩니다. 선생님의 규칙 퀴즈에 답하세요.",
    steps: ["야구 규칙 문제 3개가 나옵니다.", "보기 3개 중 하나를 고르면 정답이 표시됩니다."],
    controls: "보기 클릭 · 터치",
    score: "3문제 정답 완벽 · 2문제 좋음 — 맞힐수록 컨디션 +2~+6",
  },
};
type GameKind = "aim" | "power" | "memory" | "mash" | "timing" | "quiz" | "charge" | "pace";

export const gradeOf = (q: number) => (q >= 0.85 ? "완벽" : q >= 0.4 ? "좋음" : "아쉬움");

/** Space/Enter as an action key while a minigame runs. */
function useActionKey(active: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) ref.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active]);
}
function useFrame(active: boolean, fn: (t: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      ref.current((now - start) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

const TARGET_LIFE = 1400;
function AimGame({ onEnd }: { onEnd: (q: number) => void }) {
  const TOTAL = 8;
  const [target, setTarget] = useState<{ x: number; y: number; n: number } | null>(null);
  const [hits, setHits] = useState(0);
  const [shown, setShown] = useState(0);
  const hitRef = useRef(0);
  useEffect(() => {
    let n = 0,
      timer = 0;
    const next = () => {
      if (n >= TOTAL) {
        setTarget(null);
        timer = window.setTimeout(() => onEnd(hitRef.current / TOTAL), 400);
        return;
      }
      n++;
      setShown(n);
      setTarget({ x: 14 + Math.random() * 72, y: 14 + Math.random() * 72, n });
      // 1.4 s per target (was 0.95 s: too hard).
      timer = window.setTimeout(next, TARGET_LIFE);
    };
    timer = window.setTimeout(next, 500);
    return () => clearTimeout(timer);
  }, [onEnd]);
  return (
    <div className="mg-stage">
      <div className="mg-zone">
        {target && (
          <button
            key={target.n}
            className="mg-target"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            aria-label="과녁"
            onPointerDown={() => {
              hitRef.current++;
              setHits(hitRef.current);
              setTarget(null);
            }}
          />
        )}
      </div>
      <p className="mg-score">
        명중 <b>{hits}</b> / {shown} · 전체 {TOTAL}구
      </p>
    </div>
  );
}

function PowerGame({ onEnd }: { onEnd: (q: number) => void }) {
  const TRIES = 3;
  const [pos, setPos] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [frozen, setFrozen] = useState(false);
  const speed = useRef(1.4);
  useFrame(!frozen && scores.length < TRIES, (t) => {
    // Triangle wave 0..1, a little faster on every try.
    const v = (t * speed.current) % 2;
    setPos(v < 1 ? v : 2 - v);
  });
  const hit = () => {
    if (frozen || scores.length >= TRIES) return;
    const score = pos >= 0.9 ? 1 : pos >= 0.75 ? 0.7 : pos >= 0.55 ? 0.4 : 0.1;
    const next = [...scores, score];
    setScores(next);
    setFrozen(true);
    window.setTimeout(() => {
      if (next.length >= TRIES) onEnd(next.reduce((a, b) => a + b, 0) / TRIES);
      else {
        speed.current += 0.35;
        setFrozen(false);
      }
    }, 700);
  };
  useActionKey(true, hit);
  return (
    <div className="mg-stage" onPointerDown={hit}>
      <div className="mg-power">
        <i className="mg-power-good" />
        <i className="mg-power-max" />
        <b style={{ left: `${pos * 100}%` }} />
      </div>
      <p className="mg-score">
        {scores.map((s, i) => (
          <span key={i} className={s >= 1 ? "great" : s >= 0.7 ? "good" : ""}>
            {s >= 1 ? "최대 출력!" : s >= 0.7 ? "좋음" : s >= 0.4 ? "보통" : "힘이 빠짐"}
          </span>
        ))}
        {scores.length < TRIES && (
          <span>
            시도 {scores.length + 1} / {TRIES}
          </span>
        )}
      </p>
    </div>
  );
}

function MashGame({ onEnd }: { onEnd: (q: number) => void }) {
  const GOAL = 42,
    TIME = 6;
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(TIME);
  const done = useRef(false);
  const tapsRef = useRef(0);
  useFrame(!done.current, (t) => {
    setLeft(Math.max(0, TIME - t));
    if (t >= TIME && !done.current) {
      done.current = true;
      onEnd(Math.min(1, tapsRef.current / GOAL));
    }
  });
  const tap = () => {
    if (done.current) return;
    tapsRef.current++;
    setTaps(tapsRef.current);
    if (tapsRef.current >= GOAL) {
      done.current = true;
      onEnd(1);
    }
  };
  useActionKey(true, tap);
  return (
    <div className="mg-stage">
      <div className="mg-track">
        <span className="mg-runner" style={{ left: `${Math.min(1, taps / GOAL) * 92}%` }}>
          🏃
        </span>
        <i className="mg-finish" />
      </div>
      <p className="mg-score">
        남은 시간 <b>{left.toFixed(1)}</b>초 · 연타 {taps}
      </p>
      <button className="primary-button mg-big" onPointerDown={tap}>
        달려! (Space)
      </button>
    </div>
  );
}

const GRIPS = ["검지", "중지", "엄지", "손목"];
function MemoryGame({ onEnd }: { onEnd: (q: number) => void }) {
  const ROUNDS = [3, 4, 5];
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState(-1);
  const [input, setInput] = useState<number[]>([]);
  const [msg, setMsg] = useState("순서를 잘 보세요");
  useEffect(() => {
    const s = Array.from({ length: ROUNDS[round] }, () => Math.floor(Math.random() * 4));
    setSeq(s);
    setInput([]);
    setMsg("순서를 잘 보세요");
    let i = 0;
    const id = window.setInterval(() => {
      if (i >= s.length * 2) {
        clearInterval(id);
        setShowing(-1);
        setMsg("이제 따라 누르세요");
        return;
      }
      setShowing(i % 2 === 0 ? s[i / 2] : -1);
      i++;
    }, 520);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const press = (g: number) => {
    if (msg !== "이제 따라 누르세요") return;
    const next = [...input, g];
    setInput(next);
    if (seq[next.length - 1] !== g) {
      setMsg("그립이 틀렸습니다");
      window.setTimeout(() => onEnd(round / ROUNDS.length + 0.05), 700);
      return;
    }
    if (next.length === seq.length) {
      if (round + 1 >= ROUNDS.length) {
        setMsg("완벽한 그립!");
        window.setTimeout(() => onEnd(1), 600);
      } else {
        setMsg("좋아요! 다음 단계");
        window.setTimeout(() => setRound(round + 1), 600);
      }
    }
  };
  return (
    <div className="mg-stage">
      <p className="mg-score">
        단계 <b>{round + 1}</b> / {ROUNDS.length} · {msg}
      </p>
      <div className="mg-grips">
        {GRIPS.map((g, i) => (
          <button
            key={g}
            className={showing === i ? "lit" : ""}
            onClick={() => press(i)}
            aria-label={g}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="mg-dots">
        {seq.map((_, i) => (
          <i key={i} className={i < input.length ? "on" : ""} />
        ))}
      </p>
    </div>
  );
}

function TimingGame({ onEnd }: { onEnd: (q: number) => void }) {
  const SWINGS = 5;
  const [x, setX] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [pitch, setPitch] = useState(0);
  const [swung, setSwung] = useState(false);
  const speed = useRef(0.7);
  const start = useRef(performance.now());
  useEffect(() => {
    start.current = performance.now();
    speed.current = 0.55 + Math.random() * 0.5;
    setSwung(false);
  }, [pitch]);
  useFrame(results.length < SWINGS, () => {
    const t = (performance.now() - start.current) / 1000;
    const nx = t * speed.current;
    setX(nx);
    if (nx > 1.05 && !swung) record(0);
  });
  const record = (score: number) => {
    if (swung) return;
    setSwung(true);
    const next = [...results, score];
    setResults(next);
    window.setTimeout(() => {
      if (next.length >= SWINGS) onEnd(next.reduce((a, b) => a + b, 0) / SWINGS);
      else setPitch((p) => p + 1);
    }, 550);
  };
  const swing = () => {
    if (swung || results.length >= SWINGS) return;
    const d = Math.abs(x - 0.75);
    record(d < 0.035 ? 1 : d < 0.08 ? 0.7 : d < 0.14 ? 0.35 : 0);
  };
  useActionKey(true, swing);
  const last = results.at(-1);
  return (
    <div className="mg-stage" onPointerDown={swing}>
      <div className="mg-lane">
        <i className="mg-lane-zone" />
        <b style={{ left: `${Math.min(1.05, x) * 100}%` }} />
      </div>
      <p className="mg-score">
        {swung && last !== undefined && (
          <span className={last >= 1 ? "great" : last >= 0.7 ? "good" : ""}>
            {last >= 1 ? "정타!" : last >= 0.7 ? "잘 맞음" : last > 0 ? "빗맞음" : "헛스윙"}
          </span>
        )}
        <span>
          {Math.min(results.length + 1, SWINGS)} / {SWINGS}구
        </span>
      </p>
    </div>
  );
}

/** Space/Enter held down (true) or released (false) while a minigame runs. */
function useHoldKey(active: boolean, fn: (down: boolean) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const h = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) ref.current(down);
      }
    };
    const d = h(true),
      u = h(false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, [active]);
}

/** Squat: hold to build power (faster and faster), let go inside the green zone. */
function ChargeGame({ onEnd }: { onEnd: (q: number) => void }) {
  const SETS = 3,
    FULL = 1.8; // seconds to fill the gauge from empty
  const zones = [
    [0.72, 0.92],
    [0.75, 0.91],
    [0.78, 0.9],
  ];
  const [level, setLevel] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [holding, setHolding] = useState(false);
  const [pause, setPause] = useState(false);
  const since = useRef(0);
  const levelRef = useRef(0);
  const set = scores.length,
    [lo, hi] = zones[Math.min(set, SETS - 1)];
  const finish = (score: number) => {
    setHolding(false);
    const next = [...scores, score];
    setScores(next);
    setPause(true);
    window.setTimeout(() => {
      if (next.length >= SETS) onEnd(next.reduce((a, b) => a + b, 0) / SETS);
      else {
        levelRef.current = 0;
        setLevel(0);
        setPause(false);
      }
    }, 750);
  };
  useFrame(holding, () => {
    const t = (performance.now() - since.current) / 1000,
      v = Math.min(1, (t / FULL) ** 1.7);
    levelRef.current = v;
    setLevel(v);
    if (v >= 1) finish(0.05);
  });
  const press = (down: boolean) => {
    if (pause || scores.length >= SETS) return;
    if (down && !holding) {
      since.current = performance.now();
      setHolding(true);
    } else if (!down && holding) {
      const v = levelRef.current,
        mid = (lo + hi) / 2;
      finish(
        v >= lo && v <= hi
          ? Math.abs(v - mid) < (hi - lo) * 0.3
            ? 1
            : 0.7
          : v >= lo - 0.12 && v < lo
            ? 0.4
            : 0.1,
      );
    }
  };
  useHoldKey(true, press);
  const last = scores.at(-1);
  return (
    <div className="mg-stage">
      <div className="mg-meter">
        <i
          className="mg-meter-zone"
          style={{ left: `${lo * 100}%`, right: `${(1 - hi) * 100}%` }}
        />
        <i className="mg-meter-over" />
        <b className="mg-meter-fill" style={{ width: `${level * 100}%` }} />
      </div>
      <p className="mg-score">
        {pause && last !== undefined && (
          <span className={last >= 1 ? "great" : last >= 0.7 ? "good" : ""}>
            {last >= 1
              ? "폭발!"
              : last >= 0.7
                ? "좋음"
                : last >= 0.4
                  ? "조금 모자람"
                  : last > 0.06
                    ? "힘이 빠짐"
                    : "과부하!"}
          </span>
        )}
        <span>
          세트 {Math.min(set + 1, SETS)} / {SETS}
        </span>
      </p>
      <button
        className="primary-button mg-big"
        onPointerDown={() => press(true)}
        onPointerUp={() => press(false)}
        onPointerLeave={() => press(false)}
      >
        {holding ? "버티는 중… 떼면 밀어 올리기" : "누르고 있기 (Space)"}
      </button>
    </div>
  );
}

/** Distance run: hold to speed up, let go to ease off; stay inside the drifting pace band. */
function PaceGame({ onEnd }: { onEnd: (q: number) => void }) {
  const TIME = 10,
    WIDTH = 0.2;
  const [speed, setSpeed] = useState(0.3);
  const [band, setBand] = useState(0.5);
  const [left, setLeft] = useState(TIME);
  const [inside, setInside] = useState(0);
  const st = useRef({ speed: 0.3, holding: false, last: 0, inside: 0, done: false });
  useFrame(!st.current.done, (t) => {
    const r = st.current,
      dt = r.last ? Math.min(0.05, t - r.last) : 0;
    r.last = t;
    r.speed = Math.min(1, Math.max(0, r.speed + (r.holding ? 0.55 : -0.42) * dt));
    // The band drifts slowly between about 35% and 70%.
    const b = 0.52 + Math.sin(t * 0.7) * 0.12 + Math.sin(t * 1.9 + 1) * 0.05;
    if (Math.abs(r.speed - b) <= WIDTH / 2) r.inside += dt;
    setSpeed(r.speed);
    setBand(b);
    setInside(r.inside);
    setLeft(Math.max(0, TIME - t));
    if (t >= TIME && !r.done) {
      r.done = true;
      onEnd(Math.min(1, r.inside / TIME / 0.8));
    }
  });
  const hold = (down: boolean) => {
    st.current.holding = down;
  };
  useHoldKey(true, hold);
  const ok = Math.abs(speed - band) <= WIDTH / 2;
  return (
    <div className="mg-stage">
      <div className="mg-meter">
        <i
          className="mg-meter-zone"
          style={{
            left: `${(band - WIDTH / 2) * 100}%`,
            right: `${(1 - band - WIDTH / 2) * 100}%`,
          }}
        />
        <b className={`mg-meter-needle ${ok ? "ok" : ""}`} style={{ left: `${speed * 100}%` }} />
      </div>
      <p className="mg-score">
        <span className={ok ? "good" : ""}>
          {ok ? "좋은 페이스" : speed > band ? "너무 빨라요" : "너무 느려요"}
        </span>
        <span>
          남은 시간 <b>{left.toFixed(1)}</b>초 · 구간 안 {Math.round((inside / TIME) * 100)}%
        </span>
      </p>
      <button
        className="primary-button mg-big"
        onPointerDown={() => hold(true)}
        onPointerUp={() => hold(false)}
        onPointerLeave={() => hold(false)}
      >
        누르면 빨라지고 떼면 느려져요 (Space)
      </button>
    </div>
  );
}

const QUIZ = [
  { q: "스트라이크를 3개 받으면?", a: ["삼진 아웃", "볼넷", "파울"], ok: 0 },
  { q: "볼을 4개 고르면 타자는?", a: ["아웃", "1루로 진루", "타석 유지"], ok: 1 },
  { q: "뜬공을 땅에 닿기 전에 잡으면?", a: ["타자 아웃", "2루타", "파울"], ok: 0 },
  { q: "2스트라이크에서 친 파울(번트 제외)은?", a: ["삼진", "카운트 유지", "볼"], ok: 1 },
  { q: "포스 아웃이 되려면?", a: ["주자를 태그", "공이 베이스에 먼저 도착", "심판 판단"], ok: 1 },
  {
    q: "뜬공 아웃 뒤 3루 주자가 홈으로 가려면?",
    a: ["바로 출발", "포구 후 태그업", "갈 수 없다"],
    ok: 1,
  },
  { q: "커브의 가장 큰 특징은?", a: ["큰 낙차", "가장 빠른 구속", "직선 궤적"], ok: 0 },
  {
    q: "체인지업의 목적은?",
    a: ["구속으로 압도", "직구와 같은 폼으로 타이밍 뺏기", "타자 맞히기"],
    ok: 1,
  },
  { q: "주자가 루를 도는 순서는?", a: ["홈→3루→2루→1루", "홈→1루→2루→3루→홈", "아무 순서"], ok: 1 },
];
function QuizGame({ onEnd }: { onEnd: (q: number) => void }) {
  const [qs] = useState(() => [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 3));
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = qs[i];
  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const c = correct + (k === q.ok ? 1 : 0);
    setCorrect(c);
    window.setTimeout(() => {
      if (i + 1 >= qs.length) onEnd(c / qs.length);
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 800);
  };
  return (
    <div className="mg-stage">
      <p className="mg-score">
        문제 <b>{i + 1}</b> / {qs.length} · 정답 {correct}
      </p>
      <h3 className="mg-question">{q.q}</h3>
      <div className="mg-answers">
        {q.a.map((a, k) => (
          <button
            key={a}
            className={picked === null ? "" : k === q.ok ? "right" : k === picked ? "wrong" : ""}
            onClick={() => pick(k)}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Wraps a training in its minigame; onFinish receives quality 0–1. */
export function TrainingMinigame({
  kind,
  name,
  onFinish,
  onCancel,
}: {
  kind: string | null;
  name: string;
  onFinish: (quality: number) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [quality, setQuality] = useState(0);
  const info = kind ? TRAINING_GAMES[kind] : null;
  useEffect(() => {
    setPhase("intro");
    setQuality(0);
  }, [kind]);
  const end = useRef((q: number) => {
    setQuality(q);
    setPhase("done");
  }).current;
  if (!info) return null;
  const Game = {
    aim: AimGame,
    power: PowerGame,
    memory: MemoryGame,
    mash: MashGame,
    timing: TimingGame,
    quiz: QuizGame,
    charge: ChargeGame,
    pace: PaceGame,
  }[info.game];
  return (
    <Dialog
      open={!!kind}
      onOpenChange={(v) => {
        if (!v && phase === "intro") onCancel();
      }}
    >
      <DialogContent className="minigame-dialog" showCloseButton={phase === "intro"}>
        <DialogHeader>
          <DialogTitle>
            {name} · {info.title}
          </DialogTitle>
          <DialogDescription>{info.how}</DialogDescription>
        </DialogHeader>
        {phase === "intro" && (
          <div className="mg-intro">
            <ol className="mg-steps">
              {info.steps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            <dl className="mg-rules">
              <dt>조작</dt>
              <dd>{info.controls}</dd>
              <dt>채점</dt>
              <dd>{info.score}</dd>
              <dt>비용</dt>
              <dd>행동력 1 · 체력 (훈련을 마쳤을 때 차감, 시작 전 취소는 무료)</dd>
            </dl>
            <button className="primary-button" onClick={() => setPhase("play")}>
              훈련 시작
            </button>
            <button className="subtle-button" onClick={onCancel}>
              다른 훈련 고르기
            </button>
          </div>
        )}
        {phase === "play" && <Game onEnd={end} />}
        {phase === "done" && (
          <div className="mg-result">
            <span className={`mg-grade grade-${gradeOf(quality)}`}>{gradeOf(quality)}</span>
            <p>훈련 점수 {Math.round(quality * 100)}점</p>
            <button className="primary-button" onClick={() => onFinish(quality)}>
              훈련 마치기
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
