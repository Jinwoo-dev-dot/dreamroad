// ==============================
// 처치 미니게임: 붕대 / 깁스 / 수액·주사 / 약 처방
// ==============================
'use strict';

const BODY_PART_POS = {
  손목: { dx: 78, dy: -6 },
  손가락: { dx: 92, dy: -6 },
  발목: { dx: 42, dy: 78 },
  정강이: { dx: 42, dy: 55 },
  어깨: { dx: 58, dy: -42 },
  팔꿈치: { dx: 70, dy: -24 },
  무릎: { dx: 42, dy: 38 },
  가슴: { dx: 0, dy: -30 },
};

const Treatment = {
  patient: null, kind: null, stage: null,
  coverage: 0, stripes: [],
  hardenT: 0,
  ivStep: 0, ivTarget: null, ivMissT: 0, dripT: 0,
  medSelected: -1, medOptions: [],
  dragging: false, lastDrag: null,
  done: false, doneT: 0,
  zone: null,
};

function treatmentEnter(patient) {
  State.scene = 'treatment';
  Treatment.patient = patient;
  Treatment.kind = patient.disease.treatment;
  Treatment.coverage = 0;
  Treatment.stripes = [];
  Treatment.hardenT = 0;
  Treatment.ivStep = 0;
  Treatment.ivMissT = 0;
  Treatment.dripT = 0;
  Treatment.medSelected = -1;
  Treatment.dragging = false;
  Treatment.done = false;
  Treatment.doneT = 0;

  if (Treatment.kind === 'cast') Treatment.stage = 'padding';
  else if (Treatment.kind === 'bandage') Treatment.stage = 'wrap';
  else if (Treatment.kind === 'iv') Treatment.stage = 'site';
  else if (Treatment.kind === 'medicine') {
    Treatment.stage = 'pick';
    const others = MEDICINE_CATALOG.filter((m) => m !== patient.disease.medicineName);
    const decoys = [];
    while (decoys.length < 2 && others.length) decoys.push(others.splice(randInt(0, others.length - 1), 1)[0]);
    const opts = [patient.disease.medicineName, ...decoys];
    for (let i = opts.length - 1; i > 0; i--) { const j = randInt(0, i); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    Treatment.medOptions = opts;
  }

  setSubtitle('처방전', 3, patient.disease.diagnosis + ' — ' + treatmentInstructionText(patient.disease));
}

function treatmentInstructionText(d) {
  if (d.treatment === 'cast') return d.bodyPart + '에 깁스를 고정하세요.';
  if (d.treatment === 'bandage') return d.bodyPart + '을(를) 붕대로 감아 고정하세요.';
  if (d.treatment === 'iv') return (d.ivDrip ? d.ivFluid + '을(를) 정맥에 연결하세요.' : d.ivFluid + '을(를) 주사하세요.');
  if (d.treatment === 'medicine') return d.medicineName + '을(를) 처방하세요.';
  return '';
}

function treatmentSupplyKey() {
  const k = Treatment.kind;
  if (k === 'cast') return 'cast';
  if (k === 'bandage') return 'bandage';
  if (k === 'medicine') return 'medicine';
  if (k === 'iv') return Treatment.patient.disease.ivDrip ? 'iv' : 'syringe';
  return null;
}

function treatmentZone() {
  const w = State.w, h = State.h;
  const px = w * 0.38, py = h * 0.5;
  const bp = Treatment.patient.disease.bodyPart;
  const pos = BODY_PART_POS[bp] || { dx: 60, dy: 0 };
  return { cx: px + pos.dx, cy: py + pos.dy, w: 100, h: 56, patientX: px, patientY: py, bodyPart: bp };
}

// ---------- update ----------
function treatmentUpdate(dt) {
  if (Treatment.done) {
    Treatment.doneT += dt;
    if (Treatment.doneT > 1.4) treatmentFinish();
    return;
  }
  if (Treatment.kind === 'cast' && Treatment.stage === 'hardening') {
    Treatment.hardenT += dt;
    if (Treatment.hardenT >= 2.2) treatmentComplete();
  }
  if (Treatment.kind === 'iv' && Treatment.ivMissT > 0) Treatment.ivMissT -= dt;
  if (Treatment.kind === 'iv' && Treatment.stage === 'drip') {
    Treatment.dripT += dt;
    if (Treatment.dripT >= 2.6) treatmentComplete();
  }
}

// ---------- mouse handlers ----------
function treatmentMouseDown(mx, my) {
  const z = Treatment.zone = treatmentZone();

  if ((Treatment.kind === 'bandage' && Treatment.stage === 'wrap') ||
      (Treatment.kind === 'cast' && (Treatment.stage === 'padding' || Treatment.stage === 'plaster'))) {
    if (mx >= z.cx - z.w / 2 && mx <= z.cx + z.w / 2 && my >= z.cy - z.h / 2 && my <= z.cy + z.h / 2) {
      Treatment.dragging = true;
      Treatment.lastDrag = { x: mx, y: my };
    }
    return;
  }

  if (Treatment.kind === 'iv' && Treatment.stage === 'site') {
    const vein = { x: z.cx - 10, y: z.cy };
    if (dist(mx, my, vein.x, vein.y) < 26) {
      Treatment.stage = 'needle';
      Treatment.ivTarget = { x: vein.x + rand(-4, 4), y: vein.y + rand(-4, 4) };
      setSubtitle('', 2, '바늘을 혈관 위치에 정확히 꽂으세요.');
    }
    return;
  }
  if (Treatment.kind === 'iv' && Treatment.stage === 'needle') {
    const t = Treatment.ivTarget;
    if (dist(mx, my, t.x, t.y) < 14) {
      Treatment.stage = 'tape';
      setSubtitle('', 2, '테이프로 바늘을 고정하세요.');
    } else {
      Treatment.ivMissT = 0.5;
    }
    return;
  }
}

function treatmentMouseMove(mx, my) {
  if (!Treatment.dragging) return;
  const z = Treatment.zone || treatmentZone();
  const last = Treatment.lastDrag;
  if (last) {
    const d = dist(mx, my, last.x, last.y);
    if (mx >= z.cx - z.w / 2 - 10 && mx <= z.cx + z.w / 2 + 10 && my >= z.cy - z.h / 2 - 10 && my <= z.cy + z.h / 2 + 10) {
      Treatment.coverage = clamp(Treatment.coverage + d * 0.35, 0, 100);
      if (d > 3) {
        Treatment.stripes.push({ x: lerp(last.x, mx, 0.5), y: lerp(last.y, my, 0.5), angle: Math.atan2(my - last.y, mx - last.x) });
        if (Treatment.stripes.length > 60) Treatment.stripes.shift();
      }
    }
  }
  Treatment.lastDrag = { x: mx, y: my };
}

function treatmentMouseUp() {
  Treatment.dragging = false;
  Treatment.lastDrag = null;
}

function treatmentClick(mx, my) {
  const w = State.w, h = State.h;

  // secure/next-stage buttons (bottom action button)
  const btn = { x: w / 2 - 110, y: h - 80, w: 220, h: 50 };
  const inBtn = mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;

  if (Treatment.kind === 'bandage' && Treatment.stage === 'wrap' && inBtn && Treatment.coverage >= 100) {
    treatmentComplete();
    return;
  }
  if (Treatment.kind === 'cast') {
    if (Treatment.stage === 'padding' && inBtn && Treatment.coverage >= 100) {
      Treatment.stage = 'plaster'; Treatment.coverage = 0; Treatment.stripes = [];
      setSubtitle('', 2, '이제 깁스 붕대를 감아 굳혀주세요.');
      return;
    }
    if (Treatment.stage === 'plaster' && inBtn && Treatment.coverage >= 100) {
      Treatment.stage = 'hardening'; Treatment.hardenT = 0;
      return;
    }
  }
  if (Treatment.kind === 'iv') {
    if (Treatment.stage === 'tape' && inBtn) {
      const disease = Treatment.patient.disease;
      if (disease.ivDrip) { Treatment.stage = 'bag'; setSubtitle('', 2, '수액백을 걸어 연결하세요.'); }
      else treatmentComplete();
      return;
    }
    if (Treatment.stage === 'bag' && inBtn) {
      Treatment.stage = 'drip'; Treatment.dripT = 0;
      return;
    }
  }
  if (Treatment.kind === 'medicine' && Treatment.stage === 'pick') {
    if (Treatment.medSelected >= 0 && inBtn) {
      treatmentComplete();
      return;
    }
  }
}

function treatmentClickMedicineShelf(mx, my) {
  if (Treatment.kind !== 'medicine' || Treatment.stage !== 'pick') return;
  const w = State.w;
  const n = Treatment.medOptions.length;
  const gap = 170;
  const startX = w / 2 - (gap * (n - 1)) / 2;
  Treatment.medOptions.forEach((name, i) => {
    const x = startX + i * gap, y = State.h * 0.55;
    if (mx >= x - 65 && mx <= x + 65 && my >= y - 45 && my <= y + 45) {
      Treatment.medSelected = i;
    }
  });
}

function treatmentComplete() {
  Treatment.done = true;
  Treatment.doneT = 0;
  const key = treatmentSupplyKey();
  if (key && State.supplies[key] > 0) State.supplies[key] -= 1;
  setSubtitle('', 1.4, '치료가 완료되었습니다!');
}

function treatmentFinish() {
  State.patientsDone += 1;
  State.totalTreated += 1;
  State.currentPatient = null;
  State.scene = 'station';
  stationNextPatient();
}

// ---------- draw ----------
function treatmentDraw(ctx) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#2b2e33';
  ctx.fillRect(0, 0, w, h);

  const z = treatmentZone();
  drawGenericPatient(ctx, z.patientX, z.patientY, 3.2, '#8fa8c8');

  // prescription panel
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(w - 300, 20, 280, 120);
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1;
  ctx.strokeRect(w - 300, 20, 280, 120);
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffe28a';
  ctx.fillText('📋 처방전', w - 284, 44);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#eee';
  const d = Treatment.patient.disease;
  ctx.fillText('환자: ' + Treatment.patient.name, w - 284, 66);
  ctx.fillText('진단: ' + d.diagnosis, w - 284, 84);
  wrapText(ctx, treatmentInstructionText(d), w - 284, 102, 250, 15);

  if (!Treatment.done) {
    if (Treatment.kind === 'bandage' || (Treatment.kind === 'cast' && Treatment.stage !== 'hardening')) {
      drawWrapMinigame(ctx, z);
    } else if (Treatment.kind === 'cast' && Treatment.stage === 'hardening') {
      drawHardening(ctx, z);
    } else if (Treatment.kind === 'iv') {
      drawIvMinigame(ctx, z);
    } else if (Treatment.kind === 'medicine') {
      drawMedicineMinigame(ctx);
    }
  } else {
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#8ee68e';
    ctx.textAlign = 'center';
    ctx.fillText('✅ 치료 완료', w / 2, h / 2);
  }
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', ly = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly);
      line = word + ' '; ly += lh;
    } else line = test;
  }
  ctx.fillText(line, x, ly);
}

