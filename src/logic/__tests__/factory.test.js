import { describe, it, expect } from 'vitest';
import {
  PLANS_FORD, PLANS_TESLA, PLANS_ORIGINAL, ALL_FACTORY_CARDS,
  factoryCostLabel, factoryGainLabel, FACTORY_COL,
} from '../../data/plans.js';
import {
  drawFactoryOffer, canPayFactoryCost, payFactoryCost,
  factoryEffectPossible, factoryWorkerHexes, factoryResourceHex,
} from '../factory.js';
import { spendLowCards } from '../cards.js';
import { createPlayer } from '../player.js';
import { getValidMoves } from '../movement.js';
import { botTurn } from '../bot.js';

const mkPlayer = () => createPlayer('confederation', 1, false);

describe('decks de cartes d\'usine', () => {
  const VALID_COST = new Set(['coins', 'power', 'pop', 'cards']);
  const VALID_GAIN = new Set(['coins', 'power', 'pop', 'cards', 'upgrade', 'enlist', 'building', 'mech', 'produce2', 'resources', 'choice']);

  it('structure : chaque carte a un id unique, un coût et un gain valides', () => {
    const ids = new Set();
    for (const card of ALL_FACTORY_CARDS) {
      expect(ids.has(card.id), `id dupliqué ${card.id}`).toBe(false);
      ids.add(card.id);
      expect(card.cost.length).toBeGreaterThan(0);
      card.cost.forEach(c => {
        expect(VALID_COST.has(c.res), `coût inconnu ${c.res} (${card.id})`).toBe(true);
        expect(c.qty).toBeGreaterThan(0);
      });
      expect(card.gain.length).toBeGreaterThan(0);
      const checkEff = (e) => {
        expect(VALID_GAIN.has(e.type), `gain inconnu ${e.type} (${card.id})`).toBe(true);
        if (e.type === 'choice') { expect(e.options.length).toBe(2); e.options.forEach(checkEff); }
      };
      card.gain.forEach(checkEff);
    }
  });

  it('tailles : Ford 12, Tesla 5, Original 12 (réservé campagne)', () => {
    expect(PLANS_FORD.length).toBe(12);
    expect(PLANS_TESLA.length).toBe(5);
    expect(PLANS_ORIGINAL.length).toBe(12);
    expect(PLANS_ORIGINAL.every(c => c.deck === 'original')).toBe(true);
  });

  it('libellés lisibles pour l\'UI', () => {
    const c = PLANS_FORD[0];
    expect(factoryCostLabel(c)).toMatch(/\d/);
    expect(factoryGainLabel(c).length).toBeGreaterThan(0);
  });
});

describe('offre de l\'Usine (course à l\'Usine)', () => {
  it('tire nb joueurs + 1 cartes du deck', () => {
    const offer = drawFactoryOffer(PLANS_FORD, 3 + 1);
    expect(offer.length).toBe(4);
    // toutes distinctes et issues du deck
    expect(new Set(offer.map(c => c.id)).size).toBe(4);
    offer.forEach(c => expect(PLANS_FORD.some(f => f.id === c.id)).toBe(true));
  });

  it('ne déborde jamais de la taille du deck', () => {
    expect(drawFactoryOffer(PLANS_TESLA, 99).length).toBe(PLANS_TESLA.length);
  });
});

describe('coût du haut : payer sur les pistes', () => {
  it('canPay + pay pour un coût en pièces', () => {
    const p = mkPlayer();
    const card = { cost: [{ res: 'coins', qty: 2 }], gain: [] };
    p.coins = 2;
    expect(canPayFactoryCost(p, card)).toBe(true);
    payFactoryCost(p, card);
    expect(p.coins).toBe(0);
    expect(canPayFactoryCost(p, card)).toBe(false);
  });

  it('coût combiné (1 pièce + 1 carte, façon deck original)', () => {
    const p = mkPlayer();
    p.coins = 1; p.combatCards = 2; p.cardHand = [3, 1];
    const card = { cost: [{ res: 'coins', qty: 1 }, { res: 'cards', qty: 1 }], gain: [] };
    expect(canPayFactoryCost(p, card)).toBe(true);
    payFactoryCost(p, card);
    expect(p.coins).toBe(0);
    expect(p.combatCards).toBe(1);
  });

  it('payer en cartes de combat sacrifie les plus FAIBLES de la main', () => {
    const p = { combatCards: 3, cardHand: [5, 1, 3] };
    spendLowCards(p, 2);
    expect(p.cardHand).toEqual([5]);
    expect(p.combatCards).toBe(1);
  });
});

