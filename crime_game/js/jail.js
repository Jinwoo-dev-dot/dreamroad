// ==============================
// 교도소: 공간 구성 + 하루 일과(스케줄) 시뮬레이션
// ==============================
'use strict';

const JailLayout = {
  w: 940, h: 640,
  cell: { x: 40, y: 40, w: 110, h: 90 },
  cellBlockLabel: { x: 95, y: 24 },
  corridor: { x: 20, y: 150, w: 900, h: 60 },
  cafeteria: { x: 20, y: 230, w: 260, h: 200 },
  workroom: { x: 320, y: 230, w: 260, h: 200 },
  yard: { x: 620, y: 230, w: 300, h: 370 },
  commonBounds: { x: 20, y: 40, w: 900, h: 560 },
  escapeSpot: { x: 650, y: 570 },
};

// schedule: minute-of-day -> event
const JAIL_SCHEDULE = [
  { time: 360, label: '기상', room: 'cell', sub: '기상! 점호 준비.', lock: false },
  { time: 400, label: '점호', room: 'corridor', sub: '전원 복도로 집합.', lock: false },
  { time: 420, label: '아침 식사', room: 'cafeteria', sub: '식당으로 이동하세요.', lock: false },
  { time: 540, label: '작업 시간', room: 'workroom', sub: '작업장으로 이동하세요.', lock: false },
  { time: 720, label: '점심 식사', room: 'cafeteria', sub: '식당으로 이동하세요.', lock: false },
  { time: 780, label: '운동 시간', room: 'yard', sub: '운동장에서 자유롭게 움직일 수 있습니다.', lock: false },
  { time: 1020, label: '저녁 식사', room: 'cafeteria', sub: '식당으로 이동하세요.', lock: false },
  { time: 1080, label: '자유 시간', room: 'corridor', sub: '취침 전 자유 시간입니다.', lock: false },
  { time: 1320, label: '소등 / 취침', room: 'cell', sub: '전원 취침. 감방으로 복귀.', lock: true },
];

function jailFindEvent(minuteOfDay) {
  let ev = JAIL_SCHEDULE[JAIL_SCHEDULE.length - 1];
  for (const e of JAIL_SCHEDULE) {
    if (e.time <= minuteOfDay) ev = e; else break;
  }
  return ev;
}

function jailInit(sentenceDays, isDeathRow) {
  State.jail = {
    minutes: 1090, // arrive in the evening (자유 시간)
    lastEventTime: -1,
    locked: false,
    current: null,
    guards: [],
    inmates: [],
    processed: false,
    sentenceDays: sentenceDays || 1,
    servedDays: 0,
    releasing: false,
    releaseT: 0,
    isDeathRow: !!isDeathRow,
    executing: false,
    escapeT: 0,
  };
  State.player.x = JailLayout.cell.x + JailLayout.cell.w / 2;
  State.player.y = JailLayout.cell.y + JailLayout.cell.h / 2;
  State.player.controlLocked = false;
  State.player.weapon = 'fists';

  State.jail.guards = [
    { x: 60, y: 180, dir: 1, radius: 13, animTimer: 0, speed: 0, facing: 0, kind: 'guard' },
    { x: 700, y: 180, dir: -1, radius: 13, animTimer: rand(0, 5), speed: 0, facing: Math.PI, kind: 'guard' },
    {
      x: JailLayout.yard.x + 60, y: JailLayout.yard.y + 50, radius: 13, animTimer: 0, speed: 0, facing: 0, kind: 'guard', yard: true,
      patrolA: { x: JailLayout.yard.x + 60, y: JailLayout.yard.y + 50 },
      patrolB: { x: JailLayout.escapeSpot.x + 20, y: JailLayout.escapeSpot.y - 60 },
      toward: 'B',
    },
  ];
  State.jail.inmates = [];
  if (!isDeathRow) {
    for (let i = 0; i < 6; i++) {
      State.jail.inmates.push({
        kind: 'inmate', x: rand(700, 880), y: rand(260, 560), radius: 12,
        target: { x: rand(650, 900), y: rand(240, 580) },
        pauseTimer: rand(0.5, 2), facing: 0, animTimer: rand(0, 5), speed: 0,
        color: '#e8791f',
      });
    }
  }
}

