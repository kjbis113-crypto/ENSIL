import { useCallback, useEffect, useMemo } from 'react';
import { loadCreatures } from '../data/loadCreatures';
import { useViewState } from '../state/useViewState';
import { useLink } from '../state/useLink';
import { useInput } from '../input/useInput';
import { COPY } from '../copy';
import { SystemBar } from '../components/shell/SystemBar';
import { ModeBar } from '../components/shell/ModeBar';
import { AboutOverlay } from '../components/shell/AboutOverlay';
import { IndexStrip } from '../components/index/IndexStrip';
import { LogoCloud } from '../components/logo/LogoCloud';
import { SpecimenView } from '../components/specimen/SpecimenView';
import { SimView } from '../components/simulation/SimView';
import { GalleryView } from '../components/gallery/GalleryView';

/** 메인 — 시스템바 / 목차 / 대형 뷰 / 모드바 (plan.md §4-1). 페이지 이동 없는 단일 화면.
 *  #/gallery는 전시 대기(메인) 화면 — 두 모니터 운용 시 모니터 1에 이 라우트를 띄운다. */
export function Main() {
  const creatures = useMemo(loadCreatures, []);
  const view = useViewState(creatures);

  // 아카이브 창 역할: 갤러리 창이 보낸 개체 선택을 따라간다 (갤러리 라우트에서는 비활성)
  useLink(
    'archive',
    useCallback((id: string) => view.select(id), [view.select]),
    !view.gallery,
  );

  // 전시 옵션 ?idle=N — N초 무입력 시 메인(갤러리) 화면 복귀 (모니터 1대 운용의 보험)
  useEffect(() => {
    if (!view.idle || view.gallery) return;
    let timer = 0;
    const reset = () => {
      clearTimeout(timer);
      timer = window.setTimeout(view.toGallery, view.idle! * 1000);
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [view.idle, view.gallery, view.toGallery]);

  // 물리 입력 (plan.md §7) — 슬롯 선택·틸트가 여기로 들어온다
  const input = useInput({
    onSelectSlot: (slot) => {
      const c = creatures.find((x) => x.physical?.slot === slot);
      if (c) view.select(c.id);
    },
    onStep: view.step,
    onRelease: () => view.select(null),
  });

  if (view.gallery) {
    return (
      <div className="app app-gallery">
        <SystemBar physicalConnected={input.connected} />
        <main className="gallery-wrap">
          <GalleryView creatures={creatures} onPick={view.select} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <SystemBar physicalConnected={input.connected} />
      <IndexStrip creatures={creatures} selectedId={view.selectedId} onSelect={view.select} />
      <main className="bigview">
        {view.mode !== 'sim' && <LogoCloud />}
        {view.mode === 'sim' ? (
          <SimView creatures={creatures} view={view} tiltRef={input.tiltRef} />
        ) : view.selected ? (
          <SpecimenView key={view.selected.id} creature={view.selected} />
        ) : (
          <div className="overview">
            <h2>{COPY.overviewTitle}</h2>
            <p>{COPY.overviewHint}</p>
          </div>
        )}
      </main>
      <ModeBar view={view} total={creatures.length} />
      {view.aboutOpen && <AboutOverlay onClose={() => view.setAbout(false)} />}
    </div>
  );
}
