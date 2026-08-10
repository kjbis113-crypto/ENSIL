"use client";

import { getSpecies } from "../data/species";
import { useEcosystem } from "../store/ecosystem";

export function SpecimenPanel() {
  const selected = useEcosystem((state) => state.selectedSpecies);
  const setSelected = useEcosystem((state) => state.setSelectedSpecies);
  const agent = useEcosystem((state) => (selected ? state.agents[selected] : null));
  if (!selected || !agent) return null;
  const species = getSpecies(selected);

  return (
    <aside className="specimen-panel" aria-label={`${species.name} specimen information`}>
      <div className="panel-topline">
        <span>{species.index} / live telemetry</span>
        <button onClick={() => setSelected(null)} aria-label="Close specimen panel">×</button>
      </div>
      <p className="latin">{species.latin}</p>
      <h2>{species.name}</h2>
      <div className="behavior-badge"><i style={{ background: species.accent }} />{agent.state}</div>
      <div className="telemetry">
        <div><span>Age</span><strong>{Math.floor(agent.age / 60)}m {Math.floor(agent.age % 60)}s</strong></div>
        <div><span>Energy</span><strong>{Math.round(agent.energy)}%</strong><b><i style={{ width: `${agent.energy}%`, background: species.accent }} /></b></div>
        <div><span>Health</span><strong>{Math.round(agent.health)}%</strong><b><i style={{ width: `${agent.health}%` }} /></b></div>
        <div><span>Curiosity</span><strong>{Math.round(agent.curiosity)}%</strong><b><i style={{ width: `${agent.curiosity}%` }} /></b></div>
        <div><span>Current target</span><strong>{agent.target}</strong></div>
      </div>
      <div className="absorbed">
        <span>Absorbed components</span>
        <ul>{agent.absorbed.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
      </div>
      <p className="panel-note"><span>Research note</span>{species.note}</p>
    </aside>
  );
}
