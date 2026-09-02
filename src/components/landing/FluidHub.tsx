import { useEffect, useRef } from 'react';
import { FluidSim, type SplatInput } from '../../fluid/FluidSim';

/**
 * 허브 유체 — 중앙 회전축(흰 구) 안에 갇힌 액체.
 * 보이지 않는 젓개가 상시 돌아 스스로 일렁이고(30fps), 커서가 닿으면 그 지점을
 * 민트-청록-연회색 물감으로 세게 젓는다 (multiply — difference 베일과 달리 발색).
 * 베일은 이 원 위에서 마스크로 비워져 두 유체가 색으로 구분된다.
 */

const MAX_DPR = 1.25;
const FRAME_MS = 33; // 30fps — 작은 캔버스라 충분히 부드럽고 저렴

/** 민트~청록~연회색 듀오톤 */
function dyeColor(t: number): [number, number, number] {
  const k = 0.5 + 0.5 * Math.sin(t * 0.16);
  return [0.28 + 0.16 * k, 0.55 - 0.06 * k, 0.52 - 0.02 * k];
}

export function FluidHub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

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
    if (!sim.supported) return;

    const pending: SplatInput[] = [];
    let last = { x: 0, y: 0, has: false };
    let raf = 0;
    let prevFrame = 0;
    let lastTick = 0;

    let wobbleTick = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;
      const dt = Math.min(1 / 20, Math.max(1 / 240, (now - prevFrame) / 1000));
      prevFrame = now;

      // 보이지 않는 젓개 — 느린 궤도를 돌며 상시 일렁임을 만든다
      const t = now / 1000;

      // 허브 원 자체의 액체 테두리 — 디스플레이스먼트를 10fps로 천천히 숨쉬게 한다
      wobbleTick += 1;
      if (wobbleTick % 3 === 0 && dispRef.current && turbRef.current) {
        dispRef.current.setAttribute('scale', (17 + 7 * Math.sin(t * 0.6)).toFixed(2));
        turbRef.current.setAttribute(
          'baseFrequency',
          `${(0.011 + 0.0035 * Math.sin(t * 0.21)).toFixed(5)} ${(0.015 + 0.0035 * Math.cos(t * 0.17)).toFixed(5)}`,
        );
      }
      const a = t * 0.55;
      const wob = 0.2 + 0.07 * Math.sin(t * 0.9);
      const base = dyeColor(t);
      pending.push({
        x: 0.5 + Math.cos(a) * wob,
        y: 0.5 + Math.sin(a * 1.3) * wob,
        dx: -Math.sin(a) * 0.012,
        dy: Math.cos(a * 1.3) * 0.012,
        color: [base[0] * 0.16, base[1] * 0.16, base[2] * 0.16],
      });

      while (pending.length) sim.splat(pending.shift()!);
      sim.step(dt);
      sim.render();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (rect.width < 4) return;
      const lx = (event.clientX - rect.left) / rect.width;
      const ly = 1 - (event.clientY - rect.top) / rect.height;
      // 원 주변까지 허용 — 커서가 다가오면 가장자리부터 반응해 "붙는" 느낌
      const x = Math.min(1.2, Math.max(-0.2, lx));
      const y = Math.min(1.2, Math.max(-0.2, ly));
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
            color: [base[0] * (0.35 + speed), base[1] * (0.35 + speed), base[2] * (0.35 + speed)],
          });
          if (pending.length > 16) pending.shift();
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
    ro.observe(mount);
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

  return (
    <>
      {/* 허브 원의 액체 테두리 — .index-dial__hub 전체에 CSS filter로 적용된다 */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
        <filter id="ensil-hub-liquid" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.012 0.016" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <canvas ref={canvasRef} className="fluid-hub" aria-hidden />
    </>
  );
}
