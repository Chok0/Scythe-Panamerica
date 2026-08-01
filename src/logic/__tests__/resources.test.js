import { describe, it, expect } from 'vitest';
import { countRes, canPayMixed, mixedSplit, spendMixed } from '../resources.js';
import { createPlayer } from '../player.js';
import { FACTIONS } from '../../data/factions.js';

// Arbitrage du 01/08 : Esprit Sauvage (Nations, bois) et Vapeur des Lacs
// (Acadiane, pétrole) autorisent la substitution PARTIELLE — on remplace
// autant d'unités de la ressource primaire qu'on veut par l'alternative.
const withRes = (fac, res) => {
  const p = createPlayer(fac, 1, false);
  p.resources = { 10: { ...res } };
  return p;
};

describe('paiement mixte (Esprit Sauvage / Vapeur des Lacs)', () => {
  it('le cas exact du journal : 3 métal + 1 bois paient un Deploy à 4', () => {
    const p = withRes('nations', { metal: 3, bois: 1 });
    // Ancien comportement : chaque pile prise séparément était insuffisante
    expect(countRes(p, 'metal')).toBeLessThan(4);
    expect(countRes(p, 'bois')).toBeLessThan(4);
    // Nouveau : le total suffit
    expect(canPayMixed(p, 'metal', 'bois', 4)).toBe(true);
    expect(mixedSplit(p, 'metal', 'bois', 4)).toEqual({ metal: 3, bois: 1 });
    const after = spendMixed(p, 'metal', 'bois', 4);
    expect(countRes(after, 'metal')).toBe(0);
    expect(countRes(after, 'bois')).toBe(0);
  });

  it('la ressource servie en premier est celle qu\'on choisit', () => {
    const p = withRes('nations', { metal: 3, bois: 3 });
    expect(mixedSplit(p, 'metal', 'bois', 4)).toEqual({ metal: 3, bois: 1 });
    expect(mixedSplit(p, 'bois', 'metal', 4)).toEqual({ bois: 3, metal: 1 });
  });

  it('une seule ressource suffit : rien n\'est prélevé sur l\'autre', () => {
    const p = withRes('nations', { metal: 6, bois: 5 });
    expect(mixedSplit(p, 'metal', 'bois', 4)).toEqual({ metal: 4 });
    const after = spendMixed(p, 'metal', 'bois', 4);
    expect(countRes(after, 'metal')).toBe(2);
    expect(countRes(after, 'bois')).toBe(5); // intacte
  });

  it('un total insuffisant reste refusé', () => {
    const p = withRes('nations', { metal: 2, bois: 1 });
    expect(canPayMixed(p, 'metal', 'bois', 4)).toBe(false);
  });

  it('sans ressource alternative, le comportement est inchangé', () => {
    const p = withRes('confederation', { metal: 3, bois: 9 });
    expect(FACTIONS.confederation.deployAltRes).toBeUndefined();
    expect(canPayMixed(p, 'metal', null, 4)).toBe(false); // le bois ne compte pas
    expect(canPayMixed(p, 'metal', null, 3)).toBe(true);
  });

  it('le prélèvement traverse plusieurs hex (les ressources sont éparpillées)', () => {
    const p = createPlayer('acadiane', 1, false);
    p.resources = { 2: { metal: 1 }, 6: { metal: 1 }, 9: { petrole: 2 } };
    expect(canPayMixed(p, 'metal', 'petrole', 4)).toBe(true);
    expect(mixedSplit(p, 'metal', 'petrole', 4)).toEqual({ metal: 2, petrole: 2 });
    const after = spendMixed(p, 'metal', 'petrole', 4);
    expect(countRes(after, 'metal')).toBe(0);
    expect(countRes(after, 'petrole')).toBe(0);
  });

  it('est pur : le joueur d\'origine n\'est pas muté', () => {
    const p = withRes('nations', { metal: 3, bois: 1 });
    spendMixed(p, 'metal', 'bois', 4);
    expect(countRes(p, 'metal')).toBe(3);
    expect(countRes(p, 'bois')).toBe(1);
  });
});
