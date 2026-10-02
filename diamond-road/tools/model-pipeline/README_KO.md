# 선수 모델 변환 (개발용)

Mixamo에서 받은 FBX를 웹 게임용 GLB 두 개(`web/public/models/player.glb`, `anims.glb`)로 만든다.
게임 빌드에는 포함되지 않는 도구다.

1. `npm install` (이 폴더)
2. FBX → GLB: `node_modules/fbx2gltf/bin/Linux/FBX2glTF --binary --input <파일>.fbx --output <이름>`
   - 캐릭터(With Skin) → `out/character.glb`
   - 애니메이션(Without Skin, 30fps) → `anim/<클립이름>.glb` (파일 이름이 게임 클립 이름: `pitch_r`, `swing_l`, `diving_r` …, 소문자로 바뀐다)
3. `node opt.mjs` → `out/player.glb`, `out/anims.glb` 를 `web/public/models/`에 복사
4. 새 클립을 쓰려면 `web/lib/game/avatars.ts`의 `ClipName`과 `CLIP_KEYS`(릴리스·컨택 같은 순간), `field.ts`의 `driveAvatars`에 연결한다.

opt.mjs가 하는 일: 노멀/금속 텍스처와 속눈썹 제거, 삼각형 약 9천 개로 단순화, 텍스처 JPEG 1024/512, meshopt 압축.
애니메이션은 한 파일로 합치고 모든 클립이 첫 번째 뼈대를 움직이게 바꾼다(엉덩이 외 이동·스케일 트랙 제거).

현재 `anims.glb`는 25개 클립이다(v11.7에 `turn180`, `trip`, `fall_flat`, v11.9에 `run_turn`, v11.10에 `hit_high`, `hit_mid`, `hit_low`). 걷기·조깅·실망 걷기 클립은 v11.9 정리 때 뺐다. 캐릭터는 그대로 두고 애니메이션만 다시 만들 때는
`opt.mjs`의 `---- animations` 부분만 실행하면 된다. `turn180`은 0.95초 이후 몸이 뒤집히는 구간이 있어 게임은 앞부분만 쓴다(`CLIP_KEYS.turnFrom/turnTo`).
