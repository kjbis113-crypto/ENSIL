import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent } from 'react';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import { SpecimenGlyph } from './SpecimenGlyph';

type Props = {
  activeIndex: number;
  onChange: (index: number) => void;
  variant?: 'index' | 'stage';
  interactive?: boolean;
  center?: ReactNode;
  className?: string;
};

type DragState = {
  startX: number;
  lastX: number;
  lastTime: number;
  velocity: number;
};

const STEP = 360 / CREATURE_RECORDS.length;

export function CircularArchiveCarousel({
  activeIndex,
  onChange,
  variant = 'index',
  interactive = true,
  center,
  className = '',
}: Props) {
  const [dragAngle, setDragAngle] = useState(0);
  const dragRef = useRef<DragState | null>(null);
  const wheelAtRef = useRef(0);
  const active = CREATURE_RECORDS[activeIndex];

  const selectRelative = (delta: number) => {
    onChange((activeIndex + delta + CREATURE_RECORDS.length) % CREATURE_RECORDS.length);
    setDragAngle(0);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || event.button !== 0) return;
    dragRef.current = {
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const now = performance.now();
    const dx = event.clientX - drag.lastX;
    const dt = Math.max(now - drag.lastTime, 8);
    drag.velocity = dx / dt;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    setDragAngle((event.clientX - drag.startX) * 0.32);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const displacement = event.clientX - drag.startX;
    const projected = displacement * 0.32 + drag.velocity * 92;
    dragRef.current = null;
    if (Math.abs(projected) > 22) {
      const steps = Math.max(-2, Math.min(2, Math.round(-projected / STEP) || (projected > 0 ? -1 : 1)));
      selectRelative(steps);
    } else {
      setDragAngle(0);
    }
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const now = performance.now();
    if (now - wheelAtRef.current < 420) return;
    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 8) return;
    wheelAtRef.current = now;
    selectRelative(delta > 0 ? 1 : -1);
  };

  const style = {
    '--carousel-rotation': `${-activeIndex * STEP + dragAngle}deg`,
  } as CSSProperties;

  return (
    <section
      className={`circular-archive circular-archive--${variant}${interactive ? ' is-interactive' : ''} ${className}`.trim()}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); selectRelative(1); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); selectRelative(-1); }
      }}
      aria-label="Circular archive specimen selector"
    >
      <div className="circular-archive__orbit" role="tablist" aria-label="ENSIL electronic organisms">
        <i className="circular-archive__ring circular-archive__ring--outer" aria-hidden />
        <i className="circular-archive__ring circular-archive__ring--inner" aria-hidden />
        <div className="circular-archive__nodes">
          {CREATURE_RECORDS.map((record, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls="ensil-active-specimen"
              className={index === activeIndex ? 'is-active' : ''}
              style={{ '--node-angle': `${index * STEP}deg` } as CSSProperties}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => { onChange(index); setDragAngle(0); }}
              key={record.id}
            >
              {variant === 'index' ? (
                <SpecimenGlyph index={record.glyphIndex} live palette={record.palette} label={`Select ${record.name}`} code={record.code} />
              ) : (
                <span>{record.code.replace('NO.', '')}</span>
              )}
              <small>{record.code}</small>
            </button>
          ))}
        </div>
        <div className="circular-archive__center" id="ensil-active-specimen">
          {center ?? (
            <div className="circular-archive__identity" key={active.id}>
              <span>{active.code} / ACTIVE SPECIMEN</span>
              <strong>{active.name}</strong>
              <p>{active.sensor}<br />{active.input}</p>
            </div>
          )}
        </div>
      </div>

      <div className="circular-archive__status" aria-live="polite">
        <span>{active.code}</span>
        <strong>{active.name}</strong>
        <span>{active.sensor}</span>
      </div>

      <nav className="circular-archive__controls" aria-label="Previous or next organism">
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => selectRelative(-1)} aria-label="Previous organism">←</button>
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(CREATURE_RECORDS.length).padStart(2, '0')}</span>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => selectRelative(1)} aria-label="Next organism">→</button>
      </nav>
    </section>
  );
}