function jailBounds() {
  if (State.jail.locked) {
    const c = JailLayout.cell;
    return { minX: c.x + 16, maxX: c.x + c.w - 16, minY: c.y + 16, maxY: c.y + c.h - 16 };
  }
  const b = JailLayout.commonBounds;
  return { minX: b.x + 16, maxX: b.x + b.w - 16, minY: b.y + 16, maxY: b.y + b.h - 16 };
}

function jailUpdate(dt) {
  const J = State.jail;

  if (J.releasing) {
    J.releaseT += dt;
    State.player.controlLocked = true;
    if (J.releaseT >= 2.6) jailRelease();
    return;
  }

  const RATE = 45; // in-game minutes per real second (1 day ~= 32s)
  J.minutes += dt * RATE;
  if (J.minutes >= 1440) {
    J.minutes -= 1440;
    State.day += 1;
    J.servedDays += 1;
    if (J.servedDays >= J.sentenceDays) {
      if (J.isDeathRow) {
        J.executing = true;
        setSubtitle('교도관', 3, '집행일이 밝았습니다.');
        startExecutionSequence();
        return;
      }
      J.releasing = true;
      J.releaseT = 0;
      State.player.controlLocked = true;
      setSubtitle('교도관', 3, '형기를 마쳤습니다. 출소 절차를 진행합니다.');
      if (typeof sfxRelease === 'function') sfxRelease();
      return;
    }
    if (J.isDeathRow) {
      setSubtitle('교도소', 2.5, '사형 집행까지 D-' + (J.sentenceDays - J.servedDays) + '.');
    } else {
      setSubtitle('교도소', 2.5, State.day + '일째 아침이 밝았습니다. (남은 형기 ' + (J.sentenceDays - J.servedDays) + '일)');
    }
  }

  const ev = jailFindEvent(Math.floor(J.minutes));
  if (ev.time !== J.lastEventTime) {
    J.lastEventTime = ev.time;
    J.current = ev;
    setSubtitle('교도관 방송', 3, '[' + ev.label + '] ' + ev.sub);
    if (typeof sfxBuzzer === 'function') sfxBuzzer();
    if (ev.lock) {
      J.locked = true;
      State.player.x = JailLayout.cell.x + JailLayout.cell.w / 2;
      State.player.y = JailLayout.cell.y + JailLayout.cell.h / 2;
    } else {
      J.locked = false;
    }
  }

  // player movement (bounded)
  const b = jailBounds();
  const p = State.player;
  const dx = State.mouse.wx - p.x, dy = State.mouse.wy - p.y;
  const d = Math.hypot(dx, dy);
  const maxSpeed = d < 10 ? 0 : (d < 170 ? lerp(30, 140, d / 170) : 200);
  if (d > 3) p.facing = Math.atan2(dy, dx);
  let tvx = 0, tvy = 0;
  if (d > 10) { tvx = (dx / d) * maxSpeed; tvy = (dy / d) * maxSpeed; }
  p.vx = lerp(p.vx, tvx, Math.min(1, dt * 8));
  p.vy = lerp(p.vy, tvy, Math.min(1, dt * 8));
  p.speed = Math.hypot(p.vx, p.vy);
  p.x = clamp(p.x + p.vx * dt, b.minX, b.maxX);
  p.y = clamp(p.y + p.vy * dt, b.minY, b.maxY);
  p.animTimer += dt;
  p.state = p.speed > 130 ? 'run' : (p.speed > 5 ? 'walk' : 'idle');

  // guards patrol corridor (or the yard, for the dedicated yard guard)
  for (const g of J.guards) {
    g.animTimer += dt;
    if (g.yard) {
      const target = g.toward === 'B' ? g.patrolB : g.patrolA;
      const dgx = target.x - g.x, dgy = target.y - g.y;
      const dg = Math.hypot(dgx, dgy);
      g.speed = 45;
      if (dg < 8) {
        g.toward = g.toward === 'B' ? 'A' : 'B';
      } else {
        g.facing = Math.atan2(dgy, dgx);
        g.x += (dgx / dg) * g.speed * dt;
        g.y += (dgy / dg) * g.speed * dt;
      }
    } else {
      g.speed = 60;
      g.x += g.dir * g.speed * dt;
      g.facing = g.dir > 0 ? 0 : Math.PI;
      if (g.x > 860) g.dir = -1;
      if (g.x < 60) g.dir = 1;
    }
  }

  jailEscapeUpdate(dt);
  if (!State.jail) return; // a successful jailbreak just tore down the jail scene

  // ambient inmates wander within common bounds (skip while locked - stay in their own bunks conceptually, just freeze)
  for (const inm of J.inmates) {
    inm.animTimer += dt;
    if (J.locked) { inm.speed = 0; continue; }
    const idx = dist(inm.x, inm.y, inm.target.x, inm.target.y);
    if (idx < 10) {
      inm.pauseTimer -= dt;
      inm.speed = 0;
      if (inm.pauseTimer <= 0) {
        inm.target = { x: rand(650, 900), y: rand(240, 580) };
        inm.pauseTimer = rand(1, 3);
      }
    } else {
      inm.speed = 50;
      inm.facing = Math.atan2(inm.target.y - inm.y, inm.target.x - inm.x);
      inm.x += Math.cos(inm.facing) * inm.speed * dt;
      inm.y += Math.sin(inm.facing) * inm.speed * dt;
    }
  }

  playerCheckJailPrompt();
}

