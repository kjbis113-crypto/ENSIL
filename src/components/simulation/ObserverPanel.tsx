import type { Creature } from '../../types/creature';
import type { Organism } from '../../sim/types';
import { COPY, SIM_STATE_NAME } from '../../copy';
import { TraitGauge } from '../specimen/TraitGauge';

/** 우측 관찰 패널 — 선택 개체의 라이브 니즈를 보여준다 */
export function ObserverPanel({
  creature,
  organism,
  onGotoSpecimen,
}: {
  creature: Creature | null;
  organism: Organism | null;
  onGotoSpecimen: () => void;
}) {
  if (!creature || !organism) {
    return (
      <aside className="observer">
        <p className="empty">{COPY.overviewHint}</p>
      </aside>
    );
  }

  const n = organism.needs;
  return (
    <aside className="observer">
      <div className="thumb-lg">▨</div>
      <div className="panel-title">
        <span className="code">{creature.code}</span>
        <div className="name">{creature.name}</div>
      </div>
      <dl className="kv">
        <dt>{COPY.simStatePrefix}</dt>
        <dd>{SIM_STATE_NAME[organism.state]}</dd>
      </dl>
      <div>
        {/* 라이브 니즈 (0~1 → 10칸 게이지) */}
        <TraitGauge label={COPY.needEnergy} value={Math.round(n.energy * 10)} />
        <TraitGauge label={COPY.needArousal} value={Math.round(n.arousal * 10)} />
        <TraitGauge label={COPY.needBonding} value={Math.round(n.bonding * 10)} />
      </div>
      <dl className="kv">
        <dt>{COPY.simPurposePrefix}</dt>
        <dd>“{creature.purpose.statement}”</dd>
      </dl>
      <button className="goto" onClick={onGotoSpecimen}>
        {COPY.simGotoSpecimen}
      </button>
    </aside>
  );
}
