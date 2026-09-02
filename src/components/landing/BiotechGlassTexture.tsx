import { useId, type CSSProperties } from 'react';

type GlassStyle = CSSProperties & {
  '--glass-displacement': string;
};

export function BiotechGlassTexture({ monochrome = false, compact = false }: { monochrome?: boolean; compact?: boolean }) {
  const filterId = `biotech-glass-${useId().replace(/:/g, '')}`;
  const className = `biotech-glass${monochrome ? ' is-monochrome' : ''}${compact ? ' is-compact' : ''}`;
  const style = { '--glass-displacement': `url(#${filterId})` } as GlassStyle;

  return (
    <span className={className} style={style} aria-hidden="true">
      <svg className="biotech-glass__filter" focusable="false">
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency=".006 .013" numOctaves="2" seed="8" result="noise">
            <animate attributeName="baseFrequency" values=".006 .013;.009 .008;.006 .013" dur="18s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={compact ? 24 : 38} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <i className="biotech-glass__membrane" />
      <i className="biotech-glass__fibres" />
      <i className="biotech-glass__refraction" />
    </span>
  );
}
