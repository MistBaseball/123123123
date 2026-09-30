# 마우스 목표지점 투구 MVP

대상: Unity 6, 현재 사용 중인 URP 프로젝트 / PC 마우스 우선.

마우스가 가리키는 **홈플레이트 앞 수직 평면의 지점**으로 공을 던진다. 바닥이나 임의의 3D 물체를 향한 투구가 아니다. 구속과 중력으로 초기 속도를 계산하며 클릭한 순간의 목표점을 고정한다. 기본 설정에서는 목표 도착 후 1.2초 뒤 다음 공을 준비한다.

## 가장 빠른 설치

1. Unity가 실행 중이면 Play Mode를 종료하고 현재 씬을 `Ctrl + S`로 저장한다.
2. ZIP을 압축 해제한다.
3. 압축 안의 `Assets/PitchingMouseMVP` 폴더 하나를 기존 프로젝트의 `Assets` 안에 복사한다. 결과는 `기존프로젝트/Assets/PitchingMouseMVP/Runtime/...`여야 한다. `Assets/Assets`로 중복해서 넣지 않는다.
4. Unity로 돌아가 코드 컴파일이 끝날 때까지 기다린다.
5. 상단 `Tools > Baseball MVP > 1. Create Mouse Pitch Scene`을 실행한다.
6. 저장 확인 창이 나오면 **Save**를 선택한다. 취소하면 생성을 중단한다.
7. 새 씬이 열리면 `Tools > Baseball MVP > 2. Run Math and Scene Checks`를 실행한다.
8. 검사 결과를 확인하고 ▶ Play를 누른다. Game 화면에 마우스를 놓고 하늘색 사각형 안으로 이동한 뒤 왼쪽 클릭한다.

처음 Game 화면에 포커스를 주는 클릭은 무시될 수 있다. 마우스 버튼을 놓고 한 번 더 클릭하면 된다. 화면 비율은 16:9, 1280×720 이상을 권장한다. 작은 Game 탭은 탭 위에 마우스를 올리고 `Shift + Space`로 넓힐 수 있다.

### 보존 범위

- 기존 `PitchingPrototype` 씬, Ground, ReleasePoint, PitchTarget, Baseball과 기존 Materials 폴더는 덮어쓰거나 삭제하지 않는다.
- 기존 `SimplePitchController.cs`도 그대로 둔다. 새 씬에서는 사용하지 않는다.
- 새 씬은 `Assets/PitchingMouseMVP/Generated/MousePitch/MousePitchMVP.unity`에 생성된다. 메뉴를 재실행하면 `MousePitch 1`처럼 새 폴더를 사용한다. 기존 생성 결과도 덮어쓰지 않는다.
- 기존 씬은 저장 후 닫히며 새 씬 한 개가 열린다. 원래 씬으로 돌아가려면 Project 창에서 기존 `.unity` 파일을 더블클릭한다.
- Packages, Input Actions, Player Settings, Graphics Settings, Build Profiles/Build Settings는 변경하지 않는다. 빌드할 경우 새 씬을 해당 Build Profile의 Scene List에 사용자가 추가해야 한다.
- `.meta`는 가져올 때 Unity가 생성하고 씬/재질은 그 후 에디터 API로 생성하므로 GUID를 임의로 만들지 않는다.
- 생성 중 오류가 나면 기존 씬은 유지되고 부분 생성된 새 자산은 진단을 위해 남는다. 파일을 자동 삭제하지 않는다.

## 조작과 화면 표시

| 입력/표시 | 의미 |
|---|---|
| 마우스 이동 | 조준 영역 안에서 목표점과 예상 궤적 표시 |
| 마우스 왼쪽 클릭 | 해당 위치로 한 번 투구 |
| R | 비행 도중에도 공을 출발점으로 되돌림 |
| 하늘색 큰 사각형 | 투구할 수 있는 전체 조준 범위 |
| 초록색 작은 사각형 | 단순 훈련용 존, 실제 심판 판정 아님 |
| 하늘색 원 | 현재 조준점 |
| 주황색 십자 | 클릭 순간 고정된 목표점 |
| 초록색 작은 원 | 계산된 도착점 |
| 가는 곡선 | 중력을 반영한 예상 경로 |
| 공 뒤의 주황색 흔적 | 실제 재생 중인 공의 잔상 |

영역 밖, HUD 위, 화면 밖 클릭은 투구하지 않는다. 클릭을 누르고 있어도 자동 연사하지 않는다. 비행 및 결과 확인 중의 클릭은 무시하고 다음 투구를 예약하지 않는다. 자동 리셋 후 **새로 클릭**해야 한다. R 초기화는 투구 수와 마지막 결과를 지우지 않는다.

