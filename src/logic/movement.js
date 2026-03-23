import { FACTIONS } from '../data/factions.js';
import { HEXES, hMap, ADJ, hasR } from '../data/hexes.js';
import { FACTORY_RR_HEX } from '../data/plans.js';

// BFS: find all hexes connected to fromId via rail network
const getRailNetwork = (fromId, rails) => {
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
export const getValidMoves1Step = (fromId, factionId, abilities, player, rails) => {
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
    if (to.t === "lac") return hasPosition && factionId === "acadiane";
    if (to.t === "marecage" && !(hasPosition && factionId === "bayou")) return false;
    if (adj.includes(toId) && hasR(fromId, toId)) {
      if (hasRiverwalk) return f.riverwalk.includes(to.t);
      return false;
    }
    return true;
  });
};

// Full movement: rail (free) + 1-step, or 2-step if Speed unlocked (slot 0)
// Rail rules:
//   - If starting on rail network: free teleport to any connected rail hex, then normal move
//   - If NOT on rail: normal movement only
//   - Speed + rail: if step 1 lands on rail, step 2 can start from any connected rail hex
export const getValidMoves = (fromId, factionId, abilities, player, rails) => {
  const hasSpeed = abilities && abilities.includes(0);
  const all = new Set();

  // Find rail origins: fromId + all connected rail hexes (free teleport)
  const railNet = getRailNetwork(fromId, rails);
  const origins = railNet ? [...railNet] : [fromId];

  // Rail hexes themselves are valid destinations (just teleport there)
  if (railNet) railNet.forEach(rid => { if (rid !== fromId) all.add(rid); });

  // 1-step from each origin (rail = free teleport, then 1 normal step)
  origins.forEach(oid => {
    getValidMoves1Step(oid, factionId, abilities, player, rails).forEach(id => {
      if (id !== fromId) all.add(id);
    });
  });

  // Speed: 2nd step from each step-1 destination
  if (hasSpeed) {
    const step1 = [...all];
    step1.forEach(midId => {
      // Check if midId is on a rail network (may be different section)
      const midRailNet = getRailNetwork(midId, rails);
      const midOrigins = midRailNet ? [...midRailNet] : [midId];
      if (midRailNet) midRailNet.forEach(rid => { if (rid !== fromId) all.add(rid); });
      midOrigins.forEach(oid => {
        getValidMoves1Step(oid, factionId, abilities, player, rails).forEach(id => {
          if (id !== fromId) all.add(id);
        });
      });
    });
  }

  return [...all];
};
