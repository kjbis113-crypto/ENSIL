#pragma once
/*
 * ensil_link.h — 기존 목업 펌웨어에 "끼워 넣는" 브릿지 연결 모듈 (헤더 하나, 의존성: ArduinoWebsockets, ArduinoJson)
 *
 * 목업이 이미 자기 AP + 웹페이지(cross.local 등)를 띄우고 있어도 그대로 두고,
 * STA 로 허브 망("archive" — 전원만 넣은 전용 ESP32 AP)에 추가로 붙어 노트북의 브릿지(ws://192.168.4.100:7777)와 대화한다.
 *
 *   #include "ensil_link.h"
 *   void setup() { ...기존...; ensilLinkBegin(2, "tendon"); ensilLinkOnAct(myAct); }
 *   void loop()  { ...기존...; ensilLinkTick(); }          // webTick() 안에서도 같이 부른다 (블로킹 sweep 중에도)
 *   ...감지→동작이 일어난 자리에서:  ensilLinkTrigger(n, intensity);   // n = 버튼 단계 1~3
 *
 * ⚠ AP+STA 는 한 라디오라 STA 가 붙은 채널로 자기 AP 채널도 옮겨간다 → 허브(archive)의 채널로
 *   세 목업의 AP 채널이 모두 따라간다(1/6/11 분리는 사라짐). 트래픽이 작아 문제없다 (docs/EXHIBITION_SETUP.md §6).
 * ⚠ No.3 에서 소리가 치지직거리면 ENSIL_LINK_ENABLED 를 0 으로 — 소리가 먼저.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>

#ifndef ENSIL_LINK_ENABLED
#define ENSIL_LINK_ENABLED 1
#endif
#ifndef ENSIL_HUB_SSID
#define ENSIL_HUB_SSID "archive"
#endif
#ifndef ENSIL_HUB_PASS
#define ENSIL_HUB_PASS "12345678"
#endif
#ifndef ENSIL_BRIDGE_HOST
#define ENSIL_BRIDGE_HOST "192.168.4.100"
#endif
#ifndef ENSIL_BRIDGE_PORT
#define ENSIL_BRIDGE_PORT 7777
#endif
#ifndef ENSIL_LINK_RECONNECT_MS
#define ENSIL_LINK_RECONNECT_MS 3000
#endif
#ifndef ENSIL_LINK_COOLDOWN_MS
#define ENSIL_LINK_COOLDOWN_MS 8000     // 같은 목업의 연속 보고는 이 안에서 한 번
#endif

typedef void (*EnsilActHandler)(int level, float intensity);

namespace ensil {
  static websockets::WebsocketsClient client;
  static int unit = 0;
  static const char* name = "";
  static bool isHub = false;
  static bool ready = false;
  static unsigned long lastReconnect = 0;
  static unsigned long lastTrigger = 0;
  static EnsilActHandler onAct = nullptr;

  static void sendJson(JsonDocument& doc) {
    if (!ready) return;
    String out;
    serializeJson(doc, out);
    client.send(out);
  }

  static void onMessage(websockets::WebsocketsMessage message) {
    JsonDocument doc;
    if (deserializeJson(doc, message.data())) return;
    if (strcmp(doc["type"] | "", "act") != 0) return;
    if (!doc["unit"].isNull() && doc["unit"].as<int>() != unit) return;   // 다른 목업 것
    int level = doc["level"] | 2;
    float intensity = doc["intensity"] | 1.0f;
    if (onAct) onAct(level, intensity);
  }

  static void onEvent(websockets::WebsocketsEvent event, String) {
    if (event == websockets::WebsocketsEvent::ConnectionOpened) {
      ready = true;
      JsonDocument doc;
      doc["type"] = "hello";
      doc["unit"] = unit;
      doc["name"] = name;
      sendJson(doc);
    } else if (event == websockets::WebsocketsEvent::ConnectionClosed) {
      ready = false;
    }
  }

  static bool wifiUp() {
    return isHub || WiFi.status() == WL_CONNECTED;
  }
}

/** setup() 에서. hub=true 는 이 보드가 곧 허브 AP 일 때만(전용 허브 보드) — 목업 셋은 전부 false */
inline void ensilLinkBegin(int unit, const char* name, bool hub = false) {
#if ENSIL_LINK_ENABLED
  ensil::unit = unit;
  ensil::name = name;
  ensil::isHub = hub;
  if (!hub) {
    // 기존 코드가 WIFI_AP 로 뒀다면 AP+STA 로 올려 자기 AP 는 유지한 채 허브에 붙는다
    WiFi.mode(WIFI_AP_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(ENSIL_HUB_SSID, ENSIL_HUB_PASS);
  }
  ensil::client.onMessage(ensil::onMessage);
  ensil::client.onEvent(ensil::onEvent);
#endif
}

/** 웹에서 act 명령이 왔을 때 부를 함수 등록 (level 1~3, intensity 0~1) */
inline void ensilLinkOnAct(EnsilActHandler handler) {
  ensil::onAct = handler;
}

/** loop() 와 블로킹 루틴(webTick) 안에서 자주 — 수 ms 이상 걸리지 않는다 */
inline void ensilLinkTick() {
#if ENSIL_LINK_ENABLED
  if (ensil::ready) { ensil::client.poll(); return; }
  if (!ensil::wifiUp()) return;
  unsigned long now = millis();
  if (now - ensil::lastReconnect < ENSIL_LINK_RECONNECT_MS) return;
  ensil::lastReconnect = now;
  ensil::client.connect(ENSIL_BRIDGE_HOST, ENSIL_BRIDGE_PORT, "/");
#endif
}

/** 감지→동작이 일어난 자리에서. level = 버튼 단계(1~3), intensity 0~1. 쿨다운 안이면 무시(true=보냄) */
inline bool ensilLinkTrigger(int level, float intensity) {
#if ENSIL_LINK_ENABLED
  unsigned long now = millis();
  if (now - ensil::lastTrigger < ENSIL_LINK_COOLDOWN_MS) return false;
  ensil::lastTrigger = now;
  JsonDocument doc;
  doc["type"] = "trigger";
  doc["unit"] = ensil::unit;
  doc["action"] = "detect";
  doc["level"] = level;
  doc["intensity"] = intensity;
  ensil::sendJson(doc);
  return ensil::ready;
#else
  return false;
#endif
}

inline bool ensilLinkConnected() { return ensil::ready; }
