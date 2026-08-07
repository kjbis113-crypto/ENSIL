import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Creature } from '../types/creature';

export type ViewMode = 'specimen' | 'sim';

export interface ViewState {
  selectedId: string | null;
  selected: Creature | null;
  selectedIndex: number; // -1 = 미선택
  mode: ViewMode;
  aboutOpen: boolean;
  select: (id: string | null) => void;
  step: (dir: 1 | -1) => void;
  setMode: (mode: ViewMode) => void;
  setAbout: (open: boolean) => void;
}

/**
 * 화면 전체의 단일 상태 (plan.md §5).
 * 목차 클릭 / 시뮬 클릭 / 키보드(=물리 입력 목업) / URL — 모든 입구가 여기로 들어온다.
 * URL이 곧 상태: /c/:id, ?mode=sim, ?about=1
 */
export function useViewState(creatures: Creature[]): ViewState {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const mode: ViewMode = search.get('mode') === 'sim' ? 'sim' : 'specimen';
  const aboutOpen = search.get('about') === '1';

  const selectedIndex = useMemo(
    () => creatures.findIndex((c) => c.id === id),
    [creatures, id],
  );
  const selected = selectedIndex >= 0 ? creatures[selectedIndex] : null;

  const buildUrl = useCallback(
    (nextId: string | null, nextMode: ViewMode, nextAbout: boolean) => {
      const params = new URLSearchParams();
      if (nextMode === 'sim') params.set('mode', 'sim');
      if (nextAbout) params.set('about', '1');
      const qs = params.toString();
      return (nextId ? `/c/${nextId}` : '/') + (qs ? `?${qs}` : '');
    },
    [],
  );

  const select = useCallback(
    (nextId: string | null) => navigate(buildUrl(nextId, mode, false)),
    [navigate, buildUrl, mode],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (creatures.length === 0) return;
      const next =
        selectedIndex < 0
          ? dir === 1 ? 0 : creatures.length - 1
          : (selectedIndex + dir + creatures.length) % creatures.length;
      select(creatures[next].id);
    },
    [creatures, selectedIndex, select],
  );

  const setMode = useCallback(
    (nextMode: ViewMode) => navigate(buildUrl(selected?.id ?? null, nextMode, false)),
    [navigate, buildUrl, selected],
  );

  const setAbout = useCallback(
    (open: boolean) => navigate(buildUrl(selected?.id ?? null, mode, open)),
    [navigate, buildUrl, selected, mode],
  );

  // 키보드 = MockInput (plan.md §7-3). 하드웨어가 없어도 전 인터랙션 재현 + 현장 비상 조작.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Escape') {
        if (aboutOpen) setAbout(false);
        else select(null);
      } else if (/^[1-9]$/.test(e.key)) {
        const c = creatures[Number(e.key) - 1];
        if (c) select(c.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, select, setAbout, aboutOpen, creatures]);

  return { selectedId: selected?.id ?? null, selected, selectedIndex, mode, aboutOpen, select, step, setMode, setAbout };
}
