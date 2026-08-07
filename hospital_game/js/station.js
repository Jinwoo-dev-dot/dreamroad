// ==============================
// 접수/분류: 환자 증상 듣고 진료과 안내하기
// ==============================
'use strict';

const Station = { queue: [], deptButtons: [], triedWrong: false, firstTryCorrect: true };

function stationEnter() {
  State.scene = 'station';
  Station.queue = shuffledDailyPatients(10);
  Station.triedWrong = false;
  Station.firstTryCorrect = true;
  stationNextPatient();
}

function shuffledDailyPatients(n) {
  const pool = [...DISEASES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function stationNextPatient() {
  if (State.patientsDone >= 10) { daySummaryEnter(); return; }
  const disease = Station.queue[State.patientsDone];
  State.currentPatient = { disease, name: pick(PATIENT_NAMES) };
  Station.triedWrong = false;
  Station.firstTryCorrect = true;
  setSubtitle(State.currentPatient.name + ' 환자', 3.5, '"' + disease.complaint + '"');
}

const PATIENT_NAMES = ['김민준', '이서연', '박도윤', '최지우', '정하준', '강서윤', '조은우', '윤지호', '장다은', '임지훈', '오수아', '한예준'];

function stationLayout() {
  const w = State.w, h = State.h;
  const n = DEPARTMENTS.length;
  const gap = Math.min(220, (w - 120) / n);
  const startX = w / 2 - (gap * (n - 1)) / 2;
  Station.deptButtons = DEPARTMENTS.map((d, i) => ({
    dept: d.id, x: startX + i * gap, y: h * 0.62, w: 160, h: 100,
  }));
}

function stationUpdate() {
  if (Station.deptButtons.length === 0) stationLayout();
}

function stationClick(mx, my) {
  if (Station.deptButtons.length === 0) stationLayout();
  for (const b of Station.deptButtons) {
    if (mx >= b.x - b.w / 2 && mx <= b.x + b.w / 2 && my >= b.y - b.h / 2 && my <= b.y + b.h / 2) {
      const disease = State.currentPatient.disease;
      if (b.dept === disease.dept) {
        if (Station.firstTryCorrect) State.correctTriage += 1;
        treatmentEnter(State.currentPatient);
      } else {
        Station.triedWrong = true;
        Station.firstTryCorrect = false;
        setSubtitle(State.currentPatient.name + ' 환자', 2.2, '"음... 여기가 맞나요? 잘 모르겠어요."');
      }
      return;
    }
  }
}

function stationDraw(ctx) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#2f3236';
  ctx.fillRect(0, 0, w, h);

  // reception desk
  ctx.fillStyle = '#3d4046';
  ctx.fillRect(w / 2 - 220, h * 0.22, 440, 90);
  ctx.strokeStyle = '#25272b'; ctx.lineWidth = 3;
  ctx.strokeRect(w / 2 - 220, h * 0.22, 440, 90);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.textAlign = 'center';
  ctx.fillText('🏥 접수/분류 데스크', w / 2, h * 0.22 - 14);

  // nurse behind desk
  drawNurseCharacter(ctx, w / 2 - 140, h * 0.22 + 20, 1.4);

  // patient in front of desk
  if (State.currentPatient) {
    drawGenericPatient(ctx, w / 2 + 140, h * 0.22 + 60, 1.4, '#c8a15a');
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#cfd6dd';
    ctx.fillText(State.currentPatient.name + ' 환자', w / 2 + 140, h * 0.22 + 105);
  }

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'center';
  ctx.fillText('환자를 알맞은 진료과로 안내하세요', w / 2, h * 0.5);

  if (Station.deptButtons.length === 0) stationLayout();
  for (const b of Station.deptButtons) {
    const meta = deptById(b.dept);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.strokeStyle = meta.color; ctx.lineWidth = 2;
    ctx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(meta.icon, b.x, b.y - 10);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#eee';
    ctx.fillText(meta.name, b.x, b.y + 22);
  }
}

function drawGenericPatient(ctx, cx, cy, scale, shirtColor) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 46, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a5d63';
  ctx.fillRect(-12, 6, 10, 34);
  ctx.fillRect(2, 6, 10, 34);
  ctx.fillStyle = shirtColor || '#8fa8c8';
  ctx.beginPath();
  ctx.moveTo(-18, -12); ctx.lineTo(18, -12); ctx.lineTo(15, 10); ctx.lineTo(-15, 10);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c39e';
  ctx.fillRect(-4, -18, 8, 8);
  ctx.beginPath(); ctx.arc(0, -26, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2018';
  ctx.beginPath(); ctx.arc(0, -30, 13, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3d42';
  ctx.beginPath(); ctx.arc(-4, -26, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -26, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
