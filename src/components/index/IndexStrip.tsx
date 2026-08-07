import type { Creature } from '../../types/creature';

/** 상단 목차 스트립 — 이 웹의 척추 (plan.md §4-2) */
export function IndexStrip({
  creatures,
  selectedId,
  onSelect,
}: {
  creatures: Creature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="strip">
      {creatures.map((c) => (
        <button
          key={c.id}
          className={`slot ${c.id === selectedId ? 'selected' : ''}`}
          onClick={() => onSelect(c.id)}
        >
          <span className="thumb">▨</span>
          <span className="code">{c.code.replace('EO-', '')}</span>
        </button>
      ))}
      <span className="more">▸</span>
    </nav>
  );
}
