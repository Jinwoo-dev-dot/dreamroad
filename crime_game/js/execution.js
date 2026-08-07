// ==============================
// 사형 집행 시퀀스 (사형수 독방에서 3일 후 발생)
// ==============================
'use strict';

const ExecutionLayout = {
  w: 480, h: 340,
  door: { x: 240, y: 300 },
  chairSpot: { x: 240, y: 140 },
  guardLeftSpot: { x: 160, y: 175 },
  guardRightSpot: { x: 320, y: 175 },
};

const EXEC_PHASES = { enter: 2.0, strap: 2.0, final: 2.4, countdown: 3.3, fade: 2.2 };

function startExecutionSequence() {
  State.mode = 'execution';
  State.execution = {
    phase: 'enter', t: 0,
    guardL: { kind: 'guard', x: ExecutionLayout.door.x - 30, y: ExecutionLayout.door.y, radius: 13, facing: -Math.PI / 2, animTimer: 0, speed: 0 },
    guardR: { kind: 'guard', x: ExecutionLayout.door.x + 30, y: ExecutionLayout.door.y, radius: 13, facing: -Math.PI / 2, animTimer: 0, speed: 0 },
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
        E.phase = 'strap'; E.t = 0; p.speed = 0;
        setSubtitle('교도관', EXEC_PHASES.strap, '교도관이 결박을 마쳤습니다.');
      }
      break;
    }
    case 'strap':
      p.state = 'cuffed';
      E.guardL.speed = 0; E.guardR.speed = 0;
      if (E.t >= EXEC_PHASES.strap) {
        E.phase = 'final'; E.t = 0;
        setSubtitle('교도관', EXEC_PHASES.final, '교도관: "마지막으로 남길 말이 있습니까..."');
      }
      break;
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

function executionDraw(ctx) {
  const E = State.execution;
  ctx.fillStyle = '#1a1517';
  ctx.fillRect(0, 0, ExecutionLayout.w, ExecutionLayout.h);
  ctx.strokeStyle = '#0a0708';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, ExecutionLayout.w - 10, ExecutionLayout.h - 10);

  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a05a5a';
  ctx.fillText('집행실', ExecutionLayout.w / 2, 26);

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
    drawPerson(ctx, E.guardL, { bodyColor: '#3a4f8a', headColor: SKIN, hat: '#26346b', badge: true, weapon: 'none' });
    drawPerson(ctx, E.guardR, { bodyColor: '#3a4f8a', headColor: SKIN, hat: '#26346b', badge: true, weapon: 'none' });
  }

  drawPlayer(ctx);
  drawParticles(ctx);

  if (E && E.phase === 'countdown') {
    const remain = Math.max(0, Math.ceil(EXEC_PHASES.countdown - E.t));
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = 'rgba(255,90,90,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(String(remain), ExecutionLayout.w / 2, ExecutionLayout.h / 2 + 20);
  }
  if (E && E.phase === 'fade') {
    const t = clamp(E.t / EXEC_PHASES.fade, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + t + ')';
    ctx.fillRect(0, 0, ExecutionLayout.w, ExecutionLayout.h);
  }
}
