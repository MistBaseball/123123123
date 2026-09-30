# 투수 커리어 게임 — 첫 번째 투구 프로토타입

이번 파일은 **Unity 6.3 LTS의 Universal 3D 프로젝트에 넣는 C# 소스 묶음**이다. 실행 파일(.exe)이나 완성된 고교 시즌 게임이 아니다. Unity 프로젝트를 아래 순서로 만들고 소스를 가져온다.

## 1. 이번에 만드는 기능

- 간단한 3D 경기장, 외야 펜스, 홈과 1·2·3루.
- 투수와 포수를 포함한 수비수 9명, 상대 타자 1명. 캐릭터는 Capsule이다.
- 투수 뒤 카메라와 별도의 크게 확대한 스트라이크존 조준 패널.
- 포심 선택 버튼, 마우스 조준과 클릭 투구.
- 제구·멘탈·피로 입력을 반영하는 정규분포 기반 오차.
- 중력·선형 공기저항·단순화한 포심 백스핀 양력으로 계산하는 3D 공 이동.
- 투구수, 구속, 공 높이, 목표점, 실제 도착점, 오차 거리, 투구 상태 표시.
- 투구 중 중복 입력 차단, 투구 종료 후 약 0.85초 뒤 다음 투구 허용.

타격, 주루, 수비 AI, 카운트/아웃 판정, 사구, 변화구, 훈련, 경기 중 피로 누적은 이번 단계에 포함하지 않는다. 선수와 펜스의 Collider는 향후 확장용 배치이며, 이번 공은 다른 오브젝트와의 충돌 대신 홈 평면 도달과 단순 지면 접촉만 계산한다.

## 2. Unity 프로젝트와 GameObject 만들기

