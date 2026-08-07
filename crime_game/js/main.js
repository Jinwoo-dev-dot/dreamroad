// ==============================
// 부트스트랩 / 입력 / 카메라 / 메인 루프
// ==============================
'use strict';

function computeCameraBounds() {
  switch (State.mode) {
    case 'home': return { w: HomeInterior.w, h: HomeInterior.h };
    case 'store': return { w: StoreInterior.w, h: StoreInterior.h };
    case 'jail': return { w: JailLayout.w, h: JailLayout.h };
    case 'trial': return { w: TrialLayout.w, h: TrialLayout.h };
    case 'execution': return { w: ExecutionLayout.w, h: ExecutionLayout.h };
    default: return { w: World.width, h: World.height };
  }
}

function updateCamera(smooth) {
  const target = getCameraTarget();
  const b = computeCameraBounds();
  const desiredX = b.w <= State.w ? (b.w - State.w) / 2 : clamp(target.x - State.w / 2, 0, b.w - State.w);
  const desiredY = b.h <= State.h ? (b.h - State.h) / 2 : clamp(target.y - State.h / 2, 0, b.h - State.h);
  if (smooth) {
    State.camera.x = lerp(State.camera.x, desiredX, 0.12);
    State.camera.y = lerp(State.camera.y, desiredY, 0.12);
  } else {
    State.camera.x = desiredX;
    State.camera.y = desiredY;
  }
}

function cityUpdate(dt) {
  if (State.player.inVehicle) vehicleUpdate(dt);
  else playerUpdate(dt);
  for (const npc of State.npcs) npcUpdate(npc, dt);
  for (const p of State.police) policeUpdate(p, dt);
  bulletsUpdate(dt);
  wantedUpdate(dt);
  playerHealthUpdate(dt);
}

function playerHealthUpdate(dt) {
  const p = State.player;
  p.noDamageT += dt;
  if (p.hp < 100 && p.noDamageT > 4) p.hp = Math.min(100, p.hp + dt * 8);

  if (p.hp <= 0 && !p.subdued) {
    p.subdued = true;
    p.subduedT = 0;
    p.controlLocked = true;
    p.state = 'idle';
    if (p.inVehicle) { p.inVehicle.parked = true; p.inVehicle = null; }
    setSubtitle('', 2.4, '총에 맞아 쓰러졌다...');
  }
  if (p.subdued) {
    p.subduedT += dt;
    if (p.subduedT > 1.3 && !State.arrest) {
      let officer = State.police.find((o) => o.state === 'chase');
      if (!officer) { policeSpawnNear(p.x, p.y); officer = State.police[State.police.length - 1]; }
      p.subdued = false;
      startArrest(officer);
    }
  }
}

function update(dt) {
  State.time += dt;
  State.mouse.wx = State.camera.x + State.mouse.x;
  State.mouse.wy = State.camera.y + State.mouse.y;

  if (State.mode === 'home') updateHome(dt);
  else if (State.mode === 'store') updateStore(dt);
  else if (State.mode === 'city') cityUpdate(dt);
  else if (State.mode === 'arrest') {
    arrestUpdate(dt);
    for (const npc of State.npcs) npcUpdate(npc, dt);
  } else if (State.mode === 'trial') trialUpdate(dt);
  else if (State.mode === 'jail') jailUpdate(dt);
  else if (State.mode === 'execution') executionUpdate(dt);
  else return; // title / ending: no world simulation

  particlesUpdate(dt);
  updateCamera(true);
}

function drawCityScene(ctx) {
  worldDraw(ctx);
  drawPickups(ctx);
  for (const npc of State.npcs) if (npc.state === 'dead') drawNpc(ctx, npc);
  for (const p of State.police) if (p.state === 'dead') drawPoliceOfficer(ctx, p);
  for (const car of State.cars) drawCar(ctx, car);
  if (State.dealer) drawDealer(ctx, State.dealer);
  for (const npc of State.npcs) if (npc.state !== 'dead') drawNpc(ctx, npc);
  for (const p of State.police) if (p.state !== 'dead') drawPoliceOfficer(ctx, p);
  drawBullets(ctx);
  drawParticles(ctx);
  if (!(State.arrest && State.arrest.hidePlayer) && !State.player.inVehicle) drawPlayer(ctx);
}

function render() {
  const ctx = State.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#111417';
  ctx.fillRect(0, 0, State.w, State.h);

  if (State.mode === 'title' || State.mode === 'ending') { return; }

  ctx.save();
  ctx.translate(-Math.round(State.camera.x), -Math.round(State.camera.y));

  if (State.mode === 'city' || State.mode === 'arrest') drawCityScene(ctx);
  else if (State.mode === 'home') drawHome(ctx);
  else if (State.mode === 'store') drawStore(ctx);
  else if (State.mode === 'trial') trialDraw(ctx);
  else if (State.mode === 'jail') jailDraw(ctx);
  else if (State.mode === 'execution') executionDraw(ctx);

  ctx.restore();
  uiDraw(ctx);
}

let lastTs = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  State.canvas.width = window.innerWidth;
  State.canvas.height = window.innerHeight;
  State.w = State.canvas.width;
  State.h = State.canvas.height;
}

function startGame() {
  initAudio();
  worldGenerate();
  npcSpawnAll(45);
  State.dealer = World.dealerSpot ? { kind: 'npc', x: World.dealerSpot.x, y: World.dealerSpot.y, radius: 12, facing: -Math.PI / 2, animTimer: 0, speed: 0, color: '#3a2e4a' } : null;
  State.player = createPlayer();
  State.day = 1;
  State.wanted = 0;
  State.police = [];
  State.cars = [];
  State.bullets = [];
  State.particles = [];
  State.decals = [];
  State.pickups = [];
  carsSpawnParked(10);
  State.homeTaken = { knife: false, gun: false };
  State.stats = { kills: 0, thefts: 0, cash: 0, copKills: 0, escaped: 0, bribeFailed: false };
  State.arrest = null;
  State.trial = null;
  State.jail = null;
  State.execution = null;
  enterHome();
  updateCamera(false);
  showTitleScreen(false);
  showEndScreen(false);
  setSubtitle('', 0);
  setTimeout(() => setSubtitle('나레이션', 3.5, '평범한 하루... 소지품에서 낯익은 물건들이 눈에 띈다.'), 300);
}

function bindInput() {
  const canvas = State.canvas;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    State.mouse.x = e.clientX - rect.left;
    State.mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (e) => { State.mouse.down = true; e.preventDefault(); });
  window.addEventListener('mouseup', () => { State.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    State.keys[e.key] = true;
    if (e.key === '1') playerSetWeapon('fists');
    if (e.key === '2') playerSetWeapon('knife');
    if (e.key === '3') playerSetWeapon('gun');
    if (e.key === '4') useDisguise();
    if (e.key === 'e' || e.key === 'E') tryInteract();
  });
  window.addEventListener('keyup', (e) => { State.keys[e.key] = false; });
  window.addEventListener('resize', resizeCanvas);
}

window.addEventListener('DOMContentLoaded', () => {
  State.canvas = document.getElementById('game');
  State.ctx = State.canvas.getContext('2d');
  resizeCanvas();
  bindInput();

  const btn = document.getElementById('start-btn');
  if (btn) btn.addEventListener('click', startGame);
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', startGame);
  const skipBtn = document.getElementById('skip-jail-btn');
  if (skipBtn) skipBtn.addEventListener('click', jailSkip);

  requestAnimationFrame(loop);
});
