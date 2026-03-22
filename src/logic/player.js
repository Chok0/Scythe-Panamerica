import { FACTIONS } from '../data/factions.js';
import { HEXES, HOME_BASES } from '../data/hexes.js';
import { MATS } from '../data/mats.js';

export const createPlayer = (factionId, matId, isBot) => {
  const f = FACTIONS[factionId], pm = MATS.find(m => m.id === matId), hb = HOME_BASES[factionId];
  const heroHex = HEXES.reduce((best, h) => {
    const d = Math.sqrt((h.rx - hb.rx) ** 2 + (h.ry - hb.ry) ** 2);
    const db = best ? Math.sqrt((best.rx - hb.rx) ** 2 + (best.ry - hb.ry) ** 2) : Infinity;
    return d < db && h.t !== "lac" && h.t !== "marecage" ? h : best;
  }, null);
  return {
    faction: factionId, matId, isBot,
    power: f.power, combatCards: f.cards, pop: pm.pop, coins: pm.coins,
    stars: 0, hero: heroHex.id,
    workers: f.workerHex.map((hid, i) => ({ id: `${factionId}_w${i}`, hexId: hid })),
    mechs: [], resources: {}, lastCol: null, buildings: [], encounters: 0,
    unlockedAbilities: [],
    topRow: pm.topRow, matName: pm.name,
    cubesOnTop: [...(pm.topCubes || [1, 2, 1, 2])], cubesOnBottom: [0, 0, 0, 0],
    enlistMap: [false, false, false, false],
    objectiveChoices: null, objective: null, objectiveRevealed: false, fObjRevealed: false,
    capturedWorkers: 0, capturedMech: 0, empireKills: 0, trapTokens: [], flagTokens: [], imperialCoins: 0,
    upgrades: 0, recruits: 0, combatWins: 0,
    starUpgrades: false, starMechs: false, starBuildings: false, starRecruits: false,
    fragments: 0, visitedRR: false, factoryCard: null,
  };
};
