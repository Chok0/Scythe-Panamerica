// Effets sonores synthétisés (WebAudio) — zéro asset, fonctionne tel quel
// dans le build HTML autonome. Le bouton 🔇 de la musique coupe aussi les
// effets (préférence partagée 'pa-music-muted').
let ctx = null;
const ac = () => {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};
const muted = () => { try { return localStorage.getItem('pa-music-muted') === '1'; } catch { return false; } };

const tone = (c, { freq = 440, type = 'sine', dur = 0.15, vol = 0.07, delay = 0, slide = 0 }) => {
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
};
const noise = (c, { dur = 0.2, vol = 0.05, delay = 0, freq = 800 }) => {
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(t0);
};

const SOUNDS = {
  star: (c) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, dur: 0.22, vol: 0.06, delay: i * 0.09 })); },
  combat: (c) => { noise(c, { dur: 0.3, vol: 0.09, freq: 500 }); tone(c, { freq: 110, type: 'square', dur: 0.25, vol: 0.05, slide: -60 }); },
  encounter: (c) => { tone(c, { freq: 587, dur: 0.3, vol: 0.05 }); tone(c, { freq: 880, dur: 0.4, vol: 0.04, delay: 0.14 }); },
  build: (c) => { tone(c, { freq: 90, type: 'triangle', dur: 0.2, vol: 0.09, slide: -30 }); noise(c, { dur: 0.12, vol: 0.04, freq: 300, delay: 0.02 }); },
  deploy: (c) => { tone(c, { freq: 160, type: 'square', dur: 0.12, vol: 0.05 }); tone(c, { freq: 220, type: 'square', dur: 0.14, vol: 0.05, delay: 0.1 }); },
  ability: (c) => { tone(c, { freq: 440, dur: 0.16, vol: 0.045, slide: 220 }); },
};

// Anti-rafale : 1 effet max par fenêtre de 180 ms (les tours de bots logguent
// plusieurs lignes d'un coup)
let last = 0;
export const playSfx = (kind) => {
  const fn = SOUNDS[kind]; if (!fn || muted()) return;
  const now = Date.now(); if (now - last < 180) return; last = now;
  const c = ac(); if (!c) return;
  try { fn(c); } catch { /* audio indisponible */ }
};

// Mappe une ligne de journal sur un effet — préfixes émoji des événements clés
// seulement (les lignes 🤖 des bots restent muettes, sauf leurs étoiles ⭐)
export const sfxForLog = (msg) => {
  if (/^⭐|^🏆|^🏛⭐|^⭐⚔/.test(msg)) return 'star';
  if (/^⚔|^🛡/.test(msg)) return 'combat';
  if (/^📜 Rencontre/.test(msg)) return 'encounter';
  if (/^🏗/.test(msg)) return 'build';
  if (/^⬡/.test(msg)) return 'deploy';
  if (/^🔓/.test(msg)) return 'ability';
  return null;
};
