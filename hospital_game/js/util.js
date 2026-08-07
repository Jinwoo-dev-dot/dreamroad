// ==============================
// 전역 상태 & 유틸리티
// ==============================
'use strict';

const State = {
  scene: 'title', // title | wardrobe | commute | supply | station | treatment | daySummary
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  mouse: { x: 0, y: 0, down: false },
  day: 1,
  patientsToday: 0,
  patientsDone: 0,
  correctTriage: 0,
  totalTreated: 0,
  outfit: {
    top: 0,
    bottom: 0,
    stockings: 0,
    shoes: 0,
    hair: 0,
    accessory: 0,
  },
  supplies: {
    bandage: 0,
    syringe: 0,
    cast: 0,
    medicine: 0,
    iv: 0,
  },
  currentPatient: null,
  subtitle: { text: '', timer: 0, sub: '' },
  prompt: '',
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function setSubtitle(text, dur, sub) {
  State.subtitle.text = text;
  State.subtitle.timer = dur;
  State.subtitle.sub = sub || '';
}
