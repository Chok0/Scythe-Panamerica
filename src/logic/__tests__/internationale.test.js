// ── L'Internationale Noire (v0.18) — faction de campagne, chapitres 2 et 8 ──
// Spec : docs/design/internationale_noire.md. Chaque test verrouille une des
// dérogations de la fiche : sans héros, quatre bases, Résilience, ouvriers
// combattants, vol de mecha avec capacité volée, réserve hors-plateau.
import { describe, it, expect } from 'vitest';
import { FACTIONS, FACTION_IDS, ALL_FACTION_IDS } from '../../data/factions.js';
import { matById } from '../../data/mats.js';
import { createPlayer, retreatFromHex, reentryHexes } from '../player.js';
import { getValidMoves, getValidMoves1Step } from '../movement.js';
import { combatUnitCount, getCombatBonus, isCombatUnit } from '../../data/combat.js';
import { getMechAbilities } from '../../data/mechAbilities.js';
import { heldHexes } from '../../data/control.js';
import { chapterById } from '../../data/campaign.js';
import { hMap, ADJ, hasR, CURRENT_MAP, factionBaseHexes, HOME_BASES, baseHexAt, homeBaseHex } from '../../data/hexes.js';
import { ENCOUNTERS } from '../../data/encounters.js';
import { getProduceCost, canPayProduce, produceTrackOf } from '../production.js';

const IN = 'internationale';
const mk = () => createPlayer(IN, 200, false);
// Le réseau une fois SORTI de ses bases : ses quatre ouvriers sur leurs hex
// de sortie. C'est l'état des tests qui portent sur le jeu lui-même
// (Résilience, combat, contrôle) — l'installation, elle, les laisse sur les
// bases (voir ci-dessous).
const sorti = () => {
  const p = mk();
  p.workers = FACTIONS[IN].anchors.map((hid, i) => ({ id: `${IN}_w${i}`, hexId: hid }));
  return p;
};

describe('fiche de faction', () => {
  it('existe, mais hors de la rotation standard (jamais tirée par un bot)', () => {
    expect(ALL_FACTION_IDS).toContain(IN);
    expect(FACTION_IDS).not.toContain(IN);
    expect(FACTION_IDS).toHaveLength(6);
  });

  it('sans héros, un ouvrier sur chacune de ses QUATRE bases, plateau imposé', () => {
    const p = mk();
    expect(p.hero).toBeNull();
    // Quatre bases au lieu d'une : un réseau n'a pas de capitale. Les ouvriers
    // sont visibles dès l'installation, posés dessus, et sortent au tour 1.
    const bases = factionBaseHexes(IN);
    expect(bases).toHaveLength(4);
    expect(p.workers.map(w => w.hexId)).toEqual(bases);
    expect(p.reserve).toBe(0);
    bases.forEach(id => expect(hMap[id].base).toBe(true));
    expect(FACTIONS[IN].anchors).toEqual([3, 20, 25, 40]);
    expect(FACTIONS[IN].fixedMat).toBe(200);
    expect(matById(200).name).toBe('Le Réseau');
  });

  it('chaque base donne sur SON hex de sortie, et un pas suffit', () => {
    const p = mk();
    factionBaseHexes(IN).forEach((bid, i) => {
      const sortie = FACTIONS[IN].anchors[i];
      expect(ADJ[bid], `base ${bid}`).toEqual([sortie]);
      expect(getValidMoves1Step(bid, IN, [], p, []), `sortie de ${bid}`).toContain(sortie);
    });
  });

  it('les six autres factions gardent UNE base', () => {
    FACTION_IDS.forEach(fid => expect(factionBaseHexes(fid), fid).toHaveLength(1));
  });

  // Deux des quatre ancrages portent un jeton Rencontre. Y POSER un ouvrier à
  // l'installation rendait ces deux rencontres injouables : elles ne se
  // déclenchent qu'en ENTRANT, et l'Internationale est la seule faction dont
  // les ouvriers les déclenchent (elle n'a pas de héros). Le départ hors
  // plateau les rend au jeu — on remonte SUR l'ancrage, donc on y entre.
  it('les ancrages qui portent une rencontre restent libres à l\'installation', () => {
    const p = mk();
    const surJeton = FACTIONS[IN].anchors.filter(id => CURRENT_MAP.encounterHexes.includes(id));
    expect(surJeton).toEqual([3, 40]);       // l'état de la carte v3 qui motive la règle
    surJeton.forEach(id => expect(p.workers.some(w => w.hexId === id)).toBe(false));
    // …et ces hex restent des destinations de réentrée : on peut y entrer.
    const portes = reentryHexes(p, new Set());
    surJeton.forEach(id => expect(portes).toContain(id));
  });

  it('les six autres factions démarrent bien POSÉES sur la carte', () => {
    FACTION_IDS.forEach(fid => {
      const p = createPlayer(fid, 1, false);
      expect(p.workers.length, fid).toBe(2);
      expect(p.reserve, fid).toBe(0);
    });
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
    expect(heldHexes(sorti()).size).toBe(4);       // les quatre sorties une fois investies
  });
});

