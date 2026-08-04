import { FACTIONS } from './factions.js';
import { COMBAT_ABILITIES } from './combat.js';
import { TERRAINS } from './terrains.js';

// ── Capacités de mecha PAR FACTION — 4 slots, 1 débloqué par déploiement ──
// Slot 0 (Vitesse) est commun ; slot 1 (Riverwalk) porte le nom et les
// terrains propres à la faction ; slots 2 (Combat) et 3 (Position) sont
// entièrement uniques. Les mécaniques vivent dans movement.js / combat.js /
// App.jsx — ce fichier est la source des NOMS et DESCRIPTIONS affichés.

// Slot 3 « Position » — comportements implémentés dans movement.js
// (bonds terrain), sauf Pack Up (App.jsx, action Move).
const POSITION_ABILITIES = {
  confederation: { name: "Convoi", desc: "Bond entre villages contrôlés et la Rouge River", icon: "🏘" },
  frente: { name: "Guérilla", desc: "Bond de sierra en sierra", icon: "🏔" },
  nations: { name: "Pack Up", desc: "Déplace un bâtiment pendant l'action Move (1×/tour)", icon: "📦" },
  acadiane: { name: "Batelier", desc: "Entre sur les lacs et bondit de lac en lac", icon: "〰" },
  bayou: { name: "Pirogue", desc: "Bond de marécage en marécage", icon: "≋" },
  // Pas encore de capacité de position spécifique au Dominion (aucun effet codé)
  dominion: { name: "Position", desc: "Aucun effet spécifique pour l'instant", icon: "📍" },
  internationale: { name: "Tunnels", desc: "Bond d'un point d'ancrage du réseau à un autre (#3, #20, #25, #40)", icon: "🕳" },
};

// Le slot 1 de l'Internationale Noire est LIBRE : La Nage (capacité de
// faction) franchit déjà toutes les rivières. Il porte donc les Passeurs —
// la seule capacité du jeu qui accélère les ouvriers, réponse directe au
// frein structurel de la faction (le regroupement lent et visible).
const SLOT1_OVERRIDE = {
  internationale: { name: "Passeurs", desc: "Vos OUVRIERS se déplacent de 2 hex", icon: "🚶" },
};

export const getMechAbilities = (factionId) => {
  const f = FACTIONS[factionId] || {};
  const combat = COMBAT_ABILITIES[factionId];
  const rwTerrains = (f.riverwalk || []).map(t => TERRAINS[t]?.label || t).join(" & ");
  return [
    { name: "Vitesse", desc: "Déplacement +1 hex", icon: "🏃" },
    SLOT1_OVERRIDE[factionId] ||
      { name: f.rwName || "Riverwalk", desc: `Traverse les rivières vers ${rwTerrains || "certains terrains"}`, icon: "🌊" },
    combat ? { name: combat.name, desc: combat.desc, icon: "⚔" } : { name: "Combat", desc: "Bonus de combat", icon: "⚔" },
    POSITION_ABILITIES[factionId] || { name: "Position", desc: "Capacité de positionnement", icon: "📍" },
  ];
};
