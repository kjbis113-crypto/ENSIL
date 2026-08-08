/**
 * 로고 비트맵 → 파티클 홈 좌표 추출.
 * 원본(logo-sketch.png)은 좌측에 레터링, 우측에 스펙 텍스트가 있는 판형이라
 * 좌측 crop 영역만 읽는다. 어두운 픽셀을 격자 샘플링해 0~1로 정규화한 좌표를 반환.
 * React를 모른다 — 렌더러(LogoCloud)와 분리.
 */

export interface HomePoint {
  /** 로고 bbox 기준 0~1 */
  x: number;
  y: number;
}

export interface SampleResult {
  points: HomePoint[];
  /** 로고 bbox의 가로/세로 비 (배치 계산용) */
  aspect: number;
}

const SAMPLE_WIDTH = 400;   // 크롭 영역을 이 폭으로 축소해 샘플링
const DARK_LUM = 128;       // 이보다 어두우면 로고 픽셀
const MIN_ALPHA = 128;

export async function sampleLogoPoints(
  src: string,
  { cropRight = 0.4, maxPoints = 7000 } = {},
): Promise<SampleResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });

  const cropW = Math.floor(img.naturalWidth * cropRight);
  const scale = SAMPLE_WIDTH / cropW;
  const w = SAMPLE_WIDTH;
  const h = Math.floor(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cropW, img.naturalHeight, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // 1픽셀 격자로 어두운 픽셀 수집
  const raw: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (data[i + 3] >= MIN_ALPHA && lum < DARK_LUM) raw.push({ x, y });
    }
  }
  if (raw.length === 0) return { points: [], aspect: 1 };

  // 개수 상한 — 균일 스트라이드로 솎아내기 (결정적)
  const stride = Math.max(1, raw.length / maxPoints);
  const picked: { x: number; y: number }[] = [];
  for (let f = 0; f < raw.length; f += stride) picked.push(raw[Math.floor(f)]);

  // 실제 잉크 영역 bbox로 타이트하게 정규화
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of picked) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);

  // 균일 스트라이드가 만드는 모아레 패턴을 깨기 위한 결정적 지터
  const jitter = (i: number, salt: number) => {
    const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return (v - Math.floor(v) - 0.5) * 2; // -1 ~ 1
  };
  const J = 0.8; // 샘플 픽셀 단위 지터 폭 (밀도가 높아 약하게만)

  return {
    points: picked.map((p, i) => ({
      x: (p.x - minX + jitter(i, 1) * J) / bw,
      y: (p.y - minY + jitter(i, 2) * J) / bh,
    })),
    aspect: bw / bh,
  };
}
