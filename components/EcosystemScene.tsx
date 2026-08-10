"use client";

import { ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OFFERINGS, SPECIES, type OfferingType, type SpeciesId } from "../data/species";
import { usePageVisible, useReducedMotion } from "../hooks/useEnvironment";
import type { BehaviorState, Offering } from "../simulation/types";
import { seededUnit } from "../simulation/seeded";
import { useEcosystem } from "../store/ecosystem";
import { CreatureVisual } from "./creatures/CreatureVisuals";

const BASE_POSITIONS: Record<SpeciesId, [number, number, number]> = {
  keycap: [-3.15, -1.15, 0.15],
  tendril: [2.82, -1.08, -0.2],
  resonance: [0.25, -0.05, -0.65],
  photophore: [-1.25, 2.05, -0.95],
  oracle: [3.35, 1.18, -1.15],
};

const CREATURE_SCALE: Record<SpeciesId, number> = {
  keycap: 0.93,
  tendril: 0.82,
  resonance: 0.72,
  photophore: 0.78,
  oracle: 0.78,
};

function CameraRig({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const pointer = useThree((state) => state.pointer);
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const depth = useRef(0);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      depth.current = THREE.MathUtils.clamp(depth.current + event.deltaY * 0.0015, -0.7, 1.1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useFrame(({ clock }, delta) => {
    if (!camera.current) return;
    const t = clock.elapsedTime;
    const parallax = reduced ? 0.04 : 0.16;
    camera.current.position.x = THREE.MathUtils.damp(camera.current.position.x, pointer.x * parallax + Math.sin(t * 0.09) * 0.08, 2, delta);
    camera.current.position.y = THREE.MathUtils.damp(camera.current.position.y, pointer.y * parallax + Math.cos(t * 0.075) * 0.06, 2, delta);
    camera.current.position.z = THREE.MathUtils.damp(camera.current.position.z, (mobile ? 12.4 : 10.1) + depth.current, 2, delta);
    camera.current.lookAt(0, 0.25, 0);
  });
  return <PerspectiveCamera ref={camera} makeDefault fov={42} near={0.1} far={70} position={[0, 0, mobile ? 12.4 : 10.1]} />;
}

function AmbientField({ count, dormant }: { count: number; dormant: boolean }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (seededUnit(index + 2) - 0.5) * 13;
      values[index * 3 + 1] = (seededUnit(index + 91) - 0.5) * 8;
      values[index * 3 + 2] = -1.8 + seededUnit(index + 271) * 3.2;
    }
    return values;
  }, [count]);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.z = clock.elapsedTime * (dormant ? 0.001 : 0.004);
    points.current.position.y = Math.sin(clock.elapsedTime * 0.14) * 0.06;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={dormant ? 0.025 : 0.035}
        color={dormant ? "#aeb2b7" : "#728cff"}
        transparent
        opacity={dormant ? 0.22 : 0.34}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Embryos({ awake }: { awake: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * (awake ? 0.035 : 0.009);
  });

  return (
    <group ref={group}>
      {Array.from({ length: 9 }, (_, index) => {
        const x = (seededUnit(index + 10) - 0.5) * 10;
        const y = (seededUnit(index + 30) - 0.5) * 5;
        const z = -1.6 + seededUnit(index + 90) * 1.7;
        return (
          <group key={index} position={[x, y, z]} rotation={[index * 0.8, index * 0.4, index]}>
            <mesh castShadow>
              <octahedronGeometry args={[0.11 + (index % 3) * 0.035, 1]} />
              <meshPhysicalMaterial
                color={index % 3 === 0 ? "#b8ff28" : index % 3 === 1 ? "#4c62ff" : "#d8dce1"}
                metalness={0.26}
                roughness={0.24}
                emissive={awake && index % 3 === 0 ? "#739f08" : "#000000"}
                emissiveIntensity={0.8}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.2, 0.012, 6, 24]} />
              <meshBasicMaterial color="#6d7480" transparent opacity={0.38} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function OfferingMesh({ offering }: { offering: Offering }) {
  const group = useRef<THREE.Group>(null);
  const accent = OFFERINGS.find((item) => item.id === offering.type)?.id ?? "charge";
  const colors: Record<OfferingType, string> = {
    charge: "#b8ff28",
    connector: "#2457ff",
    coil: "#ff2f91",
    pixel: "#21d9ff",
    lens: "#7d52ff",
  };

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.8;
    group.current.position.y = offering.position[1] + Math.sin(clock.elapsedTime * 2 + offering.createdAt) * 0.07;
  });

  return (
    <group ref={group} position={offering.position} scale={0.68 + offering.charge * 0.35}>
      {accent === "charge" && (
        <>
          <mesh castShadow><cylinderGeometry args={[0.12, 0.12, 0.3, 16]} /><meshStandardMaterial color="#d7dce1" metalness={0.55} roughness={0.25} /></mesh>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.055, 0.055, 0.06, 12]} /><meshStandardMaterial color={colors[accent]} emissive={colors[accent]} emissiveIntensity={2} /></mesh>
        </>
      )}
      {accent === "connector" && (
        <mesh castShadow><boxGeometry args={[0.36, 0.2, 0.18]} /><meshStandardMaterial color={colors[accent]} metalness={0.45} roughness={0.25} /></mesh>
      )}
      {accent === "coil" && (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.17, 0.045, 10, 32]} /><meshStandardMaterial color={colors[accent]} metalness={0.58} roughness={0.2} emissive={colors[accent]} emissiveIntensity={0.7} /></mesh>
      )}
      {accent === "pixel" && (
        <mesh castShadow><octahedronGeometry args={[0.18, 1]} /><meshStandardMaterial color="#e8ffff" emissive={colors[accent]} emissiveIntensity={3} /></mesh>
      )}
      {accent === "lens" && (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.18, 0.22, 0.13, 28]} /><meshPhysicalMaterial color={colors[accent]} metalness={0.5} roughness={0.1} clearcoat={1} /></mesh>
      )}
      <pointLight color={colors[accent]} intensity={0.7 + offering.charge} distance={1.5} />
    </group>
  );
}

