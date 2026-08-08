import { useEffect, useRef, useState } from 'react';
import type { PhysicalEvent, Tilt } from './types';
import { WsInput } from './WsInput';
import { MockInput } from './MockInput';

export interface InputBinding {
  /** 물리 슬롯 번호 → 표본 선택 */
  onSelectSlot?: (slot: number) => void;
  onStep?: (dir: 1 | -1) => void;
  onRelease?: () => void;
}

/**
 * 물리 입력 훅 — WsInput(브릿지)과 MockInput(키보드)을 동시에 연결한다.
 * tilt는 리렌더 없이 ref로 흐른다 (30Hz — React 상태로 쓰면 프레임마다 리렌더).
 */
export function useInput(binding: InputBinding = {}) {
  const [connected, setConnected] = useState(false);
  const tiltRef = useRef<Tilt>({ pitch: 0, roll: 0 });
  const bindingRef = useRef(binding);
  bindingRef.current = binding;

  useEffect(() => {
    const handle = (e: PhysicalEvent) => {
      switch (e.type) {
        case 'tilt':
          tiltRef.current.pitch = e.pitch;
          tiltRef.current.roll = e.roll;
          break;
        case 'select':
          bindingRef.current.onSelectSlot?.(e.slot);
          break;
        case 'step':
          bindingRef.current.onStep?.(e.dir);
          break;
        case 'release':
          bindingRef.current.onRelease?.();
          break;
        // sensor/trigger는 수신만 해두고 소비처가 생기면 연결 (plan.md §8-3)
      }
    };

    const ws = new WsInput();
    ws.onEvent(handle);
    ws.onState(setConnected);
    ws.connect();

    const mock = new MockInput();
    mock.onEvent(handle);
    mock.connect();

    return () => {
      ws.disconnect();
      mock.disconnect();
    };
  }, []);

  return { connected, tiltRef };
}
