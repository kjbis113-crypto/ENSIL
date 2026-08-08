import type { World } from '../../sim/types';
import { SIM_STATE_NAME } from '../../copy';

export interface OverlayFlags {
  trails: boolean;
  labels: boolean;
  nodes: boolean;
  grid: boolean;
}

/**
 * DOM 렌더러 — world를 받아 그리기만 한다 (plan.md §8-1).
 * 개체가 많아지면 이 파일만 CanvasRenderer로 교체한다.
 * 월드 좌표 0~100(%) → CSS %로 그대로 사상.
 */
export function DomRenderer({
  world,
  selectedId,
  overlays,
  onSelect,
}: {
  world: World;
  selectedId: string | null;
  overlays: OverlayFlags;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={`sim-stage ${overlays.grid ? 'grid-on' : ''}`}>
      {overlays.trails && (
        <svg className="trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {world.organisms.map((o) =>
            o.trail.length > 1 ? (
              <polyline
                key={o.id}
                points={o.trail.map((p) => `${p.x},${p.y}`).join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )}
        </svg>
      )}

      {overlays.nodes &&
        world.nodes.map((n) => (
          <span
            key={n.id}
            className="energy-node"
            style={{ left: `${n.pos.x}%`, top: `${n.pos.y}%` }}
          >
            ⊙
          </span>
        ))}

      {world.organisms.map((o) => {
        const size = 14 + o.traits.charge * 2.5;
        return (
          <button
            key={o.id}
            className={[
              'organism',
              o.id === selectedId ? 'selected' : '',
              selectedId && o.id !== selectedId ? 'dimmed' : '',
            ].join(' ')}
            style={{ left: `${o.pos.x}%`, top: `${o.pos.y}%` }}
            onClick={() => onSelect(o.id)}
          >
            <span className={`body-shape ${o.shape}`} style={{ width: size, height: size }} />
            {overlays.labels && (
              <span className="tag">
                {o.code} · {SIM_STATE_NAME[o.state]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
