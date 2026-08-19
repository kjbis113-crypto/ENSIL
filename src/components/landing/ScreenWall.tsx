import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SpecimenGlyph } from '../archive/SpecimenGlyph';
import { LiquidEnsilLogo } from '../branding/LiquidEnsilLogo';
import { CREATURE_RECORDS } from '../../data/creatureRecords';

/**
 * 인덱스 스크린-월 — 미디어 설치 벽 오마주.
 * 흰 벽에 크기가 다른 모니터(스크린)들이 걸려 있고, 그 사이를 검은 전선·체인·스트랩이
 * 늘어져 연결한다. 각 스크린이 곧 내비게이션: 개체 스크린 → 서식지, 로고 스크린 → 필드,
 * 텍스처 스크린 → 아카이브.
 *
 * 스크린 배치는 % 좌표 테이블(SCREENS) 하나로 정의하고, 전선 SVG는 같은 테이블에서
 * 픽셀 앵커를 계산해 그린다 — DOM 실측 없이 리사이즈에 안전하다.
 */

interface ScreenDef {
  key: string;
  x: number; // 왼쪽 (%)
  y: number; // 위 (%)
  w: number; // 너비 (%)
  ratio: number; // 높이/너비
  rot: number; // 기울기 (deg)
  href: string;
  label?: string;
}

const SCREENS: ScreenDef[] = [
  { key: 'texture', x: 17, y: 8, w: 11.5, ratio: 1.32, rot: -1.4, href: '#/archive', label: 'COLLECTION *E / ARCHIVE' },
  { key: 'g0', x: 54, y: 6, w: 18.5, ratio: 1.42, rot: 0.7, href: '#/habitat/eo-005' },
  { key: 'g1', x: 11, y: 31, w: 21.5, ratio: 1.12, rot: -0.8, href: '#/habitat/eo-002' },
  { key: 'g2', x: 50, y: 33, w: 12.5, ratio: 1.22, rot: 0.5, href: '#/habitat/eo-003' },
  { key: 'logo', x: 39.5, y: 55, w: 19, ratio: 1.42, rot: -0.6, href: '#/field', label: '01 / LIVE SYSTEM — ENTER FIELD' },
  { key: 'g3', x: 20.5, y: 68, w: 12, ratio: 1.24, rot: 1.1, href: '#/habitat/eo-004' },
];

/** 스크린 프레임 위 앵커 (ax, ay: 0~1 프레임 비율 좌표) → 픽셀 */
function anchor(s: ScreenDef, ax: number, ay: number, W: number, H: number) {
  const px = (s.x / 100) * W + (s.w / 100) * W * ax;
  const py = (s.y / 100) * H + (s.w / 100) * W * s.ratio * ay;
  return { x: px, y: py };
}

