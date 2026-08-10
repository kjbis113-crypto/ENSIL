"use client";

import { useEffect } from "react";
import { PROJECT_COPY } from "../data/species";
import { useAudioEngine, useMicrophoneMode } from "../hooks/useAudioEngine";
import { useEcosystem } from "../store/ecosystem";
import { Archive } from "./Archive";
import { EcosystemScene } from "./EcosystemScene";
import { EcosystemUI } from "./EcosystemUI";

function Entry() {
  const enter = useEcosystem((state) => state.enter);
  return (
    <div className="entry-content">
      <div className="entry-topline"><span>ARTIFICIAL CULTURE / SEOUL</span><span>SPECULATIVE ECOLOGY NO. 01</span></div>
      <div className="entry-title">
        <p>{PROJECT_COPY.subtitle}</p>
        <h1>{PROJECT_COPY.title}</h1>
      </div>
      <div className="entry-bottom">
        <p>{PROJECT_COPY.statement}</p>
        <button onClick={enter}>Enter the ecosystem <span aria-hidden="true">↘</span></button>
      </div>
      <p className="entry-question">{PROJECT_COPY.question}</p>
    </div>
  );
}

function FermentationOverlay() {
  const finish = useEcosystem((state) => state.finishFermentation);
  useEffect(() => {
    const timer = window.setTimeout(finish, 2800);
    return () => window.clearTimeout(timer);
  }, [finish]);
  return (
    <div className="fermentation-overlay" role="status" aria-live="polite">
      <div className="fermentation-center">
        <span>Electro-fermentation in progress</span>
        <h2>Residual charge<br />becoming instinct.</h2>
        <div className="fermentation-line"><i /></div>
        <div className="fermentation-stages"><span>Seal</span><span>Oxidize</span><span>Reorganize</span><span>Awaken</span></div>
      </div>
    </div>
  );
}

export default function EcosystemApp() {
  const mode = useEcosystem((state) => state.mode);
  const setQuality = useEcosystem((state) => state.setQuality);
  useAudioEngine();
  useMicrophoneMode();

  useEffect(() => {
    if (window.innerWidth < 620) setQuality("low");
  }, [setQuality]);

  if (mode === "archive") return <Archive />;

  return (
    <main className={`experience ${mode}`}>
      <EcosystemScene dormant={mode === "entry"} />
      {mode === "entry" && <Entry />}
      {mode === "fermenting" && <FermentationOverlay />}
      {mode === "live" && <EcosystemUI />}
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
