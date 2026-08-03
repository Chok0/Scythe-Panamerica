import { describe, it, expect } from 'vitest';
import { CHAPTERS, chapterById, FACTORY_HEX, controlsFactory, heldHexes, partMet, partProgress } from '../../data/campaign.js';
import { FACTIONS } from '../../data/factions.js';
import { LEGACIES, LEGACY_IDS } from '../../data/legacies.js';
import { hMap } from '../../data/hexes.js';
import { EMPIRE_RAILS } from '../../data/empire.js';
import {
  emptyProgress, normalizeProgress, loadProgress, saveProgress, resetProgress,
  isChapterUnlocked, isChapterDone, chapterStates, nextChapter, campaignComplete,
  canonMet, completeChapter, unlockedLegacies, campaignConfig, steelTick, CAMPAIGN_KEY,
  teslaEncountersUnlocked, teslaPlansUnlocked, empireRailDone, growEmpireRail,
  campaignEncounterPool,
} from '../campaign.js';
import { ENCOUNTERS, RAIL_ENCOUNTERS, hasTeslaFragment } from '../../data/encounters.js';
import { createPlayer } from '../player.js';

// localStorage de test (l'API réelle n'existe pas sous vitest/node)
const fakeStore = () => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _raw: m,
  };
};

// Termine une suite de chapitres d'affilée (condition canon remplie)
const doneUpTo = (n) => CHAPTERS.slice(0, n).reduce(
  (prog, c) => completeChapter(prog, c.id, { victory: c.canon ? "canon" : "lu", canonMet: true }).progress,
  emptyProgress());

describe('données de campagne', () => {
  it('8 chapitres, numérotés et ordonnés, sans id ni faction dupliquée', () => {
    expect(CHAPTERS.length).toBe(8);
    CHAPTERS.forEach((c, i) => expect(c.num).toBe(i + 1));
    expect(new Set(CHAPTERS.map(c => c.id)).size).toBe(8);
    // les 6 chapitres jouables couvrent les 6 factions du roster, une fois chacune
    const playable = CHAPTERS.filter(c => c.kind === 'game');
    expect(playable.length).toBe(6);
    expect(new Set(playable.map(c => c.faction)).size).toBe(6);
  });

  it('chaque chapitre jouable a une condition canon et du texte des deux côtés', () => {
    CHAPTERS.forEach(c => {
      expect(c.before.length, `${c.id} sans histoire avant`).toBeGreaterThan(0);
      expect(c.after.length, `${c.id} sans histoire après`).toBeGreaterThan(0);
      if (c.kind === 'game') {
        expect(c.canon, `${c.id} sans condition canon`).toBeTruthy();
        expect(typeof c.canon.check).toBe('function');
      } else {
        // interlude : pas de condition mécanique, mais la piste est conservée
        expect(c.canon).toBeNull();
        expect(c.canonDraft, `${c.id} sans piste de condition`).toBeTruthy();
      }
    });
  });

  it('les 5 récompenses de campagne sont débloquées par des chapitres jouables distincts', () => {
    expect(LEGACY_IDS.length).toBe(5);
    const unlocks = CHAPTERS.map(c => c.unlock).filter(Boolean);
    expect(new Set(unlocks).size).toBe(unlocks.length);
    LEGACY_IDS.forEach(id => {
      const ch = chapterById(LEGACIES[id].chapter);
      expect(ch, `legs ${id} sans chapitre`).toBeTruthy();
      expect(ch.unlock, `legs ${id} non référencé par ${ch.id}`).toBe(id);
      expect(ch.kind).toBe('game');
    });
  });
});

