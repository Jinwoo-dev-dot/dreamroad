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
    ammo: 0,
    disguises: 0,
    atkCooldown: 0,
    atkTimer: 0,
    atkApplied: false,
    controlLocked: false,
    recoil: 0,
    hp: 100,
    noDamageT: 99,
    subdued: false,
    subduedT: 0,
    hostage: null,
    inVehicle: null,
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
    p.atkCooldown = 0.28;
    if (p.ammo <= 0) {
      p.state = 'idle';
      if (typeof sfxDryFire === 'function') sfxDryFire();
      setSubtitle('', 1, '철컥... 탄약이 없다.');
      p.atkTimer = 0; p.atkApplied = true;
      return;
    }
    p.ammo -= 1;
    p.state = 'attackGun';
    p.recoil = 1;
    const bx = p.x + Math.cos(p.facing) * 22;
    const by = p.y + Math.sin(p.facing) * 22;
    spawnParticle({ type: 'muzzle', x: bx, y: by, vx: 0, vy: 0, life: 0.08, maxLife: 0.08, size: 16 });
    State.bullets.push({ x: bx, y: by, vx: Math.cos(p.facing) * 900, vy: Math.sin(p.facing) * 900, life: 0.7, owner: 'player' });
    if (typeof sfxGunshot === 'function') sfxGunshot();
  }
  p.atkTimer = 0;
  p.atkApplied = false;
}

