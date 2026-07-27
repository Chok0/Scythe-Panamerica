// Cartes de combat valuées : la main matérialisée suit le compteur, et la
// dépense de cartes précises retire exactement les valeurs choisies.
import { describe, it, expect } from 'vitest';
import { reconcileHand, topCardsSum, spendPickedCards } from '../cards.js';

describe('cartes de combat', () => {
  it('reconcileHand aligne la main sur le compteur (valeurs 1-5)', () => {
    const p = { combatCards: 3, cardHand: [] };
    reconcileHand(p);
    expect(p.cardHand).toHaveLength(3);
    p.cardHand.forEach(v => { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(5); });
  });

  it('topCardsSum somme les n plus fortes', () => {
    expect(topCardsSum([2, 5, 3], 2)).toBe(8);
    expect(topCardsSum([2, 5, 3], 0)).toBe(0);
  });

  it('spendPickedCards retire les valeurs choisies et resynchronise le compteur', () => {
    const p = { combatCards: 3, cardHand: [5, 3, 2] };
    spendPickedCards(p, [3]);
    expect(p.cardHand.sort((a, b) => b - a)).toEqual([5, 2]);
    expect(p.combatCards).toBe(2);
  });
});
