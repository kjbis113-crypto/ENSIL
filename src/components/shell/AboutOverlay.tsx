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
          전자생물은 가상 생명체 탄생 메커니즘 컨셉에서 파생된 존재다. 이 자리에 탄생
          메커니즘에 대한 실제 서술이 들어간다. 지금은 레이아웃 확인을 위한 더미 문단.
        </p>
        <div className="diagram">{COPY.diagramPlaceholder}</div>
        <p>
          각 전자생물은 관측과 동시에 표본 번호를 부여받아 아카이브에 등재되며, 심즈의
          야망처럼 단 하나의 최초 목적을 갖고 시뮬레이션 안에서 살아간다. 더미 문단.
        </p>
      </div>
    </div>
  );
}