function jailEscapeUpdate(dt) {
  const J = State.jail;
  const p = State.player;
  const inYard = J.current && J.current.room === 'yard' && !J.locked;
  const nearSpot = inYard && dist(p.x, p.y, JailLayout.escapeSpot.x, JailLayout.escapeSpot.y) < 45;
  const holdingE = !!(State.keys['e'] || State.keys['E']);

  if (nearSpot && holdingE) {
    J.escapeT += dt;
    const guardNear = J.guards.some((g) => dist(g.x, g.y, p.x, p.y) < 140);
    if (guardNear) {
      J.escapeT = 0;
      if (typeof sfxCaughtEscaping === 'function') sfxCaughtEscaping();
      setSubtitle('교도관', 2.6, '"거기 뭐 하는 거야!!" 탈옥 시도가 발각되었습니다. 형기가 3일 추가됩니다.');
      J.sentenceDays += 3;
      J.locked = true;
      p.x = JailLayout.cell.x + JailLayout.cell.w / 2;
      p.y = JailLayout.cell.y + JailLayout.cell.h / 2;
    } else if (J.escapeT >= 3.0) {
      jailbreakSuccess();
    }
  } else if (!nearSpot) {
    J.escapeT = 0;
  }
}

function jailbreakSuccess() {
  if (typeof sfxEscape === 'function') sfxEscape();
  setSubtitle('나레이션', 3.2, '철조망을 넘었다! 하지만 곧 온 도시에 수배령이 내려질 것이다...');
  State.stats.escaped = (State.stats.escaped || 0) + 1;
  State.jail = null;
  State.player.controlLocked = false;
  State.player.inv = { knife: false, gun: false };
  State.player.weapon = 'fists';
  State.mode = 'city';
  const hq = World.policeHQ.doorRect;
  State.player.x = hq.x + hq.w / 2;
  State.player.y = hq.y + hq.h + 50;
  updateCamera(false);
  State.wanted = 5;
  State.wantedSightTimer = 12;
  policeTrySpawn();
}

function playerCheckJailPrompt() {
  const J = State.jail;
  if (J.locked) { State.prompt = '취침 시간입니다 (자유 이동 불가)'; return; }
  const inYard = J.current && J.current.room === 'yard';
  if (inYard && dist(State.player.x, State.player.y, JailLayout.escapeSpot.x, JailLayout.escapeSpot.y) < 45) {
    State.prompt = J.escapeT > 0
      ? '탈옥 시도 중... ' + J.escapeT.toFixed(1) + ' / 3.0초 (E 유지, 경비 접근 시 발각)'
      : 'E를 누르고 있으면 철조망을 넘습니다 (경비를 조심하세요)';
    return;
  }
  State.prompt = '';
}

function jailRelease() {
  State.stats.kills = 0;
  State.stats.thefts = 0;
  State.wanted = 0;
  State.police = [];
  State.cars = [];
  State.bullets = [];
  State.player.controlLocked = false;
  State.player.inv = { knife: false, gun: false };
  State.player.weapon = 'fists';
  State.homeTaken = { knife: false, gun: false };
  State.jail = null;
  enterHome();
  updateCamera(false);
  setSubtitle('나레이션', 3.5, '자유의 몸이 되었다. 하지만 손에는 아무것도 남지 않았다...');
}

