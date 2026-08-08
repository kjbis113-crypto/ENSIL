import type { DriveKind, Shape, Taxon } from '../types/creature';

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

export interface Organism {
  id: string;
  code: string;
  shape: Shape;
  taxon: Taxon;
  purpose: DriveKind;
  traits: { charge: number; stimulus: number; bond: number }; // 0~10
  pos: Vec;
  vel: Vec;
  state: OrganismState;
  needs: NeedSet;
  /** SEEK 목표 지점 (노드·동종·회피 지점·배회 지점 모두 좌표로 통일) */
  target: Vec | null;
  /** 궤적 (최근 위치 샘플) */
  trail: Vec[];
}

export interface EnergyNode {
  id: string;
  pos: Vec;
}

/** 월드 좌표계는 0~100 (%) — 렌더러가 어떤 크기의 화면에도 그대로 사상 */
export interface World {
  t: number; // 경과 시간(초)
  organisms: Organism[];
  nodes: EnergyNode[];
  /** 물리 입력(센서)이 주입되는 전역 파라미터. 0~1 (plan.md §8-3) */
  ambientCharge: number;
  rng: () => number;
  /** 궤적 샘플링 누적 시간 (엔진 내부용) */
  trailAcc: number;
}
