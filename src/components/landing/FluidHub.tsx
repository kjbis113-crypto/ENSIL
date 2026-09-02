import { useEffect, useRef } from 'react';
import { FluidSim, type SplatInput } from '../../fluid/FluidSim';

/**
 * 허브 유체 — 솔리드 원판이 아니라 베일과 같은 유체 렌더(흑백 difference).
 * 시뮬레이션 세팅으로 염료가 코어에 응집해 스스로 대략 원형 덩어리를 유지한다:
 *  - 중앙 염료 방출(느린 궤도) → 덩어리의 몸통
 *  - 컨파인먼트 링: 반지름 0.36에서 안쪽으로 미는 무염료 스플랫 → 흩어짐 억제
 *  - 커서가 닿으면 기존 포인터 스플랫이 덩어리를 젓고 베일 유체와 섞인다
 * 경계는 FluidSim의 threshold가 만드는 일렁이는 유체 윤곽 — 솔리드 원 없음.
 */

const MAX_DPR = 1.25;
const FRAME_MS = 33; // 30fps

/** 베일과 같은 근백색 실버-틸 염료 — difference에서 모노톤 반전 */
function dyeColor(t: number): [number, number, number] {
  const k = 0.5 + 0.5 * Math.sin(t * 0.14);
  return [0.62 + 0.1 * k, 0.8 - 0.04 * k, 0.77];
}

export function FluidHub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    let rect = canvas.getBoundingClientRect();
    const fit = () => {
      rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(rect.width * dpr));
      canvas.height = Math.max(2, Math.round(rect.height * dpr));
    };
    fit();

    const sim = new FluidSim(canvas);
    if (!sim.supported) return;

    const pending: SplatInput[] = [];
    let last = { x: 0, y: 0, has: false };
    let raf = 0;
    let prevFrame = 0;
    let lastTick = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;
      const dt = Math.min(1 / 20, Math.max(1 / 240, (now - prevFrame) / 1000));
      prevFrame = now;
      const t = now / 1000;

      // ① 코어 방출 — 넓은 궤도의 주입구 3개가 얕게 뿌려 크고 부드러운 몸통을 만든다
      const base = dyeColor(t);
      for (let k = 0; k < 3; k += 1) {
        const oa = t * 0.55 + (k * Math.PI * 2) / 3;
        pending.push({
          x: 0.5 + Math.cos(oa) * 0.12,
          y: 0.5 + Math.sin(oa * 1.15) * 0.12,
          dx: -Math.sin(oa) * 0.008,
          dy: Math.cos(oa * 1.15) * 0.008,
          color: [base[0] * 0.14, base[1] * 0.14, base[2] * 0.14],
        });
      }

      // ② 컨파인먼트 링 — 무염료 스플랫 5개가 안쪽으로 밀어 원형을 유지한다
      for (let k = 0; k < 5; k += 1) {
        const a = t * 0.4 + (k * Math.PI * 2) / 5;
        pending.push({
          x: 0.5 + Math.cos(a) * 0.38,
          y: 0.5 + Math.sin(a) * 0.38,
          dx: -Math.cos(a) * 0.06,
          dy: -Math.sin(a) * 0.06,
          color: [0, 0, 0],
        });
      }

      while (pending.length) sim.splat(pending.shift()!);
      sim.step(dt);
      sim.render();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (rect.width < 4) return;
      const lx = (event.clientX - rect.left) / rect.width;
      const ly = 1 - (event.clientY - rect.top) / rect.height;
      const x = Math.min(1.1, Math.max(-0.1, lx));
      const y = Math.min(1.1, Math.max(-0.1, ly));
      if (last.has) {
        const dx = (x - last.x) * 0.9;
        const dy = (y - last.y) * 0.9;
        if (Math.abs(dx) + Math.abs(dy) > 0.0005) {
          const speed = Math.min(1, Math.hypot(dx, dy) * 7);
          const base = dyeColor(event.timeStamp / 1000);
          pending.push({
            x, y,
            dx: Math.max(-0.3, Math.min(0.3, dx)),
            dy: Math.max(-0.3, Math.min(0.3, dy)),
            color: [base[0] * (0.35 + speed * 0.5), base[1] * (0.35 + speed * 0.5), base[2] * (0.35 + speed * 0.5)],
          });
          if (pending.length > 20) pending.shift();
        }
      }
      last = { x, y, has: true };
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        prevFrame = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const ro = new ResizeObserver(() => {
      fit();
      sim.resize();
    });
    ro.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    prevFrame = performance.now();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      sim.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fluid-hub" aria-hidden />;
}
