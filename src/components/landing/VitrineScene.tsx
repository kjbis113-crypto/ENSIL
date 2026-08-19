import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import { getGLTFLoader } from '../../sim3d/gltf';

/**
 * 랜딩 비트린(전시 진열장) — 흰 좌대 + 투명 아크릴 상자 렌더.
 * 상자 속에 다섯 개체가 미니어처로 살아 있고, 상자를 클릭하면 카메라가
 * 유리 안으로 줌인된 뒤 onEnter()로 필드(시뮬레이터)에 진입한다.
 */

// 좌대·상자 치수 (월드 단위)
const PED_W = 3.2;
const PED_H = 4.4;
const CASE_H = 3.1;
const CASE_INSET = 0.06;

const CAM_IDLE_POS = new THREE.Vector3(7.0, 6.2, 13.6);
const CAM_IDLE_TARGET = new THREE.Vector3(0, 3.85, 0);
const CAM_ZOOM_POS = new THREE.Vector3(0, PED_H + 1.35, 1.75);
const CAM_ZOOM_TARGET = new THREE.Vector3(0, PED_H + 0.9, 0);
const ZOOM_MS = 1500;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 유리면에 인쇄된 워드마크 (PURE 오마주) */
function makeGlassLabel(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#15171a';
  ctx.font = '400 150px Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('ENSIL', 12, 20);
  ctx.fillRect(14, 210, 420, 6);
  ctx.font = '400 34px Arial, sans-serif';
  ctx.fillText('interactive electronic ecology', 460, 196);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.59),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
  );
  return mesh;
}

