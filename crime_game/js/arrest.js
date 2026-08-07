// ==============================
// 수배 시스템 + 체포(수갑) 시퀀스 + 호송
// ==============================
'use strict';

function addWanted(n, reason) {
  const prev = State.wanted;
  State.wanted = clamp(State.wanted + n, 0, 5);
  State.wantedSightTimer = 8;
  if (State.wanted > prev) {
    if (prev === 0) setSubtitle('긴급 신고', 2.5, (reason || '범죄') + ' 신고 접수! 경찰이 출동합니다.');
    policeTrySpawn();
  }
}

function policeTrySpawn() {
  if (State.mode !== 'city' || State.arrest) return;
  const active = State.police.filter(p => !p.dead && p.state !== 'dead').length;
  const desired = State.wanted;
  for (let i = active; i < desired; i++) {
    policeSpawnNear(State.player.x, State.player.y);
  }
}

function wantedUpdate(dt) {
  if (State.wanted <= 0) {
    if (typeof sirenStop === 'function') sirenStop();
    return;
  }
  if (typeof sirenStart === 'function') sirenStart();
  const near = State.police.some(p => !p.dead && p.state === 'chase' && dist(p.x, p.y, State.player.x, State.player.y) < 520);
  if (near) {
    State.wantedSightTimer = 8;
  } else {
    State.wantedSightTimer -= dt;
    if (State.wantedSightTimer <= 0) {
      State.wanted = Math.max(0, State.wanted - 1);
      State.wantedSightTimer = 8;
    }
  }
  policeTrySpawn();
  State.police = State.police.filter(p => !p.dead && !p.removeMe);
}

const ARREST_PHASES = {
  freeze: 1.2,
  kneel: 1.1,
  cuff: 2.7,
  escort: 2.4,
  intoCar: 0.8,
  drive: 4.2,
  fade: 0.9,
};

function startArrest(officer) {
  if (State.arrest) return;
  if (State.player.inVehicle) { State.player.inVehicle.parked = true; State.player.inVehicle = null; }
  if (State.player.hostage) releaseHostage();
  officer.aiming = false;
  State.arrest = { phase: 'freeze', t: 0, officer, car: null, hidePlayer: false, startX: State.player.x, startY: State.player.y, bribeTried: false };
  State.mode = 'arrest';
  State.player.controlLocked = true;
  State.player.vx = 0; State.player.vy = 0;
  State.player.facing = angleTo(State.player.x, State.player.y, officer.x, officer.y) + Math.PI;
  if (typeof sirenStop === 'function') sirenStop();
  setSubtitle('경찰', 1.0, '거기 서! 손들어! 움직이지 마!');
}

function attemptBribeArrest() {
  const A = State.arrest;
  if (!A || A.phase !== 'freeze' || A.bribeTried) return;
  A.bribeTried = true;
  const offer = Math.min(150, State.stats.cash);
  if (offer < 20) {
    setSubtitle('', 1.6, '(수중에 가진 돈이 부족하다...)');
    return;
  }
  State.stats.cash -= offer;
  const chance = Math.min(0.6, offer / 250);
  if (Math.random() < chance) {
    setSubtitle('경찰', 2, '경찰: "...못 본 걸로 하지." (뇌물 💰' + offer + ')');
    const officer = A.officer;
    State.arrest = null;
    State.mode = 'city';
    State.player.controlLocked = false;
    officer.grabTimer = -2.5; // brief grace period so the same officer doesn't instantly re-grab
    officer.state = 'chase';
  } else {
    State.stats.bribeFailed = true;
    setSubtitle('경찰', 2.2, '경찰: "매수 시도?! 가중처벌감이다." (💰' + offer + ' 날림)');
  }
}

