// Estimation du score final (gestion de la 6e étoile) : doit suivre la table
// de scoring — étoiles/territoires/paires × palier de pop, + pièces, + 2$
// par comptoir Acadiane.
import { describe, it, expect } from 'vitest';
import { estimateScore } from '../bot.js';

const base = () => ({
  stars: 2, pop: 13, coins: 3, hero: 11,
  workers: [{ id: 'w0', hexId: 8 }], mechs: [], buildings: [],
  resources: { 11: { metal: 4 } }, flagTokens: [],
});

describe('estimateScore', () => {
  it('palier haut : étoiles ×5, territoires ×4, paires ×3', () => {
    // 2⭐×5 + 2 territoires ×4 + 2 paires ×3 + 3$ = 10+8+6+3
    expect(estimateScore(base())).toBe(27);
  });

  it('palier bas : mêmes composants, multiplicateurs réduits', () => {
    // 2⭐×3 + 2×2 + 2×1 + 3$ = 6+4+2+3
    expect(estimateScore({ ...base(), pop: 5 })).toBe(15);
  });

  it('les comptoirs comptent en territoire ET en pièces (+2$ chacun)', () => {
    const p = { ...base(), flagTokens: [{ hexId: 30 }, { hexId: 26 }] };
    // base 27 + 2 comptoirs ×4 (territoire palier haut) + 2×2$ = 27+8+4
    expect(estimateScore(p)).toBe(39);
  });
});
