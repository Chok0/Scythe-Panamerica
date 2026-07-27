// Invariants des plateaux joueur — l'étoile « 6 Améliorations » doit rester
// atteignable sur chaque plateau (6 cubes en haut, 6 cases utiles en bas),
// quelle que soit la passe d'équilibrage en cours.
import { describe, it, expect } from 'vitest';
import { MATS, maxBottomCubes, BOTTOM } from '../../data/mats.js';

describe('plateaux joueur', () => {
  it.each(MATS.map(m => [m.name, m]))('%s : 6 cubes en haut', (_, mat) => {
    expect(mat.topCubes.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it.each(MATS.map(m => [m.name, m]))('%s : 6 cases d\'amélioration en bas (coût min 1)', (_, mat) => {
    const capacity = BOTTOM.map((_, i) => maxBottomCubes(mat, i)).reduce((a, b) => a + b, 0);
    expect(capacity).toBe(6);
  });

  it.each(MATS.map(m => [m.name, m]))('%s : coûts du bas complets et sains', (_, mat) => {
    expect(mat.bottomCosts).toHaveLength(4);
    mat.bottomCosts.forEach(bc => {
      expect(["petrole", "metal", "bois", "nourriture"]).toContain(bc.res);
      expect(bc.base).toBeGreaterThanOrEqual(2);
      expect(bc.base).toBeLessThanOrEqual(4);
      expect(bc.bonus).toBeGreaterThanOrEqual(0);
    });
  });
});
