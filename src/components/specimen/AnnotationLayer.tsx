import { useLayoutEffect, useState } from 'react';
import type { Annotation } from '../../types/creature';

interface Layout {
  containerW: number;
  containerH: number;
  /** 컨테이너 기준 비주얼 박스 */
  visual: { left: number; top: number; size: number };
}

const LABEL_GAP = 48; // 비주얼 가장자리 ↔ 라벨 박스 간격(px)

/**
 * 주석(콜아웃) 레이어 — 데이터의 anchor(0~1) 좌표를 픽셀로 변환해
 * 마커 `+` / 꺾임 1회 직선 / 라벨 박스를 그린다 (plan.md §4-3).
 * 컨테이너 = .specimen, 비주얼 = .visual-wrap (둘 다 ref로 실측).
 */
export function AnnotationLayer({
  annotations,
  containerRef,
  visualRef,
}: {
  annotations: Annotation[];
  containerRef: React.RefObject<HTMLElement>;
  visualRef: React.RefObject<HTMLElement>;
}) {
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const visual = visualRef.current;
    if (!container || !visual) return;

    const measure = () => {
      const c = container.getBoundingClientRect();
      const v = visual.getBoundingClientRect();
      setLayout({
        containerW: c.width,
        containerH: c.height,
        visual: { left: v.left - c.left, top: v.top - c.top, size: v.width },
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(visual);
    return () => ro.disconnect();
  }, [containerRef, visualRef]);

  if (!layout) return null;

  const left = annotations.filter((a) => a.side === 'left');
  const right = annotations.filter((a) => a.side === 'right');

  // 같은 쪽 라벨들은 세로로 분산 배치
  const labelY = (idx: number, count: number) =>
    layout.containerH * (count <= 1 ? 0.5 : 0.24 + (idx * 0.52) / (count - 1));

  const items = annotations.map((a) => {
    const sideList = a.side === 'left' ? left : right;
    const idx = sideList.indexOf(a);
    const ax = layout.visual.left + a.anchor.x * layout.visual.size;
    const ay = layout.visual.top + a.anchor.y * layout.visual.size;
    const lx =
      a.side === 'left'
        ? layout.visual.left - LABEL_GAP
        : layout.visual.left + layout.visual.size + LABEL_GAP;
    const ly = labelY(idx, sideList.length);
    return { a, ax, ay, lx, ly };
  });

  return (
    <>
      <svg className="ann-svg">
        {items.map(({ a, ax, ay, lx, ly }) => (
          <g key={a.id}>
            {/* 꺾임 1회: 앵커 → 수평 → 수직 (라벨 근접 모서리까지) */}
            <polyline points={`${ax},${ay} ${lx},${ay} ${lx},${ly}`} />
            <line className="marker" x1={ax - 5} y1={ay} x2={ax + 5} y2={ay} />
            <line className="marker" x1={ax} y1={ay - 5} x2={ax} y2={ay + 5} />
          </g>
        ))}
      </svg>
      {items.map(({ a, lx, ly }) => (
        <div
          key={a.id}
          className="callout"
          style={{
            top: ly,
            transform: 'translateY(-50%)',
            ...(a.side === 'left'
              ? { right: layout.containerW - lx }
              : { left: lx }),
          }}
        >
          <div className="label">{a.label}</div>
          <div className="body">{a.body}</div>
        </div>
      ))}
    </>
  );
}
