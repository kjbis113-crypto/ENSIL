import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getGLTFLoader } from '../../sim3d/gltf';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CREATURE_RECORDS, type CreatureRecord } from '../../data/creatureRecords';

function seeded(index: number, offset: number) {
  const value = Math.sin((index + 1) * 9283.17 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function HabitatScene({ record }: { record: CreatureRecord }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !record.modelUrl) return;
    const modelUrl = record.modelUrl; // 콜백 안에서도 string으로 유지
    let cancelled = false;
    const speciesIndex = Math.max(0, CREATURE_RECORDS.findIndex((item) => item.id === record.id));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, 0.01, 120);
    camera.position.set(0, 1, 10.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedMotion ? 1.1 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045;
    controls.enablePan = false;
    controls.minDistance = 5.4;
    controls.maxDistance = 16;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.38 + speciesIndex * 0.08;

    const primary = new THREE.Color(record.palette.primary);
    const secondary = new THREE.Color(record.palette.secondary);
    const accent = new THREE.Color(record.palette.accent);
    scene.add(new THREE.HemisphereLight(0xffffff, primary, 2.5));
    const key = new THREE.DirectionalLight(secondary, 5.2);
    key.position.set(5, 7, 6);
    scene.add(key);
    const rim = new THREE.PointLight(accent, 38, 24, 2);
    rim.position.set(-5, 2, -2);
    scene.add(rim);

    const environment = new THREE.Group();
    scene.add(environment);
    const environmentPieces: THREE.Object3D[] = [];
    const primaryMaterial = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.68, metalness: 0.05 });
    const secondaryMaterial = new THREE.MeshStandardMaterial({ color: secondary, roughness: 0.58, metalness: 0.12 });
    const accentMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.82, side: THREE.DoubleSide });

    const place = (object: THREE.Object3D, index: number, spread = 12) => {
      object.position.set(
        (seeded(index, speciesIndex + 1) - 0.5) * spread,
        (seeded(index, speciesIndex + 4) - 0.5) * 7,
        (seeded(index, speciesIndex + 8) - 0.5) * 7 - 2,
      );
      object.rotation.set(seeded(index, 11) * Math.PI, seeded(index, 12) * Math.PI, seeded(index, 13) * Math.PI);
      object.userData.phase = seeded(index, 17) * Math.PI * 2;
      environment.add(object);
      environmentPieces.push(object);
    };

    for (let index = 0; index < 34; index += 1) {
      let piece: THREE.Object3D;
      if (speciesIndex === 0) {
        piece = new THREE.Mesh(new THREE.TorusGeometry(0.18 + seeded(index, 1) * 0.72, 0.035, 5, 28), index % 3 ? primaryMaterial : accentMaterial);
      } else if (speciesIndex === 1) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.2, -0.3, 0),
          new THREE.Vector3(-0.4, 0.55, 0.2),
          new THREE.Vector3(0.4, -0.5, -0.1),
          new THREE.Vector3(1.2, 0.25, 0),
        ]);
        piece = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.035 + seeded(index, 2) * 0.045, 5, false), index % 2 ? primaryMaterial : secondaryMaterial);
      } else if (speciesIndex === 2) {
        piece = index % 3
          ? new THREE.Mesh(new THREE.TorusGeometry(0.35 + seeded(index, 1) * 0.9, 0.045, 6, 38), index % 2 ? secondaryMaterial : accentMaterial)
          : new THREE.Mesh(new THREE.SphereGeometry(0.12 + seeded(index, 3) * 0.22, 10, 7), primaryMaterial);
      } else if (speciesIndex === 3) {
        piece = new THREE.Mesh(new THREE.CircleGeometry(0.22 + seeded(index, 2) * 0.7, 3), index % 3 ? accentMaterial : secondaryMaterial);
      } else {
        const material = index % 2 ? primaryMaterial : secondaryMaterial;
        piece = new THREE.Mesh(new THREE.BoxGeometry(0.16 + seeded(index, 1), 0.16 + seeded(index, 2), 0.04), material);
      }
      place(piece, index);
    }

    const pivot = new THREE.Group();
    scene.add(pivot);
    let model: THREE.Object3D | null = null;
    getGLTFLoader().then((loader) => loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        model = gltf.scene;
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
        });
        const before = new THREE.Box3().setFromObject(model);
        const size = before.getSize(new THREE.Vector3());
        model.scale.setScalar(4.7 / (Math.max(size.x, size.y, size.z) || 1));
        const after = new THREE.Box3().setFromObject(model);
        model.position.sub(after.getCenter(new THREE.Vector3()));
        pivot.add(model);
        setLoading(false);
      },
      undefined,
      () => setLoading(false),
    ));

    const pointer = new THREE.Vector2();
    let pointerActive = false;
    let pulseUntil = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
      );
      pointerActive = true;
    };
    const onPointerLeave = () => { pointerActive = false; };
    const onPointerDown = () => { pulseUntil = performance.now() + 1200; };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = (now - started) / 1000;
      const pulse = Math.max(0, (pulseUntil - now) / 1200);
      controls.update();
      environment.rotation.y = elapsed * (0.018 + speciesIndex * 0.004);
      environment.rotation.z = Math.sin(elapsed * 0.09) * 0.035;
      environmentPieces.forEach((piece, index) => {
        const phase = piece.userData.phase as number;
        piece.position.y += Math.sin(elapsed * (0.32 + speciesIndex * 0.05) + phase) * 0.0018;
        piece.rotation.z += (index % 2 ? 1 : -1) * 0.0015;
        const bloom = 1 + Math.sin(elapsed * 0.8 + phase) * 0.06 + pulse * 0.13;
        piece.scale.setScalar(bloom);
      });
      if (model) {
        pivot.position.y = Math.sin(elapsed * 0.7) * 0.14;
        pivot.rotation.z = Math.sin(elapsed * 0.31) * 0.06;
        const targetX = pointerActive ? pointer.y * 0.18 : 0;
        const targetY = pointerActive ? pointer.x * 0.28 : 0;
        pivot.rotation.x += (targetX - pivot.rotation.x) * 0.045;
        pivot.rotation.y += (targetY - pivot.rotation.y) * 0.045;
        pivot.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.12);
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [record]);

  return (
    <div className="habitat-scene" ref={mountRef}>
      {loading && <span className="habitat-scene__loading">GENERATING HABITAT…</span>}
    </div>
  );
}
