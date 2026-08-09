// Le gabarit d'un hex doit tenir une promesse mesurable : deux pions ne se
// recouvrent JAMAIS, et rien ne sort de l'hexagone. Constaté en partie le
// 09/08 : ouvriers par-dessus les tas de ressources, mechas par-dessus les
// ouvriers, bâtiment sur la rangée. Ces tests ferment les trois cas.
import { describe, it, expect } from 'vitest';
import {
  layoutUnits, layoutStrip, unitR, halfWidthAt,
  BAND, STRIP_TOP_Y, STRIP_BOTTOM_Y, HEX_HALF_H,
} from '../hexLayout.js';

const mk = (spec) => spec.flatMap(([type, n]) =>
  Array.from({ length: n }, (_, i) => ({ id: `${type}${i}`, type })));

/** Distance minimale entre deux pions moins la somme de leurs rayons :
 *  négatif = recouvrement. */
const worstOverlap = (units) => {
  const pos = layoutUnits(units);
  const byId = Object.fromEntries(units.map(u => [u.id, u]));
  let worst = Infinity;
  for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
    const a = pos[i], b = pos[j];
    const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
    worst = Math.min(worst, d - (unitR(byId[a.id].type) + unitR(byId[b.id].type)) * a.scale);
  }
  return worst;
};

// Compositions réalistes, de la plus banale à la plus improbable
const CAS = [
  ['1 ouvrier', [['worker', 1]]],
  ['2 ouvriers', [['worker', 2]]],
  ['3 ouvriers + le Moulin sorti du pack', [['worker', 3]]],
  ['le cas du journal : héros + 4 ouvriers + 1 mecha', [['hero', 1], ['worker', 4], ['mech', 1]]],
  ['2 ouvriers + 1 mecha (2e capture d\'écran)', [['worker', 2], ['mech', 1]]],
  ['3 mechas', [['mech', 3]]],
  ['héros + 3 mechas', [['hero', 1], ['mech', 3]]],
  ['8 ouvriers (étoile des 8 ouvriers, tous groupés)', [['worker', 8]]],
  ['stack maximal : héros + 4 mechas + 8 ouvriers', [['hero', 1], ['mech', 4], ['worker', 8]]],
  ['contact impérial : 2 patrouilles + héros + 2 ouvriers', [['empire', 2], ['hero', 1], ['worker', 2]]],
];

describe('pions d\'un hex — aucun recouvrement', () => {
  CAS.forEach(([nom, spec]) => {
    it(nom, () => {
      const units = mk(spec);
      expect(worstOverlap(units), 'recouvrement').toBeGreaterThanOrEqual(0);
    });
  });

  it('tout reste dans l\'hexagone', () => {
    CAS.forEach(([nom, spec]) => {
      const units = mk(spec);
      const byId = Object.fromEntries(units.map(u => [u.id, u]));
      layoutUnits(units).forEach(p => {
        const r = unitR(byId[p.id].type) * p.scale;
        expect(Math.abs(p.cy) + r, `${nom} — débordement vertical`).toBeLessThanOrEqual(HEX_HALF_H);
        expect(Math.abs(p.cx) + r, `${nom} — débordement horizontal`)
          .toBeLessThanOrEqual(halfWidthAt(Math.abs(p.cy) + r) + 0.5);
      });
    });
  });

  it('les pions ne montent jamais dans les bandes d\'information', () => {
    CAS.forEach(([nom, spec]) => {
      const units = mk(spec);
      const byId = Object.fromEntries(units.map(u => [u.id, u]));
      layoutUnits(units).forEach(p => {
        const r = unitR(byId[p.id].type) * p.scale;
        expect(p.cy - r, `${nom} — un pion mord la bande haute`).toBeGreaterThanOrEqual(BAND.top - 0.5);
        expect(p.cy + r, `${nom} — un pion mord la bande basse`).toBeLessThanOrEqual(BAND.bottom + 0.5);
      });
    });
  });

  it('les LOURDS occupent les rangées du haut, les ouvriers celles du bas', () => {
    const units = mk([['hero', 1], ['mech', 2], ['worker', 4]]);
    const pos = Object.fromEntries(layoutUnits(units).map(p => [p.id, p]));
    const basDesLourds = Math.max(pos.hero0.cy, pos.mech0.cy, pos.mech1.cy);
    const hautDesLegers = Math.min(...[0, 1, 2, 3].map(i => pos[`worker${i}`].cy));
    expect(basDesLourds).toBeLessThan(hautDesLegers);
  });

  it('un hex vide ne place rien', () => {
    expect(layoutUnits([])).toEqual([]);
    expect(layoutUnits(null)).toEqual([]);
  });
});

describe('bandes d\'information', () => {
  it('les pastilles sont centrées et ne se chevauchent jamais', () => {
    [[24], [24, 18], [24, 18, 16], [24, 18, 16, 16, 16]].forEach(widths => {
      const xs = layoutStrip(widths, STRIP_TOP_Y);
      expect(xs).toHaveLength(widths.length);
      // centrées : les deux extrémités sont symétriques
      const gauche = xs[0] - widths[0] / 2, droite = xs[xs.length - 1] + widths[widths.length - 1] / 2;
      expect(Math.abs(gauche + droite)).toBeLessThan(0.01);
      // le jeu se resserre, les pastilles gardent leur taille : jamais de recouvrement
      for (let i = 1; i < xs.length; i++)
        expect(xs[i] - widths[i] / 2).toBeGreaterThanOrEqual(xs[i - 1] + widths[i - 1] / 2 - 0.01);
    });
  });

  it('jusqu\'à trois pastilles, la bande tient dans l\'hexagone', () => {
    [[24], [24, 18], [24, 18, 16]].forEach(widths => {
      const xs = layoutStrip(widths, STRIP_TOP_Y);
      expect(xs[xs.length - 1] + widths[widths.length - 1] / 2).toBeLessThanOrEqual(halfWidthAt(STRIP_TOP_Y));
    });
  });

  it('les deux bandes sont hors de la bande des pions', () => {
    expect(STRIP_TOP_Y + 12).toBeLessThanOrEqual(BAND.top);      // pastille r≈12
    expect(STRIP_BOTTOM_Y - 9).toBeGreaterThanOrEqual(BAND.bottom); // chip h≈18
  });
});
