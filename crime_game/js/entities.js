// ==============================
// 플레이어 / NPC / 경찰 / 총알 / 파티클
// ==============================
'use strict';

const SKIN = '#e0b48c';
const CIVILIAN_COLORS = ['#c85a5a', '#5a8cc8', '#c8a15a', '#7ac85a', '#a15ac8', '#5ac8b0', '#c85a9e'];

// ---------- Player ----------
function createPlayer() {
  return {
    kind: 'player',
    x: 0, y: 0, radius: 14,
    vx: 0, vy: 0,
    facing: 0,
    speed: 0,
    state: 'idle', // idle/walk/run/attackKnife/attackGun/kneel/cuffed/walkCuffed/enter
    animTimer: 0,
    weapon: 'fists', // fists/knife/gun
    inv: { knife: false, gun: false },
    atkCooldown: 0,
    atkTimer: 0,
    atkApplied: false,
    controlLocked: false,
    recoil: 0,
  };
}

function playerSetWeapon(w) {
  const p = State.player;
  if (w === 'fists') { p.weapon = 'fists'; return; }
  if (w === 'knife' && p.inv.knife) p.weapon = 'knife';
  if (w === 'gun' && p.inv.gun) p.weapon = 'gun';
}

function playerUpdate(dt) {
  const p = State.player;
  if (p.atkCooldown > 0) p.atkCooldown -= dt;
  if (p.recoil > 0) p.recoil = Math.max(0, p.recoil - dt * 6);

  if (p.controlLocked) {
    p.vx = 0; p.vy = 0; p.speed = 0;
    return;
  }

  const dx = State.mouse.wx - p.x;
  const dy = State.mouse.wy - p.y;
  const d = Math.hypot(dx, dy);
  const RUN_T = 170;
  const maxSpeed = d < 10 ? 0 : (d < RUN_T ? lerp(30, 150, d / RUN_T) : 250);

  if (d > 3) p.facing = Math.atan2(dy, dx);

  let tvx = 0, tvy = 0;
  if (d > 10) { tvx = (dx / d) * maxSpeed; tvy = (dy / d) * maxSpeed; }
  p.vx = lerp(p.vx, tvx, Math.min(1, dt * 8));
  p.vy = lerp(p.vy, tvy, Math.min(1, dt * 8));
  p.speed = Math.hypot(p.vx, p.vy);

  let nx = p.x + p.vx * dt;
  let ny = p.y + p.vy * dt;
  const hit = worldIsSolid(nx, ny, p.radius);
  if (hit) { nx = hit.x; ny = hit.y; }
  const b = worldClampToBounds(nx, ny, p.radius);
  p.x = b.x; p.y = b.y;

  p.animTimer += dt;

  if (p.state === 'attackKnife' || p.state === 'attackGun') {
    p.atkTimer += dt;
    const dur = p.state === 'attackKnife' ? 0.38 : 0.18;
    if (!p.atkApplied && p.atkTimer >= dur * 0.4) {
      applyAttack(p);
      p.atkApplied = true;
    }
    if (p.atkTimer >= dur) {
      p.state = p.speed > 140 ? 'run' : (p.speed > 5 ? 'walk' : 'idle');
    }
  } else {
    p.state = p.speed > 140 ? 'run' : (p.speed > 5 ? 'walk' : 'idle');
  }

  if (State.mouse.down && p.atkCooldown <= 0 && p.weapon !== 'fists') {
    triggerPlayerAttack();
  }

  playerCheckInteractionPrompt();
}

function triggerPlayerAttack() {
  const p = State.player;
  if (p.weapon === 'knife') {
    p.state = 'attackKnife';
    p.atkCooldown = 0.5;
  } else if (p.weapon === 'gun') {
    p.state = 'attackGun';
    p.atkCooldown = 0.28;
    p.recoil = 1;
    const bx = p.x + Math.cos(p.facing) * 22;
    const by = p.y + Math.sin(p.facing) * 22;
    spawnParticle({ type: 'muzzle', x: bx, y: by, vx: 0, vy: 0, life: 0.08, maxLife: 0.08, size: 16 });
    State.bullets.push({ x: bx, y: by, vx: Math.cos(p.facing) * 900, vy: Math.sin(p.facing) * 900, life: 0.7, owner: 'player' });
  }
  p.atkTimer = 0;
  p.atkApplied = false;
}