describe('ordre causal', () => {
  it('seul le chapitre 1 est ouvert au départ', () => {
    const p = emptyProgress();
    expect(isChapterUnlocked(p, 'ch1')).toBe(true);
    CHAPTERS.slice(1).forEach(c => expect(isChapterUnlocked(p, c.id)).toBe(false));
    expect(nextChapter(p).id).toBe('ch1');
  });

  it('un chapitre terminé ouvre le suivant, et lui seul', () => {
    const p = doneUpTo(1);
    expect(isChapterDone(p, 'ch1')).toBe(true);
    expect(isChapterUnlocked(p, 'ch2')).toBe(true);
    expect(isChapterUnlocked(p, 'ch3')).toBe(false);
    expect(nextChapter(p).id).toBe('ch2');
  });

  it('les interludes 2 et 8 ne bloquent pas la progression (lus, ils ouvrent la suite)', () => {
    const p = completeChapter(doneUpTo(1), 'ch2', { victory: 'lu', canonMet: false }).progress;
    expect(isChapterUnlocked(p, 'ch3')).toBe(true);
  });

  it('campagne complète après les 8 chapitres', () => {
    const p = doneUpTo(8);
    expect(campaignComplete(p)).toBe(true);
    expect(nextChapter(p)).toBeNull();
    expect(chapterStates(p).every(s => s.unlocked && s.done)).toBe(true);
  });
});

describe('déblocage des legs', () => {
  it('la victoire canon débloque le legs du chapitre', () => {
    const { progress, legacy } = completeChapter(emptyProgress(), 'ch1', { victory: 'canon' });
    expect(legacy.id).toBe('railCards');
    expect(unlockedLegacies(progress).map(l => l.id)).toEqual(['railCards']);
  });

  it('la victoire aux 6 étoiles termine le chapitre SANS donner le legs', () => {
    const { progress, legacy } = completeChapter(emptyProgress(), 'ch1', { victory: 'stars', canonMet: false });
    expect(legacy).toBeNull();
    expect(isChapterDone(progress, 'ch1')).toBe(true);
    expect(progress.legacies).toEqual([]);
  });

  it('rejouer un chapitre ne duplique pas son legs', () => {
    const a = completeChapter(emptyProgress(), 'ch1', { victory: 'canon' }).progress;
    const b = completeChapter(a, 'ch1', { victory: 'canon' });
    expect(b.legacy).toBeNull();
    expect(b.progress.legacies).toEqual(['railCards']);
  });

  it('un chapitre inconnu ne modifie rien', () => {
    const { progress, legacy } = completeChapter(emptyProgress(), 'ch99', { victory: 'canon' });
    expect(legacy).toBeNull();
    expect(progress.done).toEqual({});
  });
});

describe('persistance', () => {
  it('sauvegarde puis relecture conservent progression et legs', () => {
    const store = fakeStore();
    const p = completeChapter(emptyProgress(), 'ch1', { victory: 'canon' }).progress;
    expect(saveProgress(p, store)).toBe(true);
    const back = loadProgress(store);
    expect(back.done.ch1.victory).toBe('canon');
    expect(back.legacies).toEqual(['railCards']);
    expect(resetProgress(store).done).toEqual({});
    expect(store.getItem(CAMPAIGN_KEY)).toBeNull();
  });

  it('une sauvegarde corrompue ou étrangère retombe sur une progression vierge', () => {
    const store = fakeStore();
    store.setItem(CAMPAIGN_KEY, '{pas du json');
    expect(loadProgress(store).done).toEqual({});
    // chapitres et legs inconnus filtrés
    expect(normalizeProgress({ done: { chZZ: { victory: 'canon' } }, legacies: ['inconnu'] }))
      .toEqual({ v: 1, done: {}, legacies: [] });
  });
});

describe('conditions canon', () => {
  it('aucune condition canon n\'est remplie par un joueur fraîchement créé', () => {
    CHAPTERS.filter(c => c.canon).forEach(c => {
      const p = createPlayer(c.faction, 1, false);
      expect(canonMet(c, p, { players: [p] }), `${c.id} validé au tour 1`).toBe(false);
    });
  });

  it('ch1 : l\'objectif Nations ne suffit pas — il faut 2 patrouilles détruites', () => {
    const c = chapterById('ch1');
    const p = createPlayer('nations', 1, false);
    // 4 hex Plaine/Forêt tenus (#10 forêt, #17 plaine de départ + 2 mechas)
    p.mechs = [{ id: 'm0', hexId: 7 }, { id: 'm1', hexId: 12 }];
    expect(canonMet(c, p, { players: [p] })).toBe(false);
    p.empireKills = 1;
    expect(canonMet(c, p, { players: [p] })).toBe(false);
    p.empireKills = 2;
    expect(canonMet(c, p, { players: [p] })).toBe(true);
  });

  it('ch4 : contrôler l\'Usine ne suffit pas sans avoir chassé la garnison', () => {
    const c = chapterById('ch4');
    const p = createPlayer('confederation', 1, false);
    p.hero = FACTORY_HEX;
    expect(controlsFactory(p)).toBe(true);
    expect(canonMet(c, p, { players: [p] })).toBe(false);
    p.empireKills = 1;
    expect(canonMet(c, p, { players: [p] })).toBe(true);
    // ...et l'Usine perdue annule la condition
    p.hero = 29;
    expect(canonMet(c, p, { players: [p] })).toBe(false);
  });

  it('ch6 : Le Tribut suit le compteur de Commerce Impérial', () => {
    const c = chapterById('ch6');
    const p = createPlayer('dominion', 1, false);
    p.imperialCoins = 19;
    expect(canonMet(c, p, { players: [p] })).toBe(false);
    p.imperialCoins = 20;
    expect(canonMet(c, p, { players: [p] })).toBe(true);
  });

  it('un interlude n\'a pas de voie canon', () => {
    const p = createPlayer('bayou', 1, false);
    expect(canonMet(chapterById('ch2'), p, { players: [p] })).toBe(false);
  });
});

