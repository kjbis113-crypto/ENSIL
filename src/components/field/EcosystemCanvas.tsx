import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getGLTFLoader } from '../../sim3d/gltf';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CREATURE_RECORDS } from '../../data/creatureRecords';
import {
  createFieldRuntimes,
  stepFieldRuntime,
  touchRuntime,
  type FieldRuntime,
  type FieldStimulus,
} from '../../simulation/behaviorMachine';

type FieldSnapshot = Pick<FieldRuntime, 'id' | 'state' | 'energy' | 'stress'>;

type Props = {
  selectedId: string | null;
  observation: boolean;
  paused: boolean;
  onSelect: (id: string | null) => void;
  onEnter: (id: string) => void;
  onProximity: (id: string | null) => void;
  onSnapshot: (snapshot: FieldSnapshot[]) => void;
};

type ActorVisual = {
  root: THREE.Group;
  body: THREE.Group;
  signal: THREE.Group;
  baseScale: number;
  pending: boolean;
};

type HabitatVisual = {
  root: THREE.Group;
  motes: THREE.Points;
  pulseRings: THREE.Mesh[];
  homeX: number;
  homeZ: number;
  phase: number;
};

const ACTOR_SPECIES = ['burrower', 'drifter', 'grazer', 'moth', 'mimic'] as const;

function material(color = 0x292928, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.56,
    metalness: 0.16,
    transparent: opacity < 1,
    opacity,
  });
}

