// Générateur de cartes procédurales + règles de non-acceptation.
//
// Principe : la géométrie (43 hexagones, ids/coordonnées) est fixe — on
// redistribue les TERRAINS (même répartition que la carte d'origine), on
// retrace les RIVIÈRES et on replace les jetons RENCONTRE. Une carte n'est
// acceptée que si elle passe toutes les règles ci-dessous ; sinon on en
// génère une autre (rejection sampling).
//
// RÈGLES DE NON-ACCEPTATION (une carte est REJETÉE si…) :
//  R1 pocket    — un départ de faction est enfermé : < 8 hexes atteignables
//                 sans traverser de rivière (la Confédération de la carte
//                 d'origine échoue à cette règle : poche de 3 hexes !)
//  R2 resources — un départ n'a pas ≥ 3 types de ressources différents ET
//                 ≥ 1 village atteignables en ≤ 3 pas sans rivière
//  R3 factory   — Rouge River (hex 22) n'est pas atteignable par toutes les
//                 factions (connectivité terrestre, rivières ignorées)
//  R4 fairness  — écart d'ouverture > 2,5× entre factions (hexes atteignables
//                 en 3 pas sans rivière)
//  R5 lakes     — un bloc de > 3 lacs adjacents (mur d'eau)
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

/**
 * Génère une carte candidate — placement GUIDÉ pour converger vite :
 *  - lacs/marécages jamais sur les hexes Empire ni sur les hexes de départ
 *  - un village garanti à ≤ 2 pas de chaque base de faction
 *  - pas de rivière sur les arêtes touchant un hex de départ de héros
 */
export const generateMap = (rand, name = "procedurale") => {
  const adjGeo = computeAdj(GEOMETRY);
  // Hexes de départ approximatifs (les plus proches de chaque base, terrain ignoré)
  const startIds = Object.values(HOME_BASES).map(hb =>
    GEOMETRY.map(g => ({ g, d: Math.hypot(g.rx - hb.rx, g.ry - hb.ry) })).sort((a, b) => a.d - b.d)[0].g.id);
  const nearStart = new Set(startIds);
  startIds.forEach(id => (adjGeo[id] || []).forEach(nb => nearStart.add(nb)));

  // 1) Placement de l'eau (lacs + marécages) hors Empire / départs
  const waterPool = TERRAIN_POOL.filter(t => t === "lac" || t === "marecage");
  const landPool = shuffleWith(TERRAIN_POOL.filter(t => t !== "lac" && t !== "marecage"), rand);
  const waterForbidden = new Set([...EMPIRE_HEX_IDS, ...startIds]);
  const assignable = GEOMETRY.filter(g => g.id !== FACTORY_ID);
  const waterCandidates = shuffleWith(assignable.filter(g => !waterForbidden.has(g.id)), rand);
  const terrainById = {};
  waterPool.forEach((t, i) => { if (waterCandidates[i]) terrainById[waterCandidates[i].id] = t; });

  // 2) Villages : en réserver un à ≤ 2 pas de chaque base
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

  // 4) Rivières : jamais sur une arête touchant un hex de départ de héros
  const edges = [];
  Object.entries(adj).forEach(([a, list]) => list.forEach(b => { if (+a < b) edges.push([+a, b]); }));
  const startBlocked = new Set(startIds);
  const eligible = edges.filter(([a, b]) => !startBlocked.has(a) && !startBlocked.has(b));
  const target = 28 + Math.floor(rand() * 10); // 28-37
  const rivers = shuffleWith(eligible, rand).slice(0, target);

  // Rencontres : 9 hexes terrestres, non-usine, en évitant les paires adjacentes
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
    // R1 — poche verrouillée par les rivières
    const pocket = reachable(start, map.hexes, adj, riverSet, true);
    if (pocket.size < 8) reasons.push(`R1 pocket: ${FACTIONS[fid].name} enfermé (${pocket.size} hexes sans rivière)`);
    // R2 — accès aux ressources en ≤ 3 pas
    const near = reachable(start, map.hexes, adj, riverSet, true, 3);
    const resTypes = new Set();
    let hasVillage = false;
    near.forEach(id => {
      const res = TERRAINS[hM[id].t]?.res;
      if (res === "ouvriers") hasVillage = true;
      else if (res) resTypes.add(res);
    });
    if (resTypes.size < 3) reasons.push(`R2 resources: ${FACTIONS[fid].name} n'a que ${resTypes.size} types de ressources en 3 pas`);
    if (!hasVillage) reasons.push(`R2 resources: ${FACTIONS[fid].name} sans village en 3 pas`);
    // R3 — usine atteignable (terre, rivières ignorées)
    const landReach = reachable(start, map.hexes, adj, riverSet, false);
    if (!landReach.has(FACTORY_ID)) reasons.push(`R3 factory: inaccessible depuis ${FACTIONS[fid].name}`);
    openness[fid] = reachable(start, map.hexes, adj, riverSet, true, 3).size;
  });
  // R4 — équité d'ouverture
  const vals = Object.values(openness);
  if (Math.max(...vals) > 2.5 * Math.max(1, Math.min(...vals)))
    reasons.push(`R4 fairness: ouverture ${Math.min(...vals)}–${Math.max(...vals)} hexes (écart > 2,5×)`);
  // R5 — murs de lacs
  const lakes = map.hexes.filter(h => h.t === "lac").map(h => h.id);
  const lakeSet = new Set(lakes);
  const seenL = new Set();
  for (const l of lakes) {
    if (seenL.has(l)) continue;
    let cluster = 0; const q = [l]; seenL.add(l);
    while (q.length) {
      const cur = q.pop(); cluster++;
      (adj[cur] || []).forEach(nb => { if (lakeSet.has(nb) && !seenL.has(nb)) { seenL.add(nb); q.push(nb); } });
    }
    if (cluster > 3) { reasons.push(`R5 lakes: bloc de ${cluster} lacs adjacents`); break; }
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

/** Réparation ciblée : retire des rivières autour des poches enfermées (R1/R4). */
const repairRivers = (map) => {
  const adj = computeAdj(map.hexes);
  for (let pass = 0; pass < 20; pass++) {
    const v = validateMap(map);
    const pocketReason = v.reasons.find(r => r.startsWith("R1") || r.startsWith("R4"));
    if (!pocketReason) return map;
    const riverSet = new Set(map.rivers.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    // Trouver la faction enfermée et retirer une rivière au bord de sa poche
    let removed = false;
    for (const fid of Object.keys(HOME_BASES)) {
      const start = nearestLandHexes(map.hexes, HOME_BASES[fid], 1)[0];
      const pocket = reachable(start, map.hexes, adj, riverSet, true);
      if (pocket.size >= 8) continue;
      const boundary = map.rivers.findIndex(([a, b]) => pocket.has(a) !== pocket.has(b));
      if (boundary >= 0) { map.rivers.splice(boundary, 1); removed = true; break; }
    }
    if (!removed) return map;
  }
  return map;
};

/** Génère jusqu'à obtenir une carte acceptée. @returns {{map, tries, lastReasons}} */
export const generateAcceptedMap = (rand, maxTries = 40) => {
  let lastReasons = [];
  for (let i = 1; i <= maxTries; i++) {
    const map = repairRivers(generateMap(rand, `proc-${i}`));
    const v = validateMap(map);
    if (v.ok) return { map, tries: i, lastReasons: [] };
    lastReasons = v.reasons;
  }
  // Improbable avec ces règles ; on retourne la carte par défaut par sûreté
  return { map: DEFAULT_MAP, tries: maxTries, lastReasons };
};
