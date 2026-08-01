import { describe, it, expect } from 'vitest';
import { buildSaveBundle, parseSaveBundle, saveFileName, describeSave, isUsableGame, SAVE_FORMAT } from '../saveFile.js';
import { completeChapter, emptyProgress } from '../campaign.js';

const prog2 = () => completeChapter(
  completeChapter(emptyProgress(), 'ch1', { victory: 'canon' }).progress,
  'ch2', { victory: 'lu', canonMet: false }).progress;

const game = (over = {}) => ({ v: 2, turn: 7, chapter: 'ch3', steelPile: 2, players: [{ faction: 'frente' }], ...over });

describe('fichier de sauvegarde de campagne', () => {
  it('un aller-retour export → import conserve progression, legs et partie en cours', () => {
    const bundle = buildSaveBundle({ progress: prog2(), game: game(), date: '2026-07-30T10:00:00.000Z' });
    const back = parseSaveBundle(JSON.stringify(bundle));
    expect(back.ok).toBe(true);
    expect(Object.keys(back.progress.done)).toEqual(['ch1', 'ch2']);
    expect(back.progress.legacies).toEqual(['railCards']);
    expect(back.game.turn).toBe(7);
    expect(back.game.chapter).toBe('ch3');
    expect(back.game.steelPile).toBe(2);
  });

  it('exporter sans partie en cours reste valide', () => {
    const bundle = buildSaveBundle({ progress: prog2() });
    expect(bundle.game).toBeNull();
    const back = parseSaveBundle(JSON.stringify(bundle));
    expect(back.ok).toBe(true);
    expect(back.game).toBeNull();
  });

  it('une partie inexploitable (sans joueurs) est écartée plutôt qu\'importée à moitié', () => {
    expect(isUsableGame({ turn: 3, players: [] })).toBe(false);
    expect(isUsableGame(null)).toBe(false);
    expect(buildSaveBundle({ progress: emptyProgress(), game: { turn: 3 } }).game).toBeNull();
  });

  it('refuse un fichier étranger, un JSON cassé, ou un journal de partie', () => {
    expect(parseSaveBundle('pas du json').ok).toBe(false);
    expect(parseSaveBundle('[1,2,3]').ok).toBe(false);
    expect(parseSaveBundle(JSON.stringify({ jeu: 'Scythe Panamerica', classement: [] })).ok).toBe(false);
    const journal = parseSaveBundle(JSON.stringify({ app: SAVE_FORMAT, kind: 'journal' }));
    expect(journal.ok).toBe(false);
    expect(journal.error).toMatch(/campagne/i);
  });

  it('refuse un format plus récent au lieu de charger n\'importe quoi', () => {
    const r = parseSaveBundle(JSON.stringify({ app: SAVE_FORMAT, kind: 'campagne', v: 99, progress: {} }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/plus récente/);
  });

  it('un fichier trafiqué (chapitre ou legs inventé) est nettoyé, pas rejeté', () => {
    const r = parseSaveBundle(JSON.stringify({
      app: SAVE_FORMAT, kind: 'campagne', v: 1,
      progress: { done: { ch1: { victory: 'canon', canonMet: true }, chZZ: { victory: 'canon' } }, legacies: ['railCards', 'triche'] },
    }));
    expect(r.ok).toBe(true);
    expect(Object.keys(r.progress.done)).toEqual(['ch1']);
    expect(r.progress.legacies).toEqual(['railCards']);
  });

  it('le nom de fichier porte l\'avancement et la date', () => {
    expect(saveFileName(prog2(), '2026-07-30T10:00:00.000Z')).toBe('scythe-campagne-2sur8-2026-07-30.json');
    expect(saveFileName(emptyProgress(), null)).toBe('scythe-campagne-0sur8-sans-date.json');
  });

  it('le résumé d\'import décrit ce que le joueur va écraser', () => {
    expect(describeSave({ progress: prog2(), game: game() })).toBe('2/8 chapitre(s), 1 legs — partie en cours au tour 7 (chapitre ch3)');
    expect(describeSave({ progress: emptyProgress(), game: null })).toBe('0/8 chapitre(s), 0 legs — aucune partie en cours');
  });
});
