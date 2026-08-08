/**
 * ENSIL 로컬 브릿지 — 시리얼(아두이노) ↔ WebSocket (plan.md §7)
 *
 * 사용법:
 *   node index.js                  # 아두이노 자동 탐지 (Arduino VID)
 *   node index.js --port COM5      # 포트 지정
 *   node index.js --demo           # 하드웨어 없이 합성 tilt 신호 (사인파)
 *
 * 웹은 ws://localhost:7777 로 접속한다. 프로토콜: 한 줄 = JSON 하나 (plan.md §7-2)
 */

const { WebSocketServer } = require('ws');

const PORT = 7777;
const BAUD = 115200;
const args = process.argv.slice(2);
const DEMO = args.includes('--demo');
const portArg = args.includes('--port') ? args[args.indexOf('--port') + 1] : null;

// ── WebSocket 서버 ─────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  log(`웹 연결됨 (${clients.size})`);
  ws.on('close', () => clients.delete(ws));
  // 웹 → 하드웨어 (LED 피드백 등) — 시리얼이 열려 있으면 그대로 전달
  ws.on('message', (data) => {
    if (serial?.isOpen) serial.write(data.toString() + '\n');
  });
});

function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const c of clients) if (c.readyState === 1) c.send(s);
}

function log(msg) {
  console.log(`[bridge] ${msg}`);
}

// ── 데모 모드 — 하드웨어 없이 개발·리허설 ────────────────────
if (DEMO) {
  log(`데모 모드 — ws://localhost:${PORT} 에서 합성 tilt 송출`);
  let t = 0;
  setInterval(() => {
    t += 0.033;
    broadcast({
      type: 'tilt',
      pitch: Math.sin(t * 0.7) * 0.3,
      roll: Math.cos(t * 0.5) * 0.3,
    });
  }, 33);
  return;
}

// ── 시리얼 (아두이노) ──────────────────────────────────────
const { SerialPort, ReadlineParser } = require('serialport');
let serial = null;

// 원값 폴백용 스무딩 상태 (펌웨어가 JSON을 직접 보내면 사용되지 않음)
const SMOOTH = 0.15;
const tiltEma = { pitch: 0, roll: 0 };
let lastTiltSend = 0;

async function findPort() {
  if (portArg) return portArg;
  const ports = await SerialPort.list();
  // Arduino VID 0x2341 / clones 0x1a86 등
  const hit = ports.find((p) => /2341|2a03|1a86/i.test(p.vendorId ?? ''));
  return hit?.path ?? null;
}

async function openSerial() {
  const path = await findPort();
  if (!path) {
    log('아두이노를 찾지 못함 — 3초 후 재시도 (--port COM5 로 지정 가능)');
    setTimeout(openSerial, 3000);
    return;
  }
  serial = new SerialPort({ path, baudRate: BAUD });
  const parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));

  serial.on('open', () => log(`시리얼 연결: ${path} @ ${BAUD}`));
  serial.on('close', () => {
    log('시리얼 끊김 — 재연결 시도');
    serial = null;
    setTimeout(openSerial, 2000);
  });
  serial.on('error', (e) => log(`시리얼 오류: ${e.message}`));

  parser.on('data', (line) => {
    const s = line.trim();
    // 1) 정식 프로토콜: JSON 한 줄 (firmware/imu_tilt)
    try {
      broadcast(JSON.parse(s));
      return;
    } catch {
      /* JSON 아님 — 아래 폴백 시도 */
    }
    // 2) 폴백: IMU 라이브러리 예제(SimpleAccelerometer)의 "ax\tay\taz" 원값도 수용.
    //    기울기 계산을 브릿지가 대신 한다 — 보드 스케치를 안 바꿔도 동작.
    const m = s.split(/[\t,\s]+/).map(Number);
    if (m.length === 3 && m.every((v) => Number.isFinite(v))) {
      const [ax, ay, az] = m;
      const p = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
      const r = Math.atan2(ay, az);
      tiltEma.pitch += SMOOTH * (p - tiltEma.pitch);
      tiltEma.roll += SMOOTH * (r - tiltEma.roll);
      const now = Date.now();
      if (now - lastTiltSend >= 33) { // 30Hz 스로틀
        lastTiltSend = now;
        broadcast({
          type: 'tilt',
          pitch: +tiltEma.pitch.toFixed(4),
          roll: +tiltEma.roll.toFixed(4),
        });
      }
    }
    // 그 외 라인(부트 메시지 등)은 무시
  });
}

log(`ws://localhost:${PORT} 대기 중`);
openSerial();
