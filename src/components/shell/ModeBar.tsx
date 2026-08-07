import { COPY } from '../../copy';
import type { ViewState } from '../../state/useViewState';

export function ModeBar({ view, total }: { view: ViewState; total: number }) {
  return (
    <footer className="modebar">
      <button
        className={view.mode === 'specimen' ? 'active' : ''}
        onClick={() => view.setMode('specimen')}
      >
        {COPY.modeSpecimen}
      </button>
      <button
        className={view.mode === 'sim' ? 'active' : ''}
        onClick={() => view.setMode('sim')}
      >
        {COPY.modeSim}
      </button>
      <span className="spacer" />
      <button onClick={() => view.setAbout(true)}>{COPY.about}</button>
      <span className="pos">
        {view.selected ? `${view.selected.code} / ${total}` : `— / ${total}`}
      </span>
    </footer>
  );
}
