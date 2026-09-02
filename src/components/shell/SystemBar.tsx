import { useEffect, useState } from 'react';
import { COPY } from '../../copy';

function fmt(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function SystemBar({ physicalConnected }: { physicalConnected: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sysbar">
      <span className="brand-lockup">
        <strong>ENSIL</strong>
        <span>{COPY.systemTitle}</span>
      </span>
      <span className="status">
        {/* M10: Supabase 동기화 상태가 여기 반영됨 */}
        <span>{physicalConnected ? COPY.physicalConnected : COPY.physicalWaiting}</span>
        <span>{COPY.syncLocal}</span>
      </span>
      <span>{fmt(now)}</span>
    </header>
  );
}