describe('Résilience — rivières et marécages, dès le tour 1, ouvriers compris', () => {
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

  it('les lacs restent infranchissables — Résilience n\'est pas un passe-partout', () => {
    const lake = ADJ[20].find(id => hMap[id].t === 'lac');
    expect(lake).toBeDefined();
    expect(getValidMoves1Step(20, IN, [], p, [])).not.toContain(lake);
  });
});

describe('capacités : aucune en propre, uniquement les volées (fiche §7)', () => {
  it('les quatre slots sont vides au départ — rien à débloquer sans un vol', () => {
    const abil = getMechAbilities(IN, mk());
    expect(abil[0].name).toBe('Vitesse');            // commune à tout le roster
    expect(abil[1].name).toBe('—');                  // libéré par Résilience
    expect(abil[2].name).toBe('Capacité à voler');
    expect(abil[3].name).toBe('Capacité à voler');
    expect(FACTIONS[IN].riverwalk).toBeNull();
  });

  it('après un vol, les slots affichent la capacité ARRACHÉE et sa provenance', () => {
    const p = mk();
    p.stolenCombat = 'dominion'; p.stolenPosition = 'bayou';
    const abil = getMechAbilities(IN, p);
    expect(abil[2].name).toBe('Discipline (volé)');
    expect(abil[3].name).toBe('Pirogue (volé)');
    expect(abil[3].desc).toMatch(/Bayou/);
  });

  it('aucune capacité maison ne se glisse dans le mouvement', () => {
    const p = mk();
    // Le slot 1 ne fait rien : un ouvrier reste à 1 pas quoi qu'on débloque
    const base = getValidMoves(20, IN, [], p, [], 'worker', new Set()).length;
    [[0], [1], [0, 1, 2, 3]].forEach(ab =>
      expect(getValidMoves(20, IN, ab, p, [], 'worker', new Set()).length).toBe(base));
    // Le slot 3 sans vol n'ouvre aucun bond entre ancrages
    expect(getValidMoves1Step(3, IN, [3], p, [])).not.toContain(20);
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
    const p = sorti();
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
  // Le second membre ne demande plus de DÉTRUIRE deux patrouilles — détruire
  // est ce que la faction refuse de faire — mais de VOLER deux mechas, à
  // n'importe qui : c'est sa mécanique propre (`capturedMech`).
  it('« Atteindre l\'Empereur » exige la foule sur l\'Usine et deux mechas volés', () => {
    const ch = chapterById('ch2');
    expect(ch.kind).toBe('game');
    expect(ch.faction).toBe(IN);
    const p = mk();
    p.capturedMech = 2;
    expect(ch.canon.check(p, {})).toBe(false);            // aucun ouvrier sur l'Usine
    p.workers = [22, 22, 22].map((hexId, i) => ({ id: `w${i}`, hexId }));
    expect(ch.canon.check(p, {})).toBe(true);
    p.capturedMech = 1;
    expect(ch.canon.check(p, {})).toBe(false);            // un seul mecha arraché
    // …et tuer des patrouilles ne remplace plus le vol
    p.capturedMech = 0; p.empireKills = 5;
    expect(ch.canon.check(p, {})).toBe(false);
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

// ══════════════════════════════════════════════════════════════════════════
// Correctifs de la partie du 11/08 (premier test du chapitre 2)
// ══════════════════════════════════════════════════════════════════════════

describe('pas de base de retraite : la sortie est la RÉSERVE, jamais un crash', () => {
  // L'écran noir du 11/08 : `HOME_BASES` ne contient pas l'Internationale
  // Noire (ses quatre bases vivent dans NETWORK_BASES), et `baseHexAt(undefined)`
  // lisait `.rx` sur `undefined` — l'exception traversait tout l'arbre React
  // au moment de résoudre le combat contre une patrouille impériale.
  it('baseHexAt tolère une faction sans drapeau unique', () => {
    expect(() => baseHexAt(HOME_BASES[IN])).not.toThrow();
    expect(baseHexAt(HOME_BASES[IN])).toBeNull();
    expect(homeBaseHex(IN)).toBeNull();
  });

  it('les six autres factions gardent leur hex de base', () => {
    FACTION_IDS.forEach(fid => {
      expect(homeBaseHex(fid)).not.toBeNull();
      expect(baseHexAt(HOME_BASES[fid])?.id).toBe(homeBaseHex(fid).id);
    });
  });

  it('battue sur un hex, elle part en réserve au lieu de rentrer à la base', () => {
    const p = sorti();
    p.mechs = [{ id: 'm0', hexId: 3 }];
    const r = retreatFromHex(p, 3, homeBaseHex(IN)?.id ?? null);
    expect(r.toReserve).toBe(1);
    expect(r.mechsToReserve).toBe(1);
    expect(r.player.workers.some(w => w.hexId === 3)).toBe(false);
    expect(r.player.reserve).toBe(1);
    expect(r.player.reserveMechs).toBe(1);
  });
});

describe('récompenses de rencontre : elles se posent sur le hex ATTEINT', () => {
  // Sans héros, `p.hero` vaut null : les gains partaient sur la clé "null",
  // hors du plateau — payés (jusqu'à -2$ ou -3 pop), jamais reçus.
  const card = ENCOUNTERS.find(c => c.id === 1);   // « L'Épave Fumante »

  it('les ressources gagnées atterrissent sur l\'hex de la rencontre', () => {
    const p = sorti();
    p.encHex = 25;
    card.choices[0].effect(p);                     // +1 pop, +2 métal
    delete p.encHex;
    expect(p.resources['25'].metal).toBe(2);
    expect(p.resources.null).toBeUndefined();
  });

  it('un mecha gagné en rencontre se pose sur l\'hex, pas sur `null`', () => {
    const p = sorti();
    p.pop = 6; p.encHex = 20;
    card.choices[2].effect(p);                     // -3 pop, +1 mecha
    delete p.encHex;
    expect(p.mechs).toHaveLength(1);
    expect(p.mechs[0].hexId).toBe(20);
  });

  it('les six autres factions restent sur le hex de leur héros', () => {
    const p = createPlayer('frente', 1, false);
    p.hero = 41;
    card.choices[0].effect(p);
    expect(p.resources['41'].metal).toBe(2);
  });
});

describe('piste des ouvriers : elle démarre à QUATRE, pas à deux', () => {
  // Partie du 11/08 : « production requiert 1 de puissance à chaque fois dès
  // le début de partie ». Le coût lisait le total absolu d'ouvriers, calibré
  // sur un départ à 2 — les quatre ouvriers du réseau franchissaient d'office
  // le premier palier, sur la trésorerie la plus basse du jeu (3$).
  const reseau = matById(200);

  it('quatre ouvriers au départ, et Produire est gratuit', () => {
    const p = mk();
    expect(p.workers).toHaveLength(4);
    expect(getProduceCost(p.workers.length, reseau)).toEqual({ pui: 0, pop: 0, coins: 0 });
    expect(canPayProduce({ ...p, power: 0, coins: 0 })).toBe(true);
  });

  it('sa piste ne compte que 4 cases — le palier ⚡ tombe au 6e ouvrier', () => {
    const t = produceTrackOf(reseau);
    expect(t.start).toBe(4);
    expect(t.slots).toBe(4);
    expect(getProduceCost(5, reseau).pui).toBe(0);
    expect(getProduceCost(6, reseau)).toEqual({ pui: 1, pop: 0, coins: 0 });
    expect(getProduceCost(8, reseau)).toEqual({ pui: 1, pop: 1, coins: 0 });
  });

  it('les plateaux standard ne bougent pas d\'un iota', () => {
    const std = matById(1);
    expect(produceTrackOf(std)).toEqual({ start: 2, costs: { 1: 'pui', 3: 'pop', 5: 'coins' }, slots: 6 });
    expect(getProduceCost(3, std)).toEqual({ pui: 0, pop: 0, coins: 0 });
    expect(getProduceCost(4, std)).toEqual({ pui: 1, pop: 0, coins: 0 });
    expect(getProduceCost(6, std)).toEqual({ pui: 1, pop: 1, coins: 0 });
    expect(getProduceCost(8, std)).toEqual({ pui: 1, pop: 1, coins: 1 });
  });
});

describe('fiche : la capacité affichée ne porte QUE la capacité', () => {
  it('Résilience tient en une phrase, comme les six autres', () => {
    const f = FACTIONS[IN];
    expect(f.ability).toBe('Résilience');
    // Le pavé de six clauses de l'ancien texte débordait du panneau de jeu.
    expect(f.abilityDesc.length).toBeLessThan(160);
    expect(f.abilityDesc).toMatch(/rivière/i);
    expect(f.abilityDesc).toMatch(/marécage/i);
  });

  it('les dérogations structurelles sont listées à part', () => {
    const rules = FACTIONS[IN].rules;
    expect(rules.length).toBeGreaterThanOrEqual(4);
    expect(rules.join(' ')).toMatch(/héros/i);
    expect(rules.join(' ')).toMatch(/VOLEZ|vol/i);
    // Aucune autre faction n'a besoin de cette liste
    FACTION_IDS.forEach(fid => expect(FACTIONS[fid].rules).toBeUndefined());
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Deuxième test du chapitre 2 (11/08, soir) — les ouvriers SONT des soldats
// ══════════════════════════════════════════════════════════════════════════

describe('un ouvrier de l\'Internationale est une unité de combat à part entière', () => {
  // « J'ai pu aller sur le mech pour combattre, je pense que c'est parce que
  // j'avais un mecha : le soft n'a pas dû comprendre que les ouvriers
  // valaient pour unité de combat. » L'UI décidait en dur que seuls héros et
  // mechas se battent — trois endroits, tous alignés sur `isCombatUnit`.
  it('le type « ouvrier » compte comme combattant pour elle, et pour elle seule', () => {
    expect(isCombatUnit(IN, 'worker')).toBe(true);
    expect(isCombatUnit(IN, 'mech')).toBe(true);
    expect(isCombatUnit(IN, 'hero')).toBe(true);
    FACTION_IDS.forEach(fid => {
      expect(isCombatUnit(fid, 'worker')).toBe(false);
      expect(isCombatUnit(fid, 'mech')).toBe(true);
    });
  });

  it('cohérent avec le décompte de cartes de combat : même dérogation', () => {
    const p = sorti();
    // Trois ouvriers réunis = trois unités combattantes sur l'hex
    p.workers = [3, 3, 3].map((hexId, i) => ({ id: `w${i}`, hexId }));
    expect(combatUnitCount(p, 3)).toBe(3);
    const frente = createPlayer('frente', 1, false);
    frente.workers = [41, 41].map((hexId, i) => ({ id: `w${i}`, hexId }));
    expect(combatUnitCount(frente, 41)).toBe(0);
    expect(isCombatUnit('frente', 'worker')).toBe(false);
  });

  it('un hex tenu par ses seuls ouvriers est DÉFENDU, pas dispersable', () => {
    // Le test du moteur : `combatUnitCount > 0` décide qui défend. Un mecha
    // adverse qui arrive doit livrer bataille, pas chasser les ouvriers.
    const p = sorti();
    expect(combatUnitCount(p, 3)).toBeGreaterThan(0);
    const bayou = createPlayer('bayou', 1, false);
    bayou.workers = [{ id: 'w0', hexId: 35 }];
    bayou.hero = 28;
    expect(combatUnitCount(bayou, 35)).toBe(0);   // ouvriers seuls : dispersables
  });
});

describe('réserve du réseau : ce qui remonte est un CHOIX', () => {
  it('ouvriers et mechas vaincus sont comptés séparément', () => {
    const p = sorti();
    p.mechs = [{ id: 'm0', hexId: 20 }];
    p.workers = [{ id: 'w0', hexId: 20 }, { id: 'w1', hexId: 20 }, { id: 'w2', hexId: 3 }];
    const r = retreatFromHex(p, 20, null);
    expect(r.toReserve).toBe(2);
    expect(r.mechsToReserve).toBe(1);
    expect(r.player.reserve).toBe(2);
    expect(r.player.reserveMechs).toBe(1);
    // L'ouvrier resté sur #3 n'a pas bougé
    expect(r.player.workers.map(w => w.hexId)).toEqual([3]);
  });

  it('les points de remontée restent ouverts tant qu\'un ancrage est libre', () => {
    const p = sorti();
    // Trois ancrages étouffés : la quatrième porte suffit à rentrer
    const foes = new Set([3, 20, 25]);
    const targets = reentryHexes(p, foes);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets).toContain(40);
    // Les quatre étouffés simultanément : plus aucune porte (règle assumée)
    expect(reentryHexes(p, new Set([3, 20, 25, 40, ...ADJ[40], ...ADJ[3], ...ADJ[20], ...ADJ[25]]))).toHaveLength(0);
  });
});
