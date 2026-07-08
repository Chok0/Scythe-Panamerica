// Bonus de construction (« structure bonus » de Scythe) : une tuile tirée au
// hasard en début de partie donne des pièces en fin de partie pour chaque
// bâtiment construit sur / à côté d'un type d'hex précis.
// Les check() lisent les bindings vivants de hexes.js → compatibles avec les
// cartes procédurales rechargées par loadMap().
import { ADJ, hMap, CURRENT_MAP, hasR } from './hexes.js';

export const STRUCTURE_BONUSES = [
  { id: "lac", icon: "🌊", name: "Bord des Lacs", coins: 3,
    desc: "par bâtiment adjacent à un lac",
    check: (hid) => (ADJ[hid] || []).some(a => hMap[a]?.t === "lac") },
  { id: "rencontre", icon: "✦", name: "Lieux de Rencontre", coins: 3,
    desc: "par bâtiment sur un lieu de rencontre initial",
    check: (hid) => CURRENT_MAP.encounterHexes.includes(hid) },
  { id: "village", icon: "🏘", name: "Cœur des Villages", coins: 2,
    desc: "par bâtiment sur un village",
    check: (hid) => hMap[hid]?.t === "village" },
  { id: "riviere", icon: "〰", name: "Rives des Rivières", coins: 2,
    desc: "par bâtiment au bord d'une rivière",
    check: (hid) => (ADJ[hid] || []).some(a => hasR(hid, a)) },
  { id: "usine", icon: "⚙", name: "Ombre de l'Usine", coins: 4,
    desc: "par bâtiment adjacent à Rouge River",
    check: (hid) => (ADJ[hid] || []).some(a => hMap[a]?.t === "factory") },
];

export const pickStructureBonus = () =>
  STRUCTURE_BONUSES[Math.floor(Math.random() * STRUCTURE_BONUSES.length)];

/** Détail du bonus pour un joueur : nombre de bâtiments qualifiés + pièces. */
export const structureBonusDetail = (player, bonus) => {
  if (!bonus) return { count: 0, coins: 0 };
  const count = (player.buildings || []).filter(b => bonus.check(b.hexId)).length;
  return { count, coins: count * bonus.coins };
};
