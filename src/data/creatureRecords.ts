export type CreatureState = 'idle' | 'forage' | 'curious' | 'startled' | 'social' | 'rest';

export type CreatureRecord = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  modelUrl?: string;
  sensor: string;
  input: string;
  response: string;
  status: 'LIVE MODEL' | 'MODEL PENDING';
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    paper: string;
    ink: string;
  };
  temperament: {
    speed: number;
    curiosity: number;
    fear: number;
    sociality: number;
  };
  ecology: {
    habitat: string;
    metabolism: string;
    reproduction: string;
    lifespan: string;
  };
  observations: Array<{ time: string; state: CreatureState; note: string }>;
};

export const CREATURE_RECORDS: CreatureRecord[] = [
  {
    id: 'eo-001',
    code: 'EO–001',
    name: 'Tactile Burrower',
    shortName: 'Burrower',
    modelUrl: '/creature.glb',
    sensor: 'Tactile switch / force',
    input: 'Contact pressure',
    response: 'Vibration, contraction, approach',
    status: 'LIVE MODEL',
    palette: { primary: '#2457ff', secondary: '#ff5d32', accent: '#ffc4d8', paper: '#f4f9ff', ink: '#101019' },
    temperament: { speed: 0.52, curiosity: 0.76, fear: 0.42, sociality: 0.58 },
    ecology: {
      habitat: 'Low-light surfaces with intermittent human contact.',
      metabolism: 'Converts repeated pressure into short kinetic pulses.',
      reproduction: 'Leaves tactile memory at frequently touched coordinates.',
      lifespan: 'Estimated 18,000 contact cycles.',
    },
    observations: [
      { time: '17:42:08', state: 'curious', note: 'Approached a stationary hand field.' },
      { time: '17:39:31', state: 'startled', note: 'Contracted after rapid pointer entry.' },
      { time: '17:34:02', state: 'rest', note: 'Returned to low-energy breathing.' },
    ],
  },
  {
    id: 'eo-002',
    code: 'EO–002',
    name: 'Tendon Drifter',
    shortName: 'Drifter',
    modelUrl: '/models/eo-002-tendon-drifter.glb',
    sensor: 'Capacitive tendon',
    input: 'Distance / capacitance',
    response: 'Extension, orbit, connection',
    status: 'LIVE MODEL',
    palette: { primary: '#6dff37', secondary: '#7446ff', accent: '#ffb47a', paper: '#f6fff0', ink: '#11100f' },
    temperament: { speed: 0.34, curiosity: 0.91, fear: 0.18, sociality: 0.82 },
    ecology: {
      habitat: 'Open conductive fields between moving bodies.',
      metabolism: 'Stores proximity as elastic potential.',
      reproduction: 'Forms temporary bridges with nearby organisms.',
      lifespan: 'Persists while its conductive network remains intact.',
    },
    observations: [
      { time: '17:40:12', state: 'social', note: 'Held a connection with EO–004.' },
      { time: '17:31:18', state: 'forage', note: 'Extended toward a distant charge.' },
      { time: '17:23:44', state: 'idle', note: 'Tendon length returned to baseline.' },
    ],
  },
  {
    id: 'eo-003',
    code: 'EO–003',
    name: 'Echo Grazer',
    shortName: 'Grazer',
    modelUrl: '/models/eo-003-echo-grazer.glb',
    sensor: 'Microphone',
    input: 'Sound / voice / rhythm',
    response: 'Resonance and radial movement',
    status: 'LIVE MODEL',
    palette: { primary: '#ff4438', secondary: '#45b8ff', accent: '#ffe341', paper: '#fff5eb', ink: '#121017' },
    temperament: { speed: 0.44, curiosity: 0.68, fear: 0.3, sociality: 0.72 },
    ecology: {
      habitat: 'Quiet rooms punctuated by speech and mechanical rhythm.',
      metabolism: 'Accumulates energy from changes in amplitude.',
      reproduction: 'Repeats a decaying fragment of an encountered rhythm.',
      lifespan: 'Dormant without sound; theoretically indefinite.',
    },
    observations: [
      { time: '17:41:55', state: 'curious', note: 'Resonated with a three-click rhythm.' },
      { time: '17:28:14', state: 'social', note: 'Synchronized pulse with EO–005.' },
      { time: '17:19:03', state: 'rest', note: 'Ambient amplitude below threshold.' },
    ],
  },
  {
    id: 'eo-004',
    code: 'EO–004',
    name: 'Lumen Moth',
    shortName: 'Moth',
    modelUrl: '/models/eo-004-lumen-moth.glb',
    sensor: 'IR / motion / NeoPixel',
    input: 'Motion and gesture',
    response: 'Tracking light and wing flare',
    status: 'LIVE MODEL',
    palette: { primary: '#ff7b31', secondary: '#274cff', accent: '#f5ff57', paper: '#fff4dd', ink: '#121113' },
    temperament: { speed: 0.88, curiosity: 0.86, fear: 0.64, sociality: 0.39 },
    ecology: {
      habitat: 'Edges of screens and illuminated thresholds.',
      metabolism: 'Trades rapid movement for visible light.',
      reproduction: 'Deposits fading light signatures along its route.',
      lifespan: 'One continuous illumination season.',
    },
    observations: [
      { time: '17:43:10', state: 'startled', note: 'Flared after abrupt horizontal motion.' },
      { time: '17:38:22', state: 'forage', note: 'Tracked the brightest local region.' },
      { time: '17:24:50', state: 'idle', note: 'Maintained a low-frequency glow.' },
    ],
  },
  {
    id: 'eo-005',
    code: 'EO–005',
    name: 'Optic Mimic',
    shortName: 'Mimic',
    modelUrl: '/models/eo-005-optic-mimic.glb',
    sensor: 'Optic camera',
    input: 'Light / colour',
    response: 'Material sampling and display',
    status: 'LIVE MODEL',
    palette: { primary: '#00c9bd', secondary: '#ff4f91', accent: '#b9c54a', paper: '#effffa', ink: '#111318' },
    temperament: { speed: 0.28, curiosity: 0.57, fear: 0.21, sociality: 0.66 },
    ecology: {
      habitat: 'Chromatic gradients and reflected display light.',
      metabolism: 'Samples luminance and stores it as surface memory.',
      reproduction: 'Passes a captured colour to a neighbouring body.',
      lifespan: 'Limited by its image-memory capacity.',
    },
    observations: [
      { time: '17:40:47', state: 'curious', note: 'Sampled a cool-grey field.' },
      { time: '17:33:29', state: 'social', note: 'Transferred a tone to EO–003.' },
      { time: '17:18:41', state: 'rest', note: 'Surface memory consolidated.' },
    ],
  },
];

export function getCreatureRecord(id: string | null | undefined) {
  return CREATURE_RECORDS.find((creature) => creature.id === id) ?? CREATURE_RECORDS[0];
}
