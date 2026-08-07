// ==============================
// 출근길 (짧은 전환 연출)
// ==============================
'use strict';

const Commute = { t: 0, dur: 3.0, walkCycle: 0 };

function commuteEnter() {
  State.scene = 'commute';
  Commute.t = 0;
  Commute.walkCycle = 0;
  setSubtitle('', 2.4, '버스를 타고 병원으로 출근하는 중...');
}

function commuteUpdate(dt) {
  Commute.t += dt;
  Commute.walkCycle += dt;
  if (Commute.t >= Commute.dur) supplyEnter();
}

function commuteDraw(ctx) {
  const w = State.w, h = State.h;
  const t = clamp(Commute.t / Commute.dur, 0, 1);

  // sky
  const skyTop = lerp(30, 90, t), skyBot = lerp(60, 140, t);
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  grad.addColorStop(0, 'rgb(' + (skyTop + 60) + ',' + (skyTop + 90) + ',' + (skyTop + 130) + ')');
  grad.addColorStop(1, 'rgb(' + (skyBot + 100) + ',' + (skyBot + 110) + ',' + (skyBot + 120) + ')');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h * 0.62);

  // ground
  ctx.fillStyle = '#3a3d42';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = 'rgba(255,220,120,0.5)';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 20]);
  const scroll = (Commute.t * 220) % 46;
  ctx.beginPath();
  ctx.moveTo(-scroll, h * 0.62 + 30);
  ctx.lineTo(w + 46, h * 0.62 + 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // scrolling buildings (parallax)
  for (let i = 0; i < 8; i++) {
    const bx = (i * 220 - (Commute.t * 90) % 220) - 40;
    const bh = 90 + (i % 3) * 40;
    ctx.fillStyle = i % 2 === 0 ? '#4a4d54' : '#42454b';
    ctx.fillRect(bx, h * 0.62 - bh, 140, bh);
  }

  // bus
  const busX = w / 2 - 90;
  const busY = h * 0.62 - 70;
  ctx.fillStyle = '#e0913a';
  ctx.fillRect(busX, busY, 220, 70);
  ctx.fillStyle = '#bfe6ff';
  for (let i = 0; i < 4; i++) ctx.fillRect(busX + 14 + i * 52, busY + 14, 36, 24);
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(busX + 34, busY + 76, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(busX + 186, busY + 76, 12, 0, Math.PI * 2); ctx.fill();

  // nurse silhouette inside bus window (bobbing)
  const bob = Math.sin(Commute.walkCycle * 6) * 2;
  drawNurseCharacter(ctx, busX + 110, busY + 40 + bob, 0.85);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.textAlign = 'center';
  ctx.fillText('출근하는 중...', w / 2, 60);

  // progress bar
  const pbW = 320, pbX = w / 2 - pbW / 2, pbY = h - 60;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(pbX, pbY, pbW, 14);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(pbX, pbY, pbW * t, 14);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
  ctx.strokeRect(pbX, pbY, pbW, 14);
}
