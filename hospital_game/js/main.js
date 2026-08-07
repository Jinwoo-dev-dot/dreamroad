// ==============================
// 부트스트랩 / 입력 / 메인 루프
// ==============================
'use strict';

function update(dt) {
  switch (State.scene) {
    case 'wardrobe': wardrobeUpdate(); break;
    case 'commute': commuteUpdate(dt); break;
    case 'supply': supplyUpdate(dt); break;
    case 'station': stationUpdate(); break;
    case 'treatment': treatmentUpdate(dt); break;
    default: break;
  }
}

function render() {
  const ctx = State.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#111417';
  ctx.fillRect(0, 0, State.w, State.h);
  if (State.scene === 'title') return;

  switch (State.scene) {
    case 'wardrobe': wardrobeDraw(ctx); break;
    case 'commute': commuteDraw(ctx); break;
    case 'supply': supplyDraw(ctx); break;
    case 'station': stationDraw(ctx); break;
    case 'treatment': treatmentDraw(ctx); break;
    case 'daySummary': daySummaryDraw(ctx); break;
    default: break;
  }

  drawTopHud(ctx);
  drawSupplyStrip(ctx);
  drawSubtitleBox(ctx);
}

function handleClick(mx, my) {
  switch (State.scene) {
    case 'wardrobe': wardrobeClick(mx, my); break;
    case 'supply': supplyClick(mx, my); break;
    case 'station': stationClick(mx, my); break;
    case 'treatment':
      if (Treatment.kind === 'medicine') treatmentClickMedicineShelf(mx, my);
      treatmentClick(mx, my);
      break;
    case 'daySummary': daySummaryClick(mx, my); break;
    default: break;
  }
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
  Wardrobe.buttons = [];
  Supply.crates = [];
  Station.deptButtons = [];
}

function startGame() {
  State.day = 1;
  State.patientsToday = 0;
  State.patientsDone = 0;
  State.correctTriage = 0;
  State.totalTreated = 0;
  State.outfit = { top: 0, bottom: 0, stockings: 0, shoes: 0, hair: 0, accessory: 0 };
  State.supplies = { bandage: 0, syringe: 0, cast: 0, medicine: 0, iv: 0 };
  showTitleScreen(false);
  wardrobeEnter();
}

function bindInput() {
  const canvas = State.canvas;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    State.mouse.x = e.clientX - rect.left;
    State.mouse.y = e.clientY - rect.top;
    if (State.scene === 'treatment') treatmentMouseMove(State.mouse.x, State.mouse.y);
  });
  canvas.addEventListener('mousedown', (e) => {
    State.mouse.down = true;
    if (State.scene === 'treatment') {
      const rect = canvas.getBoundingClientRect();
      treatmentMouseDown(e.clientX - rect.left, e.clientY - rect.top);
    }
  });
  window.addEventListener('mouseup', () => {
    State.mouse.down = false;
    if (State.scene === 'treatment') treatmentMouseUp();
  });
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleClick(e.clientX - rect.left, e.clientY - rect.top);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('resize', resizeCanvas);
}

window.addEventListener('DOMContentLoaded', () => {
  State.canvas = document.getElementById('game');
  State.ctx = State.canvas.getContext('2d');
  resizeCanvas();
  bindInput();

  const btn = document.getElementById('start-btn');
  if (btn) btn.addEventListener('click', startGame);

  requestAnimationFrame(loop);
});
