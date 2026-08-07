/** 0~10 게이지 — 심즈식 니즈 바의 로우파이 표현 */
export function TraitGauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="gauge">
      <span>{label}</span>
      <span className="bar">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`cell ${i < value ? 'on' : ''}`} />
        ))}
      </span>
      <span className="num">{value}</span>
    </div>
  );
}
