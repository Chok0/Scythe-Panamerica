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
  // `pf` : faction dont on tient la capacité de position. L'Internationale
  // Noire VOLE celle du mecha qu'elle capture (`stolenPosition`) — le reste
  // du roster joue toujours la sienne.
  const pf = player?.stolenPosition || factionId;
  if (hasPosition) {
    // Tunnels (Internationale Noire) : le réseau clandestin relie ses quatre
    // points d'ancrage — c'est l'équivalent du bond marais↔marais du Bayou,
    // sur des hex fixes au lieu d'un terrain.
    if (factionId === "internationale") {
      const anchors = FACTIONS.internationale?.anchors || [];
      if (anchors.includes(fromId))
        anchors.forEach(a => { if (a !== fromId && !cands.includes(a)) cands.push(a); });
    }
    if (pf === "bayou" && from.t === "marecage")
      HEXES.forEach(h => { if (h.t === "marecage" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
    if (pf === "frente" && from.t === "sierra")
      HEXES.forEach(h => { if (h.t === "sierra" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
    if (pf === "confederation" && player) {
      const unitHexes = new Set([player.hero, ...player.workers.map(w => w.hexId), ...player.mechs.map(m => m.hexId)]);
      const ctrlVillages = HEXES.filter(h => h.t === "village" && unitHexes.has(h.id)).map(h => h.id);
      if (from.t === "village" || from.t === "factory") {
        ctrlVillages.forEach(v => { if (v !== fromId && !cands.includes(v)) cands.push(v); });
        if (fromId !== FACTORY_RR_HEX && !cands.includes(FACTORY_RR_HEX)) cands.push(FACTORY_RR_HEX);
      }
      if (fromId === FACTORY_RR_HEX)
        ctrlVillages.forEach(v => { if (!cands.includes(v)) cands.push(v); });
    }
    if (pf === "acadiane" && from.t === "lac")
      HEXES.forEach(h => { if (h.t === "lac" && h.id !== fromId && !cands.includes(h.id)) cands.push(h.id); });
  }

  return cands.filter(toId => {
    const to = hMap[toId]; if (!to) return false;
    // Hex de base : JAMAIS une destination volontaire. C'est le point hors
    // plateau où l'on atterrit en attendant de rentrer — on n'y va pas, on y
    // est renvoyé (retraite, défaite). On en SORT normalement : seules les
    // destinations sont filtrées ici, `ADJ[base]` reste praticable.
    // Corrige au passage un raccourci involontaire : la base touchant les DEUX
    // hex de départ, elle offrait un passage start1 → base → start2 en 2 pas.
    if (to.base) return false;
    if (to.t === "lac") return hasPosition && pf === "acadiane";
    // Marécage : franchissable par tous (règle du péage — voir marshToll) ;
    // l'arrêt forcé est géré dans getValidMoves/findPathWaypoints.
    if (adj.includes(toId) && hasR(fromId, toId)) {
      // L'Usine Rouge River a ses ponts : toujours accessible malgré les
      // rivières (aucune faction n'a « factory » dans son riverwalk, sinon
      // l'approche par l'hex 26 était un cul-de-sac)
      if (to.t === "factory") return true;
      // La Nage (Internationale Noire) : capacité de FACTION, active dès le
      // tour 1, ouvriers compris — toutes les rivières, sans condition de
      // terrain. Elle REMPLACE le riverwalk (le slot 1 sert aux Passeurs).
      if (f.swim) return true;
      if (hasRiverwalk) return f.riverwalk.includes(to.t);
      return false;
    }
    return true;
  });
};

// Full movement: N pas, chaque pas étant SOIT un hex adjacent, SOIT un trajet
// ferroviaire depuis l'hex courant.
// Steps = 1, +1 avec Speed (slot 0), + bonusSteps (déplacement du BAS d'une
// carte d'usine : 2 hex de base au lieu d'1 → bonusSteps=1).
// Rail rules (arbitrage du 03/08) — le rail est un PAS comme un autre :
//   - Depuis un hex du réseau, un pas mène n'importe où sur la composante
//     connexe (« 1 pas pour rouler »). Pas de téléport gratuit : rouler
//     consomme le pas.
//   - Cette règle vaut à CHAQUE pas, pas seulement au départ : monter à bord
//     en cours de déplacement ouvre le réseau pour le pas suivant (mech
//     Vitesse : hex voisin sur rail, puis n'importe où sur le réseau), et
//     rouler puis sortir reste possible dans l'autre sens.
//   - Corollaire : la même règle s'applique aux pas d'un déplacement
//     DÉCOMPOSÉ (continuation) — voir App.jsx `validMoves`.
// blockedHexes : hexes occupés par des unités ennemies (toutes) — on peut y
// ENTRER (destination : combat / déplacement d'ouvriers) mais jamais les
// TRAVERSER ni continuer après (règle Scythe : entrer chez l'ennemi termine
// le déplacement de l'unité). Constaté en partie réelle : saut par-dessus le
// héros Frente via le réseau de rails, avec dépose d'ouvrier au passage.
export const getValidMoves = (fromId, factionId, abilities, player, rails, unitType, blockedHexes, bonusSteps = 0) => {
  // Vitesse (slot 0) ne concerne que le héros et les mechas (règle Scythe) :
  // un ouvrier reste à 1 pas. Constaté en partie (28/07) : un ouvrier sur
  // rail enchaînait réseau + 1 pas de sortie grâce à la Vitesse du joueur.
  const abil = abilities || [];
  const hasSpeed = unitType !== "worker" && abil.includes(0);
  // Passeurs (Internationale Noire, slot 1 — le riverwalk est libéré par La
  // Nage) : la seule capacité du jeu qui accélère les OUVRIERS. C'est la
  // réponse au frein structurel de la faction, dont toute la puissance vient
  // d'un regroupement lent et visible.
  const hasPasseurs = unitType === "worker" && factionId === "internationale" && abil.includes(1);
  const steps = (hasSpeed || hasPasseurs ? 2 : 1) + bonusSteps;

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
      // Réseau de rails : depuis TOUT hex du réseau atteint à ce stade, et
      // rouler consomme le pas courant — les nœuds atteints entrent dans la
      // frontière du pas suivant (on peut donc en ressortir avec le pas d'après)
      const railNet = getRailNetwork(fid, rails, blockedHexes);
      if (railNet) railNet.forEach(reach);
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
    // Même règle que getValidMoves : le réseau s'emprunte depuis tout hex du
    // réseau atteint en chemin (le rail est un pas comme un autre)
    const rn = getRailNetwork(cur, rails, blockedHexes);
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
