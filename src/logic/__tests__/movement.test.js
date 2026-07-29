// Règle des rails actée en partie réelle : rouler sur le réseau coûte 1 PAS.
// Sans Vitesse on peut seulement se placer sur le réseau ; avec Vitesse il
// reste 1 pas pour en sortir. Monter à bord en cours de route n'ouvre pas le
// réseau ce tour-ci.
import { describe, it, expect } from 'vitest';
import { getValidMoves, getValidMoves1Step, getRailNetwork, marshToll, findPathWaypoints } from '../movement.js';
import { hMap, ADJ, hasR, HEXES } from '../../data/hexes.js';
import { FACTIONS } from '../../data/factions.js';
import { islandOf, riverwalkValue } from '../../../scripts/riverwalkAudit.mjs';

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

// ── Sang du Marais (Bayou) — capacité de FACTION, active dès le tour 1 ──
// Géographie vérifiée sur la carte v3 : le marécage #20 ne porte AUCUNE
// rivière et relie #28 (départ Bayou) à #16 (montagne/métal) et #23
// (désert/pétrole). La liaison directe #28 → #23 est coupée par une rivière :
// le marécage est donc littéralement le pont sans péage du Bayou.
describe('Sang du Marais (Bayou)', () => {
  const bayou = { faction: 'bayou', workers: [], mechs: [], hero: 28, pop: 8, power: 5 };
  const other = { faction: 'dominion', workers: [], mechs: [], hero: 28, pop: 8, power: 5 };

  it('le marécage #20 est bien la sortie sans rivière de l\'îlot Bayou', () => {
    expect(hMap[20].t).toBe('marecage');
    expect(ADJ[20]).toEqual(expect.arrayContaining([16, 23, 28]));
    expect(hasR(20, 28)).toBe(false);
    expect(hasR(20, 16)).toBe(false);
    expect(hasR(20, 23)).toBe(false);
    expect(hasR(28, 23)).toBe(true); // la route directe, elle, est barrée
  });

  it('le Bayou traverse le marécage sans s\'arrêter (2 pas avec Vitesse)', () => {
    const moves = new Set(getValidMoves(28, 'bayou', [0], bayou, [], 'mech', new Set()));
    expect(moves.has(20)).toBe(true);
    expect(moves.has(16)).toBe(true); // #28 → #20 → #16 : métal atteint en 1 tour
    expect(moves.has(23)).toBe(true);
  });

  it('les autres factions sont stoppées sur le marécage', () => {
    const moves = new Set(getValidMoves(28, 'dominion', [0], other, [], 'mech', new Set()));
    expect(moves.has(20)).toBe(true);   // on peut y entrer…
    expect(moves.has(16)).toBe(false);  // …mais pas continuer au-delà
  });

  it('le péage ne coûte rien au Bayou, et coûte aux autres', () => {
    const b = { ...bayou };
    const log = marshToll(b, 20, 'worker');
    expect(log).toMatch(/Sang du Marais/);
    expect(b.pop).toBe(8);

    const d = { ...other };
    marshToll(d, 20, 'worker');
    expect(d.pop).toBe(7);
    const d2 = { ...other };
    marshToll(d2, 20, 'mech', 2);
    expect(d2.power).toBe(4);
    expect(d2.pop).toBe(6);
  });

  it('un chemin Bayou peut passer PAR le marécage (waypoints)', () => {
    const wp = findPathWaypoints(28, 16, 'bayou', [0], bayou, [], new Set());
    expect(wp).toContain(20);
    // Le Dominion n'a aucun chemin traversant : #16 lui est hors de portée ici
    expect(findPathWaypoints(28, 16, 'dominion', [0], other, [], new Set())).toEqual([]);
  });
});

