import { FACTIONS } from '../data/factions.js';
import { HEXES, hMap, ADJ, hasR } from '../data/hexes.js';
import { FACTORY_RR_HEX } from '../data/plans.js';

// BFS: find all hexes connected to fromId via rail network.
// blockedHexes (hexes occupés par l'ennemi) : un nœud bloqué reste une
// DESTINATION possible (y entrer = combat/déplacement d'ouvriers) mais la
// ligne ne se prolonge pas au travers — pas de saut par-dessus une unité.
export const getRailNetwork = (fromId, rails, blockedHexes) => {
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
        if (!(blockedHexes && blockedHexes.has(next))) queue.push(next);
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
    // Marécage : franchissable par tous (règle du péage — voir marshToll) ;
    // l'arrêt forcé est géré dans getValidMoves/findPathWaypoints.
    if (adj.includes(toId) && hasR(fromId, toId)) {
      if (ignoreRivers) return true;
      // L'Usine Rouge River a ses ponts : toujours accessible malgré les
      // rivières (aucune faction n'a « factory » dans son riverwalk, sinon
      // l'approche par l'hex 26 était un cul-de-sac)
      if (to.t === "factory") return true;
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
// Rail rules — il faut être À BORD pour rouler :
//   - Si l'unité COMMENCE son déplacement sur le réseau : téléportation gratuite
//     vers tout hex relié, puis déplacement normal.
//   - Entrer sur un hex à rail en cours de déplacement ne donne PAS accès au
//     réseau dans le même déplacement (on monte à bord un tour, on roule au
//     suivant) — avant, un pas sur le rail ouvrait tout le réseau au pas
//     suivant, bug constaté en partie réelle.
// blockedHexes : hexes occupés par des unités ennemies (toutes) — on peut y
// ENTRER (destination : combat / déplacement d'ouvriers) mais jamais les
// TRAVERSER ni continuer après (règle Scythe : entrer chez l'ennemi termine
// le déplacement de l'unité). Constaté en partie réelle : saut par-dessus le
// héros Frente via le réseau de rails, avec dépose d'ouvrier au passage.
export const getValidMoves = (fromId, factionId, abilities, player, rails, unitType, blockedHexes) => {
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
    // Arrêt forcé sur marécage ou hex ennemi : l'hex est atteignable mais ne
    // ré-alimente pas la frontière — impossible de le traverser sans s'y arrêter.
    const reach = (id) => {
      if (id !== fromId && !all.has(id)) {
        all.add(id);
        if (hMap[id]?.t !== "marecage" && !(blockedHexes && blockedHexes.has(id))) next.push(id);
      }
    };
    frontier.forEach(fid => {
      // Réseau de rails : uniquement depuis l'hex de DÉPART du déplacement
      const railNet = s === 0 ? getRailNetwork(fid, rails, blockedHexes) : null;
      const origins = railNet ? [...railNet].filter(id => id === fid || !(blockedHexes && blockedHexes.has(id))) : [fid];
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

// ── Péage de marécage ──
// Tout le monde peut entrer sur un marécage, mais la traversée se paie :
//   -1 popularité par OUVRIER qui y entre, -1 puissance par unité de COMBAT
//   (héros ou mecha) — les ouvriers transportés par un mecha paient aussi.
// Mute `p` en place et rend un libellé de log ("" si pas de marécage).
export const marshToll = (p, toId, unitType, carriedWorkers = 0) => {
  if (hMap[toId]?.t !== "marecage") return "";
  const parts = [];
  if (unitType === "worker") {
    p.pop = Math.max(0, p.pop - 1);
    parts.push("-1♥");
  } else {
    p.power = Math.max(0, p.power - 1);
    parts.push("-1⚡");
    if (carriedWorkers > 0) {
      p.pop = Math.max(0, p.pop - carriedWorkers);
      parts.push(`-${carriedWorkers}♥`);
    }
  }
  return `≋ péage marécage #${toId} : ${parts.join(" ")}`;
};

// ── Trajet : reconstitue les ÉTAPES d'un déplacement from→to ──
// Rend les hexes intermédiaires (hors départ/arrivée) où l'unité « passe » :
// c'est là qu'un mech peut DÉPOSER un ouvrier ou du matériel en cours de route
// (stratégie classique : relais de mechas, dépôt avant bataille, expansion).
// BFS sur le même graphe que getValidMoves : pas normaux + bonds de rail.
// blockedHexes : hexes ennemis — jamais traversés (destination possible).
export const findPathWaypoints = (fromId, toId, factionId, abilities, player, rails, blockedHexes) => {
  if (fromId === toId) return [];
  const prev = new Map([[fromId, null]]);
  const queue = [fromId];
  let found = false;
  while (queue.length > 0 && !found) {
    const cur = queue.shift();
    // Un marécage ou un hex ennemi ne peut pas être traversé (arrêt forcé) :
    // on n'étend pas le chemin depuis là, sauf s'il est l'hex de départ.
    if (cur !== fromId && (hMap[cur]?.t === "marecage" || (blockedHexes && blockedHexes.has(cur)))) continue;
    const nexts = new Set(getValidMoves1Step(cur, factionId, abilities, player, rails));
    // Même règle que getValidMoves : le réseau de rails ne s'emprunte que
    // depuis l'hex de DÉPART (à bord dès le début), pas en cours de route
    const rn = cur === fromId ? getRailNetwork(cur, rails, blockedHexes) : null;
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
