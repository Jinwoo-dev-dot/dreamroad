// ==============================
// 도시 맵 생성 / 렌더링 / 충돌
// ==============================
'use strict';

const World = {
  cols: 7,
  rows: 7,
  block: 460,
  road: 110,
  sidewalk: 26,
  blocks: [],
  buildings: [], // solid rects for collision
  stores: [],    // {id, doorRect, buildingRect, name}
  home: null,    // {doorRect, buildingRect}
  policeHQ: null,
  parkRects: [],
  width: 0,
  height: 0,
  waypoints: [], // road-network points npc/police wander to
};

const HOUSE_COLORS = ['#7c6f57', '#5b6b73', '#6b5b73', '#73685b', '#4f6b57', '#6b5959', '#5c6a80'];

function worldGenerate() {
  const { cols, rows, block, road } = World;
  World.width = cols * (block + road) + road;
  World.height = rows * (block + road) + road;
  World.blocks = [];
  World.buildings = [];
  World.stores = [];
  World.waypoints = [];
  World.parkRects = [];

  const storeIdxs = new Set();
  while (storeIdxs.size < 5) storeIdxs.add(randInt(1, cols * rows - 1));
  const parkIdx = cols * rows - 2;
  const policeIdx = cols * rows - 1;

  let storeCounter = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const bx = road + c * (block + road);
      const by = road + r * (block + road);
      const cell = { x: bx, y: by, w: block, h: block, type: 'generic', c, r };

      if (idx === 0) cell.type = 'home';
      else if (storeIdxs.has(idx)) cell.type = 'store';
      else if (idx === parkIdx) cell.type = 'park';
      else if (idx === policeIdx) cell.type = 'police';

      // building inset from block (sidewalk margin)
      const sw = World.sidewalk;
      const buildRect = { x: bx + sw, y: by + sw, w: block - sw * 2, h: block - sw * 2 };
      cell.buildRect = buildRect;
      cell.color = pick(HOUSE_COLORS);

      if (cell.type === 'park') {
        World.parkRects.push(buildRect);
      } else {
        World.buildings.push(buildRect);
        // door centered on bottom edge of building
        const doorW = 46;
        cell.door = { x: buildRect.x + buildRect.w / 2 - doorW / 2, y: buildRect.y + buildRect.h - 6, w: doorW, h: 14 };
      }

      if (cell.type === 'home') {
        World.home = { doorRect: cell.door, buildingRect: buildRect, cell };
      } else if (cell.type === 'store') {
        storeCounter++;
        const store = { id: 'store' + storeCounter, doorRect: cell.door, buildingRect: buildRect, cell, name: '24시 편의점 #' + storeCounter, alert: 0, stolen: {} };
        World.stores.push(store);
        cell.storeRef = store;
      } else if (cell.type === 'police') {
        World.policeHQ = { doorRect: cell.door, buildingRect: buildRect, cell };
      }

      World.blocks.push(cell);

      // waypoints: sidewalk corners around this block for pedestrian wander
      World.waypoints.push({ x: bx - road / 2, y: by - road / 2 });
      World.waypoints.push({ x: bx + block + road / 2, y: by - road / 2 });
      World.waypoints.push({ x: bx - road / 2, y: by + block + road / 2 });
      World.waypoints.push({ x: bx + block + road / 2, y: by + block + road / 2 });
    }
  }
}

function worldIsSolid(x, y, radius) {
  for (const b of World.buildings) {
    const res = resolveCircleRect(x, y, radius, b);
    if (res.hit) return res;
  }
  return null;
}

function worldClampToBounds(x, y, radius) {
  return { x: clamp(x, radius, World.width - radius), y: clamp(y, radius, World.height - radius) };
}

