import type { SiteRoute } from '../../state/useSiteRoute';

type Section = 'index' | 'field' | 'archive';

function sectionOf(route: SiteRoute): Section {
  if (route.name === 'field' || route.name === 'habitat') return 'field';
  if (route.name === 'archive' || route.name === 'creature') return 'archive';
  return 'index';
}

/**
 * 사이트 공통 크롬 — 랜딩(index-dial)의 좌상단 워드마크 + 우상단 밑줄 링크 구성을
 * 다른 모든 화면에 그대로 옮긴 것. 바(bar)·테두리·블러 없이 화면 위에 떠 있고,
 * 색은 페이지가 --chrome-ink 로 정한다 (밝은 화면=딥틸, 어두운 화면=흰색).
 * 랜딩은 IndexVideoCarousel 자체 아이덴티티/유틸리티를 쓰므로 여기서는 렌더하지 않는다.
 */
export function SiteChrome({ route }: { route: SiteRoute }) {
  const current = sectionOf(route);
  const link = (section: Section, href: string, label: string) => (
    <a href={href} aria-current={current === section ? 'page' : undefined}>{label}</a>
  );

  return (
    <header className="site-chrome">
      <a className="site-chrome__brand" href="#/" aria-label="ENSIL index">
        <strong>ENSIL</strong>
      </a>
      <nav className="site-chrome__utility" aria-label="Primary">
        {link('index', '#/', 'INDEX')}
        {link('field', '#/field', 'FIELD')}
        {link('archive', '#/archive', 'ARCHIVE')}
      </nav>
    </header>
  );
}
