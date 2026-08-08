import type { DriveKind, Shape, Species, Taxon } from '../types/creature';

export type OrganismState = 'idle' | 'seek' | 'consume' | 'rest' | 'interact';

export interface Vec {
  x: number;
  y: number;
}

/** 니즈는 0~1. 매 tick 감소하고, 행동으로 회복한다 (plan.md §8-2) */
export interface NeedSet {
  energy: number;
  arousal: number;
  bonding: number;
}

export type NeedKey = keyof NeedSet;

/**
 * 심즈식 스마트 오브젝트 광고 — "나는 이 위치에서 이 니즈를 이만큼 채워준다".
 * 지능은 개체가 아니라 환경에 분산된다: 개체는 광고 목록을 스코어링해서 고를 뿐이다.
 */
export interface Advertisement {
  /** 광고 주체 (노드 id / 개체 id / 'wander' / 'rest') */
  sourceId: string;
  kind: 'consume' | 'interact' | 'wander' | 'rest';
  pos: Vec;
  /** 니즈별 충족량 (0~1) */
  satisfies: Partial<NeedSet>;
}

/** 개체가 현재 수행 중인 행동 */
export interface Action {
  ad: Advertisement;
  /** 수행 시작 여부 (도착 전 = 이동 중) */
  performing: boolean;
}

export interface Organism {
  id: string;
  code: string;
  shape: Shape;
  taxon: Taxon;
  species: Species;
  purpose: DriveKind;
  traits: { charge: number; stimulus: number; bond: number }; // 0~10
  pos: Vec;
  vel: Vec;
  /** 3D 렌더용 진행 방향 (rad) */
  heading: number;
  state: OrganismState;
  needs: NeedSet;
  action: Action | null;
  /** 종별 이동 메커니즘의 내부 위상 (펄스, 충전량, 듀티사이클 등) */
  movePhase: number;
  /** 궤적 (최근 위치 샘플) */
  trail: Vec[];
}

export interface EnergyNode {
  id: string;
  pos: Vec;
}

/** 월드 좌표계는 0~100 (%) — 렌더러가 어떤 화면·공간에도 그대로 사상 */
export interface World {
  t: number;
  organisms: Organism[];
  nodes: EnergyNode[];
  /** 물리 입력(센서)이 주입되는 전역 파라미터. 0~1 (plan.md §8-3) */
  ambientCharge: number;
  rng: () => number;
  trailAcc: number;
}
