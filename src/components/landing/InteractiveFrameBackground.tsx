import { useEffect, useRef } from 'react';

const BACKGROUND_VIDEO = '/media/index/ensil-geometric-fractals.m4v';
const PALETTE_DEEP_GREEN = [0, 41, 40] as const;
const PALETTE_SILVER = [217, 217, 217] as const;
const PALETTE_WHITE = [255, 255, 255] as const;
const MAX_DPR = 1.25;

const mixChannel = (from: number, to: number, amount: number) => Math.round(from + (to - from) * amount);

export function InteractiveFrameBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!root || !video || !canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return undefined;

    let frameRequest = 0;
    let targetX = .5;
    let targetY = .5;
    let targetProgress = .36;
    let isReady = false;

    const applyPalette = () => {
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;

      for (let pixel = 0; pixel < pixels.length; pixel += 4) {
        const luminance = (
          pixels[pixel] * .2126
          + pixels[pixel + 1] * .7152
          + pixels[pixel + 2] * .0722
        ) / 255;
        const tone = Math.max(0, Math.min(1, (luminance - .04) / .9));
        const easedTone = tone * tone * (3 - 2 * tone);
        const segment = Math.min(1, Math.floor(easedTone * 2));
        const localMix = easedTone * 2 - segment;
        const from = segment === 0 ? PALETTE_DEEP_GREEN : PALETTE_SILVER;
        const to = segment === 0 ? PALETTE_SILVER : PALETTE_WHITE;
        pixels[pixel] = mixChannel(from[0], to[0], localMix);
        pixels[pixel + 1] = mixChannel(from[1], to[1], localMix);
        pixels[pixel + 2] = mixChannel(from[2], to[2], localMix);
      }

      context.putImageData(frame, 0, 0);
    };

    const drawFrame = () => {
      if (!isReady || !video.videoWidth || !video.videoHeight) return;

      const bounds = root.getBoundingClientRect();
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const coverScale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const sourceWidth = width / coverScale;
      const sourceHeight = height / coverScale;
      const availableX = Math.max(0, video.videoWidth - sourceWidth);
      const availableY = Math.max(0, video.videoHeight - sourceHeight);
      const panX = Math.max(0, Math.min(1, .5 + (targetX - .5) * .72));
      const panY = Math.max(0, Math.min(1, .5 + (targetY - .5) * .72));

      context.drawImage(
        video,
        availableX * panX,
        availableY * panY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      );
      applyPalette();

      root.dataset.frameProgress = targetProgress.toFixed(3);
      root.dataset.frameTime = video.currentTime.toFixed(3);
      root.dataset.pointerX = targetX.toFixed(3);
      root.dataset.pointerY = targetY.toFixed(3);
      root.dataset.playback = 'pointer-controlled';
    };

    const seekToPointer = () => {
      frameRequest = 0;
      if (!isReady || video.seeking || !Number.isFinite(video.duration)) return;
      const safeDuration = Math.max(0, video.duration - .04);
      const targetTime = safeDuration * targetProgress;
      if (Math.abs(video.currentTime - targetTime) < .018) {
        drawFrame();
        return;
      }
      video.currentTime = targetTime;
    };

    const requestSeek = () => {
      if (!frameRequest) frameRequest = window.requestAnimationFrame(seekToPointer);
    };

    const updateFromPointer = (clientX: number, clientY: number) => {
      targetX = Math.min(1, Math.max(0, clientX / window.innerWidth));
      targetY = Math.min(1, Math.max(0, clientY / window.innerHeight));
      targetProgress = (targetX * .58 + targetY * .29 + targetX * targetY * .21 + .06) % 1;
      canvas.style.transform = `translate3d(${(targetX - .5) * 14}px, ${(targetY - .5) * 10}px, 0) scale(${1.025 + Math.abs(targetY - .5) * .015})`;
      requestSeek();
    };

    const onPointerMove = (event: PointerEvent) => updateFromPointer(event.clientX, event.clientY);
    const onResize = () => drawFrame();
    const onLoaded = () => {
      isReady = true;
      video.pause();
      root.dataset.sourceRatio = (video.videoWidth / video.videoHeight || 1).toFixed(4);
      video.currentTime = Math.max(0, video.duration * targetProgress);
    };
    const onSeeked = () => {
      drawFrame();
      const targetTime = Math.max(0, video.duration - .04) * targetProgress;
      if (Math.abs(video.currentTime - targetTime) > .018) requestSeek();
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    if (video.readyState >= 1) onLoaded();

    return () => {
      if (frameRequest) window.cancelAnimationFrame(frameRequest);
      video.pause();
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={rootRef} className="index-frame-bg" aria-hidden="true" data-playback="loading">
      <video ref={videoRef} src={BACKGROUND_VIDEO} muted playsInline preload="auto" tabIndex={-1} />
      <canvas ref={canvasRef} className="index-frame-bg__canvas" />
    </div>
  );
}
