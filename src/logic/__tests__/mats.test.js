// Invariants des plateaux joueur — l'étoile « 6 Améliorations » doit rester
// atteignable sur chaque plateau (6 cubes en haut, 6 cases utiles en bas),
// quelle que soit la passe d'équilibrage en cours.
import { describe, it, expect } from 'vitest';
import { MATS, MATS_ORIGINAL, ALL_MATS, matById, maxBottomCubes, BOTTOM, getBottomCost } from '../../data/mats.js';
import { createPlayer } from '../player.js';

describe('plateaux joueur', () => {
  it.each(ALL_MATS.map(m => [m.name, m]))('%s : 6 cubes en haut', (_, mat) => {
    expect(mat.topCubes.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it.each(ALL_MATS.map(m => [m.name, m]))('%s : 6 cases d\'amélioration en bas (coût min 1)', (_, mat) => {
    const capacity = BOTTOM.map((_, i) => maxBottomCubes(mat, i)).reduce((a, b) => a + b, 0);
    expect(capacity).toBe(6);
  });

  it.each(ALL_MATS.map(m => [m.name, m]))('%s : coûts du bas complets et sains', (_, mat) => {
    expect(mat.bottomCosts).toHaveLength(4);
    mat.bottomCosts.forEach(bc => {
      expect(["petrole", "metal", "bois", "nourriture"]).toContain(bc.res);
      expect(bc.base).toBeGreaterThanOrEqual(2);
      expect(bc.base).toBeLessThanOrEqual(4);
      expect(bc.bonus).toBeGreaterThanOrEqual(0);
    });
  });
});

// Depuis v0.14, TOUS les plateaux (standard + originaux) suivent la grammaire
// du jeu de base : Σ coûts = 13, Σ bonus = 6$, cases du haut par action.
describe('grammaire du jeu original (tous plateaux)', () => {
  it.each(ALL_MATS.map(m => [m.name, m]))('%s : Σcoûts=13, Σbonus=6$', (_, mat) => {
    expect(mat.bottomCosts.reduce((a, bc) => a + bc.base, 0)).toBe(13);
    expect(mat.bottomCosts.reduce((a, bc) => a + (bc.bonus || 0), 0)).toBe(6);
  });

  it.each(ALL_MATS.map(m => [m.name, m]))('%s : cases du haut dictées par l\'action (Move 2, Bolster 2, Trade 1, Produce 1)', (_, mat) => {
    const expected = { Move: 2, Bolster: 2, Trade: 1, Produce: 1 };
    mat.topRow.forEach((a, i) => expect(mat.topCubes[i], `${mat.name} col ${a}`).toBe(expected[a]));
  });
});

describe('plateaux du jeu original (réserve campagne)', () => {
  it('7 plateaux, ids 101+, hors rotation standard, sans collision', () => {
    expect(MATS_ORIGINAL.length).toBe(7);
    MATS_ORIGINAL.forEach(m => { expect(m.id).toBeGreaterThanOrEqual(101); expect(m.original).toBe(true); });
    expect(new Set(ALL_MATS.map(m => m.id)).size).toBe(ALL_MATS.length);
    // la rotation standard (SetupScreen/startGame) n'en contient aucun,
    // et compte désormais 6 plateaux (un par faction — plus de doublon à 6)
    expect(MATS.length).toBe(6);
    MATS.forEach(m => expect(m.original).toBeUndefined());
  });

  it('un joueur créé sur un plateau original fonctionne (matById partout)', () => {
    const p = createPlayer('confederation', 107, false); // Militant
    expect(p.matName).toBe("Militant");
    expect(p.coins).toBe(4);
    expect(p.pop).toBe(3);
    const costs = getBottomCost(p);
    expect(costs.map(c => c.qty)).toEqual([3, 3, 4, 3]);
    expect(matById(107)?.name).toBe("Militant");
  });
});
