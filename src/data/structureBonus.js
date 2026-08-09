// Bonus de pose (« structure bonus » du Scythe original) : une tuile tirée au
// hasard en début de partie rapporte des pièces en fin de partie selon le
// PLACEMENT des bâtiments. Barème PROGRESSIF du jeu original (2/4/6/9$) :
//   - échelle « bâtiments » (max 4 bâtiments) : 1→2$ · 2→4$ · 3→6$ · 4→9$
//   - échelle « éléments » (lacs, rencontres) : 1→2$ · 2-3→4$ · 4-5→6$ · 6-7→9$
// Deux tuiles spéciales sortent du barème (verdicts de playtest) :
//   - Avant-Postes : exploit binaire (10$ + 2$/autre bâtiment)
//   - Terres Lointaines : 1$ par hex de distance du bâtiment le plus éloigné
// Les check()/count() lisent les bindings vivants de hexes.js → compatibles
// avec les cartes procédurales rechargées par loadMap().
//
// Tuile retirée de l'ancien pool :
//   - « Rives des Rivières » (+2$/bât. au bord d'une rivière) : la carte est
//     sillonnée de rivières → quasi toujours validé, zéro décision.
// Propositions écartées (verdicts de playtest) :
//   - « Réseau ferré » : trop aléatoire — les bots déploient peu leurs rails.
//   - « Marais exploités » : trop peu de marécages sur la carte.
//   - « Quartier général » (groupe connexe) : calqué sur la pose naturelle
//     des joueurs — la tuile serait validée sans respecter aucune contrainte.
import { HEXES, ADJ, hMap, CURRENT_MAP, homeBaseHex } from './hexes.js';

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

// Base ADVERSE : base d'une faction EN JEU différente de la mienne (players
// fourni) — repli sur « toute base d'une autre faction » sinon (surlignage).
// Exporté : aussi utilisé par les objectifs secrets (data/objectives.js).
export const nearEnemyBase = (hid, p, players) => {
  const enemies = players ? new Set(players.map(pl => pl.faction).filter(fc => fc !== p?.faction)) : null;
  return (ADJ[hid] || []).some(a => {
    const h = hMap[a];
    if (!h?.base) return false;
    if (enemies) return enemies.has(h.faction);
    return !p || h.faction !== p.faction;
  });
};

// Distance de marche (BFS) d'un hex vers la base du joueur : lacs et bases
// adverses infranchissables — « le chemin le plus direct pour rentrer ».
// Exportée sous walkDistToBase (objectifs secrets, IA de pose à venir).
const distToBase = (fromHid, p) => {
  const base = homeBaseHex(p.faction);
  if (!base || fromHid === base.id) return 0;
  const seen = new Set([fromHid]);
  let frontier = [fromHid], d = 0;
  while (frontier.length > 0) {
    d++;
    const next = [];
    for (const cur of frontier) {
      for (const a of (ADJ[cur] || [])) {
        if (seen.has(a)) continue;
        seen.add(a);
        if (a === base.id) return d;
        const h = hMap[a];
        if (!h || h.t === "lac" || h.base) continue; // pas de traversée
        next.push(a);
      }
    }
    frontier = next;
  }
  return 0; // base injoignable (ne devrait pas arriver)
};

// Chaque tuile : count(player, players) → valeur comptée,
// score(count, player) → pièces, check(hid, player?, players?) → surlignage $
// sur la carte, unit → libellé du compteur, scale → rappel du barème (UI).
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
  // ── Gardée sur verdict de playtest : les villages sont boudés une fois les
  //    ouvriers produits — la tuile ramène du monde dessus et pousse au
  //    passage l'étoile des 8 ouvriers (souvent délaissée, coûteuse en pop) ──
  { id: "villages", icon: "🏘", name: "Cœur des Villages",
    desc: "par bâtiment posé sur un village",
    unit: "bât.", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => onTerrains(p, ["village"]), score: tierBuildings,
    check: (hid) => hMap[hid]?.t === "village" },
  // ── Spéciale Panamerica : le centre disputé garde sa course de placement ──
  { id: "usine", icon: "⚙", name: "Ombre de l'Usine",
    desc: "par bâtiment adjacent à la Rouge River",
    unit: "bât.", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => bHexes(p).filter(nearFactory).length, score: tierBuildings,
    check: nearFactory },
  // ── Alternative retenue : diversifier ses terrains de pose ──
  { id: "terroirs", icon: "🗺", name: "Terroirs Variés",
    desc: "selon le nombre de TYPES de terrains différents portant vos bâtiments",
    unit: "terrain(s)", scale: "1→2$ · 2→4$ · 3→6$ · 4→9$",
    count: (p) => new Set(bHexes(p).map(h => hMap[h]?.t).filter(Boolean)).size,
    score: tierBuildings,
    check: () => false }, // tout terrain peut compter : pas de surlignage statique
  // ── Exploit d'invasion (hors barème) : réussir UNE fois suffit — 10$ pour
  //    au moins un bâtiment adjacent à une base ADVERSE, puis +2$ par autre
  //    bâtiment construit (où qu'il soit). Max 16$ : gros gain, gros risque ──
  { id: "avant_postes", icon: "🚩", name: "Avant-Postes",
    desc: "10$ si au moins un bâtiment est adjacent à une base adverse, +2$ par autre bâtiment construit",
    unit: "avant-poste(s)", scale: "1 → 10$ (+2$/autre bât.)",
    count: (p, players) => bHexes(p).filter(h => nearEnemyBase(h, p, players)).length,
    score: (n, p) => n >= 1 ? 10 + 2 * Math.max(0, (p?.buildings || []).length - 1) : 0,
    check: (hid, p, players) => nearEnemyBase(hid, p, players) },
  // ── Expansion (hors barème) : 1$ par hex de distance — on ne compte QUE le
  //    bâtiment le plus éloigné (sommer les 4 exploserait le plafond des 9$ ;
  //    variante « somme de tous les bâtiments » possible en une ligne) ──
  { id: "terres_lointaines", icon: "🧭", name: "Terres Lointaines",
    desc: "1$ par hex du chemin le plus direct entre votre base et votre bâtiment le plus éloigné",
    unit: "hex (le + loin)", scale: "1$ / hex de distance",
    count: (p) => Math.max(0, ...bHexes(p).map(h => distToBase(h, p))),
    score: (n) => n,
    check: (hid, p) => !!p && distToBase(hid, p) >= 4 }, // surligne les terres à 4+ hex de VOTRE base
];

