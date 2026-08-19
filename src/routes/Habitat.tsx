import type { CSSProperties } from 'react';
import { HabitatScene } from '../components/habitat/HabitatScene';
import { getCreatureRecord } from '../data/creatureRecords';

export function Habitat({ id }: { id: string }) {
  const record = getCreatureRecord(id);
  const style = {
    '--habitat-primary': record.palette.primary,
    '--habitat-secondary': record.palette.secondary,
    '--habitat-accent': record.palette.accent,
    '--habitat-paper': record.palette.paper,
    '--habitat-ink': record.palette.ink,
  } as CSSProperties;

  return (
    <main className={`habitat-page habitat-page--${record.id}`} style={style}>
      <HabitatScene record={record} />
      <div className="habitat-meta">
        <span>{record.code} / INDIVIDUAL ECOLOGY</span>
        <span>STATE / RESPONSIVE</span>
      </div>
      <aside className="habitat-signal">
        <span>INPUT</span>
        <strong>{record.input}</strong>
        <span>RESPONSE</span>
        <strong>{record.response}</strong>
      </aside>
      <div className="habitat-actions">
        <a href="#/field">← ALL CREATURES</a>
        <a href={`#/creature/${record.id}`}>ARCHIVE RECORD ↗</a>
      </div>
      <p className="habitat-instruction">MOVE TO INFLUENCE · DRAG TO ORBIT · CLICK TO PULSE</p>
    </main>
  );
}