HUD의 `Thrown / completed`는 시도한 투구 수 / 도착을 완료한 투구 수다. 도중 R로 취소하면 시도 수만 남는다. `Error`는 공 위치를 보정하기 **전**에 계산된 도착점과 클릭 목표점의 거리다. 이론 궤적의 수치 검증값이며 물리 충돌 정확도를 의미하지 않는다.

## 스크립트와 GameObject 연결

자동 생성 메뉴가 다음 구성을 전부 만든다. 스크립트를 별도로 다시 붙일 필요가 없다.

| GameObject | 부모 | 부착 컴포넌트 | 역할 |
|---|---|---|---|
| PitchingMVP | 씬 루트 | Transform | 이번 MVP 전체 묶음 |
| Environment | PitchingMVP | Transform | 바닥, 표적 뒤판, 홈플레이트 표시, 투수판 표시 |
| Main Camera | PitchingMVP | Camera, AudioListener | 투수 뒤 테스트 카메라 |
| Directional Light | PitchingMVP | Light | 조명 |
| ReleasePoint | PitchingMVP | Transform | 공의 출발점 |
| AimPlane | PitchingMVP | PitchAimPlane | 마우스 광선과 교차하는 목표 평면 |
| AimBoundary / TrainingZone | AimPlane | LineRenderer | 조준 영역과 존 표시 |
| Baseball | PitchingMVP | PitchBallMotor, TrailRenderer, MeshRenderer, 비활성 SphereCollider | 공과 궤적 재생 |
| AimMarker | PitchingMVP | LineRenderer | 현재 목표점 표시 |
| LockedTarget | PitchingMVP | 자식 2개의 LineRenderer | 클릭한 지점의 십자 표시 |
| ImpactMarker | PitchingMVP | LineRenderer | 실제 계산 도착점 표시 |
| TrajectoryPreview | PitchingMVP | LineRenderer | 예상 경로 |
| PitchingSystem | PitchingMVP | PitchInputReader, PitchingController, PitchHud | 입력, 상태 전환, 테스트 HUD |

| 파일 | 책임 / 부착 위치 |
|---|---|
| Runtime/PitchTrajectory.cs | 순수 궤적 수학. GameObject에 붙이지 않음 |
| Runtime/PitchAimPlane.cs | AimPlane에 부착. 화면 좌표를 목표 평면 좌표로 변환 |
| Runtime/PitchInputReader.cs | PitchingSystem에 부착. 마우스/R키 입력만 처리 |
| Runtime/PitchBallMotor.cs | Baseball에 부착. 공 위치를 쓰는 유일한 컴포넌트 |
| Runtime/PitchingController.cs | PitchingSystem에 부착. Ready → Flying → Result → Ready |
| Runtime/PitchHud.cs | PitchingSystem에 부착. 상태·구속·오차 표시 |
| Editor/PitchMvpSceneBuilder.cs | 에디터 메뉴. 어디에도 붙이지 않음 |
| Editor/PitchMvpChecks.cs | 에디터 자동 검사 메뉴. 어디에도 붙이지 않음 |

## Inspector 설정

### PitchingSystem / Pitching Controller

| 항목 | 자동 설정 값 |
|---|---|
| Aim Camera | Main Camera의 Camera |
| Aim Plane | AimPlane의 PitchAimPlane |
| Release Point | ReleasePoint |
| Ball | Baseball의 PitchBallMotor |
| Input Reader | 같은 물체의 PitchInputReader |
| Aim Marker | AimMarker |
| Locked Marker | LockedTarget |
| Impact Marker | ImpactMarker |
| Trajectory Preview | TrajectoryPreview의 LineRenderer |
| Release Speed Kmh | 130 |
| Gravity | (0, -9.81, 0) |
| Auto Reset | 켜짐 |
| Result Hold Seconds | 1.2 |
| Simulation Speed | 1 |
| Show Trajectory Preview | 켜짐 |

Pitch Hud의 Controller도 같은 물체의 PitchingController로 연결된다.

### 주요 위치와 크기

| GameObject/컴포넌트 | 설정 |
|---|---|
| ReleasePoint | Position (0, 1.8, 0), Scale (1,1,1) |
| AimPlane | Position (0, 1.05, 18), Rotation (0,0,0), Scale (1,1,1) |
| AimPlane / Aim Size | (2.4, 1.8), 즉 X -1.2~1.2m / Y 0.15~1.95m |
| AimPlane / Training Zone Size | (0.43, 0.8), 평면 중심 기준의 훈련용 사각형 |
| Baseball | Position = ReleasePoint, Scale (0.075,0.075,0.075), Rigidbody 없음 |
| Pitch Ball Motor / Trail | 같은 물체의 TrailRenderer |
| TrailRenderer | Time 0.22, Start Width 0.035, End Width 0.003, Min Vertex Distance 0.015 |
| Main Camera | Position (0,2.2,-4), AimPlane 중심을 바라봄, Perspective FOV 28, Near 0.05, Far 100 |
| Ground | Cube, Position (0,-0.05,9), Scale (30,0.1,30) |
| Backstop | Cube, Position (0,1.35,18.35), Scale (4.2,2.7,0.06), Collider 꺼짐 |

