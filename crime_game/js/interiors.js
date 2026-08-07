// ==============================
// 실내: 우리집 / 편의점
// ==============================
'use strict';

const HomeInterior = {
  w: 340, h: 240,
  exit: { x: 170, y: 220 },
  knifeSpot: { x: 90, y: 90 },
  gunSpot: { x: 250, y: 90 },
  entryPoint: { x: 170, y: 190 },
};

const StoreInterior = {
  w: 420, h: 300,
  exit: { x: 210, y: 280 },
  entryPoint: { x: 210, y: 250 },
  shelves: [
    { x: 40, y: 40, w: 90, h: 30, item: '과자' },
    { x: 160, y: 40, w: 90, h: 30, item: '음료수' },
    { x: 280, y: 40, w: 90, h: 30, item: '라면' },
    { x: 40, y: 120, w: 90, h: 30, item: '담배' },
    { x: 280, y: 120, w: 90, h: 30, item: '현금' },
  ],
  counter: { x: 150, y: 190, w: 120, h: 26 },
};

function getStoreById(id) {
  return World.stores.find(s => s.id === id);
}

function enterHome() {
  State.mode = 'home';
  State.player.x = HomeInterior.entryPoint.x;
  State.player.y = HomeInterior.entryPoint.y;
  State.player.controlLocked = false;
  if (typeof sirenStop === 'function') sirenStop();
}

function exitHomeToCity() {
  State.mode = 'city';
  const door = World.home.doorRect;
  State.player.x = door.x + door.w / 2;
  State.player.y = door.y + door.h + 24;
}

function enterStore(storeId) {
  State.mode = 'store';
  State.storeId = storeId;
  State.player.x = StoreInterior.entryPoint.x;
  State.player.y = StoreInterior.entryPoint.y;
  if (!State._clerk) State._clerk = { kind: 'npc', x: 210, y: 220, radius: 12, facing: -Math.PI / 2, animTimer: 0, speed: 0, state: 'wander', alert: 0 };
  if (typeof sirenStop === 'function') sirenStop();
}

function exitStoreToCity() {
  const store = getStoreById(State.storeId);
  State.mode = 'city';
  const door = store.doorRect;
  State.player.x = door.x + door.w / 2;
  State.player.y = door.y + door.h + 24;
  State.storeId = null;
}

function tryInteract() {
  if (State.mode === 'city') {
    if (State.dealer && dist(State.player.x, State.player.y, State.dealer.x, State.dealer.y) < 55) {
      dealerInteract();
      return;
    }
    const near = worldNearestDoor(State.player.x, State.player.y, 55);
    if (!near) return;
    if (near === World.home) enterHome();
    else enterStore(near.id);
  } else if (State.mode === 'home') {
    if (!State.homeTaken.knife && dist(State.player.x, State.player.y, HomeInterior.knifeSpot.x, HomeInterior.knifeSpot.y) < 40) {
      State.homeTaken.knife = true;
      State.player.inv.knife = true;
      State.player.weapon = 'knife';
      setSubtitle('칼을 챙겼다.', 1.6);
    } else if (!State.homeTaken.gun && dist(State.player.x, State.player.y, HomeInterior.gunSpot.x, HomeInterior.gunSpot.y) < 40) {
      State.homeTaken.gun = true;
      State.player.inv.gun = true;
      State.player.ammo = 6;
      setSubtitle('총을 챙겼다. (장전된 총알 6발)', 1.8);
    } else if (dist(State.player.x, State.player.y, HomeInterior.exit.x, HomeInterior.exit.y) < 50) {
      exitHomeToCity();
    }
  } else if (State.mode === 'store') {
    const store = getStoreById(State.storeId);
    if (dist(State.player.x, State.player.y, StoreInterior.exit.x, StoreInterior.exit.y) < 50) {
      exitStoreToCity();
      return;
    }
    for (const shelf of StoreInterior.shelves) {
      const cx = shelf.x + shelf.w / 2, cy = shelf.y + shelf.h / 2;
      if (dist(State.player.x, State.player.y, cx, cy) < 55) {
        stealItem(store, shelf);
        break;
      }
    }
  }
}

function dealerInteract() {
  if (!State.player.inv.gun) {
    setSubtitle('밀거래상', 2, '"총도 없으면서 왜 왔어. 꺼져."');
    return;
  }
  if (State.stats.cash < 50) {
    setSubtitle('밀거래상', 2, '"돈이 부족한데. 50원은 가져와야지."');
    return;
  }
  State.stats.cash -= 50;
  State.player.ammo += 6;
  if (typeof sfxCoin === 'function') sfxCoin();
  setSubtitle('밀거래상', 2, '"자, 총알 6발. 조용히 써라."');
}

function stealItem(store, shelf) {
  store.stolen[shelf.item] = (store.stolen[shelf.item] || 0) + 1;
  State.stats.thefts += 1;
  if (shelf.item === '현금') {
    const amount = randInt(20, 80);
    State.stats.cash += amount;
    setSubtitle('현금 ' + amount + '원을 훔쳤다!', 1.2);
  } else {
    setSubtitle('"' + shelf.item + '"을(를) 훔쳤다!', 1.2);
  }
  spawnParticle({ type: 'spark', x: State.player.x, y: State.player.y - 20, vx: 0, vy: -20, life: 0.5, maxLife: 0.5, size: 4 });
  const clerk = State._clerk;
  const d = dist(State.player.x, State.player.y, clerk.x, clerk.y);
  clerk.alert += d < 140 ? rand(35, 55) : rand(10, 20);
  if (clerk.alert >= 100) {
    clerk.alert = 100;
    addWanted(2, '절도');
    if (typeof sfxAlarm === 'function') sfxAlarm();
    setSubtitle('점원: "도둑이야!! 신고했어요!"', 2.2, '경찰이 출동합니다');
  }
}

