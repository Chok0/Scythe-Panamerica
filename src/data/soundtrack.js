import ironMarch from '../assets/audio/iron-march.mp3';

// Toujours disponible : embarqué en base64 dans le build (fonctionne même en
// fichier HTML autonome, sans dossier audio/ à côté).
export const EMBEDDED_TRACK = { name: 'Iron March', src: ironMarch };

// Chargés depuis public/audio/ à la demande : présents quand le jeu tourne
// depuis un serveur/dossier complet, absents si seul le HTML est distribué.
export const EXTERNAL_TRACKS = [
  { name: 'Acadian Battlefield', src: 'audio/acadian-battlefield.mp3' },
  { name: 'Dust and Neon', src: 'audio/dust-and-neon.mp3' },
  { name: 'Frost on the Birch', src: 'audio/frost-on-the-birch.mp3' },
  { name: 'Iron Horizon', src: 'audio/iron-horizon.mp3' },
  { name: 'Midnight on the River', src: 'audio/midnight-on-the-river.mp3' },
  { name: 'Mist Over the Dead Reeds', src: 'audio/mist-over-the-dead-reeds.mp3' },
  { name: 'Rust and Rain', src: 'audio/rust-and-rain.mp3' },
  { name: 'Rust in the Dust', src: 'audio/rust-in-the-dust.mp3' },
  { name: 'Wind Through the Pines', src: 'audio/wind-through-the-pines.mp3' },
];
