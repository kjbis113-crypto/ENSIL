import { useEffect, useRef } from 'react';

/**
 * 포인터 반응 배경 — 비디오를 직접 표시하고 트라이톤(딥그린→실버→화이트) 팔레트는
 * SVG 필터로 GPU에서 처리한다.
 * 이전 구현은 마우스 이동마다 비디오 시킹 + 전체 화면 getImageData 픽셀 루프(CPU)를
 * 돌려 커서 전체가 버벅였다 — 시킹은 150ms 스로틀, 픽셀 처리는 0.
 */

const BACKGROUND_VIDEO = '/media/index/ensil-geometric-fractals.m4v';
const SEEK_INTERVAL_MS = 150;
const SEEK_EPSILON = 0.06;

export function InteractiveFrameBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return undefined;

    let targetProgress = 0.36;
    let ready = false;
    let lastSeek = 0;
    let seekTimer = 0;

    const trySeek = () => {
      seekTimer = 0;
      if (!ready || video.seeking || !Number.isFinite(video.duration)) return;
      const targetTime = Math.max(0, video.duration - 0.04) * targetProgress;
      if (Math.abs(video.currentTime - targetTime) < SEEK_EPSILON) return;
      lastSeek = performance.now();
      video.currentTime = targetTime;
    };
    const scheduleSeek = () => {
      if (seekTimer) return;
      const wait = Math.max(0, SEEK_INTERVAL_MS - (performance.now() - lastSeek));
      seekTimer = window.setTimeout(trySeek, wait);
    };

    const onPointerMove = (event: PointerEvent) => {
      const x = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
      const y = Math.min(1, Math.max(0, event.clientY / window.innerHeight));
      targetProgress = (x * 0.58 + y * 0.29 + x * y * 0.21 + 0.06) % 1;
      video.style.transform = `translate3d(${(x - 0.5) * 14}px, ${(y - 0.5) * 10}px, 0) scale(${1.045 + Math.abs(y - 0.5) * 0.015})`;
      scheduleSeek();
    };

    const onLoaded = () => {
      ready = true;
      video.pause();
      root.dataset.playback = 'pointer-controlled';
      root.dataset.sourceRatio = (video.videoWidth / video.videoHeight || 1).toFixed(4);
      video.currentTime = Math.max(0, (video.duration || 0) * targetProgress);
    };
    const onSeeked = () => scheduleSeek(); // 시킹이 끝나면 최신 목표를 따라잡는다

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    if (video.readyState >= 1) onLoaded();

    return () => {
      window.clearTimeout(seekTimer);
      video.pause();
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div ref={rootRef} className="index-frame-bg" aria-hidden="true" data-playback="loading">
      {/* 트라이톤 팔레트: 그레이스케일 후 채널별 table 매핑 (딥그린 #002928 → 실버 #D9D9D9 → 화이트) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
        <filter id="ensil-tritone" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 0.851 1" />
            <feFuncG type="table" tableValues="0.161 0.851 1" />
            <feFuncB type="table" tableValues="0.157 0.851 1" />
          </feComponentTransfer>
        </filter>
      </svg>
      <video
        ref={videoRef}
        className="index-frame-bg__video"
        src={BACKGROUND_VIDEO}
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
      />
    </div>
  );
}
