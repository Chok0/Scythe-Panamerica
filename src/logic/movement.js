import { FACTIONS } from '../data/factions.js';
import { HEXES, hMap, ADJ, hasR } from '../data/hexes.js';
import { FACTORY_RR_HEX } from '../data/plans.js';

// BFS: find all hexes connected to fromId via rail network
export const getRailNetwork = (fromId, rails) => {
  if (!rails || rails.length === 0) return null;
  const onRail = rails.some(([a, b]) => a === fromId || b === fromId);
  if (!onRail) return null;
  const visited = new Set([fromId]);
  const queue = [fromId];
  while (queue.length > 0) {
    const cur = queue.shift();
    rails.forEach(([a, b]) => {
      const next = a === cur ? b : b === cur ? a : null;
      if (next !== null && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  return visited;
};

// 1-step movement from a single hex (no rail — rail handled in getValidMoves)
// ignoreRivers : plan Trimotor (F2) — les rivières ne bloquent plus
export const getValidMoves1Step = (fromId, factionId, abilities, player, rails, ignoreRivers = false) => {
  const f = FACTIONS[factionId], adj = ADJ[fromId] || [];
  const from = hMap[fromId];
  const hasRiverwalk = abilities && abilities.includes(1);
  const hasPosition = abilities && abilities.includes(3);
  let cands = [...adj];

  // Position abilities (slot 3)
  if (hasPosition) {
    if (factionId === "bayou" && from.t === "marecage")
      HEXES.forEach(h => { if (h.t === "marecage" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
    if (factionId === "frente" && from.t === "sierra")
      HEXES.forEach(h => { if (h.t === "sierra" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
    if (factionId === "confederation" && player) {
      const unitHexes = new Set([player.hero, ...player.workers.map(w => w.hexId), ...player.mechs.map(m => m.hexId)]);
      const ctrlVillages = HEXES.filter(h => h.t === "village" && unitHexes.has(h.id)).map(h => h.id);
      if (from.t === "village" || from.t === "factory") {
        ctrlVillages.forEach(v => { if (v !== fromId && !cands.includes(v)) cands.push(v); });
        if (fromId !== FACTORY_RR_HEX && !cands.includes(FACTORY_RR_HEX)) cands.push(FACTORY_RR_HEX);
      }
      if (fromId === FACTORY_RR_HEX)
        ctrlVillages.forEach(v => { if (!cands.includes(v)) cands.push(v); });
    }
    if (factionId === "acadiane" && from.t === "lac")
      HEXES.forEach(h => { if (h.t === "lac" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
  }

  return cands.filter(toId => {
    const to = hMap[toId]; if (!to) return false;
    // Hex de base : seul son propriétaire peut y entrer (retraite/départ)
    if (to.base) return to.faction === factionId;
    if (to.t === "lac") return hasPosition && factionId === "acadiane";
    if (to.t === "marecage" && !(hasPosition && factionId === "bayou")) return false;
    if (adj.includes(toId) && hasR(fromId, toId)) {
      if (ignoreRivers) return true;
      if (hasRiverwalk) return f.riverwalk.includes(to.t);
      return false;
    }
    return true;
  });
};

// Full movement: rail (free) + N steps.
// Steps = 1, +1 avec Speed (slot 0), et bonus des plans Ford/Tesla :
//   - Trimotor (move_3)      : 3 pas pour toutes les unités + ignore les rivières
//   - Golem (remote_move)    : 2 pas pour les MECHAS
//   - Éclair (mech_sprint)   : 4 pas pour les MECHAS
// Rail rules:
//   - If starting on rail network: free teleport to any connected rail hex, then normal move
//   - If a step lands on rail, the next step can start from any connected rail hex
export const getValidMoves = (fromId, factionId, abilities, player, rails, unitType) => {
  const hasSpeed = abilities && abilities.includes(0);
  const plan = player?.factoryCard?.topBonus;
  let steps = hasSpeed ? 2 : 1;
  let ignoreRivers = false;
  if (plan === "move_3") { steps = Math.max(steps, 3); ignoreRivers = true; }
  if (plan === "remote_move" && unitType === "mech") steps = Math.max(steps, 2);
  if (plan === "mech_sprint" && unitType === "mech") steps = Math.max(steps, 4);

  const all = new Set();
  let frontier = [fromId];
  for (let s = 0; s < steps; s++) {
    const next = [];
    const reach = (id) => { if (id !== fromId && !all.has(id)) { all.add(id); next.push(id); } };
    frontier.forEach(fid => {
      // Rail hexes themselves are valid destinations (free teleport)
      const railNet = getRailNetwork(fid, rails);
      const origins = railNet ? [...railNet] : [fid];
      if (railNet) railNet.forEach(reach);
      // 1 normal step from each origin (rail = free teleport, then 1 step)
      origins.forEach(oid => {
        getValidMoves1Step(oid, factionId, abilities, player, rails, ignoreRivers).forEach(reach);
      });
    });
    frontier = next;
  }

  return [...all];
};

// ── Trajet : reconstitue les ÉTAPES d'un déplacement from→to ──
// Rend les hexes intermédiaires (hors départ/arrivée) où l'unité « passe » :
// c'est là qu'un mech peut DÉPOSER un ouvrier ou du matériel en cours de route
// (stratégie classique : relais de mechas, dépôt avant bataille, expansion).
// BFS sur le même graphe que getValidMoves : pas normaux + bonds de rail.
export const findPathWaypoints = (fromId, toId, factionId, abilities, player, rails) => {
  if (fromId === toId) return [];
  const prev = new Map([[fromId, null]]);
  const queue = [fromId];
  let found = false;
  while (queue.length > 0 && !found) {
    const cur = queue.shift();
    const nexts = new Set(getValidMoves1Step(cur, factionId, abilities, player, rails));
    const rn = getRailNetwork(cur, rails);
    if (rn) rn.forEach(rid => nexts.add(rid));
    for (const nx of nexts) {
      if (prev.has(nx)) continue;
      prev.set(nx, cur);
      if (nx === toId) { found = true; break; }
      // Profondeur bornée implicitement par le graphe (43 hexes)
      queue.push(nx);
    }
  }
  if (!prev.has(toId)) return [];
  const path = [];
  let cur = prev.get(toId);
  while (cur !== null && cur !== fromId) { path.unshift(cur); cur = prev.get(cur); }
  return path; // hexes intermédiaires, dans l'ordre de passage
};