function jailDraw(ctx) {
  ctx.fillStyle = '#232629';
  ctx.fillRect(0, 0, JailLayout.w, JailLayout.h);

  // cell block
  drawRoomFloor(ctx, { x: 20, y: 20, w: 260, h: 130 }, '#2f333a', '감방동');
  drawCellBars(ctx, JailLayout.cell, State.jail.locked);
  // bunk
  ctx.fillStyle = '#5a5f66';
  ctx.fillRect(JailLayout.cell.x + 8, JailLayout.cell.y + 8, JailLayout.cell.w - 16, 26);
  ctx.fillStyle = '#8a97a3';
  ctx.fillRect(JailLayout.cell.x + 8, JailLayout.cell.y + 8, JailLayout.cell.w - 16, 8);
  // toilet/sink
  ctx.fillStyle = '#77828c';
  ctx.beginPath(); ctx.arc(JailLayout.cell.x + JailLayout.cell.w - 20, JailLayout.cell.y + JailLayout.cell.h - 18, 10, 0, Math.PI * 2); ctx.fill();

  // corridor
  drawRoomFloor(ctx, JailLayout.corridor, '#3a3f45', '복도');

  // cafeteria
  drawRoomFloor(ctx, JailLayout.cafeteria, '#33302a', '식당');
  drawTables(ctx, JailLayout.cafeteria);

  // workroom
  drawRoomFloor(ctx, JailLayout.workroom, '#2c3330', '작업장');
  drawWorkbenches(ctx, JailLayout.workroom);

  // yard
  drawYard(ctx, JailLayout.yard);

  // guards
  for (const g of State.jail.guards) {
    drawPerson(ctx, g, { bodyColor: '#3a4f8a', headColor: SKIN, hat: '#26346b', badge: true, weapon: 'none' });
  }
  // inmates
  for (const inm of State.jail.inmates) {
    drawPerson(ctx, inm, { bodyColor: inm.color, headColor: SKIN, weapon: 'none' });
  }

  drawPlayer(ctx);
  drawParticles(ctx);
}

function drawRoomFloor(ctx, r, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#8f98a3';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, r.x + 6, r.y + 16);
}

function drawCellBars(ctx, cell, locked) {
  ctx.fillStyle = '#171a1c';
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.strokeStyle = locked ? '#c94b4b' : '#7a8087';
  ctx.lineWidth = 3;
  for (let i = 0; i <= cell.w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(cell.x + i, cell.y + cell.h - 4);
    ctx.lineTo(cell.x + i, cell.y + cell.h + (locked ? 14 : 6));
    ctx.stroke();
  }
  ctx.fillStyle = '#c8d0d8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(locked ? '🔒 잠김' : '열림', cell.x + cell.w / 2, cell.y - 8);
}

function drawTables(ctx, r) {
  ctx.fillStyle = '#4a3c2c';
  for (let i = 0; i < 3; i++) {
    const tx = r.x + 20 + i * 75;
    ctx.fillRect(tx, r.y + 90, 55, 26);
  }
}

function drawWorkbenches(ctx, r) {
  ctx.fillStyle = '#3d4b46';
  for (let i = 0; i < 2; i++) {
    const tx = r.x + 20 + i * 120;
    ctx.fillRect(tx, r.y + 100, 100, 30);
  }
}

function drawYard(ctx, r) {
  ctx.fillStyle = '#3f6b3f';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
  ctx.setLineDash([]);
  ctx.fillStyle = '#8f98a3';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('운동장', r.x + 6, r.y + 16);

  // basketball hoop
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(r.x + r.w - 40, r.y + 40, 12, 0, Math.PI * 2); ctx.stroke();

  // weight bench
  ctx.fillStyle = '#555';
  ctx.fillRect(r.x + 30, r.y + r.h - 60, 60, 16);
  ctx.beginPath(); ctx.arc(r.x + 28, r.y + r.h - 52, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r.x + 92, r.y + r.h - 52, 10, 0, Math.PI * 2); ctx.fill();

  // fence posts
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const fx = r.x + (i * r.w) / 9;
    ctx.beginPath(); ctx.moveTo(fx, r.y); ctx.lineTo(fx, r.y - 14); ctx.stroke();
  }

  // weak fence spot (jailbreak point)
  const es = JailLayout.escapeSpot;
  ctx.strokeStyle = 'rgba(255,90,90,0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(es.x, es.y, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,90,90,0.9)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('약해진 철조망', es.x, es.y + 38);
}
