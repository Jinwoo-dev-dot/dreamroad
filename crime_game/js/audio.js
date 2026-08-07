// ==============================
// 절차적 효과음 (Web Audio API, 외부 파일 없음)
// ==============================
'use strict';

const AudioSys = { ctx: null, noiseBuffer: null, siren: null };

function initAudio() {
  if (AudioSys.ctx) { if (AudioSys.ctx.state === 'suspended') AudioSys.ctx.resume(); return; }
  try {
    AudioSys.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const b = AudioSys.ctx.createBuffer(1, Math.floor(AudioSys.ctx.sampleRate * 0.5), AudioSys.ctx.sampleRate);
    const data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    AudioSys.noiseBuffer = b;
  } catch (e) { AudioSys.ctx = null; }
}

function playTone(freq, dur, type, gain, delay) {
  if (!AudioSys.ctx) return;
  const ctx = AudioSys.ctx;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain || 0.2, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function playNoise(dur, gain, filterFreq) {
  if (!AudioSys.ctx || !AudioSys.noiseBuffer) return;
  const ctx = AudioSys.ctx;
  const src = ctx.createBufferSource();
  src.buffer = AudioSys.noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain || 0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter); filter.connect(g); g.connect(ctx.destination);
  src.start(); src.stop(ctx.currentTime + dur + 0.02);
}

function sfxGunshot() { playNoise(0.15, 0.5, 1800); playTone(90, 0.12, 'square', 0.3); }
function sfxKnife() { playNoise(0.08, 0.22, 3000); }
function sfxCuff() { playTone(2000, 0.05, 'square', 0.15); playTone(1500, 0.05, 'square', 0.15, 0.08); }
function sfxAlarm() { playTone(1200, 0.15, 'sawtooth', 0.2); playTone(900, 0.15, 'sawtooth', 0.2, 0.18); }
function sfxBuzzer() { playTone(300, 0.4, 'square', 0.18); playTone(300, 0.4, 'square', 0.18, 0.5); }
function sfxGavel() { playNoise(0.06, 0.5, 400); playTone(120, 0.08, 'square', 0.3); }
function sfxRelease() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.25, 'triangle', 0.2, i * 0.12)); }
function sfxToll() { playTone(110, 1.2, 'sine', 0.3); playTone(110, 1.2, 'sine', 0.2, 1.3); }
function sfxDryFire() { playTone(200, 0.04, 'square', 0.12); }
function sfxEscape() { [400, 500, 650, 800].forEach((f, i) => playTone(f, 0.18, 'sawtooth', 0.15, i * 0.08)); }
function sfxCaughtEscaping() { playTone(180, 0.3, 'sawtooth', 0.25); playTone(140, 0.35, 'sawtooth', 0.22, 0.15); }
function sfxCoin() { playTone(1400, 0.08, 'square', 0.15); playTone(1800, 0.08, 'square', 0.12, 0.06); }

function sirenStart() {
  if (!AudioSys.ctx || AudioSys.siren) return;
  const ctx = AudioSys.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  g.gain.value = 0.07;
  osc.frequency.value = 660;
  osc.connect(g); g.connect(ctx.destination);
  osc.start();
  let hi = true;
  const iv = setInterval(() => {
    if (!AudioSys.ctx) return;
    osc.frequency.setTargetAtTime(hi ? 880 : 660, AudioSys.ctx.currentTime, 0.05);
    hi = !hi;
  }, 380);
  AudioSys.siren = { osc, g, iv };
}

function sirenStop() {
  if (!AudioSys.siren) return;
  clearInterval(AudioSys.siren.iv);
  const s = AudioSys.siren;
  try { s.g.gain.setTargetAtTime(0, AudioSys.ctx.currentTime, 0.1); } catch (e) { /* ignore */ }
  setTimeout(() => { try { s.osc.stop(); } catch (e) { /* ignore */ } }, 300);
  AudioSys.siren = null;
}
