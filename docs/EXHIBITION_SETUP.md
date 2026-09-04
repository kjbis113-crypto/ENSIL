# 전시 운용 — 아이맥(콘솔) + 빔프로젝터(스테이지) 연동

> 2026-09-03 · 브랜치 `codex/design-system`
> 관련 코드: `src/state/fieldLink.ts` · `src/state/useStageWindow.ts` · `src/routes/Stage.tsx` · `src/routes/Field.tsx` · `bridge/index.js`

## 결론부터

**아이맥 한 대에 프로젝터를 유선(HDMI)으로 붙이고, 같은 Chrome에서 창 두 개를 띄운다.**
노트북을 따로 두지 않는다. 이유는 아래 §3.

```
┌──────────── iMac 24" ────────────┐        USB-C → HDMI        ┌──── 빔프로젝터 ────┐
│ 창 1  #/        관람객 메인(다이얼) │ ───────────────────────▶ │ 창 2  #/stage      │
│       #/field   콘솔(파노라마)     │   BroadcastChannel        │  3D 공용 필드       │
│       ↳ 개체 선택 → focus          │   (같은 브라우저 안,       │  focus → 개체 부각  │
│       ↳ SEND SIGNAL → pulse       │    서버·네트워크 0)        │  pulse → 개체 반응  │
│       ← STAGE / LINKED, 개체 상태  │ ◀──────────────────────  │  snapshot 1초 주기  │
└──────────────────────────────────┘                             └────────────────────┘
```

## 1. 관람 흐름

| 관람객이 아이맥에서 | 프로젝터에서 일어나는 일 |
|---|---|
| 다이얼을 돌려 ENSIL 텍스트를 읽는다 | 필드가 자율적으로 계속 움직인다 (카메라가 3분에 한 바퀴) |
| 개체 원을 클릭 → 아카이브 개체 페이지 | (변화 없음) |
| FIELD 진입 → 파노라마에서 핫스팟(흰 원) 클릭 | 해당 개체가 살짝 커지며 활성 (`focus`) |
| 조우 카드의 **SEND SIGNAL TO STAGE** | 화면 전체에 민트가 한 번 번지고, 그 개체가 크게 반응 (`pulse`: 활동·신호·긴장 상승, 4~6초) |
| — | 개체 상태(idle/curious/startled…)가 1초마다 콘솔로 돌아와 핫스팟 라벨 `STAGE / …`과 카드 `ON STAGE`에 표시 |

콘솔은 스테이지가 없어도 완전히 동작한다. 스테이지가 없으면 `STAGE / OFFLINE`, 버튼은 `STAGE OFFLINE`으로 잠긴다.

## 2. 운용 절차 (전시 당일)

1. **macOS 디스플레이 설정** — 시스템 설정 → 디스플레이: 프로젝터를 *확장*(미러링 끔). 해상도는 프로젝터 네이티브(보통 1920×1080).
   *Mission Control → "디스플레이마다 별도의 작업 공간 사용" 끔* — 켜져 있으면 한쪽을 전체화면으로 만들 때 다른 쪽이 검게 비는 경우가 있다.
   에너지 절약: 디스플레이 끄기 *안 함*, 화면 보호기 끔.
2. Chrome에서 사이트를 연다 (로컬 `npm run preview` 또는 배포본). 메인 창은 아이맥 화면에 전체화면(⌃⌘F).
3. **Ctrl+Alt+Shift+O** (맥: control+option+shift+O) — 스테이지 창이 열린다.
   - Chrome이 "창 관리" 권한을 허용하면 두 번째 화면(프로젝터)에 바로 뜬다. 처음 한 번은 권한 팝업 → 허용.
   - 권한이 없으면 현재 화면에 뜬다 → 창을 프로젝터로 드래그.
4. 스테이지 창을 **한 번 클릭**(또는 `F`) → 전체화면. 좌상단 `CONSOLE LINKED` 점이 민트면 연결된 것.
5. 메인 창으로 돌아와 `#/`. 끝.

같은 단축키를 다시 누르면 새 창이 아니라 기존 스테이지 창을 앞으로 가져온다.