function applyAttack(p) {
  if (p.weapon === 'knife') {
    const range = 50;
    const cone = Math.PI / 2.2;
    let target = null, bestD = range;
    const pool = [...State.npcs, ...State.police];
    for (const e of pool) {
      if (e.state === 'dead') continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > bestD) continue;
      const a = Math.abs(angleLerp(p.facing, angleTo(p.x, p.y, e.x, e.y), 1));
      if (Math.abs(((a - p.facing + Math.PI) % (Math.PI * 2)) - Math.PI) < cone) { /* noop */ }
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      let diff = Math.abs(ang - p.facing);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < cone / 2 && d < bestD) { bestD = d; target = e; }
    }
    if (target) combatHit(target, 'knife');
  }
}

function playerCheckInteractionPrompt() {
  State.prompt = '';
  if (State.mode === 'city') {
    const near = worldNearestDoor(State.player.x, State.player.y, 55);
    if (near) State.prompt = 'E : 들어가기';
  } else if (State.mode === 'home') {
    if (!State.homeTaken.knife && dist(State.player.x, State.player.y, HomeInterior.knifeSpot.x, HomeInterior.knifeSpot.y) < 40) {
      State.prompt = 'E : 칼 챙기기';
    } else if (!State.homeTaken.gun && dist(State.player.x, State.player.y, HomeInterior.gunSpot.x, HomeInterior.gunSpot.y) < 40) {
      State.prompt = 'E : 총 챙기기';
    } else if (dist(State.player.x, State.player.y, HomeInterior.exit.x, HomeInterior.exit.y) < 50) {
      State.prompt = 'E : 밖으로 나가기';
    }
  } else if (State.mode === 'store') {
    const store = getStoreById(State.storeId);
    if (dist(State.player.x, State.player.y, StoreInterior.exit.x, StoreInterior.exit.y) < 50) {
      State.prompt = 'E : 가게 나가기';
    } else {
      for (const shelf of StoreInterior.shelves) {
        if (dist(State.player.x, State.player.y, shelf.x + shelf.w / 2, shelf.y + shelf.h / 2) < 55) {
          State.prompt = 'E : 훔치기 (' + shelf.item + ')';
          break;
        }
      }
    }
  }
}

// ---------- Combat resolution ----------
function combatHit(target, weapon) {
  if (target.kind === 'npc') killNpc(target);
  else if (target.kind === 'police') woundPolice(target);
}

function killNpc(npc) {
  if (npc.state === 'dead') return;
  npc.state = 'dead';
  npc.deathT = 0;
  npc.fallDir = npc.facing + rand(-0.4, 0.4);
  npc.decalDone = false;
  spawnBloodBurst(npc.x, npc.y, 12);
  addWanted(3, '폭행/살인');
  for (const o of State.npcs) {
    if (o !== npc && o.state !== 'dead' && dist(o.x, o.y, npc.x, npc.y) < 260) {
      o.state = 'flee';
      o.fleeFrom = { x: npc.x, y: npc.y };
      o.fleeTimer = rand(2.5, 4.5);
    }
  }
}

function woundPolice(officer) {
  spawnBloodBurst(officer.x, officer.y, 5);
  officer.stagger = 0.5;
  addWanted(5, '경찰 공격');
  for (const p of State.police) p.state = 'chase';
}

function spawnBloodBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = rand(30, 160);
    spawnParticle({ type: 'blood', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, maxLife: 0.5, size: rand(2, 5) });
  }
}

function spawnParticle(pt) { State.particles.push(pt); }

// ---------- NPC ----------
function npcCreate(x, y) {
  return {
    kind: 'npc',
    x, y, radius: 12,
    state: 'wander',
    target: { x, y },
    pauseTimer: rand(0.5, 2),
    fleeTimer: 0, fleeFrom: null,
    facing: rand(0, Math.PI * 2),
    animTimer: rand(0, 10),
    color: pick(CIVILIAN_COLORS),
    deathT: 0, fallDir: 0, decalDone: false,
    speed: 0,
    respawnT: 0,
  };
}

