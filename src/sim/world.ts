import type { Creature } from '../types/creature';
import type { Organism, World } from './types';

/** 결정적 시드 난수 (mulberry32) — 리로드마다 같은 초기 배치 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NODE_COUNT = 3;

export function createWorld(creatures: Creature[], seed = 20260808): World {
  const rng = mulberry32(seed);

  const organisms: Organism[] = creatures.map((c) => ({
    id: c.id,
    code: c.code,
    shape: c.visual.shape,
    taxon: c.taxon,
    purpose: c.purpose.kind,
    traits: c.traits,
    pos: { x: 10 + rng() * 80, y: 10 + rng() * 80 },
    vel: { x: 0, y: 0 },
    state: 'idle',
    // 시작 니즈를 흩뿌려서 처음부터 행동이 갈리게 한다
    needs: {
      energy: 0.5 + rng() * 0.4,
      arousal: 0.4 + rng() * 0.5,
      bonding: 0.4 + rng() * 0.5,
    },
    target: null,
    trail: [],
  }));

  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
    id: `node-${i}`,
    pos: { x: 15 + rng() * 70, y: 15 + rng() * 70 },
  }));

  return { t: 0, organisms, nodes, ambientCharge: 0.5, rng, trailAcc: 0 };
}
