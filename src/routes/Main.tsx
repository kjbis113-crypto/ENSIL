import { useMemo } from 'react';
import { loadCreatures } from '../data/loadCreatures';
import { useViewState } from '../state/useViewState';
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

  return (
    <div className="app">
      <SystemBar />
      <IndexStrip creatures={creatures} selectedId={view.selectedId} onSelect={view.select} />
      <main className="bigview">
        {view.mode !== 'sim' && <LogoCloud />}
        {view.mode === 'sim' ? (
          <SimView creatures={creatures} view={view} />
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
