import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Creature } from '../../types/creature';
import { COPY } from '../../copy';
import { cloneCreature, creatureModelUrl, loadCreatureModel } from '../../sim3d/creatureModel';
import { useLink } from '../../state/useLink';

/**
 * 메인(전시 대기) 화면 — 전체 개체를 카탈로그처럼 한눈에 (plan.md 전시 운용).
 * 캔버스 1장에 개체들을 흩어 놓고 번호를 붙인다. 직교 카메라라 배치 좌표(fx,fy)가
 * CSS %와 1:1로 맞아 HTML 라벨을 같은 좌표에 겹칠 수 있다.
 *
 * 클릭 동작: 아카이브 창(#/c/...)이 다른 모니터에 살아 있으면 그 창만 이동시키고
 * 이 화면은 유지(useLink), 없으면 이 창에서 이동(onPick).
 */

/** 개체 배치 슬롯 — 화면 비율 좌표(fx,fy: 0~1)와 크기(s: 화면 높이 비율). 8개 초과 시 순환. */
const SLOTS = [
  { fx: 0.13, fy: 0.42, s: 0.17 },
  { fx: 0.30, fy: 0.31, s: 0.13 },
  { fx: 0.47, fy: 0.45, s: 0.18 },
  { fx: 0.66, fy: 0.29, s: 0.13 },
  { fx: 0.84, fy: 0.42, s: 0.15 },
  { fx: 0.22, fy: 0.70, s: 0.14 },
  { fx: 0.46, fy: 0.76, s: 0.12 },
  { fx: 0.71, fy: 0.68, s: 0.16 },
];

const slotOf = (i: number) => {
  const base = SLOTS[i % SLOTS.length];
  const wrap = Math.floor(i / SLOTS.length);
  return { ...base, fx: Math.min(0.92, base.fx + wrap * 0.03), fy: Math.min(0.85, base.fy + wrap * 0.05) };
};

export function GalleryView({
  creatures,
  onPick,
}: {
  creatures: Creature[];
  onPick: (id: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { peerAlive, sendSelect } = useLink('gallery');

  const pick = (id: string) => {
    if (peerAlive) sendSelect(id);
    else onPick(id);
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    // 직교 카메라: 세로 -1~1 고정, 가로는 비율만큼 — fx,fy ↔ CSS %가 정확히 맞는다
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 4);
    scene.add(key);

    // 개체 홀더 — 모델 도착 전에도 자리·픽킹 대상은 존재
    const holders: THREE.Group[] = creatures.map((c, i) => {
      const holder = new THREE.Group();
      holder.userData.creatureId = c.id;
      holder.userData.slot = slotOf(i);
      holder.userData.phase = i * 0.9;
      scene.add(holder);
      return holder;
    });

    let unmounted = false;
    creatures.forEach((c, i) => {
      loadCreatureModel(creatureModelUrl(c)).then((model) => {
        if (unmounted) return;
        const { s } = slotOf(i);
        const size = s * 2; // 화면 높이 = 월드 2유닛
        const inst = cloneCreature(model, size);
        inst.position.y = -size / 2; // 바닥 기준 모델을 홀더 중심으로
        holders[i].add(inst);
      });
    });

    const layout = () => {
      const { clientWidth: cw, clientHeight: ch } = mount;
      const a = cw / Math.max(1, ch);
      renderer.setSize(cw, ch);
      camera.left = -a;
      camera.right = a;
      camera.updateProjectionMatrix();
      for (const h of holders) {
        const { fx, fy } = h.userData.slot as { fx: number; fy: number };
        h.position.set((fx * 2 - 1) * a, 1 - fy * 2, 0);
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(mount);

    // 클릭 픽킹 (드래그 구분 불필요 — 카메라 조작 없음)
    const raycaster = new THREE.Raycaster();
    const onClick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(holders, true)[0];
      if (!hit) return;
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.creatureId) obj = obj.parent;
      if (obj?.userData.creatureId) pickRef.current(obj.userData.creatureId);
    };
    renderer.domElement.addEventListener('pointerup', onClick);

    let raf = 0;
    const frame = (now: number) => {
      const t = now / 1000;
      for (const h of holders) {
        h.rotation.y = t * 0.4 + (h.userData.phase as number);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      unmounted = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerup', onClick);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry && !m.userData.sharedGeo) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
    };
  }, [creatures]);

  return (
    <div className="gallery">
      <header className="gallery-head">
        <h1>{COPY.galleryTitle}</h1>
        <p>{COPY.galleryHint}</p>
      </header>

      <div className="gallery-stage" ref={mountRef} />

      {/* 번호 라벨 — 직교 카메라 좌표와 같은 비율 좌표라 CSS %로 겹친다 */}
      {creatures.map((c, i) => {
        const { fx, fy, s } = slotOf(i);
        return (
          <button
            key={c.id}
            className="g-num"
            style={{ left: `${(fx + s * 0.36) * 100}%`, top: `${(fy - s * 0.62) * 100}%` }}
            onClick={() => pick(c.id)}
          >
            {String(i + 1).padStart(2, '0')}.
          </button>
        );
      })}

      <footer className="gallery-legend">
        {creatures.map((c, i) => (
          <button key={c.id} onClick={() => pick(c.id)}>
            <span className="n">{String(i + 1).padStart(2, '0')}.</span> {c.name} — {c.code}
          </button>
        ))}
      </footer>
    </div>
  );
}
