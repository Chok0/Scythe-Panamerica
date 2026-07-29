// Moteur headless du mode API — chaque test verrouille un contrat de
// l'interface act()/publicState() documenté dans docs/reference/mode_api.md.
import { describe, it, expect } from 'vitest';
import { HeadlessGame } from '../headlessGame.js';
import { homeBaseHex } from '../../data/hexes.js';

const mk = (over = {}) => new HeadlessGame({ faction: 'confederation', mat: 5, bots: 3, seed: 42, ...over });

// Politique fixe : joue toujours la 1re option sûre — sert aux tests de bout en bout.
const autoStep = (g) => {
  const s = g.publicState();
  if (s.fini) return false;
  const at = s.attente;
  if (at?.kind === 'combat') return g.act({ type: 'combat', power: Math.min(2, at.maxPower), cards: [] }).ok;
  if (at?.kind === 'encounter') return g.act({ type: 'encounter', option: at.rencontre.options.find(o => o.payable)?.i ?? 0 }).ok;
  if (at?.kind === 'factory_offer') return g.act({ type: 'factory_pick', cardId: 'none' }).ok;
  if (at?.kind === 'move') return g.act({ type: 'end_move' }).ok;
  if (at?.kind === 'bottom') return g.act({ type: 'skip_bottom' }).ok;
  if (at?.kind === 'turn_end') return g.act({ type: 'end_turn' }).ok;
  if (s.actionsLegales.some(a => a.type === 'bolster')) return g.act({ type: 'bolster', pick: 'power' }).ok;
  return g.act({ type: 'pass_turn' }).ok;
};
const autoPlay = (g, max = 900) => { for (let i = 0; i < max && autoStep(g); i++); return g.publicState(); };

describe('création et état public', () => {
  it('siège 0 = joueur API, bots assignés, état sérialisable en JSON', () => {
    const g = mk();
    const s = g.publicState();
    expect(s.moi.faction).toBe('confederation');
    expect(s.adversaires).toHaveLength(3);
    expect(s.moi.colonnes).toHaveLength(4);
    expect(s.attente).toBeNull();
    expect(s.actionsLegales.map(a => a.type)).toContain('pass_turn');
    // le round-trip JSON ne perd rien d'exploitable (pas de Set/fonction)
    const rt = JSON.parse(JSON.stringify(s));
    expect(rt.actionsLegales.length).toBe(s.actionsLegales.length);
  });

  it('blind:true masque le profil des bots', () => {
    const sv = mk().publicState();
    const sb = mk({ blind: true }).publicState();
    expect(sv.adversaires[0].profil).toBeTruthy();
    expect(sb.adversaires[0].profil).toBeUndefined();
  });
});

describe('actions du haut', () => {
  it('bolster: -1$ +2⚡ puis attente du bas, et lastCol bloque au tour suivant', () => {
    const g = mk();
    const before = g.publicState().moi;
    const r = g.act({ type: 'bolster', pick: 'power' });
    expect(r.ok).toBe(true);
    const s = g.publicState();
    expect(s.moi.pui).toBe(before.pui + 2);
    expect(s.moi.argent).toBe(before.argent - 1);
    expect(s.attente.kind).toBe('bottom');
    g.act({ type: 'skip_bottom' });
    g.act({ type: 'end_turn' });
    const r2 = g.act({ type: 'bolster', pick: 'power' });
    expect(r2.ok).toBe(false); // même colonne interdite (lastCol)
  });

  it('trade: 2 achats sur un hex ouvrier', () => {
    const g = mk();
    const hex = g.publicState().moi.ouvriers[0].hex;
    const r = g.act({ type: 'trade', buy: [{ res: 'metal', hex }, { res: 'bois', hex }] });
    expect(r.ok).toBe(true);
    const res = g.publicState().moi.ressources[hex];
    expect(res.metal).toBe(1);
    expect(res.bois).toBe(1);
  });

  it('move: cible invalide refusée avec la liste des accessibles, continuation puis end_move', () => {
    const g = mk();
    const bad = g.act({ type: 'move_unit', unit: 'hero', to: 999 });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/accessibles/);
    const hero = g.publicState().moi.heros;
    const dest = Number(bad.error.match(/accessibles: (\d+)/)[1]);
    const r = g.act({ type: 'move_unit', unit: 'hero', to: dest });
    expect(r.ok).toBe(true);
    const s = g.publicState();
    expect(s.moi.heros).toBe(dest);
    expect(s.moi.heros).not.toBe(hero);
    expect(s.attente.kind).toBe('move');
    expect(g.act({ type: 'end_move' }).ok).toBe(true);
    expect(g.publicState().attente.kind).toBe('bottom');
  });

  it('action hors séquence → erreur explicite, sans corrompre l\'état', () => {
    const g = mk();
    const r = g.act({ type: 'end_turn' });
    expect(r.ok).toBe(false);
    expect(g.publicState().attente).toBeNull();
    expect(g.act({ type: 'pass_turn' }).ok).toBe(true);
  });
});

