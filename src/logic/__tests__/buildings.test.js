// Pack Up (Nations, slot 3) et la règle « jamais deux structures sur un même
// territoire ». Bug du 09/08 : un bâtiment pouvait déménager sur un hex tenu
// par l'ennemi, ou sur un hex portant déjà une structure adverse.
// Voisinage utilisé (carte v3, hexes.js) :
//   #14 (village) ↔ 7 plaine · 10 forêt · 11 toundra · 17 plaine · 18 LAC · 21 montagne
//   #10 (forêt)   ↔ 3 MARÉCAGE · 7 · 14 · 17 · 902 (BASE des Nations)
import { describe, it, expect } from 'vitest';
import { buildingHexes, foreignUnitHexes, packUpDestinations } from '../buildings.js';

const nations = (over = {}) => ({
  faction: 'nations', hero: 17, workers: [], mechs: [], buildings: [{ type: 'moulin', hexId: 14 }], ...over,
});
const foe = (over = {}) => ({ faction: 'bayou', hero: null, workers: [], mechs: [], buildings: [], ...over });

describe('destinations de Pack Up', () => {
  it('propose les hex adjacents praticables, lac exclu', () => {
    const p = nations();
    const d = packUpDestinations(p, 14, { players: [p] });
    expect([...d].sort((a, b) => a - b)).toEqual([7, 10, 11, 17, 21]);
    expect(d.has(18)).toBe(false); // lac
  });

  it("n'entre pas sur un hex tenu par une unité adverse", () => {
    const p = nations();
    const enemy = foe({ hero: 7, mechs: [{ id: 'b0', hexId: 11 }], workers: [{ id: 'bw', hexId: 21 }] });
    const d = packUpDestinations(p, 14, { players: [p, enemy] });
    expect(d.has(7)).toBe(false);   // héros
    expect(d.has(11)).toBe(false);  // mecha
    expect(d.has(21)).toBe(false);  // ouvrier — un ouvrier tient l'hex aussi
    expect(d.has(10)).toBe(true);   // libre
  });

  it("n'entre pas sur un hex tenu par une patrouille impériale", () => {
    const p = nations();
    const d = packUpDestinations(p, 14, { players: [p], empire: { e1: 10 } });
    expect(d.has(10)).toBe(false);
    expect(d.has(17)).toBe(true);
  });

  it('refuse un hex portant déjà une structure — la sienne comme celle d’un adversaire', () => {
    const p = nations({ buildings: [{ type: 'moulin', hexId: 14 }, { type: 'gare', hexId: 17 }] });
    const enemy = foe({ buildings: [{ type: 'monument', hexId: 7 }] });
    const d = packUpDestinations(p, 14, { players: [p, enemy] });
    expect(d.has(17)).toBe(false); // sa propre Gare
    expect(d.has(7)).toBe(false);  // le Monument adverse — 2 structures interdites
    expect(d.has(10)).toBe(true);
  });

  it('accepte un hex que le joueur tient lui-même (unité à lui)', () => {
    const p = nations({ workers: [{ id: 'w0', hexId: 10 }], mechs: [{ id: 'm0', hexId: 21 }] });
    const d = packUpDestinations(p, 14, { players: [p] });
    expect(d.has(10)).toBe(true);
    expect(d.has(21)).toBe(true);
  });

  it('exclut la base (hex hors plateau) et les hex non adjacents', () => {
    const p = nations({ buildings: [{ type: 'moulin', hexId: 10 }] });
    const d = packUpDestinations(p, 10, { players: [p] });
    expect(d.has(902)).toBe(false); // base des Nations
    expect(d.has(21)).toBe(false);  // pas adjacent à #10
    expect(d.has(3)).toBe(false);   // marécage
    expect([...d].sort((a, b) => a - b)).toEqual([7, 14, 17]);
  });

  it('reconnaît le joueur courant par sa FACTION (le bot joue sur une copie)', () => {
    const table = nations({ workers: [{ id: 'w0', hexId: 10 }] });
    const copy = { ...table }; // ce que manipule bot.js — jamais la même référence
    const d = packUpDestinations(copy, 14, { players: [copy, table] });
    expect(d.has(10)).toBe(true); // ses propres ouvriers ne se bloquent pas
  });
});

describe('helpers', () => {
  it('buildingHexes rassemble les structures de tous les joueurs', () => {
    const a = nations();
    const b = foe({ buildings: [{ type: 'gare', hexId: 30 }] });
    expect([...buildingHexes([a, b])].sort((x, y) => x - y)).toEqual([14, 30]);
  });

  it('foreignUnitHexes ignore les unités du joueur courant et prend l’Empire', () => {
    const p = nations({ workers: [{ id: 'w0', hexId: 10 }] });
    const enemy = foe({ hero: 7 });
    const s = foreignUnitHexes(p, [p, enemy], { e1: 22 });
    expect(s.has(10)).toBe(false);
    expect(s.has(7)).toBe(true);
    expect(s.has(22)).toBe(true);
  });
});
