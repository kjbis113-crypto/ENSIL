import { useState, type CSSProperties } from 'react';
import { CircularArchiveCarousel } from '../components/archive/CircularArchiveCarousel';
import { SpecimenGlyph } from '../components/archive/SpecimenGlyph';
import { InteractiveCreature } from '../components/experience/InteractiveCreature';
import { CREATURE_RECORDS } from '../data/creatureRecords';

export function Archive() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = CREATURE_RECORDS[activeIndex];
  const paletteStyle = {
    '--collection-primary': active.palette.primary,
    '--collection-secondary': active.palette.secondary,
    '--collection-accent': active.palette.accent,
    '--collection-paper': active.palette.paper,
    '--collection-ink': active.palette.ink,
  } as CSSProperties;

  return (
    <main className="archive-page archive-page--editorial" style={paletteStyle}>
      <section className="archive-workstation" aria-label="ENSIL living archive">
        <aside className="archive-specimen-index" aria-label="Specimen index">
          <header><span>LIVING RECORDS</span><span>01—04</span></header>
          <div className="archive-specimen-index__grid">
            {CREATURE_RECORDS.map((record, index) => (
              <button type="button" className={activeIndex === index ? 'is-active' : ''} aria-pressed={activeIndex === index} onClick={() => setActiveIndex(index)} key={record.id}>
                <SpecimenGlyph index={record.glyphIndex} live palette={record.palette} label={`Select ${record.name}`} code={record.code} />
                <span><b>{record.code}</b><i>{record.sensor}</i></span>
              </button>
            ))}
          </div>
          <p>SELECT A BODY<br />TO READ ITS<br />LIVING RECORD.</p>
        </aside>

        <section className="archive-living-stage" aria-live="polite">
          <header><span>{active.code} / ACTIVE SPECIMEN</span><span>DRAG / ROTATE / TOUCH</span></header>
          <CircularArchiveCarousel
            activeIndex={activeIndex}
            onChange={setActiveIndex}
            variant="stage"
            className="archive-stage-carousel"
            center={<InteractiveCreature record={active} />}
          />
          <footer className="archive-stage-caption"><span>{active.sensor.toUpperCase()}</span><strong>{active.name}</strong></footer>
        </section>

        <aside className="archive-record-sheet">
          <header><span>ARCHIVES FOR<br />ELECTRO-FERMENTATION</span><b>{active.code}</b></header>
          <h1>{active.name}</h1>
          <dl>
            <div><dt>ORIGIN</dt><dd>{active.archive.origin}</dd></div>
            <div><dt>SENSOR</dt><dd>{active.sensor}</dd></div>
            <div><dt>INPUT</dt><dd>{active.input}</dd></div>
            <div><dt>RESPONSE</dt><dd>{active.response}</dd></div>
            <div><dt>MOTIF</dt><dd>{active.archive.motif}</dd></div>
          </dl>
          <section><span>EMERGENCE</span><p>{active.archive.emergence}</p></section>
          <ol>{active.observations.map((observation) => <li key={observation.time}><time>{observation.time}</time><span>{observation.state}</span></li>)}</ol>
          <div className="archive-record-sheet__actions"><a href={`#/creature/${active.id}`}>FULL RECORD ↗</a><a href={`#/habitat/${active.id}`}>ENTER HABITAT →</a></div>
        </aside>
      </section>
    </main>
  );
}