조준 범위의 너비·높이는 `AimPlane`에서 바꿀 수 있지만, 생성된 LineRenderer의 사각형도 같은 크기로 맞춰야 한다. 처음에는 기본값 그대로 사용한다. 부모인 PitchingMVP와 AimPlane의 Scale은 반드시 (1,1,1)을 유지한다.

투구가 빨라 확인하기 어렵다면 **Simulation Speed만 0.25**로 낮춘다. 실제 궤적과 설정 구속은 그대로 두고 재생만 4배 느리게 한다. `Time.timeScale`, Fixed Timestep, 프로젝트 중력은 변경하지 않는다. HUD의 Flight는 시뮬레이션 시간이며 느린 재생의 실제 대기 시간은 Flight ÷ Simulation Speed다. Inspector 영구 변경은 Play Mode를 끈 뒤 한다.

## 동작 원리와 범위

1. 카메라의 화면 광선을 `AimPlane`의 수직 평면에 교차시킨다. 충돌체 Raycast에 의존하지 않는다.
2. 클릭 순간의 월드 목표점과 출발점을 스냅샷으로 저장한다.
3. 초기 구속을 유지하면서 목표점에 도달하는 일정 중력 궤적 중 비행 시간이 짧은 해를 계산한다.
4. `p(t) = start + initialVelocity × t + 0.5 × gravity × t²`를 매 프레임 평가한다.
5. 완료 프레임이 도착 시간을 넘더라도 시간을 clamp하므로 목표점을 건너뛰지 않는다. 부동소수점 오차는 기록한 후 최종 위치를 목표에 맞춘다.

구속은 단순히 직선거리/시간으로 표시한 값이 아니라 계산된 **출발 순간 속력**이다. 중력 때문에 도중 속력은 달라진다. 사거리 밖의 설정은 발사를 거부하며 READY 상태에서 유효 조준으로 처리하지 않는다.

이 버전에는 제구 확률 오차, 구종별 무브먼트, 공기저항, 회전, 타자, 수비, 경기 판정, 타격, 육성, 저장, 모바일 조작을 넣지 않았다. MVP 입력 어댑터와 공 이동을 분리했으므로 추후 확장할 수 있다. 훈련용 존은 점의 위치만 판정하며 공 반지름·타자 신장·홈플레이트 입체 영역을 반영한 정식 스트라이크 판정이 아니다.

**공은 Rigidbody 물리 시뮬레이션을 하지 않으며 충돌도 하지 않는다.** 목표평면에 도착하면 멈춘다. 바닥·타자·배트 충돌을 추가할 때 별도 충돌 처리 또는 물리 엔진으로의 전환이 필요하다. 같은 공에 SimplePitchController나 다른 Transform 이동 코드를 동시에 붙이지 않는다.

## 자동 검사

`Tools > Baseball MVP > 2. Run Math and Scene Checks`는 실제 C# 런타임 코드로 다음을 검사한다.

- 70/90/130/160/180 km/h, 조준면 9개 위치, 중력 켜짐/꺼짐: 시작점·도착점·초기 구속.
- 15/30/60/144/240 FPS에 대응하는 도착 시간 clamp.
- 0 거리, 0 속력, NaN, 도달 불가능한 구속 거부.
- 조준 영역 안/밖, 평면 밖, 훈련용 존 안/밖.
- 카메라 world-to-screen → screen-to-plane 좌표 왕복.
- 실제 PitchBallMotor의 중복 발사 차단, 비행 중 리셋, 큰 프레임 시간의 도착 처리, 도착 1회 처리.
- 현재 열린 씬의 Inspector 필수 참조 확인.

테스트용 임시 물체만 생성했다가 제거한다. 기존 GameObject를 삭제하지 않는다. Unity Test Framework 패키지를 요구하지 않는 메뉴 검사이며, EditMode/PlayMode Test Runner 테스트라고 주장하지 않는다.

## 직접 실행 테스트: 이 표까지 통과해야 플레이 확인 완료

