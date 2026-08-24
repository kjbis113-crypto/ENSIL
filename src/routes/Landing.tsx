import { CreatureCarousel } from '../components/carousel/CreatureCarousel';

/**
 * 인덱스(아카이브 패널) — 미니멀 캐러셀 디렉션.
 * 전시 구조: 이 화면은 관람객 컴퓨터, #/field는 빔프로젝터.
 * SEND CHARGE가 BroadcastChannel로 필드에 전하를 떨어뜨린다 (useFieldLink).
 */
export function Landing() {
  return <CreatureCarousel />;
}