function arrestUpdate(dt) {
  const A = State.arrest;
  if (!A) return;
  A.t += dt;
  const officer = A.officer;
  const p = State.player;

  // officer stops nearby, faces player
  if (officer) officer.facing = angleTo(officer.x, officer.y, p.x, p.y);

  switch (A.phase) {
    case 'freeze':
      p.state = 'idle';
      if (officer) officer.aiming = true;
      if (A.t >= ARREST_PHASES.freeze) { A.phase = 'kneel'; A.t = 0; setSubtitle('경찰', ARREST_PHASES.kneel, '무릎 꿇어! 두 손은 머리 위로!'); }
      break;
    case 'kneel':
      p.state = 'kneel';
      if (officer) officer.aiming = true;
      if (A.t >= ARREST_PHASES.kneel) { A.phase = 'cuff'; A.t = 0; setSubtitle('경찰', ARREST_PHASES.cuff, '수갑을 채우겠습니다. 저항하지 마십시오.'); }
      break;
    case 'cuff': {
      const frac = A.t / ARREST_PHASES.cuff;
      if (officer) officer.aiming = frac < 0.2;
      if (frac < 0.2) p.state = 'handsUp';
      else if (frac < 0.42) p.state = 'cuffing1';
      else if (frac < 0.62) p.state = 'cuffing2';
      else p.state = 'cuffed';

      if (officer) {
        const behind = p.facing + Math.PI;
        const approachT = clamp(frac / 0.42, 0, 1); // officer closes in as the first wrist is seized
        officer.x = lerp(officer.x, p.x + Math.cos(behind) * (60 - 34 * approachT), dt * 3);
        officer.y = lerp(officer.y, p.y + Math.sin(behind) * (60 - 34 * approachT), dt * 3);
      }

      if (!A.cuff1Announced && frac >= 0.2) {
        A.cuff1Announced = true;
        setSubtitle('경찰', 1.2, '경찰: "손목 잡습니다. 움직이지 마세요."');
      }
      if (!A.cuffSoundPlayed && frac >= 0.62) {
        A.cuffSoundPlayed = true;
        spawnParticle({ type: 'spark', x: p.x, y: p.y, vx: 0, vy: -10, life: 0.4, maxLife: 0.4, size: 5 });
        spawnParticle({ type: 'text', text: '찰칵!', x: p.x, y: p.y - 22, vx: 0, vy: -16, life: 0.8, maxLife: 0.8, color: '#dfe6ea' });
        if (typeof sfxCuff === 'function') sfxCuff();
      }
      if (!A.cuffTugAnnounced && frac >= 0.85) {
        A.cuffTugAnnounced = true;
        setSubtitle('경찰', ARREST_PHASES.cuff * 0.15, '경찰: "됐습니다. 일어나세요."');
      }
      if (A.t >= ARREST_PHASES.cuff) {
        A.phase = 'escort'; A.t = 0;
        A.car = { x: p.x + Math.cos(p.facing) * 90, y: p.y + Math.sin(p.facing) * 90, angle: p.facing, kind: 'police', flashT: 0, door: 0 };
        State.cars.push(A.car);
        setSubtitle('경찰', ARREST_PHASES.escort, '순찰차로 이동합니다.');
      }
      break;
    }
    case 'escort': {
      p.state = 'walkCuffed';
      const t = clamp(A.t / ARREST_PHASES.escort, 0, 1);
      const targetX = A.car.x - Math.cos(A.car.angle) * 30;
      const targetY = A.car.y - Math.sin(A.car.angle) * 30;
      p.x = lerp(A.startCuffX ?? p.x, targetX, t);
      p.y = lerp(A.startCuffY ?? p.y, targetY, t);
      A.startCuffX = A.startCuffX ?? p.x;
      A.startCuffY = A.startCuffY ?? p.y;
      p.facing = angleTo(p.x, p.y, A.car.x, A.car.y);
      p.speed = 60;
      if (officer) {
        officer.x = lerp(officer.x, p.x - Math.cos(p.facing) * 24, dt * 4);
        officer.y = lerp(officer.y, p.y - Math.sin(p.facing) * 24, dt * 4);
        officer.facing = p.facing;
        officer.speed = 60;
      }
      A.car.door = t;
      if (A.t >= ARREST_PHASES.escort) { A.phase = 'intoCar'; A.t = 0; }
      break;
    }
    case 'intoCar':
      A.hidePlayer = A.t > ARREST_PHASES.intoCar * 0.4;
      if (A.t >= ARREST_PHASES.intoCar) {
        A.phase = 'drive'; A.t = 0;
        A.driveFrom = { x: A.car.x, y: A.car.y };
        const hq = World.policeHQ.doorRect;
        A.driveTo = { x: hq.x + hq.w / 2, y: hq.y + hq.h + 70 };
        setSubtitle('', ARREST_PHASES.drive, '경찰서로 이송 중입니다...');
      }
      break;
    case 'drive': {
      const t = clamp(A.t / ARREST_PHASES.drive, 0, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      A.car.x = lerp(A.driveFrom.x, A.driveTo.x, ease);
      A.car.y = lerp(A.driveFrom.y, A.driveTo.y, ease);
      A.car.angle = angleTo(A.driveFrom.x, A.driveFrom.y, A.driveTo.x, A.driveTo.y);
      if (A.t >= ARREST_PHASES.drive) { A.phase = 'fade'; A.t = 0; }
      break;
    }
    case 'fade':
      if (A.t >= ARREST_PHASES.fade) {
        finishArrestIntoTrial();
      }
      break;
  }
}

function finishArrestIntoTrial() {
  State.arrest = null;
  State.wanted = 0;
  State.police = [];
  State.cars = State.cars.filter((c) => c.kind === 'civilian');
  State.bullets = [];
  State.player.state = 'idle';
  State.player.weapon = 'fists';
  trialInit({
    kills: State.stats.kills, thefts: State.stats.thefts, copKills: State.stats.copKills,
    escaped: State.stats.escaped, bribeFailed: State.stats.bribeFailed,
  });
}

function getCameraTarget() {
  if (State.arrest && State.arrest.phase === 'drive') return State.arrest.car;
  return State.player;
}
