// Mode Atelier — le générateur doit parler EXACTEMENT la même langue que les
// plateaux écrits à la main : mêmes invariants (Σ13, Σ6$, 6 cubes, 6 cases),
// et jamais un plateau déjà publié. Un plateau forgé se joue tel quel, sans
// relecture humaine — c'est ce fichier qui en répond.
import { describe, it, expect } from 'vitest';
import {
  TOP_ORDERS, BASE_COMBOS, BONUS_COMBOS, BASE_SLOT_PAIRS, WEALTH_TIERS, MAT_SPACE,
  UNEXPLORED, PUBLISHED_IN_SPACE, PUBLISHED_SIGNATURES, TOP_CUBES_BY_ACTION, BOTTOM_RES,
  matSignature, inMatSpace, forgeMat, drawConfig, matTraits, matSource, slotCombos,
} from '../../data/matGen.js';
import { ALL_MATS, MATS, MATS_ORIGINAL, BOTTOM, matById, maxBottomCubes, getBottomCost, registerWorkshopMat } from '../../data/mats.js';
import { parseForgedMats, loadForgedMats, saveForgedMats, adoptSavedMats, matsUsedBy, WORKSHOP_KEY } from '../workshop.js';
import { mulberry32 } from '../headlessGame.js';
import { createPlayer } from '../player.js';

const fakeStorage = () => {
  const data = {};
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: k => { delete data[k]; }, data };
};

describe('espace des configurations', () => {
  it('se décompose en 24 × 7 × 44 × 248', () => {
    expect(TOP_ORDERS.length).toBe(24);
    expect(WEALTH_TIERS.length).toBe(7);
    expect(BONUS_COMBOS.length).toBe(44);
    expect(BASE_COMBOS.length).toBe(16);
    expect(BASE_SLOT_PAIRS.length).toBe(248);
    expect(MAT_SPACE.total).toBe(1833216);
  });

  it('les coûts tiennent la grammaire (bases 2-4 Σ13, bonus 0-3 Σ6, cases Σ6 ≤ base-1)', () => {
    BASE_COMBOS.forEach(b => {
      expect(b.reduce((a, v) => a + v, 0)).toBe(13);
      b.forEach(v => { expect(v).toBeGreaterThanOrEqual(2); expect(v).toBeLessThanOrEqual(4); });
    });
    BONUS_COMBOS.forEach(b => {
      expect(b.reduce((a, v) => a + v, 0)).toBe(6);
      b.forEach(v => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(3); });
    });
    BASE_SLOT_PAIRS.forEach(({ bases, slots }) => {
      expect(slots.reduce((a, v) => a + v, 0)).toBe(6);
      slots.forEach((s, i) => expect(s).toBeLessThanOrEqual(bases[i] - 1));
    });
  });

  it('un jeu de coûts sans 2 offre 17 dispositions de cases, 15 sinon', () => {
    expect(slotCombos([3, 3, 3, 4]).length).toBe(17);
    expect(slotCombos([2, 4, 4, 3]).length).toBe(15);
  });

  // Si un plateau écrit à la main sortait de l'espace, l'atelier ne tirerait
  // pas dans le même jeu que celui qu'on joue.
  it('les 13 plateaux publiés (6 Panamerica + 7 originaux) vivent dans l\'espace', () => {
    [...MATS, ...MATS_ORIGINAL].forEach(m => expect(inMatSpace(m), m.name).toBe(true));
    expect(PUBLISHED_IN_SPACE.length).toBe(13);
  });

  it('« Le Réseau » en est volontairement dehors (4♥/3$, piste à 4 cases)', () => {
    expect(inMatSpace(matById(200))).toBe(false);
  });

  it('reste 1 833 203 plateaux inédits', () => {
    expect(UNEXPLORED).toBe(MAT_SPACE.total - 13);
    expect(UNEXPLORED).toBe(1833203);
  });

  it('deux plateaux publiés ne partagent jamais une signature', () => {
    expect(PUBLISHED_SIGNATURES.size).toBe(ALL_MATS.length);
  });
});

