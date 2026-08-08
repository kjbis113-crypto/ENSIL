import type { InputListener, InputSource } from './types';

/**
 * 브릿지(ws://localhost:7777) 입력 소스.
 * 실패 대응이 본체다 (plan.md §7-4):
 *  - 브릿지 미실행 → 3초마다 조용히 재연결. 화면은 정상 동작
 *  - 알 수 없는 메시지 → 무시
 *  - 절대 모달·에러 화면을 띄우지 않는다
 */

const RECONNECT_MS = 3000;

export class WsInput implements InputSource {
  private ws: WebSocket | null = null;
  private listeners: InputListener[] = [];
  private stateListeners: ((connected: boolean) => void)[] = [];
  private timer: number | null = null;
  private disposed = false;

  constructor(private url: string = import.meta.env.VITE_BRIDGE_URL ?? 'ws://localhost:7777') {}

  connect() {
    if (this.disposed) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.retry();
      return;
    }
    this.ws.onopen = () => this.emitState(true);
    this.ws.onclose = () => {
      this.emitState(false);
      this.retry();
    };
    this.ws.onerror = () => this.ws?.close();
    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (typeof msg?.type === 'string') {
          for (const cb of this.listeners) cb(msg);
        }
      } catch {
        /* JSON 아닌 메시지 무시 */
      }
    };
  }

  private retry() {
    if (this.disposed || this.timer !== null) return;
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.connect();
    }, RECONNECT_MS);
  }

  disconnect() {
    this.disposed = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }

  onEvent(cb: InputListener) {
    this.listeners.push(cb);
  }

  onState(cb: (connected: boolean) => void) {
    this.stateListeners.push(cb);
  }

  private emitState(connected: boolean) {
    for (const cb of this.stateListeners) cb(connected);
  }

  send(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