function npcSpawnAll(n) {
  State.npcs = [];
  for (let i = 0; i < n; i++) {
    const wp = pick(World.waypoints);
    State.npcs.push(npcCreate(wp.x + rand(-40, 40), wp.y + rand(-40, 40)));
  }
}

function npcPickTarget(npc) {
  const wp = pick(World.waypoints);
  npc.target = { x: clamp(wp.x + rand(-60, 60), 20, World.width - 20), y: clamp(wp.y + rand(-60, 60), 20, World.height - 20) };
}

function npcUpdate(npc, dt) {
  npc.animTimer += dt;
  if (npc.state === 'dead') {
    npc.deathT += dt;
    if (npc.deathT > 14) {
      // recycle into a fresh wandering npc elsewhere
      const wp = pick(World.waypoints);
      Object.assign(npc, npcCreate(wp.x, wp.y));
    }
    npc.speed = 0;
    return;
  }

  let target = npc.target;
  let sp = 55;
  if (npc.state === 'flee') {
    sp = 175;
    npc.fleeTimer -= dt;
    const away = angleTo(npc.fleeFrom.x, npc.fleeFrom.y, npc.x, npc.y);
    target = { x: npc.x + Math.cos(away) * 200, y: npc.y + Math.sin(away) * 200 };
    if (npc.fleeTimer <= 0) { npc.state = 'wander'; npcPickTarget(npc); }
  } else {
    const d = dist(npc.x, npc.y, target.x, target.y);
    if (d < 12) {
      npc.pauseTimer -= dt;
      sp = 0;
      if (npc.pauseTimer <= 0) { npcPickTarget(npc); npc.pauseTimer = rand(1, 3); }
    }
  }

  const dx = target.x - npc.x, dy = target.y - npc.y;
  const d2 = Math.hypot(dx, dy);
  npc.speed = sp;
  if (d2 > 2 && sp > 0) {
    npc.facing = Math.atan2(dy, dx);
    let nx = npc.x + (dx / d2) * sp * dt;
    let ny = npc.y + (dy / d2) * sp * dt;
    const hit = worldIsSolid(nx, ny, npc.radius);
    if (hit) { nx = hit.x; ny = hit.y; }
    const b = worldClampToBounds(nx, ny, npc.radius);
    npc.x = b.x; npc.y = b.y;
  }
}

// ---------- Police ----------
function policeCreate(x, y) {
  return {
    kind: 'police',
    x, y, radius: 13,
    state: 'chase', // chase/leaving
    facing: 0,
    animTimer: 0,
    speed: 0,
    grabTimer: 0,
    stagger: 0,
    leaveTimer: 0,
  };
}

function policeSpawnNear(px, py) {
  let x, y, tries = 0;
  do {
    const a = rand(0, Math.PI * 2);
    const r = rand(420, 780);
    x = clamp(px + Math.cos(a) * r, 30, World.width - 30);
    y = clamp(py + Math.sin(a) * r, 30, World.height - 30);
    tries++;
  } while (worldIsSolid(x, y, 14) && tries < 12);
  const officer = policeCreate(x, y);
  State.police.push(officer);
  State.cars.push({ x, y, angle: rand(0, Math.PI * 2), flashT: 0, kind: 'police' });
}

function policeUpdate(officer, dt) {
  officer.animTimer += dt;
  if (officer.stagger > 0) officer.stagger -= dt;

  if (State.wanted <= 0) {
    officer.state = 'leaving';
  }

  if (officer.state === 'leaving') {
    officer.leaveTimer += dt;
    officer.speed = 90;
    officer.facing += 0.02;
    if (officer.leaveTimer > 2.2) officer.dead = true;
    return;
  }

  const p = State.player;
  const d = dist(officer.x, officer.y, p.x, p.y);
  const sp = officer.stagger > 0 ? 40 : 205;
  officer.speed = sp;
  if (d > 2) {
    officer.facing = Math.atan2(p.y - officer.y, p.x - officer.x);
    let nx = officer.x + Math.cos(officer.facing) * sp * dt;
    let ny = officer.y + Math.sin(officer.facing) * sp * dt;
    const hit = worldIsSolid(nx, ny, officer.radius);
    if (hit) { nx = hit.x; ny = hit.y; }
    const b = worldClampToBounds(nx, ny, officer.radius);
    officer.x = b.x; officer.y = b.y;
  }

  if (d < 34 && State.mode === 'city' && !State.arrest) {
    officer.grabTimer += dt;
  } else {
    officer.grabTimer = Math.max(0, officer.grabTimer - dt * 2);
  }
  if (officer.grabTimer > 0.55 && !State.arrest) {
    startArrest(officer);
  }
}

