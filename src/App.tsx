import { lazy, Suspense, useEffect } from 'react';
import { SiteNavigation } from './components/navigation/SiteNavigation';
import { useSiteRoute } from './state/useSiteRoute';

const Landing = lazy(() => import('./routes/Landing').then((module) => ({ default: module.Landing })));
const Field = lazy(() => import('./routes/Field').then((module) => ({ default: module.Field })));
const Habitat = lazy(() => import('./routes/Habitat').then((module) => ({ default: module.Habitat })));
const Archive = lazy(() => import('./routes/Archive').then((module) => ({ default: module.Archive })));
const CreatureRecordPage = lazy(() => import('./routes/CreatureRecord').then((module) => ({ default: module.CreatureRecordPage })));

export default function App() {
  const { route } = useSiteRoute();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);

  return (
    <div className={`site-shell site-shell--${route.name}`}>
      <SiteNavigation route={route} />
      <Suspense fallback={<div className="route-loading">ENSIL / LOADING MODULE</div>}>
        {route.name === 'landing' && <Landing />}
        {route.name === 'field' && <Field />}
        {route.name === 'habitat' && <Habitat id={route.id} />}
        {route.name === 'archive' && <Archive />}
        {route.name === 'creature' && <CreatureRecordPage id={route.id} />}
      </Suspense>
    </div>
  );
}
