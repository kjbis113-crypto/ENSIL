"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SpeciesId } from "../../data/species";

type VisualProps = {
  growth?: number;
  reduced?: boolean;
  signal?: number;
  isolated?: boolean;
};

const clearMaterial = {
  color: "#dfe8f2",
  roughness: 0.08,
  metalness: 0.02,
  transmission: 0.64,
  thickness: 0.8,
  transparent: true,
  opacity: 0.58,
  ior: 1.36,
};

function Tube({
  points,
  radius,
  color,
  emissive = "#000000",
  opacity = 1,
}: {
  points: THREE.Vector3[];
  radius: number;
  color: string;
  emissive?: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 44, radius, 8, false),
    [points, radius],
  );
  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissive === "#000000" ? 0 : 1.4}
        roughness={0.24}
        metalness={0.16}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function KeycapCrustacean({ growth = 0, reduced = false, signal = 0 }: VisualProps) {
  const root = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Mesh>(null);
  const keys = Array.from({ length: Math.min(11, 8 + growth) });
  const tailPoints = useMemo(
    () => [
      new THREE.Vector3(-0.25, -0.28, -0.02),
      new THREE.Vector3(-0.82, -0.58, 0.04),
      new THREE.Vector3(-1.46, -0.48, 0.12),
      new THREE.Vector3(-1.72, -0.12, 0.18),
      new THREE.Vector3(-1.38, 0.08, 0.22),
    ],
    [],
  );

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime * (reduced ? 0.28 : 1);
    if (root.current) {
      root.current.rotation.z = Math.sin(t * 1.2) * 0.045;
      root.current.scale.y = THREE.MathUtils.damp(root.current.scale.y, 1 - signal * 0.11, 7, delta);
      root.current.scale.x = THREE.MathUtils.damp(root.current.scale.x, 1 + signal * 0.07, 7, delta);
    }
    if (heart.current) {
      const pulse = 0.82 + Math.sin(t * 4.4) * 0.11 + signal * 0.3;
      heart.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={root} rotation={[0.12, -0.18, -0.08]}>
      <mesh castShadow scale={[1.05, 0.66, 0.62]}>
        <sphereGeometry args={[0.76, 48, 32]} />
        <meshPhysicalMaterial {...clearMaterial} />
      </mesh>
      <mesh position={[0.22, 0.02, 0.16]} rotation={[0.5, 0.2, 0]} castShadow>
        <torusGeometry args={[0.34, 0.08, 16, 48]} />
        <meshPhysicalMaterial color="#e9eef4" roughness={0.16} metalness={0.24} />
      </mesh>
      <mesh ref={heart} position={[-0.02, -0.03, 0.06]} castShadow>
        <octahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color="#1a2140" emissive="#6a5bff" emissiveIntensity={2 + signal * 3} roughness={0.22} />
      </mesh>
      {keys.map((_, index) => {
        const angle = -1.02 + index * 0.26;
        return (
          <RoundedBox
            key={index}
            args={[0.36, 0.36, 0.26]}
            radius={0.055}
            smoothness={3}
            position={[0.3 + Math.cos(angle) * 0.72, 0.08 + Math.sin(angle) * 0.62, 0.33]}
            rotation={[0.12, -angle * 0.15, angle + Math.PI / 2]}
            castShadow
          >
            <meshPhysicalMaterial color={index % 4 === 1 ? "#d7d9dd" : "#f4f4f0"} roughness={0.21} metalness={0.02} />
          </RoundedBox>
        );
      })}
      <Tube points={tailPoints} radius={0.105} color="#dce5ec" opacity={0.78} />
      <Tube
        points={tailPoints.map((point) => point.clone().add(new THREE.Vector3(0, 0, 0.025)))}
        radius={0.025}
        color="#262a44"
        emissive="#3c5cff"
      />
      <group position={[-1.48, 0.12, 0.22]} rotation={[0, 0, 0.28]}>
        <RoundedBox args={[0.45, 0.25, 0.16]} radius={0.035} smoothness={2} castShadow>
          <meshStandardMaterial color="#aeb7bf" metalness={0.72} roughness={0.24} />
        </RoundedBox>
        {[0, 1, 2, 3].map((pin) => (
          <mesh key={pin} position={[-0.12 + pin * 0.08, 0.02, 0.09]}>
            <boxGeometry args={[0.045, 0.13, 0.018]} />
            <meshStandardMaterial color="#d6b85e" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CableTendril({ growth = 0, reduced = false, signal = 0 }: VisualProps) {
  const root = useRef<THREE.Group>(null);
  const limbs = useRef<Array<THREE.Group | null>>([]);
  const count = Math.min(8, 5 + growth);
  const curves = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(angle) * 0.52, Math.sin(angle) * 0.5, Math.sin(angle * 2) * 0.14),
          new THREE.Vector3(Math.cos(angle + 0.2) * 1.12, Math.sin(angle + 0.2) * 0.9, Math.cos(angle) * 0.28),
        ];
      }),
    [count],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (reduced ? 0.22 : 1);
    if (root.current) root.current.rotation.y = Math.sin(t * 0.42) * 0.18;
    limbs.current.forEach((limb, index) => {
      if (!limb) return;
      limb.rotation.z = Math.sin(t * 0.92 - index * 0.72) * (0.08 + signal * 0.06);
      limb.scale.x = 0.96 + Math.sin(t * 1.14 + index) * 0.05 + signal * 0.08;
    });
  });

  return (
    <group ref={root}>
      <mesh castShadow scale={[0.85, 0.72, 0.56]}>
        <icosahedronGeometry args={[0.55, 3]} />
        <meshPhysicalMaterial {...clearMaterial} color="#d8e8ff" />
      </mesh>
      <RoundedBox args={[0.62, 0.35, 0.12]} radius={0.04} smoothness={2} rotation={[0.3, 0.18, -0.16]} castShadow>
        <meshStandardMaterial color="#234a3d" metalness={0.28} roughness={0.48} />
      </RoundedBox>
      {[[-0.2, 0], [0, 0.08], [0.2, -0.05]].map(([x, y], index) => (
        <mesh key={index} position={[x, y, 0.12]}>
          <boxGeometry args={[0.09, 0.07, 0.055]} />
          <meshStandardMaterial color="#b8ff28" emissive="#88c700" emissiveIntensity={0.5 + signal * 2} />
        </mesh>
      ))}
      {curves.map((points, index) => (
        <group key={index} ref={(node) => { limbs.current[index] = node; }}>
          <Tube points={points} radius={index % 2 ? 0.042 : 0.055} color={index % 2 ? "#d8895f" : "#304cff"} />
          <RoundedBox
            args={[0.24, 0.18, 0.14]}
            radius={0.03}
            smoothness={2}
            position={points[2].toArray()}
            rotation={[0.1, 0.2, Math.atan2(points[2].y, points[2].x)]}
            castShadow
          >
            <meshStandardMaterial color="#d7dde1" metalness={0.5} roughness={0.25} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function ResonanceBloom({ growth = 0, reduced = false, signal = 0 }: VisualProps) {
  const root = useRef<THREE.Group>(null);
  const petals = useRef<Array<THREE.Group | null>>([]);
  const rings = useRef<Array<THREE.Mesh | null>>([]);
  const count = Math.min(9, 6 + growth);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (reduced ? 0.25 : 1);
    petals.current.forEach((petal, index) => {
      if (!petal) return;
      petal.rotation.z = (index / count) * Math.PI * 2;
      petal.rotation.y = -0.18 + Math.sin(t * 1.36 + index * 0.16) * 0.12 - signal * 0.12;
      petal.scale.setScalar(0.96 + Math.sin(t * 1.36 + index * 0.2) * 0.035 + signal * 0.05);
    });
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const phase = (t * 0.35 + index / rings.current.length) % 1;
      ring.scale.setScalar(0.4 + phase * 2.1);
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, (1 - phase) * (0.2 + signal * 0.3));
    });
    if (root.current) root.current.rotation.z = Math.sin(t * 0.23) * 0.08;
  });

  return (
    <group ref={root} rotation={[0.06, 0.18, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.38, 32, 20]} />
        <meshPhysicalMaterial {...clearMaterial} color="#e7ddff" />
      </mesh>
      <mesh scale={[0.52, 0.52, 0.18]}>
        <torusGeometry args={[0.28, 0.08, 12, 36]} />
        <meshStandardMaterial color="#a3a7b6" metalness={0.65} roughness={0.25} />
      </mesh>
      {Array.from({ length: count }, (_, index) => (
        <group key={index} ref={(node) => { petals.current[index] = node; }}>
          <group position={[0.86, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.34, 0.2, 0.28, 32, 2, true]} />
              <meshStandardMaterial color="#202431" metalness={0.34} roughness={0.25} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <circleGeometry args={[0.22, 32]} />
              <meshPhysicalMaterial color="#434a63" roughness={0.16} metalness={0.5} emissive="#ff2f91" emissiveIntensity={0.2 + signal * 2} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.31, 0.035, 10, 36]} />
              <meshStandardMaterial color="#d6d9df" metalness={0.7} roughness={0.2} />
            </mesh>
          </group>
          <mesh position={[0.5, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.18, 0.03, 32]} />
            <meshPhysicalMaterial color="#f1eff9" transmission={0.6} transparent opacity={0.38} roughness={0.08} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh key={index} ref={(node) => { rings.current[index] = node; }} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.54, 0.012, 8, 64]} />
          <meshBasicMaterial color="#ff2f91" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function makeFinGeometry(direction: 1 | -1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(direction * 0.8, 0.72, direction * 1.72, 0.64, direction * 2.05, 0.08);
  shape.bezierCurveTo(direction * 1.48, -0.16, direction * 0.74, -0.3, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    curveSegments: 18,
  });
  geometry.center();
  return geometry;
}

