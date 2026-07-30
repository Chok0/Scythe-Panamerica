// ═══ PROGRESSION DE CAMPAGNE ═══
// Le cœur est PUR (des objets `progress` entrent, des objets `progress`
// sortent) ; seules les deux fonctions de bout de chaîne touchent au
// localStorage, comme la sauvegarde de partie (clé 'pa-save').
//
// Forme d'un `progress` :
//   { v: 1,
//     done: { m1: { honors: bool, score: n, rank: n, turn: n, date: ms }, … },
//     unlocked: ["mats_pionniers", …] }
// `unlocked` est dérivable de `done`, mais on le stocke pour que d'anciennes
// sauvegardes survivent à un remaniement des récompenses.

import { CAMPAIGN, UNLOCKS, missionById, missionIsOpen, unlockedMatIds } from '../data/campaign.js';
import { MATS, MATS_ORIGINAL } from '../data/mats.js';

export const CAMPAIGN_KEY = 'pa-campaign';

export const emptyProgress = () => ({ v: 1, done: {}, unlocked: [] });

// Normalise n'importe quelle entrée (null, JSON douteux, version inconnue)
export const normalizeProgress = (raw) => {
  if (!raw || typeof raw !== 'object') return emptyProgress();
  const done = {};
  Object.entries(raw.done || {}).forEach(([id, entry]) => {
    if (missionById(id)) done[id] = { honors: !!entry?.honors, score: entry?.score ?? null, rank: entry?.rank ?? null, turn: entry?.turn ?? null, date: entry?.date ?? null };
  });
  const unlocked = (Array.isArray(raw.unlocked) ? raw.unlocked : []).filter(u => UNLOCKS[u]);
  // Les récompenses des missions réussies sont toujours acquises, même si le
  // tableau `unlocked` d'une vieille sauvegarde ne les contient pas.
  Object.keys(done).forEach(id => {
    const r = missionById(id)?.reward;
    if (r && UNLOCKS[r] && !unlocked.includes(r)) unlocked.push(r);
  });
  return { v: 1, done, unlocked };
};

export const doneIds = (progress) => Object.keys(progress?.done || {});
export const hasUnlock = (progress, unlockId) => (progress?.unlocked || []).includes(unlockId);

// "done" | "open" | "locked"
export const missionStatus = (progress, mission) => {
  if (progress?.done?.[mission.id]) return "done";
  return missionIsOpen(mission, doneIds(progress)) ? "open" : "locked";
};

// Première mission jouable non réussie — la « suite » proposée au joueur
export const nextMission = (progress) =>
  CAMPAIGN.find(m => missionStatus(progress, m) === "open") || null;

export const campaignComplete = (progress) =>
  CAMPAIGN.every(m => progress?.done?.[m.id]);

/** Évalue l'objectif (et les honneurs) d'une mission sur l'état de fin de partie.
 *  me  : joueur humain ; ctx : { players, rank, score, sbCoins, turn } */
export const evaluateMission = (mission, me, ctx) => {
  if (!mission || !me) return { success: false, honors: false };
  const safe = (fn) => { try { return !!fn(me, ctx || {}); } catch { return false; } };
  const success = safe(mission.goal.check);
  // Les honneurs ne se décrochent pas sur une mission ratée
  const honors = success && !!mission.honors && safe(mission.honors.check);
  return { success, honors };
};

/** Enregistre une mission réussie et applique sa récompense. Rejouer une
 *  mission déjà réussie ne peut qu'AJOUTER les honneurs, jamais les retirer. */
export const completeMission = (progress, missionId, result = {}) => {
  const mission = missionById(missionId);
  if (!mission) return normalizeProgress(progress);
  const p = normalizeProgress(progress);
  const prev = p.done[missionId];
  p.done[missionId] = {
    honors: !!result.honors || !!prev?.honors,
    score: result.score ?? prev?.score ?? null,
    rank: result.rank ?? prev?.rank ?? null,
    turn: result.turn ?? prev?.turn ?? null,
    date: result.date ?? Date.now(),
  };
  if (mission.reward && UNLOCKS[mission.reward] && !p.unlocked.includes(mission.reward)) {
    p.unlocked.push(mission.reward);
  }
  return p;
};

/** Plateaux joueur sélectionnables : les 6 standard + les originaux débloqués. */
export const availableMats = (progress, useUnlocked = true) => {
  if (!useUnlocked) return MATS;
  const ids = unlockedMatIds(progress?.unlocked || []);
  return [...MATS, ...MATS_ORIGINAL.filter(m => ids.includes(m.id))];
};

/** Le plateau choisi est-il encore sélectionnable ? (déblocage retiré, toggle
 *  de contenu décoché…) — sert à retomber sur un plateau valide. */
export const matIsAvailable = (matId, progress, useUnlocked = true) =>
  availableMats(progress, useUnlocked).some(m => m.id === matId);

/** Résumé des règles apportées par les déblocages actifs (bandeau de setup). */
export const activeUnlocks = (progress, useUnlocked = true) =>
  useUnlocked ? (progress?.unlocked || []).map(id => UNLOCKS[id]).filter(Boolean) : [];

/** Libellé court d'une mission pour les logs de partie. */
export const missionLabel = (mission) =>
  mission ? `${mission.icon} Mission ${mission.num} — ${mission.name}` : "";

// ── Persistance (localStorage indisponible → progression en mémoire) ──
export const loadProgress = () => {
  try { return normalizeProgress(JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || "null")); }
  catch { return emptyProgress(); }
};

export const saveProgress = (progress) => {
  try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(normalizeProgress(progress))); }
  catch { /* stockage indisponible : la progression reste en mémoire */ }
};

export const resetProgress = () => {
  try { localStorage.removeItem(CAMPAIGN_KEY); } catch { /* rien */ }
  return emptyProgress();
};