| 순서 | 테스트 | 기대 결과 |
|---|---|---|
| 1 | 씬 생성 후 Console 확인 | 새 빨간 컴파일/실행 오류 없음 |
| 2 | 자동 검사 실행 | PASS, 실패 항목 없음 |
| 3 | Play 후 조준 범위 안에서 이동 | 하늘색 원과 곡선이 마우스에 맞춰 움직임 |
| 4 | 중앙, 왼쪽 위, 오른쪽 아래에 각각 클릭 | 각기 다른 클릭 위치로 공이 도착, Error 1mm 미만 |
| 5 | 던진 직후 마우스를 반대편으로 이동 | 주황색 목표 십자와 비행 목표가 움직이지 않음 |
| 6 | 비행 중 빠르게 여러 번 클릭 | 공 1개, Thrown 1회만 증가 |
| 7 | 왼쪽 버튼을 누른 채 자동 리셋 대기 | 자동 연사하지 않음; 놓고 새로 눌러야 발사 |
| 8 | 비행 도중 R | 즉시 출발점 복귀, 잔상이 출발점까지 긴 선으로 이어지지 않음 |
| 9 | 하늘색 영역 밖 / HUD 위 클릭 | 투구 수가 증가하지 않음 |
| 10 | 도착 후 1.2초 대기 | READY, 공이 출발점에 놓임; 다시 클릭 가능 |
| 11 | Auto Reset 끈 뒤 투구 | 결과 유지, R로 다음 공 준비 |
| 12 | Simulation Speed 0.25 | 느린 재생에서도 같은 지점 도착 |
| 13 | 70/130/160 km/h 비교 | 구속이 높을수록 도착 시간이 짧고 중력 보정 차이가 보임 |
| 14 | Game 해상도 1280×720 / 1920×1080 변경 | 화면의 커서와 목표 표시가 일치 |
| 15 | 다른 창으로 전환 후 복귀 | 비행 목표 보존; 복귀 클릭으로 의도치 않은 연사 없음 |
| 16 | Play 종료 후 재시작 | 새 실행에서 정상 READY, 오류 없음 |

## 오류 해결

- **Tools 메뉴가 안 보임:** Console의 첫 빨간 컴파일 오류를 먼저 확인한다. 기존 파일의 오류도 Unity 전체 컴파일을 막는다. `Editor` 폴더를 `Runtime` 안으로 옮기지 않는다.
- **스크립트 중복 오류:** 같은 패키지 폴더를 두 번 넣었는지 확인한다. 같은 이름의 클래스가 두 벌이면 안 된다.
- **분홍색 물체:** 현재 Render Pipeline을 확인한다. 자동 생성은 URP 프로젝트 기준이며 HDRP 대응을 포함하지 않는다.
- **클릭 반응 없음:** Game 탭에 포커스를 주고 버튼을 놓았다가 다시 클릭한다. 커서는 하늘색 범위 안에 있어야 한다. HUD의 Input에 Input System 또는 Legacy Input Manager가 표시되는지 확인한다.
- **SETUP ERROR:** HUD 메시지와 Console을 확인한다. 필수 참조가 None이면 위 Inspector 표대로 연결한다. 수정 후 Play Mode를 다시 시작한다.
- **이전처럼 표적 중앙에만 감:** 현재 열린 씬이 새 `MousePitchMVP`인지 확인한다. 기존 씬의 SimplePitchController는 마우스 조준을 지원하지 않는 이전 단계 코드다.
- **목표표시가 어긋남:** AimPlane과 부모의 Scale=(1,1,1), 같은 Main Camera 사용 여부를 확인한다. 마우스 좌표에 Game 뷰의 에디터 확대 배율을 직접 곱하지 않는다.
- **Input System 네임스페이스 오류:** 이 패키지는 조건부 컴파일로 입력 방식을 구분한다. 오류가 예전 SimplePitchController에서 발생했다면 그 파일에만 있는 무조건적인 InputSystem 참조와 현재 설치 상태를 확인한다. 프로젝트 입력 설정을 자동 변경하지 않는다.
- **씬을 다시 만들고 싶음:** 생성 메뉴를 재실행한다. 기존 결과는 남고 새 폴더/씬이 생긴다. 프로젝트 루트나 Library 폴더를 삭제하지 않는다.

## 이번 제공물의 검증 범위

이 코드는 사용자가 제공한 Unity 화면과 작업 이력을 바탕으로 작성했다. 사용자의 실제 프로젝트 폴더와 Unity Editor에는 연결되지 않았다. 로컬에서는 별도 수치 검증과 정적 검사를 수행했으며 자세한 결과는 `VALIDATION.md`에 기록했다. **Unity 컴파일, 실제 렌더링, 입력, Play Mode 통과를 완료했다고 주장하지 않는다.** 위 자동 검사와 직접 실행 체크리스트를 Unity에서 실행하는 것이 마지막 검증이다.

## 참고한 공식 API

- 마우스 입력: https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/Mouse.html
- 화면 광선: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Camera.ScreenPointToRay.html
- 평면 교차: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Plane.Raycast.html
- 새 씬 생성: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/SceneManagement.EditorSceneManager.NewScene.html

이 구현은 Unity 기능 구현 스킬의 입력·게임 규칙 분리, 명시적 Inspector 참조, 기존 자산 보존, 검증 수준 구분 원칙에 맞춰 구성했다.
