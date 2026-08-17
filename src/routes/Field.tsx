import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { EcosystemCanvas } from '../components/field/EcosystemCanvas';
import { CREATURE_RECORDS, getCreatureRecord, type CreatureState } from '../data/creatureRecords';

type Snapshot = { id: string; state: CreatureState; energy: number; stress: number };

export function Field() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proximityId, setProximityId] = useState<string | null>(null);
  const [observation, setObservation] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot[]>([]);
  const [sensorStatus, setSensorStatus] = useState<'POINTER' | 'MIC ACTIVE' | 'CAMERA ACTIVE'>('POINTER');

  useEffect(() => {
    const timeout = window.setTimeout(() => setHintVisible(false), 4200);
    return () => window.clearTimeout(timeout);
  }, []);

  const activeRecordId = selectedId ?? proximityId;
  const selected = activeRecordId ? getCreatureRecord(activeRecordId) : null;
  const selectedRuntime = useMemo(
    () => snapshot.find((runtime) => runtime.id === activeRecordId),
    [activeRecordId, snapshot],
  );
  const fieldPalette = selected?.palette ?? CREATURE_RECORDS[0].palette;
  const fieldStyle = {
    '--field-primary': fieldPalette.primary,
    '--field-secondary': fieldPalette.secondary,
    '--field-accent': fieldPalette.accent,
    '--field-paper': fieldPalette.paper,
    '--field-ink': fieldPalette.ink,
  } as CSSProperties;

  const requestSensor = async (kind: 'mic' | 'camera') => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'mic' ? { audio: true } : { video: true });
      setSensorStatus(kind === 'mic' ? 'MIC ACTIVE' : 'CAMERA ACTIVE');
      window.setTimeout(() => stream.getTracks().forEach((track) => track.stop()), 60_000);
    } catch {
      setSensorStatus('POINTER');
    }
  };

  return (
    <main className="field-page" style={fieldStyle}>
      <EcosystemCanvas
        selectedId={selectedId}
        observation={observation}
        paused={paused}
        onSelect={setSelectedId}
        onEnter={(id) => { window.location.hash = `/habitat/${id}`; }}
        onProximity={setProximityId}
        onSnapshot={setSnapshot}
      />

      <div className="field-index" aria-hidden>
        <span>FIELD 01</span>
        <span>04 LIVING RECORDS</span>
      </div>

      {hintVisible && (
        <div className="field-intro" role="status">
          <p>MOVE TO DISTURB</p>
          <p>CLICK CREATURE TO ACTIVATE</p>
          <p>USE ENCOUNTER CARD TO ENTER</p>
        </div>
      )}

      <div className="field-controls" aria-label="Field controls">
        <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
        <button type="button" onClick={() => setObservation((value) => !value)} aria-pressed={observation}>
          OBSERVATION LAYER
        </button>
        <button type="button" onClick={() => requestSensor('mic')}>ENABLE MIC</button>
        <button type="button" onClick={() => requestSensor('camera')}>ENABLE CAMERA</button>
      </div>

      <div className="field-environment">
        <span>INPUT / {sensorStatus}</span>
        <span>LIGHT 61%</span>
        <span>DENSITY 04</span>
      </div>

      <aside className="field-species-rail" aria-label="Electronic organisms">
        <header><span>SPECIMEN</span><span>STATE</span></header>
        {CREATURE_RECORDS.map((record) => {
          const runtime = snapshot.find((item) => item.id === record.id);
          return (
            <button
              type="button"
              className={activeRecordId === record.id ? 'is-active' : ''}
              onClick={() => setSelectedId(record.id)}
              key={record.id}
            >
              <i style={{ backgroundColor: record.palette.primary }} />
              <span>{record.code}</span>
              <span>{runtime?.state ?? 'loading'}</span>
            </button>
          );
        })}
      </aside>

      <div className="field-ticker" aria-hidden>
        <div>
          <span>CAPACITANCE / DISTANCE / CONNECTION</span>
          <span>SOUND / RHYTHM / RESONANCE</span>
          <span>MOTION / GESTURE / LIGHT</span>
          <span>OPTIC / COLOUR / MATERIAL MEMORY</span>
        </div>
      </div>

      {selected && (
        <aside className={`encounter-card${selectedId ? '' : ' encounter-card--proximity'}`} aria-live="polite">
          {selectedId && <button className="encounter-card__close" type="button" onClick={() => setSelectedId(null)} aria-label="Close encounter">×</button>}
          <span>{selected.code} / {selectedId ? (selectedRuntime?.state ?? 'observing') : 'proximity signal'}</span>
          <h1>{selected.name}</h1>
          <dl>
            <div><dt>SENSES</dt><dd>{selected.input}</dd></div>
            <div><dt>RESPONDS</dt><dd>{selected.response}</dd></div>
            <div><dt>HABITAT</dt><dd>{selected.ecology.habitat}</dd></div>
          </dl>
          <div className="encounter-card__actions">
            <a href={`#/habitat/${selected.id}`}>ENTER HABITAT <span>→</span></a>
            <a href={`#/creature/${selected.id}`}>ARCHIVE RECORD <span>↗</span></a>
          </div>
          {!selectedId && <p className="encounter-card__signal">MOVE CLOSER TO OBSERVE · CLICK TO HOLD</p>}
        </aside>
      )}

      {observation && (
        <aside className="observation-layer" aria-label="Live organism state">
          <header><span>PROCESS</span><span>STATE</span><span>ENERGY</span></header>
          {CREATURE_RECORDS.map((record) => {
            const runtime = snapshot.find((item) => item.id === record.id);
            return (
              <button type="button" key={record.id} onClick={() => setSelectedId(record.id)}>
                <span>{record.code}</span>
                <span>{runtime?.state ?? 'entering'}</span>
                <span>{Math.round((runtime?.energy ?? 0) * 100).toString().padStart(2, '0')}</span>
              </button>
            );
          })}
        </aside>
      )}
    </main>
  );
}
