import { describe, it, expect } from 'vitest';
import { CHAPTERS, chapterById, FACTORY_HEX, controlsFactory } from '../../data/campaign.js';
import { LEGACIES, LEGACY_IDS } from '../../data/legacies.js';
import { hMap } from '../../data/hexes.js';
import { EMPIRE_RAILS } from '../../data/empire.js';
import {
  emptyProgress, normalizeProgress, loadProgress, saveProgress, resetProgress,
  isChapterUnlocked, isChapterDone, chapterStates, nextChapter, campaignComplete,
  canonMet, completeChapter, unlockedLegacies, campaignConfig, steelTick, CAMPAIGN_KEY,
  teslaEncountersUnlocked, teslaPlansUnlocked, empireRailDone, growEmpireRail,
} from '../campaign.js';
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