function AgentCreature({ species, reduced, mobile }: { species: SpeciesId; reduced: boolean; mobile: boolean }) {
  const root = useRef<THREE.Group>(null);
  const previousPointer = useRef(new THREE.Vector2());
  const startle = useRef(0);
  const nextReport = useRef(0);
  const localEnergy = useRef(useEcosystem.getState().agents[species].energy);
  const setSelected = useEcosystem((state) => state.setSelectedSpecies);
  const offerings = useEcosystem((state) => state.offerings);
  const consumeOffering = useEcosystem((state) => state.consumeOffering);
  const updateAgent = useEcosystem((state) => state.updateAgent);
  const micIntensity = useEcosystem((state) => state.micIntensity);
  const agent = useEcosystem((state) => state.agents[species]);
  const definition = SPECIES.find((entry) => entry.id === species)!;

  const compatible = offerings.find((offering) => offering.type === definition.offering);

  useFrame(({ clock, pointer }, delta) => {
    if (!root.current) return;
    const speed = reduced ? 0.24 : 1;
    const t = clock.elapsedTime;
    const base = BASE_POSITIONS[species];
    const desired = new THREE.Vector3(base[0] * (mobile ? 0.72 : 1), base[1], base[2]);
    let state: BehaviorState = localEnergy.current < 18 ? "Resting" : "Wandering";
    let target = "ambient field";

    if (species === "keycap") {
      desired.x += Math.sin(t * 0.22) * 0.62;
      desired.y += Math.sin(t * 0.54) * 0.18;
      root.current.rotation.y = -0.15 + Math.sin(t * 0.3) * 0.15;
    } else if (species === "tendril") {
      desired.x += Math.sin(t * 0.17 + 2) * 0.88;
      desired.y += Math.cos(t * 0.29) * 0.34;
      root.current.rotation.z = Math.sin(t * 0.24) * 0.08;
    } else if (species === "resonance") {
      desired.x += Math.sin(t * 0.13) * 0.32;
      desired.y += Math.sin(t * 0.31) * 0.18;
    } else if (species === "photophore") {
      desired.x += Math.sin(t * 0.18 + 1) * 1.7;
      desired.y += Math.sin(t * 0.27) * 0.36;
      desired.z += Math.cos(t * 0.2) * 0.18;
      root.current.rotation.y = Math.sin(t * 0.22) * 0.22;
    } else {
      desired.x += Math.sin(t * 0.095) * 0.52 + Math.max(0, Math.sin(t * 0.14)) * 0.36;
      desired.y += Math.cos(t * 0.13) * 0.22;
      root.current.rotation.y = -0.24 + Math.sin(t * 0.14) * 0.3;
    }

    if (compatible) {
      desired.set(...compatible.position);
      desired.z += 0.28;
      state = species === "oracle" ? "Inspecting" : species === "tendril" ? "Connecting" : "Foraging";
      target = compatible.type;
      const distance = root.current.position.distanceTo(desired);
      if (distance < 0.58) {
        consumeOffering(compatible.id, species, definition.components[(agent.growth + 2) % definition.components.length]);
        localEnergy.current = Math.min(100, localEnergy.current + 18 + compatible.charge * 7);
        state = "Feeding";
      }
    }

    const pointerSpeed = previousPointer.current.distanceTo(pointer) / Math.max(delta, 0.001);
    previousPointer.current.copy(pointer);
    if (species === "keycap") {
      const pointerWorld = new THREE.Vector3(pointer.x * 5.8, pointer.y * 3.5, 0);
      if (root.current.position.distanceTo(pointerWorld) < 1.5 && pointerSpeed > 1.7) startle.current = 1;
      startle.current = Math.max(0, startle.current - delta * (reduced ? 1.8 : 0.58));
      if (startle.current > 0.18) {
        state = "Startled";
        desired.x -= 0.42 * startle.current;
      }
    }

    const communication = (species === "photophore" || species === "resonance") && Math.sin(t * 0.74) > 0.78;
    if (communication && !compatible) {
      state = "Communicating";
      target = species === "photophore" ? "Resonance Bloom" : "Photophore Drifter";
    }

    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, desired.x, (species === "oracle" ? 0.48 : 0.85) * speed, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, desired.y, (species === "photophore" ? 0.62 : 0.85) * speed, delta);
    root.current.position.z = THREE.MathUtils.damp(root.current.position.z, desired.z, 0.68 * speed, delta);

    if (t > nextReport.current) {
      nextReport.current = t + 1.1;
      const stored = useEcosystem.getState().agents[species];
      localEnergy.current = Math.max(8, Math.min(stored.energy, localEnergy.current) - 0.07);
      updateAgent(species, {
        energy: localEnergy.current,
        hunger: Math.min(100, stored.hunger + 0.09),
        curiosity: THREE.MathUtils.clamp(stored.curiosity + Math.sin(t + SPECIES.indexOf(definition)) * 0.12, 10, 95),
        fear: species === "keycap" ? startle.current * 90 : Math.max(4, stored.fear * 0.985),
        age: stored.age + 1,
        health: localEnergy.current < 16 ? Math.max(42, stored.health - 0.08) : Math.min(100, stored.health + 0.03),
        state,
        target,
      });
    }
  });

  const signal = species === "keycap" ? agent.fear / 90 : species === "resonance" ? micIntensity : Math.max(0, Math.sin(agent.age * 0.08));

  return (
    <group
      ref={root}
      position={[BASE_POSITIONS[species][0] * (mobile ? 0.72 : 1), BASE_POSITIONS[species][1], BASE_POSITIONS[species][2]]}
      scale={CREATURE_SCALE[species] * (1 + agent.growth * 0.025)}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setSelected(species);
      }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <CreatureVisual species={species} growth={agent.growth} reduced={reduced} signal={signal} />
    </group>
  );
}

