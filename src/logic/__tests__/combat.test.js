// ── Qui remporte le combat ? ──────────────────────────────────────────────
// Règle du jeu original (p. 22, reprise dans data/rules.js) : le plus haut
// total gagne, et « les égalités sont remportées par le joueur ATTAQUANT ».
// Verrou posé après la partie du 19/08 : contre l'Empire, les deux branches
// du ternaire de resolveCombat étaient identiques — le joueur remportait les
// égalités même quand c'était la patrouille impériale qui l'attaquait.
import { describe, it, expect } from 'vitest';
import { playerWinsCombat } from '../../data/combat.js';

describe('égalités : elles vont à l\'attaquant', () => {
  it('le joueur attaque : l\'égalité lui revient', () => {
    expect(playerWinsCombat(6, 6, false)).toBe(true);
    expect(playerWinsCombat(7, 6, false)).toBe(true);
    expect(playerWinsCombat(5, 6, false)).toBe(false);
  });

  it('le joueur défend (Empire ou bot attaquant) : l\'égalité lui échappe', () => {
    expect(playerWinsCombat(6, 6, true)).toBe(false);   // le cas signalé en partie
    expect(playerWinsCombat(7, 6, true)).toBe(true);
    expect(playerWinsCombat(5, 6, true)).toBe(false);
  });

  it('0 contre 0 : celui qui vient chercher le hex l\'obtient', () => {
    expect(playerWinsCombat(0, 0, false)).toBe(true);
    expect(playerWinsCombat(0, 0, true)).toBe(false);
  });
});
