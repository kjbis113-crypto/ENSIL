import type { CSSProperties } from 'react';

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  paper: string;
  ink: string;
};

type Props = {
  index: number;
  live?: boolean;
  palette?: Palette;
  label?: string;
  code?: string;
};

function SpeciesShape({ index, className }: { index: number; className: string }) {
  if (index === 0) {
    return <path className={className} d="M69 190C49 123 87 51 154 43c80-10 121 67 91 129-22 48-50 96-109 91-38-3-58-38-67-73Z" />;
  }
  if (index === 1) {
    return <path className={className} d="M42 203c35-111 79-109 111-18 29 84 67 73 107-64M49 144c29-61 63-55 83 5 23 68 70 58 124-18" />;
  }
  if (index === 2) {
    return <path className={className} d="M150 76c41 0 74 33 74 74s-33 74-74 74-74-33-74-74 33-74 74-74Zm0 28c-25 0-46 21-46 46s21 46 46 46 46-21 46-46-21-46-46-46Z" />;
  }
  if (index === 3) {
    return <path className={className} d="m150 148-111-75 45 135 66-60 66 60 45-135-111 75Zm0-69 24 47-24 15-24-15 24-47Z" />;
  }
  return <path className={className} d="m150 38 106 112-106 112L44 150 150 38Zm0 51-58 61 58 61 58-61-58-61Z" />;
}

export function SpecimenGlyph({ index, live = false, palette, label, code }: Props) {
  const colors = palette ?? { primary: '#73D2BE', secondary: '#5FA48D', accent: '#545756', paper: '#73D2BE', ink: '#171818' };
  const style = {
    '--riso-primary': colors.primary,
    '--riso-secondary': colors.secondary,
    '--riso-accent': colors.accent,
    '--riso-paper': colors.paper,
    '--riso-ink': colors.ink,
  } as CSSProperties;
  const dots = `riso-dots-${index}`;
  const rough = `riso-rough-${index}`;

  return (
    <svg
      className={`specimen-glyph specimen-glyph--${index + 1}`}
      viewBox="0 0 300 300"
      role="img"
      aria-label={label ?? (live ? 'Animated live specimen print' : 'Animated specimen print')}
      style={style}
    >
      <defs>
        <pattern id={dots} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2.4" cy="2.4" r="2.2" fill="var(--riso-ink)" />
        </pattern>
        <filter id={rough} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.11" numOctaves="2" seed={index + 4} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
      <rect className="riso-paper" width="300" height="300" />
      <g className="riso-registration" aria-hidden>
        <path d="M14 27h27M27 14v27M259 273h27M273 259v27" />
        <circle cx="273" cy="27" r="9" />
      </g>
      <g filter={`url(#${rough})`}>
        <SpeciesShape index={index} className="riso-shape riso-shape--secondary" />
        <SpeciesShape index={index} className="riso-shape riso-shape--primary" />
        <SpeciesShape index={index} className="riso-shape riso-shape--halftone" />
      </g>
      <g className="riso-orbits" aria-hidden>
        <circle cx="150" cy="150" r="113" />
        <circle cx="150" cy="150" r="91" />
        <path d="M22 150h256M150 22v256" />
      </g>
      <g className="riso-signal" aria-hidden>
        <rect x="24" y="252" width="54" height="7" />
        <rect x="82" y="252" width="12" height="7" />
        <rect x="98" y="252" width="31" height="7" />
      </g>
      <text className="riso-code" x="20" y="288">{code ?? `EO—00${index + 1}`} / LIVE SIGNAL</text>
    </svg>
  );
}
