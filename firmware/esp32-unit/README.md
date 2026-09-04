# ENSIL 목업 ↔ 웹 연결 (ESP32, PlatformIO)

목업 펌웨어는 각자 AP + 웹페이지(cross.local / tendon.local / badanabi.local)를 이미 띄우고 있다.
웹(아이맥)과 이어주는 데 필요한 것은 **`include/ensil_link.h` 하나를 기존 프로젝트에 넣고 네 줄 부르는 것**뿐이다.

```cpp
#include "ensil_link.h"                        // lib_deps: gilmaimon/ArduinoWebsockets, bblanchon/ArduinoJson
void setup() { ...; ensilLinkBegin(2, "tendon", /*hub=*/false); ensilLinkOnAct(myAct); }
void loop()  { ...; ensilLinkTick(); }         // No.2 는 sweep()/restFor() 안의 webTick() 에서도 같이
...감지→동작한 자리:  ensilLinkTrigger(n, n / 3.0f);   // n = 버튼 단계 1~3
```

- 허브는 전원만 넣은 전용 ESP32 AP `archive` (`pio run -e hub -t upload`). 목업 셋은 전부 `hub=false`.
- 목업은 자기 AP 를 유지한 채 AP+STA 로 `archive` 에 추가 접속. 한 라디오라 자기 AP 채널이 허브 채널(6)로 따라간다.
- 브릿지 주소는 노트북 고정 IP `192.168.4.100:7777` (`ENSIL_BRIDGE_HOST` 로 바꿀 수 있음).
- No.3 에서 소리가 깨지면 `#define ENSIL_LINK_ENABLED 0` — 소리가 먼저.

`src/main.cpp` 는 기존 펌웨어가 없을 때의 최소 스켈레톤(자기 AP + 감지→동작 + 보고)이다.
`pio run -e unit1|unit2|unit3 -t upload`. 구성·현장 절차는 `docs/EXHIBITION_SETUP.md` §6.
