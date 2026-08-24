import { useCallback, useEffect, useState } from 'react';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import { SpecimenGlyph } from '../archive/SpecimenGlyph';
import { useFieldLink } from '../../state/useFieldLink';
import { PortraitViewer } from './PortraitViewer';

/**
 * 아카이브 캐러셀 — 전시 컴퓨터(패널) 화면. 뎁스 없는 단일 화면.
 * 중앙 원 = 살아있는 개체 포트레이트(3D), 좌우 원 = 이전/다음 개체가 가장자리에 걸쳐 있다.
 * 하단 라디얼 다이얼(엄지 존)로 개체 전환, SEND CHARGE로 프로젝터의 필드에 전하를 던진다.
 * 모든 전환은 스프링 이징(--spring) 하나로 통일 — 쫀득함의 단일 기준.
 */

const N = CREATURE_RECORDS.length;
const wrap = (i: number) => ((i % N) + N) % N;

/** 다이얼 점 배치 — 부채꼴 각도(도) */
const DOT_ANGLES = [-51, -17, 17, 51];

export function CreatureCarousel() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [chargeFlash, setChargeFlash] = useState(0);
  const { peerAlive, sendCharge } = useFieldLink('panel');

  const record = CREATURE_RECORDS[index];
  const prev = CREATURE_RECORDS[wrap(index - 1)];
  const next = CREATURE_RECORDS[wrap(index + 1)];

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

  const throwCharge = () => {
    sendCharge(record.id);
    setChargeFlash((v) => v + 1);
  };

  return (
    <main className={`carousel-page${open ? ' is-open' : ''}`}>
      {/* 배경 — 페이퍼 톤 + 은은한 라임 글로우 */}
      <div className="cr-bg" aria-hidden />

      <p className="cr-caption">LIVING RECORDS / {String(index + 1).padStart(2, '0')} — {String(N).padStart(2, '0')}</p>

      {/* 좌우 원 — 이전/다음 개체 */}
      <button type="button" className="cr-circle cr-circle--side cr-circle--prev" onClick={() => step(-1)} aria-label={`Previous: ${prev.name}`}>
        <SpecimenGlyph key={prev.id} index={prev.glyphIndex} palette={prev.palette} />
      </button>
      <button type="button" className="cr-circle cr-circle--side cr-circle--next" onClick={() => step(1)} aria-label={`Next: ${next.name}`}>
        <SpecimenGlyph key={next.id} index={next.glyphIndex} palette={next.palette} />
      </button>

      {/* 중앙 원 — 살아있는 포트레이트 */}
      <div className="cr-circle cr-circle--main" key={`pulse-${record.id}`}>
        <PortraitViewer modelUrl={record.modelUrl} />
        <button type="button" className="cr-pill cr-pill--explore" onClick={() => setOpen((v) => !v)}>
          <i /> {open ? 'CLOSE' : 'EXPLORE'}
        </button>
      </div>

      {/* 개체 이름 — 전환 시 슬라이드 */}
      <header className="cr-name" key={`name-${record.id}`}>
        <span>{record.code} / {record.sensor.toUpperCase()}</span>
        <h1>{record.name}</h1>
      </header>

      {/* 상세 시트 — 같은 화면 안에서 모핑 (뎁스 0) */}
      <aside className={`cr-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <dl>
          <div><dt>SENSES</dt><dd>{record.input}</dd></div>
          <div><dt>RESPONDS</dt><dd>{record.response}</dd></div>
          <div><dt>HABITAT</dt><dd>{record.ecology.habitat}</dd></div>
          <div><dt>METABOLISM</dt><dd>{record.ecology.metabolism}</dd></div>
        </dl>
        <div className="cr-sheet__actions">
          <a className="cr-pill" href={`#/habitat/${record.id}`}>ENTER HABITAT →</a>
          <a className="cr-pill" href={`#/creature/${record.id}`}>FULL RECORD ↗</a>
        </div>
      </aside>

      {/* 하단 라디얼 다이얼 — 엄지 존 */}
      <nav className="cr-dial" aria-label="Select creature">
        <div className="cr-dial__thumb" aria-hidden />
        {CREATURE_RECORDS.map((r, i) => (
          <button
            type="button"
            key={r.id}
            className={`cr-dot${i === index ? ' is-active' : ''}`}
            style={{ '--angle': `${DOT_ANGLES[i] ?? 0}deg` } as React.CSSProperties}
            onClick={() => { setIndex(i); setOpen(false); }}
            aria-label={r.name}
            aria-pressed={i === index}
          >
            <i />
          </button>
        ))}
        <button type="button" className="cr-pill cr-pill--charge" key={`charge-${chargeFlash}`} onClick={throwCharge}>
          ⚡ SEND CHARGE
        </button>
        <span className={`cr-link-status${peerAlive ? ' is-live' : ''}`}>
          <i /> {peerAlive ? 'STAGE LINKED' : 'STAGE OFFLINE'}
        </span>
      </nav>
    </main>
  );
}
