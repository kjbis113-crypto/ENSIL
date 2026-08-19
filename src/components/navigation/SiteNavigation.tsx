import type { SiteRoute } from '../../state/useSiteRoute';

export function SiteNavigation({ route }: { route: SiteRoute }) {
  return (
    <header className="site-navigation">
      <a className="site-navigation__brand" href="#/" aria-label="ENSIL home">
        <img src="/brand/ensil-figma-mark.svg" alt="" width="20" height="22" />
      </a>
      <nav aria-label="Primary">
        <a href="#/" aria-current={route.name === 'landing' ? 'page' : undefined}>INDEX</a>
        <a href="#/field" aria-current={route.name === 'field' || route.name === 'habitat' ? 'page' : undefined}>FIELD</a>
        <a href="#/archive" aria-current={route.name === 'archive' || route.name === 'creature' ? 'page' : undefined}>ARCHIVE</a>
      </nav>
      <div className="site-navigation__status">
        <span>Archives For Electro-Fermentation</span>
      </div>
    </header>
  );
}