function addMesh(group: THREE.Group, geometry: THREE.BufferGeometry, color?: number) {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function buildProxy(index: number) {
  const group = new THREE.Group();
  if (index === 1) {
    const knot = addMesh(group, new THREE.TorusKnotGeometry(1.5, 0.17, 90, 9, 2, 3), 0x555651);
    knot.rotation.x = Math.PI / 2.8;
    addMesh(group, new THREE.SphereGeometry(0.48, 18, 12), 0x20211f);
  } else if (index === 2) {
    addMesh(group, new THREE.SphereGeometry(1.1, 22, 14), 0xc9c8c1);
    [1.45, 1.85, 2.2].forEach((radius, ringIndex) => {
      const ring = addMesh(group, new THREE.TorusGeometry(radius, 0.065, 6, 56), 0x242423);
      ring.rotation.set(Math.PI / 2 + ringIndex * 0.28, ringIndex * 0.46, 0);
    });
  } else if (index === 3) {
    addMesh(group, new THREE.OctahedronGeometry(0.82, 1), 0x252524);
    const wingGeometry = new THREE.CircleGeometry(1.65, 3);
    const left = addMesh(group, wingGeometry, 0xd8d7d0);
    left.position.x = -1.1;
    left.rotation.y = -0.36;
    const right = addMesh(group, wingGeometry, 0xd8d7d0);
    right.position.x = 1.1;
    right.rotation.y = 0.36;
  } else {
    addMesh(group, new THREE.IcosahedronGeometry(1.42, 1), 0xb9bab5);
    const eye = addMesh(group, new THREE.TorusGeometry(0.75, 0.12, 8, 32), 0x202120);
    eye.rotation.x = Math.PI / 2;
    eye.position.z = 1;
    const pupil = addMesh(group, new THREE.SphereGeometry(0.28, 16, 10), 0x1b1b1a);
    pupil.position.z = 1.18;
  }
  return group;
}

function seeded(index: number, offset: number) {
  return Math.abs(Math.sin((index + 1) * 928.17 + offset * 78.233));
}

function buildHabitat(index: number, primary: string, secondary: string) {
  const root = new THREE.Group();
  const primaryColor = new THREE.Color(primary);
  const secondaryColor = new THREE.Color(secondary);
  const paperColor = primaryColor.clone().lerp(new THREE.Color(0xf5f4ec), 0.72);

  const island = new THREE.Mesh(
    new THREE.CircleGeometry(7.2 + index * 0.45, 56),
    new THREE.MeshStandardMaterial({ color: paperColor, roughness: 0.9, metalness: 0.02 }),
  );
  island.rotation.x = -Math.PI / 2;
  island.scale.set(1.25, 0.82, 1);
  island.receiveShadow = true;
  root.add(island);

  const pulseRings: THREE.Mesh[] = [];
  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    const radius = 4.3 + ringIndex * 1.35;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.065 + ringIndex * 0.018, 72),
      new THREE.MeshBasicMaterial({
        color: ringIndex % 2 ? secondaryColor : primaryColor,
        transparent: true,
        opacity: 0.42 - ringIndex * 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07 + ringIndex * 0.012;
    root.add(ring);
    pulseRings.push(ring);
  }

  for (let pebbleIndex = 0; pebbleIndex < 24; pebbleIndex += 1) {
    const angle = seeded(index, pebbleIndex) * Math.PI * 2;
    const radius = 2.7 + seeded(index + 7, pebbleIndex) * 4.2;
    const height = 0.12 + seeded(index + 11, pebbleIndex) * 0.55;
    const pebble = new THREE.Mesh(
      pebbleIndex % 4 === 0
        ? new THREE.ConeGeometry(0.12 + height * 0.18, 0.5 + height * 1.8, 5)
        : new THREE.DodecahedronGeometry(0.1 + height * 0.2, 0),
      new THREE.MeshStandardMaterial({
        color: pebbleIndex % 3 ? secondaryColor : primaryColor,
        roughness: 0.72,
        metalness: pebbleIndex % 5 === 0 ? 0.55 : 0.08,
      }),
    );
    pebble.position.set(Math.cos(angle) * radius, height * 0.65, Math.sin(angle) * radius * 0.72);
    pebble.rotation.set(seeded(index, pebbleIndex + 31), angle, seeded(index, pebbleIndex + 48));
    root.add(pebble);
  }

  if (index === 0) {
    for (let i = 0; i < 7; i += 1) {
      const tunnel = new THREE.Mesh(
        new THREE.TorusGeometry(1.15 + i * 0.28, 0.085, 6, 28, Math.PI * 1.1),
        new THREE.MeshStandardMaterial({ color: i % 2 ? primaryColor : secondaryColor, roughness: 0.48, metalness: 0.46 }),
      );
      tunnel.position.set(-2.5 + i * 0.82, 0.58 + (i % 2) * 0.22, -1.1 + Math.sin(i) * 0.5);
      tunnel.rotation.set(0, i * 0.42, 0);
      root.add(tunnel);
    }
  } else if (index === 1) {
    for (let i = 0; i < 9; i += 1) {
      const strand = new THREE.Mesh(
        new THREE.TorusGeometry(1.6 + (i % 3) * 0.42, 0.045, 5, 34, Math.PI * 1.4),
        new THREE.MeshBasicMaterial({ color: i % 2 ? primaryColor : secondaryColor }),
      );
      strand.position.set((i % 3 - 1) * 2.1, 1.35 + Math.floor(i / 3) * 0.8, (Math.floor(i / 3) - 1) * 1.4);
      strand.rotation.set(Math.PI / 2, i * 0.55, Math.PI / 2);
      root.add(strand);
    }
  } else if (index === 2) {
    for (let i = 0; i < 18; i += 1) {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.065, 1.2 + (i % 5) * 0.48, 5),
        new THREE.MeshStandardMaterial({ color: i % 3 ? secondaryColor : primaryColor, roughness: 0.62 }),
      );
      const a = (i / 18) * Math.PI * 2;
      stalk.position.set(Math.cos(a) * (2.2 + (i % 4) * 0.68), stalk.geometry.parameters.height * 0.5, Math.sin(a) * (1.8 + (i % 3) * 0.5));
      stalk.rotation.z = Math.sin(i * 1.7) * 0.22;
      root.add(stalk);
    }
  } else if (index === 3) {
    for (let i = 0; i < 12; i += 1) {
      const mast = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.1 + (i % 4) * 0.55, 6), new THREE.MeshBasicMaterial({ color: secondaryColor }));
      stem.position.y = 1.1 + (i % 4) * 0.275;
      mast.add(stem);
      const receiver = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.38 + (i % 3) * 0.11, 18), new THREE.MeshBasicMaterial({ color: primaryColor, side: THREE.DoubleSide }));
      receiver.position.y = 2.25 + (i % 4) * 0.55;
      receiver.rotation.x = -Math.PI / 2;
      mast.add(receiver);
      const a = (i / 12) * Math.PI * 2;
      mast.position.set(Math.cos(a) * (3.1 + (i % 2)), 0, Math.sin(a) * (2.3 + (i % 3) * 0.4));
      root.add(mast);
    }
  } else {
    for (let i = 0; i < 14; i += 1) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.8 + (i % 4) * 0.35, 0.07, 0.45 + (i % 3) * 0.3),
        new THREE.MeshStandardMaterial({ color: i % 2 ? primaryColor : secondaryColor, roughness: 0.28, metalness: 0.72 }),
      );
      const a = (i / 14) * Math.PI * 2;
      plate.position.set(Math.cos(a) * (2.4 + (i % 4)), 0.24 + (i % 3) * 0.22, Math.sin(a) * (2 + (i % 3) * 0.55));
      plate.rotation.set(i * 0.13, -a, i * 0.21);
      root.add(plate);
    }
  }

  const motePositions = new Float32Array(52 * 3);
  for (let i = 0; i < 52; i += 1) {
    const a = seeded(index + 13, i) * Math.PI * 2;
    const r = 1.4 + seeded(index + 19, i) * 5.9;
    motePositions[i * 3] = Math.cos(a) * r;
    motePositions[i * 3 + 1] = 0.3 + seeded(index + 23, i) * 3.6;
    motePositions[i * 3 + 2] = Math.sin(a) * r * 0.78;
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: primaryColor, size: 0.13, transparent: true, opacity: 0.68, depthWrite: false }));
  root.add(motes);

  return { root, motes, pulseRings };
}

