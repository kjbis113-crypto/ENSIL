import type { Advertisement, NeedKey, Organism, World } from './types';

/**
 * 심즈식 유틸리티 AI.
 * 1) 환경(노드·다른 개체·가상 지점)이 광고를 낸다 — collectAds()
 * 2) 개체는 니즈 절박도 × 충족량 × 거리 감쇠로 스코어링해 최선을 고른다 — chooseAction()
 * 행동 로직을 개체 안에 쌓지 않는다: 새 오브젝트 = 새 광고 하나.
 */

const KIN_AD = { bonding: 0.7, arousal: 0.15 };
const NODE_AD = { energy: 0.9 };
const WANDER_AD = { arousal: 0.6 };
const REST_AD = { energy: 0.25 };

/** 절박도 곡선 — 낮을수록 가파르게 절박해진다 (심즈의 비선형 니즈 곡선) */
export function urgency(v: number): number {
  const lack = 1 - v;
  return lack * lack * 10;
}

/** 목적(최초의 목적)이 니즈 가중치를 비튼다 — 심즈의 성격/야망에 대응 */
export function purposeWeights(org: Organism): Record<NeedKey, number> {
  const w: Record<NeedKey, number> = { energy: 1, arousal: 1, bonding: 1 };
  switch (org.purpose) {
    case 'seek_energy': w.energy = 1.6; break;
    case 'seek_kin': w.bonding = 1.6; break;
    case 'expand': w.arousal = 1.5; break;
    case 'avoid_light': w.arousal = 1.2; break;
    case 'persist': w.energy = 1.2; w.arousal = 0.6; break;
  }
  return w;
}

export function collectAds(org: Organism, world: World): Advertisement[] {
  const ads: Advertisement[] = [];

  for (const n of world.nodes) {
    ads.push({ sourceId: n.id, kind: 'consume', pos: n.pos, satisfies: NODE_AD });
  }
  for (const o of world.organisms) {
    if (o.id === org.id || o.taxon !== org.taxon) continue;
    ads.push({ sourceId: o.id, kind: 'interact', pos: o.pos, satisfies: KIN_AD });
  }

  // 배회 지점 — avoid_light 개체는 중앙(밝음)에서 먼 가장자리를 고른다
  const wander = pickWanderPos(org, world);
  ads.push({ sourceId: 'wander', kind: 'wander', pos: wander, satisfies: WANDER_AD });

  // 제자리 휴식
  ads.push({ sourceId: 'rest', kind: 'rest', pos: { ...org.pos }, satisfies: REST_AD });

  return ads;
}

function pickWanderPos(org: Organism, world: World) {
  if (org.purpose === 'avoid_light') {
    const dx = org.pos.x - 50;
    const dy = org.pos.y - 50;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x: Math.min(92, Math.max(8, org.pos.x + (dx / len) * 22 + (world.rng() - 0.5) * 14)),
      y: Math.min(92, Math.max(8, org.pos.y + (dy / len) * 22 + (world.rng() - 0.5) * 14)),
    };
  }
  const ang = world.rng() * Math.PI * 2;
  const r = 14 + world.rng() * 26;
  return {
    x: Math.min(95, Math.max(5, org.pos.x + Math.cos(ang) * r)),
    y: Math.min(95, Math.max(5, org.pos.y + Math.sin(ang) * r)),
  };
}

/** 거리 감쇠 — 멀수록 매력이 떨어진다 */
function attenuation(d: number): number {
  return 1 / (1 + d * 0.04);
}

export function scoreAd(org: Organism, ad: Advertisement): number {
  const w = purposeWeights(org);
  let s = 0;
  for (const key of Object.keys(ad.satisfies) as NeedKey[]) {
    s += urgency(org.needs[key]) * w[key] * (ad.satisfies[key] ?? 0);
  }
  const d = Math.hypot(ad.pos.x - org.pos.x, ad.pos.y - org.pos.y);
  return s * attenuation(d);
}

export function chooseAction(org: Organism, world: World): Advertisement {
  const ads = collectAds(org, world);
  let best = ads[0];
  let bestScore = -Infinity;
  for (const ad of ads) {
    // 소량의 노이즈 — 동점 교착과 기계적 반복을 깬다
    const s = scoreAd(org, ad) * (0.9 + world.rng() * 0.2);
    if (s > bestScore) { bestScore = s; best = ad; }
  }
  return best;
}
