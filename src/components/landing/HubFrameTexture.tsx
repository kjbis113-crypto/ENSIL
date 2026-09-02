import { useEffect, useRef } from 'react';

const HUB_TEXTURE_VIDEO = '/media/index/ensil-tentacle-exact.m4v';
const CANVAS_SIZE = 384;
const FRAME_INTERVAL = 1000 / 30;
const REVERSE_STEP = 1 / 30;

export function HubFrameTexture() {
  const rootRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!root || !video || !canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!context) return undefined;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    let frameRequest = 0;
    let lastDraw = 0;
    let ready = false;
    let direction: 1 | -1 = 1;
    let reverseTimer = 0;

    const removeDarkPixels = () => {
      const frame = context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const pixels = frame.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const value = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
        const alpha = Math.max(0, Math.min(1, (value - 72) / 74));
        pixels[index] = 255;
        pixels[index + 1] = 255;
        pixels[index + 2] = 255;
        pixels[index + 3] = Math.round(pixels[index + 3] * alpha);
      }

      context.putImageData(frame, 0, 0);
    };

    const drawFrame = () => {
      if (!ready || !video.videoWidth || !video.videoHeight) return;
      const crop = Math.min(video.videoWidth, video.videoHeight);
      const sourceX = (video.videoWidth - crop) / 2;
      const sourceY = (video.videoHeight - crop) / 2;

      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      context.drawImage(video, sourceX, sourceY, crop, crop, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      removeDarkPixels();

      root.dataset.frameTime = video.currentTime.toFixed(3);
      root.dataset.playback = direction === 1 ? 'forward' : 'reverse';
    };

    const playForward = () => {
      direction = 1;
      root.dataset.direction = 'forward';
      void video.play().catch(() => undefined);
    };

    const stepBackward = () => {
      if (!ready || direction !== -1) return;

      if (video.currentTime <= REVERSE_STEP) {
        video.currentTime = 0;
        drawFrame();
        playForward();
        return;
      }

      video.currentTime = Math.max(0, video.currentTime - REVERSE_STEP);
    };

    const onSeeked = () => {
      if (direction !== -1) return;
      drawFrame();
      window.clearTimeout(reverseTimer);
      reverseTimer = window.setTimeout(stepBackward, FRAME_INTERVAL);
    };

    const playBackward = () => {
      direction = -1;
      root.dataset.direction = 'reverse';
      video.pause();
      stepBackward();
    };

    const animate = (time: number) => {
      if (direction === 1 && time - lastDraw > FRAME_INTERVAL) {
        lastDraw = time;
        drawFrame();
      }
      frameRequest = window.requestAnimationFrame(animate);
    };

    const onLoaded = () => {
      ready = true;
      playForward();
      if (!frameRequest) frameRequest = window.requestAnimationFrame(animate);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', playBackward);
    video.addEventListener('seeked', onSeeked);
    if (video.readyState >= 1) onLoaded();

    return () => {
      if (frameRequest) window.cancelAnimationFrame(frameRequest);
      window.clearTimeout(reverseTimer);
      video.pause();
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', playBackward);
      video.removeEventListener('seeked', onSeeked);
    };
  }, []);

  return (
    <span ref={rootRef} className="index-dial__hub-texture" data-playback="loading">
      <video ref={videoRef} src={HUB_TEXTURE_VIDEO} muted playsInline preload="auto" tabIndex={-1} />
      <canvas ref={canvasRef} />
    </span>
  );
}
