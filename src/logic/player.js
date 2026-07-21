import { FACTIONS } from '../data/factions.js';
import { HEXES, HOME_BASES, CURRENT_MAP, homeBaseHex } from '../data/hexes.js';
import { MATS } from '../data/mats.js';
import { drawCardValue } from './cards.js';

export const createPlayer = (factionId, matId, isBot) => {
  const f = FACTIONS[factionId], pm = MATS.find(m => m.id === matId);
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
    stars: 0, hero: base ? base.id : (CURRENT_MAP.starts?.[factionId]?.workerHex ?? f.workerHex)[0],
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
    upgrades: 0, recruits: 0, combatWins: 0,
    starUpgrades: false, starMechs: false, starBuildings: false, starRecruits: false,
    fragments: 0, visitedRR: false, factoryCard: null,
  };
};