describe('configuration de partie', () => {
  it('les variantes se traduisent en réglages de partie', () => {
    expect(campaignConfig(chapterById('ch1'))).toMatchObject({ faction: 'nations', empireEnabled: true, steel: false, bonusTile: null, railGrowth: true });
    expect(campaignConfig(chapterById('ch6'))).toMatchObject({ faction: 'dominion', empireEnabled: false, steel: true, railGrowth: false });
    // Ruée vers l'or : tuile forcée, pas tirée
    expect(campaignConfig(chapterById('ch3')).bonusTile.id).toBe('terres_lointaines');
  });
});

describe('verrou du contenu Tesla', () => {
  it('fermé tant que les chapitres 3 et 4 ne sont pas remportés par la voie canon', () => {
    expect(teslaEncountersUnlocked(emptyProgress())).toBe(false);
    expect(teslaPlansUnlocked(emptyProgress())).toBe(false);
    const stars3 = completeChapter(emptyProgress(), 'ch3', { victory: 'stars', canonMet: false }).progress;
    expect(teslaEncountersUnlocked(stars3)).toBe(false); // 6 étoiles ≠ condition canon
  });

  it('les cartes rencontre s\'ouvrent au chapitre 3 canon, les plans T à l\'usine au chapitre 4', () => {
    const afterCh3 = completeChapter(emptyProgress(), 'ch3', { victory: 'canon' }).progress;
    expect(teslaEncountersUnlocked(afterCh3)).toBe(true);
    expect(teslaPlansUnlocked(afterCh3)).toBe(false);
    const afterCh4 = completeChapter(afterCh3, 'ch4', { victory: 'canon' }).progress;
    expect(teslaPlansUnlocked(afterCh4)).toBe(true);
  });
});

