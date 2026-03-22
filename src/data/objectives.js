import { HEXES, HOME_BASES, hMap, ADJ, hasR } from './hexes.js';

export const OBJECTIVES = [
  { id: 1, name: "Le Libérateur", desc: "Contrôler 4+ hex non adjacents à votre HB", check: (p) => {
    const hb = HOME_BASES[p.faction];
    const hbAdj = new Set(ADJ[HEXES.reduce((best, h) => {
      const d = Math.sqrt((h.rx - hb.rx) ** 2 + (h.ry - hb.ry) ** 2);
      const db = best ? Math.sqrt((hMap[best].rx - hb.rx) ** 2 + (hMap[best].ry - hb.ry) ** 2) : Infinity;
      return d < db && h.t !== "lac" ? h.id : best;
    }, null)] || []);
    const controlled = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
    return [...controlled].filter(hid => !hbAdj.has(hid)).length >= 4;
  } },
  { id: 2, name: "L'Industriel", desc: "8+ ressources sur le plateau", check: (p) => {
    let total = 0; Object.values(p.resources).forEach(r => Object.values(r).forEach(n => total += n)); return total >= 8;
  } },
  { id: 3, name: "Le Diplomate", desc: "13+ Popularité", check: (p) => p.pop >= 13 },
  { id: 4, name: "Le Stratège", desc: "Contrôler Rouge River + 1 hex adjacent", check: (p) => {
    const units = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
    if (!units.has(22)) return false;
    return (ADJ[22] || []).some(adj => units.has(adj));
  } },
  { id: 5, name: "Le Bâtisseur", desc: "3 bâtiments sur 3 terrains différents", check: (p) => {
    if (!p.buildings || p.buildings.length < 3) return false;
    const terrains = new Set(p.buildings.map(b => hMap[b.hexId]?.t)); return terrains.size >= 3;
  } },
  { id: 6, name: "Le Nomade", desc: "Héros à 5+ hex de votre HB", check: (p) => {
    const hb = HOME_BASES[p.faction]; const hh = hMap[p.hero];
    if (!hh) return false;
    const d = Math.sqrt((hh.rx - hb.rx) ** 2 + (hh.ry - hb.ry) ** 2); return d >= 5 * 130;
  } },
  { id: 7, name: "Le Marchand", desc: "16+ pièces", check: (p) => p.coins >= 16 },
  { id: 8, name: "Le Guerrier", desc: "3+ mechas déployés", check: (p) => p.mechs.length >= 3 },
  { id: 9, name: "Le Réseau", desc: "2+ hex avec vos Mines", check: (p) => {
    if (!p.buildings) return false; return p.buildings.filter(b => b.type === "mine").length >= 2;
  } },
  { id: 10, name: "L'Éclaireur", desc: "2+ rencontres résolues", check: (p) => (p.encounters || 0) >= 2 },
  { id: 11, name: "Le Colonisateur", desc: "6+ ouvriers sur le plateau", check: (p) => p.workers.length >= 6 },
  { id: 12, name: "Le Fantôme", desc: "1+ unité et 2+ hex au-delà d'une rivière vs HB", check: (p) => {
    const hb = HOME_BASES[p.faction];
    const hbHex = HEXES.reduce((best, h) => {
      const d = Math.sqrt((h.rx - hb.rx) ** 2 + (h.ry - hb.ry) ** 2);
      const db = best ? Math.sqrt((hMap[best].rx - hb.rx) ** 2 + (hMap[best].ry - hb.ry) ** 2) : Infinity;
      return d < db && h.t !== "lac" ? h.id : best;
    }, null);
    const cluster = new Set([hbHex]); const queue = [hbHex];
    while (queue.length) {
      const cur = queue.shift();
      (ADJ[cur] || []).forEach(nb => { if (!cluster.has(nb) && !hasR(cur, nb)) { cluster.add(nb); queue.push(nb); } });
    }
    const units = new Set([p.hero, ...p.workers.map(w => w.hexId), ...p.mechs.map(m => m.hexId)]);
    const beyond = [...units].filter(hid => !cluster.has(hid));
    return beyond.length >= 1 && new Set(beyond).size >= 2;
  } },
];