function bulletsUpdate(dt) {
  for (const b of State.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (worldIsSolid(b.x, b.y, 2)) { b.dead = true; continue; }
    const pool = b.owner === 'player' ? [...State.npcs, ...State.police] : [];
    for (const e of pool) {
      if (e.state === 'dead') continue;
      if (dist(b.x, b.y, e.x, e.y) < e.radius) {
        combatHit(e, 'gun');
        b.dead = true;
        break;
      }
    }
    if (b.life <= 0) b.dead = true;
  }
  State.bullets = State.bullets.filter(b => !b.dead);
}

function particlesUpdate(dt) {
  for (const pt of State.particles) {
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.9; pt.vy *= 0.9;
    pt.life -= dt;
  }
  State.particles = State.particles.filter(pt => pt.life > 0);

  for (const npc of State.npcs) {
    if (npc.state === 'dead' && npc.deathT > 0.4 && !npc.decalDone) {
      npc.decalDone = true;
      State.decals.push({ x: npc.x, y: npc.y, r: rand(16, 24), a: 0.85 });
    }
  }
}

// ---------- Drawing ----------
function drawPerson(ctx, e, cfg) {
  const speed = e.speed || 0;
  const walking = speed > 5;
  const cycle = Math.sin(e.animTimer * (walking ? (speed > 140 ? 14 : 9) : 3)) * (walking ? 1 : 0.15);

  ctx.save();
  ctx.translate(e.x, e.y);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, e.radius * 0.9, e.radius * 0.9, e.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (e.state === 'dead') {
    const t = clamp(e.deathT / 0.4, 0, 1);
    ctx.rotate(e.fallDir + Math.PI / 2);
    ctx.globalAlpha = 1;
    ctx.translate(0, lerp(0, 6, t));
    ctx.scale(1, lerp(1, 0.55, t));
    drawBodyShape(ctx, cfg, 0, false);
    ctx.restore();
    return;
  }

  ctx.rotate(e.facing);

  // legs
  ctx.strokeStyle = cfg.pantsColor || '#333';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const legSwing = cycle * 8;
  ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2 - legSwing, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(-2 + legSwing, 10); ctx.stroke();

  // body + arms + head drawn body-relative but body/head should stay upright-ish;
  // we rotate back for torso so weapon aiming reads clearly
  ctx.rotate(-e.facing);
  const fx = Math.cos(e.facing), fy = Math.sin(e.facing);

  drawArmsAndWeapon(ctx, e, cfg, fx, fy, cycle);

  drawBodyShape(ctx, cfg, 0, true);

  // head
  ctx.fillStyle = cfg.headColor || SKIN;
  ctx.beginPath(); ctx.arc(0, 0, e.radius * 0.62, 0, Math.PI * 2); ctx.fill();
  if (cfg.hat) {
    ctx.fillStyle = cfg.hat;
    ctx.beginPath(); ctx.arc(0, -2, e.radius * 0.66, Math.PI, 0); ctx.fill();
    ctx.fillRect(-e.radius * 0.66, -2, e.radius * 1.32, 3);
  }
  // face direction dot
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(fx * 6, fy * 6, 2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawBodyShape(ctx, cfg, yoff, withRotationContext) {
  ctx.fillStyle = cfg.bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, yoff, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  if (cfg.badge) {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(-4, yoff - 2, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawArmsAndWeapon(ctx, e, cfg, fx, fy, cycle) {
  ctx.strokeStyle = cfg.bodyColor;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  if (cfg.cuffed) {
    // arms bent behind back
    ctx.strokeStyle = cfg.bodyColor;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-2, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-2, 2); ctx.stroke();
    ctx.fillStyle = '#c0c0c8';
    ctx.fillRect(-6, -3, 6, 6);
    return;
  }

  if (cfg.weapon === 'knife' && e.state === 'attackKnife') {
    const t = clamp(e.atkTimer / 0.38, 0, 1);
    const swing = lerp(-1.3, 1.3, t);
    const ax = fx * 16 - fy * swing * 10;
    const ay = fy * 16 + fx * swing * 10;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.strokeStyle = '#dfe6ea';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + fx * 14, ay + fy * 14); ctx.stroke();
  } else if (cfg.weapon === 'knife') {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(fx * 14, fy * 14); ctx.stroke();
    ctx.strokeStyle = '#dfe6ea'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(fx * 14, fy * 14); ctx.lineTo(fx * 22, fy * 22); ctx.stroke();
  } else if (cfg.weapon === 'gun') {
    const kick = e.recoil ? e.recoil * -6 : 0;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(fx * (16 + kick), fy * (16 + kick)); ctx.stroke();
    ctx.fillStyle = '#20242a';
    ctx.save();
    ctx.translate(fx * (18 + kick), fy * (18 + kick));
    ctx.rotate(Math.atan2(fy, fx));
    ctx.fillRect(0, -3, 16, 6);
    ctx.restore();
  } else {
    const s = cycle * 8;
    ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-3 + s, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-3 - s, -4); ctx.stroke();
  }
}

function drawPlayer(ctx) {
  const p = State.player;
  const cfg = {
    bodyColor: State.mode === 'jail' ? '#e8791f' : '#3a4a6b',
    headColor: SKIN,
    weapon: (p.state === 'attackKnife' || p.state === 'attackGun') ? p.weapon : p.weapon,
    cuffed: p.state === 'cuffed' || p.state === 'walkCuffed' || p.state === 'kneel',
  };
  if (p.state === 'kneel') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.75);
    ctx.translate(-p.x, -p.y);
    drawPerson(ctx, p, cfg);
    ctx.restore();
    return;
  }
  drawPerson(ctx, p, cfg);

  // muzzle flash draw handled by particle system
}

