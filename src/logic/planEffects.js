// Tesla/Ford Plan Effects — bonuses granted by the Rouge River factory card.
// Each plan has a topBonus (top-row actions) and bottomBonus (bottom-row actions).
// Top bonuses are wired directly at each action site:
//   produce_x2 → doProduce, move_3/remote_move/mech_sprint → getValidMoves,
//   move_mine → handleHexClick (après déplacement), aura_power → doBolster,
//   pop_worker & teleport_res → actions libres (flag planTopUsed, 1×/tour),
//   copy_top → lève la restriction « pas 2× la même colonne », mass_move → moveLimit 3.

// L'Onde Tesla (aura_power): nombre de mechas à ≤2 anneaux du héros.
// Distance en pixels sur la grille fixe : 1 anneau ≈ 137px → seuil 290px.
export const auraPowerCount = (player, hMap) => {
  if (player.factoryCard?.topBonus !== "aura_power") return 0;
  const hero = hMap[player.hero];
  if (!hero) return 0;
  return player.mechs.filter(m => {
    const h = hMap[m.hexId];
    return h && Math.hypot(h.rx - hero.rx, h.ry - hero.ry) <= 290;
  }).length;
};

// Apply bottom-row plan bonus when a bottom action is performed
// Returns { costReduction, bonusCoins, bonusPower, logs }
export const getPlanBottomBonus = (player, bottomAction) => {
  const card = player.factoryCard;
  if (!card) return { costReduction: 0, bonusCoins: 0, bonusPower: 0, logs: [] };

  const logs = [];
  let costReduction = 0, bonusCoins = 0, bonusPower = 0;

  switch (card.bottomBonus) {
    case "deploy_discount":
      // Model M: Deploy costs 2 less metal
      if (bottomAction === "Deploy") { costReduction = 2; logs.push(`⚙ ${card.name}: -2 métal sur Deploy`); }
      break;

    case "upgrade_discount":
      // Trimotor: Upgrade costs 1 less + gain 1$
      if (bottomAction === "Upgrade") { costReduction = 1; bonusCoins = 1; logs.push(`⚙ ${card.name}: -1 coût Upgrade +1$`); }
      break;

    case "build_discount":
      // River Rouge Special: Build costs 2 less + gain 2$
      if (bottomAction === "Build") { costReduction = 2; bonusCoins = 2; logs.push(`⚙ ${card.name}: -2 bois Build +2$`); }
      break;

    case "enlist_discount":
      // Iron Horse: Enlist costs 2 less + gain 2$
      if (bottomAction === "Enlist") { costReduction = 2; bonusCoins = 2; logs.push(`⚙ ${card.name}: -2 nourriture Enlist +2$`); }
      break;

    case "upgrade_profit":
      // Five Dollar Day: Upgrade grants 3$ bonus
      if (bottomAction === "Upgrade") { bonusCoins = 3; logs.push(`⚙ ${card.name}: +3$ bonus Upgrade`); }
      break;

    case "deploy_power":
      // Golem: Deploy grants +2 power
      if (bottomAction === "Deploy") { bonusPower = 2; logs.push(`⚙ ${card.name}: +2 Pui au Deploy`); }
      break;

    case "build_no_worker":
      // L'Onde Tesla: Can build without worker on hex
      if (bottomAction === "Build") { logs.push(`⚙ ${card.name}: Build sans ouvrier`); }
      break;

    case "free_bolster":
      // Éclair: Free bolster after bottom action
      // Applied after any bottom action
      logs.push(`⚙ ${card.name}: Bolster gratuit !`);
      bonusPower = 2;
      break;

    case "enlist_extended":
      // Le Blueprint Perdu: Enlist ongoing bonus applies to ALL players (not just neighbors)
      if (bottomAction === "Enlist") { logs.push(`⚙ ${card.name}: Enrôlement étendu`); }
      break;

    case "deploy_adjacency":
      // Réseau Neuronal: Deploy can be placed on adjacent hex (not just worker hex)
      if (bottomAction === "Deploy") { logs.push(`⚙ ${card.name}: Deploy adjacent autorisé`); }
      break;
  }

  return { costReduction, bonusCoins, bonusPower, logs };
};
