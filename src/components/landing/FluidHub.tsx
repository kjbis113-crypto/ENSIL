import { useEffect, useRef } from 'react';
import { FluidSim, type SplatInput } from '../../fluid/FluidSim';

/**
 * 허브 유체 — 중앙 회전축(흰 구) 안에 갇힌 액체. 커서가 화면 어디를 지나든
 * 그 움직임이 구 안의 유체를 젓는다: "커서에 들어가 있던" 유체 반응을
 * 축 디자인 안으로 옮긴 것. 원형 클리핑은 부모(.index-dial__hub)가 담당.
 * multiply 블렌드라 흰 구 위에 틸 물감처럼 스민다.
 */

const IDLE_STOP_MS = 3200;
const MAX_DPR = 1.25;

/** 미니멀 듀오톤 염료 — 틸과 실버 사이를 아주 천천히 오간다 */
function dyeColor(t: number): [number, number, number] {
  const k = 0.5 + 0.5 * Math.sin(t * 0.16);
  return [
    0.28 + 0.16 * k,
    0.55 - 0.06 * k,
    0.52 - 0.02 * k,
  ];
}

export function FluidHub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = canvas?.parentElement;
    if (!canvas || !mount) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    let rect = mount.getBoundingClientRect();
    const fit = () => {
      rect = mount.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(rect.width * dpr));
      canvas.height = Math.max(2, Math.round(rect.height * dpr));
    };
    fit();

    const sim = new FluidSim(canvas);
    const debug = new URLSearchParams(window.location.search).has('fluidtest');
    if (debug) console.info('[fluid-hub] supported:', sim.supported, 'rect:', Math.round(rect.width), Math.round(rect.top));
    if (!sim.supported) return;

    const pending: SplatInput[] = [];
    let last = { x: 0, y: 0, has: false };
    let lastActive = 0;
    let running = false;
    let prevFrame = 0;
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - prevFrame) / 1000));
      prevFrame = now;
      while (pending.length) sim.splat(pending.shift()!);
      sim.step(dt);
      sim.render();
      if (now - lastActive > IDLE_STOP_MS) {
        running = false;
        return;
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
      if (rect.width < 4) return;
      // 화면 좌표 → 허브 로컬 (구 밖의 움직임도 가장자리로 투영해 축을 젓는다)
      const lx = (event.clientX - rect.left) / rect.width;
      const ly = 1 - (event.clientY - rect.top) / rect.height;
      const x = Math.min(1.15, Math.max(-0.15, lx));
      const y = Math.min(1.15, Math.max(-0.15, ly));
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
            color: [base[0] * (0.3 + speed), base[1] * (0.3 + speed), base[2] * (0.3 + speed)],
          });
          if (pending.length > 16) pending.shift();
          wake();
        }
      }
      last = { x, y, has: true };
    };

    const ro = new ResizeObserver(() => {
      fit();
      sim.resize();
    });
    ro.observe(mount);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      sim.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fluid-hub" aria-hidden />;
}
