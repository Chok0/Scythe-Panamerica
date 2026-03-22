export const MATS = [
  { id: 1, name: "Fordisme", pop: 2, coins: 4, topRow: ["Move", "Bolster", "Produce", "Trade"],
    topCubes: [1, 2, 1, 2], bottomSlots: [1, 1, 2, 2],
    bottomCosts: [{ res: "petrole", base: 3, bonus: 0 }, { res: "metal", base: 3, bonus: 1 }, { res: "bois", base: 2, bonus: 2 }, { res: "nourriture", base: 3, bonus: 2 }] },
  { id: 2, name: "Atelier", pop: 2, coins: 5, topRow: ["Trade", "Produce", "Bolster", "Move"],
    topCubes: [2, 1, 2, 1], bottomSlots: [2, 2, 1, 1],
    bottomCosts: [{ res: "petrole", base: 2, bonus: 1 }, { res: "metal", base: 3, bonus: 1 }, { res: "bois", base: 3, bonus: 2 }, { res: "nourriture", base: 3, bonus: 2 }] },
  { id: 3, name: "Pionnier", pop: 2, coins: 6, topRow: ["Move", "Trade", "Produce", "Bolster"],
    topCubes: [2, 1, 1, 2], bottomSlots: [2, 1, 1, 2],
    bottomCosts: [{ res: "petrole", base: 2, bonus: 1 }, { res: "metal", base: 3, bonus: 2 }, { res: "bois", base: 3, bonus: 1 }, { res: "nourriture", base: 3, bonus: 2 }] },
  { id: 4, name: "Forge", pop: 3, coins: 6, topRow: ["Trade", "Bolster", "Move", "Produce"],
    topCubes: [1, 2, 2, 1], bottomSlots: [1, 2, 2, 1],
    bottomCosts: [{ res: "petrole", base: 3, bonus: 2 }, { res: "metal", base: 2, bonus: 1 }, { res: "bois", base: 2, bonus: 2 }, { res: "nourriture", base: 3, bonus: 1 }] },
  { id: 5, name: "Terroir", pop: 4, coins: 7, topRow: ["Move", "Trade", "Bolster", "Produce"],
    topCubes: [2, 1, 2, 1], bottomSlots: [2, 1, 2, 1],
    bottomCosts: [{ res: "petrole", base: 2, bonus: 1 }, { res: "metal", base: 3, bonus: 1 }, { res: "bois", base: 3, bonus: 2 }, { res: "nourriture", base: 3, bonus: 2 }] },
];

export const BOTTOM = ["Upgrade", "Deploy", "Build", "Enlist"];

export const getBottomCost = (player) => {
  const mat = MATS.find(m => m.id === player.matId);
  if (!mat) return [{ res: "petrole", qty: 2 }, { res: "metal", qty: 3 }, { res: "bois", qty: 3 }, { res: "nourriture", qty: 3 }];
  return mat.bottomCosts.map((bc, i) => ({
    res: bc.res,
    qty: Math.max(0, bc.base - (player.cubesOnBottom || [])[i] || 0),
    bonus: bc.bonus,
    base: bc.base,
  }));
};

export const BUILDING_TYPES = [
  { type: "arsenal", name: "Arsenal", icon: "🏰", effect: "+1 Pui quand Bolster" },
  { type: "memorial", name: "Mémorial", icon: "🪦", effect: "+1 Pop quand Bolster" },
  { type: "gare", name: "Gare", icon: "🚂", effect: "Pose 3 rails (réseau partagé)" },
  { type: "moulin", name: "Moulin", icon: "🌀", effect: "Hex produit +1 (Produce)" },
];

export const ENLIST_ONGOING = [
  { col: 0, icon: "⚡", label: "+1 Puissance", apply: p => { p.power = Math.min(p.power + 1, 16); } },
  { col: 1, icon: "💰", label: "+1 Pièce", apply: p => { p.coins += 1; } },
  { col: 2, icon: "♥", label: "+1 Popularité", apply: p => { p.pop = Math.min(p.pop + 1, 18); } },
  { col: 3, icon: "🃏", label: "+1 Carte Combat", apply: p => { p.combatCards += 1; } },
];

// applyEnlistOngoing needs FACTIONS — takes it as parameter to avoid circular deps
export const applyEnlistOngoing = (playersArr, actorIdx, bottomCol, FACTIONS) => {
  const n = playersArr.map(p => ({ ...p }));
  const logs = [];
  const count = n.length;
  if (count < 2) return { players: n, logs };
  const leftIdx = (actorIdx - 1 + count) % count;
  const rightIdx = (actorIdx + 1) % count;
  [actorIdx, leftIdx, rightIdx].forEach(pi => {
    const p = n[pi];
    if ((p.enlistMap || [])[bottomCol]) {
      const bonus = ENLIST_ONGOING[bottomCol];
      if (bonus) {
        bonus.apply(p);
        const actor = FACTIONS[n[actorIdx].faction]?.name || "?";
        const receiver = FACTIONS[p.faction]?.name || "?";
        if (pi === actorIdx) logs.push(`🤝 ${receiver}: ${bonus.icon}${bonus.label} (propre ${BOTTOM[bottomCol]})`);
        else logs.push(`🤝 ${receiver}: ${bonus.icon}${bonus.label} (voisin ${actor} → ${BOTTOM[bottomCol]})`);
      }
    }
  });
  return { players: n, logs };
};
