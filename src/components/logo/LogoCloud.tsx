import { useEffect, useRef } from 'react';
import logoUrl from '../../assets/logo-sketch.png';
import { sampleLogoPoints, type HomePoint } from '../../logo/samplePoints';
import {
  createParticles,
  relayoutParticles,
  stepParticles,
  type FieldLayout,
  type Particle,
} from '../../logo/particleField';

/**
 * 메인 화면 배경의 가변형 로고 — 가우시안 클라우드.
 * 커서가 다가오면 분해되고, 멀어지면 홈으로 복원된다.
 * 렌더러만 담당 (샘플링 = logo/samplePoints, 물리 = logo/particleField).
 * 파티클은 부드러운 원 스프라이트로 그려 클라우드 느낌을 낸다.
 */

const LOGO_FIT = 0.62;   // 캔버스 대비 로고 최대 비율
const DOT = 5;           // 파티클 지름(px, CSS 기준) — 촘촘하게 겹쳐 면을 이룬다

function makeSprite(size: number, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function LogoCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    let homes: HomePoint[] = [];
    let aspect = 1;
    let particles: Particle[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let disposed = false;

    const layoutOf = (): FieldLayout => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      let w = cw * LOGO_FIT;
      let h = w / aspect;
      if (h > ch * LOGO_FIT) {
        h = ch * LOGO_FIT;
        w = h * aspect;
      }
      return { ox: (cw - w) / 2, oy: (ch - h) / 2, w, h };
    };

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length) relayoutParticles(particles, homes, layoutOf());
    };

    // 잉크색 소프트 스프라이트 (토큰에서 색을 읽는다)
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink-mute').trim() || '#002928';
    const sprite = makeSprite(32, ink);

    sampleLogoPoints(logoUrl).then((r) => {
      if (disposed) return;
      homes = r.points;
      aspect = r.aspect;
      resize();
      particles = createParticles(homes, layoutOf());
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const frame = () => {
      if (particles.length) {
        stepParticles(particles, pointer.active ? pointer : null);
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        for (const p of particles) {
          ctx.drawImage(sprite, p.x - DOT / 2, p.y - DOT / 2, DOT, DOT);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="logo-cloud" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
