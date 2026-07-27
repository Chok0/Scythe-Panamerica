// Bonus de pose (« structure bonus » du Scythe original) : une tuile tirée au
// hasard en début de partie rapporte des pièces en fin de partie selon le
// PLACEMENT des bâtiments. Barème PROGRESSIF du jeu original (2/4/6/9$) :
//   - échelle « bâtiments » (max 4 bâtiments) : 1→2$ · 2→4$ · 3→6$ · 4→9$
//   - échelle « éléments » (lacs, rencontres) : 1→2$ · 2-3→4$ · 4-5→6$ · 6-7→9$
// Les check()/count() lisent les bindings vivants de hexes.js → compatibles
// avec les cartes procédurales rechargées par loadMap().
//
// Tuiles retirées de l'ancien pool (barème plat, peu de tension de pose) :
//   - « Cœur des Villages » (+2$/bât. sur village) : les bâtiments se posent
//     naturellement sur les hex d'ouvriers — souvent des villages → gratuit.
//   - « Rives des Rivières » (+2$/bât. au bord d'une rivière) : la carte est
//     sillonnée de rivières → quasi toujours validé, zéro décision.
//
// PROPOSITIONS ALTERNATIVES (non actives — à piocher pour varier le pool) :
//   - « Avant-postes »   : bâtiments adjacents à une base ADVERSE (échelle
//     bâtiments) — récompense la pose agressive en territoire contesté.
//   - « Réseau ferré »   : bâtiments sur un hex relié au réseau de rails en
//     fin de partie (échelle bâtiments) — synergie Gare, objectif dynamique.
//   - « Terres lointaines » : bâtiments à 3+ hex de sa propre base (échelle
//     bâtiments) — pousse l'expansion au lieu du camp retranché.
//   - « Marais exploités » : marécages adjacents aux bâtiments (échelle
//     éléments) — valorise les zones à péage que tout le monde évite.
//   - « Quartier général » : plus grand GROUPE de bâtiments connexes (échelle
//     bâtiments) — le pendant « compact » de la Ligne de Production.
import { ADJ, hMap, CURRENT_MAP } from './hexes.js';

// 1→2$ · 2→4$ · 3→6$ · 4→9$ (compte des bâtiments qualifiés)
const tierBuildings = (n) => n >= 4 ? 9 : n === 3 ? 6 : n === 2 ? 4 : n === 1 ? 2 : 0;
// 1→2$ · 2-3→4$ · 4-5→6$ · 6-7+→9$ (compte d'éléments de terrain distincts)
const tierFeatures = (n) => n >= 6 ? 9 : n >= 4 ? 6 : n >= 2 ? 4 : n >= 1 ? 2 : 0;

const bHexes = (p) => (p.buildings || []).map(b => b.hexId);

// Nombre d'ÉLÉMENTS distincts (hex vérifiant isFeature) sur/adjacents aux
// bâtiments du joueur — un même lac/point de rencontre ne compte qu'une fois,
// même s'il borde plusieurs bâtiments.
const featuresNear = (p, isFeature, includeSelf) => {
  const found = new Set();
  bHexes(p).forEach(hid => {
    if (includeSelf && isFeature(hid)) found.add(hid);
    (ADJ[hid] || []).forEach(a => { if (isFeature(a)) found.add(a); });
  });
  return found.size;
};

// Plus longue LIGNE DROITE de bâtiments : chaîne d'hex adjacents qui gardent
// la même direction (les 6 directions de la grille, déduites des coordonnées
// rendues — le pas entre deux hex adjacents est constant sur cette grille).
const dirKey = (from, to) => {
  const a = hMap[from], b = hMap[to];
  if (!a || !b) return null;
  return `${Math.round((b.rx - a.rx) / 20)}_${Math.round((b.ry - a.ry) / 20)}`;
};
const longestLine = (p) => {
  const set = new Set(bHexes(p));
  if (set.size === 0) return 0;
  let best = 1;
  for (const start of set) {
    for (const next of (ADJ[start] || [])) {
      if (!set.has(next)) continue;
      const key = dirKey(start, next);
      let len = 2, cur = next;
      let extended = true;
      while (extended) {
        extended = false;
        for (const c of (ADJ[cur] || [])) {
          if (set.has(c) && dirKey(cur, c) === key) { cur = c; len++; extended = true; break; }
        }
      }
      if (len > best) best = len;
    }
  }
  return best;
};