/** 두 점 사이 늘어진 전선 경로 (콰드라틱, 아래로 sag) */
function drape(a: { x: number; y: number }, b: { x: number; y: number }, sagRatio = 0.22, extra = 30) {
  const mx = (a.x + b.x) / 2;
  const my = Math.max(a.y, b.y) + Math.hypot(b.x - a.x, b.y - a.y) * sagRatio + extra;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

/** 행어에 걸린 스트랩 — 아래로 내려갔다 고리를 그리며 돌아온다 */
function strap(x: number, topY: number, drop: number, loopR: number, lean = 0) {
  const bx = x + lean;
  return `M ${x} ${topY} C ${x} ${topY + drop * 0.5}, ${bx} ${topY + drop * 0.72}, ${bx} ${topY + drop}
          a ${loopR} ${loopR} 0 1 0 ${loopR * 1.6} 0
          C ${bx + loopR * 1.6} ${topY + drop * 0.6}, ${x + loopR * 1.6} ${topY + drop * 0.4}, ${x + loopR * 1.6} ${topY + 8}`;
}

function byKey(key: string): ScreenDef {
  return SCREENS.find((s) => s.key === key)!;
}

export function ScreenWall() {
  const wallRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    const update = () => setDims({ w: wall.clientWidth, h: wall.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wall);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = dims;

  // 전선·체인 정의 — [from, fromAnchor, to, toAnchor, 스타일]
  const cables: ReactNode[] = [];
  if (W > 0 && H > 0) {
    const A = anchor;
    const tex = byKey('texture');
    const g0 = byKey('g0');
    const g1 = byKey('g1');
    const g2 = byKey('g2');
    const g3 = byKey('g3');
    const logo = byKey('logo');

    const black = '#101010';
    const lime = '#D5FB4E';

    // 상단 가로 러닝 케이블: 텍스처 → 대형 스크린
    cables.push(<path key="c1" d={drape(A(tex, 0.85, 0.1, W, H), A(g0, 0.12, 0.05, W, H), 0.06, 8)} stroke={black} strokeWidth={2.5} fill="none" />);
    cables.push(<path key="c2" d={drape(A(tex, 0.9, 0.55, W, H), A(g1, 0.42, 0.02, W, H), 0.16, 26)} stroke={black} strokeWidth={3.5} fill="none" />);
    // 중앙 세로 스트랩 (라임) — 대형 스크린에서 로고 스크린을 관통해 아래로
    const strapTop = A(g0, 0.48, 0, W, H);
    cables.push(<path key="c3" d={`M ${strapTop.x} ${strapTop.y - 26} L ${strapTop.x - 6} ${H * 0.985}`} stroke={lime} strokeWidth={Math.max(7, W * 0.006)} fill="none" />);
    cables.push(<path key="c3b" d={`M ${strapTop.x + 7} ${strapTop.y - 26} L ${strapTop.x + 3} ${H * 0.9}`} stroke={black} strokeWidth={2} fill="none" />);
    // 검은 천 케이블: 대형 → 로고 스크린 왼쪽으로 굽이침
    cables.push(<path key="c4" d={drape(A(g0, 0.06, 0.96, W, H), A(logo, 0.4, 0.02, W, H), 0.2, 30)} stroke={black} strokeWidth={5} fill="none" />);
    cables.push(<path key="c5" d={drape(A(g2, 0.5, 0.98, W, H), A(logo, 0.82, 0.03, W, H), 0.24, 22)} stroke={black} strokeWidth={2.5} fill="none" />);
    // 좌측 열: 텍스처 → 중형 → 소형
    cables.push(<path key="c6" d={drape(A(g1, 0.3, 0.98, W, H), A(g3, 0.5, 0.02, W, H), 0.2, 18)} stroke={black} strokeWidth={3} fill="none" />);
    // 체인: 소형 → 로고 스크린 (점선)
    cables.push(<path key="c7" d={drape(A(g3, 0.95, 0.6, W, H), A(logo, 0.06, 0.72, W, H), 0.3, 34)} stroke="#3a3d40" strokeWidth={3.5} strokeDasharray="7 5" fill="none" />);
    // 러닝 케이블 우측 밖으로
    cables.push(<path key="c8" d={drape(A(g0, 0.94, 0.4, W, H), { x: W * 0.985, y: H * 0.16 }, 0.12, 14)} stroke={black} strokeWidth={2} fill="none" />);

    // 좌측 행어(옷걸이 레일 + 스트랩들)
    const railY = H * 0.3;
    const railX = W * 0.045;
    cables.push(<path key="r1" d={`M ${railX - W * 0.02} ${railY} L ${railX + W * 0.035} ${railY - 14}`} stroke={black} strokeWidth={2.5} fill="none" />);
    cables.push(<path key="r2" d={strap(railX, railY - 4, H * 0.3, 7, -W * 0.006)} stroke="#5b3d26" strokeWidth={3.5} fill="none" />);
    cables.push(<path key="r3" d={strap(railX + W * 0.016, railY - 8, H * 0.42, 9, W * 0.004)} stroke={black} strokeWidth={2.5} fill="none" />);

    // 우측 행어 — 스트랩 4개
    const rail2Y = H * 0.06;
    const rail2X = W * 0.875;
    cables.push(<path key="r4" d={`M ${rail2X - W * 0.01} ${rail2Y} L ${rail2X + W * 0.075} ${rail2Y}`} stroke={black} strokeWidth={3} fill="none" />);
    cables.push(<path key="r5" d={strap(rail2X + W * 0.008, rail2Y, H * 0.4, 8, -W * 0.004)} stroke="#5b3d26" strokeWidth={4} fill="none" />);
    cables.push(<path key="r6" d={strap(rail2X + W * 0.028, rail2Y, H * 0.5, 10, W * 0.006)} stroke="#5b3d26" strokeWidth={3} fill="none" />);
    cables.push(<path key="r7" d={strap(rail2X + W * 0.048, rail2Y, H * 0.33, 7, 0)} stroke={black} strokeWidth={2.5} fill="none" />);
    cables.push(<path key="r8" d={strap(rail2X + W * 0.064, rail2Y, H * 0.55, 8, W * 0.008)} stroke="#2b4bc4" strokeWidth={3.5} fill="none" />);
  }

  const glyphRecords = [CREATURE_RECORDS[0], CREATURE_RECORDS[1], CREATURE_RECORDS[2], CREATURE_RECORDS[3]];
  const glyphKeys = ['g0', 'g1', 'g2', 'g3'];

  return (
    <div className="screenwall" ref={wallRef}>
      {/* 스크린들 */}
      {SCREENS.map((s) => {
        const style = {
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: `${s.w}%`,
          aspectRatio: `1 / ${s.ratio}`,
          transform: `rotate(${s.rot}deg)`,
        };
        if (s.key === 'texture') {
          return (
            <a key={s.key} className="sw-screen sw-screen--texture" style={style} href={s.href} aria-label="Open archive">
              <img src="/textures/ensil-riso-density-v1.png" alt="" />
              {s.label && <span className="sw-label">{s.label}</span>}
            </a>
          );
        }
        if (s.key === 'logo') {
          return (
            <a key={s.key} className="sw-screen sw-screen--logo" style={style} href={s.href} aria-label="Enter field">
              <LiquidEnsilLogo className="sw-logo" />
              {s.label && <span className="sw-label">{s.label}</span>}
            </a>
          );
        }
        const gi = glyphKeys.indexOf(s.key);
        const record = glyphRecords[gi];
        if (!record) return null;
        return (
          <a
            key={s.key}
            className="sw-screen sw-screen--glyph"
            style={style}
            href={s.href}
            aria-label={`${record.code} habitat`}
          >
            <SpecimenGlyph index={record.glyphIndex} live palette={record.palette} code={record.code} />
            <span className="sw-label">{`${record.code} / ${record.sensor.toUpperCase()}`}</span>
          </a>
        );
      })}

      {/* 전선·체인·스트랩 레이어 — 스크린 위로 늘어진다 */}
      {W > 0 && (
        <svg className="sw-cables" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
          {cables}
        </svg>
      )}
    </div>
  );
}