function worldNearestDoor(x, y, maxDist) {
  let best = null, bestD = maxDist;
  const candidates = [World.home, ...World.stores];
  for (const c of candidates) {
    if (!c) continue;
    const dr = c.doorRect;
    const cx = dr.x + dr.w / 2, cy = dr.y + dr.h / 2;
    const d = dist(x, y, cx, cy);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// ---------- Rendering ----------
function worldDraw(ctx) {
  ctx.fillStyle = '#3a3f42';
  ctx.fillRect(0, 0, World.width, World.height);

  // roads (grid gaps) - draw sidewalks then road strips
  for (const cell of World.blocks) {
    // sidewalk ring
    ctx.fillStyle = '#54585b';
    ctx.fillRect(cell.x - World.sidewalk, cell.y - World.sidewalk, cell.w + World.sidewalk * 2, cell.h + World.sidewalk * 2);
  }
  // roads on top (the gap areas) - draw as full grid lines
  ctx.fillStyle = '#2b2e30';
  const rd = World.road - World.sidewalk * 0; // full road band already excluded by sidewalk overlap; draw explicit bands
  for (let c = 0; c <= World.cols; c++) {
    const x = c * (World.block + World.road);
    ctx.fillRect(x, 0, World.road, World.height);
  }
  for (let r = 0; r <= World.rows; r++) {
    const y = r * (World.block + World.road);
    ctx.fillRect(0, y, World.width, World.road);
  }
  // lane markings
  ctx.strokeStyle = 'rgba(255,220,120,0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 18]);
  for (let c = 0; c <= World.cols; c++) {
    const x = c * (World.block + World.road) + World.road / 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, World.height); ctx.stroke();
  }
  for (let r = 0; r <= World.rows; r++) {
    const y = r * (World.block + World.road) + World.road / 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(World.width, y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // decals (blood pools) under buildings/npcs
  for (const d of State.decals) {
    ctx.globalAlpha = d.a;
    ctx.fillStyle = '#5a0d0d';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r, d.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // buildings
  for (const cell of World.blocks) {
    if (cell.type === 'park') {
      drawPark(ctx, cell.buildRect);
      continue;
    }
    drawBuilding(ctx, cell);
  }
}

function drawPark(ctx, r) {
  ctx.fillStyle = '#3f6b3f';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#2c4d2c';
  ctx.lineWidth = 6;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  // trees
  const n = 10;
  for (let i = 0; i < n; i++) {
    const tx = r.x + 30 + (i % 5) * (r.w - 60) / 4;
    const ty = r.y + 40 + Math.floor(i / 5) * (r.h - 80);
    ctx.fillStyle = '#2e4f2e';
    ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a26';
    ctx.fillRect(tx - 3, ty + 10, 6, 10);
  }
}

function drawBuilding(ctx, cell) {
  const r = cell.buildRect;
  ctx.fillStyle = cell.color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  // windows
  ctx.fillStyle = 'rgba(255,240,180,0.55)';
  const cols = Math.max(2, Math.floor(r.w / 60));
  const rowsN = Math.max(2, Math.floor(r.h / 60));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rowsN; j++) {
      if ((i + j) % 3 === 0) continue;
      const wx = r.x + 14 + i * (r.w - 28) / cols;
      const wy = r.y + 14 + j * (r.h - 28) / rowsN;
      ctx.fillRect(wx, wy, 14, 14);
    }
  }

  // door
  if (cell.door) {
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(cell.door.x, cell.door.y, cell.door.w, cell.door.h);
  }

  // signage
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  if (cell.type === 'home') {
    ctx.fillStyle = '#ffe28a';
    ctx.fillText('🏠 우리집', r.x + r.w / 2, r.y - 8);
  } else if (cell.type === 'store') {
    ctx.fillStyle = '#8affb0';
    ctx.fillText('🏪 ' + cell.storeRef.name, r.x + r.w / 2, r.y - 8);
  } else if (cell.type === 'police') {
    ctx.fillStyle = '#8ac4ff';
    ctx.fillText('🚓 경찰서', r.x + r.w / 2, r.y - 8);
  }
}
