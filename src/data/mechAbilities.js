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
  // v0.18 — le Dominion était la seule faction dont le slot 3 ne faisait RIEN
  // (les bots débloquaient 3,3 capacités sur 4 : un mecha payé pour du vide).
  // Bitume : le pétrole est la matière de la Couronne — ses routes goudronnées
  // relient les gisements entre eux. Terrains à pétrole (toundra et désert),
  // lu depuis TERRAINS[t].res : compatible cartes procédurales.
  dominion: { name: "Bitume", desc: "Bond d'un gisement de pétrole à un autre (toundra ↔ désert)", icon: "🛢" },
};

// Une faction qui ne déploie pas (Internationale Noire) n'a PAS de capacités
// en propre : « les 4 slots classiques n'ont plus de sens — ils sont remplacés
// par les capacités volées » (internationale_noire.md §7). Ses slots affichent
// donc ce qu'elle a arraché à ses victimes ; le slot 1 (riverwalk) reste vide,
// La Nage franchissant déjà toutes les rivières.
// `player` (facultatif) porte la provenance des vols : `stolenCombat` et
// `stolenPosition`.
export const getMechAbilities = (factionId, player) => {
  const f = FACTIONS[factionId] || {};
  const steals = !!f.stealMechs;
  const combatFrom = steals ? (player?.stolenCombat || null) : factionId;
  const posFrom = steals ? (player?.stolenPosition || null) : factionId;
  const combat = combatFrom ? COMBAT_ABILITIES[combatFrom] : null;
  const rwTerrains = (f.riverwalk || []).map(t => TERRAINS[t]?.label || t).join(" & ");
  const volé = (from, base) => from && from !== factionId
    ? { ...base, name: `${base.name} (volé)`, desc: `${base.desc} — arraché à ${FACTIONS[from]?.name || "l'Empire"}` }
    : base;
  return [
    { name: "Vitesse", desc: "Déplacement +1 hex", icon: "🏃" },
    steals
      ? { name: "—", desc: "Slot libre : La Nage franchit déjà toutes les rivières", icon: "🌊" }
      : { name: f.rwName || "Riverwalk", desc: `Traverse les rivières vers ${rwTerrains || "certains terrains"}`, icon: "🌊" },
    combat ? volé(combatFrom, { name: combat.name, desc: combat.desc, icon: "⚔" })
      : { name: steals ? "Capacité à voler" : "Combat", desc: steals ? "Battez un mecha adverse pour lui arracher sa capacité de combat" : "Bonus de combat", icon: "⚔" },
    posFrom && POSITION_ABILITIES[posFrom] ? volé(posFrom, POSITION_ABILITIES[posFrom])
      : { name: steals ? "Capacité à voler" : "Position", desc: steals ? "Battez un mecha adverse pour lui arracher sa capacité de position" : "Capacité de positionnement", icon: "📍" },
  ];
};
