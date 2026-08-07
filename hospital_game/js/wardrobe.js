// ==============================
// 출근 준비: 옷 고르기 (와드로브)
// ==============================
'use strict';

const WARDROBE_OPTIONS = {
  top: [
    { name: '화이트 유니폼', color: '#f4f6f8', trim: '#c8d0d8' },
    { name: '민트 스크럽', color: '#8fd0c0', trim: '#5aa896' },
    { name: '핑크 스크럽', color: '#f0b8c8', trim: '#d888a0' },
    { name: '하늘색 유니폼', color: '#a8d0f0', trim: '#78a8d8' },
  ],
  bottom: [
    { name: '유니폼 스커트', kind: 'skirt', color: '#f4f6f8' },
    { name: '스크럽 팬츠', kind: 'pants', color: '#5a6068' },
    { name: '화이트 슬랙스', kind: 'pants', color: '#e8eaec' },
    { name: '민트 스크럽 팬츠', kind: 'pants', color: '#8fd0c0' },
  ],
  stockings: [
    { name: '살색 스타킹', color: '#e8c39e' },
    { name: '흰색 스타킹', color: '#f4f6f8' },
    { name: '검정 스타킹', color: '#3a3d42' },
    { name: '맨다리 (스타킹 없음)', color: null },
  ],
  shoes: [
    { name: '화이트 스니커즈', color: '#f4f6f8', trim: '#cfd6dd' },
    { name: '간호사 클로그', color: '#e8eaec', trim: '#a8b0b8' },
    { name: '베이지 로퍼', color: '#c9a877', trim: '#8a6c48' },
  ],
  hair: [
    { name: '낮은 묶음머리', kind: 'low', color: '#3a2a20' },
    { name: '포니테일', kind: 'pony', color: '#2a1f18' },
    { name: '간호사 캡 + 묶음', kind: 'cap', color: '#4a3528' },
  ],
  accessory: [
    { name: '없음', kind: 'none' },
    { name: '명찰', kind: 'badge' },
    { name: '청진기', kind: 'stethoscope' },
  ],
};

const WARDROBE_CATEGORIES = [
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'stockings', label: '스타킹' },
  { key: 'shoes', label: '신발' },
  { key: 'hair', label: '헤어' },
  { key: 'accessory', label: '액세서리' },
];

const Wardrobe = { activeCat: 'top', buttons: [] };

function wardrobeEnter() {
  State.scene = 'wardrobe';
  Wardrobe.activeCat = 'top';
  setSubtitle('', 0);
}

function wardrobeLayout() {
  const w = State.w, h = State.h;
  const panelX = w * 0.52;
  Wardrobe.buttons = [];
  const tabW = (w - panelX - 40) / WARDROBE_CATEGORIES.length;
  WARDROBE_CATEGORIES.forEach((cat, i) => {
    Wardrobe.buttons.push({
      type: 'tab', key: cat.key, label: cat.label,
      x: panelX + i * tabW, y: 90, w: tabW - 6, h: 34,
    });
  });
  const opts = WARDROBE_OPTIONS[Wardrobe.activeCat];
  const rowY = 140;
  opts.forEach((opt, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    Wardrobe.buttons.push({
      type: 'option', cat: Wardrobe.activeCat, idx: i, label: opt.name,
      x: panelX + col * ((w - panelX - 40) / 2), y: rowY + row * 56,
      w: (w - panelX - 40) / 2 - 10, h: 46,
    });
  });
  Wardrobe.goBtn = { x: panelX, y: h - 80, w: w - panelX - 40, h: 50 };
}

function wardrobeUpdate() {
  if (Wardrobe.buttons.length === 0) wardrobeLayout();
}

function wardrobeClick(mx, my) {
  if (Wardrobe.buttons.length === 0) wardrobeLayout();
  for (const b of Wardrobe.buttons) {
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      if (b.type === 'tab') { Wardrobe.activeCat = b.key; wardrobeLayout(); }
      else if (b.type === 'option') { State.outfit[b.cat] = b.idx; }
      return;
    }
  }
  const g = Wardrobe.goBtn;
  if (g && mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
    commuteEnter();
  }
}

