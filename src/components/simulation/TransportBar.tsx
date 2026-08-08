import { COPY } from '../../copy';

export interface OverlayFlags {
  trails: boolean;
  labels: boolean;
  nodes: boolean;
  grid: boolean;
}

export type SimSpeed = 0.5 | 1 | 2 | 4;
const SPEEDS: SimSpeed[] = [0.5, 1, 2, 4];

function fmtTime(t: number) {
  const p = (n: number) => String(n).padStart(2, '0');
  const s = Math.floor(t);
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function TransportBar({
  running,
  speed,
  t,
  count,
  overlays,
  onToggleRun,
  onReset,
  onSpeed,
  onOverlay,
}: {
  running: boolean;
  speed: SimSpeed;
  t: number;
  count: number;
  overlays: OverlayFlags;
  onToggleRun: () => void;
  onReset: () => void;
  onSpeed: (s: SimSpeed) => void;
  onOverlay: (key: keyof OverlayFlags) => void;
}) {
  return (
    <div className="transport">
      <button onClick={onToggleRun}>{running ? '❚❚' : '▶'}</button>
      <button onClick={onReset}>↺</button>
      <span>
        속도{' '}
        {SPEEDS.map((s) => (
          <button key={s} className={s === speed ? 'active' : ''} onClick={() => onSpeed(s)}>
            ×{s}
          </button>
        ))}
      </span>
      <span>t = {fmtTime(t)}</span>
      <span>
        {COPY.simCount} {count}
      </span>
      <span className="spacer" />
      {(
        [
          ['trails', '궤적'],
          ['labels', '상태라벨'],
          ['nodes', '노드'],
          ['grid', '그리드'],
        ] as [keyof OverlayFlags, string][]
      ).map(([key, label]) => (
        <label key={key}>
          <input type="checkbox" checked={overlays[key]} onChange={() => onOverlay(key)} />
          {label}
        </label>
      ))}
    </div>
  );
}