### 리허설 체크
- 아이맥 창에서 FIELD → 핫스팟 클릭 → 프로젝터의 해당 개체가 커지는지
- SEND SIGNAL → 프로젝터가 민트로 번지는지, 콘솔 라벨에 `STAGE / CURIOUS` 같은 상태가 도는지
- 두 창 다 전체화면인 상태에서 커서가 프로젝터 화면으로 넘어가지 않는지 (넘어가면 액체 커서가 거기 그려진다 — 마우스 이동 범위를 아이맥 쪽에 두거나, 스테이지 창을 프로젝터 화면 *오른쪽*에 배치하고 마우스를 왼쪽에 둔다)

## 3. 왜 노트북 분리가 아닌가

| | 아이맥 1대 + HDMI (권장) | 노트북 분리 + 네트워크 |
|---|---|---|
| 연동 방식 | BroadcastChannel (브라우저 내부) | WebSocket 릴레이 (브릿지) |
| 실패 지점 | 케이블 1개 | 케이블/스위치/IP/방화벽/두 대의 전원·잠자기 |
| 지연 | 0 | 유선 LAN이면 ~1ms, 무선이면 불규칙 |
| 설치 | 창 하나 더 열기 | 두 대 세팅, 브릿지 프로세스 상시 실행 |
| GPU | 아이맥 M-시리즈가 두 창 모두 렌더 | 나눠 렌더 |

아이맥 24"(M1/M3)는 외부 디스플레이 1대(6K까지)를 지원하므로 프로젝터 1대면 충분하다.
GPU 부하는 랜딩(유체+영상 스크럽)과 3D 필드가 동시에 도는 정도인데, 스테이지의 3D 필드는
픽셀비 1.5 이하로 제한돼 있고 랜딩 유체는 유휴 시 0 비용이라 M1에서 여유가 있다.
리허설에서 프레임이 떨어지면 `HabitatWorld`의 `setPixelRatio` 상한을 1로 내리는 것이 첫 조치.

### 그래도 노트북을 써야 한다면 (프로젝터가 멀리 있거나, HDMI 케이블이 닿지 않을 때)

**직결 이더넷(유선)** 으로 간다. 와이파이는 전시장 공용망·캡티브 포털·전파 간섭 때문에 배제.

1. 아이맥 ↔ 노트북을 USB-C 이더넷 어댑터 + 랜선으로 직결 (또는 작은 스위치). 양쪽 수동 IP: 아이맥 `10.0.0.1`, 노트북 `10.0.0.2`, 서브넷 `255.255.255.0`.
2. 노트북에서 브릿지 실행: `cd bridge && npm install && node index.js --demo` (하드웨어 없으면 `--demo`; 브릿지는 `{type:'field'}` 메시지를 다른 클라이언트로 그대로 중계한다).
   브릿지 포트 7777이 노트북 방화벽에서 열려 있어야 한다.
3. 웹 빌드에 릴레이 주소를 넣는다: `.env.local`에 `VITE_FIELD_LINK_URL=ws://10.0.0.2:7777` → 빌드(Node 22) → 양쪽 모두 이 빌드를 연다 (노트북은 `#/stage`, 아이맥은 `#/`).
4. 나머지 관람 흐름은 동일. `fieldLink.ts`는 BroadcastChannel과 릴레이를 동시에 쓰므로 코드 변경 없음.

## 4. 프로토콜 (`src/state/fieldLink.ts`)

| 방향 | 메시지 | 의미 |
|---|---|---|
| 양쪽 | `{type:'hello', role}` | 2초 주기 생존 신호. 6초 안 오면 OFFLINE |
| 콘솔→스테이지 | `{type:'focus', id\|null}` | 선택한 개체 (스테이지 `selectedId`) |
| 콘솔→스테이지 | `{type:'pulse', id, strength}` | 신호 던지기 → `HabitatWorld.activate(id, strength)` |
| 스테이지→콘솔 | `{type:'snapshot', items:[{id,state,energy}]}` | 개체 상태, 1초 주기 |

봉투는 `{role, msg}` (BroadcastChannel) / `{type:'field', role, msg}` (릴레이). 자기 role 메시지는 버린다.

## 6. 하드웨어 목업(ESP32) 연동 — 2026-09-04 개정

현장 제약: 아이맥은 구형(Chrome만), 공유기·핫스팟 반입 불가, 학교 와이파이는 5GHz(ESP32 불가), 인터넷 없음.
목업 셋은 **각자 AP + 조작 웹페이지**를 띄운다 (No.1 CROSS-LED ch6 cross.local / No.2 TENDON ch1 tendon.local /
No.3 BADANABI ch11 badanabi.local, 암호 12345678, 각자 192.168.4.1).

