import { useCallback, useEffect, useRef, useState } from 'react';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import { SpecimenGlyph } from '../archive/SpecimenGlyph';
import { useFieldLink } from '../../state/useFieldLink';
import { PortraitViewer } from './PortraitViewer';

/**
 * 아카이브 캐러셀 — 전시 컴퓨터(패널) 화면. 뎁스 없는 단일 화면.
 *
 * 개체 원들은 화면 아래(뷰포트 밖)에 중심을 둔 큰 궤도(--ring-r) 위에 실제로 배치되고,
 * 다이얼을 돌리듯 궤도째 회전한다 — 하단 원판을 좌우로 드래그하거나, 옆 원을 클릭하거나,
 * ←/→ 키로 돌린다. 12시 방향(활성 슬롯) 위에는 고정 3D 포트레이트가 겹쳐진다.
 *
 * 타이포는 스위스 조판: 플러시레프트 정보 칼럼(좌), 일관된 페이지 마진(--page-m),
 * 명확한 크기 위계. 모든 전환은 --spring 하나로 통일.
 */

const N = CREATURE_RECORDS.length;
const STEP = 51; // 궤도 위 개체 간 각도(도)
const wrap = (i: number) => ((i % N) + N) % N;
/** index 기준 부호 있는 궤도 거리: -1(왼쪽), 0(활성), 1(오른쪽), 2(반대편) */
const signedDist = (i: number, index: number) => ((i - index + N + 1) % N) - 1;

export function CreatureCarousel() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(0); // 드래그 중 임시 회전(도)
  const [dragging, setDragging] = useState(false);
  const [chargeFlash, setChargeFlash] = useState(0);
  const { peerAlive, sendCharge } = useFieldLink('panel');
  const dragStart = useRef({ x: 0, moved: false });

  const record = CREATURE_RECORDS[index];

  const step = useCallback((dir: 1 | -1) => {
    setIndex((i) => wrap(i + dir));
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'Enter') setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // ── 다이얼 드래그 — 원판을 돌리면 궤도가 따라 돈다, 놓으면 가까운 슬롯에 스냅 ──
  const onDialDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, moved: false };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDialMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 4) dragStart.current.moved = true;
    setDrag(dx * 0.14);
  };
  const onDialUp = () => {
    if (!dragging) return;
    setDragging(false);
    const steps = Math.round(-drag / STEP);
    if (steps !== 0) {
      setIndex((i) => wrap(i + steps));
      setOpen(false);
    }
    setDrag(0);
  };

  const throwCharge = () => {
    sendCharge(record.id);
    setChargeFlash((v) => v + 1);
  };

  return (
    <main className={`carousel-page${open ? ' is-open' : ''}${dragging ? ' is-dragging' : ''}`}>
      <div className="cr-bg" aria-hidden />

      {/* 좌측 정보 칼럼 — 스위스 플러시레프트 */}
      <header className="cr-info" key={`info-${record.id}`}>
        <p className="cr-info__kicker">LIVING RECORDS</p>
        <p className="cr-info__index">{String(index + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</p>
        <h1>{record.name}</h1>
        <ul>
          <li><span>Code</span>{record.code}</li>
          <li><span>Sensor</span>{record.sensor}</li>
          <li><span>Responds</span>{record.response}</li>
        </ul>
      </header>

      {/* 궤도 위의 개체 원들 — 다이얼과 함께 회전 */}
      {CREATURE_RECORDS.map((r, i) => {
        const d = signedDist(i, index);
        const angle = d * STEP + drag;
        const active = d === 0 && Math.abs(drag) < STEP / 2;
        return (
          <button
            type="button"
            key={r.id}
            className={`cr-orb${active ? ' is-active' : ''}`}
            style={{ '--a': `${angle}deg` } as React.CSSProperties}
            onClick={() => {
              if (dragStart.current.moved) return; // 드래그 직후 클릭 무시
              if (d !== 0) { setIndex(i); setOpen(false); }
            }}
            aria-label={r.name}
            aria-pressed={active}
            tabIndex={d === 0 ? -1 : 0}
          >
            <SpecimenGlyph index={r.glyphIndex} palette={r.palette} />
          </button>
        );
      })}

      {/* 활성 슬롯 위 고정 포트레이트 */}
      <div className="cr-stage" key={`stage-pulse-${record.id}`}>
        <PortraitViewer modelUrl={record.modelUrl} />
        <button type="button" className="cr-pill cr-pill--explore" onClick={() => setOpen((v) => !v)}>
          <i /> {open ? 'Close' : 'Explore'}
        </button>
      </div>

      {/* 상세 시트 — 뎁스 0 모핑 */}
      <aside className={`cr-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <dl>
          <div><dt>Senses</dt><dd>{record.input}</dd></div>
          <div><dt>Responds</dt><dd>{record.response}</dd></div>
          <div><dt>Habitat</dt><dd>{record.ecology.habitat}</dd></div>
          <div><dt>Metabolism</dt><dd>{record.ecology.metabolism}</dd></div>
        </dl>
        <div className="cr-sheet__actions">
          <a className="cr-pill" href={`#/habitat/${record.id}`}>Enter habitat →</a>
          <a className="cr-pill" href={`#/creature/${record.id}`}>Full record ↗</a>
        </div>
      </aside>

      {/* 하단 다이얼 원판 — 드래그로 돌린다 */}
      <div
        className="cr-dial-zone"
        onPointerDown={onDialDown}
        onPointerMove={onDialMove}
        onPointerUp={onDialUp}
        onPointerCancel={onDialUp}
        role="slider"
        aria-label="Rotate dial to browse creatures"
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={index + 1}
      >
        <div
          className="cr-dial__plate"
          style={{ '--rot': `${-index * STEP + drag}deg` } as React.CSSProperties}
          aria-hidden
        >
          <i className="cr-dial__notch" />
        </div>
      </div>

      <div className="cr-actions">
        <button type="button" className="cr-pill cr-pill--charge" key={`charge-${chargeFlash}`} onClick={throwCharge}>
          ⚡ Send charge
        </button>
        <span className={`cr-link-status${peerAlive ? ' is-live' : ''}`}>
          <i /> {peerAlive ? 'Stage linked' : 'Stage offline'}
        </span>
      </div>
    </main>
  );
}
