"use client";

import { OFFERINGS, PROJECT_COPY } from "../data/species";
import { useEcosystem } from "../store/ecosystem";
import { SpecimenPanel } from "./SpecimenPanel";

export function EcosystemUI() {
  const quiet = useEcosystem((state) => state.quiet);
  const sound = useEcosystem((state) => state.sound);
  const microphone = useEcosystem((state) => state.microphone);
  const reducedMotion = useEcosystem((state) => state.reducedMotion);
  const lifecycle = useEcosystem((state) => state.lifecycle);
  const quality = useEcosystem((state) => state.quality);
  const selectedOffering = useEcosystem((state) => state.selectedOffering);
  const showArchive = useEcosystem((state) => state.showArchive);
  const toggleQuiet = useEcosystem((state) => state.toggleQuiet);
  const toggleSound = useEcosystem((state) => state.toggleSound);
  const setMicrophone = useEcosystem((state) => state.setMicrophone);
  const toggleReducedMotion = useEcosystem((state) => state.toggleReducedMotion);
  const setQuality = useEcosystem((state) => state.setQuality);
  const setSelectedOffering = useEcosystem((state) => state.setSelectedOffering);

  if (quiet) {
    return <button className="quiet-exit" onClick={toggleQuiet}>Exit quiet observation</button>;
  }

  return (
    <div className="ecosystem-ui">
      <header className="topbar">
        <div>
          <span className="wordmark">{PROJECT_COPY.title}</span>
          <span className="culture-id">CULTURE / 08-10-26</span>
        </div>
        <nav aria-label="Primary navigation">
          <button className="nav-active">Ecosystem</button>
          <button onClick={showArchive}>Archive</button>
        </nav>
        <div className="utility-controls">
          <button aria-pressed={sound} onClick={toggleSound}>{sound ? "Sound on" : "Sound off"}</button>
          <button aria-pressed={microphone} onClick={() => setMicrophone(!microphone)} title="Microphone permission is requested only when enabled">
            {microphone ? "Mic on" : "Mic mode"}
          </button>
          <button className="motion-control" aria-pressed={reducedMotion} onClick={toggleReducedMotion}>{reducedMotion ? "Calm on" : "Calm motion"}</button>
          <label className="quality-label">
            <span>Quality</span>
            <select value={quality} onChange={(event) => setQuality(event.target.value as "low" | "medium" | "high")}>
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
          </label>
          <button onClick={toggleQuiet}>Quiet view</button>
        </div>
      </header>

      <div className="lifecycle" aria-label={`Current lifecycle phase: ${lifecycle}`}>
        {(["Dormancy", "Fermentation", "Emergence"] as const).map((phase, index) => (
          <span key={phase} className={phase === lifecycle ? "active" : ""}>
            <i>{String(index + 1).padStart(2, "0")}</i>{phase}
          </span>
        ))}
      </div>

      <div className="observation-note">
        <span>Presence field active</span>
        <p>Move to influence · hold and release empty space to deposit</p>
      </div>

      <section className="offering-tray" aria-label="Electronic offerings">
        <div className="tray-label">
          <span>Offer a fragment</span>
          <small>Hold to charge</small>
        </div>
        <div className="offering-options">
          {OFFERINGS.map((offering) => (
            <button
              key={offering.id}
              className={offering.id === selectedOffering ? "active" : ""}
              onClick={() => setSelectedOffering(offering.id)}
              title={offering.description}
              aria-label={`${offering.label}: ${offering.description}`}
              aria-pressed={offering.id === selectedOffering}
            >
              <i>{offering.mark}</i><span>{offering.label}</span>
            </button>
          ))}
        </div>
      </section>
      <SpecimenPanel />
    </div>
  );
}
