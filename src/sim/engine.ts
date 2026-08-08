import type { NeedKey, Organism, World } from './types';
import { dist, lowestNeed, nearestKin, purposeTarget, targetForNeed } from './rules';

/**
 * 시뮬레이션 엔진 — 순수 TS. React/DOM을 모른다 (plan.md §8-1).
 * tick(world, dt)는 world를 제자리에서 변형한다. 렌더러는 결과만 그린다.
 */

// ── 튜닝 상수 ─────────────────────────────────────────────
const NEED_LOW = 0.35;      // 이 밑으로 떨어지면 SEEK
const NEED_OK = 0.8;        // 전부 이 위면 REST 후보
const REST_EXIT = 0.6;      // REST 해제 문턱
const DECAY = { energy: 0.012, arousal: 0.02, bonding: 0.015 } as const;
const MOVE_COST = 0.01;     // 이동 시 energy 추가 소모 (charge 반비례)
const BASE_SPEED = 4.5;     // %/s
const CONSUME_RADIUS = 3;
const KIN_RADIUS = 7;
const ARRIVE_RADIUS = 1.5;
const RECOVER = 0.25;       // 회복 속도 /s
const TRAIL_INTERVAL = 0.25;
const TRAIL_MAX = 48;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function speedOf(org: Organism, world: World) {
  // 자극이 높을수록 빠르고, ambientCharge(물리 입력)가 전체 속도에 곱해진다
  return BASE_SPEED * (0.5 + org.traits.stimulus / 10) * (0.5 + world.ambientCharge);
}

function decay(org: Organism, dt: number, world: World) {
  org.needs.energy = clamp01(org.needs.energy - DECAY.energy * dt);
  org.needs.arousal = clamp01(org.needs.arousal - DECAY.arousal * dt);
  const kin = nearestKin(org, world);
  const isolated = !kin || dist(org.pos, kin.pos) > KIN_RADIUS * 2;
  if (isolated) org.needs.bonding = clamp01(org.needs.bonding - DECAY.bonding * dt);
}

function moveToward(org: Organism, dt: number, world: World) {
  if (!org.target) return;
  const dx = org.target.x - org.pos.x;
  const dy = org.target.y - org.pos.y;
  const d = Math.hypot(dx, dy);
  if (d < ARRIVE_RADIUS) { org.vel.x = 0; org.vel.y = 0; return; }
  const sp = speedOf(org, world);
  org.vel.x = (dx / d) * sp;
  org.vel.y = (dy / d) * sp;
  org.pos.x = Math.min(97, Math.max(3, org.pos.x + org.vel.x * dt));
  org.pos.y = Math.min(97, Math.max(3, org.pos.y + org.vel.y * dt));
  // 이동 비용 — 전하가 높을수록 효율적
  org.needs.energy = clamp01(org.needs.energy - MOVE_COST * (1.5 - org.traits.charge / 10) * dt);
}

function arrived(org: Organism) {
  return org.target !== null && dist(org.pos, org.target) < ARRIVE_RADIUS + 0.5;
}

/** 상태 머신 1스텝 (plan.md §8-2) */
function stepOrganism(org: Organism, dt: number, world: World) {
  decay(org, dt, world);
  const urgent: NeedKey = lowestNeed(org);
  const urgentVal = org.needs[urgent];
  const n = org.needs;

  switch (org.state) {
    case 'rest': {
      // 휴면은 천천히 전 니즈 회복
      n.energy = clamp01(n.energy + RECOVER * 0.3 * dt);
      n.arousal = clamp01(n.arousal - DECAY.arousal * 0.5 * dt); // 자극은 쉬면 오히려 준다
      if (urgentVal < REST_EXIT) org.state = 'idle';
      break;
    }
    case 'idle': {
      if (urgentVal < NEED_LOW) {
        org.target = targetForNeed(urgent, org, world);
        org.state = 'seek';
      } else if (n.energy > NEED_OK && n.arousal > NEED_OK && n.bonding > NEED_OK) {
        org.state = 'rest';
        org.target = null;
      } else {
        // 여유 시간 — 목적이 행동을 결정
        const t = purposeTarget(org, world);
        if (t) { org.target = t; org.state = 'seek'; }
      }
      break;
    }
    case 'seek': {
      // 결속 SEEK은 목표가 움직이는 동종 — 스냅샷이 아니라 매 tick 추적하고,
      // 근접하면 도착 판정 없이 바로 접촉으로 전환 (도망가는 목표를 영원히 못 잡는 문제 방지)
      if (urgent === 'bonding') {
        const kin = nearestKin(org, world);
        if (kin) {
          org.target = kin.pos;
          if (dist(org.pos, kin.pos) < KIN_RADIUS) { org.state = 'interact'; break; }
        }
      }
      moveToward(org, dt, world);
      n.arousal = clamp01(n.arousal + RECOVER * 0.2 * dt); // 이동 자체가 자극 회복
      if (arrived(org)) {
        const nearNode = world.nodes.some((nd) => dist(org.pos, nd.pos) < CONSUME_RADIUS);
        const kin = nearestKin(org, world);
        const nearKin = kin && dist(org.pos, kin.pos) < KIN_RADIUS;
        if (nearNode) org.state = 'consume';
        else if (nearKin) org.state = 'interact';
        else { org.state = 'idle'; org.target = null; }
      } else if (urgent !== 'arousal' && urgentVal < NEED_LOW * 0.6) {
        // 더 급한 니즈가 생기면 목표를 갈아탄다
        org.target = targetForNeed(urgent, org, world);
      }
      break;
    }
    case 'consume': {
      n.energy = clamp01(n.energy + RECOVER * (0.5 + world.ambientCharge) * dt);
      if (n.energy > NEED_OK) { org.state = 'idle'; org.target = null; }
      break;
    }
    case 'interact': {
      n.bonding = clamp01(n.bonding + RECOVER * dt);
      n.arousal = clamp01(n.arousal + RECOVER * 0.5 * dt);
      const kin = nearestKin(org, world);
      if (!kin || dist(org.pos, kin.pos) > KIN_RADIUS || n.bonding > NEED_OK) {
        org.state = 'idle';
        org.target = null;
      }
      break;
    }
  }
}

export function tick(world: World, dt: number) {
  world.t += dt;
  for (const org of world.organisms) stepOrganism(org, dt, world);

  // 궤적 샘플링 (누적 시간은 world가 갖는다 — 리셋 시 함께 초기화)
  world.trailAcc += dt;
  if (world.trailAcc >= TRAIL_INTERVAL) {
    world.trailAcc = 0;
    for (const org of world.organisms) {
      org.trail.push({ x: org.pos.x, y: org.pos.y });
      if (org.trail.length > TRAIL_MAX) org.trail.shift();
    }
  }
}
