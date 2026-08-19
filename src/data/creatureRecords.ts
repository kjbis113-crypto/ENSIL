export type CreatureState = 'idle' | 'forage' | 'curious' | 'startled' | 'social' | 'rest';

export type CreatureRecord = {
  id: string;
  code: string;
  glyphIndex: number;
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
  archive: {
    origin: string;
    emergence: string;
    characteristics: string;
    motif: string;
  };
  observations: Array<{ time: string; state: CreatureState; note: string }>;
};

export const CREATURE_RECORDS: CreatureRecord[] = [
  {
    id: 'eo-004',
    code: 'NO.01',
    glyphIndex: 3,
    name: 'No.01',
    shortName: 'No.01',
    modelUrl: '/models/eo-004-lumen-moth.glb',
    sensor: '클릭 스위치 / 압력',
    input: '클릭 신호 / 누름',
    response: '방향성 발광 신호',
    status: 'LIVE MODEL',
    palette: { primary: '#D5FB4E', secondary: '#FFFFFF', accent: '#111111', paper: '#FFFFFF', ink: '#111111' },
    temperament: { speed: 0.88, curiosity: 0.86, fear: 0.64, sociality: 0.39 },
    ecology: {
      habitat: '밀폐된 책상 서랍과 오래 방치된 입력 장치 주변.',
      metabolism: '누름과 클릭 신호를 방향성 있는 빛으로 전환함.',
      reproduction: '발광 신호로 다른 개체와 제한적인 교신을 시도함.',
      lifespan: '내부 클릭 회로와 발광 기관이 유지되는 동안 존속함.',
    },
    archive: {
      origin: '게이밍 키보드, 마우스',
      emergence: '책상 서랍 깊숙이 방치된 게이밍 키보드와 마우스가 밀폐된 공간에서 서서히 발효되며 형태를 갖춤.',
      characteristics: '몸 전체에 커다란 발광 기관을 가진 십자 모양 개체. 클릭 신호를 주고받던 회로의 특성이 남아 방향성 있는 발광 반응으로 남음. 몸을 누르면 특정 방향으로 빛을 발산함. 다른 개체를 향해 신호를 보내는 수단으로 추정되며, 빛의 방향이 곧 이 개체의 유일한 의사표현 수단.',
      motif: '불가사리, 달해파리 유충',
    },
    observations: [
      { time: '17:43:10', state: 'startled', note: '누름을 감지한 뒤 오른쪽 발광 기관으로 신호를 보냄.' },
      { time: '17:38:22', state: 'social', note: '인접 개체를 향해 짧은 방향성 빛을 발산함.' },
      { time: '17:24:50', state: 'idle', note: '발광 기관이 낮은 세기로 안정됨.' },
    ],
  },
  {
    id: 'eo-002',
    code: 'NO.02',
    glyphIndex: 1,
    name: 'No.02',
    shortName: 'No.02',
    modelUrl: '/models/eo-002-tendon-drifter.glb',
    sensor: '노출 전선 / 전류 감각',
    input: '접근 / 외부 자극',
    response: '꼬리 수축 / 말림',
    status: 'LIVE MODEL',
    palette: { primary: '#D5FB4E', secondary: '#FFFFFF', accent: '#111111', paper: '#FFFFFF', ink: '#111111' },
    temperament: { speed: 0.34, curiosity: 0.91, fear: 0.18, sociality: 0.82 },
    ecology: {
      habitat: '오랜 시간 케이블이 뒤엉켜 있던 서랍 구석.',
      metabolism: '외부 자극과 접근을 잔류 전류 감각으로 읽어냄.',
      reproduction: '개별 전선의 경계를 지우며 하나의 유연한 몸체로 융합함.',
      lifespan: '노출된 전선 감각과 유연한 꼬리 구조가 유지되는 동안 존속함.',
    },
    archive: {
      origin: '전선류 케이블 뭉치',
      emergence: '서랍 구석에서 오랜 시간 얽혀있던 케이블이, 형태를 구분할 수 없을 만큼 뒤엉킨 채로 발효. 개별 전선이었던 시절의 경계가 흐려지며 하나의 유연한 몸체로 융합.',
      characteristics: '전선이 노출된 원형 몸통과 다절형 유연한 꼬리를 가진 개체. 전류가 흐르던 감각이 그대로 남아 외부 자극에 극도로 예민하게 반응하는 습성으로 이어짐. 접근을 감지하면 꼬리가 안쪽으로 말려들어감.',
      motif: '뉴런',
    },
    observations: [
      { time: '17:40:12', state: 'startled', note: '접근 신호를 감지하고 꼬리를 몸 안쪽으로 말아 넣음.' },
      { time: '17:31:18', state: 'curious', note: '미세한 외부 전류 변화에 꼬리 끝이 반응함.' },
      { time: '17:23:44', state: 'idle', note: '자극이 사라진 뒤 다절형 꼬리가 천천히 이완됨.' },
    ],
  },
  {
    id: 'eo-003',
    code: 'NO.03',
    glyphIndex: 2,
    name: 'No.03',
    shortName: 'No.03',
    modelUrl: '/models/eo-003-echo-grazer.glb',
    sensor: '스피커 진동판 / CPU',
    input: '소리 / 음성 / 자극',
    response: '판단 / 연산 / 음성 응답',
    status: 'LIVE MODEL',
    palette: { primary: '#FFFFFF', secondary: '#D5FB4E', accent: '#111111', paper: '#D5FB4E', ink: '#111111' },
    temperament: { speed: 0.44, curiosity: 0.68, fear: 0.3, sociality: 0.72 },
    ecology: {
      habitat: '낡은 스피커와 데스크톱 CPU가 함께 쌓인 폐기물 더미.',
      metabolism: '입력된 소리를 CPU 회로로 처리한 뒤 개별적인 응답으로 돌려보냄.',
      reproduction: '발효 과정의 우연한 회로 재조합으로 서로 다른 성격을 획득함.',
      lifespan: '연산 회로와 발성 기관이 연결된 상태로 유지되는 동안 존속함.',
    },
    archive: {
      origin: '스피커, CPU',
      emergence: '낡은 스피커와 데스크톱 CPU 조각이 같은 폐기물 더미 속에서 발효되며 우연히 연결. 죽어있던 연산 회로와 발성 기관이 상호작용하며, 판단하고 말하는 능력이 생겨남.',
      characteristics: '둥근 몸통 위로 스피커 진동판 구조가 붙어있는 개체. 도감에 기록된 개체 중 유일하게 판단·연산 기능을 가짐. 소리를 단순 반사하지 않고 CPU가 신호를 처리한 뒤 응답하기 때문에, 같은 자극에도 매번 다른 반응을 보이는 것이 관찰됨. 반응 속도와 패턴이 개체마다 조금씩 다르게 관찰되는데, 이는 우연한 재조합의 결과물이라 발효 개체마다 회로 연결 방식이 미세하게 다르기 때문으로 추정됨. 도감 편찬팀은 이를 “개체마다 성격이 다른” 유일한 종으로 기록함.',
      motif: '바다나비',
    },
    observations: [
      { time: '17:41:55', state: 'curious', note: '동일한 세 번의 소리 자극에 이전과 다른 패턴으로 응답함.' },
      { time: '17:28:14', state: 'social', note: '인접 개체의 신호를 연산한 뒤 낮은 공명음으로 되돌려 보냄.' },
      { time: '17:19:03', state: 'rest', note: '주변 소리가 임계값 아래로 내려가며 연산 활동이 감소함.' },
    ],
  },
  {
    id: 'eo-005',
    code: 'NO.04',
    glyphIndex: 4,
    name: 'No.04',
    shortName: 'No.04',
    modelUrl: '/models/eo-005-optic-mimic.glb',
    sensor: '전구 군체 / 발광점',
    input: '군집 전류 / 개체 간 연결',
    response: '집단 발광 / 에너지 공유',
    status: 'LIVE MODEL',
    palette: { primary: '#FFFFFF', secondary: '#D5FB4E', accent: '#111111', paper: '#D5FB4E', ink: '#111111' },
    temperament: { speed: 0.28, curiosity: 0.57, fear: 0.21, sociality: 0.66 },
    ecology: {
      habitat: '여러 전구가 함께 방치된 창고와 장식장 내부.',
      metabolism: '직렬 연결된 군체 내부에서 발광 에너지를 공유함.',
      reproduction: '항상 최소 세 개체 이상의 무리로 발효되어 출현함.',
      lifespan: '군체에서 이탈한 개체는 에너지를 잃고 빛이 꺼짐.',
    },
    archive: {
      origin: '전구류',
      emergence: '창고나 장식장에 방치된 여러 개의 전구가 동시에, 그러나 서로 다른 개체로 발효.',
      characteristics: '개체 하나하나는 작고 둥근 버섯 모양이며, 정수리에 작은 발광점을 가짐. 단독 개체로는 거의 발견되지 않고 항상 여러 마리가 무리 지어 서식함. 강한 뒷체와 영역 의식을 가짐. 발효 과정에서 개체 간에 형성된 직렬 연결 구조 때문에, 개체가 무리에서 이탈하면 에너지를 잃음. 도감 상 유일하게 “단일 개체 관찰 불가” 등급. 항상 최소 3마리 이상 무리로 발견되며, 낙오된 단독 개체는 빛이 꺼진 채로만 발견.',
      motif: '해파리, 덤보문어',
    },
    observations: [
      { time: '17:40:47', state: 'social', note: '네 개체가 직렬 연결을 유지하며 동시에 발광함.' },
      { time: '17:33:29', state: 'startled', note: '한 개체가 군체 경계를 벗어나자 발광 세기가 급격히 감소함.' },
      { time: '17:18:41', state: 'rest', note: '최소 군집 수를 회복한 뒤 발광점이 다시 켜짐.' },
    ],
  },
];

export function getCreatureRecord(id: string | null | undefined) {
  return CREATURE_RECORDS.find((creature) => creature.id === id) ?? CREATURE_RECORDS[0];
}
