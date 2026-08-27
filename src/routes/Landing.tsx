import { useState } from 'react';
import { CircularArchiveCarousel } from '../components/archive/CircularArchiveCarousel';
import { SpecimenGlyph } from '../components/archive/SpecimenGlyph';
import { LiquidEnsilLogo } from '../components/branding/LiquidEnsilLogo';
import { CREATURE_RECORDS } from '../data/creatureRecords';

export function Landing() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = CREATURE_RECORDS[activeIndex];

  return (
    <main className="landing-page">
      <header className="landing-register">
        <span>CIRCULAR ARCHIVE / 01—04</span>
        <span>ELECTRONIC ORGANISMS GENERATED THROUGH SENSING, RESIDUE, SIGNAL AND FERMENTATION.</span>
      </header>

      <CircularArchiveCarousel activeIndex={activeIndex} onChange={setActiveIndex} className="landing-carousel" />

      <div className="landing-active-glyph" aria-hidden>
        <SpecimenGlyph index={active.glyphIndex} live palette={active.palette} code={active.code} />
      </div>

      <section className="landing-title" aria-label="ENSIL archive identity">
        <h1>ENSIL</h1>
        <LiquidEnsilLogo className="landing-title__logo" />
      </section>

      <aside className="landing-manifesto" aria-live="polite">
        <header><span>{active.code}</span><span>ACTIVE BODY</span></header>
        <h2>{active.name}</h2>
        <dl>
          <div><dt>SENSOR</dt><dd>{active.sensor}</dd></div>
          <div><dt>INPUT</dt><dd>{active.input}</dd></div>
          <div><dt>RESPONSE</dt><dd>{active.response}</dd></div>
        </dl>
        <p>Researching electro-fermentation.<br />Archiving the life it creates.</p>
      </aside>

      <nav className="landing-portals" aria-label="Enter ENSIL">
        <a href="#/field"><span>01 / LIVE SYSTEM</span><strong>ENTER FIELD</strong><i>→</i></a>
        <a href="#/archive"><span>02 / LIVING RECORDS</span><strong>OPEN ARCHIVE</strong><i>→</i></a>
      </nav>
    </main>
  );
}
