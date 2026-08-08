import type { InputListener, InputSource } from './types';

/**
 * 키보드로 물리 입력을 흉내내는 소스 — 개발용이자 전시장 비상 조작 수단 (plan.md §7-3).
 * 목차 이동/선택(←→, 1~9)은 useViewState가 이미 처리하므로 여기서는 tilt만:
 *
 *   Shift+←/→   roll  ∓
 *   Shift+↑/↓   pitch ∓
 *   Shift+0     수평 복귀
 */

const STEP = 0.06; // rad
const MAX = 0.45;

export class MockInput implements InputSource {
  private listeners: InputListener[] = [];
  private pitch = 0;
  private roll = 0;
  private handler = (e: KeyboardEvent) => {
    if (!e.shiftKey) return;
    let hit = true;
    switch (e.key) {
      case 'ArrowUp': this.pitch = Math.max(-MAX, this.pitch - STEP); break;
      case 'ArrowDown': this.pitch = Math.min(MAX, this.pitch + STEP); break;
      case 'ArrowLeft': this.roll = Math.max(-MAX, this.roll - STEP); break;
      case 'ArrowRight': this.roll = Math.min(MAX, this.roll + STEP); break;
      case ')': case '0': this.pitch = 0; this.roll = 0; break;
      default: hit = false;
    }
    if (hit) {
      e.preventDefault();
      for (const cb of this.listeners) cb({ type: 'tilt', pitch: this.pitch, roll: this.roll });
    }
  };

  connect() {
    window.addEventListener('keydown', this.handler);
  }

  disconnect() {
    window.removeEventListener('keydown', this.handler);
  }

  onEvent(cb: InputListener) {
    this.listeners.push(cb);
  }

  send() {
    /* no-op */
  }
}