export function VitrineScene({ onEnter }: { onEnter: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x35373a); // 어두운 벽
    scene.fog = new THREE.Fog(0x35373a, 26, 60);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    camera.position.copy(CAM_IDLE_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // 유리·백색 재질을 위한 환경맵
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(-7, 12, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0004;
    scene.add(key);

    // 밝은 바닥 (사진의 스튜디오 바닥)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0xcfd0cc, roughness: 0.96, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const vitrine = new THREE.Group();
    scene.add(vitrine);

    const white = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.55, metalness: 0.02 });

    // 좌대
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(PED_W, PED_H, PED_W), white);
    pedestal.position.y = PED_H / 2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    vitrine.add(pedestal);

    // 상단 캡
    const cap = new THREE.Mesh(new THREE.BoxGeometry(PED_W, 0.34, PED_W), white);
    cap.position.y = PED_H + CASE_H + 0.17;
    cap.castShadow = true;
    vitrine.add(cap);

    // 유리 상자
    const glassGeo = new THREE.BoxGeometry(PED_W - CASE_INSET, CASE_H, PED_W - CASE_INSET);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      envMapIntensity: 1.15,
      depthWrite: false,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = PED_H + CASE_H / 2;
    vitrine.add(glass);
    const glassEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(glassGeo),
      new THREE.LineBasicMaterial({ color: 0xfafaf8, transparent: true, opacity: 0.85 }),
    );
    glassEdges.position.copy(glass.position);
    vitrine.add(glassEdges);

    // 유리면 워드마크
    const label = makeGlassLabel();
    label.position.set(-0.5, PED_H + CASE_H - 0.62, (PED_W - CASE_INSET) / 2 + 0.005);
    vitrine.add(label);

    // 상자 속 미니 생태계 — 개체 5 + 종별 액센트 링
    const habitat = new THREE.Group();
    habitat.position.y = PED_H;
    vitrine.add(habitat);

    interface Mini { holder: THREE.Group; phase: number }
    const minis: Mini[] = [];
    let unmounted = false;
    getGLTFLoader().then((loader) => {
      CREATURE_RECORDS.forEach((record, i) => {
        if (!record.modelUrl || unmounted) return;
        const angle = (i / CREATURE_RECORDS.length) * Math.PI * 2 - Math.PI / 2.6;
        const radius = i === 0 ? 0 : 0.92; // 첫 개체는 중앙
        const holder = new THREE.Group();
        holder.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        habitat.add(holder);
        minis.push({ holder, phase: i * 1.7 });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.335, 40),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(record.palette.primary),
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.012;
        holder.add(ring);

        loader.load(record.modelUrl, (gltf) => {
          if (unmounted) return;
          const model = gltf.scene;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) { child.castShadow = true; }
          });
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          model.scale.setScalar((i === 0 ? 0.98 : 0.78) / (Math.max(size.x, size.y, size.z) || 1));
          const fitted = new THREE.Box3().setFromObject(model);
          const center = fitted.getCenter(new THREE.Vector3());
          model.position.set(-center.x, -fitted.min.y, -center.z);
          holder.add(model);
        });
      });
    });

    const resize = () => {
      const { clientWidth: cw, clientHeight: ch } = mount;
      renderer.setSize(cw, ch);
      camera.aspect = cw / Math.max(1, ch);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // 호버 커서 + 클릭 → 줌인
    const raycaster = new THREE.Raycaster();
    const ndcOf = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };
    const hitsVitrine = (e: PointerEvent) => {
      raycaster.setFromCamera(ndcOf(e), camera);
      return raycaster.intersectObject(vitrine, true).length > 0;
    };
    let zoomStart = 0; // 0 = 대기
    const zoomFrom = new THREE.Vector3();
    const onMove = (e: PointerEvent) => {
      if (zoomStart) return;
      renderer.domElement.style.cursor = hitsVitrine(e) ? 'pointer' : 'default';
    };
    const onClick = (e: PointerEvent) => {
      if (zoomStart || !hitsVitrine(e)) return;
      zoomFrom.copy(camera.position); // 흔들리던 현재 시점에서 출발 (스냅 방지)
      zoomStart = performance.now();
      renderer.domElement.style.cursor = 'default';
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onClick);

    const target = CAM_IDLE_TARGET.clone();
    let entered = false;
    let raf = 0;
    const frame = (now: number) => {
      const t = now / 1000;

      for (const m of minis) {
        m.holder.rotation.y = t * 0.35 + m.phase;
        m.holder.position.y = Math.sin(t * 0.9 + m.phase) * 0.03;
      }

      if (!zoomStart) {
        // 대기: 좌대 주위를 아주 천천히 흔들리는 시점
        const sway = Math.sin(t * 0.16) * 0.16;
        camera.position.set(
          CAM_IDLE_POS.x * Math.cos(sway) - CAM_IDLE_POS.z * Math.sin(sway),
          CAM_IDLE_POS.y + Math.sin(t * 0.4) * 0.07,
          CAM_IDLE_POS.x * Math.sin(sway) + CAM_IDLE_POS.z * Math.cos(sway),
        );
        target.copy(CAM_IDLE_TARGET);
      } else {
        // 줌인: 유리 안으로
        const k = easeInOut(Math.min(1, (now - zoomStart) / ZOOM_MS));
        camera.position.lerpVectors(zoomFrom, CAM_ZOOM_POS, k);
        target.lerpVectors(CAM_IDLE_TARGET, CAM_ZOOM_TARGET, k);
        glassMat.opacity = 0.13 * (1 - k); // 유리를 통과하는 느낌
        label.visible = k < 0.55;
        if (fadeRef.current) fadeRef.current.style.opacity = String(Math.max(0, (k - 0.62) / 0.38));
        if (k >= 1 && !entered) {
          entered = true;
          onEnterRef.current();
        }
      }
      camera.lookAt(target);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      unmounted = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onClick);
      renderer.dispose();
      pmrem.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry && !m.userData.sharedGeo) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
    };
  }, []);

  return (
    <div className="vitrine-stage" ref={mountRef}>
      <div className="vitrine-fade" ref={fadeRef} />
    </div>
  );
}
