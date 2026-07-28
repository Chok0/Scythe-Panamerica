import { describe, it, expect } from 'vitest';
import { OBJECTIVES, OBJECTIVES_ORIGINAL, ALL_OBJECTIVES } from '../../data/objectives.js';
import { FACTORY_RR_HEX } from '../../data/plans.js';
import { createPlayer } from '../player.js';

const mkP = () => createPlayer('confederation', 1, false);

describe('decks d\'objectifs secrets', () => {
  it('deck standard de 12 (2 par joueur jusqu\'à 6 joueurs), deck original de 21 en réserve campagne', () => {
    expect(OBJECTIVES.length).toBe(12);
    expect(OBJECTIVES_ORIGINAL.length).toBe(21);
    // ids uniques sur l'ensemble (réhydratation des sauvegardes)
    expect(new Set(ALL_OBJECTIVES.map(o => o.id)).size).toBe(ALL_OBJECTIVES.length);
    // le deck original n'est PAS mélangé au deck standard
    OBJECTIVES.forEach(o => expect(o.id).toMatch(/^n/));
    OBJECTIVES_ORIGINAL.forEach(o => expect(o.id).toMatch(/^o/));
  });

  it('aucun objectif n\'est validé par un joueur fraîchement créé (fini les étoiles gratuites)', () => {
    const p = mkP();
    const players = [p, createPlayer('frente', 2, true)];
    ALL_OBJECTIVES.forEach(o => {
      expect(() => o.check(p)).not.toThrow();               // robuste sans contexte
      expect(o.check(p, { players }), `« ${o.name} » validé au 1er tour`).toBe(false);
    });
  });

  it('Autarcie (n02) : 2 ressources de chaque type requises', () => {
    const o = OBJECTIVES.find(x => x.id === 'n02');
    const p = mkP();
    p.resources = { 10: { metal: 2, bois: 2, nourriture: 2, petrole: 1 } };
    expect(o.check(p)).toBe(false);
    p.resources[10].petrole = 2;
    expect(o.check(p)).toBe(true);
  });

  it('Guerre Éclair (n03) : la contrainte de trésorerie compte', () => {
    const o = OBJECTIVES.find(x => x.id === 'n03');
    const p = mkP();
    p.starCombat1 = true; p.mechs = [{ id: 'm0', hexId: 10 }, { id: 'm1', hexId: 11 }];
    p.coins = 5;
    expect(o.check(p)).toBe(true);
    p.coins = 6;
    expect(o.check(p)).toBe(false);
  });

  it('Le Monopole (o08) : 9 ressources identiques', () => {
    const o = OBJECTIVES_ORIGINAL.find(x => x.id === 'o08');
    const p = mkP();
    p.resources = { 10: { metal: 5 }, 11: { metal: 4 } };
    expect(o.check(p)).toBe(true);
    p.resources = { 10: { metal: 5, bois: 4 } };
    expect(o.check(p)).toBe(false);
  });

  it('Le Relais Parfait (o17) : EXACTEMENT 1 ouvrier, 1 mecha, 5 ressources', () => {
    const o = OBJECTIVES_ORIGINAL.find(x => x.id === 'o17');
    const p = mkP();
    const h = p.workers[0].hexId;
    p.workers = [p.workers[0]];
    p.mechs = [{ id: 'm0', hexId: h }];
    p.resources = { [h]: { bois: 5 } };
    expect(o.check(p)).toBe(true);
    p.resources = { [h]: { bois: 6 } }; // 6 ressources : « exactement » échoue
    expect(o.check(p)).toBe(false);
  });

  it('Le Trône de la Rouge River (o20) : Usine + plus grande puissance, égalité acceptée, prudent sans contexte', () => {
    const o = OBJECTIVES_ORIGINAL.find(x => x.id === 'o20');
    const p = mkP();
    p.mechs = [{ id: 'm0', hexId: FACTORY_RR_HEX }];
    p.power = 6;
    const rival = createPlayer('frente', 2, true);
    rival.power = 6;
    expect(o.check(p, { players: [p, rival] })).toBe(true);  // égalité acceptée
    rival.power = 7;
    expect(o.check(p, { players: [p, rival] })).toBe(false);
    expect(o.check(p)).toBe(false);                          // sans contexte : pas d'étoile gratuite
  });

  it('L\'Intimidation (o02) : le compteur d\'ouvriers fait fuir alimente l\'objectif', () => {
    const o = OBJECTIVES_ORIGINAL.find(x => x.id === 'o02');
    const p = mkP();
    p.power = 7;
    expect(o.check(p)).toBe(false);
    p.scaredWorkers = 1;
    expect(o.check(p)).toBe(true);
  });
});
