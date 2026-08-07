import type { Creature } from '../../types/creature';
import type { ViewState } from '../../state/useViewState';
import { COPY, SIM_STATE_NAME } from '../../copy';
import { TraitGauge } from '../specimen/TraitGauge';

/**
 * 시뮬레이션 모드 레이아웃 와이어프레임 (plan.md §4-4).
 * 엔진(M6)은 미구현 — 개체는 id 해시 기반 고정 좌표에 정적 배치.
 * 이 컴포넌트는 나중에 SimStage(엔진 루프)로 교체되고 골격은 유지된다.
 */

// 결정적 의사난수 배치 (엔진 전까지의 자리 표시)
const ORG_POS = (i: number) => ({
  x: 10 + ((i * 37 + 13) % 78),
  y: 12 + ((i * 53 + 29) % 68),
});
const NODE_POS = [
  { x: 30, y: 35 },
  { x: 62, y: 58 },
  { x: 18, y: 72 },
];
const DUMMY_STATE = ['seek', 'rest', 'idle', 'consume', 'interact'];

export function SimView({ creatures, view }: { creatures: Creature[]; view: ViewState }) {
  const sel = view.selected;
  return (
    <div className="sim">
      <div className="sim-stage-col">
        <div className="sim-stage">
          {NODE_POS.map((p, i) => (
            <span key={i} className="energy-node" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              ⊙
            </span>
          ))}
          {creatures.map((c, i) => {
            const p = ORG_POS(i);
            const size = 14 + c.traits.charge * 2.5;
            return (
              <button
                key={c.id}
                className={[
                  'organism',
                  c.id === view.selectedId ? 'selected' : '',
                  view.selectedId && c.id !== view.selectedId ? 'dimmed' : '',
                ].join(' ')}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onClick={() => view.select(c.id)}
              >
                <span
                  className={`body-shape ${c.visual.shape}`}
                  style={{ width: size, height: size }}
                />
                <span className="tag">
                  {c.code} · {SIM_STATE_NAME[DUMMY_STATE[i % DUMMY_STATE.length]]}
                </span>
              </button>
            );
          })}
          <span className="sim-note">{COPY.simEngineNote}</span>
        </div>

        {/* 트랜스포트 바 — 엔진 전까지 비활성 */}
        <div className="transport">
          <button disabled>▶</button>
          <button disabled>↺</button>
          <span>
            속도 <button disabled>×0.5</button> <button className="active" disabled>×1</button>{' '}
            <button disabled>×2</button> <button disabled>×4</button>
          </span>
          <span>t = 00:00:00</span>
          <span>
            {COPY.simCount} {creatures.length}
          </span>
          <span className="spacer" />
          <label><input type="checkbox" defaultChecked disabled /> 궤적</label>
          <label><input type="checkbox" defaultChecked disabled /> 상태라벨</label>
          <label><input type="checkbox" disabled /> 노드</label>
          <label><input type="checkbox" disabled /> 그리드</label>
        </div>
      </div>

      {/* 관찰 패널 */}
      <aside className="observer">
        {sel ? (
          <>
            <div className="thumb-lg">▨</div>
            <div>
              <div className="panel-title">
                <span className="code">{sel.code}</span>
                <div className="name">{sel.name}</div>
              </div>
            </div>
            <dl className="kv">
              <dt>{COPY.simStatePrefix}</dt>
              <dd>{SIM_STATE_NAME.seek}</dd>
            </dl>
            <div>
              <TraitGauge label={COPY.traitCharge} value={sel.traits.charge} />
              <TraitGauge label={COPY.traitStimulus} value={sel.traits.stimulus} />
              <TraitGauge label={COPY.traitBond} value={sel.traits.bond} />
            </div>
            <dl className="kv">
              <dt>{COPY.simPurposePrefix}</dt>
              <dd>“{sel.purpose.statement}”</dd>
            </dl>
            <button className="goto" onClick={() => view.setMode('specimen')}>
              {COPY.simGotoSpecimen}
            </button>
          </>
        ) : (
          <p className="empty">{COPY.overviewHint}</p>
        )}
      </aside>
    </div>
  );
}