한 컴퓨터는 와이파이 하나에만 붙으므로 **No.1 CROSS-LED 를 허브로 정한다.** No.2·No.3 은 자기 AP 를 유지한 채
AP+STA 로 CROSS-LED 에 추가 접속하고(한 라디오라 자기 AP 채널이 6으로 따라감 — 트래픽이 작아 문제없음),
노트북(브릿지 + 사이트 서버)과 아이맥도 CROSS-LED 에 붙는다.

```
 No.1 CROSS-LED  ── 허브 AP 192.168.4.1 (자기 망 안의 브릿지에 접속) ──┐
 No.2 TENDON     ── 자기 AP 유지 + STA→CROSS-LED ────────────────────┤
 No.3 BADANABI   ── 자기 AP 유지 + STA→CROSS-LED (소리 깨지면 링크 끔) ┤
                                                                     ▼
 노트북 (CROSS-LED 접속, 고정 IP 192.168.4.100)  node bridge/index.js  ── ws :7777  +  사이트 http :8080
                                                                     ▲
 아이맥 (CROSS-LED 접속, Chrome)  http://192.168.4.100:8080  ──────────┘   ← 창 2개(#/ 와 #/stage)
```

- 목업 → 브릿지 → 웹: `{"type":"trigger","unit":2,"level":2,"intensity":0.66}` → 아이맥이 **메인 다이얼로 → 그 개체로 회전 → 활성 원이 화면을 덮으며 개체 페이지**, 스테이지엔 pulse
- 웹 → 브릿지 → 목업: `{"type":"act","unit":2,"level":2,"intensity":1}` → 목업의 동작 (`level` = 조작 페이지의 버튼 단계 1~3)
- 슬롯 `src/input/units.ts`: 1=NO.01 십자형, 2=NO.02 텐던, 3=NO.03 바다나비(스피커), 4=NO.04 전구군(미정)
- 인터넷 없음은 문제없다: 사이트는 폰트·모델·영상 전부 번들이라 외부 요청이 0이고, 노트북이 서빙한다. **단 Vercel 링크는 못 쓴다.**

### 화면 규칙 (`src/state/useHardwareLink.ts`, `IndexVideoCarousel` 진입 시퀀스)
- 아이맥이 유휴(6초간 입력 없음)면 즉시 시퀀스. 조작 중이면 상단 중앙에 `NO.02 · SIGNAL RECEIVED / OPENING WHEN IDLE` 칩만 띄우고, 손을 떼면 시퀀스
- 시퀀스: `#/`로 → 다이얼이 그 개체 노드로 회전(0.9초) → 활성 원이 부풀어 화면을 덮음(0.76초) → `#/creature/:id`
- 이동 후 90초 유휴면 랜딩으로 복귀. 같은 목업의 재감지는 8초에 한 번만 반영. 상단 중앙 `BRIDGE / 02 UNITS`가 접속 목업 수
- 키보드 `Shift+1~4`로 목업 없이 시험 가능

### 로컬 실행 세팅 순서 (깃헙 → 노트북)

빌드는 Node 22가 필요하고 노트북이 구형이라, **빌드는 개발 PC에서 하고 결과물만 노트북에 넣는다.**

개발 PC (Node 22):
```
git clone https://github.com/kjbis113-crypto/ENSIL.git
cd ENSIL
npm ci
npm run build                 # → dist/  (Node 24면 크래시, debug.md #1)
```
`ENSIL` 폴더 전체(`dist/` 포함, `node_modules/`는 제외해도 됨)를 USB로 노트북에 복사.

