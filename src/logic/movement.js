import { FACTIONS } from '../data/factions.js';
import { HEXES, hMap, ADJ, hasR } from '../data/hexes.js';
import { FACTORY_RR_HEX } from '../data/plans.js';

// 1-step movement (base + riverwalk + position abilities)
export const getValidMoves1Step = (fromId, factionId, abilities, player, rails) => {
  const f = FACTIONS[factionId], adj = ADJ[fromId] || [];
  const from = hMap[fromId];
  const hasRiverwalk = abilities && abilities.includes(1);
  const hasPosition = abilities && abilities.includes(3);
  let cands = [...adj];

  // Rail network: all connected hexes reachable in 1 move
  if (rails && rails.length > 0) {
    const visited = new Set([fromId]);
    const queue = [fromId];
    while (queue.length > 0) {
      const cur = queue.shift();
      rails.forEach(([a, b]) => {
        const next = a === cur ? b : b === cur ? a : null;
        if (next !== null && !visited.has(next)) {
          visited.add(next);
          queue.push(next);
          if (!cands.includes(next)) cands.push(next);
        }
      });
    }
  }

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

// Full movement: 1-step, or 2-step if Speed unlocked (slot 0)
export const getValidMoves = (fromId, factionId, abilities, player, rails) => {
  const step1 = getValidMoves1Step(fromId, factionId, abilities, player, rails);
  if (!(abilities && abilities.includes(0))) return step1;
  const all = new Set(step1);
  step1.forEach(midId => {
    getValidMoves1Step(midId, factionId, abilities, player, rails).forEach(id => {
      if (id !== fromId) all.add(id);
    });
  });
  return [...all];
};
