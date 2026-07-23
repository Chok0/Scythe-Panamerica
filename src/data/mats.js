// bottomCosts : chaque plateau a un profil de coûts DISTINCT (bases 2-4,
// façon Scythe original) — avant v0.10, Atelier/Pionnier/Terroir partageaient
// les mêmes bases [2,3,3,3] et seuls les bonus $ différaient.
// bottomSlots (v0.11) : règle Scythe « un coût ne descend jamais sous
// 1 ressource » — chaque colonne a au plus (base - 1) cases d'amélioration,
// et le total par plateau reste 6 (l'étoile 6-Améliorations doit rester
// atteignable : chaque amélioration pose un cube en bas).
export const MATS = [
  { id: 1, name: "Fordisme", pop: 2, coins: 4, topRow: ["Move", "Bolster", "Produce", "Trade"],
    topCubes: [1, 2, 1, 2], bottomSlots: [1, 2, 1, 2],
    bottomCosts: [{ res: "petrole", base: 3, bonus: 0 }, { res: "metal", base: 3, bonus: 1 }, { res: "bois", base: 2, bonus: 2 }, { res: "nourriture", base: 3, bonus: 2 }] },
  { id: 2, name: "Atelier", pop: 2, coins: 5, topRow: ["Trade", "Produce", "Bolster", "Move"],
    topCubes: [2, 1, 2, 1], bottomSlots: [1, 2, 2, 1],
    bottomCosts: [{ res: "petrole", base: 2, bonus: 1 }, { res: "metal", base: 4, bonus: 0 }, { res: "bois", base: 3, bonus: 3 }, { res: "nourriture", base: 2, bonus: 1 }] },
  { id: 3, name: "Pionnier", pop: 2, coins: 6, topRow: ["Move", "Trade", "Produce", "Bolster"],
    topCubes: [2, 1, 1, 2], bottomSlots: [2, 1, 1, 2],
    bottomCosts: [{ res: "petrole", base: 3, bonus: 2 }, { res: "metal", base: 2, bonus: 1 }, { res: "bois", base: 4, bonus: 0 }, { res: "nourriture", base: 3, bonus: 3 }] },
  { id: 4, name: "Forge", pop: 3, coins: 6, topRow: ["Trade", "Bolster", "Move", "Produce"],
    topCubes: [1, 2, 2, 1], bottomSlots: [2, 1, 2, 1],
    bottomCosts: [{ res: "petrole", base: 4, bonus: 3 }, { res: "metal", base: 2, bonus: 0 }, { res: "bois", base: 3, bonus: 1 }, { res: "nourriture", base: 3, bonus: 2 }] },
  { id: 5, name: "Terroir", pop: 4, coins: 7, topRow: ["Move", "Trade", "Bolster", "Produce"],
    topCubes: [2, 1, 2, 1], bottomSlots: [1, 2, 2, 1],
    bottomCosts: [{ res: "petrole", base: 2, bonus: 0 }, { res: "metal", base: 3, bonus: 2 }, { res: "bois", base: 4, bonus: 2 }, { res: "nourriture", base: 2, bonus: 1 }] },
];

export const BOTTOM = ["Upgrade", "Deploy", "Build", "Enlist"];

// Libellés FR des actions (source unique pour l'UI ET les logs — avant, les
// noms d'action apparaissaient en anglais dans le journal alors que l'UI les
// traduisait déjà). `frTop`/`frBot` acceptent le nom EN et rendent le FR.
export const FR_TOP = { Move: "Déplacer", Bolster: "Soutien", Trade: "Commerce", Produce: "Produire" };
export const FR_BOT = { Upgrade: "Améliorer", Deploy: "Déployer", Build: "Construire", Enlist: "Enrôler" };
export const frTop = (a) => FR_TOP[a] || a;
export const frBot = (a) => FR_BOT[a] || a;

// ── Améliorations de la rangée HAUT (modèle Scythe original) ──
// Chaque case d'amélioration d'une colonne correspond à une OPTION précise de
// l'action, débloquée quand son cube est retiré via Améliorer :
//   Déplacer : 2 unités (améliorable 3) OU 1 pièce (améliorable 2)
//   Soutien : +2⚡ (améliorable +3) OU +1🃏 (améliorable +2)
//   Commerce : 2 ressources (améliorable 3) OU +1♥ (améliorable +2)
//   Produire : 2 hex (améliorable 3)
// Les cubes se retirent du DERNIER indice vers le premier ; une colonne à n
// cases utilise les n dernières entrées (topSlots) — le premier retrait
// débloque donc la dernière entrée (unité pour Déplacer, ⚡ pour Soutien,
// ♥ pour Commerce).
export const TOP_UPGRADES = {
  Move: [{ res: "coins", label: "+1 pièce (option 💰)" }, { res: "worker", label: "+1 unité déplaçable" }],
  Bolster: [{ res: "combatCards", label: "+1 Carte (option 🃏)" }, { res: "power", label: "+1 Puissance (option ⚡)" }],
  Trade: [{ res: "metal", label: "+1 ressource (option 📦)" }, { res: "pop", label: "+1 Popularité (option ♥)" }],
  Produce: [{ res: "nourriture", label: "+1 hex produit" }],
};