describe('conditions canon décomposées en membres', () => {
  it('chaque condition expose ses membres, et `desc` en est généré', () => {
    CHAPTERS.filter(c => c.canon).forEach(c => {
      expect(Array.isArray(c.canon.parts), `${c.id} sans membres`).toBe(true);
      expect(c.canon.parts.length).toBeGreaterThan(0);
      c.canon.parts.forEach(pt => {
        expect(typeof pt.label).toBe('string');
        expect(typeof pt.count).toBe('function');
        expect(pt.need).toBeGreaterThan(0);
      });
      // desc généré → il mentionne chaque membre : plus de phrase figée qui
      // pourrait mentir sur ce que le moteur vérifie réellement
      c.canon.parts.forEach(pt => expect(c.canon.desc).toContain(pt.label));
    });
  });

  it('`check` est DÉRIVÉ des membres : tous remplis ⇔ condition remplie', () => {
    const c = chapterById('ch1');
    const p = createPlayer('nations', 1, false);
    p.mechs = [{ id: 'm0', hexId: 7 }, { id: 'm1', hexId: 12 }]; // 4 hex plaine/forêt avec #10 et #17
    p.empireKills = 2;
    expect(c.canon.parts.every(pt => partMet(pt, p, {}))).toBe(true);
    expect(c.canon.check(p, {})).toBe(true);
    p.empireKills = 1; // un seul membre retombe
    expect(c.canon.parts.every(pt => partMet(pt, p, {}))).toBe(false);
    expect(c.canon.check(p, {})).toBe(false);
  });

  it('la progression par membre reflète l\'état réel (le bug du 01/08)', () => {
    // Position exacte du joueur au tour 17 : patrouilles faites, hex à 2/4.
    const c = chapterById('ch1');
    const p = createPlayer('nations', 1, false);
    p.hero = 41;                                    // champs
    p.workers = [10, 31, 34].map((h, i) => ({ id: `w${i}`, hexId: h })); // forêt, montagne, forêt
    p.mechs = [{ id: 'm0', hexId: 38 }];            // champs
    p.empireKills = 2;
    const [hexes, patrouilles] = c.canon.parts;
    expect(partProgress(hexes, p, {})).toBe('2/4');
    expect(partMet(hexes, p, {})).toBe(false);
    expect(partProgress(patrouilles, p, {})).toBe('2/2');
    expect(partMet(patrouilles, p, {})).toBe(true);
    expect(c.canon.check(p, {})).toBe(false);        // le moteur avait raison
  });

  // GARDE-FOU : les conditions canon reprennent les objectifs de faction.
  // Si un seuil bouge dans factions.js sans être répercuté ici, ce test tombe.
  it('reste d\'accord avec les objectifs de faction dont elle dérive', () => {
    const cases = [
      ['ch3', 'frente', p => { p.trapTokens = [1, 2, 3, 4].map(i => ({ hexId: i })); p.workers = [{ id: 'a', hexId: 32 }, { id: 'b', hexId: 23 }]; }],
      ['ch5', 'bayou', p => { p.capturedMech = 1; p.empireKills = 1; p.combatWins = 1; }],
      ['ch6', 'dominion', p => { p.imperialCoins = 20; }],
    ];
    cases.forEach(([chId, fac, setup]) => {
      const c = chapterById(chId), fObj = FACTIONS[fac].fObj;
      const before = createPlayer(fac, 1, false);
      expect(c.canon.check(before, {}), `${chId} validé à vide`).toBe(fObj.check(before, {}));
      const after = createPlayer(fac, 1, false);
      setup(after);
      expect(c.canon.check(after, {}), `${chId}: canon ≠ objectif de faction`).toBe(fObj.check(after, {}));
      expect(fObj.check(after, {}), `${chId}: le montage de test ne remplit pas l'objectif`).toBe(true);
    });
  });
});

describe('deck de rencontres en campagne', () => {
  const ch1 = chapterById('ch1'), ch3 = chapterById('ch3'), ch5 = chapterById('ch5');
  const railDone = () => completeChapter(emptyProgress(), 'ch1', { victory: 'canon' }).progress;

  it('partie LIBRE : contenu complet, aucun filtrage (non-régression)', () => {
    const pool = campaignEncounterPool(null, emptyProgress());
    expect(pool).toBe(ENCOUNTERS);
    expect(pool.filter(hasTeslaFragment).length).toBe(16);
  });

  it('campagne, verrou fermé : aucune carte à fragment Tesla dans le deck', () => {
    const pool = campaignEncounterPool(ch1, emptyProgress());
    expect(pool.filter(hasTeslaFragment).length).toBe(0);
    expect(pool.length).toBe(ENCOUNTERS.length - 16);
  });

  it('campagne, verrou ouvert (ch3 canon) : les cartes à fragment reviennent', () => {
    const afterCh3 = completeChapter(emptyProgress(), 'ch3', { victory: 'canon' }).progress;
    expect(campaignEncounterPool(ch5, afterCh3).filter(hasTeslaFragment).length).toBe(16);
  });

  it('Chantier ferroviaire : injecté dans les chapitres SUIVANTS, pas dans le ch.1 rejoué', () => {
    const prog = railDone();
    const ids = (ch) => new Set(campaignEncounterPool(ch, prog).map(c => c.id));
    RAIL_ENCOUNTERS.forEach(rc => {
      expect(ids(ch3).has(rc.id), `ch3 devrait contenir ${rc.id}`).toBe(true);
      expect(ids(ch1).has(rc.id), `ch1 rejoué ne doit PAS contenir ${rc.id}`).toBe(false);
    });
  });

  it('Chantier ferroviaire absent tant que le chapitre 1 n\'est pas gagné en canon', () => {
    const stars = completeChapter(emptyProgress(), 'ch1', { victory: 'stars', canonMet: false }).progress;
    const ids = new Set(campaignEncounterPool(ch3, stars).map(c => c.id));
    RAIL_ENCOUNTERS.forEach(rc => expect(ids.has(rc.id)).toBe(false));
  });
});

