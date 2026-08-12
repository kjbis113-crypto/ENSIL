import { COPY } from '../../copy';

/** 소개 오버레이 — 페이지가 아니라 메인 위에 덮임 (뎁스 1 원칙, plan.md §4-5) */
export function AboutOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="about-backdrop" onClick={onClose}>
      <div className="about-box" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{COPY.aboutTitle}</h2>
          <button className="close" onClick={onClose}>
            × {COPY.aboutClose}
          </button>
        </header>
        <p>
          ENSIL은 버려진 전자 부품을 죽은 물질이 아니라 새로운 생태계의 배지로 바라봅니다.
          남아 있는 전하, 끊어진 신호, 반복된 입력은 각 개체의 감각과 본능으로 재조직됩니다.
        </p>
        <div className="diagram">{COPY.diagramPlaceholder}</div>
        <p>
          압력·빛·거리·소리는 대사가 되고, 진동·연결·움직임은 행동이 됩니다. 이 관찰실은
          여덟 개체가 서로를 감지하고 변화시키는 과정을 하나의 살아 있는 문화로 기록합니다.
        </p>
      </div>
    </div>
  );
}
