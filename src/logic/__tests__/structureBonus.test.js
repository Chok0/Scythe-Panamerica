import { describe, it, expect } from 'vitest';
import { STRUCTURE_BONUSES, structureBonusDetail } from '../../data/structureBonus.js';
import { HEXES, hMap, ADJ } from '../../data/hexes.js';

const tile = (id) => STRUCTURE_BONUSES.find(b => b.id === id);
const mkP = (hexIds) => ({ buildings: hexIds.map((hexId, i) => ({ type: `b${i}`, hexId })) });

describe('tuiles bonus de pose — barème progressif 2/4/6/9$', () => {
  it('le pool contient les 5 tuiles du jeu original + Usine + Terroirs Variés', () => {
    const ids = STRUCTURE_BONUSES.map(b => b.id);
    ["lacs", "cultures", "monts_forets", "ligne", "rencontres", "usine", "terroirs"].forEach(id =>
      expect(ids, `tuile ${id} manquante`).toContain(id));
    // les anciennes tuiles plates non pertinentes ont été retirées
    expect(ids).not.toContain("village");
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
