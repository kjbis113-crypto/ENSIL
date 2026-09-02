import type { CreatureRecord, CreatureState } from '../data/creatureRecords';

export type FieldRuntime = {
  id: string;
  position: { x: number; z: number };
  home: { x: number; z: number };
  velocity: { x: number; z: number };
  energy: number;
  stress: number;
  phase: number;
  state: CreatureState;
  startledUntil: number;
  touchedUntil: number;
};

export type FieldStimulus = {
  active: boolean;
  x: number;
  z: number;
  speed: number;
  attracting: boolean;
  now: number;
};

const INITIAL_POSITIONS = [
  { x: -4, z: 1 },
  { x: -25, z: -13 },
  { x: 23, z: -11 },
  { x: -21, z: 16 },
  { x: 22, z: 17 },
];

export function createFieldRuntimes(records: CreatureRecord[]): FieldRuntime[] {
  return records.map((record, index) => {
    const start = INITIAL_POSITIONS[index] ?? { x: index * 8 - 16, z: 0 };
    return {
      id: record.id,
      position: { ...start },
      home: { ...start },
      velocity: { x: 0, z: 0 },
      energy: 0.58 + index * 0.07,
      stress: 0,
      phase: index * 1.73,
      state: 'idle',
      startledUntil: 0,
      touchedUntil: 0,
    };
  });
}

export function touchRuntime(runtime: FieldRuntime, now: number) {
  runtime.touchedUntil = now + 1.4;
  runtime.energy = Math.min(1, runtime.energy + 0.08);
}

export function stepFieldRuntime(
  runtime: FieldRuntime,
  record: CreatureRecord,
  neighbours: FieldRuntime[],
  stimulus: FieldStimulus,
  dt: number,
) {
  runtime.phase += dt * (0.42 + record.temperament.speed * 0.8);
  runtime.energy = Math.max(0.08, runtime.energy - dt * (0.003 + record.temperament.speed * 0.002));
  runtime.stress = Math.max(0, runtime.stress - dt * 0.16);

  const dx = stimulus.x - runtime.position.x;
  const dz = stimulus.z - runtime.position.z;
  const pointerDistance = Math.hypot(dx, dz);

  if (stimulus.active && stimulus.speed > 1.15 && pointerDistance < 15) {
    runtime.startledUntil = stimulus.now + 1.15 + record.temperament.fear;
    runtime.stress = Math.min(1, runtime.stress + 0.5);
  }

  let targetX = runtime.home.x + Math.sin(runtime.phase * 0.71) * (3.5 + record.temperament.curiosity * 4);
  let targetZ = runtime.home.z + Math.cos(runtime.phase * 0.53) * (2.8 + record.temperament.speed * 4);

  if (runtime.startledUntil > stimulus.now) {
    runtime.state = 'startled';
    const inverse = 1 / Math.max(pointerDistance, 0.1);
    targetX = runtime.position.x - dx * inverse * 13;
    targetZ = runtime.position.z - dz * inverse * 13;
  } else if (runtime.touchedUntil > stimulus.now) {
    runtime.state = 'curious';
    targetX = stimulus.active ? stimulus.x : runtime.home.x;
    targetZ = stimulus.active ? stimulus.z : runtime.home.z;
  } else if (stimulus.attracting && pointerDistance < 38) {
    runtime.state = 'curious';
    targetX = stimulus.x;
    targetZ = stimulus.z;
  } else if (stimulus.active && pointerDistance < 10 + record.temperament.curiosity * 7) {
    runtime.state = 'curious';
    targetX = runtime.position.x + dx * record.temperament.curiosity * 0.72;
    targetZ = runtime.position.z + dz * record.temperament.curiosity * 0.72;
  } else if (runtime.energy < 0.22) {
    runtime.state = 'rest';
    targetX = runtime.position.x;
    targetZ = runtime.position.z;
    runtime.energy = Math.min(0.36, runtime.energy + dt * 0.055);
  } else {
    const closeNeighbour = neighbours.find((other) => {
      if (other.id === runtime.id) return false;
      return Math.hypot(other.position.x - runtime.position.x, other.position.z - runtime.position.z) < 8;
    });
    if (closeNeighbour && Math.sin(runtime.phase * 0.29) > 0.35) {
      runtime.state = 'social';
      targetX = closeNeighbour.position.x;
      targetZ = closeNeighbour.position.z;
    } else if (Math.sin(runtime.phase * 0.23) > 0.68) {
      runtime.state = 'forage';
    } else {
      runtime.state = 'idle';
    }
  }

  const tx = targetX - runtime.position.x;
  const tz = targetZ - runtime.position.z;
  const distance = Math.hypot(tx, tz);
  const maxSpeed = runtime.state === 'startled'
    ? 7.5 + record.temperament.fear * 4
    : 1.1 + record.temperament.speed * 2.5;
  const acceleration = runtime.state === 'rest' ? 0.02 : 0.038 + record.temperament.curiosity * 0.025;

  if (distance > 0.05) {
    runtime.velocity.x += (tx / distance) * acceleration;
    runtime.velocity.z += (tz / distance) * acceleration;
  }

  const velocityLength = Math.hypot(runtime.velocity.x, runtime.velocity.z);
  if (velocityLength > maxSpeed) {
    runtime.velocity.x = (runtime.velocity.x / velocityLength) * maxSpeed;
    runtime.velocity.z = (runtime.velocity.z / velocityLength) * maxSpeed;
  }

  const damping = runtime.state === 'rest' ? 0.88 : 0.965;
  runtime.velocity.x *= damping;
  runtime.velocity.z *= damping;
  runtime.position.x = Math.max(-39, Math.min(39, runtime.position.x + runtime.velocity.x * dt * 12));
  runtime.position.z = Math.max(-27, Math.min(27, runtime.position.z + runtime.velocity.z * dt * 12));
}
