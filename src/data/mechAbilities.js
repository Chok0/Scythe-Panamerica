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
  nations: { name: "Pack Up", desc: "Déplace un bâtiment d'un hex pendant l'action Move (1×/tour) — vers un hex libre ou à vous, sans bâtiment", icon: "📦" },
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
// Résilience franchissant déjà toutes les rivières.
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
      ? { name: "—", desc: "Slot libre : Résilience franchit déjà toutes les rivières", icon: "🌊" }
      : { name: f.rwName || "Riverwalk", desc: `Traverse les rivières vers ${rwTerrains || "certains terrains"}`, icon: "🌊" },
    combat ? volé(combatFrom, { name: combat.name, desc: combat.desc, icon: "⚔" })
      : { name: steals ? "Capacité à voler" : "Combat", desc: steals ? "Battez un mecha adverse pour lui arracher sa capacité de combat" : "Bonus de combat", icon: "⚔" },
    posFrom && POSITION_ABILITIES[posFrom] ? volé(posFrom, POSITION_ABILITIES[posFrom])
      : { name: steals ? "Capacité à voler" : "Position", desc: steals ? "Battez un mecha adverse pour lui arracher sa capacité de position" : "Capacité de positionnement", icon: "📍" },
  ];
};

/** Faction dont un joueur tient la capacité de POSITION (slot 3) : la sienne,
 *  ou celle arrachée au mecha capturé. Même convention que `pf` dans
 *  movement.js — Pack Up (App.jsx) lisait encore `player.faction`, ce qui
 *  rendait le slot volé aux Nations parfaitement inerte. */
export const positionFactionOf = (player) => player?.stolenPosition || player?.faction;

// ── Ce qu'un mecha vaincu a ENCORE à donner (Internationale Noire) ─────────
// Constaté en partie le 19/08 : au 2e vol, la modale proposait Vitesse (déjà
// arrachée au 1er) en la signalant « déjà prise » — mais laissait cliquer.
// Résultat : un mecha relevé SANS capacité, payé plein tarif. Le choix doit
// être GRISÉ quand il ne donne rien de neuf ; s'il ne reste rien du tout, le
// mecha se relève nu, mais explicitement (arbitrage du joueur, 19/08).
//   - slot 0 (Vitesse) : commune à tout le roster — une fois débloquée, elle
//     n'est plus à prendre nulle part.
//   - slot 1 (riverwalk) : jamais proposé (Résilience franchit déjà les rivières).
//   - slots 2 et 3 : ceux de la VICTIME. Les reprendre à une faction déjà
//     pillée ne referait pas le patchwork — c'est la même capacité.
//   - une patrouille impériale (Model M de série) n'a pas de slot Position ;
//     la règle vaut pour toute faction sans capacité de position au slot 3
//     (le Dominion en a une depuis Bitume : il n'est plus une exception).
/** @returns {{slot:number, ability:object, owned:boolean}[]} */
export const stealableSlots = (fromFaction, player) => {
  const abil = getMechAbilities(fromFaction);
  return (fromFaction === "empire" ? [0, 2] : [0, 2, 3])
    .filter(i => i !== 3 || !!POSITION_ABILITIES[fromFaction])
    .map(i => ({
      slot: i,
      ability: abil[i],
      owned: i === 0 ? (player?.unlockedAbilities || []).includes(0)
        : i === 2 ? player?.stolenCombat === fromFaction
          : player?.stolenPosition === fromFaction,
    }));
};
