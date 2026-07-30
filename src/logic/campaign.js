// ── Moteur de campagne (pur, testable) ────────────────────────────────────
// Progression, déblocages et variantes de partie. Aucune dépendance React :
// App.jsx ne fait qu'appeler ces fonctions et stocker le résultat.
//
// Deux règles du document de campagne (docs/campagne.md) sont implémentées
// ici, et nulle part ailleurs :
//  · ordre STRICTEMENT causal — le chapitre N ne s'ouvre qu'une fois le
//    chapitre N-1 terminé ;
//  · DEUX voies de victoire par chapitre — la condition canon du scénario,
//    ou les 6 étoiles classiques ; la première atteinte l'emporte.
import { CHAPTERS, chapterById, heldHexes, FACTORY_HEX } from '../data/campaign.js';
import { LEGACIES } from '../data/legacies.js';
import { STRUCTURE_BONUSES } from '../data/structureBonus.js';

export const CAMPAIGN_KEY = 'pa-campagne';

// ── Progression ───────────────────────────────────────────────────────────
// { v, done: { ch1: {victory:"canon"|"stars"|"lu", canonMet, date} }, legacies: [id] }
export const emptyProgress = () => ({ v: 1, done: {}, legacies: [] });

/** Tolérante à une sauvegarde partielle ou d'une version antérieure. */
export const normalizeProgress = (raw) => {
  const p = emptyProgress();
  if (!raw || typeof raw !== "object") return p;
  const done = raw.done && typeof raw.done === "object" ? raw.done : {};
  Object.entries(done).forEach(([id, entry]) => {
    if (!chapterById(id) || !entry) return;
    p.done[id] = {
      victory: entry.victory || "lu",
      canonMet: !!entry.canonMet,
      date: entry.date || null,
    };
  });
  p.legacies = (Array.isArray(raw.legacies) ? raw.legacies : []).filter(id => LEGACIES[id]);
  return p;
};

export const loadProgress = (storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return emptyProgress();
  try { return normalizeProgress(JSON.parse(store.getItem(CAMPAIGN_KEY) || "null")); }
  catch { return emptyProgress(); }
};

export const saveProgress = (progress, storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return false;
  try { store.setItem(CAMPAIGN_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
};

export const resetProgress = (storage) => {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  try { store?.removeItem(CAMPAIGN_KEY); } catch { /* stockage indisponible */ }
  return emptyProgress();
};

// ── Ordre causal ──────────────────────────────────────────────────────────
export const isChapterDone = (progress, id) => !!progress?.done?.[id];

/** Le chapitre 1 est toujours ouvert ; les suivants exigent le précédent. */
export const isChapterUnlocked = (progress, id) => {
  const idx = CHAPTERS.findIndex(c => c.id === id);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return isChapterDone(progress, CHAPTERS[idx - 1].id);
};

/** État complet pour l'écran de campagne (une entrée par chapitre). */
export const chapterStates = (progress) => CHAPTERS.map(c => ({
  chapter: c,
  unlocked: isChapterUnlocked(progress, c.id),
  done: isChapterDone(progress, c.id),
  result: progress?.done?.[c.id] || null,
}));

/** Prochain chapitre à jouer : le premier ouvert et non terminé. */
export const nextChapter = (progress) =>
  CHAPTERS.find(c => isChapterUnlocked(progress, c.id) && !isChapterDone(progress, c.id)) || null;

export const campaignComplete = (progress) => CHAPTERS.every(c => isChapterDone(progress, c.id));

// ── Condition canon ───────────────────────────────────────────────────────
/** Le joueur remplit-il la condition canon du chapitre ?
 *  Un chapitre sans condition (interlude) renvoie toujours false : sa seule
 *  voie mécanique reste les 6 étoiles. */
export const canonMet = (chapter, player, ctx) => {
  if (!chapter?.canon || !player) return false;
  try { return !!chapter.canon.check(player, ctx || {}); }
  catch { return false; }
};

// ── Fin de chapitre ───────────────────────────────────────────────────────
/** Enregistre un chapitre terminé et débloque son legs.
 *  `victory` : "canon" (condition du scénario) · "stars" (6 étoiles atteintes
 *  par le joueur) · "lu" (interlude lu).
 *  Le legs n'est débloqué que si la condition canon a été REMPLIE — gagner
 *  aux étoiles termine le chapitre mais ne donne pas la récompense de Tesla.
 *  Renvoie `{ progress, legacy }` (legacy = objet legs neuf, ou null). */
export const completeChapter = (progress, chapterId, { victory = "canon", canonMet: met = victory === "canon", date = null } = {}) => {
  const chapter = chapterById(chapterId);
  const base = normalizeProgress(progress);
  if (!chapter) return { progress: base, legacy: null };
  const next = {
    ...base,
    done: { ...base.done, [chapterId]: { victory, canonMet: !!met, date } },
    legacies: [...base.legacies],
  };
  let legacy = null;
  if (met && chapter.unlock && LEGACIES[chapter.unlock] && !next.legacies.includes(chapter.unlock)) {
    next.legacies.push(chapter.unlock);
    legacy = LEGACIES[chapter.unlock];
  }
  return { progress: next, legacy };
};

export const unlockedLegacies = (progress) =>
  (progress?.legacies || []).map(id => LEGACIES[id]).filter(Boolean);

// ── Configuration de partie d'un chapitre ─────────────────────────────────
/** Traduit les variantes du chapitre en réglages de partie pour App.jsx. */
export const campaignConfig = (chapter) => {
  const v = chapter?.variant || {};
  return {
    faction: chapter?.faction || null,
    empireEnabled: !!v.empire,
    steel: !!v.steel,
    // Tuile bonus FORCÉE (Ruée vers l'or au chapitre 3) — null = tirage normal
    bonusTile: v.bonusTile ? (STRUCTURE_BONUSES.find(b => b.id === v.bonusTile) || null) : null,
  };
};

// ── Acier Brut (variante Rouge River) ─────────────────────────────────────
// « À chaque tour, Rouge River génère 1 Acier Brut, récupéré par le joueur
// qui la contrôle ; si personne ne la contrôle, l'Acier s'accumule. »
// La pile revient donc ENTIÈRE au premier arrivé — récompense croissante.
// Contestée (plusieurs joueurs sur l'hex), la pile ne part pas : personne ne
// ramasse tant que le contrôle n'est pas net.
export const STEEL_HEX = FACTORY_HEX;

/** Tour d'Acier Brut. Pur : renvoie une NOUVELLE liste de joueurs.
 *  `{ pile, players, collectorIdx, collected }`. */
export const steelTick = (pile, players) => {
  const grown = (pile || 0) + 1;
  const holders = (players || []).map((p, i) => (p && heldHexes(p).has(STEEL_HEX) ? i : -1)).filter(i => i >= 0);
  if (holders.length !== 1) return { pile: grown, players, collectorIdx: null, collected: 0 };
  const idx = holders[0];
  const p = players[idx];
  const resources = { ...(p.resources || {}) };
  const onHex = { ...(resources[STEEL_HEX] || {}) };
  onHex.metal = (onHex.metal || 0) + grown;
  resources[STEEL_HEX] = onHex;
  const next = [...players];
  next[idx] = { ...p, resources };
  return { pile: 0, players: next, collectorIdx: idx, collected: grown };
};
