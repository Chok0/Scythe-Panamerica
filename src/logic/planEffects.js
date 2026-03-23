// Tesla/Ford Plan Effects — applies bonuses when player has a factory card
// Each plan has a topBonus (affects top-row actions) and bottomBonus (affects bottom-row actions)

// Apply top-row plan bonus after a top action is taken
// Returns { player, logs } with any modifications
export const applyPlanTop = (player, action, logs = []) => {
  const card = player.factoryCard;
  if (!card) return { player, logs };

  const p = { ...player };

  switch (card.topBonus) {
    case "produce_x2":
      // Model M: already produced — grant +1 resource on each production hex
      // (applied after normal produce, adds bonus resources)
      if (action === "Produce") {
        logs.push(`⚙ ${card.name}: Production doublée !`);
        // Flag for produce handler to double output
        p._planDoubleProduction = true;
      }
      break;

    case "move_3":
      // Trimotor: Move up to 3 hexes (ignore rivers)
      if (action === "Move") {
        p._planMoveBonus = 1; // +1 extra move
        logs.push(`⚙ ${card.name}: +1 déplacement supplémentaire`);
      }
      break;

    case "teleport_res":
      // River Rouge Special: After Move, can teleport resources from any hex to current
      if (action === "Move") {
        p._planTeleportRes = true;
        logs.push(`⚙ ${card.name}: Téléportation de ressources activée`);
      }
      break;

    case "move_mine":
      // Iron Horse: Move action also mines 1 free resource on destination
      if (action === "Move") {
        p._planFreeMine = true;
        logs.push(`⚙ ${card.name}: Mine gratuite au déplacement`);
      }
      break;

    case "pop_worker":
      // Five Dollar Day: Pay 2$ for +2 Pop + 1 worker
      // This is an alternative action — handled in action UI
      break;

    case "remote_move":
      // Golem: Move a mech up to 2 hexes at distance (without hero)
      if (action === "Move") {
        p._planRemoteMove = true;
        logs.push(`⚙ ${card.name}: Déplacement distant activé`);
      }
      break;

    case "aura_power":
      // L'Onde Tesla: +1 power for each mech within 2 hexes of hero
      if (action === "Bolster") {
        const heroHex = p.hero;
        const nearMechs = p.mechs.filter(m => {
          // Simple distance check (would need proper hex distance)
          return Math.abs(m.hexId - heroHex) <= 5;
        }).length;
        if (nearMechs > 0) {
          p.power = Math.min(p.power + nearMechs, 16);
          logs.push(`⚙ ${card.name}: +${nearMechs} Pui (aura)`);
        }
      }
      break;

    case "mech_sprint":
      // Éclair: Mechs can move 4 hexes this turn
      if (action === "Move") {
        p._planMechSprint = true;
        logs.push(`⚙ ${card.name}: Sprint mecha (4 hex)`);
      }
      break;

    case "copy_top":
      // Le Blueprint Perdu: Can copy any other top-row action
      // Handled in action selection UI
      break;

    case "mass_move":
      // Réseau Neuronal: Move ALL mechs 1 hex simultaneously
      if (action === "Move") {
        p._planMassMove = true;
        logs.push(`⚙ ${card.name}: Déplacement de masse activé`);
      }
      break;
  }

  return { player: p, logs };
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