export const walkDistToBase = distToBase;

/** Hex éligibles au surlignage $ d'une tuile sur la carte COURANTE.
 *  Vide pour les tuiles à critère géométrique (Ligne de Production, Terroirs
 *  Variés, Terres Lointaines) : tout hex peut y contribuer. */
export const eligibleHexes = (bonus) => {
  if (!bonus) return [];
  return HEXES.filter(h => { try { return !!bonus.check(h.id); } catch { return false; } }).map(h => h.id);
};

// Une tuile doit être JOUABLE sur la carte tirée. Constaté en partie
// (01/08 et 03/08) : le bonus de pose a rapporté 0$ aux trois joueurs deux
// fois de suite. Sur la carte v3 ce filtre ne retire rien (la plus maigre,
// « Champs & Toundra », a 5 hex éligibles dont 2 à 3 à portée de chaque
// base) — il protège des cartes procédurales où un terrain est quasi absent.
const MIN_ELIGIBLE = 4;      // 4 bâtiments max : moins, et le haut du barème est hors d'atteinte
const MIN_NEAR_BASE = 2;     // par faction en jeu, à MAX_BASE_DIST pas de sa base
const MAX_BASE_DIST = 5;

/** Distances de marche depuis la base d'une faction (mêmes interdits que
 *  distToBase : ni lac, ni base adverse). */
const distMapFrom = (hexId) => {
  const d = { [hexId]: 0 };
  let frontier = [hexId], n = 0;
  while (frontier.length > 0) {
    n++;
    const next = [];
    for (const cur of frontier) {
      for (const a of (ADJ[cur] || [])) {
        if (d[a] != null) continue;
        d[a] = n;
        const h = hMap[a];
        if (!h || h.t === "lac" || h.base) continue;
        next.push(a);
      }
    }
    frontier = next;
  }
  return d;
};

/** La tuile est-elle jouable sur la carte courante, pour les factions en jeu ? */
export const bonusViable = (bonus, factions) => {
  const elig = eligibleHexes(bonus);
  if (elig.length === 0) return true; // critère géométrique : toujours jouable
  if (elig.length < MIN_ELIGIBLE) return false;
  return (factions || []).every(fid => {
    const base = homeBaseHex(fid);
    if (!base) return true;
    const d = distMapFrom(base.id);
    return elig.filter(id => (d[id] ?? 99) <= MAX_BASE_DIST).length >= MIN_NEAR_BASE;
  });
};

/** Tirage de la tuile bonus, restreint aux tuiles jouables sur cette carte.
 *  `factions` : ids des factions en jeu (facultatif — sans elles, seul le
 *  nombre d'hex éligibles est vérifié). */
export const pickStructureBonus = (factions) => {
  const pool = STRUCTURE_BONUSES.filter(b => bonusViable(b, factions));
  const from = pool.length > 0 ? pool : STRUCTURE_BONUSES;
  return from[Math.floor(Math.random() * from.length)];
};

/** Détail du bonus pour un joueur : valeur comptée + pièces.
 *  `players` (optionnel) : liste des joueurs en partie — sert aux tuiles
 *  relatives aux adversaires (Avant-Postes). */
export const structureBonusDetail = (player, bonus, players) => {
  if (!bonus) return { count: 0, coins: 0 };
  const count = bonus.count(player, players);
  return { count, coins: bonus.score(count, player) };
};
