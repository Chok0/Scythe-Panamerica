import { FACTIONS } from '../data/factions.js';
import { HEXES, HOME_BASES, ADJ, CURRENT_MAP, hMap, homeBaseHex, factionBaseHexes } from '../data/hexes.js';
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
    // `startsOnBases` (Internationale Noire) : un ouvrier par base — elle en a
    // QUATRE (hexes.js, NETWORK_BASES). Comme un héros sur sa base, ils sont
    // visibles dès l'installation et sortent sur le plateau au premier tour.
    workers: f.startsOnBases
      ? factionBaseHexes(factionId).map((hid, i) => ({ id: `${factionId}_w${i}`, hexId: hid }))
      : (CURRENT_MAP.starts?.[factionId]?.workerHex ?? f.workerHex).map((hid, i) => ({ id: `${factionId}_w${i}`, hexId: hid })),
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
    // Elle se replie sur SES BASES comme tout le monde — elle en a quatre, et
    // c'est le joueur qui désigne laquelle (`retreatBaseIds` ci-dessous).
    // `reserve` ne subsiste que comme filet de `retreatFromHex` : aucune
    // faction du jeu n'y tombe.
    reserve: 0,
    // Capacités VOLÉES avec un mecha capturé : provenance des slots 2 et 3
    // (combat / position). Le slot 0 (Vitesse) est commun, sans provenance.
    stolenCombat: null, stolenPosition: null,
  };
};

// ── Bases de repli ────────────────────────────────────────────────────────
// Toute faction se replie sur UNE BASE, l'Internationale Noire comprise : la
// seule différence est qu'elle en a quatre, donc un CHOIX (arbitrage du
// 11/08 ; la première version l'envoyait dans une réserve hors-plateau —
// mécanique parallèle que rien ne justifiait, et que le joueur ne pouvait pas
// deviner : ses pions disparaissaient de la carte).
export const retreatBaseIds = (factionId) => factionBaseHexes(factionId);

/** Base de repli PAR DÉFAUT : la seule pour six factions, la plus proche du
 *  hex perdu pour l'Internationale Noire — le joueur peut ensuite en choisir
 *  une autre (aucune n'est plus « juste » qu'une autre, mais il faut bien
 *  poser les pions quelque part avant qu'il tranche). */
export const defaultRetreatBase = (factionId, fromHexId) => {
  const ids = retreatBaseIds(factionId);
  if (ids.length <= 1) return ids[0] ?? null;
  const from = HEXES.find(h => h.id === fromHexId);
  if (!from) return ids[0];
  return ids.reduce((best, id) => {
    const b = hMap[id], cur = hMap[best];
    if (!b) return best;
    const d = (b.rx - from.rx) ** 2 + (b.ry - from.ry) ** 2;
    const db = cur ? (cur.rx - from.rx) ** 2 + (cur.ry - from.ry) ** 2 : Infinity;
    return d < db ? id : best;
  }, ids[0]);
};

// ── Retraite d'un hex ─────────────────────────────────────────────────────
// Défaite, dispersion par une patrouille, ouvriers chassés : les unités
// présentes sur `hexId` quittent le plateau vers la base de la faction.
// `baseHexId` à `null` est un FILET, pas une règle : une faction qui n'aurait
// aucune base laisserait sinon ses unités sur l'hex qu'elle vient de perdre.
// Elles partent alors hors-plateau, dans une réserve jamais capturable.
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

/** Hex de SORTIE d'une base : ce vers quoi une unité posée dessus peut faire
 *  son premier pas. Exactement la règle des six autres factions — la base est
 *  un hex hors plateau relié à ses hex de départ (data/hexes.js, `loadMap`).
 *  L'Internationale Noire en a quatre, donc quatre portes : en étouffer une
 *  ne ferme que celle-là. */
export const baseExits = (factionId) => {
  const out = new Set();
  factionBaseHexes(factionId).forEach(bid => (ADJ[bid] || []).forEach(id => {
    const h = HEXES.find(x => x.id === id);
    if (h && !h.base) out.add(id);
  }));
  return [...out];
};