function PhotophoreDrifter({ growth = 0, reduced = false, signal = 0 }: VisualProps) {
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const lights = useRef<Array<THREE.Mesh | null>>([]);
  const leftGeometry = useMemo(() => makeFinGeometry(-1), []);
  const rightGeometry = useMemo(() => makeFinGeometry(1), []);
  const fibers = Math.min(8, 5 + growth);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (reduced ? 0.22 : 1);
    if (root.current) root.current.rotation.z = Math.sin(t * 0.38) * 0.06;
    if (left.current) left.current.rotation.y = 0.12 + Math.sin(t * 1.1) * 0.16;
    if (right.current) right.current.rotation.y = -0.12 - Math.sin(t * 1.1) * 0.16;
    lights.current.forEach((light, index) => {
      if (!light) return;
      const wave = Math.max(0, Math.sin(t * 2.6 - index * 0.65));
      const material = light.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1 + wave * 3 + signal * 4;
      light.scale.setScalar(0.8 + wave * 0.34);
    });
  });

  return (
    <group ref={root} rotation={[0.38, 0.05, 0]}>
      <mesh ref={left} geometry={leftGeometry} position={[-0.78, 0, 0]} castShadow>
        <meshPhysicalMaterial {...clearMaterial} color="#bdefff" opacity={0.48} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={right} geometry={rightGeometry} position={[0.78, 0, 0]} castShadow>
        <meshPhysicalMaterial {...clearMaterial} color="#d7c9ff" opacity={0.48} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[0.72, 0.28, 0.48]} castShadow>
        <sphereGeometry args={[0.62, 40, 24]} />
        <meshPhysicalMaterial {...clearMaterial} color="#d6f7ff" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.48]}>
        <torusGeometry args={[0.38, 0.055, 12, 48]} />
        <meshStandardMaterial color="#273554" metalness={0.45} roughness={0.26} />
      </mesh>
      {Array.from({ length: fibers }, (_, index) => {
        const x = -0.46 + (index / Math.max(1, fibers - 1)) * 0.92;
        const points = [
          new THREE.Vector3(x, -0.08, 0.12),
          new THREE.Vector3(x * 1.1, -0.54, 0.05),
          new THREE.Vector3(x * 1.34, -0.9 - (index % 2) * 0.12, -0.05),
        ];
        return <Tube key={index} points={points} radius={0.022} color="#d4f7ff" emissive="#21d9ff" />;
      })}
      {Array.from({ length: 9 }, (_, index) => {
        const angle = (index / 9) * Math.PI * 2;
        return (
          <mesh
            key={index}
            ref={(node) => { lights.current[index] = node; }}
            position={[Math.cos(angle) * 0.52, Math.sin(angle) * 0.22, 0.36 + Math.sin(angle) * 0.04]}
          >
            <sphereGeometry args={[0.045, 12, 8]} />
            <meshStandardMaterial color="#dfffff" emissive={index % 3 === 0 ? "#b8ff28" : "#21d9ff"} emissiveIntensity={2} />
          </mesh>
        );
      })}
    </group>
  );
}

