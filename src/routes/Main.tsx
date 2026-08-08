import { useMemo } from 'react';
import { loadCreatures } from '../data/loadCreatures';
import { useViewState } from '../state/useViewState';
import { useInput } from '../input/useInput';
import { COPY } from '../copy';
import { SystemBar } from '../components/shell/SystemBar';
import { ModeBar } from '../components/shell/ModeBar';
import { AboutOverlay } from '../components/shell/AboutOverlay';
import { IndexStrip } from '../components/index/IndexStrip';
import { LogoCloud } from '../components/logo/LogoCloud';
import { SpecimenView } from '../components/specimen/SpecimenView';
import { SimView } from '../components/simulation/SimView';

/** 메인 — 시스템바 / 목차 / 대형 뷰 / 모드바 (plan.md §4-1). 페이지 이동 없는 단일 화면. */
export function Main() {
  const creatures = useMemo(loadCreatures, []);
  const view = useViewState(creatures);

  // 물리 입력 (plan.md §7) — 슬롯 선택·틸트가 여기로 들어온다
  const input = useInput({
    onSelectSlot: (slot) => {
      const c = creatures.find((x) => x.physical?.slot === slot);
      if (c) view.select(c.id);
    },
    onStep: view.step,
    onRelease: () => view.select(null),
  });

  return (
    <div className="app">
      <SystemBar physicalConnected={input.connected} />
      <IndexStrip creatures={creatures} selectedId={view.selectedId} onSelect={view.select} />
      <main className="bigview">
        {view.mode !== 'sim' && <LogoCloud />}
        {view.mode === 'sim' ? (
          <SimView creatures={creatures} view={view} tiltRef={input.tiltRef} />
        ) : view.selected ? (
          <SpecimenView key={view.selected.id} creature={view.selected} />
        ) : (
          <div className="overview">
            <h2>{COPY.overviewTitle}</h2>
            <p>{COPY.overviewHint}</p>
          </div>
        )}
      </main>
      <ModeBar view={view} total={creatures.length} />
      {view.aboutOpen && <AboutOverlay onClose={() => view.setAbout(false)} />}
    </div>
  );
}
