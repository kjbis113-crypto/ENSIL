import { useEffect, useRef, useState } from 'react';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import { HabitatWorld } from '../habitat-engine/HabitatWorld';
import type { HabitatSnapshot } from '../habitat-engine/types';

export type EcosystemApi = { dropCharge: (id?: string) => void };

type Props = {
  selectedId: string | null;
  observation: boolean;
  paused: boolean;
  onSelect: (id: string | null) => void;
  onEnter: (id: string) => void;
  onProximity: (id: string | null) => void;
  onSnapshot: (snapshot: HabitatSnapshot[]) => void;
  /** 외부 조작 API (아카이브 패널의 전하 던지기 등) — 마운트 시 전달, 언마운트 시 null */
  bindApi?: (api: EcosystemApi | null) => void;
};

export function EcosystemCanvas({ selectedId, observation, paused, onSelect, onEnter, onProximity, onSnapshot, bindApi }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HabitatWorld | null>(null);
  const callbacksRef = useRef({ onSelect, onEnter, onProximity, onSnapshot });
  callbacksRef.current = { onSelect, onEnter, onProximity, onSnapshot };
  const bindApiRef = useRef(bindApi);
  bindApiRef.current = bindApi;
  const [loading, setLoading] = useState({ loaded: 0, total: CREATURE_RECORDS.length });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const world = new HabitatWorld({
      mount,
      records: CREATURE_RECORDS,
      mode: 'field',
      selectedId,
      observation,
      paused,
      onLoaded: (loaded, total) => setLoading({ loaded, total }),
      onSelect: (id) => callbacksRef.current.onSelect(id),
      onEnter: (id) => callbacksRef.current.onEnter(id),
      onProximity: (id) => callbacksRef.current.onProximity(id),
      onSnapshot: (snapshot) => callbacksRef.current.onSnapshot(snapshot),
    });
    worldRef.current = world;
    bindApiRef.current?.({ dropCharge: (id) => worldRef.current?.dropCharge(id) });
    return () => {
      bindApiRef.current?.(null);
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    worldRef.current?.setOptions({ selectedId, observation, paused });
  }, [selectedId, observation, paused]);

  return (
    <div className="ecosystem-canvas" ref={mountRef}>
      {loading.loaded < loading.total && (
        <span className="ecosystem-loading">
          ECOLOGIES GENERATING / {loading.loaded.toString().padStart(2, '0')}—{loading.total.toString().padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