function drawNpc(ctx, npc) {
  drawPerson(ctx, npc, { bodyColor: npc.color, headColor: SKIN, weapon: 'none' });
  if (npc.state === 'flee') {
    ctx.save();
    ctx.translate(npc.x, npc.y - 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, 0);
    ctx.restore();
  }
}

function drawPoliceOfficer(ctx, officer) {
  drawPerson(ctx, officer, { bodyColor: '#26428a', headColor: SKIN, hat: '#1c2f66', badge: true, weapon: 'none' });
}

function drawBullets(ctx) {
  ctx.fillStyle = '#fff6b0';
  for (const b of State.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawParticles(ctx) {
  for (const pt of State.particles) {
    const alpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    if (pt.type === 'blood') {
      ctx.fillStyle = '#8a1414';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    } else if (pt.type === 'muzzle') {
      ctx.fillStyle = '#ffe58a';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2); ctx.fill();
    } else if (pt.type === 'spark') {
      ctx.fillStyle = '#cfe8ff';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = car.kind === 'police' ? '#101828' : '#555';
  ctx.fillRect(-24, -13, 48, 26);
  ctx.fillStyle = '#8fd0ff';
  ctx.fillRect(-14, -10, 14, 8);
  ctx.fillRect(4, -10, 14, 8);
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-14, -13, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-14, 13, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -13, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, 13, 4, 0, Math.PI * 2); ctx.fill();
  if (car.kind === 'police') {
    car.flashT = (car.flashT || 0) + 0.1;
    const on = Math.floor(car.flashT * 6) % 2 === 0;
    ctx.fillStyle = on ? '#ff3b3b' : '#3b6bff';
    ctx.fillRect(-8, -15, 7, 4);
    ctx.fillStyle = on ? '#3b6bff' : '#ff3b3b';
    ctx.fillRect(1, -15, 7, 4);
  }
  ctx.restore();
}
