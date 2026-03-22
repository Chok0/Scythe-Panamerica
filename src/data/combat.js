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
    name: "Flibuste", desc: "Victoire → perdant donne 2 pièces",
    apply: () => ({ powerBonus: 0, cardBonus: 0 }),
  },
  dominion: {
    name: "Discipline", desc: "+2 pui si plus de CC que l'adversaire",
    apply: (p, hexId, isAttacker, enemyCards) => ({
      powerBonus: (p.combatCards > (enemyCards || 0)) ? 2 : 0,
      cardBonus: 0,
    }),
  },
};

export const getCombatBonus = (player, hexId, isAttacker, enemyCards) => {
  if (!(player.unlockedAbilities || []).includes(2)) return { powerBonus: 0, cardBonus: 0, name: null };
  const ability = COMBAT_ABILITIES[player.faction];
  if (!ability) return { powerBonus: 0, cardBonus: 0, name: null };
  const bonus = ability.apply(player, hexId, isAttacker, enemyCards);
  return { ...bonus, name: ability.name };
};