describe('plateaux forgés', () => {
  const rng = mulberry32(20260811);
  const batch = [];
  for (let i = 0; i < 200; i++) {
    const m = forgeMat(batch, rng);
    expect(m).not.toBeNull();
    batch.push(m);
  }

  it('respectent les invariants du jeu (6 cubes, 6 cases, Σ13, Σ6$)', () => {
    batch.forEach(mat => {
      expect(mat.topCubes.reduce((a, b) => a + b, 0), mat.name).toBe(6);
      expect(BOTTOM.map((_, i) => maxBottomCubes(mat, i)).reduce((a, b) => a + b, 0), mat.name).toBe(6);
      expect(mat.bottomCosts.reduce((a, bc) => a + bc.base, 0), mat.name).toBe(13);
      expect(mat.bottomCosts.reduce((a, bc) => a + bc.bonus, 0), mat.name).toBe(6);
      mat.bottomCosts.forEach((bc, i) => {
        expect(bc.res).toBe(BOTTOM_RES[i]);
        expect(bc.base).toBeGreaterThanOrEqual(2);
        expect(bc.base).toBeLessThanOrEqual(4);
        expect(bc.bonus).toBeGreaterThanOrEqual(0);
      });
      mat.topRow.forEach((a, i) => expect(mat.topCubes[i], `${mat.name} ${a}`).toBe(TOP_CUBES_BY_ACTION[a]));
      expect(inMatSpace(mat), mat.name).toBe(true);
    });
  });

  it('ne reproduisent jamais un plateau publié ni un autre plateau forgé', () => {
    const sigs = batch.map(matSignature);
    sigs.forEach(s => expect(PUBLISHED_SIGNATURES.has(s)).toBe(false));
    expect(new Set(sigs).size).toBe(batch.length);
  });

  it('portent un nom unique et un id d\'atelier croissant', () => {
    const names = batch.map(m => m.name);
    expect(names.every(n => typeof n === 'string' && n.length > 2)).toBe(true);
    expect(new Set(names).size).toBe(batch.length);
    expect(new Set([...names, ...ALL_MATS.map(m => m.name)]).size).toBe(batch.length + ALL_MATS.length);
    expect(batch[0].id).toBe(900);
    batch.forEach((m, i) => { expect(m.id).toBe(900 + i); expect(m.workshop).toBe(true); });
  });

  it('couvrent réellement l\'espace (les tirages ne se figent pas sur un coin)', () => {
    expect(new Set(batch.map(m => m.topRow.join())).size).toBeGreaterThan(15);
    expect(new Set(batch.map(m => `${m.pop}/${m.coins}`)).size).toBe(7);
    expect(new Set(batch.map(m => m.bottomCosts.map(bc => bc.base).join())).size).toBe(16);
  });

  it('se lisent : traits et code source exploitables', () => {
    const traits = matTraits(batch[0]);
    expect(traits.length).toBe(5);
    traits.forEach(t => expect(t.text.length).toBeGreaterThan(0));
    expect(matSource(batch[0])).toContain(`id: ${batch[0].id}`);
    expect(matSource(batch[0])).toContain('bottomCosts');
  });

  it('un tirage isolé reste dans l\'espace', () => {
    const cfg = drawConfig(mulberry32(7));
    expect(inMatSpace(cfg)).toBe(true);
  });
});

describe('un plateau forgé se joue comme les autres', () => {
  it('matById le trouve et createPlayer le monte correctement', () => {
    const mat = forgeMat([], mulberry32(4612));
    registerWorkshopMat(mat);
    expect(matById(mat.id)).toBe(mat);
    const p = createPlayer('confederation', mat.id, false);
    expect(p.matName).toBe(mat.name);
    expect(p.pop).toBe(mat.pop);
    expect(p.coins).toBe(mat.coins);
    expect(p.topRow).toEqual(mat.topRow);
    expect(p.cubesOnTop.reduce((a, b) => a + b, 0)).toBe(6);
    // Le coût de départ, c'est la base imprimée : aucun cube n'est encore posé
    expect(getBottomCost(p).map(c => c.qty)).toEqual(mat.bottomCosts.map(bc => bc.base));
  });
});

describe('persistance de l\'atelier', () => {
  it('écarte tout ce qui ne respecte pas la grammaire', () => {
    const good = forgeMat([], mulberry32(11));
    const badSum = { ...good, id: 901, bottomCosts: good.bottomCosts.map((bc, i) => i === 0 ? { ...bc, base: 4 } : bc) }; // Σ14
    const noCubes = { ...good, id: 902, topCubes: undefined };
    const lowId = { ...good, id: 5 }; // écraserait un plateau du jeu
    expect(parseForgedMats([good, badSum, noCubes, lowId, null, { id: 903, name: 'x' }, 'nope'])).toEqual([good]);
    expect(parseForgedMats("pas un tableau")).toEqual([]);
  });

  it('fait un aller-retour par le stockage et réenregistre les plateaux', () => {
    const store = fakeStorage();
    const mat = forgeMat([], mulberry32(23));
    expect(saveForgedMats([mat], store)).toBe(true);
    expect(JSON.parse(store.getItem(WORKSHOP_KEY))).toHaveLength(1);
    const back = loadForgedMats(store);
    expect(back.map(m => m.name)).toEqual([mat.name]);
    expect(matById(mat.id)?.name).toBe(mat.name);
  });

  it('un stockage vide ou illisible ne casse rien', () => {
    expect(loadForgedMats(fakeStorage())).toEqual([]);
    const broken = fakeStorage(); broken.setItem(WORKSHOP_KEY, '{{{');
    expect(loadForgedMats(broken)).toEqual([]);
  });

  it('adopte les plateaux embarqués dans une sauvegarde, sans doublon', () => {
    const store = fakeStorage();
    const mat = forgeMat([], mulberry32(99));
    const first = adoptSavedMats([mat], [], store);
    expect(first).toHaveLength(1);
    expect(matById(mat.id)?.name).toBe(mat.name);
    expect(adoptSavedMats([mat], first, store)).toHaveLength(1);
  });

  it('matsUsedBy ne retient que les plateaux d\'atelier réellement en jeu', () => {
    const mat = forgeMat([], mulberry32(1234));
    registerWorkshopMat(mat);
    expect(matsUsedBy([{ matId: mat.id }, { matId: 1 }]).map(m => m.id)).toContain(mat.id);
    expect(matsUsedBy([{ matId: 1 }, { matId: 105 }])).toEqual([]);
  });
});
