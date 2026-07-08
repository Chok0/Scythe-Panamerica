// Générateur de cartes procédurales + règles de non-acceptation (v2).
//
// Principe : la géométrie (43 hexagones, ids/coordonnées) est fixe — on
// redistribue les TERRAINS (même répartition que la carte d'origine), on
// retrace les RIVIÈRES et on replace les jetons RENCONTRE. Une carte n'est
// acceptée que si elle passe toutes les règles ; sinon on répare puis on
// régénère (rejection sampling).
//
// PHILOSOPHIE (alignée sur le Scythe original) : les factions PEUVENT
// démarrer enfermées sur un îlot de quelques hexagones — c'est un pattern
// voulu du jeu de base, compensé par la lenteur initiale. La sortie se
// gagne : mecha Riverwalk (traversée vers les terrains de la faction) ou
// Gare + rails (notre équivalent de la Mine). Ce qui est interdit, c'est
// l'ABSENCE de sortie.
//
// RÈGLES DE NON-ACCEPTATION (une carte est REJETÉE si…) :
//  R1 escape    — une faction n'a AUCUNE sortie de son îlot : aucune rivière
//                 du bord de l'îlot ne débouche sur un terrain de sa
//                 capacité Riverwalk (les rails restent un plan B universel,
//                 mais la sortie « native » doit exister)
//  R2 potential — en IGNORANT les rivières (potentiel une fois sorti), moins
//                 de 3 types de ressources ou pas de village à ≤ 3 pas
//  R3 factory   — Rouge River inaccessible par continuité terrestre
//  R4 fairness  — écart d'ouverture > 4× entre factions (3 pas, rivières
//                 bloquantes) — tolérant : les îlots sont permis, pas
//                 l'enfermement d'un seul joueur sur 1-2 hexes quand les
//                 autres ont la plaine
//  R5 diversité — « non-proximité » : plus de 2 hexagones du MÊME terrain
//                 adjacents (cluster ≥ 3) — le plateau maintient la
//                 diversité locale des terrains
//  R6 rivers    — nombre de rivières hors de [24, 46]
//  R7 empire    — un hex de départ de l'Empire (22,15,23,26,27,30) est un
//                 lac ou un marécage
import { HOME_BASES, DEFAULT_MAP } from './hexes.js';
import { TERRAINS } from './terrains.js';
import { FACTIONS } from './factions.js';

const GEOMETRY = DEFAULT_MAP.hexes.map(h => ({ id: h.id, rx: h.rx, ry: h.ry }));
const FACTORY_ID = 22;
const EMPIRE_HEX_IDS = [22, 15, 23, 26, 27, 30];

// Répartition des terrains de la carte d'origine (hors usine)
const TERRAIN_POOL = DEFAULT_MAP.hexes.filter(h => h.id !== FACTORY_ID).map(h => h.t);

const computeAdj = (hexes) => {
  const a = {};
  hexes.forEach(h => { a[h.id] = []; });
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const ha = hexes[i], hb = hexes[j];
      if (Math.sqrt((ha.rx - hb.rx) ** 2 + (ha.ry - hb.ry) ** 2) < 160) {
        a[ha.id].push(hb.id); a[hb.id].push(ha.id);
      }
    }
  }
  return a;
};

