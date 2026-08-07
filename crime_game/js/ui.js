// ==============================
// HUD: 수배 별, 무기 바, 자막, 미니맵, 교도소 시계
// ==============================
'use strict';

function uiDraw(ctx) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (State.mode === 'city' || State.mode === 'arrest') {
    drawWantedStars(ctx);
    drawCriminalRecord(ctx);
    drawHealthBar(ctx);
    drawWeaponBar(ctx);
    drawMinimap(ctx);
  } else if (State.mode === 'home' || State.mode === 'store') {
    drawWeaponBar(ctx);
  } else if (State.mode === 'jail') {
    drawJailHud(ctx);
  }

  if (State.prompt) {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const pw = ctx.measureText(State.prompt).width + 28;
    ctx.fillRect(State.w / 2 - pw / 2, State.h - 96, pw, 30);
    ctx.fillStyle = '#ffe28a';
    ctx.fillText(State.prompt, State.w / 2, State.h - 75);
  }

  drawSubtitle(ctx);
  drawModeLabel(ctx);
  ctx.restore();
}

function drawWantedStars(ctx) {
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(14, 14, 190, 40);
  let s = '';
  for (let i = 0; i < 5; i++) s += i < State.wanted ? '★' : '☆';
  ctx.fillStyle = State.wanted > 0 ? '#ffd23f' : '#777';
  ctx.fillText(s, 22, 44);
}

function drawCriminalRecord(ctx) {
  const s = State.stats;
  const capital = s.kills >= 4 || s.copKills > 0 || s.escaped > 0;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(14, 58, 230, s.copKills > 0 || s.escaped > 0 ? 46 : 28);
  ctx.fillStyle = capital ? '#ff5a5a' : '#dcdcdc';
  ctx.fillText('🔪 살해 ' + s.kills + '  🛒 절도 ' + s.thefts + '  💰 ' + s.cash, 22, 77);
  if (s.copKills > 0 || s.escaped > 0) {
    ctx.fillStyle = '#ff5a5a';
    ctx.fillText('🚓 경찰 살해 ' + s.copKills + '  🕳 탈옥 ' + s.escaped + ' (사형 확정)', 22, 95);
  }
}

function drawHealthBar(ctx) {
  const p = State.player;
  const y = State.stats && (State.stats.copKills > 0 || State.stats.escaped > 0) ? 108 : 90;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(14, y, 150, 20);
  ctx.fillStyle = p.hp > 40 ? '#4ad35a' : '#ff5a5a';
  ctx.fillRect(18, y + 4, 142 * (p.hp / 100), 12);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
  ctx.strokeRect(18, y + 4, 142, 12);
  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('체력 ' + Math.round(p.hp), 18 + 71, y + 13);
  if (p.disguises > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8affb0';
    ctx.font = '12px sans-serif';
    ctx.fillText('🥸 변장 x' + p.disguises + ' (4)', 172, y + 15);
  }
}

function drawWeaponBar(ctx) {
  const items = [
    { key: '1', name: '맨손', has: true, weapon: 'fists' },
    { key: '2', name: '칼', has: State.player.inv.knife, weapon: 'knife' },
    { key: '3', name: '총(' + State.player.ammo + ')', has: State.player.inv.gun, weapon: 'gun' },
  ];
  const bw = 74, bh = 54, gap = 8;
  const totalW = items.length * bw + (items.length - 1) * gap;
  let x = State.w / 2 - totalW / 2;
  const y = State.h - 70;
  for (const it of items) {
    ctx.fillStyle = State.player.weapon === it.weapon ? 'rgba(255,210,80,0.85)' : 'rgba(20,20,20,0.6)';
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = it.has ? '#ddd' : '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, bw, bh);
    ctx.fillStyle = it.has ? '#fff' : '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[' + it.key + '] ' + it.name, x + bw / 2, y + bh / 2 + 4);
    x += bw + gap;
  }
}

