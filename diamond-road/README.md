# Diamond Road — Claude 개발 인수인계

고교 투수에서 시작하는 3D 야구 커리어 게임입니다. **실행 가능한 웹 점검판 v03**, **Unity 마우스 투구 C# 패키지**, **원래 전체 기획**을 함께 보관했습니다. 정리 기준일은 2026-09-29입니다.

## 먼저 할 일

1. ZIP을 압축 해제합니다.
2. **Claude에 `CLAUDE_START_HERE.md`를 먼저 보여 주세요.** 파일 안의 첫 지시문을 복사하면 됩니다.
3. 웹 게임을 직접 실행하려면 아래 명령을 사용합니다. Unity를 이어 만들 때는 `docs/UNITY_KIT.md`를 봅니다.

## Windows에서 웹 게임 실행

Node.js 24를 준비합니다. 설치되어 있다면 터미널에서 `node --version`으로 확인합니다. 처음 설치한 뒤에는 터미널을 새로 열어 주세요.

압축을 푼 `diamond-road-claude` 폴더에서 터미널을 열고:

```powershell
cd web
npm ci
npm run dev
```

브라우저에서 **http://localhost:5173** 을 엽니다. 종료는 터미널에서 `Ctrl+C`입니다. 다음부터는 `web` 폴더에서 `npm run dev`만 실행합니다. 최초 패키지 설치에는 인터넷이 필요합니다. 실행에 API 키, ChatGPT 계정, Claude 계정이나 유료 서버는 필요하지 않습니다.

PowerShell이 `npm.ps1` 실행 정책으로 막으면 **명령 프롬프트(cmd)** 에서 실행하거나 명령의 `npm`을 `npm.cmd`로 바꿉니다. 전역 실행 정책을 변경할 필요는 없습니다. `5173` 포트를 쓰는 다른 프로그램이 있으면 해당 개발 서버를 종료한 뒤 다시 시작합니다.

`index.html` 더블클릭 실행은 지원하지 않습니다. 웹 게임은 위 개발 서버나 빌드 결과를 제공하는 HTTP 서버로 엽니다.

## 들어 있는 것

| 경로 | 용도 |
|---|---|
| `CLAUDE_START_HERE.md` | Claude 채팅에 처음 보여 줄 요약과 첫 지시문 |
| `CLAUDE.md` → `AGENTS.md` | Claude Code가 읽을 짧은 작업 규칙 |
| `web/` | 일반 Vite + React 웹 게임 소스, 잠금 파일, 27개 규칙 검사 |
| `unity/PitchingMouseMVP/` | C# 8개, 자동 씬 생성기, Inspector 안내와 수치 검사 |
| `docs/PROJECT_STATE.md` | 지금 구현된 범위와 미구현 범위 |
| `docs/ARCHITECTURE.md` | 수정할 파일·함수, 좌표와 판정 규칙 |
| `docs/ROADMAP.md` | 단계별 다음 작업, 원래 기획 0–56 대응표 |
| `docs/TESTING.md` / `VALIDATION.md` | 다시 검사하는 방법 / 이번 실제 검사 결과 |
| `docs/KNOWN_LIMITS.md` | 단순화한 부분과 남은 위험 |
| `docs/history/` | 원래 기획, 예전 구현 안내, 이전 스크립트 참고본 |
| `provenance.json` / `MANIFEST.sha256` | 출처와 전달 파일 무결성 정보 |

Unity 전체 프로젝트는 아닙니다. 사용자의 실제 `Assets`, `Packages`, `ProjectSettings`와 현재 씬은 이 패키지에서 확인되지 않았습니다. 웹의 모든 기능이 Unity에도 구현되어 있다고 해석하면 안 됩니다.

## 웹 점검 명령

모두 `web` 폴더에서 실행합니다.

```powershell
npm test
npm run typecheck
npm run build
npm run preview
```

마지막 명령은 빌드 결과를 http://localhost:4173 에서 보여 줍니다. 각 서버는 별도 터미널로 실행하거나 먼저 `Ctrl+C`로 종료합니다.

## 플레이

- 오른쪽 조준판에서 마우스로 목표를 정하고 클릭해 투구합니다. `1–4`로 구종을 고릅니다.
- 타격할 때는 흰 공에 조준하고 도착 직전에 클릭/Space로 스윙합니다.
- 3아웃 후 화면의 이닝 진행 버튼으로 공수를 바꿉니다. 불펜과 배팅 케이지도 있습니다.
- 설정에서 자동 수비를 끄면 WASD 이동, 인플레이 중 `1–4`로 송구 베이스를 선택합니다.
- `P` 일시 정지, `C` 카메라, `E` 도루, `R` 다음 공/연습 초기화입니다.

선수 기록은 브라우저의 `localStorage`에 저장됩니다. **기존 웹사이트와 localhost는 저장 공간이 달라 기록이 자동으로 따라오지 않습니다.** 기존 사이트와 그 기록을 지우지 않았습니다. 진행 중인 경기 전체를 이어 불러오는 기능은 없습니다.

기존 점검 사이트: https://diamond-road-baseball.gangjip0924.chatgpt.site

## 적은 대화량으로 이어 개발하기

처음에는 시작 안내와 `PROJECT_STATE.md`만 읽고, 수정할 기능에 필요한 파일만 추가로 읽게 하세요. 과거 전체 기획과 이전 코드까지 매번 읽을 필요는 없습니다. 한 작업이 끝나면 `docs/SESSION_NOTE_TEMPLATE.md` 형식으로 현재 상태를 남기면 됩니다.

## 실행 환경 변경 사항

기존의 Sites/Vinext 실행 껍데기를 표준 Vite 진입점으로 바꿨습니다. 게임 코드와 한국어 화면은 유지하고 코드를 포맷했습니다. 기존 사이트 재배포, 게임 규칙 추가/삭제, Unity 자동 설치는 하지 않았습니다. 세부 변경은 `docs/CHANGELOG.md`에 있습니다.
