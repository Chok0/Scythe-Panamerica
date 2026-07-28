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

// « Sang du Marais » (Bayou) : le marécage est sa ROUTE, pas un obstacle —
// ni péage ni arrêt forcé, et ce dès le tour 1 (capacité de FACTION, pas de
// mecha : c'est l'analogue du « Seaworthy » nordique du jeu original).
// Le mecha Pirogue (slot 3) reste l'étage au-dessus : le bond marais↔marais.
export const marshFree = (factionId) => factionId === "bayou";

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
    // Hex de base : seul son propriétaire peut y entrer (retraite/départ)
    if (to.base) return to.faction === factionId;
    if (to.t === "lac") return hasPosition && factionId === "acadiane";
    // Marécage : franchissable par tous (règle du péage — voir marshToll) ;
    // l'arrêt forcé est géré dans getValidMoves/findPathWaypoints.
    if (adj.includes(toId) && hasR(fromId, toId)) {
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

// Full movement: rail (1 pas) + N steps.
// Steps = 1, +1 avec Speed (slot 0), + bonusSteps (déplacement du BAS d'une
// carte d'usine : 2 hex de base au lieu d'1 → bonusSteps=1).
// Rail rules — il faut être À BORD pour rouler :
//   - Si l'unité COMMENCE son déplacement sur le réseau : rouler COÛTE 1 PAS
//     (« 1 move pour se placer n'importe où sur le réseau, 1 move de plus pour
//     en sortir ») — le téléport gratuit d'avant laissait un mech filer de
//     #11 à #30 dans le même tour, incohérence constatée en partie réelle.
//   - Entrer sur un hex à rail en cours de déplacement ne donne PAS accès au
//     réseau dans le même déplacement (on monte à bord un tour, on roule au
//     suivant) — avant, un pas sur le rail ouvrait tout le réseau au pas
//     suivant, bug constaté en partie réelle.
// blockedHexes : hexes occupés par des unités ennemies (toutes) — on peut y
// ENTRER (destination : combat / déplacement d'ouvriers) mais jamais les
// TRAVERSER ni continuer après (règle Scythe : entrer chez l'ennemi termine
// le déplacement de l'unité). Constaté en partie réelle : saut par-dessus le
// héros Frente via le réseau de rails, avec dépose d'ouvrier au passage.
export const getValidMoves = (fromId, factionId, abilities, player, rails, unitType, blockedHexes, bonusSteps = 0) => {
  const hasSpeed = abilities && abilities.includes(0);
  const steps = (hasSpeed ? 2 : 1) + bonusSteps;

  const all = new Set();
  let frontier = [fromId];
  for (let s = 0; s < steps; s++) {
    const next = [];
    // Arrêt forcé sur marécage ou hex ennemi : l'hex est atteignable mais ne
    // ré-alimente pas la frontière — impossible de le traverser sans s'y arrêter.
    const reach = (id) => {
      if (id !== fromId && !all.has(id)) {
        all.add(id);
        const stopsHere = hMap[id]?.t === "marecage" && !marshFree(factionId);
        if (!stopsHere && !(blockedHexes && blockedHexes.has(id))) next.push(id);
      }
    };
    frontier.forEach(fid => {
      // Réseau de rails : uniquement depuis l'hex de DÉPART du déplacement,
      // et rouler consomme le pas courant — les nœuds atteints entrent dans
      // la frontière du pas suivant (plus de « téléport + pas » gratuits)
      if (s === 0) {
        const railNet = getRailNetwork(fid, rails, blockedHexes);
        if (railNet) railNet.forEach(reach);
      }
      getValidMoves1Step(fid, factionId, abilities, player, rails).forEach(reach);
    });
    frontier = next;
  }

  return [...all];
};

// ── Péage de marécage ──
// Tout le monde peut entrer sur un marécage, mais la traversée se paie :
//   -1 popularité par OUVRIER qui y entre, -1 puissance par unité de COMBAT
//   (héros ou mecha) — les ouvriers transportés par un mecha paient aussi.
// Exception : le Bayou (Sang du Marais) ne paie rien et ne s'arrête pas.
// Mute `p` en place et rend un libellé de log ("" si pas de marécage).
export const marshToll = (p, toId, unitType, carriedWorkers = 0) => {
  if (hMap[toId]?.t !== "marecage") return "";
  if (marshFree(p?.faction)) return `≋ Sang du Marais : traversée du marécage #${toId} sans péage`;
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
    if (cur !== fromId && ((hMap[cur]?.t === "marecage" && !marshFree(factionId)) || (blockedHexes && blockedHexes.has(cur)))) continue;
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