function applyAttack(p) {
  if (p.weapon === 'knife') {
    if (typeof sfxKnife === 'function') sfxKnife();
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
    const p = State.player;
    if (p.inVehicle) { State.prompt = 'E : 하차'; return; }
    if (p.hostage) { State.prompt = 'E : 인질 풀어주기'; return; }
    const pickup = State.pickups.find(pu => dist(p.x, p.y, pu.x, pu.y) < 40);
    if (pickup) { State.prompt = 'E : 탄약 줍기 (' + pickup.amount + '발)'; return; }
    if (State.dealer && dist(p.x, p.y, State.dealer.x, State.dealer.y) < 55) {
      State.prompt = p.inv.gun ? 'E : 탄약 구매 (💰50 → 총알 6발)' : 'E : 말 걸기';
      return;
    }
    const witness = State.npcs.find(n => n.state === 'flee' && n.willReport && dist(p.x, p.y, n.x, n.y) < 50);
    if (witness) {
      State.prompt = State.stats.cash >= 30 ? 'E : 목격자 매수/위협 (💰30)' : 'E : 목격자 위협 (성공률 50%)';
      return;
    }
    const car = State.cars.find(c => c.kind === 'civilian' && dist(p.x, p.y, c.x, c.y) < 45);
    if (car) { State.prompt = 'E : 차 훔치기'; return; }
    const grabTarget = State.npcs.find(n => (n.state === 'wander' || n.state === 'flee') && dist(p.x, p.y, n.x, n.y) < 42);
    if (grabTarget) { State.prompt = 'E : 인질로 붙잡기'; return; }
    const near = worldNearestDoor(p.x, p.y, 55);
    if (near) State.prompt = 'E : 들어가기';
    return;
  }
  if (State.mode === 'home') {
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
  else if (target.kind === 'police') killPolice(target);
}

function killNpc(npc) {
  if (npc.state === 'dead') return;
  const wasHostage = State.player.hostage === npc;
  npc.state = 'dead';
  npc.deathT = 0;
  npc.fallDir = npc.facing + rand(-0.4, 0.4);
  npc.decalDone = false;
  spawnBloodBurst(npc.x, npc.y, 12);
  State.stats.kills += 1;
  if (wasHostage) {
    State.player.hostage = null;
    addWanted(5, '인질 살해');
  } else {
    addWanted(3, '폭행/살인');
  }
  for (const o of State.npcs) {
    if (o !== npc && o.state !== 'dead' && o.state !== 'hostage' && dist(o.x, o.y, npc.x, npc.y) < 260) {
      o.state = 'flee';
      o.fleeFrom = { x: npc.x, y: npc.y };
      o.fleeTimer = rand(2.5, 4.5);
      o.willReport = true;
    }
  }
}

function killPolice(officer) {
  if (officer.state === 'dead') return;
  officer.state = 'dead';
  officer.deathT = 0;
  officer.fallDir = officer.facing + rand(-0.4, 0.4);
  officer.decalDone = false;
  spawnBloodBurst(officer.x, officer.y, 14);
  State.stats.copKills = (State.stats.copKills || 0) + 1;
  addWanted(5, '경찰관 살해');
  for (const p of State.police) if (p !== officer && p.state !== 'dead') p.state = 'chase';
  policeSpawnNear(officer.x, officer.y);
  policeSpawnNear(officer.x, officer.y);
  State.pickups.push({ x: officer.x, y: officer.y, type: 'ammo', amount: randInt(3, 6) });
}

// ---------- Hostage / witness / loot ----------
function releaseHostage() {
  const p = State.player;
  if (!p.hostage) return false;
  const h = p.hostage;
  p.hostage = null;
  h.state = 'flee';
  h.fleeFrom = { x: p.x, y: p.y };
  h.fleeTimer = rand(2, 3);
  h.willReport = false;
  State.wanted = clamp(State.wanted - 1, 0, 5);
  setSubtitle('', 1.6, '인질을 풀어줬다.');
  return true;
}

function grabHostage() {
  const p = State.player;
  const target = State.npcs.find((n) => (n.state === 'wander' || n.state === 'flee') && dist(p.x, p.y, n.x, n.y) < 42);
  if (!target) return false;
  p.hostage = target;
  target.state = 'hostage';
  addWanted(2, '인질극');
  setSubtitle('', 1.6, '시민을 인질로 붙잡았다!');
  return true;
}

function trySilenceWitness() {
  const p = State.player;
  const target = State.npcs.find((n) => n.state === 'flee' && n.willReport && dist(p.x, p.y, n.x, n.y) < 50);
  if (!target) return false;
  if (State.stats.cash >= 30) {
    State.stats.cash -= 30;
    target.willReport = false;
    setSubtitle('', 1.8, '목격자를 매수했다. "아무것도 못 봤어요..."');
  } else if (Math.random() < 0.5) {
    target.willReport = false;
    setSubtitle('', 1.8, '목격자를 위협해 입을 막았다.');
  } else {
    setSubtitle('', 1.8, '목격자: "사람 살려!!" 위협이 실패했다!');
    addWanted(1, '목격자 위협 실패');
  }
  return true;
}

function tryCollectPickup() {
  const p = State.player;
  const idx = State.pickups.findIndex((pu) => dist(p.x, p.y, pu.x, pu.y) < 40);
  if (idx === -1) return false;
  const pu = State.pickups[idx];
  if (pu.type === 'ammo') {
    p.ammo += pu.amount;
    setSubtitle('', 1.4, '쓰러진 경찰의 탄약을 주웠다. (+' + pu.amount + '발)');
  }
  State.pickups.splice(idx, 1);
  return true;
}

function playerTakeDamage(amount) {
  const p = State.player;
  if (p.hp <= 0 || p.controlLocked) return;
  p.hp = Math.max(0, p.hp - amount);
  p.noDamageT = 0;
  spawnBloodBurst(p.x, p.y, 6);
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
    fleeTimer: 0, fleeFrom: null, willReport: false,
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

  if (npc.state === 'hostage') {
    const p = State.player;
    npc.x = p.x + Math.cos(p.facing) * 24;
    npc.y = p.y + Math.sin(p.facing) * 24;
    npc.facing = p.facing;
    npc.speed = p.speed;
    return;
  }

  let target = npc.target;
  let sp = 55;
  if (npc.state === 'flee') {
    sp = 175;
    npc.fleeTimer -= dt;
    const away = angleTo(npc.fleeFrom.x, npc.fleeFrom.y, npc.x, npc.y);
    target = { x: npc.x + Math.cos(away) * 200, y: npc.y + Math.sin(away) * 200 };
    if (npc.fleeTimer <= 0) {
      if (npc.willReport) { addWanted(1, '목격자 신고'); npc.willReport = false; }
      npc.state = 'wander'; npcPickTarget(npc);
    }
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
    state: 'chase', // chase/leaving/dead
    facing: 0,
    animTimer: 0,
    speed: 0,
    grabTimer: 0,
    stagger: 0,
    leaveTimer: 0,
    deathT: 0,
    fallDir: 0,
    decalDone: false,
    shootCooldown: rand(0.6, 1.4),
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

  if (officer.state === 'dead') {
    officer.deathT += dt;
    officer.speed = 0;
    if (officer.deathT > 14) officer.removeMe = true;
    return;
  }

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

  const carBlocking = p.inVehicle && p.inVehicle.speed > 30;
  if (d < 34 && State.mode === 'city' && !State.arrest && !p.hostage && !carBlocking) {
    officer.grabTimer += dt;
  } else {
    officer.grabTimer = Math.max(0, officer.grabTimer - dt * 2);
  }
  if (officer.grabTimer > 0.55 && !State.arrest) {
    startArrest(officer);
  }

  // armed officers return fire once things have escalated (a cop has died, or wanted is maxed out)
  officer.shootCooldown -= dt;
  const armedResponse = (State.stats.copKills > 0 || State.wanted >= 4) && !p.hostage;
  if (armedResponse && officer.shootCooldown <= 0 && d > 70 && d < 340 && officer.stagger <= 0) {
    const midX = (officer.x + p.x) / 2, midY = (officer.y + p.y) / 2;
    if (!worldIsSolid(midX, midY, 4)) {
      officer.shootCooldown = rand(1.1, 1.9);
      const ang = officer.facing + rand(-0.12, 0.12);
      State.bullets.push({
        x: officer.x + Math.cos(officer.facing) * 18, y: officer.y + Math.sin(officer.facing) * 18,
        vx: Math.cos(ang) * 760, vy: Math.sin(ang) * 760, life: 0.7, owner: 'police',
      });
      spawnParticle({ type: 'muzzle', x: officer.x + Math.cos(officer.facing) * 18, y: officer.y + Math.sin(officer.facing) * 18, vx: 0, vy: 0, life: 0.08, maxLife: 0.08, size: 12 });
    }
  }
}

function bulletsUpdate(dt) {
  for (const b of State.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (worldIsSolid(b.x, b.y, 2)) { b.dead = true; continue; }
    if (b.owner === 'police') {
      if (dist(b.x, b.y, State.player.x, State.player.y) < State.player.radius) {
        playerTakeDamage(rand(9, 17));
        b.dead = true;
      }
    } else {
      const pool = [...State.npcs, ...State.police];
      for (const e of pool) {
        if (e.state === 'dead') continue;
        if (dist(b.x, b.y, e.x, e.y) < e.radius) {
          combatHit(e, 'gun');
          b.dead = true;
          break;
        }
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

  for (const e of [...State.npcs, ...State.police]) {
    if (e.state === 'dead' && e.deathT > 0.4 && !e.decalDone) {
      e.decalDone = true;
      State.decals.push({ x: e.x, y: e.y, r: rand(16, 24), a: 0.85 });
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

function drawCuffedArms(ctx, cfg, fx, fy) {
  ctx.strokeStyle = cfg.bodyColor;
  const stage = cfg.cuffStage || 'cuffed';

  if (stage === 'handsUp') {
    // both hands raised straight up in surrender
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-10, -19); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(10, -19); ctx.stroke();
    ctx.fillStyle = cfg.headColor || SKIN;
    ctx.beginPath(); ctx.arc(-10, -19, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -19, 2.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (stage === 'cuffing1') {
    // one wrist already seized behind the back, the other still raised
    ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(10, -19); ctx.stroke();
    ctx.fillStyle = cfg.headColor || SKIN;
    ctx.beginPath(); ctx.arc(10, -19, 2.5, 0, Math.PI * 2); ctx.fill();
    const bx = -fx * 9, by = -fy * 9 - 1;
    ctx.strokeStyle = cfg.bodyColor;
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = cfg.headColor || SKIN;
    ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (stage === 'cuffing2') {
    // both wrists pulled behind the back, not yet locked together
    const b1x = -fx * 9 - 3, b1y = -fy * 9 - 1;
    const b2x = -fx * 9 + 3, b2y = -fy * 9 + 1;
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(b1x, b1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(b2x, b2y); ctx.stroke();
    ctx.fillStyle = cfg.headColor || SKIN;
    ctx.beginPath(); ctx.arc(b1x, b1y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b2x, b2y, 2.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  // 'cuffed': wrists locked together behind the back
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-2, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-2, 2); ctx.stroke();
  ctx.fillStyle = '#c0c0c8';
  ctx.fillRect(-6, -3, 6, 6);
  ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-6, -3, 6, 6);
}

function drawArmsAndWeapon(ctx, e, cfg, fx, fy, cycle) {
  ctx.strokeStyle = cfg.bodyColor;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  if (cfg.cuffed) {
    drawCuffedArms(ctx, cfg, fx, fy);
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

const CUFF_STAGE_BY_STATE = {
  handsUp: 'handsUp', cuffing1: 'cuffing1', cuffing2: 'cuffing2',
  cuffed: 'cuffed', walkCuffed: 'cuffed', kneel: 'handsUp',
};

function drawPlayer(ctx) {
  const p = State.player;
  const cuffStage = CUFF_STAGE_BY_STATE[p.state];
  const cfg = {
    bodyColor: State.mode === 'jail' ? '#e8791f' : '#3a4a6b',
    headColor: SKIN,
    weapon: (p.state === 'attackKnife' || p.state === 'attackGun') ? p.weapon : p.weapon,
    cuffed: !!cuffStage,
    cuffStage,
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
  } else if (npc.state === 'hostage') {
    ctx.save();
    ctx.translate(npc.x, npc.y - 26);
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('인질', 0, 0);
    ctx.restore();
  }
}

function drawDealer(ctx, dealer) {
  drawPerson(ctx, dealer, { bodyColor: dealer.color, headColor: SKIN, weapon: 'none' });
  ctx.save();
  ctx.translate(dealer.x, dealer.y - 28);
  ctx.fillStyle = '#8affb0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', 0, 0);
  ctx.restore();
}

function drawPoliceOfficer(ctx, officer) {
  drawPerson(ctx, officer, { bodyColor: '#26428a', headColor: SKIN, hat: '#1c2f66', badge: true, weapon: officer.aiming ? 'gun' : 'none' });
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
    } else if (pt.type === 'text') {
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pt.color || '#fff';
      ctx.fillText(pt.text, pt.x, pt.y);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPickups(ctx) {
  for (const pu of State.pickups) {
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d4b2c';
    ctx.fillRect(-9, -6, 18, 12);
    ctx.strokeStyle = '#1c2414'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -6, 18, 12);
    ctx.fillStyle = '#ffe58a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMMO', 0, 3);
    ctx.restore();
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