const shuffleWith = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const nearestLandHexes = (hexes, pt, count) =>
  hexes
    .filter(h => h.t !== "lac" && h.t !== "marecage")
    .map(h => ({ h, d: Math.hypot(h.rx - pt.rx, h.ry - pt.ry) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(e => e.h.id);

// BFS terrestre ; blockRivers=true → ne traverse pas les rivières
const reachable = (fromId, hexes, adj, riverSet, blockRivers, maxDepth = Infinity) => {
  const hM = Object.fromEntries(hexes.map(h => [h.id, h]));
  const seen = new Set([fromId]);
  let frontier = [fromId];
  let depth = 0;
  while (frontier.length > 0 && depth < maxDepth) {
    const next = [];
    for (const cur of frontier) {
      for (const nb of adj[cur] || []) {
        if (seen.has(nb)) continue;
        const h = hM[nb];
        if (!h || h.t === "lac" || h.t === "marecage") continue;
        if (blockRivers && riverSet.has(`${Math.min(cur, nb)}-${Math.max(cur, nb)}`)) continue;
        seen.add(nb); next.push(nb);
      }
    }
    frontier = next; depth++;
  }
  return seen;
};

// L'îlot de départ a-t-il une sortie « native » ? (rivière du bord débouchant
// sur un terrain de la capacité Riverwalk de la faction)
const hasRiverwalkEscape = (fid, pocket, map, adj, riverSet) => {
  const hM = Object.fromEntries(map.hexes.map(h => [h.id, h]));
  const rw = FACTIONS[fid]?.riverwalk || [];
  for (const id of pocket) {
    for (const nb of adj[id] || []) {
      if (pocket.has(nb)) continue;
      const t = hM[nb]?.t;
      if (!t || t === "lac" || t === "marecage") continue;
      if (riverSet.has(`${Math.min(id, nb)}-${Math.max(id, nb)}`) && rw.includes(t)) return true;
    }
  }
  return false;
};

/**
 * Génère une carte candidate — placement guidé :
 *  - lacs/marécages jamais sur les hexes Empire ni sur les hexes de départ
 *  - un village garanti à ≤ 2 pas de chaque base (en ignorant les rivières)
 *  - les rivières sont libres PARTOUT (les îlots de départ sont un pattern
 *    voulu du jeu original — seule l'absence de sortie est interdite)
 */
export const generateMap = (rand, name = "procedurale") => {
  const adjGeo = computeAdj(GEOMETRY);
  const startIds = Object.values(HOME_BASES).map(hb =>
    GEOMETRY.map(g => ({ g, d: Math.hypot(g.rx - hb.rx, g.ry - hb.ry) })).sort((a, b) => a.d - b.d)[0].g.id);

  // 1) Eau (lacs + marécages) hors Empire / départs
  const waterPool = TERRAIN_POOL.filter(t => t === "lac" || t === "marecage");
  const landPool = shuffleWith(TERRAIN_POOL.filter(t => t !== "lac" && t !== "marecage"), rand);
  const waterForbidden = new Set([...EMPIRE_HEX_IDS, ...startIds]);
  const assignable = GEOMETRY.filter(g => g.id !== FACTORY_ID);
  const waterCandidates = shuffleWith(assignable.filter(g => !waterForbidden.has(g.id)), rand);
  const terrainById = {};
  waterPool.forEach((t, i) => { if (waterCandidates[i]) terrainById[waterCandidates[i].id] = t; });

  // 2) Villages : un à ≤ 2 pas de chaque base
  const villages = landPool.filter(t => t === "village");
  const others = shuffleWith(landPool.filter(t => t !== "village"), rand);
  let vi = 0;
  for (const sid of startIds) {
    if (vi >= villages.length) break;
    const disc = [sid, ...(adjGeo[sid] || []), ...(adjGeo[sid] || []).flatMap(n => adjGeo[n] || [])];
    const spot = shuffleWith([...new Set(disc)], rand).find(id => id !== FACTORY_ID && terrainById[id] === undefined);
    if (spot !== undefined) { terrainById[spot] = "village"; vi++; }
  }
  while (vi < villages.length) {
    const spot = shuffleWith(assignable, rand).find(g => terrainById[g.id] === undefined);
    if (spot === undefined) break;
    terrainById[spot.id] = "village"; vi++;
  }
  // 3) Le reste des terrains
  let oi = 0;
  assignable.forEach(g => { if (terrainById[g.id] === undefined) terrainById[g.id] = others[oi++]; });
  const hexes = GEOMETRY.map(g => ({ ...g, t: g.id === FACTORY_ID ? "factory" : terrainById[g.id] }));
  const adj = computeAdj(hexes);

  // 4) Rivières : libres partout (îlots permis), densité proche de l'original
  const edges = [];
  Object.entries(adj).forEach(([a, list]) => list.forEach(b => { if (+a < b) edges.push([+a, b]); }));
  const target = 28 + Math.floor(rand() * 10); // 28-37
  const rivers = shuffleWith(edges, rand).slice(0, target);

  // Rencontres : 9 hexes terrestres, non-usine, jamais adjacents entre eux
  const landIds = hexes.filter(h => h.t !== "lac" && h.t !== "factory").map(h => h.id);
  const encounterHexes = [];
  for (const id of shuffleWith(landIds, rand)) {
    if (encounterHexes.length >= 9) break;
    if (encounterHexes.some(e => (adj[e] || []).includes(id))) continue;
    encounterHexes.push(id);
  }

  // Départs : héros + 2 ouvriers sur les hexes terrestres les plus proches de la base
  const starts = {};
  Object.keys(HOME_BASES).forEach(fid => {
    starts[fid] = { workerHex: nearestLandHexes(hexes, HOME_BASES[fid], 2) };
  });

  return { name, hexes, rivers, encounterHexes, starts };
};

/** Applique les règles de non-acceptation. @returns {{ok, reasons:[]}} */
export const validateMap = (map) => {
  const reasons = [];
  const adj = computeAdj(map.hexes);
  const riverSet = new Set(map.rivers.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  const hM = Object.fromEntries(map.hexes.map(h => [h.id, h]));
  const heroStart = (fid) => nearestLandHexes(map.hexes, HOME_BASES[fid], 1)[0];

  const openness = {};
  Object.keys(HOME_BASES).forEach(fid => {
    const start = heroStart(fid);
    const pocket = reachable(start, map.hexes, adj, riverSet, true);
    // R1 — l'îlot est permis, l'absence de sortie ne l'est pas :
    // ouvert (≥ 8 hexes) OU sortie Riverwalk native
    if (pocket.size < 8 && !hasRiverwalkEscape(fid, pocket, map, adj, riverSet))
      reasons.push(`R1 escape: ${FACTIONS[fid].name} sans sortie Riverwalk de son îlot (${pocket.size} hexes)`);
    // R2 — potentiel du voisinage en ignorant les rivières
    const near = reachable(start, map.hexes, adj, riverSet, false, 3);
    const resTypes = new Set();
    let hasVillage = false;
    near.forEach(id => {
      const res = TERRAINS[hM[id].t]?.res;
      if (res === "ouvriers") hasVillage = true;
      else if (res) resTypes.add(res);
    });
    if (resTypes.size < 3) reasons.push(`R2 potential: ${FACTIONS[fid].name} n'a que ${resTypes.size} types de ressources en 3 pas (rivières ignorées)`);
    if (!hasVillage) reasons.push(`R2 potential: ${FACTIONS[fid].name} sans village en 3 pas`);
    // R3 — usine atteignable (continuité terrestre)
    const landReach = reachable(start, map.hexes, adj, riverSet, false);
    if (!landReach.has(FACTORY_ID)) reasons.push(`R3 factory: inaccessible depuis ${FACTIONS[fid].name}`);
    openness[fid] = reachable(start, map.hexes, adj, riverSet, true, 3).size;
  });
  // R4 — équité d'ouverture, tolérante (les îlots sont normaux)
  const vals = Object.values(openness);
  if (Math.max(...vals) > 4 * Math.max(1, Math.min(...vals)))
    reasons.push(`R4 fairness: ouverture ${Math.min(...vals)}–${Math.max(...vals)} hexes (écart > 4×)`);
  // R5 — « non-proximité » : jamais 3+ hexes du même terrain connectés
  {
    const seen = new Set();
    outer:
    for (const h of map.hexes) {
      if (h.t === "factory" || seen.has(h.id)) continue;
      let cluster = 0; const q = [h.id]; const local = new Set([h.id]);
      while (q.length) {
        const cur = q.pop(); cluster++; seen.add(cur);
        for (const nb of adj[cur] || []) {
          if (!local.has(nb) && hM[nb]?.t === h.t) { local.add(nb); q.push(nb); }
        }
      }
      if (cluster >= 3) { reasons.push(`R5 diversité: ${cluster} hexes « ${h.t} » collés`); break outer; }
    }
  }
  // R6 — densité de rivières
  if (map.rivers.length < 24 || map.rivers.length > 46) reasons.push(`R6 rivers: ${map.rivers.length} rivières hors [24,46]`);
  // R7 — départs Empire sur terre
  EMPIRE_HEX_IDS.forEach(id => {
    const t = hM[id]?.t;
    if (t === "lac" || t === "marecage") reasons.push(`R7 empire: E sur ${t} (#${id})`);
  });

  return { ok: reasons.length === 0, reasons };
};

/** Réparations ciblées : sortie Riverwalk manquante (R1) ou clusters de terrain (R5). */
const repairMap = (map, rand) => {
  const adj = computeAdj(map.hexes);
  for (let pass = 0; pass < 24; pass++) {
    const v = validateMap(map);
    if (v.ok) return map;
    const riverSet = new Set(map.rivers.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    const hM = Object.fromEntries(map.hexes.map(h => [h.id, h]));
    const r1 = v.reasons.find(r => r.startsWith("R1"));
    const r5 = v.reasons.find(r => r.startsWith("R5"));
    if (r1) {
      // Ouvrir une sortie : retirer une rivière du bord de l'îlot enfermé
      let repaired = false;
      for (const fid of Object.keys(HOME_BASES)) {
        const start = nearestLandHexes(map.hexes, HOME_BASES[fid], 1)[0];
        const pocket = reachable(start, map.hexes, adj, riverSet, true);
        if (pocket.size >= 8 || hasRiverwalkEscape(fid, pocket, map, adj, riverSet)) continue;
        const boundary = map.rivers.findIndex(([a, b]) => pocket.has(a) !== pocket.has(b));
        if (boundary >= 0) { map.rivers.splice(boundary, 1); repaired = true; break; }
      }
      if (!repaired) return map;
    } else if (r5) {
      // Casser un cluster : échanger un hex du cluster avec un hex lointain d'un autre terrain
      const t = r5.match(/« (\w+) »/)?.[1];
      const cluster = map.hexes.find(h => h.t === t && (adj[h.id] || []).filter(nb => hM[nb]?.t === t).length >= 2);
      const swap = shuffleWith(map.hexes.filter(h => h.t !== t && h.t !== "factory" && h.t !== "lac" && h.t !== "marecage" && !(adj[h.id] || []).some(nb => hM[nb]?.t === t)), rand)[0];
      if (!cluster || !swap) return map;
      const tmp = cluster.t; cluster.t = swap.t; swap.t = tmp;
    } else {
      return map;
    }
  }
  return map;
};

/** Génère jusqu'à obtenir une carte acceptée. @returns {{map, tries, lastReasons}} */
export const generateAcceptedMap = (rand, maxTries = 40) => {
  let lastReasons = [];
  for (let i = 1; i <= maxTries; i++) {
    const map = repairMap(generateMap(rand, `proc-${i}`), rand);
    const v = validateMap(map);
    if (v.ok) return { map, tries: i, lastReasons: [] };
    lastReasons = v.reasons;
  }
  // Improbable avec ces règles ; on retourne la carte par défaut par sûreté
  return { map: DEFAULT_MAP, tries: maxTries, lastReasons };
};