function drawWrapMinigame(ctx, z) {
  const w = State.w, h = State.h;
  const isPadding = Treatment.kind === 'cast' && Treatment.stage === 'padding';
  const isPlaster = Treatment.kind === 'cast' && Treatment.stage === 'plaster';
  const baseColor = isPadding ? '#f0dcb0' : (isPlaster ? '#e8eaec' : '#f0dcb0');

  // limb target zone
  ctx.fillStyle = '#e0b48c';
  ctx.beginPath();
  roundRectPath(ctx, z.cx - z.w / 2, z.cy - z.h / 2, z.w, z.h, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.stroke(); ctx.setLineDash([]);

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, z.cx - z.w / 2, z.cy - z.h / 2, z.w, z.h, 20);
  ctx.clip();
  const n = Math.floor((Treatment.coverage / 100) * 18);
  for (let i = 0; i < n; i++) {
    const t = i / 18;
    const sx = z.cx - z.w / 2 + t * z.w;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(sx, z.cy - z.h / 2 - 6);
    ctx.lineTo(sx + 14, z.cy + z.h / 2 + 6);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(z.bodyPart, z.cx, z.cy - z.h / 2 - 14);

  // instructions + gauge
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffd23f';
  const label = isPadding ? '패딩 감기' : (isPlaster ? '깁스 붕대 감기' : '붕대 감기');
  ctx.fillText('마우스로 ' + z.bodyPart + ' 위를 드래그해서 ' + label + '을 하세요', w / 2, h * 0.78);

  const gw = 280, gx = w / 2 - gw / 2, gy = h * 0.83;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx, gy, gw, 14);
  ctx.fillStyle = '#8ee68e'; ctx.fillRect(gx, gy, gw * (Treatment.coverage / 100), 14);
  ctx.strokeStyle = '#222'; ctx.strokeRect(gx, gy, gw, 14);

  const ready = Treatment.coverage >= 100;
  const btn = { x: w / 2 - 110, y: h - 80, w: 220, h: 50 };
  ctx.fillStyle = ready ? '#2f8f4f' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = ready ? '#fff' : '#777';
  ctx.font = 'bold 15px sans-serif';
  let btnLabel = '더 감아주세요';
  if (ready) {
    if (Treatment.kind === 'bandage') btnLabel = '🔒 고정하기';
    else if (isPadding) btnLabel = '다음: 깁스 붕대';
    else btnLabel = '🔒 굳히기';
  }
  ctx.fillText(btnLabel, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

function drawHardening(ctx, z) {
  const w = State.w, h = State.h;
  ctx.fillStyle = '#e8eaec';
  ctx.beginPath();
  roundRectPath(ctx, z.cx - z.w / 2, z.cy - z.h / 2, z.w, z.h, 20);
  ctx.fill();
  ctx.strokeStyle = '#aab0b8'; ctx.lineWidth = 2; ctx.stroke();

  const t = clamp(Treatment.hardenT / 2.2, 0, 1);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'center';
  ctx.fillText('깁스가 굳는 중...', w / 2, h * 0.78);
  const gw = 280, gx = w / 2 - gw / 2, gy = h * 0.83;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx, gy, gw, 14);
  ctx.fillStyle = '#cfd6dd'; ctx.fillRect(gx, gy, gw * t, 14);
  ctx.strokeStyle = '#222'; ctx.strokeRect(gx, gy, gw, 14);
}

function drawIvMinigame(ctx, z) {
  const w = State.w, h = State.h;
  const vein = { x: z.cx - 10, y: z.cy };

  ctx.fillStyle = '#e0b48c';
  ctx.beginPath(); roundRectPath(ctx, z.cx - z.w / 2, z.cy - z.h / 2, z.w, z.h, 20); ctx.fill();

  ctx.strokeStyle = 'rgba(90,140,200,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(z.cx - z.w / 2 + 6, vein.y); ctx.lineTo(z.cx + z.w / 2 - 6, vein.y); ctx.stroke();

  if (Treatment.stage === 'site') {
    ctx.fillStyle = 'rgba(255,90,90,0.5)';
    ctx.beginPath(); ctx.arc(vein.x, vein.y, 12 + Math.sin(State.day) * 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('혈관을 클릭하세요', z.cx, z.cy - z.h / 2 - 14);
  } else if (Treatment.stage === 'needle') {
    const t = Treatment.ivTarget;
    ctx.strokeStyle = Treatment.ivMissT > 0 ? '#ff5a5a' : '#ffd23f';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t.x - 6, t.y); ctx.lineTo(t.x + 6, t.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t.x, t.y - 6); ctx.lineTo(t.x, t.y + 6); ctx.stroke();
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(Treatment.ivMissT > 0 ? '빗나갔어요! 다시 조준하세요' : '목표 지점에 바늘을 꽂으세요', z.cx, z.cy - z.h / 2 - 14);
  } else {
    ctx.fillStyle = '#cfd6dd';
    ctx.fillRect(vein.x - 3, vein.y - 22, 6, 22);
    ctx.strokeStyle = '#8a8a92'; ctx.strokeRect(vein.x - 3, vein.y - 22, 6, 22);
  }

  if (Treatment.stage === 'tape') {
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center';
    ctx.fillText('바늘이 고정되었습니다', w / 2, h * 0.78);
    drawActionButton(ctx, '🩹 테이프로 고정');
  } else if (Treatment.stage === 'bag') {
    // IV pole + bag
    const poleX = z.cx + 90, poleTopY = z.cy - 140;
    ctx.strokeStyle = '#888'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(poleX, poleTopY); ctx.lineTo(poleX, z.cy + 30); ctx.stroke();
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center';
    ctx.fillText(Treatment.patient.disease.ivFluid + '을 걸어주세요', w / 2, h * 0.78);
    drawActionButton(ctx, '🧴 수액백 걸기');
  } else if (Treatment.stage === 'drip') {
    const poleX = z.cx + 90, poleTopY = z.cy - 140, bagY = poleTopY + 20;
    ctx.strokeStyle = '#888'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(poleX, poleTopY); ctx.lineTo(poleX, z.cy + 30); ctx.stroke();
    ctx.fillStyle = '#cfe8ff';
    ctx.fillRect(poleX - 16, bagY, 32, 44);
    ctx.strokeStyle = '#5a8cc8'; ctx.strokeRect(poleX - 16, bagY, 32, 44);
    ctx.strokeStyle = 'rgba(150,190,230,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(poleX, bagY + 44); ctx.lineTo(poleX, vein.y); ctx.stroke();
    const dripPhase = (Treatment.dripT * 2) % 1;
    ctx.fillStyle = '#bfe0ff';
    ctx.beginPath(); ctx.arc(poleX, lerp(bagY + 50, vein.y - 4, dripPhase), 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center';
    ctx.fillText('수액이 들어가는 중...', w / 2, h * 0.78);
    const gw = 280, gx = w / 2 - gw / 2, gy = h * 0.83;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx, gy, gw, 14);
    ctx.fillStyle = '#8ee68e'; ctx.fillRect(gx, gy, gw * clamp(Treatment.dripT / 2.6, 0, 1), 14);
    ctx.strokeStyle = '#222'; ctx.strokeRect(gx, gy, gw, 14);
  }
}

function drawActionButton(ctx, label) {
  const w = State.w, h = State.h;
  const btn = { x: w / 2 - 110, y: h - 80, w: 220, h: 50 };
  ctx.fillStyle = '#2f8f4f';
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

function drawMedicineMinigame(ctx) {
  const w = State.w, h = State.h;
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'center';
  ctx.fillText('처방전과 일치하는 약을 선반에서 고르세요', w / 2, h * 0.4);

  const n = Treatment.medOptions.length;
  const gap = 170;
  const startX = w / 2 - (gap * (n - 1)) / 2;
  Treatment.medOptions.forEach((name, i) => {
    const x = startX + i * gap, y = h * 0.55;
    const selected = Treatment.medSelected === i;
    ctx.fillStyle = selected ? 'rgba(255,210,80,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x - 65, y - 45, 130, 90);
    ctx.strokeStyle = selected ? '#ffd23f' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x - 65, y - 45, 130, 90);
    ctx.font = '28px sans-serif';
    ctx.fillText('💊', x, y - 10);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = selected ? '#ffe28a' : '#dcdcdc';
    ctx.fillText(name, x, y + 24);
  });

  const ready = Treatment.medSelected >= 0;
  const btn = { x: w / 2 - 110, y: h - 80, w: 220, h: 50 };
  ctx.fillStyle = ready ? '#2f8f4f' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = ready ? '#fff' : '#777';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(ready ? '💊 환자에게 전달' : '약을 먼저 선택하세요', btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
