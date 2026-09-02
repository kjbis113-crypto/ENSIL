import * as THREE from 'three';
import type { Species } from '../types/creature';

/**
 * 종(전자부품)별 3D 목업 — 실제 에셋이 나오기 전의 프리미티브 조합.
 * ENSIL live palette: paper-white bodies, black technical edges, living signal accents.
 * 에셋이 나오면 buildSpeciesMesh의 케이스만 GLTF 로드로 교체한다.
 * React를 모른다 — 렌더러(ThreeStage)에서만 사용.
 */

const BODY = 0x5fa48d;
const DARK = 0x171818;
const EDGE = 0x73d2be;
const SIGNAL: Record<Species, number> = {
  mcu: 0x73d2be,
  led: 0x73d2be,
  transistor: 0x5fa48d,
  resistor: 0x545756,
  capacitor: 0x5fa48d,
  switch: 0x545756,
};

function part(geo: THREE.BufferGeometry, color = BODY): THREE.Group {
  const g = new THREE.Group();
  const isSignal = color !== BODY && color !== DARK;
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: isSignal ? color : 0x000000,
    emissiveIntensity: isSignal ? 0.34 : 0,
    metalness: isSignal ? 0.28 : 0.62,
    roughness: isSignal ? 0.42 : 0.58,
    transparent: true,
  });
  g.add(new THREE.Mesh(geo, mat));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 25),
    new THREE.LineBasicMaterial({ color: EDGE, transparent: true }),
  );
  g.add(edges);
  return g;
}

function at(obj: THREE.Object3D, x: number, y: number, z: number, ry = 0, rz = 0): THREE.Object3D {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  obj.rotation.z = rz;
  return obj;
}

export function buildSpeciesMesh(species: Species): THREE.Group {
  const g = new THREE.Group();
  const signal = SIGNAL[species];
  switch (species) {
    case 'mcu': {
      g.add(at(part(new THREE.BoxGeometry(4, 0.7, 3)), 0, 0.35, 0));
      g.add(at(part(new THREE.BoxGeometry(1.6, 0.5, 1.6), signal), 0, 0.95, 0));
      // 핀 4개
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        g.add(at(part(new THREE.BoxGeometry(0.25, 0.5, 0.25), DARK), sx * 1.6, 0.25, sz * 1.1));
      }
      break;
    }
    case 'led': {
      g.add(at(part(new THREE.CylinderGeometry(0.85, 0.85, 1.1, 16)), 0, 1.4, 0));
      g.add(at(part(new THREE.SphereGeometry(0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), signal), 0, 1.95, 0));
      // 다리 2개
      g.add(at(part(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 6), DARK), -0.35, 0.55, 0));
      g.add(at(part(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), DARK), 0.35, 0.4, 0));
      break;
    }
    case 'transistor': {
      // TO-92 몸통 (원통 + 평면 컷 느낌은 박스로)
      g.add(at(part(new THREE.CylinderGeometry(1.1, 1.1, 1.9, 20)), 0, 1.6, 0));
      g.add(at(part(new THREE.BoxGeometry(2.2, 1.9, 0.5), signal), 0, 1.6, -0.85));
      for (const sx of [-0.7, 0, 0.7]) {
        g.add(at(part(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 6), DARK), sx, 0.45, 0));
      }
      break;
    }
    case 'resistor': {
      const body = part(new THREE.CapsuleGeometry(0.7, 2.2, 6, 12));
      body.rotation.z = Math.PI / 2;
      g.add(at(body, 0, 0.9, 0));
      // 리드선
      const wire = part(new THREE.CylinderGeometry(0.07, 0.07, 5.6, 6), DARK);
      wire.rotation.z = Math.PI / 2;
      g.add(at(wire, 0, 0.9, 0));
      // 밴드 2개
      for (const sx of [-0.6, 0.4]) {
        const band = part(new THREE.CylinderGeometry(0.74, 0.74, 0.3, 12), signal);
        band.rotation.z = Math.PI / 2;
        g.add(at(band, sx, 0.9, 0));
      }
      break;
    }
    case 'capacitor': {
      g.add(at(part(new THREE.CylinderGeometry(1, 1, 2.6, 18)), 0, 1.8, 0));
      g.add(at(part(new THREE.CylinderGeometry(1.02, 1.02, 0.35, 18), signal), 0, 2.85, 0));
      g.add(at(part(new THREE.CylinderGeometry(0.09, 0.09, 1, 6), DARK), -0.4, 0.25, 0));
      g.add(at(part(new THREE.CylinderGeometry(0.09, 0.09, 1, 6), DARK), 0.4, 0.25, 0));
      break;
    }
    case 'switch': {
      g.add(at(part(new THREE.BoxGeometry(2.6, 1, 1.6)), 0, 0.5, 0));
      // 레버
      const lever = part(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 8), signal);
      lever.rotation.z = -0.5;
      g.add(at(lever, 0.4, 1.6, 0));
      break;
    }
  }
  return g;
}

export function buildNodeMesh(): THREE.Group {
  // 에너지 노드 ⊙ — 납작한 링 + 중심점 (엣지 없이 가볍게)
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x73d2be,
    emissive: 0x73d2be,
    emissiveIntensity: 0.72,
    roughness: 0.36,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 28), mat);
  ring.rotation.x = -Math.PI / 2;
  g.add(at(ring, 0, 0.15, 0));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat), 0, 0.4, 0));
  return g;
}

export function buildSelectRing(): THREE.Mesh {
  const geo = new THREE.RingGeometry(2.6, 3.0, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0x73d2be, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  return m;
}

/** 그룹 전체 투명도 (선택 외 개체 흐리기). 스프라이트는 건드리지 않는다 —
    transparent를 끄면 라벨 알파가 무시되어 검은 상자가 된다 (debug.md #8) */
export function setGroupOpacity(g: THREE.Object3D, opacity: number) {
  g.traverse((o) => {
    if ((o as THREE.Sprite).isSprite) return;
    const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (mat && 'opacity' in mat) {
      mat.opacity = opacity;
      mat.transparent = opacity < 1;
    }
  });
}

/** 코드·상태 라벨 스프라이트 (캔버스 텍스트) */
export function makeLabelSprite(): { sprite: THREE.Sprite; setText: (t: string) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 2;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(10, 2.5, 1);
  let last = '';
  const setText = (t: string) => {
    if (t === last) return;
    last = t;
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = '400 24px "Arial Narrow", Arial, "KoPub World Dotum", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#73D2BE';
    ctx.fillText(t, 128, 32);
    tex.needsUpdate = true;
  };
  return { sprite, setText };
}
