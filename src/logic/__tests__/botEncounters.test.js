// Rencontres des bots : préservation du palier de popularité (corpus :
// « don't spend popularity in encounters ») et deck sans remise.
import { describe, it, expect } from 'vitest';
import { resolveBotEncounter } from '../botEncounters.js';
import { ENCOUNTERS } from '../../data/encounters.js';

// « La Mine Abandonnée » : +1 pop/+2 métal (gratuit), -2$/+4 métal, -2 pop/+2 ouvriers
const MINE = ENCOUNTERS.find(e => e.name === 'La Mine Abandonnée');

const stubPlayer = () => ({
  faction: 'frente', botProfile: 'equilibre',
  pop: 7, coins: 0, power: 5, combatCards: 2, stars: 0,
  hero: 41, workers: [{ id: 'w0', hexId: 41 }], mechs: [], buildings: [],
  resources: {}, unlockedAbilities: [], recruits: 0,
  enlistMap: [null, null, null, null],
});

describe('rencontres des bots', () => {
  it('ne descend jamais sous le palier de pop visé quand une option sûre existe', () => {
    // pop 7, profil équilibré (palier 7) : l'option -2 pop (→5) est interdite,
    // l'option -2$ est impayable → seule l'option gratuite reste
    for (let i = 0; i < 25; i++) {
      const { player } = resolveBotEncounter(stubPlayer(), [MINE]);
      expect(player.pop).toBeGreaterThanOrEqual(7);
    }
  });

  it('accepte de payer en pop si le palier du profil le permet', () => {
    // blitz (palier 3) avec pop 12 : les options -2 pop redeviennent éligibles
    let sawPopSpend = false;
    for (let i = 0; i < 60; i++) {
      const p = { ...stubPlayer(), botProfile: 'blitz', pop: 12 };
      const { player } = resolveBotEncounter(p, [MINE]);
      if (player.pop < 12) sawPopSpend = true;
    }
    expect(sawPopSpend).toBe(true);
  });

  it('tire dans le deck fourni SANS remise', () => {
    const deck = [MINE, ENCOUNTERS[0]];
    resolveBotEncounter(stubPlayer(), deck);
    expect(deck).toHaveLength(1);
    expect(deck[0]).toBe(ENCOUNTERS[0]);
  });
});
