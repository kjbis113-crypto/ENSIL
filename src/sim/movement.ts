import type { Species } from '../types/creature';
import type { Organism, Vec, World } from './types';

/**
 * 종(전자부품)별 이동 메커니즘 — 같은 목표라도 다르게 움직인다.
 * 각 함수는 org를 target 방향으로 dt만큼 전진시키고 energy 비용을 반환한다.
 *
 *  mcu        축 정렬 이동(맨해튼) + 주기적 연산 멈춤 — 보드가 경로를 "계산"하며 간다
 *  led        빠르고 가벼운 지그재그 — 점멸하듯 경로가 흔들린다
 *  transistor 스위칭 듀티사이클 — 켜짐(질주)/꺼짐(정지) 반복
 *  resistor   저항 — 느리고 일정, 방향 전환이 무겁다
 *  capacitor  충전(정지) → 방전(활강) 반복
 *  switch     플립 — 일정 간격으로 딱딱 끊어지는 순간이동식 스텝
 */

const BASE = 4.5; // %/s 기준 속도

export interface MoveResult {
  arrived: boolean;
  cost: number; // energy 소모 계수 (기준 1)
}

const clampPos = (v: Vec) => {
  v.x = Math.min(97, Math.max(3, v.x));
  v.y = Math.min(97, Math.max(3, v.y));
};

function speedOf(org: Organism, world: World): number {
  return BASE * (0.5 + org.traits.stimulus / 10) * (0.5 + world.ambientCharge);
}

function toward(org: Organism, target: Vec, dist: number, speed: number, dt: number) {
  const dx = target.x - org.pos.x;
  const dy = target.y - org.pos.y;
  org.heading = Math.atan2(dy, dx);
  org.vel.x = (dx / dist) * speed;
  org.vel.y = (dy / dist) * speed;
  org.pos.x += org.vel.x * dt;
  org.pos.y += org.vel.y * dt;
  clampPos(org.pos);
}

type Mover = (org: Organism, target: Vec, dt: number, world: World) => MoveResult;

const ARRIVE = 1.6;

const movers: Record<Species, Mover> = {
  mcu(org, target, dt, world) {
    // 0.9초 이동 / 0.35초 연산 멈춤
    org.movePhase = (org.movePhase + dt) % 1.25;
    if (org.movePhase > 0.9) { org.vel.x = 0; org.vel.y = 0; return { arrived: false, cost: 0.2 }; }
    // 맨해튼: 더 먼 축부터 정렬
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    const axis: Vec = Math.abs(dx) > Math.abs(dy)
      ? { x: org.pos.x + Math.sign(dx) * d, y: org.pos.y }
      : { x: org.pos.x, y: org.pos.y + Math.sign(dy) * d };
    toward(org, axis, d, speedOf(org, world) * 0.9, dt);
    return { arrived: false, cost: 1 };
  },

  led(org, target, dt, world) {
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    org.movePhase += dt * 9; // 점멸/지그재그 위상
    const wiggle = Math.sin(org.movePhase) * 0.45;
    const jig: Vec = {
      x: target.x + -dy / d * wiggle * 10,
      y: target.y + dx / d * wiggle * 10,
    };
    toward(org, jig, Math.hypot(jig.x - org.pos.x, jig.y - org.pos.y) || 1, speedOf(org, world) * 1.5, dt);
    return { arrived: false, cost: 1.3 };
  },

  transistor(org, target, dt, world) {
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    org.movePhase = (org.movePhase + dt) % 0.8; // 듀티사이클 0.8s
    const on = org.movePhase < 0.35; // 44% 듀티
    if (!on) { org.vel.x *= 0.8; org.vel.y *= 0.8; return { arrived: false, cost: 0.1 }; }
    toward(org, target, d, speedOf(org, world) * 2.1, dt);
    return { arrived: false, cost: 1.4 };
  },

  resistor(org, target, dt, world) {
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    // 무거운 방향 전환 — 목표 방향으로 서서히 조향
    const want = Math.atan2(dy, dx);
    let diff = want - org.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    org.heading += diff * Math.min(1, dt * 2.2);
    const sp = speedOf(org, world) * 0.55;
    org.vel.x = Math.cos(org.heading) * sp;
    org.vel.y = Math.sin(org.heading) * sp;
    org.pos.x += org.vel.x * dt;
    org.pos.y += org.vel.y * dt;
    clampPos(org.pos);
    return { arrived: false, cost: 0.6 };
  },

  capacitor(org, target, dt, world) {
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    // movePhase = 충전량 (0~1 충전, 1~2 방전 진행)
    if (org.movePhase < 1) {
      org.movePhase += dt * (0.5 + world.ambientCharge); // 충전 — 전역 전하가 높으면 빨리 참
      org.vel.x = 0; org.vel.y = 0;
      return { arrived: false, cost: 0.05 };
    }
    org.movePhase += dt * 1.2;
    const t = org.movePhase - 1; // 방전 경과
    const burst = Math.max(0, 1 - t); // 감쇠
    toward(org, target, d, speedOf(org, world) * 2.6 * burst, dt);
    if (org.movePhase >= 2) org.movePhase = 0; // 재충전
    return { arrived: false, cost: 1.2 };
  },

  switch(org, target, dt, world) {
    const dx = target.x - org.pos.x;
    const dy = target.y - org.pos.y;
    const d = Math.hypot(dx, dy);
    if (d < ARRIVE) return { arrived: true, cost: 0 };
    org.movePhase += dt;
    const period = 0.45;
    if (org.movePhase >= period) {
      org.movePhase = 0;
      const hop = Math.min(d, speedOf(org, world) * period * 1.3);
      org.heading = Math.atan2(dy, dx);
      org.pos.x += (dx / d) * hop;
      org.pos.y += (dy / d) * hop;
      clampPos(org.pos);
    }
    org.vel.x = 0; org.vel.y = 0;
    return { arrived: false, cost: 0.9 };
  },
};

export function moveOrganism(org: Organism, target: Vec, dt: number, world: World): MoveResult {
  return movers[org.species](org, target, dt, world);
}
