import { useEffect } from 'react';
import { Archive } from './routes/Archive';
import { CreatureRecordPage } from './routes/CreatureRecord';
import { Field } from './routes/Field';
import { Habitat } from './routes/Habitat';
import { Landing } from './routes/Landing';
import { SiteNavigation } from './components/navigation/SiteNavigation';
import { useSiteRoute } from './state/useSiteRoute';

export default function App() {
  const { route } = useSiteRoute();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);

  return (
    <div className={`site-shell site-shell--${route.name}`}>
      <SiteNavigation route={route} />
      {route.name === 'landing' && <Landing />}
      {route.name === 'field' && <Field />}
      {route.name === 'habitat' && <Habitat id={route.id} />}
      {route.name === 'archive' && <Archive />}
      {route.name === 'creature' && <CreatureRecordPage id={route.id} />}
    </div>
  );
}
