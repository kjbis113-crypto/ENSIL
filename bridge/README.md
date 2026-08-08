# ENSIL 브릿지 — 아두이노 ↔ 웹

Nano 33 BLE Rev2의 IMU 기울기를 웹 시뮬레이션 바닥에 전달하는 로컬 프로세스.
웹 빌드와 완전히 분리되어 있고, Vercel 배포에 포함되지 않는다.

```
Nano 33 BLE Rev2 ──USB──▶ bridge(Node) ──ws://localhost:7777──▶ 웹
        (IMU)              시리얼→WS 중계
```

## 준비

1. **펌웨어**: `firmware/imu_tilt/imu_tilt.ino`를 Arduino IDE로 업로드
   - 보드: Arduino Nano 33 BLE (Mbed OS Nano 보드 매니저)
   - 라이브러리: `Arduino_BMI270_BMM150` (Rev2 전용. Rev1이면 `Arduino_LSM9DS1`로 교체)
2. **브릿지 의존성**: 이 폴더에서 `npm install`

## 실행

```bash
npm start              # 아두이노 자동 탐지 (Arduino VID 기준)
node index.js --port COM5   # 자동 탐지 실패 시 포트 지정 (장치 관리자에서 확인)
npm run demo           # 하드웨어 없이 합성 tilt (개발·전시 리허설용)
```

웹은 브릿지가 없어도 완전히 동작한다 — 연결되면 시스템 바 상태가 바뀔 뿐 (plan.md §7-4).
키보드 비상 조작: `Shift+방향키` 기울기, `Shift+0` 수평 복귀.

## 프로토콜 (한 줄 = JSON 하나)

| 방향 | 메시지 | 의미 |
|---|---|---|
| HW→웹 | `{"type":"tilt","pitch":rad,"roll":rad}` | 보드 기울기 (수평=0,0) |
| HW→웹 | `{"type":"select","slot":3}` | (예정) 표본 슬롯 선택 |
| 웹→HW | `{"type":"state","selectedSlot":3}` | (예정) LED 피드백 |
