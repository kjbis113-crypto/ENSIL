export type Taxon = 'A' | 'B' | 'C';
export type Shape = 'circle' | 'square' | 'triangle';
export type DriveKind = 'seek_energy' | 'seek_kin' | 'avoid_light' | 'expand' | 'persist';

/** 종 = 생태계-생명체화된 전자부품. 3D 목업 형태와 이동 메커니즘을 결정한다. */
export type Species = 'mcu' | 'led' | 'transistor' | 'resistor' | 'capacitor' | 'switch';
export type CreatureStatus = '관찰 중' | '휴면' | '소실';

export interface Annotation {
  id: string;
  /** 이미지 기준 0~1 비율 좌표 */
  anchor: { x: number; y: number };
  /** 라벨 박스가 나갈 방향 */
  side: 'left' | 'right';
  label: string;
  body: string;
}

export interface Creature {
  id: string;
  code: string;
  name: string;
  latin?: string;
  taxon: Taxon;
  species: Species;
  registeredAt: string;
  status: CreatureStatus;
  visual: {
    main: string;
    thumb: string;
    shape: Shape;
  };
  annotations: Annotation[];
  ecology: {
    habitat: string;
    metabolism: string;
    reproduction: string;
    lifespan?: string;
  };
  purpose: {
    kind: DriveKind;
    statement: string;
  };
  traits: {
    charge: number;
    stimulus: number;
    bond: number;
  };
  notes: { date: string; text: string }[];
  physical?: { slot: number };
}
