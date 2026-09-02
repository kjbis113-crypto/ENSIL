import { useEffect, useRef } from 'react';

/**
 * 액체 커서 — 구이(gooey) 필터로 합쳐지는 점 사슬. 커서 자체가 유체처럼
 * 움직임을 따라 늘어났다 고이며, 인터랙티브 요소 위에서 커지고 클릭 시 움츠러든다.
 * exclusion 블렌드라 밝은 면 위에선 어둡게, 어두운 면 위에선 밝게 — 항상 보인다.
 * transform만 갱신(리플로 0), 멈추면 2.5초 후 rAF 정지.
 */

const SIZES = [22, 18, 15, 12, 9, 7];
const HEAD_FOLLOW = 0.5;
const TAIL_FOLLOW = 0.34;
const IDLE_STOP_MS = 2500;

export function LiquidCursor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const debug = new URLSearchParams(window.location.search).has('fluidtest');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (debug) console.info('[liquid-cursor] off: reduced-motion');
      return;
    }
    if (window.matchMedia('(pointer: coarse)').matches) {
      if (debug) console.info('[liquid-cursor] off: coarse pointer');
      return; // 터치 기기 제외
    }
    if (debug) console.info('[liquid-cursor] active');

    const dots = Array.from(root.querySelectorAll<HTMLElement>('.liquid-cursor__dot'));
    const pos = SIZES.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    const target = { x: pos[0].x, y: pos[0].y };
    let scale = 1;
    let scaleTarget = 1;
    let pressed = false;
    let hovering = false;
    let lastActive = 0;
    let running = false;
    let raf = 0;

    const loop = (now: number) => {
      pos[0].x += (target.x - pos[0].x) * HEAD_FOLLOW;
      pos[0].y += (target.y - pos[0].y) * HEAD_FOLLOW;
      for (let i = 1; i < pos.length; i += 1) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * TAIL_FOLLOW;
        pos[i].y += (pos[i - 1].y - pos[i].y) * TAIL_FOLLOW;
      }
      scaleTarget = pressed ? 0.72 : hovering ? 1.65 : 1;
      scale += (scaleTarget - scale) * 0.2;
      dots.forEach((dot, i) => {
        const s = SIZES[i] * scale;
        dot.style.transform = `translate3d(${pos[i].x - s / 2}px, ${pos[i].y - s / 2}px, 0)`;
        dot.style.width = `${s}px`;
        dot.style.height = `${s}px`;
      });
      const settled = Math.hypot(target.x - pos[pos.length - 1].x, target.y - pos[pos.length - 1].y) < 0.5;
      if (settled && now - lastActive > IDLE_STOP_MS) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      lastActive = performance.now();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      const el = event.target as Element | null;
      hovering = !!el?.closest?.('a, button, [role="tab"], [role="slider"], input, label');
      root.style.opacity = '1';
      wake();
    };
    const onDown = () => { pressed = true; wake(); };
    const onUp = () => { pressed = false; wake(); };
    const onLeave = () => { root.style.opacity = '0'; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} className="liquid-cursor" aria-hidden>
      <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
        <filter id="ensil-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
        </filter>
      </svg>
      <div className="liquid-cursor__goo">
        {SIZES.map((size, i) => (
          <i className="liquid-cursor__dot" key={i} style={{ width: size, height: size }} />
        ))}
      </div>
    </div>
  );
}