describe('« Le rail avance » — croissance du réseau impérial', () => {
  const villageHexes = [4, 6, 14, 27, 35, 36, 46]; // carte v3 (DEFAULT_MAP) — id 12 devient plaine en v3, id 6 devient village
  const allHexesOf = (rails) => new Set(rails.flat());

  it('n\'est pas terminé sans rail, et le devient une fois tous les villages + l\'Usine reliés', () => {
    expect(empireRailDone([])).toBe(false);
    // Réseau construit à la main, en étoile depuis l'Usine vers chaque village :
    // suffisant pour vérifier le critère d'arrêt indépendamment de l'algorithme.
    const star = villageHexes.map(v => [FACTORY_HEX, v]);
    expect(empireRailDone(star)).toBe(true);
  });

  it('pose exactement 1 segment par appel, jamais sur lac/marécage/base, jamais en double', () => {
    const seen = new Set();
    let rails = [...EMPIRE_RAILS];
    rails.forEach(([a, b]) => seen.add(`${Math.min(a, b)}-${Math.max(a, b)}`));
    let done = false;
    for (let i = 0; i < 200 && !done; i++) {
      const step = growEmpireRail(rails);
      if (step.segment) {
        const [a, b] = step.segment;
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        expect(seen.has(key), `segment ${key} posé deux fois`).toBe(false);
        seen.add(key);
        expect(step.rails.length).toBe(rails.length + 1);
      }
      rails = step.rails;
      done = step.done;
    }
    expect(done, 'le réseau ne converge pas en 200 tours').toBe(true);
    expect(empireRailDone(rails)).toBe(true);
    [...allHexesOf(rails)].forEach(id => {
      const h = hMap[id];
      expect(h, `segment vers un hex inconnu #${id}`).toBeTruthy();
      expect(h.t, `rail sur lac/marécage #${id}`).not.toMatch(/^(lac|marecage)$/);
      expect(h.base, `rail sur une base #${id}`).toBeFalsy();
    });
  });

  it('une fois terminé, n\'ajoute plus rien (idempotent)', () => {
    let rails = [...EMPIRE_RAILS];
    for (let i = 0; i < 200 && !empireRailDone(rails); i++) rails = growEmpireRail(rails).rails;
    expect(empireRailDone(rails)).toBe(true);
    const again = growEmpireRail(rails);
    expect(again.rails).toBe(rails); // même référence : aucune mutation
    expect(again.segment).toBeNull();
    expect(again.done).toBe(true);
  });

  it('part de zéro rail tout aussi bien (repli sur l\'Usine comme source)', () => {
    let rails = [];
    for (let i = 0; i < 200 && !empireRailDone(rails); i++) {
      const step = growEmpireRail(rails);
      expect(step.segment, 'croissance bloquée sans le moindre rail existant').toBeTruthy();
      rails = step.rails;
    }
    expect(empireRailDone(rails)).toBe(true);
  });
});