export function EcosystemCanvas({ selectedId, observation, paused, onSelect, onEnter, onProximity, onSnapshot }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ selectedId, observation, paused, onSelect, onEnter, onProximity, onSnapshot });
  propsRef.current = { selectedId, observation, paused, onSelect, onEnter, onProximity, onSnapshot };
  const liveModelCount = CREATURE_RECORDS.filter((record) => record.modelUrl).length;
  const [loadedModels, setLoadedModels] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9eee6);
    scene.fog = new THREE.Fog(0xe9eee6, 82, 148);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 220);
    camera.position.set(0, 43, 56);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedMotion ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !reducedMotion;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045;
    controls.enablePan = false;
    controls.minDistance = 38;
    controls.maxDistance = 88;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.rotateSpeed = 0.32;
    controls.zoomSpeed = 0.52;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc7c6be, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-18, 48, 24);
    sun.castShadow = !reducedMotion;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb8bdc0, 1.1);
    fill.position.set(32, 18, -22);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(92, 66),
      new THREE.MeshStandardMaterial({ color: 0xe5eae1, roughness: 0.96, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const observationGroup = new THREE.Group();
    const grid = new THREE.GridHelper(92, 24, 0x666662, 0xd1d1cb);
    grid.scale.z = 0.72;
    observationGroup.add(grid);
    scene.add(observationGroup);

    const runtimes = createFieldRuntimes(CREATURE_RECORDS);
    const ecologyRoot = new THREE.Group();
    scene.add(ecologyRoot);
    const habitatVisuals: HabitatVisual[] = CREATURE_RECORDS.map((record, index) => {
      const habitat = buildHabitat(index, record.palette.primary, record.palette.secondary);
      habitat.root.position.set(runtimes[index].home.x, 0.025, runtimes[index].home.z);
      ecologyRoot.add(habitat.root);
      return {
        ...habitat,
        homeX: runtimes[index].home.x,
        homeZ: runtimes[index].home.z,
        phase: index * 1.37,
      };
    });

    const substratePositions = new Float32Array(170 * 3);
    const substrateColors = new Float32Array(170 * 3);
    for (let i = 0; i < 170; i += 1) {
      substratePositions[i * 3] = -43 + seeded(31, i) * 86;
      substratePositions[i * 3 + 1] = 0.085 + seeded(37, i) * 0.08;
      substratePositions[i * 3 + 2] = -29 + seeded(41, i) * 58;
      const color = new THREE.Color(CREATURE_RECORDS[i % CREATURE_RECORDS.length].palette.primary).lerp(new THREE.Color(0x26302a), 0.35);
      substrateColors[i * 3] = color.r;
      substrateColors[i * 3 + 1] = color.g;
      substrateColors[i * 3 + 2] = color.b;
    }
    const substrateGeometry = new THREE.BufferGeometry();
    substrateGeometry.setAttribute('position', new THREE.BufferAttribute(substratePositions, 3));
    substrateGeometry.setAttribute('color', new THREE.BufferAttribute(substrateColors, 3));
    const substrate = new THREE.Points(
      substrateGeometry,
      new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false }),
    );
    ecologyRoot.add(substrate);

    const visuals = new Map<string, ActorVisual>();
    const pickables: THREE.Object3D[] = [];

    for (let index = 0; index < CREATURE_RECORDS.length; index += 1) {
      const record = CREATURE_RECORDS[index];
      const root = new THREE.Group();
      root.userData.creatureId = record.id;
      const body = new THREE.Group();
      const signal = new THREE.Group();
      const signalColor = new THREE.Color(record.palette.primary);
      const signalAccent = new THREE.Color(record.palette.secondary);
      const plate = new THREE.Mesh(
        new THREE.CircleGeometry(3.7 + index * 0.24, 48),
        new THREE.MeshBasicMaterial({ color: signalColor, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide }),
      );
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = 0.035;
      plate.userData.isSignal = true;
      signal.add(plate);
      const printRing = new THREE.Mesh(
        new THREE.RingGeometry(4.15 + index * 0.18, 4.24 + index * 0.18, 64),
        new THREE.MeshBasicMaterial({ color: signalAccent, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide }),
      );
      printRing.rotation.x = -Math.PI / 2;
      printRing.position.y = 0.05;
      printRing.userData.isSignal = true;
      signal.add(printRing);
      for (let dotIndex = 0; dotIndex < 7; dotIndex += 1) {
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.11 + (dotIndex % 3) * 0.055, 10),
          new THREE.MeshBasicMaterial({ color: dotIndex % 2 ? signalAccent : signalColor, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
        );
        const angle = (dotIndex / 7) * Math.PI * 2;
        dot.position.set(Math.cos(angle) * (4.65 + (dotIndex % 2) * 0.55), 0.06, Math.sin(angle) * (4.65 + (dotIndex % 2) * 0.55));
        dot.rotation.x = -Math.PI / 2;
        dot.userData.isSignal = true;
        signal.add(dot);
      }
      const proxy = index === 0 ? buildProxy(4) : buildProxy(index);
      proxy.userData.proxy = true;
      body.add(proxy);
      root.add(signal);
      root.add(body);
      root.position.set(runtimes[index].position.x, 0.9, runtimes[index].position.z);
      scene.add(root);
      pickables.push(root);
      visuals.set(record.id, { root, body, signal, baseScale: index === 0 ? 1.25 : 1.35, pending: index !== 0 });
    }

    const networkPairs = [[0, 1], [1, 3], [3, 4], [4, 2], [2, 0], [0, 4], [1, 2]];
    const networkPositions = new Float32Array(networkPairs.length * 2 * 3);
    const networkGeometry = new THREE.BufferGeometry();
    networkGeometry.setAttribute('position', new THREE.BufferAttribute(networkPositions, 3));
    const network = new THREE.LineSegments(
      networkGeometry,
      new THREE.LineDashedMaterial({ color: 0x4d5751, transparent: true, opacity: 0.34, dashSize: 0.52, gapSize: 0.36 }),
    );
    network.computeLineDistances();
    ecologyRoot.add(network);

    const pointerRipples = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.65 + i * 0.75, 0.7 + i * 0.75, 44),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff5d32 : 0x2457ff, transparent: true, opacity: 0.34 - i * 0.08, depthWrite: false, side: THREE.DoubleSide }),
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.11;
      pointerRipples.add(ripple);
    }
    pointerRipples.visible = false;
    scene.add(pointerRipples);

    let completedModels = 0;
    const completeModel = () => {
      completedModels += 1;
      setLoadedModels(completedModels);
    };

    getGLTFLoader().then((loader) => CREATURE_RECORDS.forEach((record, index) => {
      if (!record.modelUrl) return;
      loader.load(
        record.modelUrl,
        (gltf) => {
          const visual = visuals.get(record.id);
          if (!visual) return;
          const model = gltf.scene;
          model.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.creatureId = record.id;
          });
          const initialBox = new THREE.Box3().setFromObject(model);
          const size = initialBox.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z) || 1;
          model.scale.setScalar((index === 0 ? 8.4 : 7.4) / maxDimension);
          const fitted = new THREE.Box3().setFromObject(model);
          const center = fitted.getCenter(new THREE.Vector3());
          model.position.set(-center.x, -fitted.min.y, -center.z);
          visual.body.clear();
          visual.body.add(model);
          visual.body.position.y = 0;
          visual.baseScale = 1;
          visual.pending = false;
          completeModel();
        },
        undefined,
        completeModel,
      );
    }));

    const selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 2.86, 64),
      new THREE.MeshBasicMaterial({ color: 0x171717, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }),
    );
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.045;
    selectionRing.visible = false;
    scene.add(selectionRing);

    const foodGroup = new THREE.Group();
    scene.add(foodGroup);
    const foodNodes: Array<{ mesh: THREE.Mesh; expiresAt: number }> = [];

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointerWorld = new THREE.Vector3(0, 0, 0);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const stimulus: FieldStimulus = { active: false, x: 0, z: 0, speed: 0, attracting: false, now: 0 };
    let lastPointer = { x: 0, y: 0, time: performance.now() };
    let down = { x: 0, y: 0, time: 0 };
    let longPressTimer = 0;

    let worldXScale = 1;
    const updatePointerWorld = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.set(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, camera);
      raycaster.ray.intersectPlane(groundPlane, pointerWorld);
      stimulus.x = pointerWorld.x / worldXScale;
      stimulus.z = pointerWorld.z;
      stimulus.active = true;
      const now = performance.now();
      stimulus.speed = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) / Math.max(now - lastPointer.time, 1);
      lastPointer = { x: event.clientX, y: event.clientY, time: now };
    };

    const pickCreature = () => {
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(pickables, true)[0];
      let target: THREE.Object3D | null = hit?.object ?? null;
      while (target && !target.userData.creatureId) target = target.parent;
      return target?.userData.creatureId as string | undefined;
    };

    const onPointerMove = (event: PointerEvent) => updatePointerWorld(event);
    const onPointerLeave = () => {
      stimulus.active = false;
      stimulus.attracting = false;
      propsRef.current.onProximity(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      updatePointerWorld(event);
      down = { x: event.clientX, y: event.clientY, time: performance.now() };
      window.clearTimeout(longPressTimer);
      longPressTimer = window.setTimeout(() => { stimulus.attracting = true; }, 460);
    };
    const onPointerUp = (event: PointerEvent) => {
      window.clearTimeout(longPressTimer);
      stimulus.attracting = false;
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
      const id = pickCreature();
      if (id) {
        const runtime = runtimes.find((candidate) => candidate.id === id);
        if (runtime) touchRuntime(runtime, performance.now() / 1000);
        propsRef.current.onEnter(id);
      } else {
        propsRef.current.onSelect(null);
      }
    };
    const onDoubleClick = () => {
      if (pickCreature()) return;
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a19, roughness: 0.4 }),
      );
      node.position.copy(pointerWorld);
      node.position.y = 0.28;
      foodGroup.add(node);
      foodNodes.push({ mesh: node, expiresAt: performance.now() + 7200 });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const currentIndex = Math.max(0, CREATURE_RECORDS.findIndex((record) => record.id === propsRef.current.selectedId));
      if (event.key === 'Tab') {
        event.preventDefault();
        propsRef.current.onSelect(CREATURE_RECORDS[(currentIndex + 1) % CREATURE_RECORDS.length].id);
      } else if (event.key === 'Enter' && propsRef.current.selectedId) {
        const runtime = runtimes.find((candidate) => candidate.id === propsRef.current.selectedId);
        if (runtime) touchRuntime(runtime, performance.now() / 1000);
      } else if (event.key === 'Escape') {
        propsRef.current.onSelect(null);
      } else if (event.key.startsWith('Arrow')) {
        const x = event.key === 'ArrowLeft' ? -2 : event.key === 'ArrowRight' ? 2 : 0;
        const z = event.key === 'ArrowUp' ? -2 : event.key === 'ArrowDown' ? 2 : 0;
        controls.target.x += x;
        controls.target.z += z;
        event.preventDefault();
      }
    };

    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Five autonomous electronic organisms. Drag to orbit, scroll to zoom, and click a creature to enter its habitat.');
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.addEventListener('keydown', onKeyDown);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      worldXScale = camera.aspect < 0.6 ? 0.3 : camera.aspect < 0.85 ? 0.42 : camera.aspect < 1.2 ? 0.66 : camera.aspect < 1.45 ? 0.78 : 0.86;
      if (camera.aspect < 0.85) camera.position.set(0, 58, 73);
      else camera.position.set(0, 43, 56);
      habitatVisuals.forEach((habitat) => {
        habitat.root.position.x = habitat.homeX * worldXScale;
      });
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frameId = 0;
    let lastTime = performance.now();
    let lastSnapshot = 0;
    let lastProximityCheck = 0;
    let proximityId: string | null = null;
    const projectedPosition = new THREE.Vector3();
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      stimulus.now = now / 1000;

      if (!propsRef.current.paused && document.visibilityState === 'visible') {
        for (let index = 0; index < runtimes.length; index += 1) {
          const runtime = runtimes[index];
          const record = CREATURE_RECORDS[index];
          stepFieldRuntime(runtime, record, runtimes, stimulus, reducedMotion ? dt * 0.35 : dt);
          const visual = visuals.get(runtime.id);
          if (!visual) continue;
          visual.root.position.x += (runtime.position.x * worldXScale - visual.root.position.x) * 0.08;
          visual.root.position.z += (runtime.position.z - visual.root.position.z) * 0.08;
          const velocity = Math.hypot(runtime.velocity.x, runtime.velocity.z);
          if (velocity > 0.02) visual.root.rotation.y = Math.atan2(runtime.velocity.x, runtime.velocity.z);
          const breath = 1 + Math.sin(runtime.phase * 2.1) * (runtime.state === 'rest' ? 0.012 : 0.026);
          const startled = runtime.state === 'startled' ? 0.88 + Math.sin(now * 0.045) * 0.04 : 1;
          visual.body.scale.setScalar(visual.baseScale * breath * startled);
          visual.body.position.y = Math.sin(runtime.phase * 1.4) * 0.22 + (runtime.state === 'curious' ? 0.24 : 0);
          visual.signal.rotation.y = runtime.phase * (0.08 + index * 0.012);
          const signalPulse = 1 + Math.sin(runtime.phase * 1.3) * 0.045 + (runtime.state === 'curious' ? 0.08 : 0);
          visual.signal.scale.setScalar(signalPulse);
          if (ACTOR_SPECIES[index] === 'moth') visual.body.rotation.z = Math.sin(runtime.phase * 3.4) * 0.18;
          visual.root.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            if (child.userData.isSignal) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if ('opacity' in mat) {
                mat.transparent = runtime.id !== propsRef.current.selectedId && propsRef.current.selectedId !== null;
                mat.opacity = runtime.id !== propsRef.current.selectedId && propsRef.current.selectedId !== null ? 0.48 : 1;
              }
            });
          });
        }
      }

      habitatVisuals.forEach((habitat, index) => {
        const runtime = runtimes[index];
        const activity = runtime.state === 'startled' ? 1.22 : runtime.state === 'curious' || runtime.state === 'social' ? 1.1 : 1;
        habitat.motes.rotation.y += dt * (0.12 + index * 0.025) * activity;
        habitat.motes.position.y = Math.sin(now * 0.00065 + habitat.phase) * 0.22;
        habitat.pulseRings.forEach((ring, ringIndex) => {
          const wave = 1 + Math.sin(now * (0.00055 + ringIndex * 0.00014) + habitat.phase) * (0.035 + ringIndex * 0.014);
          ring.scale.setScalar(wave * activity);
          const ringMaterial = ring.material as THREE.MeshBasicMaterial;
          ringMaterial.opacity = (0.35 - ringIndex * 0.065) * (runtime.state === 'rest' ? 0.55 : 1);
        });
      });

      networkPairs.forEach(([from, to], pairIndex) => {
        const source = visuals.get(CREATURE_RECORDS[from].id)?.root.position;
        const target = visuals.get(CREATURE_RECORDS[to].id)?.root.position;
        if (!source || !target) return;
        const offset = pairIndex * 6;
        networkPositions[offset] = source.x;
        networkPositions[offset + 1] = 0.16;
        networkPositions[offset + 2] = source.z;
        networkPositions[offset + 3] = target.x;
        networkPositions[offset + 4] = 0.16;
        networkPositions[offset + 5] = target.z;
      });
      (networkGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      if (Math.round(now / 250) % 2 === 0) network.computeLineDistances();
      network.material.opacity = 0.24 + Math.sin(now * 0.0011) * 0.08;

      pointerRipples.visible = stimulus.active;
      if (stimulus.active) {
        pointerRipples.position.set(pointerWorld.x, 0, pointerWorld.z);
        pointerRipples.children.forEach((child, index) => {
          const cycle = (now * 0.0007 + index * 0.28) % 1;
          child.scale.setScalar(0.7 + cycle * 1.9);
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - cycle) * 0.3;
        });
      }

      observationGroup.visible = propsRef.current.observation;
      const selectedVisual = propsRef.current.selectedId ? visuals.get(propsRef.current.selectedId) : undefined;
      selectionRing.visible = Boolean(selectedVisual);
      if (selectedVisual) {
        selectionRing.position.x = selectedVisual.root.position.x;
        selectionRing.position.z = selectedVisual.root.position.z;
      }

      if (now - lastProximityCheck > 90) {
        lastProximityCheck = now;
        let nextProximity: string | null = null;
        if (stimulus.active) {
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (const runtime of runtimes) {
            const visual = visuals.get(runtime.id);
            if (!visual) continue;
            projectedPosition.copy(visual.root.position);
            projectedPosition.y += 2.4;
            projectedPosition.project(camera);
            const distance = Math.hypot(
              (projectedPosition.x - pointerNdc.x) * renderer.domElement.clientWidth * 0.5,
              (projectedPosition.y - pointerNdc.y) * renderer.domElement.clientHeight * 0.5,
            );
            const threshold = runtime.id === proximityId ? 145 : 105;
            if (distance < threshold && distance < nearestDistance) {
              nearestDistance = distance;
              nextProximity = runtime.id;
            }
          }
        }
        if (nextProximity !== proximityId) {
          proximityId = nextProximity;
          propsRef.current.onProximity(proximityId);
        }
      }

      for (let index = foodNodes.length - 1; index >= 0; index -= 1) {
        const node = foodNodes[index];
        node.mesh.position.y = 0.28 + Math.sin(now * 0.003 + index) * 0.08;
        if (node.expiresAt < now) {
          foodGroup.remove(node.mesh);
          node.mesh.geometry.dispose();
          (node.mesh.material as THREE.Material).dispose();
          foodNodes.splice(index, 1);
        }
      }

      if (now - lastSnapshot > 280) {
        lastSnapshot = now;
        propsRef.current.onSnapshot(runtimes.map(({ id, state, energy, stress }) => ({ id, state, energy, stress })));
      }

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(longPressTimer);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      renderer.domElement.removeEventListener('keydown', onKeyDown);
      controls.dispose();
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => mat?.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="ecosystem-canvas" ref={mountRef}>
      {loadedModels < liveModelCount && (
        <span className="ecosystem-loading">BODIES ENTERING FIELD / {loadedModels.toString().padStart(2, '0')}—{liveModelCount.toString().padStart(2, '0')}</span>
      )}
    </div>
  );
}
