import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EMBEDDED_TRACK, EXTERNAL_TRACKS } from '../data/soundtrack.js';

// Bande son du jeu : un morceau est embarqué en base64 dans le build (toujours
// disponible, même en fichier HTML autonome sans rien à côté), les autres
// sont dans public/audio/ et se chargent à la demande quand le dossier est
// présent (serveur ou HTML distribué avec son dossier audio/).
const ALL_TRACKS = [EMBEDDED_TRACK, ...EXTERNAL_TRACKS];

function shuffled(tracks) {
  const arr = [...tracks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Soundtrack() {
  const audioRef = useRef(null);
  const queueRef = useRef(shuffled(ALL_TRACKS));
  const posRef = useRef(0);
  const failStreakRef = useRef(0);
  const [muted, setMuted] = useState(true); // Start muted, user opts in
  const [volume, setVolume] = useState(0.25);
  const [trackName, setTrackName] = useState(queueRef.current[0].name);

  const playAt = useCallback((pos) => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = queueRef.current[pos % queueRef.current.length];
    setTrackName(track.name);
    audio.src = track.src;
    audio.play().catch(() => {});
  }, []);

  const advance = useCallback(() => {
    posRef.current += 1;
    if (posRef.current >= queueRef.current.length) {
      posRef.current = 0;
      queueRef.current = shuffled(ALL_TRACKS);
    }
    playAt(posRef.current);
  }, [playAt]);

  const handleEnded = useCallback(() => {
    failStreakRef.current = 0;
    advance();
  }, [advance]);

  const handleError = useCallback(() => {
    // Piste externe absente (HTML distribué sans dossier audio/) : on passe
    // à la suivante ; la piste embarquée finira toujours par jouer.
    failStreakRef.current += 1;
    if (failStreakRef.current > queueRef.current.length) return;
    advance();
  }, [advance]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.pause();
    } else if (!audio.src) {
      playAt(posRef.current);
    } else {
      audio.play().catch(() => {});
    }
  }, [muted, playAt]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <div style={{
      /* au-dessus de la piste de puissance (36px) et à gauche du panneau droit
         pour ne masquer ni la piste ni l'en-tête du journal */
      position: 'fixed', bottom: 42, right: 'calc(var(--right-w) + 8px)', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(10,9,6,0.8)', borderRadius: 4,
      padding: '4px 8px', border: '1px solid rgba(42,36,24,0.5)',
      maxWidth: 220,
    }}>
      <audio ref={audioRef} onEnded={handleEnded} onError={handleError} />
      <button
        onClick={() => setMuted(m => !m)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: muted ? '#6A5A48' : '#C9A84C',
          padding: '2px 4px',
        }}
        title={muted ? "Activer la musique" : "Couper la musique"}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {!muted && (
        <>
          <button
            onClick={advance}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#C9A84C', padding: '2px 4px',
            }}
            title="Piste suivante"
          >
            ⏭
          </button>
          <input
            type="range" min="0" max="1" step="0.01"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ width: 50, height: 3, accentColor: '#C9A84C', cursor: 'pointer' }}
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span style={{
            fontSize: 11, color: '#8A7A5C', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90,
          }} title={trackName}>{trackName}</span>
        </>
      )}
    </div>
  );
}
