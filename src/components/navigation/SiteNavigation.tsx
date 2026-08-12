import type { SiteRoute } from '../../state/useSiteRoute';

export function SiteNavigation({ route }: { route: SiteRoute }) {
  return (
    <header className="site-navigation">
      <a className="site-navigation__brand" href="#/" aria-label="ENSIL home">
        ENSIL<sup>®</sup>
      </a>
      <nav aria-label="Primary">
        <a href="#/" aria-current={route.name === 'landing' ? 'page' : undefined}>INDEX</a>
        <a href="#/field" aria-current={route.name === 'field' || route.name === 'habitat' ? 'page' : undefined}>FIELD</a>
        <a href="#/archive" aria-current={route.name === 'archive' || route.name === 'creature' ? 'page' : undefined}>ARCHIVE</a>
      </nav>
      <div className="site-navigation__status">
        <i aria-hidden />
        <span>SEOUL</span>
        <time>{new Date().getFullYear()}</time>
      </div>
    </header>
  );
}