function updateHome(dt) {
  playerUpdateBounded(dt, HomeInterior.w, HomeInterior.h);
}

function updateStore(dt) {
  playerUpdateBounded(dt, StoreInterior.w, StoreInterior.h);
  const clerk = State._clerk;
  if (clerk) {
    clerk.animTimer += dt;
    clerk.alert = Math.max(0, clerk.alert - dt * 4);
  }
}

// player movement without the open-world building collision (interior uses simple room bounds)
function playerUpdateBounded(dt, w, h) {
  const p = State.player;
  if (p.atkCooldown > 0) p.atkCooldown -= dt;
  const dx = State.mouse.wx - p.x, dy = State.mouse.wy - p.y;
  const d = Math.hypot(dx, dy);
  const maxSpeed = d < 10 ? 0 : (d < 170 ? lerp(30, 150, d / 170) : 220);
  if (d > 3) p.facing = Math.atan2(dy, dx);
  let tvx = 0, tvy = 0;
  if (d > 10) { tvx = (dx / d) * maxSpeed; tvy = (dy / d) * maxSpeed; }
  p.vx = lerp(p.vx, tvx, Math.min(1, dt * 8));
  p.vy = lerp(p.vy, tvy, Math.min(1, dt * 8));
  p.speed = Math.hypot(p.vx, p.vy);
  p.x = clamp(p.x + p.vx * dt, 16, w - 16);
  p.y = clamp(p.y + p.vy * dt, 16, h - 16);
  p.animTimer += dt;
  p.state = p.speed > 140 ? 'run' : (p.speed > 5 ? 'walk' : 'idle');
  playerCheckInteractionPrompt();
}

function drawHome(ctx) {
  ctx.fillStyle = '#3a3226';
  ctx.fillRect(0, 0, HomeInterior.w, HomeInterior.h);
  ctx.strokeStyle = '#1c1710';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, HomeInterior.w - 10, HomeInterior.h - 10);

  // bed
  ctx.fillStyle = '#5a3b6b';
  ctx.fillRect(20, 20, 60, 40);
  ctx.fillStyle = '#eee';
  ctx.fillRect(20, 20, 60, 12);

  // tables with items
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(HomeInterior.knifeSpot.x - 22, HomeInterior.knifeSpot.y - 16, 44, 32);
  ctx.fillRect(HomeInterior.gunSpot.x - 22, HomeInterior.gunSpot.y - 16, 44, 32);

  if (!State.homeTaken.knife) {
    ctx.save(); ctx.translate(HomeInterior.knifeSpot.x, HomeInterior.knifeSpot.y);
    ctx.strokeStyle = '#dfe6ea'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.fillStyle = '#5a3b1f'; ctx.fillRect(-14, -3, 6, 6);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('칼', HomeInterior.knifeSpot.x, HomeInterior.knifeSpot.y - 20);
  }
  if (!State.homeTaken.gun) {
    ctx.save(); ctx.translate(HomeInterior.gunSpot.x, HomeInterior.gunSpot.y);
    ctx.fillStyle = '#20242a'; ctx.fillRect(-12, -4, 24, 8);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('총', HomeInterior.gunSpot.x, HomeInterior.gunSpot.y - 20);
  }

  // door / exit
  ctx.fillStyle = '#111';
  ctx.fillRect(HomeInterior.exit.x - 20, HomeInterior.exit.y - 4, 40, 10);
  ctx.fillStyle = '#ffe28a'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('출구', HomeInterior.exit.x, HomeInterior.exit.y + 22);

  drawPlayer(ctx);
  drawParticles(ctx);
}

function drawStore(ctx) {
  const store = getStoreById(State.storeId);
  ctx.fillStyle = '#22262b';
  ctx.fillRect(0, 0, StoreInterior.w, StoreInterior.h);
  ctx.strokeStyle = '#0e1013';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, StoreInterior.w - 10, StoreInterior.h - 10);

  for (const shelf of StoreInterior.shelves) {
    ctx.fillStyle = '#3d4650';
    ctx.fillRect(shelf.x, shelf.y, shelf.w, shelf.h);
    ctx.strokeStyle = '#20242a'; ctx.lineWidth = 2;
    ctx.strokeRect(shelf.x, shelf.y, shelf.w, shelf.h);
    ctx.fillStyle = '#cfd8e0';
    ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(shelf.item, shelf.x + shelf.w / 2, shelf.y + shelf.h / 2 + 4);
  }

  const c = StoreInterior.counter;
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(c.x, c.y, c.w, c.h);

  ctx.fillStyle = '#ffe28a'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('출구', StoreInterior.exit.x, StoreInterior.exit.y + 22);
  ctx.fillStyle = '#111';
  ctx.fillRect(StoreInterior.exit.x - 20, StoreInterior.exit.y - 4, 40, 10);

  if (State._clerk) {
    const clerk = State._clerk;
    drawPerson(ctx, clerk, { bodyColor: '#3d7a4a', headColor: SKIN, weapon: 'none' });
    if (clerk.alert > 5) {
      ctx.fillStyle = '#222';
      ctx.fillRect(clerk.x - 20, clerk.y - 34, 40, 6);
      ctx.fillStyle = clerk.alert > 70 ? '#ff4a4a' : '#ffd23f';
      ctx.fillRect(clerk.x - 20, clerk.y - 34, 40 * (clerk.alert / 100), 6);
    }
  }

  drawPlayer(ctx);
  drawParticles(ctx);
}