1. [Unity Hub](https://unity.com/download)를 설치하고 실행한다.
2. `Installs → Install Editor`에서 **Unity 6.3 LTS** 계열의 제공되는 패치 버전을 설치한다. 특정 패치 번호는 고정하지 않는다. 공식 지원 정보: [Unity 6 릴리스](https://unity.com/releases/unity-6).
3. `Projects → New project`를 누른다.
4. 템플릿은 **Universal 3D**를 선택한다. 이는 URP가 설정된 3D 템플릿이다. [Unity 공식 URP 프로젝트 생성 안내](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/creating-a-new-project-with-urp.html).
5. 프로젝트 이름을 `PitcherCareer`로 지정하고 만든다. 예시 저장 위치는 `C:\UnityProjects\PitcherCareer`이다.
6. 제공한 ZIP을 압축 해제한다. 그 안의 **Assets/PitcherCareer 폴더**를 새 프로젝트의 **Assets 폴더 안**으로 복사한다. 최종 위치가 `Assets/PitcherCareer/Scripts/PitcherStats.cs`가 되어야 한다. `Assets/Assets`로 중첩시키지 않는다.
7. Unity로 돌아가 가져오기와 컴파일이 끝날 때까지 기다린다.
8. 상단 메뉴에서 **Baseball → Create Step 1 Scene**을 누른다. 저장하지 않은 기존 Scene이 있다면 먼저 저장 여부를 묻는다.
9. 경기장과 모든 연결이 생성되고, `Assets/PitcherCareer/Scenes/PitchingStep1.unity`에 저장된다. 같은 이름이 이미 있으면 번호가 붙은 새 Scene을 만든다.

GameObject를 하나씩 손으로 만들 필요는 없다. 생성된 오브젝트는 Play 중 임시 생성되는 것이 아니라 **저장되는 Scene 오브젝트**다. 생성 메뉴를 다시 누르면 새 Scene이 만들어지므로, 카메라나 배치를 직접 수정한 뒤에는 현재 Scene을 저장하고 그대로 사용한다.

## 3. Hierarchy 구조

`/`는 부모와 자식 관계를 뜻한다. 다음은 핵심 오브젝트이며, Canvas 안에는 선·텍스트 등 UI 자식도 생성된다.

| Hierarchy 경로 | 역할 | 붙는 사용자 Script |
|---|---|---|
| Stadium | 바닥·내야·마운드·파울 라인·펜스의 부모 | 없음 |
| Stadium/Grass | 잔디 바닥 | 없음 |
| Stadium/InfieldDirt | 내야 흙 | 없음 |
| Stadium/InfieldGrass | 내야 잔디 | 없음 |
| Stadium/HomeDirt | 홈 주변 흙 | 없음 |
| Stadium/Mound | 마운드 | 없음 |
| Stadium/Rubber | 투수판 | 없음 |
| Stadium/FirstFoulLine, ThirdFoulLine | 파울 라인 | 없음 |
| Stadium/Fence_0 … Fence_23 | 외야 펜스 조각 | 없음 |
| Bases/Home | 홈 | 없음 |
| Bases/FirstBase | 1루 | 없음 |
| Bases/SecondBase | 2루 | 없음 |
| Bases/ThirdBase | 3루 | 없음 |
| Defenders/P | 투수 | PitcherStats |
| Defenders/P/ReleasePoint | 공을 놓는 위치 | 없음 |
| Defenders/C | 포수 | 없음 |
| Defenders/1B | 1루수 | 없음 |
| Defenders/2B | 2루수 | 없음 |
| Defenders/SS | 유격수 | 없음 |
| Defenders/3B | 3루수 | 없음 |
| Defenders/LF | 좌익수 | 없음 |
| Defenders/CF | 중견수 | 없음 |
| Defenders/RF | 우익수 | 없음 |
| Batter | 상대 타자 | 없음 |
| Ball | 같은 공을 반복 사용 | BallPhysics |
| WorldTarget | 홈 근처의 파란 목표 표시 | 없음 |
| Systems | 투구 흐름과 참조 연결 | PitchingController |
| Main Camera | 투수 뒤 카메라 | Camera, AudioListener |
| Sun | 그림자를 끈 Directional Light | 없음 |
| Canvas | Screen Space Overlay UI | Canvas, CanvasScaler, GraphicRaycaster |
| Canvas/ReadoutPanel/Readout | 상태와 수치 표시 | 없음 |
| Canvas/AimPanel | 마우스로 조준하고 클릭하는 영역 | PitchingHUD |
| Canvas/AimPanel/TargetRing | 파란 조준 원 | 없음 |
| Canvas/AimPanel/ArrivalRing | 금색 도착 원 | 없음 |
| Canvas/FourSeamButton | 포심 선택 버튼 | 없음 |
| Canvas/Status | 투구 진행 안내 | 없음 |
| EventSystem | UI 포인터 입력 | 활성 입력 방식에 맞는 UI Input Module |

Defenders의 자식은 P, C, 1B, 2B, SS, 3B, LF, CF, RF의 **정확히 9명**이다. 타자는 별도다.

좌표는 1 Unity unit를 약 1m로 사용한다. 홈은 `(0, 0, 0)`, 외야는 `+Z`, 공의 진행 방향은 `-Z`다. 루간 거리는 약 27.43m, 투수판은 홈에서 18.44m다. 공은 투수판보다 앞으로 나온 릴리스 위치 `(-0.38, 1.85, 17)`에서 출발한다. 이 값들은 이번 배치의 기준값이다.

## 4. Inspector 설정

생성 메뉴가 다음 연결을 자동으로 한다. 화면이 정상 생성되었다면 그대로 사용한다.

| 선택하는 GameObject/Asset | 항목 | 설정 |
|---|---|---|
| Defenders/P → PitcherStats | Velocity / Control / Stuff | 65 / 60 / 60 |
| 같은 곳 | Stamina / Recovery / Mental | 60 / 75 / 60 |
| 같은 곳 | Fatigue | 0 |
| Systems → PitchingController | Stats | Defenders/P의 PitcherStats |
| 같은 곳 | Four Seam (`FourSeam`) | Data/FourSeam.asset |
| 같은 곳 | Release Point | Defenders/P/ReleasePoint |
| 같은 곳 | Ball | Ball의 BallPhysics |
| 같은 곳 | HUD | Canvas/AimPanel의 PitchingHUD |
| 같은 곳 | World Target | WorldTarget |
| 같은 곳 | Result Hold Seconds | 0.85 |
| Ball → BallPhysics | Ground Height | 0.065 |
| Main Camera | Position | (1.65, 2.9, 25) |
| Main Camera | Field of View | 32 |
| Canvas → CanvasScaler | Reference Resolution | 1280 × 720 |
| Canvas → CanvasScaler | Match | 0.5 |

위 표의 구종 참조 필드는 C#에서 `FourSeam`이며 Unity Inspector에서는 보통 `Four Seam`으로 보인다.

**FourSeam.asset**은 `Assets/PitcherCareer/Data`에 자동 생성되는 ScriptableObject다. GameObject에 붙이지 않는다.

| FourSeam.asset 설정 | 기본값 | 의미 |
|---|---:|---|
| Velocity Multiplier | 1 | 현재 투수 구속에 곱하는 배율 |
| Linear Drag | 0.12 | 선형 공기저항 계수 |
| Spin Rpm | 2200 | 회전수 |
| Lift Per Rpm | 0.001 | 이번 포심 모델의 단순 양력 계수 |
| Control Difficulty | 1 | 제구 오차 배율 |
| Stamina Cost | 1 | 다음 단계용 데이터; 이번에는 소비하지 않음 |

구속 등급 65는 기본 약 139km/h다. 등급을 표시 구속과 구분하기 위해, 이번 임시 변환은 등급 1을 100km/h, 등급 100을 160km/h에 대응시켰다. 확정된 선수 성장 밸런스가 아니다.

Ball에는 **Rigidbody를 추가하지 않는다.** 이 단계는 BallPhysics가 위치·속도를 직접 계산한다. Unity Rigidbody와 동시에 이동시키면 물리가 중복 적용된다. 향후 충돌과 타구 구현 때 같은 Ball을 유지하고 내부 물리 모듈을 확장한다.

## 5. 생성하는 C# 파일과 읽는 순서

파일은 이미 전체 코드로 제공되어 있으므로 직접 빈 C# 파일을 또 만들지 않아도 된다.

| 순서 | 파일 | 무엇을 담당하는가 | GameObject에 붙이는가 |
|---|---|---|---|
| 1 | Scripts/PitcherStats.cs | 기본 등급, 현재 구속, 제구 오차 크기 | Defenders/P |
| 2 | Scripts/PitchData.cs | 포심의 데이터 정의 | 아니요. ScriptableObject asset |
| 3 | Scripts/PitchMath.cs | 정규분포 오차와 초기 속도 계산 | 아니요. static 계산 클래스 |
| 4 | Scripts/BallPhysics.cs | 위치·속도·회전과 투구 종료 | Ball |
| 5 | Scripts/PitchingController.cs | 조준 → 투구 → 결과 → 다음 투구 | Systems |
| 6 | Scripts/PitchingHUD.cs | UI 포인터 입력과 표시 | Canvas/AimPanel |
| 7 | Editor/PrototypeSceneBuilder.cs | Scene 및 Inspector 자동 연결 | 아니요. Editor 메뉴 코드 |

**Editor 폴더 위치를 유지해야 한다.** 이 폴더의 코드는 Unity Editor 전용이며, 나중에 PC 게임으로 빌드할 때 실행 코드에 포함되지 않는다.

## 6. 전체 C# 코드

각 `.cs` 파일이 생략 없는 원본이다. 별도의 `SOURCE_WALKTHROUGH_ko.md`에는 1번부터 7번까지 파일 전체 코드와 담당 GameObject를 순서대로 담았다. 우선 1번 PitcherStats부터 읽고, 전체를 이해하기 전에도 아래 실행 절차로 동작을 확인할 수 있다.

핵심 계산 순서는 다음과 같다.

1. AimPanel에서 클릭한 좌표를 홈의 `Z = 0` 평면 좌표로 변환한다.
2. 제구·멘탈·피로로 오차 표준편차를 계산한다.
3. Box–Muller 방식으로 X/Y 정규분포 오차를 만들고 최종 목표점에 더한다. 작은 확률로 넓은 정규분포를 사용해 실투 꼬리를 만든다.
4. **오차가 반영된 도착점을 먼저 확정한다.** 그 점에 들어가는 초기 속도와 비행시간을 역산한다.
5. BallPhysics가 속도·중력·선형 저항·포심 양력의 운동 방정식을 계산한다. `Transform.Lerp`로 두 점을 연결하지 않는다.
6. 홈 평면에 도달하면 그 위치에서 멈추고 결과를 표시한다. 지면에 먼저 닿으면 첫 접촉 지점에서 멈춘다.

현재 모델은 **일정한 양력과 선형 저항을 쓰는 단순화한 포심 물리**다. 속도에 따라 바뀌는 실제 Magnus 힘, 난류, 구종별 시간 가변 무브먼트를 재현하는 최종 물리 엔진은 아니다. 다음 단계에서 PitchData와 PitchMath/BallPhysics를 확장해 변화구를 연결한다.

`Batted`, `Rolling`, `ThrownByFielder`는 같은 공 객체를 확장하기 위한 enum 이름만 준비되어 있고 아직 동작하지 않는다. 현재 상태 흐름은 `Ready → Pitching → Result → Ready`이며 투구 중에는 추가 투구를 받지 않는다. 4초를 넘긴 투구에는 입력 잠김 방지용 취소 처리가 있다.

## 7. 스크립트가 붙는 위치 확인

Scene 생성 후 다음 네 곳만 우선 확인한다.

1. `Defenders/P`를 누르면 Inspector에 **Pitcher Stats**가 보인다.
2. `Ball`을 누르면 **Ball Physics**가 보인다.
3. `Systems`를 누르면 **Pitching Controller**가 보이고 참조 칸이 채워져 있다.
4. `Canvas/AimPanel`을 누르면 **Pitching HUD**가 보인다.

PitchData, PitchMath, PrototypeSceneBuilder를 GameObject에 드래그해 붙이려 하지 않는다. 각각 데이터 asset, 계산 도구, Editor 메뉴다.

## 8. 실행 방법

1. 생성된 `PitchingStep1` Scene이 열려 있는지 확인한다.
2. `Game` 탭의 해상도를 우선 **1280 × 720** 또는 **16:9**로 설정한다.
3. 상단의 **▶ Play**를 누른다.
4. 오른쪽 아래의 **4S | FOUR-SEAM** 버튼을 누른다. 포심은 처음부터 기본 선택되어 있어 한 번만 눌러도 충분하다.
5. 오른쪽 어두운 **조준 패널 안**으로 마우스를 움직인다. 파란 원이 따라온다. 패널의 흰색 3×3 선이 스트라이크존이다.
6. 원하는 지점에서 **마우스 왼쪽 버튼**을 클릭한다. 원을 끌어서 던지는 방식이 아니다.
7. 공이 3D 릴리스 지점에서 홈으로 이동한다. 약 0.85초 동안 결과를 보여준 뒤 다시 투구할 수 있다.

이번 입력은 확대된 조준 패널에서 한다. 경기장 전체를 클릭하는 자유 조준은 아직 연결하지 않았다. 흰색 존 바깥이지만 패널 안인 곳에도 던질 수 있다. 목표점은 홈 평면상의 실제 3D 좌표에 대응한다.

투구 목표와 실제 도착점이 다르면 파란 원과 금색 원이 벌어진다. 매우 큰 실투가 패널 범위를 벗어나면 금색 원은 패널에 표시하지 않지만 도착 수치는 그대로 표시한다. 지면 접촉은 홈까지 도달하지 않은 결과이므로 `ARRIVAL` 대신 `END POSITION`으로 표시한다.

## 9. 정상 작동 모습과 직접 확인

| 동작 | 기대 결과 |
|---|---|
| Play | 투수 뒤 3D 화면, 왼쪽 수치, 오른쪽 조준 패널 |
| 마우스 이동 | 파란 목표 원과 홈 근처 WorldTarget 이동 |
| 클릭 | 한 개의 Ball이 실제 3D 공간에서 포심 비행 |
| 도착 | 금색 원과 도착 좌표·오차 거리 표시 |
| 빠르게 여러 번 클릭 | 진행 중인 공은 한 개, 투구수도 한 번만 증가 |
| 결과 이후 클릭 | 다음 투구 정상 시작 |

**제구 차이 확인:** Play 중 Hierarchy에서 `Defenders/P`를 선택한다. Inspector의 `Control`을 30으로 설정하고 중앙 부근에 10~20회 던진다. 이어 90으로 바꾸고 같은 곳에 던진다. 90일 때 대체로 더 모이고, 두 경우 모두 확률적인 실투가 가능해야 한다. 몇 번만 던진 결과가 항상 순서대로 좋을 필요는 없다.

이번 기본 멘탈 60·피로 0 설정을 10만 표본씩 별도 수치 검증했을 때, 평균 목표 오차는 제구 30에서 약 19.6cm, 제구 90에서 약 2.3cm였다. 이는 **현재 설계한 분포의 성질**이며 실측 야구 통계나 Unity 실행 측정값이 아니다.

Play 중 Inspector에서 바꾼 값은 Play를 끄면 원래 값으로 돌아간다. 기본값을 바꾸려면 Play를 끈 상태에서 수정하고 Scene을 저장한다.

Scene 뷰에서 `Stadium`을 선택하고 `F`로 프레임을 맞추면 전체 구장 배치를 확인할 수 있다. 투수 뒤 카메라는 홈 방향을 보기 때문에, 외야 수비수는 기본 Game 화면에서 보이지 않을 수 있다.

**검증 범위:** 제작 환경에는 Unity Editor가 설치되어 있지 않다. 따라서 실제 Unity 컴파일, Play 모드, Windows 빌드, Iris 내장 그래픽의 FPS는 아직 검증하지 못했다. 별도 float32 수치 검증에서 180개 구속·좌표·저항 조합의 도착점과 구속 일치, 서로 다른 계산 간격, 지면 먼저 접촉하는 경우를 확인했다. 소스를 검토한 것과 Unity에서 실행 검증한 것은 구분한다.

## 10. 오류가 날 경우 확인할 것

| 증상 | 먼저 확인할 것 |
|---|---|
| Baseball 메뉴가 없다 | 파일 경로가 `Assets/PitcherCareer`인지 확인하고 Console의 첫 번째 빨간 오류 확인 |
| 같은 클래스가 두 번 정의되었다 | ZIP을 복사한 뒤 같은 이름의 스크립트를 추가로 만들지 않았는지 확인 |
| UnityEngine.UI / EventSystems 오류 | Package Manager에서 Unity UI(uGUI)가 설치되어 있는지 확인 |
| 분홍색 재질 / URP 안내 창 | Universal 3D 템플릿인지 확인. HDRP/기본 3D 프로젝트와 섞지 않기 |
| 화면이 비어 있다 | 생성한 Scene을 열었는지, Game 탭에서 Play 중인지 확인 |
| 공을 던질 수 없다 | 경기장 그림이 아니라 오른쪽 조준 패널 안을 클릭했는지 확인 |
| 버튼까지 전혀 반응하지 않는다 | EventSystem의 UI 입력 모듈과 프로젝트의 활성 입력 방식이 일치하는지 확인 |
| Input System 설정을 나중에 바꿨다 | 설정 변경 후 Unity를 재시작하고, 생성 전의 배치 수정사항을 저장한 뒤 Scene을 다시 생성해 모듈을 맞추기 |
| Missing reference 메시지 | Systems의 Stats, Four Seam, Release Point, Ball, HUD 참조 확인 |
| 선수들이 움직이지 않는다 | 이번 단계의 정상 상태. 타격·주루·수비 AI는 다음 단계 |
| 공이 바닥에 닿자 멈춘다 | 이번 단계는 첫 지면 접촉까지. 바운드와 타구는 후속 단계 |
| UI 글자가 잘린다 | Game 해상도를 1280×720, 16:9로 맞추고 Game 뷰 배율 확인 |

입력 방식 설정 위치는 `Edit → Project Settings → Player → Other Settings → Active Input Handling`이다. 이 소스는 Scene을 생성할 때 활성 방식에 맞는 UI 모듈을 선택한다. 새 입력 시스템이 활성화되어 있으면 InputSystemUIInputModule, 아니면 StandaloneInputModule을 사용한다. [Unity 공식 입력 시스템 안내](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.17/manual/Installation.html).

이번 단계를 실행한 뒤 **“됐어”**라고 확인하면 다음 구종 무브먼트 단계로 넘어간다. 문제가 있으면 Console에서 첫 번째 빨간 오류를 클릭한 내용과 Hierarchy/Inspector 화면으로 확인한다.

---

# 전체 C# 코드 — 파일별 순서

각 코드는 해당 파일의 전체 내용이다. ZIP의 Assets/PitcherCareer 폴더를 가져왔다면 다시 빈 스크립트를 만들 필요가 없다.

## 1. PitcherStats.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/PitcherStats.cs`

붙이는 곳: **Defenders/P**

```csharp
using UnityEngine;

namespace PitcherCareer
{
    [DisallowMultipleComponent]
    public sealed class PitcherStats : MonoBehaviour
    {
        [Range(1, 100)] public float Velocity = 65f;
        [Range(1, 100)] public float Control = 60f;
        [Range(1, 100)] public float Stuff = 60f;
        [Range(1, 100)] public float Stamina = 60f;
        [Range(1, 100)] public float Recovery = 75f;
        [Range(1, 100)] public float Mental = 60f;
        [Range(0, 100)] public float Fatigue;

        // Prototype tuning: rating 1 -> 100 km/h, rating 100 -> 160 km/h.
        public float SpeedKmh => Mathf.Lerp(100f, 160f,
            Mathf.InverseLerp(1f, 100f, Velocity));

        // Training/season systems will update Fatigue in a later milestone.
        public float EffectiveSpeedKmh => SpeedKmh *
            Mathf.Lerp(1f, 0.9f, Mathf.Clamp01(Fatigue / 100f));

        public float ControlSigma =>
            (0.012f + 0.22f * Mathf.Pow(1f -
                Mathf.InverseLerp(1f, 100f, Control), 1.6f)) *
            Mathf.Lerp(1f, 2f, Mathf.Clamp01(Fatigue / 100f)) *
            Mathf.Lerp(1.15f, 0.9f, Mathf.InverseLerp(1f, 100f, Mental));
    }
}
```

## 2. PitchData.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/PitchData.cs`

붙이는 곳: **GameObject에 붙이지 않음 — FourSeam.asset의 데이터 형식**

```csharp
using UnityEngine;

namespace PitcherCareer
{
    [CreateAssetMenu(menuName = "Pitcher Career/Pitch Data")]
    public sealed class PitchData : ScriptableObject
    {
        public string PitchName = "FOUR-SEAM";
        [Range(0.5f, 1.2f)] public float VelocityMultiplier = 1f;
        [Min(0f)] public float LinearDrag = 0.12f;
        [Min(0f)] public float SpinRpm = 2200f;
        [Min(0f)] public float LiftPerRpm = 0.001f;
        [Min(0.1f)] public float ControlDifficulty = 1f;
        [Min(0f)] public float StaminaCost = 1f;

        // Backspin offsets part of gravity; it does not make the ball fly upward.
        public Vector3 Acceleration => new Vector3(0f,
            -9.81f + SpinRpm * LiftPerRpm, 0f);
    }
}
```

## 3. PitchMath.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/PitchMath.cs`

붙이는 곳: **GameObject에 붙이지 않음 — static 계산 도구**

```csharp
using UnityEngine;

namespace PitcherCareer
{
    public static class PitchMath
    {
        // Independent normal samples, using Box-Muller. No square/uniform spread.
        public static Vector2 Gaussian()
        {
            float radius = Mathf.Sqrt(-2f * Mathf.Log(
                Mathf.Max(0.0000001f, Random.value)));
            float angle = 2f * Mathf.PI * Random.value;
            return radius * new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
        }

        public static Vector3 Arrival(Vector3 target, PitcherStats stats, PitchData pitch)
        {
            float sigma = stats.ControlSigma * pitch.ControlDifficulty;
            float mistakeChance = Mathf.Lerp(0.08f, 0.02f,
                Mathf.InverseLerp(1f, 100f, stats.Control));
            if (Random.value < mistakeChance) sigma *= 3f;
            Vector2 error = Gaussian() * sigma;
            return target + new Vector3(error.x, error.y, 0f);
        }

        // Exact integral for dv/dt = acceleration - drag * velocity.
        public static Vector3 Position(Vector3 start, Vector3 velocity,
            Vector3 acceleration, float drag, float time)
        {
            if (drag < 0.0001f)
                return start + velocity * time + 0.5f * acceleration * time * time;
            float b = (1f - Mathf.Exp(-drag * time)) / drag;
            return start + velocity * b + acceleration * ((time - b) / drag);
        }

        public static Vector3 VelocityAt(Vector3 initial, Vector3 acceleration,
            float drag, float time)
        {
            if (drag < 0.0001f) return initial + acceleration * time;
            float decay = Mathf.Exp(-drag * time);
            return initial * decay + acceleration * ((1f - decay) / drag);
        }

        static Vector3 LaunchVelocity(Vector3 start, Vector3 target,
            Vector3 acceleration, float drag, float time)
        {
            if (drag < 0.0001f)
                return (target - start - 0.5f * acceleration * time * time) / time;
            float b = (1f - Mathf.Exp(-drag * time)) / drag;
            return (target - start - acceleration * ((time - b) / drag)) / b;
        }

        public static Vector3 Solve(Vector3 start, Vector3 target, float speed,
            Vector3 acceleration, float drag, out float duration)
        {
            // Short, direct pitch branch. This is not a high-arc artillery solver.
            float near = 0.1f;
            float far = 1.5f;
            for (int i = 0; i < 28; i++)
            {
                float mid = (near + far) * 0.5f;
                if (LaunchVelocity(start, target, acceleration, drag, mid).magnitude > speed)
                    near = mid;
                else far = mid;
            }
            duration = (near + far) * 0.5f;
            return LaunchVelocity(start, target, acceleration, drag, duration);
        }
    }
}
```

## 4. BallPhysics.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/BallPhysics.cs`

붙이는 곳: **Ball**

```csharp
using System;
using UnityEngine;

namespace PitcherCareer
{
    // Only Pitched and Dead are active in Step 1.
    public enum BallState { Pitched, Batted, Rolling, ThrownByFielder, Dead }
    public enum PitchEnd { Plate, Ground, Timeout }

    [DisallowMultipleComponent]
    public sealed class BallPhysics : MonoBehaviour
    {
        public BallState State { get; private set; } = BallState.Dead;
        public Vector3 Velocity { get; private set; }
        public float Height => transform.position.y;
        [Min(0f)] public float GroundHeight = 0.065f;
        public event Action<Vector3, PitchEnd> Ended;

        Vector3 start, initialVelocity, acceleration;
        float drag, age, duration, spinRpm;
        const float Radius = 0.037f;
        TrailRenderer trail;

        void Awake() { trail = GetComponent<TrailRenderer>(); }

        public void Launch(Vector3 origin, Vector3 velocity, PitchData pitch, float seconds)
        {
            start = origin;
            initialVelocity = velocity;
            acceleration = pitch.Acceleration;
            drag = pitch.LinearDrag;
            spinRpm = pitch.SpinRpm;
            duration = seconds;
            age = 0f;
            Velocity = velocity;
            transform.position = origin;
            if (trail != null) { trail.emitting = false; trail.Clear(); trail.emitting = true; }
            State = BallState.Pitched;
        }

        void FixedUpdate()
        {
            if (State != BallState.Pitched) return;
            float nextAge = Mathf.Min(age + Time.fixedDeltaTime, duration);
            Vector3 next = At(nextAge);
            bool ground = next.y <= GroundHeight + Radius;
            if (ground)
            {
                // Find first ground contact within the step; do not tunnel underground.
                float lo = age, hi = nextAge;
                for (int i = 0; i < 18; i++)
                {
                    float mid = (lo + hi) * 0.5f;
                    if (At(mid).y > GroundHeight + Radius) lo = mid; else hi = mid;
                }
                nextAge = hi;
                next = At(nextAge);
            }
            transform.Rotate(Vector3.right, spinRpm * 6f * (nextAge - age), Space.Self);
            age = nextAge;
            transform.position = next;
            Velocity = PitchMath.VelocityAt(initialVelocity, acceleration, drag, age);
            if (ground || age >= duration) Finish(ground ? PitchEnd.Ground : PitchEnd.Plate);
        }

        Vector3 At(float time) => PitchMath.Position(start, initialVelocity, acceleration, drag, time);

        void Finish(PitchEnd reason)
        {
            State = BallState.Dead;
            if (trail != null) trail.emitting = false;
            Ended?.Invoke(transform.position, reason);
        }

        public void Cancel() { if (State == BallState.Pitched) Finish(PitchEnd.Timeout); }
    }
}
```

## 5. PitchingController.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/PitchingController.cs`

붙이는 곳: **Systems**

```csharp
using UnityEngine;

namespace PitcherCareer
{
    public enum PitchingState { Ready, Pitching, Result }

    [DisallowMultipleComponent]
    public sealed class PitchingController : MonoBehaviour
    {
        public PitcherStats Stats;
        public PitchData FourSeam;
        public Transform ReleasePoint;
        public BallPhysics Ball;
        public PitchingHUD HUD;
        public Transform WorldTarget;
        [Min(0.1f)] public float ResultHoldSeconds = 0.85f;

        public PitchingState State { get; private set; }
        public Vector3 Target { get; private set; } = new Vector3(0f, 0.9f, 0f);
        public Vector3 PlannedArrival { get; private set; }
        public Vector3 LastTarget { get; private set; }
        public Vector3 LastArrival { get; private set; }
        public int PitchCount { get; private set; }
        public string Message { get; private set; } = "AIM IN THE PANEL, THEN CLICK";
        public float LastReleaseKmh { get; private set; }
        public bool HasArrival { get; private set; }
        float enteredAt;
        PitchEnd lastEnd;

        void Start()
        {
            if (Stats == null || FourSeam == null || ReleasePoint == null || Ball == null || HUD == null)
            {
                Debug.LogError("Step 1: Missing reference on Systems/PitchingController.", this);
                enabled = false;
                return;
            }
            Ball.Ended += OnPitchEnded;
            HUD.Bind(this);
            ChangeState(PitchingState.Ready);
            Aim(Target);
        }

        void OnDestroy() { if (Ball != null) Ball.Ended -= OnPitchEnded; }

        void Update()
        {
            float elapsed = Time.unscaledTime - enteredAt;
            if (State == PitchingState.Pitching && elapsed > 4f) Ball.Cancel();
            if (State == PitchingState.Result && elapsed > ResultHoldSeconds)
                ChangeState(PitchingState.Ready);
        }

        void ChangeState(PitchingState next)
        {
            // Exit / enter work is centralized; timers never survive a transition.
            State = next;
            enteredAt = Time.unscaledTime;
        }

        public void SelectFourSeam()
        {
            if (State == PitchingState.Ready) Message = "FOUR-SEAM SELECTED - CLICK TO PITCH";
        }

        public void Aim(Vector3 target)
        {
            if (State != PitchingState.Ready) return;
            Target = new Vector3(Mathf.Clamp(target.x, -1.1f, 1.1f),
                Mathf.Clamp(target.y, 0.15f, 2.15f), 0f);
            if (WorldTarget != null) WorldTarget.position = Target;
        }

        public void Throw()
        {
            if (!enabled || State != PitchingState.Ready) return;
            LastTarget = Target;
            PlannedArrival = PitchMath.Arrival(Target, Stats, FourSeam);
            Vector3 velocity = PitchMath.Solve(ReleasePoint.position, PlannedArrival,
                Stats.EffectiveSpeedKmh * FourSeam.VelocityMultiplier / 3.6f,
                FourSeam.Acceleration, FourSeam.LinearDrag, out float duration);
            LastReleaseKmh = velocity.magnitude * 3.6f;
            HasArrival = false;
            PitchCount++;
            Message = "BALL IN FLIGHT";
            ChangeState(PitchingState.Pitching);
            Ball.Launch(ReleasePoint.position, velocity, FourSeam, duration);
        }

        void OnPitchEnded(Vector3 position, PitchEnd reason)
        {
            LastArrival = position;
            HasArrival = true;
            lastEnd = reason;
            Message = reason == PitchEnd.Plate ? "ARRIVED AT HOME PLATE" :
                reason == PitchEnd.Ground ? "IN THE DIRT - FIRST GROUND CONTACT" : "PITCH RESET";
            ChangeState(PitchingState.Result);
        }

        public string ArrivalLabel => lastEnd == PitchEnd.Plate ? "ARRIVAL" : "END POSITION";
    }
}
```

## 6. PitchingHUD.cs

프로젝트 안 위치: `Assets/PitcherCareer/Scripts/PitchingHUD.cs`

붙이는 곳: **Canvas/AimPanel**

```csharp
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace PitcherCareer
{
    // Attach to Canvas/AimPanel, the large clickable strike-zone surface.
    public sealed class PitchingHUD : MonoBehaviour, IPointerMoveHandler, IPointerDownHandler
    {
        public RectTransform AimArea;
        public Text Readout;
        public Text Status;
        public Button FourSeamButton;
        public RawImage TargetRing;
        public RawImage ArrivalRing;
        PitchingController controller;
        Texture2D ringTexture;

        public void Bind(PitchingController owner)
        {
            controller = owner;
            FourSeamButton.onClick.AddListener(controller.SelectFourSeam);
            ringTexture = new Texture2D(32, 32, TextureFormat.RGBA32, false);
            ringTexture.filterMode = FilterMode.Bilinear;
            for (int y = 0; y < 32; y++)
            for (int x = 0; x < 32; x++)
            {
                float distance = Vector2.Distance(new Vector2(x, y), new Vector2(15.5f, 15.5f));
                ringTexture.SetPixel(x, y,
                    distance > 10.5f && distance < 14f ? Color.white : Color.clear);
            }
            ringTexture.Apply();
            TargetRing.texture = ArrivalRing.texture = ringTexture;
        }

        void LateUpdate()
        {
            if (controller == null) return;
            PositionRing(TargetRing, controller.Target);
            ArrivalRing.enabled = controller.HasArrival && PositionRing(ArrivalRing, controller.LastArrival);
            FourSeamButton.interactable = controller.State == PitchingState.Ready;
            PitcherStats s = controller.Stats;
            Vector3 target = controller.Target;
            string last = controller.HasArrival ?
                $"{controller.ArrivalLabel}  {controller.LastArrival.x:F2}, {controller.LastArrival.y:F2} m\n" +
                $"LAST AIM  {controller.LastTarget.x:F2}, {controller.LastTarget.y:F2} m\n" +
                $"MISS DISTANCE  {Vector3.Distance(controller.LastArrival, controller.LastTarget) * 100f:F1} cm" :
                "ARRIVAL  --\nLAST AIM  --\nMISS DISTANCE  --";
            Readout.text =
                $"PITCHING LAB  /  STEP 01\n" +
                $"{controller.State.ToString().ToUpper()}     PITCHES  {controller.PitchCount}\n\n" +
                $"SPEED  {s.SpeedKmh:F0} / {s.EffectiveSpeedKmh:F0} km/h\n" +
                $"CONTROL  {s.Control:F0}   SIGMA  {s.ControlSigma * 100f:F1} cm\n" +
                $"MENTAL  {s.Mental:F0}\n" +
                $"FATIGUE  {s.Fatigue:F0}%    SPIN  {controller.FourSeam.SpinRpm:F0} rpm\n" +
                $"BALL  {controller.Ball.Velocity.magnitude * 3.6f:F1} km/h\n" +
                $"HEIGHT  {controller.Ball.Height:F2} m\n\n" +
                $"TARGET  {target.x:F2}, {target.y:F2} m\n{last}";
            Status.text = controller.Message;
        }

        bool PositionRing(RawImage ring, Vector3 world)
        {
            float u = (world.x + 1.1f) / 2.2f;
            float v = (world.y - 0.15f) / 2f;
            ring.rectTransform.anchoredPosition = new Vector2(
                (u - 0.5f) * AimArea.rect.width, (v - 0.5f) * AimArea.rect.height);
            return u >= 0f && u <= 1f && v >= 0f && v <= 1f;
        }

        void UpdateAim(PointerEventData data)
        {
            if (controller == null) return;
            if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(AimArea,
                data.position, data.pressEventCamera, out Vector2 local)) return;
            float u = (local.x - AimArea.rect.xMin) / AimArea.rect.width;
            float v = (local.y - AimArea.rect.yMin) / AimArea.rect.height;
            controller.Aim(new Vector3(Mathf.Lerp(-1.1f, 1.1f, u),
                Mathf.Lerp(0.15f, 2.15f, v), 0f));
        }

        public void OnPointerMove(PointerEventData data) { UpdateAim(data); }

        public void OnPointerDown(PointerEventData data)
        {
            if (data.button != PointerEventData.InputButton.Left || controller == null) return;
            UpdateAim(data);
            controller.Throw();
        }

        void OnDestroy()
        {
            if (controller != null && FourSeamButton != null)
                FourSeamButton.onClick.RemoveListener(controller.SelectFourSeam);
            if (ringTexture != null) Destroy(ringTexture);
        }
    }
}
```

## 7. PrototypeSceneBuilder.cs

프로젝트 안 위치: `Assets/PitcherCareer/Editor/PrototypeSceneBuilder.cs`

붙이는 곳: **GameObject에 붙이지 않음 — Baseball 메뉴**

```csharp
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem.UI;
#endif

namespace PitcherCareer.Editor
{
    // Editor setup only. No stadium construction work runs during gameplay.
    public static class PrototypeSceneBuilder
    {
        const string Root = "Assets/PitcherCareer";
        static Font font;

        [MenuItem("Baseball/Create Step 1 Scene")]
        public static void CreateScene()
        {
            if (Shader.Find("Universal Render Pipeline/Lit") == null)
            {
                EditorUtility.DisplayDialog("Universal 3D required",
                    "Create a Universal 3D (URP) project before importing this prototype.", "OK");
                return;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            Directory.CreateDirectory(Root + "/Scenes");
            Directory.CreateDirectory(Root + "/Data");
            Directory.CreateDirectory(Root + "/Materials");
            AssetDatabase.Refresh();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            Material grass = Material("Grass", new Color(0.10f, 0.34f, 0.23f));
            Material dirt = Material("Dirt", new Color(0.50f, 0.28f, 0.14f));
            Material chalk = Material("Chalk", new Color(0.93f, 0.93f, 0.84f));
            Material blue = Material("Uniform", new Color(0.04f, 0.24f, 0.64f));
            Material orange = Material("Batter", new Color(0.93f, 0.30f, 0.10f));
            Material wall = Material("Fence", new Color(0.035f, 0.14f, 0.14f));
            Material cyan = Material("Target", new Color(0.05f, 0.70f, 1f));

            Transform stadium = Group("Stadium");
            Shape("Grass", PrimitiveType.Cube, stadium, new Vector3(0, -0.12f, 50), new Vector3(180, 0.2f, 155), grass);
            Shape("InfieldDirt", PrimitiveType.Cylinder, stadium, new Vector3(0, -0.04f, 18), new Vector3(61, 0.08f, 61), dirt);
            GameObject diamond = Shape("InfieldGrass", PrimitiveType.Cube, stadium, new Vector3(0, 0.047f, 19.395f), new Vector3(23, 0.012f, 23), grass);
            diamond.transform.rotation = Quaternion.Euler(0, 45, 0);
            Shape("HomeDirt", PrimitiveType.Cylinder, stadium, new Vector3(0, 0.055f, 0), new Vector3(7, 0.01f, 7), dirt);
            Shape("Mound", PrimitiveType.Cylinder, stadium, new Vector3(0, 0.13f, 18.44f), new Vector3(5.5f, 0.09f, 5.5f), dirt);
            Shape("Rubber", PrimitiveType.Cube, stadium, new Vector3(0, 0.235f, 18.44f), new Vector3(0.61f, 0.03f, 0.15f), chalk);
            Line("FirstFoulLine", stadium, Vector3.zero, new Vector3(77, 0, 77), chalk);
            Line("ThirdFoulLine", stadium, Vector3.zero, new Vector3(-77, 0, 77), chalk);
            for (int i = 0; i < 24; i++)
            {
                float a = Mathf.Lerp(-45f, 45f, i / 24f) * Mathf.Deg2Rad;
                float b = Mathf.Lerp(-45f, 45f, (i + 1) / 24f) * Mathf.Deg2Rad;
                Vector3 p = new Vector3(Mathf.Sin(a) * 108, 1.5f, Mathf.Cos(a) * 108);
                Vector3 q = new Vector3(Mathf.Sin(b) * 108, 1.5f, Mathf.Cos(b) * 108);
                GameObject segment = Shape("Fence_" + i, PrimitiveType.Cube, stadium, (p + q) / 2,
                    new Vector3(0.25f, 3f, Vector3.Distance(p, q)), wall);
                segment.transform.rotation = Quaternion.LookRotation(q - p);
            }
            Transform bases = Group("Bases");
            Vector3[] basePositions = { Vector3.zero, new Vector3(19.395f, 0, 19.395f),
                new Vector3(0, 0, 38.79f), new Vector3(-19.395f, 0, 19.395f) };
            string[] baseNames = { "Home", "FirstBase", "SecondBase", "ThirdBase" };
            for (int i = 0; i < 4; i++)
            {
                GameObject bag = Shape(baseNames[i], PrimitiveType.Cube, bases,
                    basePositions[i] + Vector3.up * 0.09f, new Vector3(0.43f, 0.05f, 0.43f), chalk);
                bag.transform.rotation = Quaternion.Euler(0, 45, 0);
            }

            Transform defenders = Group("Defenders");
            string[] positions = { "P", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF" };
            Vector3[] places = { new Vector3(0, 1.18f, 18.44f), new Vector3(0, 0.8f, -1.8f),
                new Vector3(17, 1, 20), new Vector3(11, 1, 31), new Vector3(-10, 1, 31),
                new Vector3(-18, 1, 19), new Vector3(-32, 1, 70), new Vector3(0, 1, 84), new Vector3(32, 1, 70) };
            GameObject pitcher = null;
            for (int i = 0; i < positions.Length; i++)
            {
                GameObject actor = Shape(positions[i], PrimitiveType.Capsule, defenders, places[i],
                    new Vector3(0.6f, i == 1 ? 0.65f : 0.95f, 0.6f), blue);
                if (i == 0) pitcher = actor;
            }
            Shape("Batter", PrimitiveType.Capsule, null, new Vector3(-0.85f, 1, 0), new Vector3(0.6f, 0.95f, 0.6f), orange);
            PitcherStats stats = pitcher.AddComponent<PitcherStats>();
            Transform release = Group("ReleasePoint", pitcher.transform);
            release.position = new Vector3(-0.38f, 1.85f, 17f);

            Transform systems = Group("Systems");
            var controller = systems.gameObject.AddComponent<PitchingController>();
            controller.Stats = stats;
            controller.ReleasePoint = release;
            string pitchPath = Root + "/Data/FourSeam.asset";
            controller.FourSeam = AssetDatabase.LoadAssetAtPath<PitchData>(pitchPath);
            if (controller.FourSeam == null)
            {
                controller.FourSeam = ScriptableObject.CreateInstance<PitchData>();
                AssetDatabase.CreateAsset(controller.FourSeam, pitchPath);
            }
            GameObject ball = Shape("Ball", PrimitiveType.Sphere, null, release.position, Vector3.one * 0.11f, chalk);
            Object.DestroyImmediate(ball.GetComponent<Collider>());
            controller.Ball = ball.AddComponent<BallPhysics>();
            var trail = ball.AddComponent<TrailRenderer>();
            trail.sharedMaterial = chalk;
            trail.time = 0.10f;
            trail.startWidth = 0.025f;
            trail.endWidth = 0f;
            trail.minVertexDistance = 0.025f;
            trail.emitting = false;
            GameObject target = Shape("WorldTarget", PrimitiveType.Sphere, null,
                new Vector3(0, 0.9f, 0), Vector3.one * 0.075f, cyan);
            Object.DestroyImmediate(target.GetComponent<Collider>());
            controller.WorldTarget = target.transform;

            var camera = new GameObject("Main Camera").AddComponent<Camera>();
            camera.tag = "MainCamera";
            camera.transform.position = new Vector3(1.65f, 2.9f, 25f);
            camera.transform.LookAt(new Vector3(0, 0.95f, 0));
            camera.fieldOfView = 32;
            camera.farClipPlane = 220;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.41f, 0.66f, 0.80f);
            camera.gameObject.AddComponent<AudioListener>();
            var light = new GameObject("Sun").AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.25f;
            light.shadows = LightShadows.None;
            light.transform.rotation = Quaternion.Euler(45, -30, 0);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.65f, 0.68f, 0.72f);
            CreateUI(controller);

            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            string scenePath = AssetDatabase.GenerateUniqueAssetPath(Root + "/Scenes/PitchingStep1.unity");
            EditorSceneManager.SaveScene(scene, scenePath);
            Selection.activeGameObject = systems.gameObject;
            EditorGUIUtility.PingObject(AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath));
            Debug.Log("Step 1 created: " + scenePath + ". Open the Game tab and press Play.");
        }

        static void CreateUI(PitchingController controller)
        {
            var canvas = new GameObject("Canvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
            Object.FindFirstObjectByType<EventSystem>().gameObject.AddComponent<InputSystemUIInputModule>();
#else
            Object.FindFirstObjectByType<EventSystem>().gameObject.AddComponent<StandaloneInputModule>();
#endif
            RectTransform card = Box("ReadoutPanel", canvas.transform, new Vector2(356, 344), new Vector2(0, 1), new Vector2(202, -198), new Color(0.035f, 0.07f, 0.12f, 0.94f));
            Text readout = Label("Readout", card, new Vector2(322, 312), Vector2.zero, "PITCHING LAB", 18);
            readout.alignment = TextAnchor.UpperLeft;
            RectTransform pad = Box("AimPanel", canvas.transform, new Vector2(308, 280), new Vector2(1, 0), new Vector2(-182, 236), new Color(0.035f, 0.07f, 0.12f, 0.94f));
            pad.GetComponent<Image>().raycastTarget = true;
            var hud = pad.gameObject.AddComponent<PitchingHUD>();
            hud.AimArea = pad;
            hud.Readout = readout;
            controller.HUD = hud;
            Label("Legend", pad, new Vector2(308, 40), new Vector2(0, 161), "BLUE  TARGET    /    GOLD  ARRIVAL", 14);
            Label("Help", pad, new Vector2(308, 30), new Vector2(0, -161), "MOVE TO AIM  /  CLICK TO PITCH", 14);
            // 0.432 m zone width, 0.50-1.20 m height, mapped to the same target plane.
            for (int i = 0; i < 4; i++)
            {
                float x = Mathf.Lerp(-0.216f, 0.216f, i / 3f) / 2.2f * 308f;
                float y = (Mathf.Lerp(0.50f, 1.20f, i / 3f) - 1.15f) / 2f * 280f;
                Box("ZoneVertical_" + i, pad, new Vector2(1.5f, 98), Vector2.one * 0.5f,
                    new Vector2(x, -42), new Color(1, 1, 1, i == 0 || i == 3 ? 0.8f : 0.25f));
                Box("ZoneHorizontal_" + i, pad, new Vector2(60.48f, 1.5f), Vector2.one * 0.5f,
                    new Vector2(0, y), new Color(1, 1, 1, i == 0 || i == 3 ? 0.8f : 0.25f));
            }
            hud.TargetRing = Ring("TargetRing", pad, new Color(0.08f, 0.65f, 1f));
            hud.ArrivalRing = Ring("ArrivalRing", pad, new Color(1f, 0.74f, 0.20f));
            hud.ArrivalRing.enabled = false;
            RectTransform buttonRect = Box("FourSeamButton", canvas.transform, new Vector2(308, 48),
                new Vector2(1, 0), new Vector2(-182, 43), new Color(0.025f, 0.37f, 0.67f));
            buttonRect.GetComponent<Image>().raycastTarget = true;
            hud.FourSeamButton = buttonRect.gameObject.AddComponent<Button>();
            hud.FourSeamButton.targetGraphic = buttonRect.GetComponent<Image>();
            Label("ButtonText", buttonRect, new Vector2(300, 40), Vector2.zero, "4S  |  FOUR-SEAM", 20);
            Text status = Label("Status", canvas.transform, new Vector2(830, 48), new Vector2(-170, -305), "READY", 18);
            hud.Status = status;
        }

        static Transform Group(string name, Transform parent = null)
        {
            Transform t = new GameObject(name).transform;
            t.SetParent(parent, false);
            return t;
        }

        static Material Material(string name, Color color)
        {
            string path = Root + "/Materials/" + name + ".mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material != null) return material;
            material = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            material.color = color;
            material.SetFloat("_Smoothness", 0.15f);
            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        static GameObject Shape(string name, PrimitiveType kind, Transform parent,
            Vector3 position, Vector3 scale, Material material)
        {
            GameObject go = GameObject.CreatePrimitive(kind);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.position = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = material;
            return go;
        }

        static void Line(string name, Transform parent, Vector3 a, Vector3 b, Material material)
        {
            GameObject line = Shape(name, PrimitiveType.Cube, parent, (a + b) / 2 + Vector3.up * 0.07f,
                new Vector3(0.055f, 0.018f, Vector3.Distance(a, b)), material);
            line.transform.rotation = Quaternion.LookRotation(b - a);
        }

        static RectTransform Rect(string name, Transform parent, Vector2 size, Vector2 anchor, Vector2 position)
        {
            var rect = new GameObject(name, typeof(RectTransform)).GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.anchorMin = rect.anchorMax = anchor;
            rect.sizeDelta = size;
            rect.anchoredPosition = position;
            return rect;
        }

        static RectTransform Box(string name, Transform parent, Vector2 size, Vector2 anchor, Vector2 position, Color color)
        {
            RectTransform rect = Rect(name, parent, size, anchor, position);
            Image image = rect.gameObject.AddComponent<Image>();
            image.color = color;
            image.raycastTarget = false;
            return rect;
        }

        static Text Label(string name, Transform parent, Vector2 size, Vector2 position, string content, int fontSize)
        {
            RectTransform rect = Rect(name, parent, size, Vector2.one * 0.5f, position);
            Text label = rect.gameObject.AddComponent<Text>();
            label.font = font;
            label.fontSize = fontSize;
            label.color = Color.white;
            label.alignment = TextAnchor.MiddleCenter;
            label.text = content;
            label.raycastTarget = false;
            return label;
        }

        static RawImage Ring(string name, Transform parent, Color color)
        {
            RawImage image = Rect(name, parent, new Vector2(22, 22), Vector2.one * 0.5f, Vector2.zero).gameObject.AddComponent<RawImage>();
            image.color = color;
            image.raycastTarget = false;
            return image;
        }
    }
}
```
