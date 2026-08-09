import { FACTIONS } from './factions.js';
export const COMBAT_ABILITIES = {
  confederation: {
    name: "Cavaliers", desc: "+2 pui si attaquant (unité a bougé)",
    apply: (p, hexId, isAttacker) => isAttacker ? { powerBonus: 2, cardBonus: 0 } : { powerBonus: 0, cardBonus: 0 },
  },
  frente: {
    name: "Peuple Armé", desc: "+1 carte si ≥1 ouvrier allié sur hex",
    apply: (p, hexId) => {
      const wOnHex = p.workers.filter(w => w.hexId === hexId).length;
      return { powerBonus: 0, cardBonus: wOnHex >= 1 ? 1 : 0 };
    },
  },
  nations: {
    name: "Ronin", desc: "+1 carte si mecha seul (0 ouvrier allié)",
    apply: (p, hexId) => {
      const wOnHex = p.workers.filter(w => w.hexId === hexId).length;
      return { powerBonus: 0, cardBonus: wOnHex === 0 ? 1 : 0 };
    },
  },
  acadiane: {
    name: "White Flag", desc: "Défense: refus → retraite + 2 pop, attaquant gagne tout",
    apply: () => ({ powerBonus: 0, cardBonus: 0 }),
  },
  bayou: {
    // v0.15 — Chimère fusionnée ici : le slot 2 est le « butin du pirate ».
    // Elle était capacité de FACTION, mais ne se déclenchait qu'une fois par
    // partie et sur une victoire contre un mecha — quasi jamais en partie
    // standard (Empire désactivé). La place de faction revient au Sang du
    // Marais, actif dès le tour 1.
    name: "Flibuste", desc: "Victoire → perdant donne 2 pièces · Chimère : si la victime était un mecha, capturez-le (1×/partie, devient votre 5e mecha)",
    apply: () => ({ powerBonus: 0, cardBonus: 0 }),
  },
  // Internationale Noire (slot 2) — la foule fait la force : c'est le seul
  // bonus de combat qui récompense la présence d'OUVRIERS, cohérent avec la
  // dérogation « les ouvriers combattent » (voir combatUnitCount).
  internationale: {
    name: "Sabotage", desc: "+1 carte si ≥2 ouvriers alliés sur l'hex",
    apply: (p, hexId) => ({ powerBonus: 0, cardBonus: p.workers.filter(w => w.hexId === hexId).length >= 2 ? 1 : 0 }),
  },
  // Patrouilles impériales — pas une faction jouable, mais l'Internationale
  // Noire peut leur VOLER cette capacité (le Model M est une machine de série).
  empire: {
    name: "Blindage impérial", desc: "+2 pui en défense (la tôle de Rouge River)",
    apply: (p, hexId, isAttacker) => ({ powerBonus: isAttacker ? 0 : 2, cardBonus: 0 }),
  },
  dominion: {
    name: "Discipline", desc: "+2 pui si plus de CC que l'adversaire",
    apply: (p, hexId, isAttacker, enemyCards) => ({
      powerBonus: (p.combatCards > (enemyCards || 0)) ? 2 : 0,
      cardBonus: 0,
    }),
  },
};

// ── Unités COMBATTANTES sur un hex ────────────────────────────────────────
// Règle générale : seuls le héros et les mechas comptent — chacun autorise
// une carte de combat. Dérogation de l'Internationale Noire (fiche §5) : ses
// ouvriers comptent aussi. Point de vérité UNIQUE : la règle était recopiée
// sur 8 sites entre l'UI et le moteur headless, exactement le genre de
// duplication qui a déjà dérivé en v0.15.
// `extra` : unité entrante pas encore posée sur l'hex (l'attaquant en cours
// de déplacement) — 0 ou 1.
export const combatUnitCount = (player, hexId, extra = 0) => {
  if (!player) return extra;
  let n = extra;
  if (player.hero != null && player.hero === hexId) n++;
  n += (player.mechs || []).filter(m => m.hexId === hexId).length;
  if (FACTIONS[player.faction]?.workersFight)
    n += (player.workers || []).filter(w => w.hexId === hexId).length;
  return n;
};

export const getCombatBonus = (player, hexId, isAttacker, enemyCards) => {
  if (!(player.unlockedAbilities || []).includes(2)) return { powerBonus: 0, cardBonus: 0, name: null };
  // Capacité VOLÉE (Internationale Noire) : le mecha capturé apporte la
  // capacité de combat de sa faction d'origine, pas celle du voleur.
  const ability = COMBAT_ABILITIES[player.stolenCombat || player.faction];
  if (!ability) return { powerBonus: 0, cardBonus: 0, name: null };
  const bonus = ability.apply(player, hexId, isAttacker, enemyCards);
  return { ...bonus, name: ability.name };
};
