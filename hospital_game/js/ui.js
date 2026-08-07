// ==============================
// HUD, 자막, 하루 요약(퇴근) 화면
// ==============================
'use strict';

const DaySummary = { btn: null };

function daySummaryEnter() {
  State.scene = 'daySummary';
  setSubtitle('', 0);
}

function daySummaryClick(mx, my) {
  const b = DaySummary.btn;
  if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
    State.day += 1;
    wardrobeEnter();
  }
}

function daySummaryDraw(ctx) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#20222a';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.fillText('🌙 ' + State.day + '일차 퇴근', w / 2, h * 0.28);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#cfd6dd';
  ctx.fillText('오늘도 수고하셨습니다.', w / 2, h * 0.28 + 34);

  const boxX = w / 2 - 180, boxY = h * 0.4, boxW = 360, boxH = 160;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = 'left';
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#eee';
  ctx.fillText('👥 진료한 환자: ' + State.patientsDone + '명', boxX + 24, boxY + 40);
  ctx.fillText('🎯 첫 분류 정확도: ' + State.correctTriage + ' / 10', boxX + 24, boxY + 70);
  ctx.fillText('📦 누적 진료 환자: ' + State.totalTreated + '명', boxX + 24, boxY + 100);

  const rank = State.correctTriage >= 9 ? '베테랑 간호사' : State.correctTriage >= 6 ? '믿음직한 간호사' : '성장 중인 간호사';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('오늘의 평가: ' + rank, boxX + 24, boxY + 132);

  DaySummary.btn = { x: w / 2 - 130, y: h * 0.72, w: 260, h: 54 };
  ctx.fillStyle = '#c0342f';
  ctx.fillRect(DaySummary.btn.x, DaySummary.btn.y, DaySummary.btn.w, DaySummary.btn.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('☀️ 다음 날 준비하기', w / 2, DaySummary.btn.y + DaySummary.btn.h / 2 + 6);
}

function drawTopHud(ctx) {
  if (State.scene !== 'station' && State.scene !== 'treatment') return;
  const w = State.w;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(14, 14, 220, 60);
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.fillText(State.day + '일차', 24, 34);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#dcdcdc';
  ctx.fillText('환자 ' + State.patientsDone + ' / 10', 24, 54);
  ctx.fillText('정확도 ' + State.correctTriage + ' / ' + Math.max(1, State.patientsDone), 24, 70);
}

function drawSupplyStrip(ctx) {
  if (State.scene !== 'treatment') return;
  const w = State.w;
  const startX = w - 260;
  const topY = 150; // sit below the prescription panel (which occupies y: 20-140)
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(startX, topY, 246, 44);
  let x = startX + 14;
  for (const s of SUPPLY_TYPES) {
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.icon, x, topY + 28);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = State.supplies[s.key] <= 0 ? '#ff5a5a' : '#cfd6dd';
    ctx.fillText(String(State.supplies[s.key]), x + 20, topY + 28);
    x += 48;
  }
}

function drawSubtitleBox(ctx) {
  if (State.subtitle.timer <= 0) return;
  State.subtitle.timer -= 1 / 60;
  const w = State.w, h = State.h;
  const alpha = clamp(State.subtitle.timer, 0, 1);
  ctx.globalAlpha = Math.min(1, alpha + 0.3);
  const text = State.subtitle.sub || State.subtitle.text;
  if (text) {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    const boxW = Math.min(600, ctx.measureText(text).width + 40);
    const boxY = h - 118;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(w / 2 - boxW / 2, boxY, boxW, 32);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, w / 2, boxY + 21);
  }
  ctx.globalAlpha = 1;
}

function showTitleScreen(show) {
  const el = document.getElementById('title-screen');
  if (el) el.style.display = show ? 'flex' : 'none';
}
