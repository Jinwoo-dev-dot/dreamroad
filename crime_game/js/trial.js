// ==============================
// 재판: 살인/절도 횟수에 따른 형량 결정 (4명 이상 살해 시 사형)
// ==============================
'use strict';

const TrialLayout = {
  w: 700, h: 480,
  judgeBench: { x: 260, y: 30, w: 180, h: 60 },
  judgeSpot: { x: 350, y: 55 },
  prosecutorTable: { x: 110, y: 140, w: 130, h: 44 },
  prosecutorSpot: { x: 175, y: 160 },
  defenseTable: { x: 460, y: 140, w: 130, h: 44 },
  defenseSpot: { x: 525, y: 160 },
  dock: { x: 300, y: 250, w: 100, h: 70 },
  dockSpot: { x: 350, y: 285 },
  gallery: { x: 90, y: 360, w: 520, h: 90 },
};

function computeSentence(kills, thefts, copKills, escaped) {
  copKills = copKills || 0;
  escaped = escaped || 0;
  if (kills >= 4 || copKills >= 1 || escaped >= 1) {
    return { death: true, kills, thefts, copKills, escaped };
  }
  let days;
  if (kills === 0) days = clamp(2 + thefts, 2, 6);
  else if (kills === 1) days = 6;
  else if (kills === 2) days = 9;
  else days = 13; // kills === 3
  return { death: false, days, kills, thefts, copKills, escaped };
}

const TRIAL_PHASES = {
  enter: 1.0,
  charge: 3.0,
  defense: 2.2,
  deliberate: 1.8,
  verdict: 3.2,
  fade: 0.9,
};

function trialInit(stats) {
  State.mode = 'trial';
  State.trial = {
    phase: 'enter', t: 0,
    kills: stats.kills, thefts: stats.thefts, copKills: stats.copKills || 0, escaped: stats.escaped || 0,
    sentence: null,
    judge: { kind: 'npc', x: TrialLayout.judgeSpot.x, y: TrialLayout.judgeSpot.y, radius: 13, facing: Math.PI / 2, animTimer: 0, speed: 0 },
    prosecutor: { kind: 'npc', x: TrialLayout.prosecutorSpot.x, y: TrialLayout.prosecutorSpot.y, radius: 13, facing: Math.PI / 2, animTimer: 0, speed: 0 },
    defense: { kind: 'npc', x: TrialLayout.defenseSpot.x, y: TrialLayout.defenseSpot.y, radius: 13, facing: Math.PI / 2, animTimer: 0, speed: 0 },
  };
  State.player.controlLocked = true;
  State.player.x = TrialLayout.dockSpot.x;
  State.player.y = TrialLayout.dockSpot.y;
  State.player.facing = -Math.PI / 2;
  State.player.state = 'idle';
  if (typeof sirenStop === 'function') sirenStop();
  setSubtitle('법정 안내', TRIAL_PHASES.enter, '피고인은 법정으로 이송되었습니다.');
}

function trialUpdate(dt) {
  const T = State.trial;
  if (!T) return;
  T.t += dt;
  for (const who of [T.judge, T.prosecutor, T.defense]) who.animTimer += dt;

  switch (T.phase) {
    case 'enter':
      if (T.t >= TRIAL_PHASES.enter) {
        T.phase = 'charge'; T.t = 0;
        setSubtitle('검사', TRIAL_PHASES.charge, buildChargeText(T));
      }
      break;
    case 'charge':
      if (T.t >= TRIAL_PHASES.charge) {
        T.phase = 'defense'; T.t = 0;
        setSubtitle('변호인', TRIAL_PHASES.defense, '변호인: 피고인에게 정상 참작의 여지가 있습니다...');
      }
      break;
    case 'defense':
      if (T.t >= TRIAL_PHASES.defense) {
        T.phase = 'deliberate'; T.t = 0;
        setSubtitle('판사', TRIAL_PHASES.deliberate, '판사: 잠시 숙고하겠습니다.');
      }
      break;
    case 'deliberate':
      if (T.t >= TRIAL_PHASES.deliberate) {
        T.phase = 'verdict'; T.t = 0;
        T.sentence = computeSentence(T.kills, T.thefts, T.copKills, T.escaped);
        if (typeof sfxGavel === 'function') sfxGavel();
        if (T.sentence.death) {
          setSubtitle('판사', TRIAL_PHASES.verdict, '판사: "탕! 탕! 탕! — 피고인을 사형에 처한다. 형은 3일 뒤 집행한다."');
          if (typeof sfxToll === 'function') sfxToll();
        } else {
          setSubtitle('판사', TRIAL_PHASES.verdict, '판사: "탕! 탕! — 피고인에게 징역 ' + T.sentence.days + '일을 선고한다."');
        }
      }
      break;
    case 'verdict':
      if (T.t >= TRIAL_PHASES.verdict) { T.phase = 'fade'; T.t = 0; }
      break;
    case 'fade':
      if (T.t >= TRIAL_PHASES.fade) trialFinish();
      break;
  }
}

