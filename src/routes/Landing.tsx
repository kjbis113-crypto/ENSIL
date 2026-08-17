import { SpecimenGlyph } from '../components/archive/SpecimenGlyph';
import { LiquidEnsilLogo } from '../components/branding/LiquidEnsilLogo';
import { CREATURE_RECORDS } from '../data/creatureRecords';

export function Landing() {
  return (
    <main className="landing-page">
      <div className="landing-specimens" aria-hidden>
        {CREATURE_RECORDS.map((record, index) => (
          <div
            className={`landing-specimen landing-specimen--${index + 1}`}
            data-label={`${record.code} / ${record.sensor.toUpperCase()}`}
            key={record.id}
          >
            <SpecimenGlyph index={record.glyphIndex} live palette={record.palette} />
          </div>
        ))}
      </div>

      <section className="landing-title">
        <p>INTERACTIVE ELECTRONIC ECOLOGY / SEOUL 2026</p>
        <h1 className="landing-title__sr-only">ENSIL</h1>
        <LiquidEnsilLogo className="landing-title__logo" />
      </section>

      <section className="landing-manifesto">
        <span>04 AUTONOMOUS BODIES</span>
        <p>Four creatures sense, respond and remember. Enter the shared field or inspect their living records.</p>
      </section>

      <nav className="landing-portals" aria-label="Enter ENSIL">
        <a href="#/field">
          <span>01 / LIVE SYSTEM</span>
          <strong>ENTER FIELD</strong>
          <i>→</i>
        </a>
        <a href="#/archive">
          <span>02 / LIVING RECORDS</span>
          <strong>OPEN ARCHIVE</strong>
          <i>→</i>
        </a>
      </nav>

      <div className="landing-signal" aria-hidden>
        <span>CAPACITANCE</span><span>SOUND</span><span>MOTION</span><span>OPTIC</span>
      </div>
    </main>
  );
}