// Nombre de bâtiments posés sur un des terrains listés
const onTerrains = (p, types) => bHexes(p).filter(h => types.includes(hMap[h]?.t)).length;

const isLake = (h) => hMap[h]?.t === "lac";
const isEncounter = (h) => CURRENT_MAP.encounterHexes.includes(h);
const nearFactory = (hid) => (ADJ[hid] || []).some(a => hMap[a]?.t === "factory");

// Chaque tuile : count(player) → valeur comptée, score(count) → pièces,
// check(hid) → surlignage $ sur la carte (tuiles à critère statique),
// unit → libellé du compteur, scale → rappel du barème pour l'UI.
export const STRUCTURE_BONUSES = [
  // ── Les 5 tuiles du jeu original, adaptées à la carte Panamerica ──
  { id: "lacs", icon: "🌊", name: "Bord des Lacs",
    desc: "selon le nombre de lacs adjacents à vos bâtiments",
    unit: "lac(s)", scale: "1→2$ · 2-3→4$ · 4-5→6$ · 6-7→9$",
    count: (p) => featuresNear(p, isLake, false), score: tierFeatures,
    check: (hid) => (ADJ[hid] || []).some(isLake) },
  { id: "cultures", icon: "🌾", name: "Champs & Toundra",
    desc: "par bâtiment posé sur un champ ou une toundra",
    unit: "bât.", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => onTerrains(p, ["champs", "toundra"]), score: tierBuildings,
    check: (hid) => ["champs", "toundra"].includes(hMap[hid]?.t) },
  { id: "monts_forets", icon: "⛰", name: "Monts & Forêts",
    desc: "par bâtiment posé sur une montagne, une sierra ou une forêt",
    unit: "bât.", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => onTerrains(p, ["montagne", "sierra", "foret"]), score: tierBuildings,
    check: (hid) => ["montagne", "sierra", "foret"].includes(hMap[hid]?.t) },
  { id: "ligne", icon: "📏", name: "Ligne de Production",
    desc: "selon la plus longue ligne droite de bâtiments adjacents",
    unit: "en ligne", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: longestLine, score: tierBuildings,
    check: () => false }, // critère géométrique : pas de surlignage statique
  { id: "rencontres", icon: "✦", name: "Croisée des Chemins",
    desc: "selon le nombre de lieux de rencontre (initiaux) sur ou à côté de vos bâtiments",
    unit: "lieu(x)", scale: "1→2$ · 2-3→4$ · 4-5→6$ · 6-7→9$",
    count: (p) => featuresNear(p, isEncounter, true), score: tierFeatures,
    check: (hid) => isEncounter(hid) || (ADJ[hid] || []).some(isEncounter) },
  // ── Spéciale Panamerica (conservée de l'ancien pool, barème aligné) :
  //    le centre est disputé — la garder crée une vraie course de placement ──
  { id: "usine", icon: "⚙", name: "Ombre de l'Usine",
    desc: "par bâtiment adjacent à la Rouge River",
    unit: "bât.", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => bHexes(p).filter(nearFactory).length, score: tierBuildings,
    check: nearFactory },
  // ── Alternative (exemple retenu) : diversifier ses terrains de pose ──
  { id: "terroirs", icon: "🗺", name: "Terroirs Variés",
    desc: "selon le nombre de TYPES de terrains différents portant vos bâtiments",
    unit: "terrain(s)", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => new Set(bHexes(p).map(h => hMap[h]?.t).filter(Boolean)).size,
    score: tierBuildings,
    check: () => false }, // tout terrain peut compter : pas de surlignage statique
];

export const pickStructureBonus = () =>
  STRUCTURE_BONUSES[Math.floor(Math.random() * STRUCTURE_BONUSES.length)];

/** Détail du bonus pour un joueur : valeur comptée + pièces au barème 2/4/6/9. */
export const structureBonusDetail = (player, bonus) => {
  if (!bonus) return { count: 0, coins: 0 };
  const count = bonus.count(player);
  return { count, coins: bonus.score(count) };
};
