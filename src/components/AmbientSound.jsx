import React, { useEffect, useRef, useState, useCallback } from 'react';

// Minimal procedural ambient sound using Web Audio API
// Generates a soft, evolving drone with wind-like qualities
// No external audio files needed

export default function AmbientSound() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const [muted, setMuted] = useState(true); // Start muted, user opts in
  const [volume, setVolume] = useState(0.12);
  const gainRef = useRef(null);

  const startAudio = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    // Layer 1: Deep drone (low frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55; // A1
    const g1 = ctx.createGain();
    g1.gain.value = 0.08;
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start();

    // Layer 2: Mid harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 82.5; // E2 (fifth)
    const g2 = ctx.createGain();
    g2.gain.value = 0.04;
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start();

    // Layer 3: Filtered noise (wind)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 200;
    noiseFilter.Q.value = 1;
    const gNoise = ctx.createGain();
    gNoise.gain.value = 0.06;
    noise.connect(noiseFilter);
    noiseFilter.connect(gNoise);
    gNoise.connect(masterGain);
    noise.start();

    // Slow LFO modulation on noise filter for breathing effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Very slow: 1 cycle per ~12.5 seconds
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);
    lfo.start();

    // Slow pitch drift on drone
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.03;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.5;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(osc1.frequency);
    lfo2.start();

    nodesRef.current = [osc1, osc2, noise, lfo, lfo2];
  }, [volume]);

  const stopAudio = useCallback(() => {
    nodesRef.current.forEach(n => { try { n.stop(); } catch(e) {} });
    nodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    gainRef.current = null;
  }, []);

  useEffect(() => {
    if (!muted) {
      startAudio();
    } else {
      stopAudio();
    }
    return stopAudio;
  }, [muted, startAudio, stopAudio]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.3);
    }
  }, [volume]);

  return (
    <div style={{
      position: 'fixed', bottom: 8, left: 8, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(10,9,6,0.8)', borderRadius: 4,
      padding: '4px 8px', border: '1px solid rgba(42,36,24,0.5)',
    }}>
      <button
        onClick={() => setMuted(m => !m)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: muted ? '#6A5A48' : '#C9A84C',
          padding: '2px 4px',
        }}
        title={muted ? "Activer le son" : "Couper le son"}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {!muted && (
        <input
          type="range" min="0" max="0.3" step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{ width: 50, height: 3, accentColor: '#C9A84C', cursor: 'pointer' }}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}
