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
        <p>본문 문단 1. 텍스트가 들어갈 자리.</p>
        <div className="diagram">{COPY.diagramPlaceholder}</div>
        <p>본문 문단 2. 텍스트가 들어갈 자리.</p>
      </div>
    </div>
  );
}
