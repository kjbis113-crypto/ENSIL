/**
 * "목업 작동 → 메인 다이얼이 그 개체로 돌아간 뒤 개체 페이지로 들어가는" 시퀀스의 손잡이.
 * 훅(useHardwareLink)은 랜딩으로 보낸 뒤 requestDialEnter(id) 만 부르고,
 * 다이얼(IndexVideoCarousel)이 마운트돼 있으면 이벤트로, 아직이면 마운트 직후 pending 을 집어 실행한다.
 */

export const DIAL_ENTER_EVENT = 'ensil:dial-enter';

let pending: string | null = null;

export function requestDialEnter(id: string) {
  pending = id;
  window.dispatchEvent(new CustomEvent<string>(DIAL_ENTER_EVENT, { detail: id }));
}

/** 다이얼이 마운트될 때 한 번 — 대기 중인 요청을 가져가며 비운다 */
export function consumeDialEnter(): string | null {
  const id = pending;
  pending = null;
  return id;
}

/** 시퀀스 도중 다이얼이 언마운트되면(StrictMode 의 mount→cleanup→mount 포함) 다음 마운트가 이어받도록 되돌려 둔다 */
export function restoreDialEnter(id: string) {
  pending = id;
}

export function clearDialEnter() {
  pending = null;
}
