# Unity 인수인계: 완성 프로젝트가 아닌 투구 패키지

이 문서는 Unity 프로젝트 온보딩 기준으로 **실제로 확보한 파일만** 정리한다. 프로젝트 루트의 `Packages/manifest.json`과 `ProjectSettings/ProjectVersion.txt`를 확보하지 않았으므로 전체 프로젝트 분석·컴파일 완료로 간주하지 않는다.

## 들어 있는 패키지

경로: `unity/PitchingMouseMVP/`

| 파일 | 역할 / 붙이는 위치 |
|---|---|
| `Runtime/PitchTrajectory.cs` | 순수 투구 수학, 부착하지 않음 |
| `Runtime/PitchAimPlane.cs` | 화면 광선→목표면, AimPlane |
| `Runtime/PitchInputReader.cs` | 좌클릭/R, PitchingSystem |
| `Runtime/PitchBallMotor.cs` | 공 위치 단일 소유자, Baseball |
| `Runtime/PitchingController.cs` | 참조·설정·상태 전환, PitchingSystem |
| `Runtime/PitchHud.cs` | 구속·오차·투구 상태, PitchingSystem |
| `Editor/PitchMvpSceneBuilder.cs` | 씬/에셋 생성 메뉴, 부착하지 않음 |
| `Editor/PitchMvpChecks.cs` | 수학·입력 좌표·씬 참조 검사 메뉴, 부착하지 않음 |

위 Runtime/Editor 경로는 패키지 내부 `Assets/PitchingMouseMVP/` 아래다. namespace는 `Baseball.PitchingMvp`, Editor 코드는 `.Editor`다.

## 기존 Unity 프로젝트에 넣기

1. 사용자의 실제 프로젝트와 현재 Console 오류부터 확인한다. 보존할 작업을 저장하고 소스 백업 또는 버전 관리를 확보한다.
2. 이 패키지 안의 **`Assets/PitchingMouseMVP` 폴더만** 실제 프로젝트의 `Assets` 아래로 복사한다. 이미 있다면 같은 패키지를 중복 설치하지 말고 비교한다.
3. 컴파일 후 `Tools > Baseball MVP > 1. Create Mouse Pitch Scene`을 실행한다.
4. `Tools > Baseball MVP > 2. Run Math and Scene Checks`를 실행한다.
5. Play를 누르고 패키지 `README_KO.md`의 16개 직접 실행 테스트를 확인한다.

자동 생성기는 `Assets/PitchingMouseMVP/Generated/MousePitch/MousePitchMVP.unity`를 생성한다. 같은 결과가 있으면 고유한 새 폴더를 사용한다. 기존 씬·입력/그래픽 설정·Packages·빌드 목록을 자동 교체하지 않는다.

부모 `PitchingMVP` 아래에 Environment, 카메라/라이트, ReleasePoint, AimPlane과 경계/훈련 존, Baseball, AimMarker, LockedTarget, ImpactMarker, TrajectoryPreview, PitchingSystem을 만든다. **정확한 계층과 모든 Inspector 참조값은 패키지 `README_KO.md`가 기준**이다.

## 핵심 Inspector 값

| 항목 | 값 |
|---|---|
| Release Speed Kmh / Gravity | 130 / (0,-9.81,0) |
| ReleasePoint | (0,1.8,0) |
| AimPlane 중심 / Aim Size | (0,1.05,18) / (2.4,1.8) |
| 훈련 존 크기 | (0.43,0.8) |
| Baseball Scale | (0.075,0.075,0.075) |
| Auto Reset / Result Hold Seconds | On / 1.2 |
| Simulation Speed | 1、느리게 볼 때 0.25 |
| Rigidbody | 없음 |

공은 목표면에서 멈춘다. `PitchBallMotor` 외에 `SimplePitchController`나 다른 Transform 이동 코드를 붙이지 않는다. SphereCollider는 비활성이다. Input System/Legacy 선택은 조건부 컴파일되며 기존 프로젝트 설정을 확인한다.

## 실제 검증의 경계

독립 Python 수치 검사는 궤적 식을 별도로 계산하는 검사다. **C# 컴파일, Unity 물리 엔진, 씬 생성, 실제 입력, Play Mode 검사와 같지 않다.** 이번 실행 결과는 `docs/VALIDATION.md`에 있다. 패키지 내 기존 `VALIDATION.md`는 과거 제공 당시 기록이다.

Unity Editor를 사용할 수 있게 되면 버전·패키지·Render Pipeline·Input 설정을 기록하고 빨간 오류를 먼저 해결한다. 이후 생성 메뉴→검사 메뉴→직접 입력→빌드 순으로 확인한다. 예전 스크린샷만 보고 현재 Editor 버전이나 씬 참조가 맞다고 단정하지 않는다.

## 이전 코드와 충돌 방지

- `docs/history/LEGACY_STEP1_GUIDE.md`에는 더 오래된 대안 구현 C# 7개가 설명 안에 들어 있다. 현재 MVP와 섞어 자동 설치하지 않는다.
- `docs/history/SimplePitchController.cs.txt`는 과거 고정 표적 투구 코드다. 참고용 텍스트로 두었다.
- 실제 사용자 프로젝트에 어떤 이전 구현이 있는지 아직 모른다. 삭제부터 하지 말고 namespace, 부착 컴포넌트, 공 이동 소유자를 확인한다.
- Unity와 웹의 좌표가 다르다. 전체 야구 기능 이식은 `ARCHITECTURE.md`의 좌표 표를 읽고 한 기준으로 통합한 뒤 진행한다.
