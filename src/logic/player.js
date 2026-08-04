import { FACTIONS } from '../data/factions.js';
import { HEXES, HOME_BASES, ADJ, CURRENT_MAP, homeBaseHex } from '../data/hexes.js';
import { matById } from '../data/mats.js';
import { drawCardValue } from './cards.js';

export const createPlayer = (factionId, matId, isBot) => {
  const f = FACTIONS[factionId], pm = matById(matId);
  // Le héros démarre SUR la base (hex invisible sous le drapeau), hors plateau.
  const base = homeBaseHex(factionId);
  return {
    faction: factionId, matId, isBot,
    power: f.power, combatCards: f.cards,
    // Main de cartes de combat valuées (matérialisée depuis le compteur)
    cardHand: Array.from({ length: f.cards }, () => drawCardValue()),
    // Règle Scythe : popularité et pièces de départ viennent du plateau joueur
    // SEUL — la fiche de faction ne porte que le militaire (puissance/cartes).
    pop: pm.pop,
    coins: pm.coins,
    // L'Internationale Noire n'a PAS de héros (fiche §1) : `hero: null` est
    // le marqueur lu partout ailleurs — contrôle, combats, rencontres,
    // visite de l'Usine, retraite. Les autres factions démarrent sur leur
    // base (hex hors plateau, sous le drapeau).
    stars: 0, hero: f.noHero ? null : (base ? base.id : (CURRENT_MAP.starts?.[factionId]?.workerHex ?? f.workerHex)[0]),
    workers: (CURRENT_MAP.starts?.[factionId]?.workerHex ?? f.workerHex).map((hid, i) => ({ id: `${factionId}_w${i}`, hexId: hid })),
    mechs: [], resources: {}, lastCol: null, buildings: [], encounters: 0,
    unlockedAbilities: [],
    topRow: pm.topRow, matName: pm.name,
    cubesOnTop: [...(pm.topCubes || [1, 2, 1, 2])], cubesOnBottom: [0, 0, 0, 0],
    // enlistMap[col] = indice de la recrue PERMANENTE posée sur cette colonne
    // (0-3, décorrélé du bonus immédiat), ou null si la colonne est vide.
    enlistMap: [null, null, null, null],
    objectives: [], objective: null, objectiveRevealed: false, revealedObjectiveIdx: null, fObjRevealed: false,
    capturedWorkers: 0, capturedMech: 0, empireKills: 0, trapTokens: [], flagTokens: [], imperialCoins: 0,
    // Ouvriers ennemis « fait fuir » (déplacement d'ouvriers seuls, hors
    // combat) — objectif « L'Intimidation » du deck original (campagne)
    scaredWorkers: 0,
    upgrades: 0, recruits: 0, combatWins: 0,
    starUpgrades: false, starMechs: false, starBuildings: false, starRecruits: false,
    // Rouge River : fragments Tesla, visite unique, carte d'usine (5e colonne
    // d'action — voir data/plans.js et logic/factory.js)
    fragments: 0, visitedRR: false, factoryCard: null,
    // ── Internationale Noire ────────────────────────────────────────────
    // `reserve` : ouvriers hors-plateau (jamais capturables). Un ouvrier
    // vaincu ou dispersé y retourne au lieu de rentrer sur une base — la
    // faction n'en a pas — et revient ensuite adjacent à un point d'ancrage.
    reserve: 0,
    // Capacités VOLÉES avec un mecha capturé : provenance des slots 2 et 3
    // (combat / position). Le slot 0 (Vitesse) est commun, sans provenance.
    stolenCombat: null, stolenPosition: null,
  };
};

// ── Retraite d'un hex ─────────────────────────────────────────────────────
// Défaite, dispersion par une patrouille, ouvriers chassés : les unités
// présentes sur `hexId` quittent le plateau vers la base de la faction.
// L'Internationale Noire n'a PAS de base (fiche §3) : ses unités passent en
// RÉSERVE hors-plateau — jamais capturable, c'est ce qui la rend plus
// résiliente au blocage qu'une faction normale — et rentreront ensuite
// adjacent à l'un de ses quatre points d'ancrage.
// Pur : renvoie un NOUVEAU joueur, jamais mutation en place.
export const retreatFromHex = (p, hexId, baseHexId, { units = true, workers = true } = {}) => {
  const hasBase = baseHexId != null;
  const next = { ...p, workers: [...(p.workers || [])], mechs: [...(p.mechs || [])] };
  let toReserve = 0, mechsToReserve = 0;
  if (units) {
    if (next.hero != null && next.hero === hexId && hasBase) next.hero = baseHexId;
    next.mechs = next.mechs.map(m => {
      if (m.hexId !== hexId) return m;
      if (hasBase) return { ...m, hexId: baseHexId };
      mechsToReserve++; return null;
    }).filter(Boolean);
  }
  if (workers) {
    next.workers = next.workers.map(w => {
      if (w.hexId !== hexId) return w;
      if (hasBase) return { ...w, hexId: baseHexId };
      toReserve++; return null;
    }).filter(Boolean);
  }
  next.reserve = (p.reserve || 0) + toReserve;
  next.reserveMechs = (p.reserveMechs || 0) + mechsToReserve;
  return { player: next, toReserve, mechsToReserve };
};

/** Hex où une unité en réserve peut rentrer : adjacents aux points d'ancrage
 *  (jamais un lac, une base ou un hex tenu par l'ennemi). Occuper un ancrage
 *  ne ferme que CE point d'entrée — étouffer la faction exige de tenir les
 *  quatre simultanément. */
export const reentryHexes = (p, enemyHexes) => {
  const anchors = FACTIONS[p?.faction]?.anchors;
  if (!anchors) return [];
  const out = new Set();
  anchors.forEach(a => {
    if (enemyHexes?.has(a)) return; // ancrage occupé : cette porte est fermée
    [a, ...(ADJ[a] || [])].forEach(id => {
      const h = HEXES.find(x => x.id === id);
      if (!h || h.base || h.t === "lac") return;
      if (enemyHexes?.has(id)) return;
      out.add(id);
    });
  });
  return [...out];
};
