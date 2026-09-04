/*
 * ENSIL 목업 펌웨어 스켈레톤 — 기존 펌웨어(각자 AP + 웹페이지)가 이미 있으면 이 파일은 참고용이고,
 * 실제로 옮겨 붙일 것은 include/ensil_link.h 하나다 (그 파일 상단의 4줄 사용법 참조).
 *
 * 여기서는 "자기 AP + 감지→동작 + 브릿지 보고"의 최소 구성을 보여준다.
 *   목업 → 브릿지  {"type":"hello","unit":2,"name":"tendon"}
 *   목업 → 브릿지  {"type":"trigger","unit":2,"action":"detect","level":2,"intensity":0.66}
 *   브릿지 → 목업  {"type":"act","unit":2,"level":2,"intensity":1}
 */

#include <Arduino.h>
#include <WiFi.h>
#include "config.h"

#if defined(HUB)
// ── 전용 허브 보드: 전원만 넣으면 AP "archive" 를 띄운다. 노트북·아이맥·목업 셋이 여기 붙는다 ──
void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ENSIL_HUB_SSID, ENSIL_HUB_PASS, ENSIL_HUB_CHANNEL, 0, AP_MAX_CLIENTS);
  Serial.printf("ENSIL hub AP %s  ip %s\n", ENSIL_HUB_SSID, WiFi.softAPIP().toString().c_str());
}
void loop() {
  static unsigned long last = 0;
  if (millis() - last > 10000) { last = millis(); Serial.printf("[hub] stations: %d\n", WiFi.softAPgetStationNum()); }
  delay(50);
}
#else
#include "ensil_link.h"

#if UNIT == 1
  #include <Adafruit_NeoPixel.h>
  static const char* UNIT_NAME = "cross";
  Adafruit_NeoPixel pixels(PIXEL_COUNT, PIN_PIXELS, NEO_GRB + NEO_KHZ800);
#elif UNIT == 2
  #include <ESP32Servo.h>
  static const char* UNIT_NAME = "tendon";
  Servo tendon;
#elif UNIT == 3
  static const char* UNIT_NAME = "badanabi";
#else
  #error "UNIT 빌드 플래그가 없다 — platformio.ini 의 env 를 골라라"
#endif

// ── 목업별 감지·동작 — 기존 코드로 교체 ──────────────────────
// sense(): 감지된 '순간'에 한 번 true 를 돌려주고 단계(1~3)를 level 에 쓴다
// act(level, intensity): 목업의 동작. 스스로 감지했을 때도, 웹에서 명령이 왔을 때도 같은 함수

#if UNIT == 1
int clicks = 0; unsigned long lastClickAt = 0; bool lastSwitch = HIGH;
void setupUnit() { pinMode(PIN_SWITCH, INPUT_PULLUP); pixels.begin(); pixels.clear(); pixels.show(); }
bool sense(int& level) {
  bool now = digitalRead(PIN_SWITCH);
  if (lastSwitch == HIGH && now == LOW) { clicks++; lastClickAt = millis(); delay(20); }
  lastSwitch = now;
  if (clicks && millis() - lastClickAt > 450) { level = constrain(clicks, 1, 3); clicks = 0; return true; } // 1/2/3회 클릭 = 모드
  return false;
}
void act(int level, float) {
  for (int f = 0; f < level * 2 + 1; f++) {
    for (int i = 0; i < PIXEL_COUNT; i++) pixels.setPixelColor(i, pixels.Color(88, 214, 195));
    pixels.show(); ensilLinkTick(); delay(90);
    pixels.clear(); pixels.show(); ensilLinkTick(); delay(110);
  }
}

#elif UNIT == 2
bool lastPir = LOW;
void setupUnit() { pinMode(PIN_PIR, INPUT); tendon.attach(PIN_SERVO); tendon.write(SERVO_REST); }
bool sense(int& level) {
  bool now = digitalRead(PIN_PIR);
  bool rise = (lastPir == LOW && now == HIGH);
  lastPir = now;
  if (rise) level = random(1, 4); // 같은 자극에도 매번 다른 반응 — 조작 패널이 아니라 생물
  return rise;
}
void act(int level, float) {
  int pull = SERVO_REST + (SERVO_PULL - SERVO_REST) * level / 3;
  for (int a = SERVO_REST; a <= pull; a += 2) { tendon.write(a); ensilLinkTick(); delay(8); }   // 블로킹 중에도 tick
  for (int i = 0; i < 60; i++) { ensilLinkTick(); delay(10); }
  for (int a = pull; a >= SERVO_REST; a -= 1) { tendon.write(a); ensilLinkTick(); delay(18); }
}

#elif UNIT == 3
void setupUnit() { pinMode(PIN_AMP, OUTPUT); digitalWrite(PIN_AMP, LOW); /* TODO: 카메라·마이크·오디오 태스크 초기화 */ }
bool sense(int& level) { (void)level; return false; /* TODO: 움직임 레벨이 문턱을 넘은 순간 true, level = 1 긴 울음 / 2 부름 / 3 놀람 */ }
void act(int level, float) { digitalWrite(PIN_AMP, HIGH); delay(300 + level * 300); digitalWrite(PIN_AMP, LOW); /* TODO: 사운드 재생 */ }
#endif

void onWebAct(int level, float intensity) { act(level, intensity); }

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.printf("ENSIL unit %d (%s)\n", UNIT, UNIT_NAME);
  setupUnit();
  // 자기 AP (기존 펌웨어의 웹페이지용). ensilLinkBegin 이 AP+STA 로 올려 허브 archive 에도 붙는다
  WiFi.mode(WIFI_AP);
  WiFi.softAP(OWN_AP_SSID, OWN_AP_PASS, ENSIL_HUB_CHANNEL, 0, AP_MAX_CLIENTS);
  ensilLinkBegin(UNIT, UNIT_NAME, false);
  ensilLinkOnAct(onWebAct);
}

void loop() {
  ensilLinkTick();
  int level = 2;
  if (sense(level)) {
    ensilLinkTrigger(level, level / 3.0f);   // 먼저 알리고 (act 는 수 초 걸릴 수 있다)
    act(level, level / 3.0f);
  }
  delay(5);
}
#endif // HUB