function wardrobeDraw(ctx) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#2a2c30';
  ctx.fillRect(0, 0, w, h);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.textAlign = 'left';
  ctx.fillText(State.day + '일차 출근 준비', 30, 44);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#aab0b8';
  ctx.fillText('오늘 입을 옷을 골라주세요.', 30, 66);

  // preview panel
  const previewX = w * 0.26, previewY = h * 0.55;
  ctx.fillStyle = '#34363b';
  ctx.fillRect(20, 90, w * 0.5 - 40, h - 130);
  drawNurseCharacter(ctx, previewX, previewY, 2.6);

  // right panel
  if (Wardrobe.buttons.length === 0) wardrobeLayout();
  for (const b of Wardrobe.buttons) {
    if (b.type === 'tab') {
      const active = b.key === Wardrobe.activeCat;
      ctx.fillStyle = active ? 'rgba(255,210,80,0.85)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = active ? '#2a2c30' : '#cfd6dd';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
    } else if (b.type === 'option') {
      const selected = State.outfit[b.cat] === b.idx;
      ctx.fillStyle = selected ? 'rgba(255,210,80,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = selected ? '#ffd23f' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = selected ? '#ffe28a' : '#dcdcdc';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
    }
  }

  const g = Wardrobe.goBtn;
  ctx.fillStyle = '#c0342f';
  ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚪 출근하기', g.x + g.w / 2, g.y + g.h / 2 + 6);
}

// Simple front-facing paper-doll style nurse character, reused by wardrobe & other scenes.
function drawNurseCharacter(ctx, cx, cy, scale) {
  const o = State.outfit;
  const top = WARDROBE_OPTIONS.top[o.top];
  const bottom = WARDROBE_OPTIONS.bottom[o.bottom];
  const stockings = WARDROBE_OPTIONS.stockings[o.stockings];
  const shoes = WARDROBE_OPTIONS.shoes[o.shoes];
  const hair = WARDROBE_OPTIONS.hair[o.hair];
  const accessory = WARDROBE_OPTIONS.accessory[o.accessory];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 78, 34, 8, 0, 0, Math.PI * 2); ctx.fill();

  // legs
  const legColor = stockings.color || '#e8c39e';
  ctx.fillStyle = legColor;
  ctx.fillRect(-16, 30, 12, 46);
  ctx.fillRect(4, 30, 12, 46);

  // bottom garment
  if (bottom.kind === 'skirt') {
    ctx.fillStyle = bottom.color;
    ctx.beginPath();
    ctx.moveTo(-20, 28); ctx.lineTo(20, 28); ctx.lineTo(26, 56); ctx.lineTo(-26, 56);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = bottom.color;
    ctx.fillRect(-18, 28, 14, 50);
    ctx.fillRect(4, 28, 14, 50);
  }

  // shoes
  ctx.fillStyle = shoes.color;
  ctx.beginPath(); ctx.ellipse(-10, 78, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 78, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (shoes.trim) {
    ctx.strokeStyle = shoes.trim; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(-10, 78, 10, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10, 78, 10, 6, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // torso
  ctx.fillStyle = top.color;
  ctx.beginPath();
  ctx.moveTo(-24, -10); ctx.lineTo(24, -10); ctx.lineTo(20, 32); ctx.lineTo(-20, 32);
  ctx.closePath(); ctx.fill();
  if (top.trim) {
    ctx.strokeStyle = top.trim; ctx.lineWidth = 2;
    ctx.stroke();
  }
  // collar v-neck
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(0, 2); ctx.lineTo(6, -10); ctx.closePath(); ctx.fill();

  // arms
  ctx.fillStyle = top.color;
  ctx.fillRect(-32, -8, 10, 34);
  ctx.fillRect(22, -8, 10, 34);
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath(); ctx.arc(-27, 28, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(27, 28, 6, 0, Math.PI * 2); ctx.fill();

  // accessory: badge / stethoscope
  if (accessory.kind === 'badge') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, -4, 12, 8);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(8, -4, 12, 8);
  } else if (accessory.kind === 'stethoscope') {
    ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.quadraticCurveTo(0, 10, 10, -8);
    ctx.stroke();
    ctx.fillStyle = '#3a3d42';
    ctx.beginPath(); ctx.arc(0, 8, 4, 0, Math.PI * 2); ctx.fill();
  }

  // neck + head
  ctx.fillStyle = '#e8c39e';
  ctx.fillRect(-5, -18, 10, 10);
  ctx.beginPath(); ctx.arc(0, -30, 16, 0, Math.PI * 2); ctx.fill();

  // hair (behind-ish, drawn after head edges for a simple look)
  ctx.fillStyle = hair.color;
  if (hair.kind === 'low') {
    ctx.beginPath(); ctx.arc(0, -30, 17, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -8, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
  } else if (hair.kind === 'pony') {
    ctx.beginPath(); ctx.arc(0, -30, 17, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.beginPath(); ctx.ellipse(16, -14, 5, 16, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (hair.kind === 'cap') {
    ctx.beginPath(); ctx.arc(0, -30, 17, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -42, 13, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-13, -42, 26, 4);
    ctx.fillStyle = '#e05a5a';
    ctx.fillRect(-3, -46, 6, 6);
  }

  // face dots
  ctx.fillStyle = '#3a3d42';
  ctx.beginPath(); ctx.arc(-5, -30, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -30, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c07868'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -25, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  ctx.restore();
}
