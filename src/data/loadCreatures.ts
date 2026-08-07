import type { Creature } from '../types/creature';
import raw from './creatures.json';

/**
 * plan.md §11-2 — 로컬 JSON이 진실의 기준.
 * Supabase 동기화(M10)는 이 함수 안에 추가되며, 실패해도 로컬본으로 항상 동작한다.
 */
export function loadCreatures(): Creature[] {
  return raw as Creature[];
}
