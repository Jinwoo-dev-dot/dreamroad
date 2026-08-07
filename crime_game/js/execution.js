// ==============================
// 사형 집행 시퀀스 (사형수 독방에서 3일 후 발생)
// ==============================
'use strict';

const ExecutionLayout = {
  w: 480, h: 340,
  door: { x: 240, y: 300 },
  chairSpot: { x: 240, y: 140 },
  guardLeftSpot: { x: 165, y: 165 },
  guardRightSpot: { x: 315, y: 165 },
  wardenSpot: { x: 240, y: 60 },
  windowSpot: { x: 240, y: 46, w: 90, h: 24 },
};

const EXEC_PHASES = { enter: 2.0, strap: 2.7, final: 2.6, countdown: 3.6, fade: 2.4 };

function startExecutionSequence() {
  State.mode = 'execution';
  State.execution = {
    phase: 'enter', t: 0, strapsSecured: 0,
    guardL: { kind: 'guard', x: ExecutionLayout.door.x - 30, y: ExecutionLayout.door.y, radius: 13, facing: -Math.PI / 2, animTimer: 0, speed: 0 },
    guardR: { kind: 'guard', x: ExecutionLayout.door.x + 30, y: ExecutionLayout.door.y, radius: 13, facing: -Math.PI / 2, animTimer: 0, speed: 0 },
    warden: { kind: 'guard', x: ExecutionLayout.wardenSpot.x, y: ExecutionLayout.wardenSpot.y, radius: 12, facing: Math.PI / 2, animTimer: 0, speed: 0 },
  };
  State.player.controlLocked = true;
  State.player.x = ExecutionLayout.door.x;
  State.player.y = ExecutionLayout.door.y;
  State.player.facing = -Math.PI / 2;
  State.player.state = 'walkCuffed';
  if (typeof updateCamera === 'function') updateCamera(false);
  setSubtitle('교도관', EXEC_PHASES.enter, '교도관: "시간이 되었습니다. 따라오시죠."');
}

function executionUpdate(dt) {
  const E = State.execution;
  if (!E) return;
  E.t += dt;
  const p = State.player;
  E.guardL.animTimer += dt;
  E.guardR.animTimer += dt;
  E.warden.animTimer += dt;

  switch (E.phase) {
    case 'enter': {
      const t = clamp(E.t / EXEC_PHASES.enter, 0, 1);
      p.x = lerp(ExecutionLayout.door.x, ExecutionLayout.chairSpot.x, t);
      p.y = lerp(ExecutionLayout.door.y, ExecutionLayout.chairSpot.y, t);
      p.facing = -Math.PI / 2;
      p.speed = 55; p.state = 'walkCuffed';
      E.guardL.x = lerp(ExecutionLayout.door.x - 30, ExecutionLayout.guardLeftSpot.x, t);
      E.guardL.y = lerp(ExecutionLayout.door.y, ExecutionLayout.guardLeftSpot.y, t);
      E.guardR.x = lerp(ExecutionLayout.door.x + 30, ExecutionLayout.guardRightSpot.x, t);
      E.guardR.y = lerp(ExecutionLayout.door.y, ExecutionLayout.guardRightSpot.y, t);
      E.guardL.speed = 55; E.guardR.speed = 55;
      if (E.t >= EXEC_PHASES.enter) {
        E.phase = 'strap'; E.t = 0; p.speed = 0; p.state = 'cuffed';
        setSubtitle('교도관', 1.6, '교도관: "앉으십시오."');
      }
      break;
    }
    case 'strap': {
      E.guardL.speed = 0; E.guardR.speed = 0;
      p.state = 'cuffed';
      const frac = clamp(E.t / EXEC_PHASES.strap, 0, 1);
      const target = frac < 0.34 ? 1 : frac < 0.67 ? 2 : frac < 0.97 ? 3 : 3;
      if (target > E.strapsSecured) {
        E.strapsSecured = target;
        spawnParticle({ type: 'spark', x: p.x, y: p.y, vx: 0, vy: -8, life: 0.35, maxLife: 0.35, size: 4 });
        if (target === 1) setSubtitle('교도관', 1.4, '오른팔을 고정합니다.');
        else if (target === 2) setSubtitle('교도관', 1.4, '왼팔을 고정합니다.');
        else setSubtitle('교도관', 1.4, '가슴 결박을 마쳤습니다.');
      }
      if (E.t >= EXEC_PHASES.strap) {
        E.phase = 'final'; E.t = 0;
        setSubtitle('교도관', EXEC_PHASES.final, '교도관: "마지막으로 남길 말이 있습니까..."');
      }
      break;
    }
    case 'final':
      if (E.t >= EXEC_PHASES.final) {
        E.phase = 'countdown'; E.t = 0;
        setSubtitle('', EXEC_PHASES.countdown, '집행을 시작합니다.');
      }
      break;
    case 'countdown':
      if (E.t >= EXEC_PHASES.countdown) {
        E.phase = 'fade'; E.t = 0;
        if (typeof sfxToll === 'function') sfxToll();
      }
      break;
    case 'fade':
      if (E.t >= EXEC_PHASES.fade) executionFinish();
      break;
  }
}

