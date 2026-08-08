/*
 * ENSIL — 시뮬레이션 바닥 컨트롤러
 * Arduino Nano 33 BLE Rev2 내장 IMU(BMI270)로 보드 기울기를 읽어
 * 시리얼로 JSON 한 줄씩 내보낸다. 브릿지(bridge/index.js)가 이를 WebSocket으로 중계.
 *
 * 라이브러리: Arduino_BMI270_BMM150 (Rev2 전용 — 구형 Rev1은 Arduino_LSM9DS1)
 *   Arduino IDE > 라이브러리 매니저 > "Arduino_BMI270_BMM150" 설치
 *
 * 출력 형식 (30Hz, 라디안):
 *   {"type":"tilt","pitch":0.12,"roll":-0.34}
 */

#include "Arduino_BMI270_BMM150.h"

// 지수이동평균 — 손떨림 제거. 낮을수록 부드럽고 느리다
const float SMOOTH = 0.15;
const unsigned long INTERVAL_MS = 33; // ~30Hz

float pitch = 0, roll = 0;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}
  if (!IMU.begin()) {
    Serial.println("{\"type\":\"error\",\"msg\":\"IMU init failed\"}");
    while (1) {}
  }
}

void loop() {
  float ax, ay, az;
  if (IMU.accelerationAvailable()) {
    IMU.readAcceleration(ax, ay, az);
    // 중력 벡터에서 기울기 산출 (보드가 수평이면 0,0)
    float p = atan2(-ax, sqrt(ay * ay + az * az));
    float r = atan2(ay, az);
    pitch += SMOOTH * (p - pitch);
    roll  += SMOOTH * (r - roll);
  }

  unsigned long now = millis();
  if (now - lastSend >= INTERVAL_MS) {
    lastSend = now;
    Serial.print("{\"type\":\"tilt\",\"pitch\":");
    Serial.print(pitch, 4);
    Serial.print(",\"roll\":");
    Serial.print(roll, 4);
    Serial.println("}");
  }
}
