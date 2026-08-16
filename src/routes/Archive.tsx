import { useEffect, useState, type CSSProperties } from 'react';
import { SpecimenGlyph } from '../components/archive/SpecimenGlyph';
import { CREATURE_RECORDS } from '../data/creatureRecords';

export function Archive() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = CREATURE_RECORDS[activeIndex];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % CREATURE_RECORDS.length);
    }, 5200);
    return () => window.clearInterval(interval);
  }, []);

  const paletteStyle = {
    '--collection-primary': active.palette.primary,
    '--collection-secondary': active.palette.secondary,
    '--collection-accent': active.palette.accent,
    '--collection-paper': active.palette.paper,
    '--collection-ink': active.palette.ink,
  } as CSSProperties;

  return (
    <main className="archive-page" style={paletteStyle}>
      <header className="archive-masthead">
        <div className="archive-masthead__rail">
          <span>COLLECTION *E</span>
          <span>05 ELECTRONIC ORGANISMS</span>
        </div>
        <h1 aria-label="Electronic Ecologies">
          <span className="archive-masthead__pixel">E</span>
          <span>cologies</span>
        </h1>
        <div className="archive-masthead__dots" aria-hidden>
          {CREATURE_RECORDS.map((record) => <i key={record.id} style={{ backgroundColor: record.palette.primary }} />)}
        </div>
      </header>

      <section className="archive-prologue" aria-label="Archive introduction">
        <div className="archive-prologue__print" aria-hidden>
          <SpecimenGlyph index={activeIndex} live palette={active.palette} />
          <span className="archive-prologue__echo">SENSE<br />RESPOND<br />REMEMBER</span>
        </div>
        <div className="archive-prologue__ascii" aria-hidden>
          <p>┌───────────────────────┐</p>
          <p>│  SIGNAL BECOMES BODY  │</p>
          <p>│  BODY BECOMES MEMORY  │</p>
          <p>└──────────┬────────────┘</p>
          <p>           ↓</p>
          <p>      LIVING RECORD</p>
        </div>
        <p className="archive-prologue__statement">
          Five bodies read the same world differently. This archive is not a cabinet—it is a live transmission.
        </p>
      </section>

      <section className="collection-browser" aria-label="Electronic organism collection">
        <aside className="collection-index">
          <span className="collection-index__title">COLLECTION “E”</span>
          <div className="collection-index__grid">
            {CREATURE_RECORDS.map((record, index) => (
              <button
                type="button"
                className={activeIndex === index ? 'is-active' : ''}
                aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                key={record.id}
              >
                <SpecimenGlyph index={index} live palette={record.palette} label={`Select ${record.name}`} />
                <b>▣ {record.code.replace('EO–', 'E')}</b>
              </button>
            ))}
          </div>
        </aside>

        <article className="collection-stage" key={active.id}>
          <header className="collection-stage__header">
            <span>{active.code}</span>
            <span>COLLECTION E</span>
            <span>{active.shortName.toUpperCase()}</span>
          </header>
          <a className="collection-stage__art" href={`#/creature/${active.id}`} aria-label={`Open archive record for ${active.name}`}>
            <SpecimenGlyph index={activeIndex} live palette={active.palette} label={active.name} />
            <span className="collection-stage__enter">OPEN RECORD ↗</span>
          </a>
        </article>

        <aside className="collection-data">
          <span>{active.code}</span>
          <dl>
            <div><dt>COLLECTION</dt><dd>E</dd></div>
            <div><dt>NAME</dt><dd>{active.name}</dd></div>
            <div><dt>INPUT</dt><dd>{active.input}</dd></div>
            <div><dt>OUTPUT</dt><dd>{active.response}</dd></div>
          </dl>
          <div className="collection-swatches" aria-label="Specimen colour register">
            {Object.entries(active.palette).slice(0, 3).map(([name, color]) => (
              <span key={name}><i style={{ backgroundColor: color }} />{name}</span>
            ))}
          </div>
          <a href={`#/habitat/${active.id}`}>ENTER HABITAT →</a>
        </aside>
      </section>

      <section className="archive-ledger" aria-label="Complete collection ledger">
        <header><span>ALL LIVING RECORDS</span><span>INDEX 01—05</span></header>
        {CREATURE_RECORDS.map((record, index) => (
          <a href={`#/creature/${record.id}`} key={record.id} onMouseEnter={() => setActiveIndex(index)}>
            <span>0{index + 1}</span>
            <strong>{record.name}</strong>
            <span>{record.sensor}</span>
            <i style={{ backgroundColor: record.palette.primary }} />
            <span>VIEW ↗</span>
          </a>
        ))}
      </section>

      <footer className="archive-footer">
        <p>THE FIELD IS THE PRIMARY RECORD.<br />THIS INDEX KEEPS ITS AFTERIMAGE.</p>
        <a href="#/field">RETURN TO FIELD →</a>
      </footer>
    </main>
  );
}
