# Diamond Road — 플레이용 웹페이지 (빌드 결과)

이 폴더는 `diamond-road/web`을 `npm run build`한 결과입니다. 서버 없이 정적 파일만으로 동작합니다.

- GitHub Pages: 저장소 Settings → Pages → Branch를 이 브랜치(또는 main) / root로 두면
  `https://<아이디>.github.io/<저장소>/game/` 에서 플레이할 수 있습니다.
- 내 PC: `diamond-road/web`에서 `npm ci` 후 `npm run preview`
  (index.html을 파일로 직접 더블클릭하면 브라우저 보안 때문에 모듈 스크립트가 막힐 수 있습니다.)

소스를 고친 뒤에는 `npm run build`를 다시 하고 `web/dist` 내용을 이 폴더에 복사하세요.
