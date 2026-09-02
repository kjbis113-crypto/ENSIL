import { useEffect, useRef, useState } from 'react';
import type { CreatureRecord } from '../../data/creatureRecords';
import { HabitatWorld } from '../habitat-engine/HabitatWorld';

export function HabitatScene({ record }: { record: CreatureRecord }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    setLoading(true);
    const world = new HabitatWorld({
      mount,
      records: [record],
      mode: 'single',
      selectedId: record.id,
      onLoaded: (loaded, total) => setLoading(loaded < total),
      onSelect: () => undefined,
      onEnter: () => undefined,
    });
    return () => world.dispose();
  }, [record]);

  return (
    <div className="habitat-scene" ref={mountRef}>
      {loading && <span className="habitat-scene__loading">GENERATING AUTONOMOUS HABITAT…</span>}
    </div>
  );
}