// ── Check-up des riverwalks (v0.15) : aucune capacité morte ──
// Critère : un riverwalk doit ouvrir au moins une SORTIE de l'îlot de départ
// de sa faction. Un terrain déjà présent chez elle, ou qui ne borde aucune
// rivière sur sa frontière, se paie un mecha pour rien. Deux capacités
// mortes (Nations, Dominion) sont passées inaperçues jusqu'en v0.15 : ce
// test les rattrapera à la prochaine retouche de la carte.
// L'audit détaillé est dans scripts/riverwalkAudit.mjs (même fonction).
describe('riverwalks : aucune capacité morte', () => {
  for (const [fid, f] of Object.entries(FACTIONS)) {
    it(`${f.name} (${f.rwName}) ouvre une sortie par terrain listé`, () => {
      const value = riverwalkValue(fid, f);
      expect(value).toHaveLength(2);
      // Message d'échec lisible : on compare les terrains morts à la liste vide
      expect(value.filter(v => v.n === 0).map(v => v.t)).toEqual([]);
    });
  }

  it("le Bayou est la seule faction à ne pas démarrer enclavée (Sang du Marais)", () => {
    const sizes = Object.entries(FACTIONS)
      .map(([fid, f]) => [fid, islandOf(fid, f).island.size]);
    const bayou = sizes.find(([fid]) => fid === 'bayou')[1];
    for (const [fid, n] of sizes) {
      if (fid === 'bayou') expect(n).toBeGreaterThan(20);
      else expect(n).toBeLessThan(bayou);
    }
  });
});

// ── Vitesse et ouvriers (v0.16) — bug constaté en partie le 28/07 ──
// Vitesse (slot 0) ne concerne que le héros et les mechas : un ouvrier reste
// à 1 pas. Avant le correctif, un ouvrier sur rail profitait de la Vitesse du
// joueur pour enchaîner réseau + 1 pas de sortie dans le même déplacement.
describe('Vitesse ne s\'applique pas aux ouvriers', () => {
  const stubW = { workers: [], mechs: [], hero: 11 };

  it('à pied : la portée d\'un ouvrier est identique avec ou sans Vitesse', () => {
    const sans = [...getValidMoves(11, 'dominion', [], stubW, [], 'worker', new Set())].sort((a, b) => a - b);
    const avec = [...getValidMoves(11, 'dominion', [0], stubW, [], 'worker', new Set())].sort((a, b) => a - b);
    expect(avec).toEqual(sans);
    // …alors qu'un mech, lui, va bien plus loin avec Vitesse
    const mech = getValidMoves(11, 'dominion', [0], stubW, [], 'mech', new Set());
    expect(mech.length).toBeGreaterThan(avec.length);
  });

  it('sur le réseau de rails : l\'ouvrier roule (1 pas) mais n\'en sort pas', () => {
    const RAILS_W = [[11, 8], [8, 12], [12, 9]];
    const moves = new Set(getValidMoves(11, 'dominion', [0], stubW, RAILS_W, 'worker', new Set()));
    expect(moves.has(9)).toBe(true);   // bout du réseau : 1 pas
    expect(moves.has(16)).toBe(false); // sortie du réseau : exigerait la Vitesse
  });
});

// ── Convoi (Confédération, slot 3) — bond village ↔ Rouge River ──
// Vérifié après le playtest du 28/07 (le bond avait semblé refusé pendant
// une continuation de déplacement décomposé) : le MOTEUR le propose bien,
// en 1 pas comme en déplacement complet. La cause en jeu était ailleurs
// (clic hors cible pendant le pilotage automatisé).
describe('Convoi : bond village ↔ Rouge River', () => {
  const conf = { faction: 'confederation', hero: 36, workers: [], mechs: [{ id: 'm3', hexId: 36 }] };

  it('depuis un village contrôlé, la Rouge River est à 1 pas', () => {
    const moves = getValidMoves1Step(36, 'confederation', [0, 1, 2, 3], conf, []);
    expect(moves).toContain(22);
  });

  it('sans Convoi (slot 3 verrouillé), pas de bond', () => {
    const moves = getValidMoves1Step(36, 'confederation', [0, 1, 2], conf, []);
    expect(moves).not.toContain(22);
  });
});
