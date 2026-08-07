// ==============================
// 전역 상태 & 유틸리티
// ==============================
'use strict';

const State = {
  mode: 'title', // title | home | store | city | arrest | jail
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  camera: { x: 0, y: 0 },
  mouse: { x: 0, y: 0, wx: 0, wy: 0, down: false },
  keys: {},
  time: 0,
  player: null,
  npcs: [],
  police: [],
  cars: [],
  bullets: [],
  particles: [],
  decals: [],
  wanted: 0,
  wantedSightTimer: 0,
  storeId: null,
  homeTaken: { knife: false, gun: false },
  subtitle: { text: '', timer: 0, sub: '' },
  prompt: '',
  arrest: null,
  jail: null,
  day: 1,
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function angleLerp(a, b, t) {
  let diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
}
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// AABB resolve: push circle (x,y,radius) out of rect
function resolveCircleRect(x, y, radius, r) {
  const closestX = clamp(x, r.x, r.x + r.w);
  const closestY = clamp(y, r.y, r.y + r.h);
  const dx = x - closestX;
  const dy = y - closestY;
  const d = Math.hypot(dx, dy);
  if (d < radius && d > 0.0001) {
    const push = radius - d;
    return { x: x + (dx / d) * push, y: y + (dy / d) * push, hit: true };
  }
  if (d <= 0.0001) {
    // center inside rect - push out along smallest axis
    const left = x - r.x, right = r.x + r.w - x;
    const top = y - r.y, bottom = r.y + r.h - y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: r.x - radius, y, hit: true };
    if (m === right) return { x: r.x + r.w + radius, y, hit: true };
    if (m === top) return { x, y: r.y - radius, hit: true };
    return { x, y: r.y + r.h + radius, hit: true };
  }
  return { x, y, hit: false };
}

function setSubtitle(text, dur, sub) {
  State.subtitle.text = text;
  State.subtitle.timer = dur;
  State.subtitle.sub = sub || '';
}

function fmtClock(minutes) {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