function buildChargeText(T) {
  const parts = [];
  if (T.copKills > 0) parts.push('경찰관 살해 ' + T.copKills + '건');
  if (T.kills > 0) parts.push('일반인 살해 ' + T.kills + '명');
  if (T.thefts > 0) parts.push('절도 ' + T.thefts + '회');
  if (T.escaped > 0) parts.push('탈옥 ' + T.escaped + '회');
  if (parts.length === 0) return '검사: 뚜렷한 증거는 없으나 정황상 기소합니다.';
  return '검사: 피고인은 ' + parts.join(', ') + '의 혐의를 받고 있습니다. 엄중한 처벌을 요청합니다.';
}

function trialFinish() {
  const sentence = State.trial.sentence;
  State.trial = null;
  State.stats.kills = 0;
  State.stats.thefts = 0;
  State.stats.copKills = 0;
  State.stats.escaped = 0;
  State.player.controlLocked = false;
  if (sentence.death) {
    jailInit(3, true);
  } else {
    jailInit(sentence.days, false);
  }
  State.mode = 'jail';
}

function trialDraw(ctx) {
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(0, 0, TrialLayout.w, TrialLayout.h);
  ctx.strokeStyle = '#151310';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, TrialLayout.w - 10, TrialLayout.h - 10);

  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe28a';
  ctx.fillText('법정', TrialLayout.w / 2, 24);

  const jb = TrialLayout.judgeBench;
  ctx.fillStyle = '#5c4630';
  ctx.fillRect(jb.x, jb.y, jb.w, jb.h);
  ctx.strokeStyle = '#2c2013'; ctx.lineWidth = 3;
  ctx.strokeRect(jb.x, jb.y, jb.w, jb.h);

  const pt = TrialLayout.prosecutorTable, dt2 = TrialLayout.defenseTable;
  ctx.fillStyle = '#4a3c2c';
  ctx.fillRect(pt.x, pt.y, pt.w, pt.h);
  ctx.fillRect(dt2.x, dt2.y, dt2.w, dt2.h);
  ctx.fillStyle = '#cfd8e0';
  ctx.font = '12px sans-serif';
  ctx.fillText('검사', pt.x + pt.w / 2, pt.y - 6);
  ctx.fillText('변호인', dt2.x + dt2.w / 2, dt2.y - 6);

  const dk = TrialLayout.dock;
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 4;
  ctx.strokeRect(dk.x, dk.y, dk.w, dk.h);
  ctx.fillStyle = '#8f98a3'; ctx.font = '11px sans-serif';
  ctx.fillText('피고인석', dk.x + dk.w / 2, dk.y - 8);

  // gallery benches
  const g = TrialLayout.gallery;
  ctx.fillStyle = '#3d3629';
  for (let row = 0; row < 2; row++) {
    ctx.fillRect(g.x, g.y + row * 40, g.w, 22);
  }
  ctx.fillStyle = '#6b6255';
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(g.x + 20 + i * (g.w - 40) / 8, g.y + row * 40 + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const T = State.trial;
  if (T) {
    drawPerson(ctx, T.judge, { bodyColor: '#1c1c22', headColor: SKIN, weapon: 'none' });
    drawPerson(ctx, T.prosecutor, { bodyColor: '#2c3a6b', headColor: SKIN, weapon: 'none' });
    drawPerson(ctx, T.defense, { bodyColor: '#555', headColor: SKIN, weapon: 'none' });
  }

  drawPlayer(ctx);
  drawParticles(ctx);
}