function InteractionPlane() {
  const addOffering = useEcosystem((state) => state.addOffering);
  const down = useRef<{ time: number; point: THREE.Vector3 } | null>(null);

  const onDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    down.current = { time: performance.now(), point: event.point.clone() };
  };
  const onUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!down.current) return;
    const charge = THREE.MathUtils.clamp((performance.now() - down.current.time) / 1200, 0.08, 1);
    addOffering([event.point.x, event.point.y, Math.max(-0.3, event.point.z)], charge);
    down.current = null;
  };

  return (
    <mesh position={[0, 0.15, -1.82]} onPointerDown={onDown} onPointerUp={onUp}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function LifecycleClock() {
  const setLifecycle = useEcosystem((state) => state.setLifecycle);
  const previous = useRef("");
  useFrame(({ clock }) => {
    const cycle = clock.elapsedTime % 30;
    const phase = cycle < 7 ? "Dormancy" : cycle < 17 ? "Fermentation" : "Emergence";
    if (phase !== previous.current) {
      previous.current = phase;
      setLifecycle(phase);
    }
  });
  return null;
}

function World({ dormant, reduced, quality, mobile }: { dormant: boolean; reduced: boolean; quality: "low" | "medium" | "high"; mobile: boolean }) {
  const offerings = useEcosystem((state) => state.offerings);
  const prune = useEcosystem((state) => state.pruneOfferings);

  useEffect(() => {
    const timer = window.setInterval(() => prune(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, [prune]);

  return (
    <>
      <color attach="background" args={["#edf0ef"]} />
      <fog attach="fog" args={["#e8edec", 8.4, 17]} />
      <ambientLight intensity={1.25} color="#f7f7f1" />
      <hemisphereLight args={["#f8fbff", "#b7c2ca", 1.25]} />
      <directionalLight
        castShadow={quality !== "low"}
        position={[-4.8, 7.2, 6.5]}
        intensity={2.7}
        color="#ffffff"
        shadow-mapSize-width={quality === "high" ? 1536 : 768}
        shadow-mapSize-height={quality === "high" ? 1536 : 768}
        shadow-bias={-0.0004}
      />
      <pointLight position={[4.5, 2.2, 2]} color="#655dff" intensity={13} distance={8} decay={2.3} />
      <pointLight position={[-4, -1.4, 2]} color="#c7ff4a" intensity={8} distance={7} decay={2.2} />
      <CameraRig reduced={reduced} mobile={mobile} />
      <AmbientField count={quality === "low" ? 130 : quality === "medium" ? 260 : 420} dormant={dormant} />
      <Embryos awake={!dormant} />
      {!dormant && (
        <>
          {SPECIES.map((species) => <AgentCreature key={species.id} species={species.id} reduced={reduced} mobile={mobile} />)}
          {offerings.map((offering) => <OfferingMesh key={offering.id} offering={offering} />)}
          <InteractionPlane />
          <LifecycleClock />
        </>
      )}
      <mesh position={[0, -3.42, -0.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#e5e9e7" roughness={0.7} metalness={0.02} />
      </mesh>
      {quality !== "low" && (
        <ContactShadows position={[0, -3.35, 0]} opacity={0.22} scale={15} blur={2.6} far={8} resolution={quality === "high" ? 512 : 256} />
      )}
      {quality !== "low" && (
        <EffectComposer multisampling={quality === "high" ? 4 : 0}>
          <Bloom luminanceThreshold={1.15} mipmapBlur intensity={0.18} radius={0.42} />
          <Noise opacity={0.012} />
          <Vignette eskil={false} offset={0.42} darkness={0.13} />
        </EffectComposer>
      )}
    </>
  );
}

function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="status">
      <p>Live specimen rendering is unavailable on this device.</p>
      <p>The five ENSIL species remain documented in the specimen archive.</p>
    </div>
  );
}

export function EcosystemScene({ dormant = false }: { dormant?: boolean }) {
  const quality = useEcosystem((state) => state.quality);
  const systemReduced = useReducedMotion();
  const manualReduced = useEcosystem((state) => state.reducedMotion);
  const reduced = systemReduced || manualReduced;
  const visible = usePageVisible();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 620);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxDpr = mobile ? 1.25 : quality === "high" ? 1.75 : quality === "medium" ? 1.35 : 1;

  return (
    <Canvas
      className="ecosystem-canvas"
      camera={{ position: [0, 0, mobile ? 12.4 : 10.1], fov: mobile ? 54 : 42, near: 0.1, far: 40 }}
      dpr={[1, maxDpr]}
      shadows={quality === "low" ? false : "basic"}
      frameloop={visible ? "always" : "never"}
      fallback={<WebGLFallback />}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}
      aria-label="A live three-dimensional electronic ecosystem containing five autonomous species"
    >
      <Suspense fallback={null}>
        <World dormant={dormant} reduced={reduced} quality={quality} mobile={mobile} />
      </Suspense>
    </Canvas>
  );
}
