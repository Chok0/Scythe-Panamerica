import { describe, it, expect } from 'vitest';
import { STRUCTURE_BONUSES, structureBonusDetail, eligibleHexes, bonusViable, pickStructureBonus } from '../../data/structureBonus.js';
import { HEXES, hMap, ADJ, homeBaseHex } from '../../data/hexes.js';
import { FACTIONS } from '../../data/factions.js';

const tile = (id) => STRUCTURE_BONUSES.find(b => b.id === id);
const mkP = (hexIds, faction = "confederation") =>
  ({ faction, buildings: hexIds.map((hexId, i) => ({ type: `b${i}`, hexId })) });

describe('tuiles bonus de pose — barème progressif 2/4/6/9$', () => {
  it('le pool : 5 tuiles du jeu original + Usine + Villages + Terroirs + Avant-Postes + Terres Lointaines', () => {
    const ids = STRUCTURE_BONUSES.map(b => b.id);
    ["lacs", "cultures", "monts_forets", "ligne", "rencontres", "usine", "villages", "terroirs", "avant_postes", "terres_lointaines"]
      .forEach(id => expect(ids, `tuile ${id} manquante`).toContain(id));
    // la tuile plate non pertinente a été retirée (rivières partout = gratuit)
    expect(ids).not.toContain("riviere");
  });

  it('échelle bâtiments (Champs & Toundra) : 1→2$, 2→4$, 3→6$, 4→9$', () => {
    const t = tile("cultures");
    const spots = HEXES.filter(h => ["champs", "toundra"].includes(h.t)).map(h => h.id);
    expect(spots.length).toBeGreaterThanOrEqual(4);
    expect(structureBonusDetail(mkP(spots.slice(0, 1)), t).coins).toBe(2);
    expect(structureBonusDetail(mkP(spots.slice(0, 2)), t).coins).toBe(4);
    expect(structureBonusDetail(mkP(spots.slice(0, 3)), t).coins).toBe(6);
    expect(structureBonusDetail(mkP(spots.slice(0, 4)), t).coins).toBe(9);
    // un bâtiment hors critère ne compte pas
    const off = HEXES.find(h => !["champs", "toundra"].includes(h.t) && h.t !== "lac");
    expect(structureBonusDetail(mkP([off.id]), t).coins).toBe(0);
  });

  it('échelle éléments (Bord des Lacs) : les lacs distincts comptent, pas les bâtiments', () => {
    const t = tile("lacs");
    // un hex bordant au moins un lac
    const spot = HEXES.find(h => h.t !== "lac" && (ADJ[h.id] || []).some(a => hMap[a]?.t === "lac"));
    expect(spot).toBeTruthy();
    const d = structureBonusDetail(mkP([spot.id]), t);
    expect(d.count).toBeGreaterThanOrEqual(1);
    expect(d.coins).toBeGreaterThanOrEqual(2);
    // 1 lac→2$, 2-3→4$ : jamais 3$ (l'ancien barème plat a disparu)
    expect([2, 4, 6, 9]).toContain(d.coins);
  });

  it('Ligne de Production : 3 bâtiments alignés → 6$, coude → seulement 4$', () => {
    const t = tile("ligne");
    // Cherche un trio COLINÉAIRE a-b-c sur la carte réelle (pas droit → coude)
    const delta = (x, y) => `${Math.round((hMap[y].rx - hMap[x].rx) / 20)}_${Math.round((hMap[y].ry - hMap[x].ry) / 20)}`;
    let straight = null, bent = null;
    outer:
    for (const a of HEXES) {
      for (const b of ADJ[a.id] || []) {
        if (!hMap[b]) continue;
        for (const c of ADJ[b] || []) {
          if (c === a.id || !hMap[c]) continue;
          if (!straight && delta(a.id, b) === delta(b, c)) straight = [a.id, b, c];
          if (!bent && delta(a.id, b) !== delta(b, c)) bent = [a.id, b, c];
          if (straight && bent) break outer;
        }
      }
    }
    expect(straight).toBeTruthy();
    expect(bent).toBeTruthy();
    expect(structureBonusDetail(mkP(straight), t)).toEqual({ count: 3, coins: 6 });
    // trio coudé : la plus longue ligne droite reste une paire → 4$
    expect(structureBonusDetail(mkP(bent), t)).toEqual({ count: 2, coins: 4 });
    // bâtiment seul : ligne de 1 → 2$ (barème du jeu original)
    expect(structureBonusDetail(mkP([straight[0]]), t)).toEqual({ count: 1, coins: 2 });
  });

  it('Terroirs Variés : seuls les TYPES de terrains distincts comptent', () => {
    const t = tile("terroirs");
    const byType = {};
    HEXES.forEach(h => { if (h.t !== "lac" && h.t !== "factory") (byType[h.t] = byType[h.t] || []).push(h.id); });
    const types = Object.keys(byType);
    expect(types.length).toBeGreaterThanOrEqual(4);
    // 3 bâtiments sur 3 terrains différents → 6$
    expect(structureBonusDetail(mkP(types.slice(0, 3).map(ty => byType[ty][0])), t).coins).toBe(6);
    // 2 bâtiments sur le MÊME terrain → 1 seul type → 2$
    const dup = types.find(ty => byType[ty].length >= 2);
    expect(structureBonusDetail(mkP(byType[dup].slice(0, 2)), t).coins).toBe(2);
  });

  it('Avant-Postes : 10$ pour un bâtiment adjacent à une base ADVERSE, +2$ par autre bâtiment', () => {
    const t = tile("avant_postes");
    const players = [{ faction: "confederation" }, { faction: "frente" }];
    const frenteBase = homeBaseHex("frente");
    expect(frenteBase).toBeTruthy();
    const spot = (ADJ[frenteBase.id] || []).find(a => hMap[a] && !hMap[a].base && hMap[a].t !== "lac");
    expect(spot).toBeTruthy();
    // 1 avant-poste seul → 10$
    expect(structureBonusDetail(mkP([spot]), t, players)).toEqual({ count: 1, coins: 10 });
    // + 2 autres bâtiments ailleurs → 10 + 2×2 = 14$
    const elsewhere = HEXES.filter(h => !h.base && h.t !== "lac" && h.id !== spot && !(ADJ[frenteBase.id] || []).includes(h.id)).slice(0, 2).map(h => h.id);
    expect(structureBonusDetail(mkP([spot, ...elsewhere]), t, players).coins).toBe(14);
    // aucun bâtiment adjacent à une base adverse → 0$ (peu importe le nombre)
    expect(structureBonusDetail(mkP(elsewhere), t, players).coins).toBe(0);
    // la base de SA PROPRE faction ne compte pas
    const myBase = homeBaseHex("confederation");
    const mySpot = (ADJ[myBase.id] || []).find(a => hMap[a] && !hMap[a].base && hMap[a].t !== "lac");
    expect(structureBonusDetail(mkP([mySpot]), t, players).coins).toBe(0);
  });

  it('Terres Lointaines : 1$ par hex de distance du bâtiment le plus éloigné de SA base', () => {
    const t = tile("terres_lointaines");
    const myBase = homeBaseHex("confederation");
    const nextDoor = (ADJ[myBase.id] || []).find(a => hMap[a] && !hMap[a].base && hMap[a].t !== "lac");
    // bâtiment collé à la base → distance 1 → 1$
    expect(structureBonusDetail(mkP([nextDoor]), t)).toEqual({ count: 1, coins: 1 });
    // un 2e bâtiment plus loin : seul le PLUS ÉLOIGNÉ compte
    const far = HEXES.find(h => !h.base && h.t !== "lac" && h.t !== "factory"
      && Math.hypot(h.rx - hMap[myBase.id].rx, h.ry - hMap[myBase.id].ry) > 500);
    expect(far).toBeTruthy();
    const dFar = structureBonusDetail(mkP([far.id]), t).count;
    expect(dFar).toBeGreaterThan(1);
    expect(structureBonusDetail(mkP([nextDoor, far.id]), t)).toEqual({ count: dFar, coins: dFar });
  });

  it('toutes les tuiles exposent count/score/check/unit/scale (contrat UI)', () => {
    STRUCTURE_BONUSES.forEach(b => {
      expect(typeof b.count).toBe("function");
      expect(typeof b.score).toBe("function");
      expect(typeof b.check).toBe("function");
      expect(typeof b.unit).toBe("string");
      expect(typeof b.scale).toBe("string");
      // sans bâtiment : 0 pièce
      expect(structureBonusDetail(mkP([]), b).coins).toBe(0);
    });
  });
});