function drawMinimap(ctx) {
  const mx = State.w - 168, my = 16, mw = 152, mh = 152;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#888';
  ctx.strokeRect(mx, my, mw, mh);
  const sx = mw / World.width, sy = mh / World.height;

  ctx.fillStyle = '#3f6b3f';
  for (const p of World.parkRects) ctx.fillRect(mx + p.x * sx, my + p.y * sy, p.w * sx, p.h * sy);

  ctx.fillStyle = '#6b6b6b';
  for (const b of World.buildings) ctx.fillRect(mx + b.x * sx, my + b.y * sy, Math.max(1, b.w * sx), Math.max(1, b.h * sy));

  if (World.home) {
    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(mx + World.home.buildingRect.x * sx - 1, my + World.home.buildingRect.y * sy - 1, 4, 4);
  }
  ctx.fillStyle = '#8affb0';
  for (const s of World.stores) ctx.fillRect(mx + s.buildingRect.x * sx - 1, my + s.buildingRect.y * sy - 1, 3, 3);

  for (const p of State.police) {
    ctx.fillStyle = '#ff4a4a';
    ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = '#4ad3ff';
  ctx.beginPath(); ctx.arc(mx + State.player.x * sx, my + State.player.y * sy, 3, 0, Math.PI * 2); ctx.fill();
}

function drawSubtitle(ctx) {
  if (State.subtitle.timer <= 0) return;
  State.subtitle.timer -= 1 / 60;
  const alpha = clamp(State.subtitle.timer, 0, 1);
  ctx.globalAlpha = Math.min(1, alpha + 0.3);
  const boxY = State.h - 150;
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  const text = State.subtitle.sub || State.subtitle.text;
  if (text) {
    const w = Math.min(560, ctx.measureText(text).width + 40);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(State.w / 2 - w / 2, boxY, w, 34);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, State.w / 2, boxY + 22);
  }
  ctx.globalAlpha = 1;
}

function drawModeLabel(ctx) {
  if (State.mode === 'arrest' && State.arrest) {
    const labels = { freeze: '정지!', kneel: '무릎 꿇기', cuff: '수갑 채우는 중', escort: '호송 중', intoCar: '차량 탑승', drive: '이송 중', fade: '' };
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5a5a';
    ctx.fillText(labels[State.arrest.phase] || '', State.w / 2, 60);
    if (State.arrest.phase === 'fade') {
      const t = clamp(State.arrest.t / 0.9, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,' + t + ')';
      ctx.fillRect(0, 0, State.w, State.h);
    }
  }
}

function drawJailHud(ctx) {
  const J = State.jail;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(State.w / 2 - 170, 14, 340, 54);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(fmtClock(J.minutes), State.w / 2, 38);
  ctx.font = '13px sans-serif';
  const remain = Math.max(0, J.sentenceDays - J.servedDays);
  if (J.isDeathRow) {
    ctx.fillStyle = '#ff5a5a';
    ctx.fillText('사형수 독방 · 집행까지 D-' + remain + ' · ' + (J.current ? J.current.label : ''), State.w / 2, 58);
  } else {
    ctx.fillStyle = '#ffd23f';
    ctx.fillText('복역 ' + (J.servedDays + 1) + '/' + J.sentenceDays + '일째 · 남은 형기 ' + remain + '일 · ' + (J.current ? J.current.label : ''), State.w / 2, 58);
    if (J.earnedCash > 0 || J.reputation > 0) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#8affb0';
      ctx.fillText('💰 작업 수입 ' + J.earnedCash + '원 · 평판 ' + J.reputation, State.w / 2, 72);
    }
  }

  if (J.releasing) {
    const t = clamp(J.releaseT / 2.6, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + (t < 0.7 ? t * 0.4 : lerp(0.28, 1, (t - 0.7) / 0.3)) + ')';
    ctx.fillRect(0, 0, State.w, State.h);
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#8affb0';
    ctx.fillText('출소', State.w / 2, State.h / 2);
  }
}

// ---------- Title / end screens (DOM) ----------
function showTitleScreen(show) {
  const el = document.getElementById('title-screen');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showEndScreen(show) {
  const el = document.getElementById('end-screen');
  if (el) el.style.display = show ? 'flex' : 'none';
}