노트북 (Node 18 이상이면 됨, https://nodejs.org LTS):
```
cd ENSIL/bridge
npm install                   # ws 만 필수. serialport 네이티브 빌드가 실패해도 무방
cd ..
node bridge/index.js --no-serial
```
`ws://0.0.0.0:7777 대기 중` 과 `사이트 서빙: http://0.0.0.0:8080` 두 줄이 뜨면 준비 끝. 방화벽이 물으면 **허용**.

네트워크:
1. No.1(CROSS-LED)을 먼저 켠다 — 이 보드가 곧 망이다
2. 노트북 와이파이를 `CROSS-LED`(12345678)에 붙이고, 어댑터 IPv4를 수동 `192.168.4.100 / 255.255.255.0 / 게이트웨이 192.168.4.1`
3. 아이맥도 `CROSS-LED`에 붙인다 (DHCP 그대로). Chrome에서 `http://192.168.4.100:8080` → 브릿지 주소는 자동 유도
4. No.2·No.3 을 켠다 → 브릿지 로그에 `목업 unit 2 tendon 접속` 등, 아이맥 상단 중앙 `BRIDGE / 03 UNITS`
5. 아이맥에서 Ctrl+Alt+Shift+O 로 스테이지 창(§2)

사이트를 다른 곳에서 열 땐 주소 뒤에 `?bridge=192.168.4.100:7777` 한 번(이후 기억됨). 개발 중엔 `npm run dev` + `node bridge/index.js --demo`.

### 펌웨어 (`firmware/esp32-unit`)
기존 PlatformIO 프로젝트에 `include/ensil_link.h` 하나를 넣고 네 줄만 부른다 (README 참조):
`ensilLinkBegin(unit, name, hub)` / `ensilLinkTick()` (No.2 는 webTick 안에서도) / `ensilLinkTrigger(level, intensity)` / `ensilLinkOnAct(fn)`.
No.1 만 `hub=true`. 브릿지 주소 기본 `192.168.4.100:7777`. No.3 소리가 깨지면 `ENSIL_LINK_ENABLED 0`.
`src/main.cpp` 는 기존 펌웨어가 없을 때의 스켈레톤.

### 리허설 체크
- 브릿지 로그에 목업 접속 세 줄 → 아이맥 `BRIDGE / 03 UNITS`
- 목업을 건드리면 브릿지 로그 `trigger unit n` → 아이맥이 다이얼로 돌아가 회전 후 개체 페이지로, 프로젝터가 민트로 번짐
- No.1 전원이 곧 망 전체다. 처음에 켜고 마지막에 끈다. No.1 이 재부팅되면 노트북·아이맥 와이파이를 다시 확인
- 트래픽이 ESP32 AP를 거치므로 아이맥의 첫 로드(영상·GLB 약 30MB)는 30초 이상 걸릴 수 있다. 개장 전에 모든 화면을 한 번씩 열어 캐시
- No.2 의 블로킹 sweep 동안 `ensilLinkTick()` 이 불리지 않으면 WS가 끊긴다 — webTick 안에 같이 넣었는지 확인

### 구형 아이맥 리스크
사이트가 쓰는 CSS(`color-mix`, `offset-path: ellipse`)는 Chrome 116 이상이 필요하다. 아이맥의 macOS가 오래돼 Chrome이 그 아래에서 멈춰 있으면
다이얼이 깨진다. 전시 전 아이맥에서 `chrome://version`을 확인할 것. 안 되면 노트북이 아이맥 대신 메인 화면을 맡고 아이맥은 프로젝터 역할로 바꾸는 편이 낫다.

## 7. 다음에 할 수 있는 것

- **웹 → 목업 동작 UI** — `useHardwareLink().actUnit(record)` 가 이미 있으니 개체 페이지/조우 카드에 "ACTIVATE BODY" 버튼만 붙이면 된다

- **스테이지 전용 연출** — 지금 스테이지는 `EcosystemCanvas`(3D 공용 필드)에 크롬만 뺀 상태. 프로젝터용 별도 씬(예: 파노라마+개체 실루엣, 혹은 유체 베일을 프로젝터에서 키컬러 전면으로)을 만들면 `Stage.tsx`의 캔버스만 교체하면 된다. `pulse`/`focus`/`snapshot` 인터페이스는 그대로.
- **pulse 강도 조절** — 콘솔에서 길게 누르는 시간만큼 `strength`(0.3~2)를 보내면 반응 크기가 달라진다.
- **관람객 다이얼과의 연동** — 랜딩의 다이얼 회전을 `focus`로 흘려보내면 메인 화면을 돌리는 것만으로 프로젝터 개체가 차례로 깨어난다 (IndexVideoCarousel은 협업자 소유라 합의 후).
- **피지컬 입력** — 브릿지의 IMU tilt는 이미 `useInput`에 수신 경로가 있다. 스테이지에서 tilt를 카메라 기울기로 쓰면 목업 조작이 프로젝터에 반영된다.