describe('Acier Brut', () => {
  const other = () => createPlayer('frente', 2, true);

  it('la pile grossit tant que personne ne tient Rouge River', () => {
    const players = [createPlayer('dominion', 1, false), other()];
    let s = steelTick(0, players);
    expect(s.pile).toBe(1);
    expect(s.collectorIdx).toBeNull();
    s = steelTick(s.pile, s.players);
    expect(s.pile).toBe(2);
    expect(s.players).toBe(players); // aucune copie inutile
  });

  it('le premier arrivé ramasse toute la pile en métal sur l\'Usine', () => {
    const p = createPlayer('dominion', 1, false);
    const players = [p, other()];
    const grown = steelTick(2, players);          // pile à 3
    const holder = { ...p, hero: FACTORY_HEX };
    const s = steelTick(grown.pile, [holder, players[1]]);
    expect(s.collectorIdx).toBe(0);
    expect(s.collected).toBe(4);
    expect(s.players[0].resources[FACTORY_HEX].metal).toBe(4);
    expect(s.pile).toBe(0);                        // la pile repart de zéro
    expect(holder.resources[FACTORY_HEX]).toBeUndefined(); // pureté
  });

  it('l\'Usine contestée ne verse rien à personne', () => {
    const a = { ...createPlayer('dominion', 1, false), hero: FACTORY_HEX };
    const b = { ...other(), hero: FACTORY_HEX };
    const s = steelTick(3, [a, b]);
    expect(s.collectorIdx).toBeNull();
    expect(s.pile).toBe(4);
  });

  it('un ouvrier seul suffit à ramasser (même définition que le contrôle de territoire)', () => {
    const p = createPlayer('dominion', 1, false);
    p.workers = [{ id: 'w0', hexId: FACTORY_HEX }];
    const s = steelTick(1, [p, other()]);
    expect(s.collectorIdx).toBe(0);
    expect(s.players[0].resources[FACTORY_HEX].metal).toBe(2);
  });
});

// ── Contrôle territorial unifié (correctif du 03/08) ──────────────────────
// Le score final comptait les bâtiments, la condition canon non : « on dirait
// que mon moulin n'est pas comptabilisé dans les hex Plaine/Forêt pour
// l'objectif ». Il fallait poser un mecha sur l'hex où se tenait déjà son
// propre moulin. `heldHexes` est désormais le seul point de vérité.
describe('heldHexes — contrôle unifié (unités + structures)', () => {
  const solo = () => ({ faction: 'nations', hero: 900, workers: [], mechs: [], buildings: [], trapTokens: [] });

  it('un bâtiment tient son hex sans aucune unité dessus', () => {
    const p = solo();
    p.buildings = [{ type: 'moulin', hexId: 10 }];
    expect(heldHexes(p).has(10)).toBe(true);
  });

  it('un piège ARMÉ tient son hex, un piège désamorcé non', () => {
    const p = solo();
    p.trapTokens = [{ hexId: 28 }, { hexId: 29, disarmed: true }];
    expect(heldHexes(p).has(28)).toBe(true);
    expect(heldHexes(p).has(29)).toBe(false);
  });

  it('une unité ADVERSE sur l\'hex en retire le contrôle malgré le bâtiment', () => {
    const p = solo();
    p.buildings = [{ type: 'moulin', hexId: 10 }];
    const foe = { faction: 'frente', hero: 10, workers: [], mechs: [] };
    expect(heldHexes(p, { players: [p, foe] }).has(10)).toBe(false);
    // …mais une unité à SOI sur l'hex le garde évidemment
    p.workers = [{ id: 'w', hexId: 10 }];
    expect(heldHexes(p, { players: [p, foe] }).has(10)).toBe(true);
  });

  it('une patrouille impériale conteste comme un adversaire', () => {
    const p = solo();
    p.buildings = [{ type: 'gare', hexId: 14 }];
    expect(heldHexes(p, {}).has(14)).toBe(true);
    expect(heldHexes(p, { empire: { E1: 14 } }).has(14)).toBe(false);
  });

  it('la condition canon du chapitre 1 compte les bâtiments (bug du 03/08)', () => {
    const ch1 = chapterById('ch1');
    // Deux hex Plaine/Forêt tenus par des unités, deux par des bâtiments :
    // #7 et #26 sont des plaines, #10 et #29 des forêts sur la carte v3.
    const p = { faction: 'nations', hero: 900, empireKills: 2, mechs: [{ id: 'm', hexId: 26 }],
      workers: [{ id: 'w', hexId: 29 }], buildings: [{ type: 'moulin', hexId: 7 }, { type: 'arsenal', hexId: 10 }] };
    ['plaine', 'foret'].forEach(t => expect([7, 26, 10, 29].map(id => hMap[id].t)).toContain(t));
    expect(canonMet(ch1, p, {})).toBe(true);
    // Sans les bâtiments, il n'en reste que deux sur quatre
    expect(canonMet(ch1, { ...p, buildings: [] }, {})).toBe(false);
    // Une patrouille sur le moulin fait retomber le compte à 3
    expect(canonMet(ch1, p, { empire: { E1: 7 } })).toBe(false);
  });
});
