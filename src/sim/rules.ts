import type { NeedKey, Organism, Vec, World } from './types';

/**
 * 목적(DriveKind)별 SEEK 대상 선택 — "최초의 목적 = SEEK 대상 선택 함수" (plan.md §8-2).
 * 반환은 항상 좌표 하나로 통일한다.
 */

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

export function nearestNode(org: Organism, world: World): Vec | null {
  let best: Vec | null = null;
  let bd = Infinity;
  for (const n of world.nodes) {
    const d = dist(org.pos, n.pos);
    if (d < bd) { bd = d; best = n.pos; }
  }
  return best;
}

export function nearestKin(org: Organism, world: World): Organism | null {
  let best: Organism | null = null;
  let bd = Infinity;
  for (const o of world.organisms) {
    if (o.id === org.id || o.taxon !== org.taxon) continue;
    const d = dist(org.pos, o.pos);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

/** 배회 지점 — 현재 위치에서 적당히 떨어진 무작위 좌표 */
export function wanderPoint(org: Organism, world: World): Vec {
  const ang = world.rng() * Math.PI * 2;
  const r = 15 + world.rng() * 25;
  return {
    x: Math.min(95, Math.max(5, org.pos.x + Math.cos(ang) * r)),
    y: Math.min(95, Math.max(5, org.pos.y + Math.sin(ang) * r)),
  };
}

/** 가장 급한 니즈 (가장 낮은 값) */
export function lowestNeed(org: Organism): NeedKey {
  const n = org.needs;
  let key: NeedKey = 'energy';
  if (n.arousal < n[key]) key = 'arousal';
  if (n.bonding < n[key]) key = 'bonding';
  return key;
}

/** 니즈 → SEEK 목표 좌표 */
export function targetForNeed(need: NeedKey, org: Organism, world: World): Vec {
  if (need === 'energy') return nearestNode(org, world) ?? wanderPoint(org, world);
  if (need === 'bonding') return nearestKin(org, world)?.pos ?? wanderPoint(org, world);
  return wanderPoint(org, world); // arousal — 움직이는 것 자체가 회복
}

/**
 * 니즈가 전부 여유일 때 목적이 결정하는 기본 행동.
 * 반환 null = 이동하지 않음(idle 유지).
 */
export function purposeTarget(org: Organism, world: World): Vec | null {
  switch (org.purpose) {
    case 'seek_energy':
      return nearestNode(org, world);
    case 'seek_kin':
      return nearestKin(org, world)?.pos ?? null;
    case 'avoid_light': {
      // 화면 중앙(가장 밝은 곳으로 가정)에서 먼 가장자리로
      const away = { x: org.pos.x - 50, y: org.pos.y - 50 };
      const len = Math.hypot(away.x, away.y) || 1;
      return {
        x: Math.min(92, Math.max(8, org.pos.x + (away.x / len) * 20)),
        y: Math.min(92, Math.max(8, org.pos.y + (away.y / len) * 20)),
      };
    }
    case 'expand':
      return wanderPoint(org, world);
    case 'persist':
      return null; // 제자리 유지
  }
}
