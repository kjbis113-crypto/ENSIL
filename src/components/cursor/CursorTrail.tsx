import { useCursorTrail } from '../../cursor/useCursorTrail';

/**
 * 커서 궤적 렌더러 — 와이어프레임 버전: 회색 그라디언트 블롭.
 * 표현만 담당한다. 본 디자인이 정해지면 이 파일만 교체 (로직은 useCursorTrail 유지).
 * pointer-events: none — 어떤 인터랙션도 막지 않는다.
 */
export function CursorTrail() {
  const points = useCursorTrail();

  return (
    <div className="cursor-trail" aria-hidden>
      {points.map((p) => (
        <span
          key={p.id}
          className="cursor-blob"
          style={{
            left: p.x,
            top: p.y,
            // 나이 들수록 커지며 옅어진다
            opacity: 0.5 * (1 - p.age),
            transform: `translate(-50%, -50%) scale(${0.5 + p.age * 0.9})`,
          }}
        />
      ))}
    </div>
  );
}
