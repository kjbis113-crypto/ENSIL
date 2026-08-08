# 디버깅 기록

> 중요한 디버깅 사항만 기록한다. 항목마다 **증상 → 원인 → 조치 → 교훈** 순.
> 최신 항목이 위.

---

## #8 3D 라벨 스프라이트가 검은 상자로 렌더됨 — 2026-08-08

**증상** — Three.js 개체 라벨(캔버스 텍스처 스프라이트)이 투명 배경 대신 검은 사각형.

**원인** — 선택 외 개체를 흐리게 하는 `setGroupOpacity`가 그룹을 traverse하며
`material.transparent = opacity < 1`을 일괄 설정 → 불투명(1) 복원 시 SpriteMaterial의
`transparent`까지 꺼져서 캔버스 알파 채널이 무시됨.

**조치** — traverse에서 `isSprite`는 건너뛴다.

**교훈** — 머티리얼 일괄 조작은 타입을 가려서. 스프라이트/라인은 메시와 규칙이 다르다.

---

## #6 표본 주석(콜아웃)이 화면 밖으로 밀려남 — 2026-08-08

**증상** — 헤드리스 스크린샷 검증에서 주석 마커·선이 비주얼 우측 바깥에 그려지고,
좌측 라벨 박스는 아예 보이지 않음.

**원인** — `AnnotationLayer`가 `.visual-wrap`(transform으로 중앙 배치된 452px 박스) 안에
렌더되는데, 좌표는 컨테이너(`.specimen`) 기준으로 계산했다. absolute 요소의 기준이
transform된 부모가 되면서 전체가 비주얼 박스의 오프셋만큼 밀림.

**조치** — `AnnotationLayer`를 `.specimen` 직속 형제로 이동. 좌표계와 포지셔닝 컨텍스트 일치.

**교훈** — `transform`이 있는 요소는 absolute 자식의 containing block이 된다.
좌표를 계산하는 좌표계와 DOM상 부모를 반드시 일치시킬 것. 그리고 **레이아웃 코드는
스크린샷으로 검증할 것** — 이 버그는 M4 때 들어갔는데 이제야 발견됐다.

---

## #7 파티클 균일 샘플링의 모아레 — 2026-08-08

**증상** — 로고 파티클이 물결무늬(사선 웨이브)로 규칙적으로 배열되어 인쇄 망점처럼 보임.

**원인** — 어두운 픽셀을 row-major 순회 + 균일 스트라이드로 솎아내면 주기적 격자가 남는다.

**조치** — 홈 좌표에 결정적 지터(±1.2 샘플 픽셀, sin 해시) 추가. 클라우드 질감으로 해소.

---

## #1 `vite build`가 Node 24에서 네이티브 크래시 (0xC0000409) — 2026-08-08

**증상**
- `npm run build` 실행 시 `✓ 55 modules transformed.` 직후 아무 에러 메시지 없이 종료.
- 종료 코드 `-1073740791` (= `0xC0000409`, STATUS_STACK_BUFFER_OVERRUN / fail-fast).
- `tsc`는 통과. 크래시는 vite의 번들 렌더링 단계 진입 직전.
- 처음 두 번은 같은 코드가 정상 빌드됐다가 이후 100% 재현으로 바뀜.

**조사 과정 (바이섹트)**
1. 시뮬 신규 코드 제거(스텁) → 여전히 크래시 → 신규 코드 무죄
2. CSS gradient 제거 → 크래시 → CSS 무죄
3. 이전 성공 커밋(HEAD) 그대로 빌드 → **크래시** → 소스가 아니라 환경 문제
4. 최소 프로젝트(html+js 1개) → 성공 → 툴체인 자체는 동작
5. react만 포함(29모듈) → 성공 / react-router 추가(32모듈) → 크래시 → 라우터 의심
6. react-router 완전 제거한 전체 앱(53모듈) → **크래시** → 라우터도 무죄, 모듈 규모 임계 문제
7. rollup을 네이티브 → wasm(`@rollup/wasm-node`)으로 교체 → 여전히 크래시
8. **Node 22로 동일 빌드 → 성공.** Node 24.13.0으로만 실패. → **원인: Node 24.13.0**

