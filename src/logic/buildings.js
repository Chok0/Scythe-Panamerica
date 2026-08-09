// ── Structures : où peut-on en poser une ? ────────────────────────────────
// Règle du jeu original (« Construire ») : un territoire ne porte JAMAIS deux
// structures — la sienne comme celle d'un adversaire. Pack Up (Nations,
// slot 3) ne construit pas, il DÉPLACE une structure déjà posée : la même
// interdiction vaut à l'arrivée.
//
// Bug constaté en partie (09/08) : Pack Up acceptait n'importe quel hex
// adjacent hors lac/marécage. On pouvait donc déménager un bâtiment SUR
// l'ennemi — un hex tenu par ses unités (le bâtiment y naissait contesté sans
// avoir eu à gagner le moindre combat), voire un hex portant déjà la structure
// d'un adversaire. Une destination n'est désormais légale que si elle est
// LIBRE ou tenue par le déménageur : aucune unité étrangère (joueurs ET
// patrouilles impériales), et aucune structure, à qui qu'elle soit.
//
// Point de vérité unique : App.jsx (joueur) et bot.js (IA) lisent d'ici — les
// deux implémentations avaient divergé, celle du bot ignorant jusqu'aux bases.
import { ADJ, hMap } from '../data/hexes.js';

/** Hex portant une structure, tous joueurs confondus. */
export const buildingHexes = (players) => {
  const s = new Set();
  (players || []).forEach(p => (p?.buildings || []).forEach(b => s.add(b.hexId)));
  return s;
};

/** Hex occupés par une unité qui n'appartient pas à `p` : adversaires (héros,
 *  mechs, ouvriers) et patrouilles impériales (`empire` = {id: hexId}).
 *  L'identité du joueur courant se reconnaît à la référence OU à la faction —
 *  le bot travaille sur une COPIE de son joueur, jamais sur l'original. */
export const foreignUnitHexes = (p, players, empire) => {
  const s = new Set();
  (players || []).forEach(op => {
    if (!op || op === p || (p && op.faction === p.faction)) return;
    if (op.hero != null) s.add(op.hero);
    (op.mechs || []).forEach(m => s.add(m.hexId));
    (op.workers || []).forEach(w => s.add(w.hexId));
  });
  Object.values(empire || {}).forEach(hid => { if (hid != null) s.add(hid); });
  return s;
};

/** Destinations légales d'un Pack Up depuis `fromHex` : hex ADJACENTS, libres
 *  ou tenus par le joueur, et vierges de toute structure.
 *  `players` doit contenir TOUS les joueurs (le déménageur compris) — sinon
 *  ses propres bâtiments n'entreraient pas dans l'interdiction. */
export const packUpDestinations = (p, fromHex, { players, empire } = {}) => {
  const foes = foreignUnitHexes(p, players, empire);
  const built = buildingHexes(players && players.length ? players : (p ? [p] : []));
  return new Set((ADJ[fromHex] || []).filter(id => {
    const h = hMap[id];
    if (!h) return false;
    if (h.base) return false;                       // hex hors plateau (drapeau)
    if (h.t === "lac" || h.t === "marecage") return false;
    return !built.has(id) && !foes.has(id);
  }));
};
