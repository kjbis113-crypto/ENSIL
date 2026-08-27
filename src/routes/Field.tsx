import { useState } from 'react';
import { PanoramaViewer } from '../components/field/PanoramaViewer';
import { CREATURE_RECORDS, getCreatureRecord } from '../data/creatureRecords';

export function Field() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proximityId, setProximityId] = useState<string | null>(null);
  const [observation, setObservation] = useState(false);
  const [paused, setPaused] = useState(false);
  const [panoramaMode, setPanoramaMode] = useState<'loading' | 'limited' | '360' | 'error'>('loading');
  const selected = selectedId ? getCreatureRecord(selectedId) : null;
  const proximity = !selected && proximityId ? getCreatureRecord(proximityId) : null;

  return (
    <main className="field-page field-page--panorama">
      <PanoramaViewer paused={paused} onSelect={setSelectedId} onProximity={setProximityId} onModeChange={setPanoramaMode} />

      <div className="field-index" aria-hidden><span>FIELD 01 / LIVING PANORAMA</span><span>04 ELECTRONIC ORGANISMS</span></div>
      <div className="field-environment" aria-hidden><span>INPUT / POINTER</span><span>{panoramaMode === '360' ? 'VIEW / 360°' : 'VIEW / ±47°'}</span><span>DENSITY 04</span></div>
      <p className="field-panorama-help">DRAG TO LOOK · SCROLL TO ZOOM · SELECT A SIGNAL</p>

      <div className="field-controls field-controls--compact" aria-label="Field controls">
        <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'RESUME' : 'PAUSE'}</button>
        <button type="button" onClick={() => setObservation((value) => !value)} aria-pressed={observation}>{observation ? 'CLOSE INDEX' : 'FIELD INDEX'}</button>
      </div>

      {proximity && <div className="field-proximity" aria-live="polite"><i /><span>{proximity.code}</span><strong>{proximity.sensor}</strong><small>SIGNAL IN RANGE</small></div>}

      {selected && (
        <aside className="encounter-card is-open" aria-live="polite">
          <button className="encounter-card__close" type="button" onClick={() => setSelectedId(null)} aria-label="Close encounter">×</button>
          <span>{selected.code} / PANORAMA SIGNAL</span><h1>{selected.name}</h1>
          <dl>
            <div><dt>SENSOR</dt><dd>{selected.sensor}</dd></div>
            <div><dt>INPUT</dt><dd>{selected.input}</dd></div>
            <div><dt>RESPONSE</dt><dd>{selected.response}</dd></div>
          </dl>
          <div className="encounter-card__actions"><a href={`#/habitat/${selected.id}`}>ENTER HABITAT <span>→</span></a><a href={`#/creature/${selected.id}`}>ARCHIVE RECORD <span>↗</span></a></div>
        </aside>
      )}

      {observation && (
        <aside className="observation-layer" aria-label="Living organism index">
          <header><span>SPECIMEN</span><span>SENSOR</span></header>
          {CREATURE_RECORDS.map((record) => <button type="button" key={record.id} onClick={() => setSelectedId(record.id)}><span><i />{record.code}</span><span>{record.sensor}</span></button>)}
          <footer><span>SELECT A RECORD TO OPEN ITS SIGNAL</span></footer>
        </aside>
      )}
    </main>
  );
}
