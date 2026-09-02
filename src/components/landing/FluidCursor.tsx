import { useEffect, useRef } from 'react';
import { FluidSim, type SplatInput } from '../../fluid/FluidSim';

/**
 * 커서 유체 오버레이 — 포인터 궤적이 진짜 유체처럼 소용돌이치며 흩어진다.
 * 전체 화면 고정, pointer-events 없음(콘텐츠 조작 방해 X), screen 블렌드로 발광.
 * 유휴 3.5초면 루프가 완전히 멈추고, 다시 움직이면 깨어난다 (배터리/CPU 보호).
 */

const IDLE_STOP_MS = 3500;
const MAX_DPR = 1.5;

/** colorful — 틸~시안~바이올렛 대역을 천천히 순환 (브랜드 톤 안의 컬러풀) */
function dyeColor(t: number): [number, number, number] {
  const hue = 165 + 55 * Math.sin(t * 0.21) + 28 * Math.sin(t * 0.067);
  const h = (((hue % 360) + 360) % 360) / 60;
  const s = 0.65;
  const i = Math.floor(h);
  const f = h - i;
  const p = 1 - s;
  const q = 1 - s * f;
  const u = 1 - s * (1 - f);
  const table: Array<[number, number, number]> = [[1, u, p], [q, 1, p], [p, 1, u], [p, q, 1], [u, p, 1], [1, p, q]];
  const rgb = table[i % 6];
  return [rgb[0] * 0.24, rgb[1] * 0.24, rgb[2] * 0.24];
}

export function FluidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const fit = () => {
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    };
    fit();

    const sim = new FluidSim(canvas);
    if (!sim.supported) return; // WebGL2 없으면 조용히 비활성

    const pending: SplatInput[] = [];
    let last = { x: 0, y: 0, t: 0, has: false };
    let colorIndex = 0;
    let lastActive = 0;
    let raf = 0;
    let running = false;
    let prevFrame = 0;

    const loop = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - prevFrame) / 1000));
      prevFrame = now;
      while (pending.length) sim.splat(pending.shift()!);
      sim.step(dt);
      sim.render();
      if (now - lastActive > IDLE_STOP_MS) {
        running = false;
        return; // 염료가 소산된 뒤 루프 정지
      }
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      lastActive = performance.now();
      if (!running) {
        running = true;
        prevFrame = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1 - event.clientY / window.innerHeight;
      if (last.has) {
        const dt = Math.max(1, event.timeStamp - last.t);
        const dx = (x - last.x) * Math.min(3, 16 / dt) * 1.4;
        const dy = (y - last.y) * Math.min(3, 16 / dt) * 1.4;
        if (Math.abs(dx) + Math.abs(dy) > 0.0001) {
          const speed = Math.min(1, Math.hypot(dx, dy) * 9);
          const base = dyeColor(event.timeStamp / 1000 + colorIndex * 5.3);
          pending.push({
            x, y, dx, dy,
            color: [base[0] * (0.4 + speed), base[1] * (0.4 + speed), base[2] * (0.4 + speed)],
          });
          if (pending.length > 24) pending.shift();
          wake();
        }
      }
      last = { x, y, t: event.timeStamp, has: true };
    };
    const onPointerDown = () => { colorIndex += 1; };
    const onLeave = () => { last.has = false; };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      }
    };
    const onResize = () => {
      fit();
      sim.resize();
    };

    // 셀프 테스트: ?fluidtest=1 이면 합성 포인터가 리사주 곡선을 그린다 (헤드리스 검증용)
    let demo = 0;
    if (new URLSearchParams(window.location.search).has('fluidtest')) {
      const start = performance.now();
      demo = window.setInterval(() => {
        const t = (performance.now() - start) / 1000;
        window.dispatchEvent(new PointerEvent('pointermove', {
          clientX: (0.5 + 0.3 * Math.sin(t * 2.1)) * window.innerWidth,
          clientY: (0.5 + 0.25 * Math.sin(t * 3.3 + 1)) * window.innerHeight,
        }));
      }, 16);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerout', onLeave, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (demo) window.clearInterval(demo);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerout', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      sim.dispose();
    };
  }, []);

  return <canvas className="fluid-cursor" ref={canvasRef} aria-hidden />;
}