// Les n cases d'amélioration de la colonne (n = topCubes de ce plateau)
export const topSlots = (action, n) => (TOP_UPGRADES[action] || []).slice(-n);

// Bonus débloqués (res) sur la colonne `col` du joueur : les cases d'indice
// >= cubes restants (les cubes occupent les premiers indices)
export const topUnlocked = (p, col) => {
  const mat = MATS.find(m => m.id === p.matId);
  const n = (mat?.topCubes || [])[col] || 0;
  const cubes = (p.cubesOnTop || [])[col] ?? n;
  return topSlots((p.topRow || [])[col], n).slice(cubes).map(s => s.res);
};

// Nombre de bonus `res` débloqués pour une action top donnée du joueur
export const topUpgradeCount = (p, action, res) => {
  const col = (p.topRow || []).indexOf(action);
  if (col < 0) return 0;
  return topUnlocked(p, col).filter(r => r === res).length;
};

// Cases d'amélioration UTILISABLES d'une colonne bottom : jamais plus que
// (base - 1) — le coût imprimé ne peut pas être annulé entièrement.
export const maxBottomCubes = (mat, i) =>
  Math.min((mat?.bottomSlots || [])[i] || 0, Math.max(0, ((mat?.bottomCosts || [])[i]?.base ?? 0) - 1));

// Bonus IMMÉDIAT (une fois) d'un enrôlement, indexé par colonne d'action bottom
// (différent du bonus PERMANENT choisi séparément). Partagé entre l'UI joueur
// (App.jsx) et la résolution des bots (botEncounters.js) pour éviter la divergence.
export const ENLIST_IMMEDIATE = [
  { col: 0, icon: "💰", label: "+2 Pièces", apply: p => { p.coins += 2; } },
  { col: 1, icon: "♥", label: "+2 Popularité", apply: p => { p.pop = Math.min(p.pop + 2, 18); } },
  { col: 2, icon: "🃏", label: "+2 Cartes", apply: p => { p.combatCards += 2; } },
  { col: 3, icon: "⚡", label: "+2 Puissance", apply: p => { p.power = Math.min(p.power + 2, 16); } },
];

export const getBottomCost = (player) => {
  const mat = MATS.find(m => m.id === player.matId);
  if (!mat) return [{ res: "petrole", qty: 2 }, { res: "metal", qty: 3 }, { res: "bois", qty: 3 }, { res: "nourriture", qty: 3 }];
  return mat.bottomCosts.map((bc, i) => ({
    res: bc.res,
    // Règle Scythe : les cubes réduisent le coût mais il reste TOUJOURS au
    // moins 1 ressource à payer (les réductions de plan d'usine, elles,
    // s'appliquent après et peuvent descendre plus bas).
    qty: Math.max(bc.base > 0 ? 1 : 0, bc.base - ((player.cubesOnBottom || [])[i] || 0)),
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

// Les 4 recrues PERMANENTES (bonus ongoing). Décorrélées de la colonne : le
// joueur choisit LAQUELLE poser sur quelle action bottom (chacune 1×/partie).
// `col` n'est plus qu'un indice de recrue par défaut (ordre d'affichage).
export const ENLIST_ONGOING = [
  { col: 0, icon: "⚡", label: "+1 Puissance", svgKey: "power", apply: p => { p.power = Math.min(p.power + 1, 16); } },
  { col: 1, icon: "💰", label: "+1 Pièce", svgKey: "coins", apply: p => { p.coins += 1; } },
  { col: 2, icon: "♥", label: "+1 Popularité", svgKey: "pop", apply: p => { p.pop = Math.min(p.pop + 1, 18); } },
  { col: 3, icon: "🃏", label: "+1 Carte Combat", svgKey: "combatCards", apply: p => { p.combatCards += 1; } },
];

// applyEnlistOngoing needs FACTIONS — takes it as parameter to avoid circular deps
export const applyEnlistOngoing = (playersArr, actorIdx, bottomCol, FACTIONS) => {
  const n = playersArr.map(p => ({ ...p }));
  const logs = [];
  const count = n.length;
  if (count < 2) return { players: n, logs };
  const leftIdx = (actorIdx - 1 + count) % count;
  const rightIdx = (actorIdx + 1) % count;
  const recipients = new Set([actorIdx, leftIdx, rightIdx]);
  // Plan « Le Blueprint Perdu » : l'ongoing du détenteur est déclenché par TOUS les joueurs
  n.forEach((p, pi) => { if (p.factoryCard?.bottomBonus === "enlist_extended") recipients.add(pi); });
  [...recipients].forEach(pi => {
    const p = n[pi];
    // recrue posée sur cette colonne (indice 0-3), décorrélée de la colonne
    const recruitIdx = (p.enlistMap || [])[bottomCol];
    if (recruitIdx != null) {
      const bonus = ENLIST_ONGOING[recruitIdx];
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
