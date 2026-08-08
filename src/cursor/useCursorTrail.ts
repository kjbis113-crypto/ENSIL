import { useEffect, useRef, useState } from 'react';

/**
 * 커서 궤적 로직 — 렌더러와 분리 (시뮬 엔진과 같은 원칙).
 * 포인터 위치를 샘플링해 "나이(age)를 가진 점 목록"만 내놓는다.
 * 그리는 방법(블롭/파티클/셰이더)은 렌더러가 결정 — 나중에 이 훅은 그대로 두고
 * CursorTrail 컴포넌트만 교체한다.
 */

export interface TrailPoint {
  id: number;
  x: number;
  y: number;
  /** 0(방금 생김) → 1(소멸 직전) */
  age: number;
}

const LIFETIME_MS = 700;     // 점 하나의 수명
const MIN_DIST = 18;         // 이 거리(px) 이상 움직여야 새 점 생성
const MAX_POINTS = 24;       // 안전 상한

export function useCursorTrail(): TrailPoint[] {
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const raw = useRef<{ id: number; x: number; y: number; born: number }[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = lastPos.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < MIN_DIST) return;
      lastPos.current = { x: e.clientX, y: e.clientY };
      raw.current.push({ id: nextId.current++, x: e.clientX, y: e.clientY, born: performance.now() });
      if (raw.current.length > MAX_POINTS) raw.current.shift();
    };
    window.addEventListener('pointermove', onMove);

    let rafId = 0;
    const frame = (now: number) => {
      raw.current = raw.current.filter((p) => now - p.born < LIFETIME_MS);
      setPoints(
        raw.current.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          age: (now - p.born) / LIFETIME_MS,
        })),
      );
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return points;
}