function executionFinish() {
  const summaryEl = document.getElementById('end-summary');
  if (summaryEl) summaryEl.textContent = '사형수 독방에서 사흘을 보낸 뒤, 형이 집행되었습니다.';
  showEndScreen(true);
  State.mode = 'ending';
  State.execution = null;
  State.jail = null;
}

function executionZoomFactor(E) {
  if (!E) return 1;
  if (E.phase === 'final') return 1 + 0.08 * clamp(E.t / EXEC_PHASES.final, 0, 1);
  if (E.phase === 'countdown') return 1.08 + 0.14 * clamp(E.t / EXEC_PHASES.countdown, 0, 1);
  if (E.phase === 'fade') return 1.22;
  return 1;
}

function executionDraw(ctx) {
  const E = State.execution;
  const w = ExecutionLayout.w, h = ExecutionLayout.h;
  const zoom = executionZoomFactor(E);

  ctx.save();
  if (zoom !== 1) {
    ctx.translate(w / 2, h / 2 * 0.75);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2 * 0.75);
  }

  ctx.fillStyle = '#1a1517';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#0a0708';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a05a5a';
  ctx.fillText('집행실', w / 2, 26);

  // observation window with a silent witness behind the glass
  const win = ExecutionLayout.windowSpot;
  ctx.fillStyle = '#0d1a22';
  ctx.fillRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h);
  ctx.strokeStyle = '#284554'; ctx.lineWidth = 3;
  ctx.strokeRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h);
  ctx.fillStyle = 'rgba(200,220,230,0.35)';
  ctx.beginPath(); ctx.arc(win.x, win.y + 3, 6, 0, Math.PI * 2); ctx.fill();

  // wall clock
  ctx.strokeStyle = '#5a5049'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(60, 34, 12, 0, Math.PI * 2); ctx.stroke();
  const clockAngle = (State.time * 1.4) % (Math.PI * 2);
  ctx.beginPath(); ctx.moveTo(60, 34); ctx.lineTo(60 + Math.cos(clockAngle) * 8, 34 + Math.sin(clockAngle) * 8); ctx.stroke();

  // chair
  const c = ExecutionLayout.chairSpot;
  ctx.fillStyle = '#3a3230';
  ctx.fillRect(c.x - 22, c.y - 26, 44, 56);
  ctx.strokeStyle = '#171313'; ctx.lineWidth = 3;
  ctx.strokeRect(c.x - 22, c.y - 26, 44, 56);
  ctx.strokeStyle = '#55494a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x - 22, c.y - 4); ctx.lineTo(c.x + 22, c.y - 4); ctx.stroke();

  // door
  ctx.fillStyle = '#111';
  ctx.fillRect(ExecutionLayout.door.x - 20, ExecutionLayout.door.y - 4, 40, 10);

  if (E) {
    drawPerson(ctx, E.warden, { bodyColor: '#2c2c34', headColor: SKIN, weapon: 'none' });
    drawPerson(ctx, E.guardL, { bodyColor: '#3a4f8a', headColor: SKIN, hat: '#26346b', badge: true, weapon: 'none' });
    drawPerson(ctx, E.guardR, { bodyColor: '#3a4f8a', headColor: SKIN, hat: '#26346b', badge: true, weapon: 'none' });
  }

  drawPlayer(ctx);

  // progressive restraint straps drawn over the seated figure
  if (E && E.strapsSecured > 0) {
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    if (E.strapsSecured >= 1) { ctx.beginPath(); ctx.moveTo(c.x - 20, c.y - 12); ctx.lineTo(c.x + 20, c.y - 12); ctx.stroke(); }
    if (E.strapsSecured >= 2) { ctx.beginPath(); ctx.moveTo(c.x - 20, c.y); ctx.lineTo(c.x + 20, c.y); ctx.stroke(); }
    if (E.strapsSecured >= 3) { ctx.beginPath(); ctx.moveTo(c.x - 20, c.y + 14); ctx.lineTo(c.x + 20, c.y + 14); ctx.stroke(); }
  }

  drawParticles(ctx);

  if (E && E.phase === 'countdown') {
    if (Math.random() < 0.05) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
    }
    const remain = Math.max(0, Math.ceil(EXEC_PHASES.countdown - E.t));
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = 'rgba(255,90,90,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(String(remain), w / 2, h / 2 + 20);
  }

  ctx.restore();

  if (E && E.phase === 'fade') {
    const t = clamp(E.t / EXEC_PHASES.fade, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + t + ')';
    ctx.fillRect(0, 0, w, h);
  }
}
