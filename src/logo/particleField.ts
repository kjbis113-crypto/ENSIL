import type { HomePoint } from './samplePoints';

/**
 * 파티클 물리 — 순수 로직 (시뮬 엔진과 같은 원칙, React/Canvas 모름).
 * 커서 근접 → 반발(Repulsion), 그 외 → 홈으로 스프링 복원(Attraction).
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 원래 위치(Home) — 캔버스 px */
  hx: number;
  hy: number;
}

/** 캔버스 위 로고가 놓일 박스 (px) */
export interface FieldLayout {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

// ── 튜닝 상수 ─────────────────────────────
const SPRING = 0.015;   // 홈 복원력
const DAMPING = 0.86;   // 감쇠
const REPULSE_R = 130;  // 커서 영향 반경 (px)
const REPULSE_F = 3.2;  // 반발 가속 최대치

export function createParticles(homes: HomePoint[], layout: FieldLayout): Particle[] {
  return homes.map((p) => {
    const hx = layout.ox + p.x * layout.w;
    const hy = layout.oy + p.y * layout.h;
    return { x: hx, y: hy, vx: 0, vy: 0, hx, hy };
  });
}

/** 리사이즈 시 홈만 재배치 (현재 위치·속도는 유지 → 자연스럽게 흘러감) */
export function relayoutParticles(ps: Particle[], homes: HomePoint[], layout: FieldLayout) {
  for (let i = 0; i < ps.length; i++) {
    ps[i].hx = layout.ox + homes[i].x * layout.w;
    ps[i].hy = layout.oy + homes[i].y * layout.h;
  }
}

export function stepParticles(ps: Particle[], pointer: { x: number; y: number } | null) {
  for (const p of ps) {
    // 반발 — 가까울수록 강하게 밀어낸다
    if (pointer) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < REPULSE_R && d > 0.0001) {
        const f = (REPULSE_F * (REPULSE_R - d)) / REPULSE_R;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
    // 스프링 복원
    p.vx += (p.hx - p.x) * SPRING;
    p.vy += (p.hy - p.y) * SPRING;
    // 감쇠 + 적분
    p.vx *= DAMPING;
    p.vy *= DAMPING;
    p.x += p.vx;
    p.y += p.vy;
  }
}