// ── Tuiles jouables sur la carte tirée (correctif du 03/08) ───────────────
// Deux parties de suite, le bonus de pose a rapporté 0$ aux trois joueurs.
// Le tirage écarte désormais les tuiles dont la carte ne porte pas assez
// d'hex éligibles, ou qui sont hors de portée d'une faction en jeu.
describe('tuiles jouables sur la carte courante', () => {
  it('eligibleHexes rend les hex à badge $, vide pour les tuiles géométriques', () => {
    const cultures = STRUCTURE_BONUSES.find(b => b.id === 'cultures');
    const elig = eligibleHexes(cultures);
    expect(elig.length).toBeGreaterThan(0);
    elig.forEach(id => expect(['champs', 'toundra']).toContain(hMap[id].t));
    expect(eligibleHexes(STRUCTURE_BONUSES.find(b => b.id === 'ligne'))).toEqual([]);
  });

  it('la carte v3 garde toutes ses tuiles — le filtre vise les cartes procédurales', () => {
    const factions = Object.keys(FACTIONS);
    STRUCTURE_BONUSES.forEach(b => expect(bonusViable(b, factions), b.id).toBe(true));
  });

  it('une tuile à trop peu d\'hex éligibles est écartée du tirage', () => {
    const factions = Object.keys(FACTIONS);
    // 2 hex éligibles : le haut du barème (4 bâtiments) est hors d'atteinte
    expect(bonusViable({ id: 'rare', check: (hid) => hid === 0 || hid === 2 }, factions)).toBe(false);
    // Aucun hex éligible = critère géométrique (Ligne, Terroirs) : toujours jouable
    expect(bonusViable({ id: 'geo', check: () => false }, factions)).toBe(true);
    // Le tirage rend toujours une tuile, même si le filtre vidait le pool
    expect(pickStructureBonus(factions)).toBeTruthy();
  });
});
