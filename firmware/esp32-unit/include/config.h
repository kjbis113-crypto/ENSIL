#pragma once

// ── 네트워크 (docs/EXHIBITION_SETUP.md §6) ──────────────────
// 목업 셋은 각자 AP 를 띄운다 (No.1 CROSS-LED / No.2 TENDON / No.3 BADANABI, 암호 12345678, 192.168.4.1).
// 허브는 전원만 넣은 전용 ESP32 AP "archive" (env:hub). 노트북(브릿지)·아이맥·목업 셋(STA) 이 여기 붙는다.
// 노트북은 archive 안에서 고정 IP 192.168.4.100 → 브릿지 주소.
#define ENSIL_HUB_SSID     "archive"
#define ENSIL_HUB_PASS     "12345678"   // 허브 보드에 넣은 암호와 같게
#define ENSIL_HUB_CHANNEL  6
#define ENSIL_BRIDGE_HOST  "192.168.4.100"
#define ENSIL_BRIDGE_PORT  7777

// 이 스켈레톤(main.cpp)이 띄우는 자기 AP — 기존 펌웨어를 쓰면 무시된다
#if UNIT == 1
  #define OWN_AP_SSID "CROSS-LED"
#elif UNIT == 2
  #define OWN_AP_SSID "TENDON"
#elif UNIT == 3
  #define OWN_AP_SSID "BADANABI"
#endif
#define OWN_AP_PASS     "12345678"
#define AP_MAX_CLIENTS  8   // 허브: 목업 3 + 노트북 + 아이맥 + 폰 여유

// ── 핀 (보드 배선에 맞게) ─────────────────────────────────
#if UNIT == 1
  #define PIN_SWITCH   3    // 스위치 → GND (INPUT_PULLUP)
  #define PIN_PIXELS   4    // 네오픽셀 데이터
  #define PIXEL_COUNT  17
#elif UNIT == 2
  #define PIN_PIR      3    // PIR OUT
  #define PIN_SERVO    4    // 서보 신호
  #define SERVO_REST   20
  #define SERVO_PULL   120
#elif UNIT == 3
  #define PIN_AMP      12   // 앰프 enable / 사운드 트리거 (기존 코드에 맞게)
#endif
