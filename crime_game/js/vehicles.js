// ==============================
// 차량: 탈취 / 운전 / 치기
// ==============================
'use strict';

function carsSpawnParked(n) {
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do {
      const wp = pick(World.waypoints);
      x = wp.x + rand(-30, 30);
      y = wp.y + rand(-30, 30);
      tries++;
    } while (worldIsSolid(x, y, 24) && tries < 10);
    State.cars.push({ x, y, angle: rand(0, Math.PI * 2), flashT: 0, kind: 'civilian', speed: 0, parked: true });
  }
}

function vehicleEnter(car) {
  const p = State.player;
  car.parked = false;
  car.speed = 0;
  p.inVehicle = car;
  if (p.hostage) releaseHostage();
  setSubtitle('', 1.2, '차를 훔쳤다!');
}

function vehicleExit() {
  const p = State.player;
  const car = p.inVehicle;
  if (!car) return;
  car.parked = true;
  car.speed = 0;
  p.inVehicle = null;
  p.x = car.x - Math.cos(car.angle) * 34;
  p.y = car.y - Math.sin(car.angle) * 34;
  const b = worldClampToBounds(p.x, p.y, p.radius);
  p.x = b.x; p.y = b.y;
}

function vehicleUpdate(dt) {
  const p = State.player;
  const car = p.inVehicle;
  if (!car) return;

  const dx = State.mouse.wx - car.x, dy = State.mouse.wy - car.y;
  const d = Math.hypot(dx, dy);
  const maxSpeed = d < 14 ? 0 : (d < 200 ? lerp(70, 260, d / 200) : 420);
  const desiredAngle = d > 14 ? Math.atan2(dy, dx) : car.angle;
  car.angle = angleLerp(car.angle, desiredAngle, Math.min(1, dt * 4));
  car.speed = lerp(car.speed || 0, maxSpeed, Math.min(1, dt * 3));

  let nx = car.x + Math.cos(car.angle) * car.speed * dt;
  let ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = worldIsSolid(nx, ny, 22);
  if (hit) { nx = hit.x; ny = hit.y; car.speed *= 0.25; }
  const b = worldClampToBounds(nx, ny, 22);
  car.x = b.x; car.y = b.y;

  p.x = car.x; p.y = car.y; p.facing = car.angle; p.speed = car.speed;

  if (car.speed > 60) {
    for (const npc of State.npcs) {
      if (npc.state === 'dead' || npc.state === 'hostage') continue;
      if (dist(car.x, car.y, npc.x, npc.y) < 24) killNpc(npc);
    }
    for (const officer of State.police) {
      if (officer.state !== 'chase') continue;
      if (dist(car.x, car.y, officer.x, officer.y) < 27) {
        officer.stagger = 2.4;
        const away = angleTo(car.x, car.y, officer.x, officer.y);
        officer.x = clamp(officer.x + Math.cos(away) * 30, 20, World.width - 20);
        officer.y = clamp(officer.y + Math.sin(away) * 30, 20, World.height - 20);
        spawnParticle({ type: 'spark', x: officer.x, y: officer.y, vx: 0, vy: -20, life: 0.4, maxLife: 0.4, size: 5 });
      }
    }
  }

  playerCheckInteractionPrompt();
}
