import { useEffect, useRef } from 'react';
import { FluidSim, type SplatInput } from '../../fluid/FluidSim';

/**
 * 전면 유체 베일 — 허브 유체를 사이트 전체로 확장한 것.
 * 커서 궤적을 따라 한 덩어리 액체가 흐르고, difference 블렌드라
 * 밝은 면 위에선 어둡게 / 어두운 면 위에선 밝게 뒤집혀 가독성이 유지된다.
 * 실버-틸 근백색 염료 + difference = 색상 난동 없이 모노톤 반전.
 * 유휴 3.5초 후 rAF 완전 정지 (배터리/CPU 보호), 터치·reduced-motion 비활성.
 */

const IDLE_STOP_MS = 3500;
const MAX_DPR = 1.5;
const TINT_DPR = 0.6; // 민트 글레이즈는 색만 입히므로 저해상도로 충분
const KEY_COLOR = '#58d6c3'; // 키컬러 — 민트~청록
const CORE_COLOR = '#d5d9d7'; // 커서 가까이의 유체 — 연한 회색
const CORE_RADIUS = 60; // 회색 코어 반경(px)
const BLEND_RADIUS = 300; // 이 거리에서 완전히 키컬러로

/** 근백색 실버-틸 염료 — difference에서 모노톤 반전으로 읽힌다 */
function dyeColor(t: number): [number, number, number] {
  const k = 0.5 + 0.5 * Math.sin(t * 0.14);
  return [0.62 + 0.1 * k, 0.8 - 0.04 * k, 0.77];
}

export function FluidVeil() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tintRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tint = tintRef.current;
    if (!canvas || !tint) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const fit = () => {
      canvas.width = Math.max(2, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(2, Math.round(window.innerHeight * dpr));
      tint.width = Math.max(2, Math.round(window.innerWidth * TINT_DPR));
      tint.height = Math.max(2, Math.round(window.innerHeight * TINT_DPR));
    };
    fit();

    const sim = new FluidSim(canvas);
    if (!sim.supported) return;
    const tintCtx = tint.getContext('2d');
    const pointerPx = { x: -9999, y: -9999 };

    // difference 결과 위에 유체 모양 그대로 색을 입힌다 (color 블렌드 글레이즈).
    // 커서 주변은 연한 회색, 멀어질수록 키컬러 청록 — 방사형 그라데이션이라 경계가 자연스럽다
    const paintTint = () => {
      if (!tintCtx) return;
      tintCtx.globalCompositeOperation = 'copy';
      tintCtx.drawImage(canvas, 0, 0, tint.width, tint.height);
      tintCtx.globalCompositeOperation = 'source-in';
      const cx = pointerPx.x * TINT_DPR;
      const cy = pointerPx.y * TINT_DPR;
      const grad = tintCtx.createRadialGradient(cx, cy, CORE_RADIUS * TINT_DPR, cx, cy, BLEND_RADIUS * TINT_DPR);
      grad.addColorStop(0, CORE_COLOR);
      grad.addColorStop(1, KEY_COLOR);
      tintCtx.fillStyle = grad;
      tintCtx.fillRect(0, 0, tint.width, tint.height);
      tintCtx.globalCompositeOperation = 'source-over';
    };

    const pending: SplatInput[] = [];
    let last = { x: 0, y: 0, t: 0, has: false };
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
      paintTint();
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
      pointerPx.x = event.clientX;
      pointerPx.y = event.clientY;
      const x = event.clientX / window.innerWidth;
      const y = 1 - event.clientY / window.innerHeight;
      if (last.has) {
        const dt = Math.max(1, event.timeStamp - last.t);
        const dx = (x - last.x) * Math.min(3, 16 / dt) * 1.3;
        const dy = (y - last.y) * Math.min(3, 16 / dt) * 1.3;
        if (Math.abs(dx) + Math.abs(dy) > 0.0001) {
          const speed = Math.min(1, Math.hypot(dx, dy) * 8);
          const base = dyeColor(event.timeStamp / 1000);
          pending.push({
            x, y, dx, dy,
            color: [base[0] * (0.45 + speed * 0.6), base[1] * (0.45 + speed * 0.6), base[2] * (0.45 + speed * 0.6)],
          });
          if (pending.length > 24) pending.shift();
          wake();
        }
      }
      last = { x, y, t: event.timeStamp, has: true };
    };
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
      updateMask();
    };

    // 허브([data-fluid-window]) 원 위에서는 베일을 마스크로 비운다 —
    // 그 영역은 허브 자체 유체(민트 발색)가 담당한다
    const updateMask = () => {
      const hole = document.querySelector('[data-fluid-window]');
      if (!hole) {
        for (const el of [canvas, tint]) {
          el.style.removeProperty('mask-image');
          el.style.removeProperty('-webkit-mask-image');
        }
        return;
      }
      const r = hole.getBoundingClientRect();
      const radius = r.width / 2;
      const mask = `radial-gradient(circle ${radius}px at ${r.left + radius}px ${r.top + radius}px, transparent ${radius - 1}px, black ${radius}px)`;
      for (const el of [canvas, tint]) {
        el.style.setProperty('mask-image', mask);
        el.style.setProperty('-webkit-mask-image', mask);
      }
    };
    updateMask();
    const maskTimer = window.setInterval(updateMask, 1500);
    window.addEventListener('hashchange', updateMask);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onLeave, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(maskTimer);
      window.removeEventListener('hashchange', updateMask);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      sim.dispose();
    };
  }, []);

  return (
    <>
      <canvas className="fluid-veil" ref={canvasRef} aria-hidden />
      <canvas className="fluid-veil-tint" ref={tintRef} aria-hidden />
    </>
  );
}
