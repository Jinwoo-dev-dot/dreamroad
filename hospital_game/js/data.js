// ==============================
// 진료과 & 질병 데이터 (4개 과 x 10개 질병)
// ==============================
'use strict';

const DEPARTMENTS = [
  { id: 'ortho', name: '정형외과', color: '#5a8cc8', icon: '🦴' },
  { id: 'internal', name: '내과', color: '#6bbf6b', icon: '🩺' },
  { id: 'eye', name: '안과', color: '#c8a15a', icon: '👁' },
  { id: 'dental', name: '치과', color: '#c85a9e', icon: '🦷' },
];

const MEDICINE_CATALOG = [
  '해열진통제', '제산제', '혈압강하제', '근육이완제', '항생제 안약', '인공눈물',
  '항히스타민 안약', '안압하강제', '항생제 연고', '진통제', '가글액',
  '소염진통제', '구내염 연고', '항생제', '인슐린',
];

const DISEASES = [
  // ---------- 정형외과 ----------
  { id: 'ortho1', dept: 'ortho', complaint: '계단에서 넘어졌는데 손목이 너무 아프고 부어있어요.', diagnosis: '손목 골절', treatment: 'cast', bodyPart: '손목' },
  { id: 'ortho2', dept: 'ortho', complaint: '축구하다가 발목을 삐끗했는데 걷기가 힘들어요.', diagnosis: '발목 염좌', treatment: 'bandage', bodyPart: '발목' },
  { id: 'ortho3', dept: 'ortho', complaint: '오토바이 사고로 다리를 다쳤는데 움직일 수가 없어요.', diagnosis: '정강이뼈 골절', treatment: 'cast', bodyPart: '정강이' },
  { id: 'ortho4', dept: 'ortho', complaint: '넘어지면서 어깨가 빠진 것 같아요. 팔을 들 수가 없어요.', diagnosis: '어깨 탈구', treatment: 'bandage', bodyPart: '어깨' },
  { id: 'ortho5', dept: 'ortho', complaint: '문에 손가락이 껴서 퉁퉁 붓고 색이 변했어요.', diagnosis: '손가락 골절', treatment: 'cast', bodyPart: '손가락' },
  { id: 'ortho6', dept: 'ortho', complaint: '농구하다가 무릎을 크게 다쳤는데 힘이 안 들어가요.', diagnosis: '무릎 인대 손상', treatment: 'bandage', bodyPart: '무릎' },
  { id: 'ortho7', dept: 'ortho', complaint: '허리를 삐끗한 뒤로 다리까지 저리고 아파요.', diagnosis: '허리 디스크', treatment: 'medicine', medicineName: '근육이완제' },
  { id: 'ortho8', dept: 'ortho', complaint: '컴퓨터를 오래 써서 그런지 손목이 저리고 아파요.', diagnosis: '손목터널증후군', treatment: 'bandage', bodyPart: '손목' },
  { id: 'ortho9', dept: 'ortho', complaint: '계단에서 굴러서 가슴 옆쪽이 숨쉴 때마다 아파요.', diagnosis: '갈비뼈 골절', treatment: 'bandage', bodyPart: '가슴' },
  { id: 'ortho10', dept: 'ortho', complaint: '넘어지면서 팔꿈치를 바닥에 세게 찧었어요.', diagnosis: '팔꿈치 골절', treatment: 'cast', bodyPart: '팔꿈치' },

  // ---------- 내과 ----------
  { id: 'internal1', dept: 'internal', complaint: '콧물과 기침이 계속 나고 목이 아파요.', diagnosis: '감기', treatment: 'medicine', medicineName: '해열진통제' },
  { id: 'internal2', dept: 'internal', complaint: '갑자기 열이 39도까지 오르고 온몸이 쑤셔요.', diagnosis: '독감', treatment: 'iv', ivDrip: true, ivFluid: '해열 수액' },
  { id: 'internal3', dept: 'internal', complaint: '속이 쓰리고 명치가 아파요. 밥을 먹으면 더 아파요.', diagnosis: '급성 위염', treatment: 'medicine', medicineName: '제산제' },
  { id: 'internal4', dept: 'internal', complaint: '어제부터 배가 아프고 설사를 계속해요.', diagnosis: '급성 장염', treatment: 'iv', ivDrip: true, ivFluid: '수분 보충 수액' },
  { id: 'internal5', dept: 'internal', complaint: '머리가 자주 아프고 어지러워요. 혈압을 재보니 높다고 해요.', diagnosis: '고혈압', treatment: 'medicine', medicineName: '혈압강하제' },
  { id: 'internal6', dept: 'internal', complaint: '목이 자주 마르고 소변을 자주 봐요. 최근 살이 많이 빠졌어요.', diagnosis: '당뇨병', treatment: 'iv', ivDrip: false, ivFluid: '인슐린' },
  { id: 'internal7', dept: 'internal', complaint: '어지럽고 기운이 없어요. 얼굴이 창백하다는 말을 들었어요.', diagnosis: '빈혈', treatment: 'iv', ivDrip: true, ivFluid: '철분 수액' },
  { id: 'internal8', dept: 'internal', complaint: '더운 날 운동하고 나서 어지럽고 힘이 하나도 없어요.', diagnosis: '탈수', treatment: 'iv', ivDrip: true, ivFluid: '생리식염수 수액' },
  { id: 'internal9', dept: 'internal', complaint: '기침과 가래가 심하고 열이 나요. 숨쉬기 힘들어요.', diagnosis: '폐렴', treatment: 'iv', ivDrip: true, ivFluid: '항생제 수액' },
  { id: 'internal10', dept: 'internal', complaint: '어제 회식 후 배가 아프고 계속 토했어요.', diagnosis: '식중독', treatment: 'iv', ivDrip: true, ivFluid: '수분 보충 수액' },

  // ---------- 안과 ----------
  { id: 'eye1', dept: 'eye', complaint: '눈이 빨갛고 눈곱이 많이 껴요.', diagnosis: '결막염', treatment: 'medicine', medicineName: '항생제 안약' },
  { id: 'eye2', dept: 'eye', complaint: '눈꺼풀에 뭔가 나서 부어오르고 아파요.', diagnosis: '다래끼', treatment: 'medicine', medicineName: '항생제 안약' },
  { id: 'eye3', dept: 'eye', complaint: '눈이 뻑뻑하고 이물감이 느껴져요.', diagnosis: '안구건조증', treatment: 'medicine', medicineName: '인공눈물' },
  { id: 'eye4', dept: 'eye', complaint: '렌즈를 오래 껴서 그런지 눈이 충혈되고 시려요.', diagnosis: '각막염', treatment: 'medicine', medicineName: '항생제 안약' },
  { id: 'eye5', dept: 'eye', complaint: '봄만 되면 눈이 가렵고 눈물이 나요.', diagnosis: '알레르기성 결막염', treatment: 'medicine', medicineName: '항히스타민 안약' },
  { id: 'eye6', dept: 'eye', complaint: '눈에 먼지가 들어간 것 같은데 계속 아파요.', diagnosis: '각막 이물질', treatment: 'medicine', medicineName: '인공눈물' },
  { id: 'eye7', dept: 'eye', complaint: '시야 한쪽이 흐리고 눈이 뻐근해요.', diagnosis: '녹내장 의심', treatment: 'medicine', medicineName: '안압하강제' },
  { id: 'eye8', dept: 'eye', complaint: '눈꺼풀 끝이 붉고 비듬처럼 각질이 일어나요.', diagnosis: '눈꺼풀염', treatment: 'medicine', medicineName: '항생제 연고' },
  { id: 'eye9', dept: 'eye', complaint: '자고 일어나면 눈이 심하게 가렵고 부어요.', diagnosis: '알레르기성 눈꺼풀 부종', treatment: 'medicine', medicineName: '항히스타민 안약' },
  { id: 'eye10', dept: 'eye', complaint: '눈부심이 심하고 눈물이 자꾸 나요.', diagnosis: '광각막염', treatment: 'medicine', medicineName: '인공눈물' },

  // ---------- 치과 ----------
  { id: 'dental1', dept: 'dental', complaint: '찬물을 마시면 이가 시큰거려요.', diagnosis: '치아 시림', treatment: 'medicine', medicineName: '진통제' },
  { id: 'dental2', dept: 'dental', complaint: '어금니가 욱신욱신 쑤시고 아파요.', diagnosis: '충치', treatment: 'medicine', medicineName: '진통제' },
  { id: 'dental3', dept: 'dental', complaint: '이를 닦을 때 잇몸에서 피가 나요.', diagnosis: '치은염', treatment: 'medicine', medicineName: '가글액' },
  { id: 'dental4', dept: 'dental', complaint: '사랑니 주변 잇몸이 붓고 아파요.', diagnosis: '사랑니 주위염', treatment: 'medicine', medicineName: '소염진통제' },
  { id: 'dental5', dept: 'dental', complaint: '입 안에 하얗게 헐은 곳이 생겨서 아파요.', diagnosis: '구내염', treatment: 'medicine', medicineName: '구내염 연고' },
  { id: 'dental6', dept: 'dental', complaint: '딱딱한 걸 씹다가 이가 깨진 것 같아요.', diagnosis: '치아 파절', treatment: 'medicine', medicineName: '진통제' },
  { id: 'dental7', dept: 'dental', complaint: '이 사이사이에 누런 게 자꾸 껴요.', diagnosis: '치석', treatment: 'medicine', medicineName: '가글액' },
  { id: 'dental8', dept: 'dental', complaint: '잇몸이 심하게 붓고 피가 계속 나요.', diagnosis: '치주염', treatment: 'medicine', medicineName: '항생제' },
  { id: 'dental9', dept: 'dental', complaint: '입에서 냄새가 심하게 난다고 주변에서 얘기해요.', diagnosis: '구취', treatment: 'medicine', medicineName: '가글액' },
  { id: 'dental10', dept: 'dental', complaint: '어금니 뿌리 쪽이 퉁퉁 붓고 열도 나요.', diagnosis: '치아 농양', treatment: 'iv', ivDrip: true, ivFluid: '항생제 수액' },
];

function diseaseById(id) { return DISEASES.find((d) => d.id === id); }
function deptById(id) { return DEPARTMENTS.find((d) => d.id === id); }
