// ── L'Internationale Noire (v0.18) — faction de campagne, chapitres 2 et 8 ──
// Spec : docs/design/internationale_noire.md. Chaque test verrouille une des
// dérogations de la fiche : sans héros, sans base, La Nage, ouvriers
// combattants, vol de mecha avec capacité volée, réserve hors-plateau.
import { describe, it, expect } from 'vitest';
import { FACTIONS, FACTION_IDS, ALL_FACTION_IDS } from '../../data/factions.js';
import { matById } from '../../data/mats.js';
import { createPlayer, retreatFromHex, reentryHexes } from '../player.js';
import { getValidMoves, getValidMoves1Step } from '../movement.js';
import { combatUnitCount, getCombatBonus } from '../../data/combat.js';
import { getMechAbilities } from '../../data/mechAbilities.js';
import { heldHexes } from '../../data/control.js';
import { chapterById } from '../../data/campaign.js';
import { hMap, ADJ, hasR } from '../../data/hexes.js';

const IN = 'internationale';
const mk = () => createPlayer(IN, 200, false);

describe('fiche de faction', () => {
  it('existe, mais hors de la rotation standard (jamais tirée par un bot)', () => {
    expect(ALL_FACTION_IDS).toContain(IN);
    expect(FACTION_IDS).not.toContain(IN);
    expect(FACTION_IDS).toHaveLength(6);
  });

  it('sans héros, 4 ouvriers sur les points d\'ancrage, plateau imposé', () => {
    const p = mk();
    expect(p.hero).toBeNull();
    expect(p.workers.map(w => w.hexId).sort((a, b) => a - b)).toEqual([3, 20, 25, 40]);
    expect(FACTIONS[IN].anchors).toEqual([3, 20, 25, 40]);
    expect(FACTIONS[IN].fixedMat).toBe(200);
    expect(matById(200).name).toBe('Le Réseau');
  });

  it('la plus faible en duel, la plus haute en popularité (fiche §2)', () => {
    const p = mk();
    expect(p.power).toBe(2);
    expect(p.combatCards).toBe(1);
    expect(p.pop).toBe(4);   // le coussin de survie : elle perd des ouvriers en permanence
    expect(p.coins).toBe(3); // …payé par la trésorerie la plus basse du jeu
    FACTION_IDS.forEach(fid => expect(FACTIONS[fid].cards).toBeGreaterThanOrEqual(p.combatCards));
  });

  it('les ancrages ne sont PAS des bases : le terrain reste praticable par tous', () => {
    FACTIONS[IN].anchors.forEach(id => expect(hMap[id].base).toBeFalsy());
    // …et un hex tenu par un `null` ne pollue pas le décompte de contrôle
    expect(heldHexes(mk()).has(null)).toBe(false);
    expect(heldHexes(mk()).size).toBe(4);
  });
});

describe('La Nage — toutes les rivières, dès le tour 1, ouvriers compris', () => {
  const p = mk();
  // #40 (désert, ancrage) est séparé des villages #36 et #46 par une rivière.
  it('un ouvrier franchit une rivière sans aucune capacité débloquée', () => {
    expect(hasR(40, 36)).toBe(true);
    const moves = getValidMoves1Step(40, IN, [], p, []);
    expect(moves).toContain(36);
    expect(moves).toContain(46);
  });

  it('aucune autre faction ne passe là sans son riverwalk', () => {
    const other = { faction: 'frente', hero: 40, workers: [], mechs: [] };
    expect(getValidMoves1Step(40, 'frente', [], other, [])).not.toContain(36);
  });

  it('les lacs restent infranchissables — La Nage n\'est pas un passe-partout', () => {
    const lake = ADJ[20].find(id => hMap[id].t === 'lac');
    expect(lake).toBeDefined();
    expect(getValidMoves1Step(20, IN, [], p, [])).not.toContain(lake);
  });
});

describe('capacités du réseau (slots de mecha)', () => {
  it('le slot 1 porte les Passeurs, pas un riverwalk (La Nage le remplace)', () => {
    const abil = getMechAbilities(IN);
    expect(abil[1].name).toBe('Passeurs');
    expect(abil[3].name).toBe('Tunnels');
    expect(FACTIONS[IN].riverwalk).toBeNull();
  });

  it('Passeurs : les OUVRIERS passent à 2 pas (seule capacité du jeu à le faire)', () => {
    const p = mk();
    const sans = getValidMoves(20, IN, [], p, [], 'worker', new Set()).length;
    const avec = getValidMoves(20, IN, [1], p, [], 'worker', new Set()).length;
    expect(avec).toBeGreaterThan(sans);
    // La Vitesse, elle, continue de n'affecter que héros et mechas
    expect(getValidMoves(20, IN, [0], p, [], 'worker', new Set()).length).toBe(sans);
  });

  it('Tunnels : bond d\'un ancrage à l\'autre, jamais depuis ailleurs', () => {
    const p = mk();
    const fromAnchor = getValidMoves1Step(3, IN, [3], p, []);
    expect(fromAnchor).toEqual(expect.arrayContaining([20, 25, 40]));
    // #7 n'est pas un ancrage : aucun bond
    expect(getValidMoves1Step(7, IN, [3], p, [])).not.toContain(20);
  });
});

