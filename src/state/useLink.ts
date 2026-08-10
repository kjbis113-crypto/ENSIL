import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewMode } from './useHashRoute';

/**
 * 두 창(메인 갤러리 / 아카이브) 연동 — BroadcastChannel. 서버 불필요.
 * 전시 운용: 모니터 1 = #/gallery 창, 모니터 2 = #/c/... 창 (같은 브라우저에서 창 2개).
 *
 * - 모든 창이 주기적으로 hello(role)를 쏜다 → 상대 role의 생존 여부(peerAlive) 판단
 * - 갤러리에서 개체 클릭 → 아카이브 창이 살아 있으면 select 메시지만 보내고 자기 화면 유지,
 *   없으면(모니터 1대) 자기 창에서 이동
 */

export type LinkRole = 'gallery' | 'archive';

type LinkMsg =
  | { type: 'hello'; role: LinkRole }
  | { type: 'select'; id: string; mode?: ViewMode };

const CHANNEL = 'ensil-link';
const HEARTBEAT_MS = 3_000;
const ALIVE_MS = 8_000; // 이 시간 안에 hello가 없으면 상대 창 죽은 것으로 간주

export function useLink(
  role: LinkRole,
  onSelect?: (id: string, mode?: ViewMode) => void,
  enabled = true,
) {
  const [peerAlive, setPeerAlive] = useState(false);
  const chRef = useRef<BroadcastChannel | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!enabled) {
      setPeerAlive(false);
      return;
    }
    if (typeof BroadcastChannel === 'undefined') return; // 구형 브라우저 — 연동만 비활성
    const ch = new BroadcastChannel(CHANNEL);
    chRef.current = ch;
    const other: LinkRole = role === 'gallery' ? 'archive' : 'gallery';
    let lastSeen = 0;

    ch.onmessage = (e: MessageEvent<LinkMsg>) => {
      const msg = e.data;
      if (msg.type === 'hello' && msg.role === other) {
        lastSeen = Date.now();
        setPeerAlive(true);
      } else if (msg.type === 'select' && role === 'archive') {
        onSelectRef.current?.(msg.id, msg.mode);
      }
    };

    const hello = () => ch.postMessage({ type: 'hello', role } satisfies LinkMsg);
    hello();
    const beat = setInterval(() => {
      hello();
      if (lastSeen && Date.now() - lastSeen > ALIVE_MS) {
        lastSeen = 0;
        setPeerAlive(false);
      }
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(beat);
      ch.close();
      chRef.current = null;
    };
  }, [role, enabled]);

  const sendSelect = useCallback((id: string, mode?: ViewMode) => {
    chRef.current?.postMessage({ type: 'select', id, mode } satisfies LinkMsg);
  }, []);

  return { peerAlive, sendSelect };
}
