# 검증 기록

## 2026-10-01 — v05 (Linux, Node.js 22.22.2)

| 검사 | 실제 결과 |
|---|---|
| 게임 규칙 | `npm test`: 45/45 통과(시나리오 A–M 포함) |
| TypeScript / 빌드 | `npm run typecheck` 오류 없음, `npm run build` 성공(Three.js chunk 500 kB 경고만) |
| 포맷 | Prettier 검사 통과 |
| 브라우저 | Playwright Chromium으로 production 빌드 확인: 입단식 엔딩 대화상자 → "프로 무대로" → 프로 일정 화면(1군 신뢰도 30), 저장 `stage: pro` 유지, 프로 경기 화면(구단 이름·10구종 상점). 콘솔/페이지 오류 없음 |

브라우저에서 견제·E 도루·폭투·사구 장면을 마우스로 직접 재현하지는 못했다. 해당 규칙은 엔진 시나리오 검사로 확인했다. Unity는 이번 작업 대상이 아니며 실행하지 않았다. 출력은 `validation-logs/web-checks.txt`.

---

# 인수인계판 검증 — 2026-09-29

검사 대상은 `diamond-road-claude/web`와 함께 전달하는 Unity 투구 패키지다. 환경은 Linux, Node.js 24.19.0, npm 11.9.0이다. 사용자의 Windows Unity 환경에서 실행한 결과가 아니다.

## 통과한 검사

| 검사 | 실제 결과 |
|---|---|
| 독립 의존성 설치 | 새 프로젝트에서 npm install 및 `npm ci --ignore-scripts` 성공, package-lock과 package.json 일치 |
| 게임 규칙 | `npm test`: 27/27 통과, 시드 고정 전체 경기 6회 포함 |
| TypeScript | `npm run typecheck`: 오류 없음, build 단계에서도 검사 |
| 웹 production 빌드 | `npm run build`: 성공, index/CSS/메인·3D·호환 렌더 chunk 생성 |
| Vite 개발 진입점 | `/`, `/src/main.tsx`, `/components/game/DiamondGame.tsx`, `/app/globals.css` 모두 HTTP 200 |
| 포맷 전후 소스 | 복사한 TS/TSX/MJS 14개가 원본에 같은 Prettier 설정을 적용한 결과와 일치 |
| 핵심 로직 보존 | engine/Three.js renderer/Canvas renderer 3개의 정규화한 JavaScript 구문 트리 일치 |
| 원본 자료 보존 | Unity 패키지·과거 자료·vendor/favicon 총 17개 파일이 출처 SHA-256과 동일 |
| Unity 독립 수치 검사 | 1,090 궤적, 5,450 FPS/도착 검사, 잘못된 입력 7개 통과 |
| 기존 사이트 소스 | 원본 HEAD 유지, 작업 트리 변경 없음 |

웹 최종 검사 출력은 `validation-logs/web-checks.txt`에 포함했다. 구문 트리 비교는 문법적 비교이며 모든 브라우저의 동작을 증명하는 형식 검증은 아니다. JSX 포맷은 화면 텍스트의 공백을 보존하도록 Prettier가 처리했다.

Unity 독립 float32 수치 검사:

```text
PASS: 1090 trajectories; 5450 FPS/endpoint checks; 7 invalid inputs.
Maximum unsnapped endpoint residual: 0.000626 mm
Maximum initial-speed error: 0.00001526 km/h
Default centre-target flight time: 0.498631 s
Unity compilation, scene generation, rendering and real input: NOT RUN.
```

## 경고와 실행하지 못한 것

- Vite가 Three.js 렌더 chunk 약 567 kB(minified, gzip 약 145 kB)에 대해 500 kB 경고를 냈다. 빌드는 성공했다. 렌더러는 동적 import되어 있고 이번 전달 작업에서 추가 번들 분할은 하지 않았다.
- 환경의 npm proxy 설정에 대한 경고가 있었지만 설치/검사/빌드를 막지 않았다. 해당 환경 설정을 전달 패키지에 복사하지 않았다.
- 로컬 Playwright 시각 검사를 시도했으나 Chromium 실행 파일이 없어 시작하지 못했다. **이번 독립 Vite 복사본의 실제 브라우저 렌더링·마우스 조작을 통과했다고 주장하지 않는다.** 개발 서버와 모듈/CSS 제공, 타입·규칙·빌드까지 확인했다.
- 실제 Windows의 Unity C# 컴파일, 씬 생성, 입력, Play Mode, Windows 빌드, 저사양 GPU 성능은 실행하지 않았다.
- 독립 Python 수치 검사는 C# 실행이 아니다. C# 검사 메뉴를 실제 Unity에서 실행해야 한다.
- 기존 사이트/브라우저의 선수 저장 데이터는 읽거나 이관하지 않았다. 저장 키·스키마를 보존했다.

## 사용자가 이어 확인할 최소 항목

웹은 `README.md`의 실행 후 `TESTING.md`의 조작 체크리스트를 확인한다. Unity는 `UNITY_KIT.md`의 복사/생성/검사 순서를 따르고 패키지 `README_KO.md`의 16개 직접 테스트를 실행한다.

이번 작업은 개발 인수인계와 실행 환경 정리다. 완전한 Unity 야구 게임 출시 준비 완료를 뜻하지 않는다.
