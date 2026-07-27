// Règle des rails actée en partie réelle : rouler sur le réseau coûte 1 PAS.
// Sans Vitesse on peut seulement se placer sur le réseau ; avec Vitesse il
// reste 1 pas pour en sortir. Monter à bord en cours de route n'ouvre pas le
// réseau ce tour-ci.
import { describe, it, expect } from 'vitest';
import { getValidMoves, getRailNetwork } from '../movement.js';

// Carte v3 chargée par défaut à l'import de hexes.js.
// Réseau de test : #11 ↔ #8 ↔ #12 ↔ #9 (posé par une Gare côté joueur).
const RAILS = [[11, 8], [8, 12], [12, 9]];
const stub = { workers: [], mechs: [], hero: 11 };

describe('déplacement par rail', () => {
  it('le réseau est connexe depuis #11', () => {
    expect([...getRailNetwork(11, RAILS, new Set())].sort((a, b) => a - b)).toEqual([8, 9, 11, 12]);
  });

  it('sans Vitesse (1 pas) : on atteint le réseau, pas au-delà', () => {
    const moves = new Set(getValidMoves(11, 'dominion', [], stub, RAILS, 'mech', new Set()));
    expect(moves.has(9)).toBe(true);   // bout du réseau : 1 pas
    expect(moves.has(16)).toBe(false); // adjacent à #9 : il faudrait un 2e pas
  });

  it('avec Vitesse (2 pas) : réseau + 1 pas de sortie', () => {
    const moves = new Set(getValidMoves(11, 'dominion', [0], stub, RAILS, 'mech', new Set()));
    expect(moves.has(16)).toBe(true);  // rail (1 pas) puis #9 → #16 (2e pas)
  });

  it("entrer sur un hex à rail en cours de route n'ouvre pas le réseau", () => {
    // #7 est hors réseau, adjacent à #11 (point d'embarquement potentiel).
    // Avec Vitesse : #7 → #11 (pas 1) puis un pas NORMAL (pas 2). Si monter
    // à bord en cours de route ouvrait le réseau, #12 et #9 seraient servis.
    const moves = new Set(getValidMoves(7, 'dominion', [0], stub, RAILS, 'mech', new Set()));
    expect(moves.has(11)).toBe(true);
    expect(moves.has(8)).toBe(true);   // #11 → #8 à pied (2e pas)
    expect(moves.has(12)).toBe(false); // réseau fermé en cours de route
    expect(moves.has(9)).toBe(false);
  });
});
