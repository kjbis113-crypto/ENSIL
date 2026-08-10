import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * creature.glb 공용 로더 — 시뮬레이터(ThreeStage)와 표본 뷰(SpecimenModel)가 같이 쓴다.
 * 원본은 1회만 로드해 캐시하고, 화면에는 cloneCreature()로 복제해서 올린다.
 * 클론은 지오메트리·텍스처를 원본과 공유한다 — 씬 정리 때 지오메트리를 dispose하면
 * 캐시가 죽으므로, 클론 메시에 userData.sharedGeo 표시를 남긴다.
 */

let cached: Promise<THREE.Group> | null = null;

/** 정규화된 원본: 최대 변 1유닛, 바닥(y=0)에 안착, XZ 중심 원점 */
export function loadCreatureModel(): Promise<THREE.Group> {
  if (!cached) {
    const url = `${import.meta.env.BASE_URL}models/creature.glb`;
    // meshopt 디코더는 public/에서 런타임 로드 — 번들에 넣거나 import() 구문을 쓰면
    // wasm-rollup이 네이티브 크래시한다 (debug.md #1 계열). new Function으로 rollup 눈을 피한다.
    const decoderUrl = `${import.meta.env.BASE_URL}decoders/meshopt_decoder.module.js`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<{ MeshoptDecoder: any }>;
    cached = dynImport(decoderUrl).then(({ MeshoptDecoder }) => {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder); // EXT_meshopt_compression (압축 GLB)
      return loader.loadAsync(url);
    }).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y, -center.z);
      const norm = new THREE.Group();
      norm.add(root);
      norm.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 1e-6));
      return norm;
    });
  }
  return cached;
}

/** 개체별 인스턴스 — 재질만 복제(개별 투명도 조절용), 지오메트리·텍스처는 공유 */
export function cloneCreature(model: THREE.Group, targetSize: number): THREE.Group {
  const inst = model.clone(true);
  inst.scale.multiplyScalar(targetSize);
  inst.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.userData.sharedGeo = true;
      m.material = Array.isArray(m.material)
        ? m.material.map((mat) => mat.clone())
        : (m.material as THREE.Material).clone();
    }
  });
  return inst;
}
