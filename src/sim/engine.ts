import type { NeedSet, Organism, World } from './types';
import { chooseAction } from './utility';
import { moveOrganism } from './movement';

/**
 * 시뮬레이션 엔진 — 순수 TS. React/DOM을 모른다 (plan.md §8-1).
 *
 * 심즈식 구조:
 *   니즈 감쇠 → (행동 없음) 광고 스코어링으로 행동 선택 → 종별 메커니즘으로 이동
 *   → 도착하면 수행(니즈 회복) → 충족되면 행동 해제 → 반복
 * 지능은 환경의 광고(utility.ts)에, 몸놀림은 종의 메커니즘(movement.ts)에 분산된다.
 */

// ── 튜닝 상수 ─────────────────────────────────────────────
const DECAY = { energy: 0.012, arousal: 0.02, bonding: 0.015 } as const;
const MOVE_COST = 0.01;
const RECOVER = 0.25;
const NEED_DONE = 0.85;   // 이 위로 회복되면 행동 종료
const KIN_RADIUS = 7;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function decay(org: Organism, dt: number, world: World) {
  org.needs.energy = clamp01(org.needs.energy - DECAY.energy * dt);
  org.needs.arousal = clamp01(org.needs.arousal - DECAY.arousal * dt);
  const nearKin = world.organisms.some(
    (o) => o.id !== org.id && o.taxon === org.taxon &&
      Math.hypot(o.pos.x - org.pos.x, o.pos.y - org.pos.y) < KIN_RADIUS * 2,
  );
  if (!nearKin) org.needs.bonding = clamp01(org.needs.bonding - DECAY.bonding * dt);
}

/** 수행 중 니즈 회복. 완료 여부 반환 */
function perform(org: Organism, dt: number, world: World): boolean {
  const ad = org.action!.ad;
  const n = org.needs;
  switch (ad.kind) {
    case 'consume': {
      n.energy = clamp01(n.energy + RECOVER * (0.5 + world.ambientCharge) * dt);
      return n.energy > NEED_DONE;
    }
    case 'interact': {
      const kin = world.organisms.find((o) => o.id === ad.sourceId);
      if (!kin || Math.hypot(kin.pos.x - org.pos.x, kin.pos.y - org.pos.y) > KIN_RADIUS) return true;
      n.bonding = clamp01(n.bonding + RECOVER * dt);
      n.arousal = clamp01(n.arousal + RECOVER * 0.4 * dt);
      return n.bonding > NEED_DONE;
    }
    case 'wander':
      // 도착 = 완료 (이동 자체가 자극 회복 — 이동 중 처리)
      return true;
    case 'rest': {
      n.energy = clamp01(n.energy + RECOVER * 0.3 * dt);
      // 어느 니즈든 급해지면 일어난다
      const urgentest = Math.min(n.energy, n.arousal, n.bonding);
      return urgentest < 0.45 || n.energy > NEED_DONE;
    }
  }
}

function stateOf(org: Organism): Organism['state'] {
  const a = org.action;
  if (!a) return 'idle';
  if (!a.performing) return 'seek';
  switch (a.ad.kind) {
    case 'consume': return 'consume';
    case 'interact': return 'interact';
    case 'rest': return 'rest';
    default: return 'idle';
  }
}

function stepOrganism(org: Organism, dt: number, world: World) {
  decay(org, dt, world);

  if (!org.action) {
    org.action = { ad: chooseAction(org, world), performing: false };
    org.movePhase = 0;
  }

  const action = org.action;
  if (!action.performing) {
    // interact 목표는 움직인다 — 매 tick 현재 위치로 갱신 (debug.md #3)
    if (action.ad.kind === 'interact') {
      const kin = world.organisms.find((o) => o.id === action.ad.sourceId);
      if (kin) action.ad.pos = kin.pos;
      else { org.action = null; return; }
      if (Math.hypot(kin.pos.x - org.pos.x, kin.pos.y - org.pos.y) < KIN_RADIUS) {
        action.performing = true;
      }
    }
    if (!action.performing) {
      const r = moveOrganism(org, action.ad.pos, dt, world);
      // 이동 = 자극 회복(약하게 — 1.0 고착 방지), 에너지 소모 (종별 비용 × 전하 효율)
      org.needs.arousal = clamp01(org.needs.arousal + RECOVER * 0.08 * dt);
      org.needs.energy = clamp01(
        org.needs.energy - MOVE_COST * r.cost * (1.5 - org.traits.charge / 10) * dt,
      );
      if (r.arrived) action.performing = true;
    }
  } else if (perform(org, dt, world)) {
    org.action = null;
    org.vel.x = 0;
    org.vel.y = 0;
  }

  org.state = stateOf(org);
}

const TRAIL_INTERVAL = 0.25;
const TRAIL_MAX = 48;

export function tick(world: World, dt: number) {
  world.t += dt;
  for (const org of world.organisms) stepOrganism(org, dt, world);

  world.trailAcc += dt;
  if (world.trailAcc >= TRAIL_INTERVAL) {
    world.trailAcc = 0;
    for (const org of world.organisms) {
      org.trail.push({ x: org.pos.x, y: org.pos.y });
      if (org.trail.length > TRAIL_MAX) org.trail.shift();
    }
  }
}

/** 물리 입력(센서) 주입 지점 (plan.md §8-3) */
export function setAmbientCharge(world: World, v: number) {
  world.ambientCharge = clamp01(v);
}

export type { NeedSet };
