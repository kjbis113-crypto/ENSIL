import { useCallback, useEffect, useState } from 'react';

/**
 * 자체 해시 라우팅 — react-router-dom 대체.
 * (rollup이 react-router 포함 시 빌드 단계에서 네이티브 크래시 — debug.md #1 참조.
 *  라우트가 사실상 상태의 주소뿐이라 훅 하나로 충분하다. plan.md §3)
 *
 * URL 스킴: #/c/:id?mode=sim&about=1
 */

export type ViewMode = 'specimen' | 'sim';

export interface HashState {
  id: string | null;
  mode: ViewMode;
  about: boolean;
}

function parse(): HashState {
  const hash = window.location.hash.replace(/^#/, '');
  const [path, qs] = hash.split('?');
  const m = /^\/c\/([^/?]+)/.exec(path ?? '');
  const params = new URLSearchParams(qs ?? '');
  return {
    id: m?.[1] ?? null,
    mode: params.get('mode') === 'sim' ? 'sim' : 'specimen',
    about: params.get('about') === '1',
  };
}

export function buildHash(id: string | null, mode: ViewMode, about: boolean): string {
  const params = new URLSearchParams();
  if (mode === 'sim') params.set('mode', 'sim');
  if (about) params.set('about', '1');
  const qs = params.toString();
  return `#${id ? `/c/${id}` : '/'}${qs ? `?${qs}` : ''}`;
}

export function useHashRoute() {
  const [state, setState] = useState<HashState>(parse);

  useEffect(() => {
    const onChange = () => setState(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((id: string | null, mode: ViewMode, about: boolean) => {
    window.location.hash = buildHash(id, mode, about);
    // hashchange 이벤트가 setState를 호출한다
  }, []);

  return { ...state, navigate };
}
