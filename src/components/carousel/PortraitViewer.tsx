import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getGLTFLoader } from '../../sim3d/gltf';

/**
 * 캐러셀 중앙 원 안의 생물 포트레이트 — 단일 WebGL 캔버스(배경 투명).
 * 개체가 바뀌면 이전 모델은 스프링으로 수축, 새 모델은 오버슛하며 팽창한다 (쫀득).
 * 모델은 URL별 1회 로드 캐시. 지오메트리는 캐시 원본과 공유(sharedGeo)라 dispose하지 않는다.
 */

const cache = new Map<string, Promise<THREE.Group>>();

function loadPortrait(url: string): Promise<THREE.Group> {
  let entry = cache.get(url);
  if (!entry) {
    entry = getGLTFLoader().then((loader) => loader.loadAsync(url)).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -center.y, -center.z);
      const norm = new THREE.Group();
      norm.add(root);
      norm.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 1e-6));
      norm.traverse((o) => { o.userData.sharedGeo = true; });
      return norm;
    });
    cache.set(url, entry);
  }
  return entry;
}

interface Slot {
  holder: THREE.Group;
  scale: number; // 스프링 현재값
  velocity: number;
  target: number;
  dying: boolean;
}

export function PortraitViewer({ modelUrl }: { modelUrl?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<Slot[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // 씬은 1회 생성
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
    camera.position.set(0, 0.12, 2.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d9d2, 2.6));
    const key = new THREE.DirectionalLight(0xffffff, 3.6);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe6d0, 1.4);
    rim.position.set(-3, 1, -3);
    scene.add(rim);

    const resize = () => {
      const s = Math.max(1, Math.min(mount.clientWidth, mount.clientHeight));
      renderer.setSize(s, s);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const slots = slotsRef.current;
      for (let i = slots.length - 1; i >= 0; i -= 1) {
        const s = slots[i];
        // 스프링 적분 — 오버슛으로 쫀득함을 만든다
        s.velocity += (s.target - s.scale) * 130 * dt;
        s.velocity *= Math.exp(-11 * dt);
        s.scale += s.velocity * dt;
        s.holder.scale.setScalar(Math.max(0.0001, s.scale));
        s.holder.rotation.y += dt * (s.dying ? 1.6 : 0.45);
        if (s.dying && s.scale < 0.02) {
          scene.remove(s.holder);
          slots.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
      slotsRef.current = [];
    };
  }, []);

  // 개체 교체 — 이전 슬롯 수축, 새 슬롯 팽창
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelUrl) return;
    let stale = false;

    for (const s of slotsRef.current) {
      s.dying = true;
      s.target = 0;
    }

    loadPortrait(modelUrl).then((model) => {
      if (stale || !sceneRef.current) return;
      const holder = new THREE.Group();
      holder.add(model.clone(true));
      sceneRef.current.add(holder);
      slotsRef.current.push({ holder, scale: 0.001, velocity: 0, target: 1.06, dying: false });
    });

    return () => { stale = true; };
  }, [modelUrl]);

  return <div className="portrait-viewer" ref={mountRef} />;
}
