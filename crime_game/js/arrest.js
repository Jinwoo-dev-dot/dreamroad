// ==============================
// 수배 시스템 + 체포(수갑) 시퀀스 + 호송
// ==============================
'use strict';

function addWanted(n, reason) {
  const prev = State.wanted;
  State.wanted = clamp(State.wanted + n, 0, 5);
  State.wantedSightTimer = 8;
  if (State.wanted > prev) {
    setSubtitle('', 0);
    policeTrySpawn();
  }
}

function policeTrySpawn() {
  if (State.mode !== 'city' || State.arrest) return;
  const active = State.police.filter(p => !p.dead).length;
  const desired = State.wanted;
  for (let i = active; i < desired; i++) {
    policeSpawnNear(State.player.x, State.player.y);
  }
}

function wantedUpdate(dt) {
  if (State.wanted <= 0) return;
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
  State.police = State.police.filter(p => !p.dead);
}

const ARREST_PHASES = {
  freeze: 1.0,
  kneel: 1.0,
  cuff: 1.9,
  escort: 2.4,
  intoCar: 0.8,
  drive: 4.2,
  fade: 0.9,
};

function startArrest(officer) {
  if (State.arrest) return;
  State.arrest = { phase: 'freeze', t: 0, officer, car: null, hidePlayer: false, startX: State.player.x, startY: State.player.y };
  State.mode = 'arrest';
  State.player.controlLocked = true;
  State.player.vx = 0; State.player.vy = 0;
  State.player.facing = angleTo(State.player.x, State.player.y, officer.x, officer.y) + Math.PI;
  setSubtitle('경찰', 1.0, '거기 서! 손들어! 움직이지 마!');
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
      if (A.t >= ARREST_PHASES.freeze) { A.phase = 'kneel'; A.t = 0; setSubtitle('경찰', ARREST_PHASES.kneel, '무릎 꿇어! 두 손은 머리 위로!'); }
      break;
    case 'kneel':
      p.state = 'kneel';
      if (A.t >= ARREST_PHASES.kneel) { A.phase = 'cuff'; A.t = 0; setSubtitle('경찰', ARREST_PHASES.cuff, '수갑을 채우겠습니다. 저항하지 마십시오.'); }
      break;
    case 'cuff':
      p.state = 'cuffed';
      if (officer) {
        const behind = p.facing + Math.PI;
        officer.x = lerp(officer.x, p.x + Math.cos(behind) * 26, dt * 3);
        officer.y = lerp(officer.y, p.y + Math.sin(behind) * 26, dt * 3);
      }
      if (Math.abs(A.t - ARREST_PHASES.cuff * 0.82) < 0.03) {
        spawnParticle({ type: 'spark', x: p.x, y: p.y, vx: 0, vy: -10, life: 0.4, maxLife: 0.4, size: 5 });
      }
      if (A.t >= ARREST_PHASES.cuff) {
        A.phase = 'escort'; A.t = 0;
        A.car = { x: p.x + Math.cos(p.facing) * 90, y: p.y + Math.sin(p.facing) * 90, angle: p.facing, kind: 'police', flashT: 0, door: 0 };
        State.cars.push(A.car);
        setSubtitle('경찰', ARREST_PHASES.escort, '순찰차로 이동합니다.');
      }
      break;
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
        finishArrestIntoJail();
      }
      break;
  }
}

function finishArrestIntoJail() {
  State.arrest = null;
  State.wanted = 0;
  State.police = [];
  State.cars = [];
  State.bullets = [];
  State.player.controlLocked = false;
  State.player.state = 'idle';
  State.player.weapon = 'fists';
  jailInit();
  State.mode = 'jail';
}

function getCameraTarget() {
  if (State.arrest && State.arrest.phase === 'drive') return State.arrest.car;
  return State.player;
}