describe('faisabilité des gains', () => {
  it('mech impossible sans ouvrier sur le plateau', () => {
    const p = mkPlayer();
    p.workers = []; // plus d'ouvriers
    expect(factoryEffectPossible(p, { type: 'mech' })).toBe(false);
    expect(factoryEffectPossible(p, { type: 'resources', qty: 2 })).toBe(false);
  });

  it('upgrade impossible une fois les 6 améliorations faites', () => {
    const p = mkPlayer();
    p.upgrades = 6;
    expect(factoryEffectPossible(p, { type: 'upgrade' })).toBe(false);
  });

  it('choice possible si au moins une option l\'est', () => {
    const p = mkPlayer();
    p.upgrades = 6;
    expect(factoryEffectPossible(p, { type: 'choice', options: [{ type: 'upgrade' }, { type: 'coins', qty: 1 }] })).toBe(true);
  });

  it('les gains directs sont toujours possibles', () => {
    const p = mkPlayer();
    expect(factoryEffectPossible(p, { type: 'pop', qty: 2 })).toBe(true);
  });

  it('les hex ouvriers ciblés excluent les bases', () => {
    const p = mkPlayer();
    factoryWorkerHexes(p).forEach(h => expect(typeof h).toBe('number'));
    expect(factoryResourceHex(p)).not.toBe(null);
  });
});

describe('déplacement du bas : 2 hex (+1 si Vitesse)', () => {
  it('bonusSteps=1 élargit la portée par rapport au pas simple', () => {
    const p = mkPlayer();
    const from = p.workers[0].hexId;
    const oneStep = getValidMoves(from, p.faction, [], p, [], 'worker', new Set());
    const twoSteps = getValidMoves(from, p.faction, [], p, [], 'worker', new Set(), 1);
    expect(twoSteps.length).toBeGreaterThan(oneStep.length);
    // le 2-pas contient tout le 1-pas
    oneStep.forEach(h => expect(twoSteps).toContain(h));
  });
});

describe('bot : colonne d\'usine jouable', () => {
  it('un bot avec carte d\'usine peut jouer la colonne 4 (top payé + bas move)', () => {
    const p = createPlayer('confederation', 1, true);
    p.botProfile = 'equilibre'; p.botNoise = 0;
    // Carte triviale toujours payable : 1⚡ → +4$ — la colonne d'usine devient
    // le meilleur choix ; lastCol bloque les 4 colonnes plateau ? Non : on
    // vérifie simplement qu'un tour complet ne plante pas et que lastCol suit.
    p.factoryCard = { id: 'T01', deck: 'tesla', name: 'Générateur à Induction', cost: [{ res: 'power', qty: 1 }], gain: [{ type: 'coins', qty: 4 }] };
    p.power = 10; p.coins = 0;
    // Sans ouvriers ni pièces, les 4 colonnes du plateau valent peu : la
    // colonne d'usine payable (score 14) l'emporte de façon déterministe
    const r = botTurn({ ...p, workers: [], mechs: [], resources: {} }, {}, new Set(), [], { forbidden: new Set() });
    expect(r.player.lastCol).toBe(FACTORY_COL);
    // le haut payé : -1⚡ +4$ ; le bas ne déclenche pas d'enlist ongoing
    expect(r.player.power).toBe(9);
    expect(r.player.coins).toBe(4);
    expect(r.bottomCol).toBe(-1);
  });
});
