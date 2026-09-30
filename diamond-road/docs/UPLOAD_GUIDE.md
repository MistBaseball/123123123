# Claude에 전달하는 순서

## 로컬 파일을 읽을 수 있는 Claude

압축을 푼 프로젝트 폴더를 연다. 루트 `CLAUDE.md`는 `AGENTS.md`를 참조한다. `CLAUDE_START_HERE.md`의 지시문을 보낸 뒤 필요한 파일만 읽게 한다. 모든 소스와 과거 기획을 한 번에 대화창에 복사할 필요는 없다.

## Claude 웹 채팅 또는 프로젝트

Claude가 ZIP을 항상 풀어 읽거나 사용자 PC를 직접 수정할 수 있다고 가정하지 않는다. 압축을 풀어 텍스트 문서와 필요한 소스 파일을 첨부한다. UI와 허용되는 업로드 범위는 사용하는 환경에 따라 다르다.

처음 첨부할 3개:

1. `CLAUDE_START_HERE.md`
2. `AGENTS.md`
3. `docs/PROJECT_STATE.md`

수정 목적에 맞춰 추가한다.

| 작업 | 추가 파일 |
|---|---|
| 주루/포스/플라이/득점 | `engine.ts`, `check-game.mjs`, `ARCHITECTURE.md` |
| 화면 조작/움직임 범위 | 위 엔진 + `DiamondGame.tsx`, `globals.css` |
| 카메라/3D 방향 | 엔진 + `field.ts`, `software-field.ts` |
| Unity 마우스 투구 | `UNITY_KIT.md`, 패키지 `README_KO.md`, Runtime C# 6개, 관련 Editor C# |
| 새로운 커리어 기능 기획 | `ROADMAP.md`, 필요하면 원래 기획 원문 |
| 실행 오류 | `package.json`, 오류 전문, 관련 파일, 사용 OS와 Node/Unity 버전 |

각 파일 경로는 `README.md`나 `ARCHITECTURE.md`에서 찾는다. 업로드가 불가능한 확장자는 내용을 텍스트로 전달하면서 **원래 경로·확장자**를 함께 적는다. 기존 파일을 없애거나 중복된 이름으로 Unity Assets에 넣지 않는다.

Claude 웹에서 코드를 답변받을 때는 “어느 경로의 파일을 교체하는지, 생략 없는 전체 파일 또는 적용 가능한 patch, 재현·검사 방법”을 요청한다. 실행 도구가 없는데 빌드가 통과했다는 답변은 실제 실행 기록으로 취급하지 않는다.

## Unity 전체 프로젝트가 필요해지는 시점

새 기능을 기존 씬에 실제 연결하려면 사용자의 현재 프로젝트 증거가 필요하다. 먼저 버전 파일, package manifest, 관련 스크립트·씬·프리팹·Console 오류를 제공한다. 나중에 소스 전체를 전달한다면 `Assets`의 `.meta`를 함께 보존하고 `Packages`, `ProjectSettings`를 포함한다. Unity가 다시 만드는 `Library`, `Temp`, `Obj`, `Logs` 같은 캐시는 개발 소스 전달에 필요하지 않다. 기존 프로젝트에서 삭제하라는 뜻은 아니다.

## 저장 기록

기존 웹 사이트의 localStorage는 이 ZIP 안에 없다. 새 origin에 자동 이사되지 않는다. 기록 이관이 필요하면 원본을 보존한 뒤 명시적으로 별도 작업을 요청한다.

공식 참고: https://code.claude.com/docs/en/memory , https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
