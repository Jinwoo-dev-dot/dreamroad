// ==============================
// 물품창고: 붕대/주사기/깁스/약/수액 채우기
// ==============================
'use strict';

const SUPPLY_TYPES = [
  { key: 'bandage', name: '붕대', icon: '🩹', color: '#e8dcc8' },
  { key: 'syringe', name: '주사기', icon: '💉', color: '#cfe8ff' },
  { key: 'cast', name: '깁스 붕대', icon: '🦴', color: '#f4f6f8' },
  { key: 'medicine', name: '약품', icon: '💊', color: '#f0b8c8' },
  { key: 'iv', name: '수액백', icon: '🧴', color: '#c8e8d0' },
];

const SUPPLY_TARGET = 10;
const Supply = { crates: [], sparkles: [] };

function supplyEnter() {
  State.scene = 'supply';
  State.supplies = { bandage: 0, syringe: 0, cast: 0, medicine: 0, iv: 0 };
  Supply.sparkles = [];
  supplyLayout();
  setSubtitle('', 2.4, '오늘 쓸 물품을 창고에서 채워넣으세요.');
}

function supplyLayout() {
  const w = State.w, h = State.h;
  const n = SUPPLY_TYPES.length;
  const gap = Math.min(190, (w - 120) / n);
  const startX = w / 2 - (gap * (n - 1)) / 2;
  Supply.crates = SUPPLY_TYPES.map((s, i) => ({
    key: s.key, x: startX + i * gap, y: h * 0.48, w: 120, h: 110,
  }));
  Supply.goBtn = { x: w / 2 - 110, y: h - 80, w: 220, h: 50 };
}

function supplyUpdate(dt) {
  if (Supply.crates.length === 0) supplyLayout();
  for (const s of Supply.sparkles) { s.life -= dt; s.y -= dt * 30; }
  Supply.sparkles = Supply.sparkles.filter((s) => s.life > 0);
}

function supplyAllFull() {
  return SUPPLY_TYPES.every((s) => State.supplies[s.key] >= SUPPLY_TARGET);
}

function supplyClick(mx, my) {
  if (Supply.crates.length === 0) supplyLayout();
  for (const c of Supply.crates) {
    if (mx >= c.x - c.w / 2 && mx <= c.x + c.w / 2 && my >= c.y - c.h / 2 && my <= c.y + c.h / 2) {
      if (State.supplies[c.key] < SUPPLY_TARGET) {
        State.supplies[c.key] += 1;
        Supply.sparkles.push({ x: c.x + rand(-20, 20), y: c.y, life: 0.6, text: '+1' });
      }
      return;
    }
  }
  const g = Supply.goBtn;
  if (supplyAllFull() && mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
    State.patientsToday = 0;
    State.patientsDone = 0;
    State.correctTriage = 0;
    stationEnter();
  }
}

function supplyDraw(ctx) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#26282c';
  ctx.fillRect(0, 0, w, h);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.textAlign = 'center';
  ctx.fillText('🏥 물품창고', w / 2, 50);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#aab0b8';
  ctx.fillText('상자를 클릭해서 오늘 쓸 물품을 10개씩 채워넣으세요.', w / 2, 74);

  if (Supply.crates.length === 0) supplyLayout();
  for (const c of Supply.crates) {
    const meta = SUPPLY_TYPES.find((s) => s.key === c.key);
    const amount = State.supplies[c.key];
    const full = amount >= SUPPLY_TARGET;

    ctx.fillStyle = full ? 'rgba(140,220,140,0.15)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
    ctx.strokeStyle = full ? '#8ee68e' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = full ? 2 : 1;
    ctx.strokeRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);

    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(meta.icon, c.x, c.y - 20);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#eee';
    ctx.fillText(meta.name, c.x, c.y + 6);

    // fill gauge
    const gaugeW = c.w - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(c.x - gaugeW / 2, c.y + 18, gaugeW, 10);
    ctx.fillStyle = full ? '#8ee68e' : meta.color;
    ctx.fillRect(c.x - gaugeW / 2, c.y + 18, gaugeW * (amount / SUPPLY_TARGET), 10);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(amount + ' / ' + SUPPLY_TARGET, c.x, c.y + 42);

    if (!full) {
      ctx.fillStyle = '#ffd23f';
      ctx.font = '11px sans-serif';
      ctx.fillText('클릭해서 채우기', c.x, c.y + c.h / 2 - 8);
    }
  }

  for (const s of Supply.sparkles) {
    ctx.globalAlpha = clamp(s.life / 0.6, 0, 1);
    ctx.fillStyle = '#8ee68e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(s.text, s.x, s.y);
    ctx.globalAlpha = 1;
  }

  const g = Supply.goBtn;
  const ready = supplyAllFull();
  ctx.fillStyle = ready ? '#2f8f4f' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.fillStyle = ready ? '#fff' : '#777';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(ready ? '🚶 병동으로 이동' : '물품을 모두 채워주세요', g.x + g.w / 2, g.y + g.h / 2 + 6);
}