describe('les ouvriers combattent (dérogation de la fiche §5)', () => {
  it('chaque ouvrier présent autorise une carte de combat de plus', () => {
    const p = mk();
    p.workers = [{ id: 'w1', hexId: 20 }, { id: 'w2', hexId: 20 }, { id: 'w3', hexId: 20 }];
    p.mechs = [{ id: 'm1', hexId: 20 }];
    expect(combatUnitCount(p, 20)).toBe(4);      // 3 ouvriers + 1 mecha
    expect(combatUnitCount(p, 20, 1)).toBe(5);   // + l'unité qui entre
  });

  it('les ouvriers des autres factions ne comptent toujours pas', () => {
    const other = createPlayer('nations', 1, false);
    const hex = other.workers[0].hexId;
    expect(combatUnitCount(other, hex)).toBe(0);
    other.mechs = [{ id: 'm', hexId: hex }];
    expect(combatUnitCount(other, hex)).toBe(1);
  });
});

describe('vol de mecha — la capacité volée est celle du vaincu', () => {
  it('le bonus de combat lit la faction VOLÉE, pas la sienne', () => {
    const p = mk();
    p.unlockedAbilities = [2];
    p.workers = [{ id: 'w', hexId: 20 }];
    // Sans provenance : c'est le Sabotage du réseau (≥2 ouvriers → +1 carte)
    expect(getCombatBonus(p, 20, true).name).toBe('Sabotage');
    // Après un vol au Dominion : c'est la Discipline qui s'applique
    p.stolenCombat = 'dominion';
    p.combatCards = 5;
    const b = getCombatBonus(p, 20, true, 0);
    expect(b.name).toBe('Discipline');
    expect(b.powerBonus).toBe(2);
  });

  it('la position volée change le bond disponible', () => {
    const p = mk();
    p.stolenPosition = 'bayou';
    p.hero = null;
    // Bayou = bond marais↔marais : depuis l'ancrage #20 (marécage) vers #3
    expect(getValidMoves1Step(20, IN, [3], p, [])).toContain(3);
  });
});

describe('réserve hors-plateau et réentrée (fiche §3)', () => {
  it('un ouvrier vaincu part en réserve, pas sur une base', () => {
    const p = mk();
    const r = retreatFromHex(p, 20, null);
    expect(r.player.workers).toHaveLength(3);
    expect(r.player.reserve).toBe(1);
  });

  it('les autres factions rentrent bien sur leur base', () => {
    const nat = createPlayer('nations', 1, false);
    const hex = nat.workers[0].hexId;
    const r = retreatFromHex(nat, hex, 900);
    expect(r.player.reserve).toBe(0);
    expect(r.player.workers.some(w => w.hexId === 900)).toBe(true);
  });

  it('occuper UN ancrage ne ferme que cette porte', () => {
    const p = mk();
    const libre = reentryHexes(p, new Set());
    const bloque = reentryHexes(p, new Set([3]));
    expect(bloque.length).toBeLessThan(libre.length);
    expect(bloque).not.toContain(3);
    expect(bloque.length).toBeGreaterThan(0); // les trois autres restent ouvertes
    // Étouffer la faction exige les quatre simultanément
    expect(reentryHexes(p, new Set([3, 20, 25, 40, ...ADJ[3], ...ADJ[20], ...ADJ[25], ...ADJ[40]]))).toEqual([]);
  });
});

describe('chapitres 2 et 8 — jouables, conditions canon', () => {
  it('« Atteindre l\'Empereur » exige la foule sur l\'Usine et le cordon percé', () => {
    const ch = chapterById('ch2');
    expect(ch.kind).toBe('game');
    expect(ch.faction).toBe(IN);
    const p = mk();
    p.empireKills = 2;
    expect(ch.canon.check(p, {})).toBe(false);            // aucun ouvrier sur l'Usine
    p.workers = [22, 22, 22].map((hexId, i) => ({ id: `w${i}`, hexId }));
    expect(ch.canon.check(p, {})).toBe(true);
    p.empireKills = 1;
    expect(ch.canon.check(p, {})).toBe(false);            // cordon pas percé
  });

  it('« Arrêter la chaîne » exige la durée ET les mechas arrachés', () => {
    const ch = chapterById('ch8');
    expect(ch.kind).toBe('game');
    const p = mk();
    p.factoryHeldTurns = 3; p.capturedMech = 2;
    expect(ch.canon.check(p, {})).toBe(false);
    p.capturedMech = 3;
    expect(ch.canon.check(p, {})).toBe(true);
    p.factoryHeldTurns = 0; // l'Usine lâchée remet le compteur à zéro
    expect(ch.canon.check(p, {})).toBe(false);
  });

  it('objectif de faction : l\'Usine plus trois villages', () => {
    const p = mk();
    p.workers = [22, 4, 6].map((hexId, i) => ({ id: `w${i}`, hexId }));
    expect(FACTIONS[IN].fObj.check(p, {})).toBe(false);   // 2 villages
    p.workers.push({ id: 'w4', hexId: 14 });
    expect(FACTIONS[IN].fObj.check(p, {})).toBe(true);
    // Sans l'Usine, trois villages ne suffisent pas
    p.workers = p.workers.filter(w => w.hexId !== 22);
    expect(FACTIONS[IN].fObj.check(p, {})).toBe(false);
    // Un bâtiment tient un village… sauf si une unité adverse s'y installe
    const p2 = mk();
    p2.workers = [22, 4, 6].map((hexId, i) => ({ id: `w${i}`, hexId }));
    p2.buildings = [{ type: 'moulin', hexId: 14 }];
    expect(FACTIONS[IN].fObj.check(p2, {})).toBe(true);
    const foe = { faction: 'dominion', hero: 14, workers: [], mechs: [] };
    expect(FACTIONS[IN].fObj.check(p2, { players: [p2, foe] })).toBe(false);
  });
});
