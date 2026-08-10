"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PROJECT_COPY, SPECIES, type SpeciesId } from "../data/species";
import { useReducedMotion } from "../hooks/useEnvironment";
import { useEcosystem } from "../store/ecosystem";
import { CreatureVisual } from "./creatures/CreatureVisuals";

function RotatingSpecimen({ species, reduced }: { species: SpeciesId; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * (reduced ? 0.06 : 0.18);
    group.current.position.y = Math.sin(clock.elapsedTime * 0.5) * (reduced ? 0.015 : 0.05);
  });
  return (
    <group ref={group} scale={species === "photophore" ? 0.9 : species === "resonance" ? 0.86 : 1}>
      <CreatureVisual species={species} growth={2} reduced={reduced} signal={0.2} isolated />
    </group>
  );
}

function MiniSpecimen({ species }: { species: SpeciesId }) {
  const systemReduced = useReducedMotion();
  const manualReduced = useEcosystem((state) => state.reducedMotion);
  const reduced = systemReduced || manualReduced;
  return (
    <Canvas
      className="archive-canvas"
      camera={{ position: [0, 0, 4.7], fov: 43 }}
      dpr={[1, 1.25]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      aria-label={`Rotating 3D specimen of ${species}`}
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[-3, 4, 5]} intensity={3.2} color="#ffffff" />
      <pointLight position={[3, -1, 3]} intensity={7} color="#7687ff" distance={7} />
      <RotatingSpecimen species={species} reduced={reduced} />
    </Canvas>
  );
}

export function Archive() {
  const showEcosystem = useEcosystem((state) => state.showEcosystem);
  const setSelectedSpecies = useEcosystem((state) => state.setSelectedSpecies);

  const locate = (species: SpeciesId) => {
    setSelectedSpecies(species);
    showEcosystem();
  };

  return (
    <main className="archive" id="archive">
      <header className="archive-header">
        <button className="wordmark wordmark-button" onClick={showEcosystem} aria-label="Return to ecosystem">ENSIL</button>
        <div className="archive-heading">
          <p className="eyebrow">Specimen Archive / Active culture</p>
          <h1>Electronic life, indexed by function.</h1>
          <p>{PROJECT_COPY.archiveIntro}</p>
        </div>
        <button className="text-button archive-return" onClick={showEcosystem}>Return to ecosystem ↘</button>
      </header>
      <section className="archive-grid" aria-label="Five electronic species">
        {SPECIES.map((species) => (
          <article className="archive-card" key={species.id}>
            <div className="archive-visual">
              <span className="specimen-index">{species.index}</span>
              <MiniSpecimen species={species.id} />
              <span className="living-status"><i style={{ background: species.accent }} /> living</span>
            </div>
            <div className="archive-copy">
              <p className="latin">{species.latin}</p>
              <h2>{species.name}</h2>
              <dl className="archive-facts">
                <div><dt>Source components</dt><dd>{species.components.join(" · ")}</dd></div>
                <div><dt>Sensory input</dt><dd>{species.input}</dd></div>
                <div><dt>Behavioral output</dt><dd>{species.output}</dd></div>
                <div><dt>Lifecycle trait</dt><dd>{species.lifecycle}</dd></div>
              </dl>
              <p className="field-note"><span>Field note</span>{species.note}</p>
              <button className="locate-button" onClick={() => locate(species.id)}>
                Locate living specimen <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        ))}
      </section>
      <footer className="archive-footer">
        <span>ENSIL / Electronic Ensilage</span>
        <span>Culture remains active while observed</span>
      </footer>
    </main>
  );
}