describe('fin de tour et bots', () => {
  it('end_turn fait jouer les 3 bots et incrémente le tour', () => {
    const g = mk();
    g.act({ type: 'pass_turn' });
    const r = g.act({ type: 'end_turn' });
    expect(r.ok).toBe(true);
    const s = g.publicState();
    expect(s.tour).toBe(2);
    // les snapshots de début de tour couvrent les 4 sièges
    expect(r.events.filter(e => e.startsWith('[Début')).length).toBe(4);
  });
});

describe('combat — défense interactive', () => {
  // Forge l'état exact que botOneTurn crée quand un bot attaque le siège API.
  const forgeDefense = (g, botTotal) => {
    const p = g.players[0];
    const opp = g.players[1];
    const hexId = p.hero;
    opp.hero = hexId; // le bot « arrive » sur mon hex
    g.pending = {
      kind: 'combat', role: 'defense', hexId, oppIdx: 1,
      botSpend: Math.min(botTotal, opp.power), botCards: 0, botTotal,
      maxPower: Math.min(7, p.power), maxCards: 0, botQueue: [], info: 'test',
    };
    return { p, opp, hexId };
  };

  it('l\'attente publique ne fuit JAMAIS l\'engagement secret du bot', () => {
    const g = mk();
    forgeDefense(g, 3);
    const at = g.publicState().attente;
    expect(at.kind).toBe('combat');
    expect(at.maxPower).toBeGreaterThan(0);
    expect(at.botSpend).toBeUndefined();
    expect(at.botTotal).toBeUndefined();
    expect(at.botCards).toBeUndefined();
    expect(at.botQueue).toBeUndefined();
    expect(JSON.stringify(at)).not.toMatch(/botSpend|botTotal|botQueue/);
  });

  it('défenseur gagnant : étoile de combat, attaquant renvoyé à sa base, tour bouclé', () => {
    const g = mk();
    const { p, opp, hexId } = forgeDefense(g, 2);
    p.power = 6;
    const tourAvant = g.publicState().tour;
    const r = g.act({ type: 'combat', power: 3, cards: [] }); // 3 > 2 → victoire défensive
    expect(r.ok).toBe(true);
    expect(p.stars).toBe(1);
    expect(p.starCombat1).toBe(true);
    expect(opp.hero).toBe(homeBaseHex(opp.faction).id);
    expect(opp.hero).not.toBe(hexId);
    expect(g.publicState().attente).toBeNull();
    expect(g.publicState().tour).toBe(tourAvant + 1); // finishRound après file vide
  });

  it('défenseur perdant à ÉGALITÉ (l\'attaquant gagne les égalités) : retraite + carte de consolation', () => {
    const g = mk();
    const { p, opp } = forgeDefense(g, 3);
    p.power = 6;
    const r = g.act({ type: 'combat', power: 3, cards: [] }); // 3 vs 3 → l'attaquant (bot) gagne
    expect(r.ok).toBe(true);
    expect(p.stars).toBe(0);
    expect(opp.stars).toBe(1);
    expect(p.hero).toBe(homeBaseHex(p.faction).id); // je retraite
    expect(p.combatCards).toBeGreaterThanOrEqual(1); // carte de consolation (engagement ≥1)
  });
});

describe('partie complète', () => {
  it('se termine, classe 4 joueurs par score décroissant, journal exportable', () => {
    const g = mk({ maxRounds: 40 });
    const s = autoPlay(g);
    expect(s.fini).toBe(true);
    const cl = s.resultat.classement;
    expect(cl).toHaveLength(4);
    expect(cl.map(c => c.rang)).toEqual([1, 2, 3, 4]);
    for (let i = 1; i < cl.length; i++) expect(cl[i - 1].total).toBeGreaterThanOrEqual(cl[i].total);
    const j = g.exportJournal();
    expect(j.mode).toBe('api');
    expect(j.classement).toHaveLength(4);
    expect(j.journal.length).toBeGreaterThan(100);
  });

  it('même seed → même partie (reproductibilité, y compris 2 parties en parallèle)', () => {
    const A = mk({ maxRounds: 25 });
    const B = mk({ maxRounds: 25 });
    for (let i = 0; i < 900; i++) {
      const a = autoStep(A); const b = autoStep(B);
      if (!a && !b) break;
    }
    const key = (g) => JSON.stringify(g.publicState().resultat?.classement.map(c => [c.faction, c.total]));
    expect(A.publicState().fini).toBe(true);
    expect(key(A)).toBe(key(B));
  });
});
