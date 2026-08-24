import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 아카이브 패널(컴퓨터) ↔ 필드 스테이지(빔프로젝터) 두 창 연동 — BroadcastChannel.
 * 전시 운용: 프로젝터 창에 #/field, 관람객 컴퓨터에 #/(아카이브 캐러셀)을 띄운다.
 * 패널에서 '전하 던지기'를 누르면 스테이지 창의 시뮬레이터에 전하가 떨어진다.
 * 같은 브라우저 창 2개면 서버 없이 동작한다.
 */

export type FieldLinkRole = 'panel' | 'stage';

type FieldMsg =
  | { type: 'hello'; role: FieldLinkRole }
  | { type: 'charge'; id?: string };

const CHANNEL = 'ensil-field';
const HEARTBEAT_MS = 3_000;
const ALIVE_MS = 8_000;

export function useFieldLink(role: FieldLinkRole, onCharge?: (id?: string) => void) {
  const [peerAlive, setPeerAlive] = useState(false);
  const chRef = useRef<BroadcastChannel | null>(null);
  const onChargeRef = useRef(onCharge);
  onChargeRef.current = onCharge;

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return; // 구형 브라우저 — 연동만 비활성
    const ch = new BroadcastChannel(CHANNEL);
    chRef.current = ch;
    const other: FieldLinkRole = role === 'panel' ? 'stage' : 'panel';
    let lastSeen = 0;

    ch.onmessage = (e: MessageEvent<FieldMsg>) => {
      const msg = e.data;
      if (msg.type === 'hello' && msg.role === other) {
        lastSeen = Date.now();
        setPeerAlive(true);
      } else if (msg.type === 'charge' && role === 'stage') {
        onChargeRef.current?.(msg.id);
      }
    };

    const hello = () => ch.postMessage({ type: 'hello', role } satisfies FieldMsg);
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
  }, [role]);

  const sendCharge = useCallback((id?: string) => {
    chRef.current?.postMessage({ type: 'charge', id } satisfies FieldMsg);
  }, []);

  return { peerAlive, sendCharge };
}