**조치**
- `package.json`에 `"engines": { "node": "^20 || ^22" }` 명시.
- rollup은 wasm 오버라이드 유지 (`overrides.rollup = npm:@rollup/wasm-node`) —
  Windows에서 네이티브 `.node` 파일 잠김 문제(#2)까지 함께 회피.
- `react-router-dom`은 조사 중 이미 제거 → **자체 해시 라우팅 훅**(`src/state/useHashRoute.ts`)으로
  대체 완료. 라우트가 2개뿐이라 오히려 구조가 단순해져 되돌리지 않음 (plan.md §3).
- `npm run dev`는 rollup을 쓰지 않으므로(esbuild) Node 24에서도 정상. **빌드만 Node 20/22 필요.**
- Vercel 연결 시 프로젝트 설정에서 Node 버전을 22.x로 지정할 것 (engines 필드로도 유도됨).

**교훈**
- 소스 바이섹트 전에 "이전에 성공했던 커밋이 지금도 빌드되는가"를 먼저 확인할 것.
  이 한 번이면 소스/환경 문제를 즉시 가를 수 있었다 (여기선 3번째에야 확인함).
- 종료 코드 `-1073740791`은 Windows fail-fast — 이벤트 로그에도 안 남는 경우가 있다.
  다른 Node 버전으로 교차 실행이 가장 빠른 판별법.

---

## #2 npm 재설치 실패 — 네이티브 바이너리 파일 잠김 — 2026-08-08

**증상** — `Remove-Item node_modules` 시 `esbuild.exe`, `rollup.win32-x64-msvc.node` 접근 거부.

**원인** — 이전에 실행한 esbuild 서비스 프로세스와 크래시한 vite의 잔류(좀비) node 프로세스가
바이너리를 잡고 있었음.

**조치** — `Get-Process esbuild, node | Stop-Process -Force` 후 삭제·재설치.

**교훈** — Windows에서 node_modules 재설치가 실패하면 먼저 esbuild/node 프로세스부터 확인.

---

## #3 시뮬 엔진: 결속(bonding) 니즈가 회복되지 않음 — 2026-08-08

**증상** — 120초 헤드리스 테스트에서 `interact` 상태가 거의 발생하지 않고(1초 샘플 중 12회)
여러 개체의 bonding이 0.2대에 방치됨.

**원인** — SEEK 목표를 "동종 개체의 출발 시점 좌표(스냅샷)"로 잡아서, 상대가 움직이면
영원히 도착 판정이 나지 않았다. 쫓는 쪽과 쫓기는 쪽 속도가 비슷해 따라잡지도 못함.

**조치** — `engine.ts`의 seek 분기에서 bonding SEEK일 때 ① 매 tick 목표를 현재 kin 좌표로
갱신하고 ② `KIN_RADIUS` 이내로 근접하면 도착 판정 없이 즉시 `interact`로 전환.
→ interact 12→28회, rest 상태도 발생, bonding 정상 회복 확인.

**교훈** — 움직이는 목표는 스냅샷 좌표로 추적하지 말 것. "도착"과 "근접"을 구분할 것.

**검증 방법(재사용)** — 엔진은 React 없이 단독 실행 가능:
```
npx esbuild src/sim/engine.ts src/sim/world.ts --bundle --format=esm --outdir=<임시폴더> --out-extension:.js=.mjs
node <검증 스크립트>   # createWorld → tick 3600회 → 니즈 범위·상태 다양성·ambientCharge 반응 assert
```

---

## #4 PowerShell 5.1 파일 조작이 한글(UTF-8)을 깨뜨림 — 2026-08-08

**증상** — `(Get-Content -Raw) -replace ... | Set-Content -Encoding utf8`로 CSS를 수정하자
한글 주석이 전부 mojibake(`???ㅽ겕濡?`)로 변함.

**원인** — PowerShell 5.1의 `Get-Content`는 BOM 없는 UTF-8을 시스템 코드페이지(CP949)로
읽는다. 읽는 순간 이미 깨진 것을 utf8로 다시 저장해 이중 인코딩.

**조치** — 수정 전에 만든 `Copy-Item` 백업(바이트 단위 복사라 안전)으로 복원.

**교훈** — 한글 포함 소스는 PowerShell 텍스트 파이프라인으로 만지지 말 것.
백업은 `Copy-Item`(바이트 복사)으로. `git stash`를 임시 백업으로 쓰지 말 것 —
이번에 stash→drop 실수로 파일을 날려 `git fsck --unreachable`로 복구했다.

---

## #5 Windows에서 node ESM import는 드라이브 문자 경로 불가 — 2026-08-08

**증상** — 테스트 스크립트에서 `import ... from 'C:/.../engine.mjs'` →
`ERR_UNSUPPORTED_ESM_URL_SCHEME` ("protocol 'c:'").

**조치** — `file:///C:/...` URL 형식으로 변경.
