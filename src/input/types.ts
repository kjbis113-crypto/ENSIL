/**
 * 물리 입력 추상화 (plan.md §7-3).
 * 하드웨어(WsInput)든 키보드(MockInput)든 같은 이벤트를 낸다 —
 * 상위 코드는 입력이 어디서 왔는지 모른다.
 */

export type PhysicalEvent =
  | { type: 'tilt'; pitch: number; roll: number } // 라디안, 수평 = 0,0
  | { type: 'select'; slot: number }
  | { type: 'release'; slot: number }
  | { type: 'step'; dir: 1 | -1 }
  | { type: 'sensor'; channel: string; value: number }
  | { type: 'trigger'; action: string; intensity?: number };

export interface Tilt {
  pitch: number;
  roll: number;
}

export type InputListener = (e: PhysicalEvent) => void;

export interface InputSource {
  connect(): void;
  disconnect(): void;
  onEvent(cb: InputListener): void;
  /** 하드웨어로 피드백 전송 (없으면 no-op) */
  send(msg: unknown): void;
}
