/*
 * Soft synthesized sound effects for the cake assembly (Web Audio, no audio files).
 * Off by default; the AudioContext is only created when the visitor turns sound on.
 */
let ctx;
let master;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from the click that turns sound on, so browsers allow playback. */
export const primeAudio = () => { audio(); };

function tone(c, { f, type = 'sine', dur = 0.5, gain = 0.1, delay = 0, to }) {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(c, { dur = 0.5, gain = 0.05, f = 600, q = 0.8, delay = 0 }) {
  const t = c.currentTime + delay;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

const SOUNDS = {
  impact: (c, d = {}) => {
    const s = d.strength ?? 1;
    tone(c, { f: 120, to: 48, dur: 0.45, gain: 0.26 * s });
    noise(c, { dur: 0.18, gain: 0.05 * s, f: 320 });
  },
  spread: c => noise(c, { dur: 0.8, gain: 0.03, f: 1400, q: 0.6 }),
  pour: c => { noise(c, { dur: 2.2, gain: 0.045, f: 260, q: 1.2 }); tone(c, { f: 90, dur: 1.8, gain: 0.025 }); },
  pop: c => [0, 1, 2, 3, 4].forEach(i => tone(c, { f: 520 + i * 90, type: 'triangle', dur: 0.14, gain: 0.03, delay: i * 0.07 })),
  chime: c => [784, 988, 1175].forEach((f, i) => tone(c, { f, dur: 1.1, gain: 0.04, delay: i * 0.14 })),
  reveal: c => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(c, { f, dur: 1.8, gain: 0.035, delay: i * 0.12 })),
  celebrate: c => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(c, { f, type: 'triangle', dur: 0.6, gain: 0.03, delay: i * 0.06 })),
};

export function playSound(name, data) {
  const c = audio();
  if (c) SOUNDS[name]?.(c, data);
}