function makeOracleShell() {
  const profile = [
    new THREE.Vector2(0.18, -0.9),
    new THREE.Vector2(0.48, -0.72),
    new THREE.Vector2(0.64, -0.28),
    new THREE.Vector2(0.7, 0.16),
    new THREE.Vector2(0.58, 0.56),
    new THREE.Vector2(0.3, 0.82),
    new THREE.Vector2(0.12, 0.9),
  ];
  const geometry = new THREE.LatheGeometry(profile, 48);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function LensOracle({ growth = 0, reduced = false, signal = 0 }: VisualProps) {
  const root = useRef<THREE.Group>(null);
  const iris = useRef<THREE.Group>(null);
  const display = useRef<THREE.Mesh>(null);
  const shell = useMemo(() => makeOracleShell(), []);
  const blades = Math.min(10, 7 + Math.floor(growth / 2));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (reduced ? 0.2 : 1);
    if (root.current) root.current.rotation.y = Math.sin(t * 0.28) * 0.16;
    if (iris.current) iris.current.rotation.z = Math.sin(t * 0.41) * 0.24;
    if (display.current) {
      const material = display.current.material as THREE.MeshStandardMaterial;
      material.color.setHSL((0.62 + Math.sin(t * 0.17) * 0.16 + signal * 0.1) % 1, 0.68, 0.58);
      material.emissive.copy(material.color);
      material.emissiveIntensity = 0.4 + signal * 2.5;
    }
  });

  return (
    <group ref={root} rotation={[0.05, -0.24, 0]}>
      <mesh geometry={shell} scale={[0.92, 0.92, 0.7]} castShadow>
        <meshPhysicalMaterial {...clearMaterial} color="#e8e4f5" opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.48, 0.56, 0.26, 48]} />
          <meshStandardMaterial color="#252938" metalness={0.72} roughness={0.19} />
        </mesh>
        <mesh position={[0, 0.145, 0]}>
          <circleGeometry args={[0.36, 48]} />
          <meshPhysicalMaterial color="#18223e" metalness={0.5} roughness={0.08} clearcoat={1} clearcoatRoughness={0.04} />
        </mesh>
        <group ref={iris} position={[0, 0.17, 0]}>
          {Array.from({ length: blades }, (_, index) => {
            const angle = (index / blades) * Math.PI * 2;
            return (
              <mesh key={index} rotation={[0, 0, angle]} position={[Math.cos(angle) * 0.09, Math.sin(angle) * 0.09, 0.006]}>
                <circleGeometry args={[0.19, 3, 0, Math.PI * 1.3]} />
                <meshStandardMaterial color="#6f7487" metalness={0.62} roughness={0.2} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.095, 32]} />
            <meshBasicMaterial color="#050713" />
          </mesh>
        </group>
      </group>
      <mesh ref={display} position={[0, -0.46, 0.5]} rotation={[-0.04, 0, 0]}>
        <planeGeometry args={[0.62, 0.18, 12, 3]} />
        <meshStandardMaterial color="#694cff" emissive="#694cff" emissiveIntensity={0.8} roughness={0.28} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.56, -0.24, -0.16]} rotation={[0, 0, side * 0.36]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.62, 12]} />
            <meshStandardMaterial color="#aeb6c1" metalness={0.68} roughness={0.22} />
          </mesh>
          <mesh position={[0, -0.34, 0]}>
            <sphereGeometry args={[0.09, 16, 10]} />
            <meshStandardMaterial color="#272e3d" metalness={0.48} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function CreatureVisual({
  species,
  ...props
}: VisualProps & { species: SpeciesId }) {
  switch (species) {
    case "keycap":
      return <KeycapCrustacean {...props} />;
    case "tendril":
      return <CableTendril {...props} />;
    case "resonance":
      return <ResonanceBloom {...props} />;
    case "photophore":
      return <PhotophoreDrifter {...props} />;
    case "oracle":
      return <LensOracle {...props} />;
  }
}
