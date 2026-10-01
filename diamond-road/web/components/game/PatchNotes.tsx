/**
 * In-game patch notes (button next to the logo). Player-facing summary of docs/CHANGELOG.md,
 * newest first. Secrets stay secret: hidden unlock conditions and the developer password are
 * never written here.
 */
import { useState } from "react";
import { ScrollText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Patch = { version: string; date: string; title: string; items: string[] };

export const PATCHES: Patch[] = [
  {
    version: "v10.5",
    date: "10/02",
    title: "승률 밸런스 패치",
    items: [
      "보통 실력으로 플레이하면 약 45% 정도 이기도록 맞췄습니다(전에는 약 25%).",
      "상대 타자의 홈런이 줄었습니다(공 3~4개 중 1개꼴로 담장을 넘기던 강한 타구 감소).",
      "우리 타자들의 타구 질이 단계별로 조금씩 좋아졌습니다(2군에서 가장 많이).",
      "점수가 더 나서 무승부가 줄었습니다.",
    ],
  },
  {
    version: "v10.4",
    date: "10/02",
    title: "패치노트",
    items: ["로고 옆 버튼으로 지금까지의 업데이트 내역을 버전별로 볼 수 있습니다."],
  },
  {
    version: "v10.3",
    date: "10/02",
    title: "다이빙·점프 캐치 준비 동작",
    items: [
      "수비수가 공이 오기 전에 미리 판단해 웅크리고 뛰어오르거나, 달려들어 몸을 날립니다.",
      "다이빙할 때 공중으로 날아가 떨어집니다(순간이동 없음).",
      "공이 글러브로 자연스럽게 들어갑니다.",
      "이미 도착해서 기다리는 뜬공은 점프하지 않고 그냥 잡습니다.",
    ],
  },
  {
    version: "v10.2",
    date: "10/02",
    title: "접전 리플레이 · 백업 수비",
    items: [
      "베이스에서 아슬아슬한 접전이 나오면 TV 창에서 슬로 모션으로 다시 보여 주고 아웃/세이프를 판정합니다.",
      "리플레이가 끝날 때까지 다음 타자·공수 교대 화면이 기다립니다.",
      "베이스가 두툼한 쿠션 모양으로 바뀌었습니다.",
      "땅볼이 내야를 빠져나가면 외야수가 공을 맡습니다(투수가 외야까지 쫓아가지 않음).",
      "헛스윙 동작이 자연스러워졌습니다.",
      "송구 직전 공이 엉뚱한 곳에 그려지던 버그를 고쳤습니다.",
    ],
  },
  {
    version: "v10.1",
    date: "10/02",
    title: "하이라이트 리플레이 · 타격 장면",
    items: [
      "다이빙 캐치·점프 캐치·호수비가 나오면 왼쪽 아래 TV 창에서 슬로 모션으로 다시 보여 줍니다.",
      "공이 오는 동안 타자가 준비 동작을 하고, 배트가 공에 맞는 순간과 스윙이 맞습니다.",
      "친 뒤 팔로스루를 보여 주고 그 자리에서 1루로 달려 나갑니다.",
      "수비수가 공을 잡고 다시 던질 때 공 꼬리가 꺾이던 문제를 고쳤습니다.",
    ],
  },
  {
    version: "v10",
    date: "10/02",
    title: "진짜 사람 선수 모델",
    items: [
      "모든 선수가 실제 사람 3D 모델과 동작으로 바뀌었습니다(투구·스윙·번트·포구·송구·달리기·슬라이딩 등 18가지).",
      "글러브와 배트를 들고, 홈/원정 유니폼 색이 다릅니다.",
      "새 수비 플레이: 다이빙 캐치, 점프 캐치, 땅볼 다이빙. 수비 능력과 날씨에 따라 성공률이 달라집니다.",
    ],
  },
  {
    version: "v09",
    date: "10/01",
    title: "결정구 · 비 · 한계 돌파 개편",
    items: [
      "결정구 구종(스플리터·포크볼·스위퍼·너클 커브·슬러브)은 상대 타자가 맞히기 어렵습니다.",
      "가끔 비가 옵니다. 제구·구속·수비·주루가 모두 나빠지고, 이닝마다 동전 던지기로 우천취소가 될 수 있습니다. 설정에서 끌 수 있습니다.",
      "한계 돌파는 다음 공 하나만 모든 능력치 300(경기당 3번 무료, 이후 체력 소모).",
      "폭투와 풀카운트를 화면 가운데 크게 알려 줍니다.",
      "메이저리그 구단과 선수 이름은 영어로 표기합니다.",
    ],
  },
  {
    version: "v08",
    date: "10/01",
    title: "2군 → 1군 → 메이저리그",
    items: [
      "프로 입단 후 2군에서 시작해 1군 신뢰도를 채우면 1군으로 올라갑니다. 단계마다 상대가 강해집니다.",
      "1군에서는 메이저리그 4개 구단 스카우트가 동시에 평가합니다. 원하는 구단을 고르거나, 모두 거절하고 국내에 남을 수도 있습니다.",
      "메이저리그는 하드 모드 · 무한 모드입니다.",
      "스킬 T 응원: 한 이닝 동안 상대 능력치를 낮춥니다(프로부터, 경기당 1번).",
      "스킬 G 한계 돌파: 모든 능력치 250을 찍으면 열립니다.",
      "1루를 이미 돈 타자가 무조건 2루까지 가던 버그를 고쳤습니다.",
    ],
  },
  {
    version: "v07.3",
    date: "10/01",
    title: "새 구종 3종",
    items: [
      "스크류볼, 팜볼, 이퓨스볼(초슬로 커브)이 상점과 룰렛에 추가되었습니다.",
      "설정 맨 아래에 게임 버전이 표시되고, 새 버전이 올라오면 새로고침 알림이 뜹니다.",
    ],
  },
  {
    version: "v07.2",
    date: "10/01",
    title: "히든 요소 · 이름표 · 팀 성장",
    items: [
      "어딘가에 히든 구종과 히든 시작이 숨어 있습니다. 조건은 비밀!",
      "구속 차이가 더 잘 보이고, 빠른 공일수록 꼬리가 길고 밝습니다.",
      "나는 1번 타자, 2~9번은 동료가 자기 능력치로 타석에 섭니다.",
      "수비수 머리 위에 이름이 보이고, 수비수 능력치가 수비에 적용됩니다.",
      "내가 성장하면 팀 동료들도 함께 강해집니다.",
      "투구·스윙 동작이 부드러워지고 스윙할 때 몸이 떨리던 문제를 고쳤습니다.",
    ],
  },
  {
    version: "v07.1",
    date: "10/01",
    title: "미산고 동료 · 경험치 상향",
    items: [
      "개성 넘치는 미산고 동료 8명이 생겼습니다.",
      "경기가 끝나면 스카우트 평가와 경험치를 이유별로 보여 줍니다.",
      "얻는 경험치가 크게 늘었습니다.",
      "던지기 버튼을 없애고 조준판 클릭 또는 Space로 던집니다.",
    ],
  },
  {
    version: "v07",
    date: "10/01",
    title: "튜토리얼 · 능력치 200 · 주력",
    items: [
      "하루 화면, 첫 투구, 첫 타석을 차근차근 알려 주는 튜토리얼(P로 끄기).",
      "능력치 상한: 고교 100, 프로 200. 구속 200이면 170 km/h.",
      "새 능력치 주력과 스프린트 훈련.",
      "상대 고등학교 12곳이 날마다 바뀝니다.",
    ],
  },
  {
    version: "v06",
    date: "10/01",
    title: "3D 경기장",
    items: [
      "하늘·햇빛·잔디·흙, 관중 약 4천 명이 있는 경기장, 전광판과 조명탑.",
      "팔꿈치·무릎이 있는 선수가 실제처럼 던지고 칩니다.",
    ],
  },
  {
    version: "v05",
    date: "10/01",
    title: "주루 규칙 · 프로 모드 · 구종 확장",
    items: [
      "사구, 폭투, 견제(F), 도루(E)가 생겼습니다.",
      "뜬공이 잡히면 주자가 귀루하고, 늦으면 병살이 됩니다.",
      "꿈의 구단에 입단하면 같은 선수로 프로 모드가 이어집니다.",
      "구종이 10개로 늘었고, 내 능력치가 실제로 무엇을 바꾸는지 훈련 화면에서 보여 줍니다.",
      "타격 스타일(컨택·강타·번트)이 확실히 달라졌습니다.",
    ],
  },
  {
    version: "v04",
    date: "09/30",
    title: "하루 일정 · 꿈의 구단 · 훈련 미니게임",
    items: [
      "하루 = 아침 훈련(행동력 5) → 오후 경기 → 밤 정산.",
      "꿈의 구단을 고르고 스카우트 평가 100을 채우면 입단합니다.",
      "선수 생성, 은총 룰렛으로 시작 구종 받기, 경험치로 구종 상점에서 구종 구입.",
      "훈련 미니게임 6종.",
      "공이 올 범위와 타이밍 게이지로 치기 쉬워졌습니다.",
    ],
  },
  {
    version: "v03",
    date: "~09/29",
    title: "첫 버전",
    items: ["투구·타격·주루·수비·이닝이 있는 기본 야구 게임."],
  },
];

export const LATEST = PATCHES[0].version;
const SEEN_KEY = "diamond-road-patch-seen";

function seenVersion() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function PatchNotesButton() {
  const [open, setOpen] = useState(false),
    [seen, setSeen] = useState(seenVersion);
  const fresh = seen !== LATEST;
  return (
    <>
      <button
        className="patch-button"
        onClick={() => {
          setOpen(true);
          setSeen(LATEST);
          try {
            localStorage.setItem(SEEN_KEY, LATEST);
          } catch {
            /* private mode: the dot just shows again next time */
          }
        }}
        aria-label="패치노트 보기"
      >
        <ScrollText size={15} />
        <span>
          패치노트 <b>{LATEST}</b>
        </span>
        {fresh && <i className="patch-dot" aria-label="새 업데이트" />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="patch-dialog">
          <DialogHeader>
            <DialogTitle>패치노트</DialogTitle>
            <DialogDescription>
              지금까지의 업데이트 내역 · 최신 버전이 위에 있어요.
            </DialogDescription>
          </DialogHeader>
          <ol className="patch-list">
            {PATCHES.map((p, i) => (
              <li key={p.version} className={i === 0 ? "latest" : undefined}>
                <header>
                  <span className="patch-version">{p.version}</span>
                  <strong>{p.title}</strong>
                  <time>{p.date}</time>
                </header>
                <ul>
                  {p.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
