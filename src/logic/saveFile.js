// ── Fichier de sauvegarde de campagne (export / import) ───────────────────
// Le jeu se distribue en un HTML autonome ouvert en local : le `localStorage`
// y est lié à l'origine du fichier, donc perdu au moindre nettoyage de cache,
// changement de navigateur ou de machine. Une campagne de huit chapitres ne
// peut pas dépendre de ça — d'où un vrai fichier, téléchargé et rechargé à la
// main, qui embarque À LA FOIS :
//   · la progression de campagne (chapitres terminés + legs débloqués) ;
//   · la partie EN COURS s'il y en a une (le contenu de `pa-save`), pour
//     reprendre un chapitre au tour près.
import { normalizeProgress } from './campaign.js';
import { CHAPTERS } from '../data/campaign.js';

export const SAVE_FORMAT = "scythe-panamerica";
export const SAVE_KIND = "campagne";
export const SAVE_VERSION = 1;

/** Une sauvegarde de partie n'est retenue que si elle est exploitable —
 *  `resumeSaved()` exige au minimum une liste de joueurs non vide. */
export const isUsableGame = (g) => !!g && Array.isArray(g.players) && g.players.length > 0;

export const buildSaveBundle = ({ progress, game = null, date = null } = {}) => ({
  app: SAVE_FORMAT, kind: SAVE_KIND, v: SAVE_VERSION, date,
  progress: normalizeProgress(progress),
  game: isUsableGame(game) ? game : null,
});

/** Nom de fichier parlant : on y lit l'avancement sans ouvrir le fichier. */
export const saveFileName = (progress, isoDate) => {
  const done = Object.keys(normalizeProgress(progress).done).length;
  const stamp = (isoDate || "").slice(0, 10) || "sans-date";
  return `scythe-campagne-${done}sur${CHAPTERS.length}-${stamp}.json`;
};

/** Relecture TOLÉRANTE d'un fichier importé : le joueur peut se tromper de
 *  fichier, l'éditer, ou charger un journal de partie à la place.
 *  → `{ ok:true, progress, game, date }` ou `{ ok:false, error }`. */
export const parseSaveBundle = (text) => {
  let data;
  try { data = JSON.parse(text); }
  catch { return { ok: false, error: "Fichier illisible : ce n'est pas du JSON." }; }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return { ok: false, error: "Fichier illisible : contenu inattendu." };
  if (data.app !== SAVE_FORMAT)
    return { ok: false, error: "Ce fichier n'est pas une sauvegarde Scythe Panamerica." };
  if (data.kind !== SAVE_KIND)
    return { ok: false, error: "Ce fichier n'est pas une sauvegarde de campagne (journal de partie ?)." };
  if (typeof data.v === "number" && data.v > SAVE_VERSION)
    return { ok: false, error: `Sauvegarde créée par une version plus récente du jeu (format ${data.v}).` };
  return {
    ok: true,
    progress: normalizeProgress(data.progress),
    game: isUsableGame(data.game) ? data.game : null,
    date: data.date || null,
  };
};

/** Résumé lisible d'un bundle, pour la confirmation d'import. */
export const describeSave = ({ progress, game }) => {
  const done = Object.keys(normalizeProgress(progress).done).length;
  const legs = normalizeProgress(progress).legacies.length;
  const partie = isUsableGame(game)
    ? `partie en cours au tour ${game.turn || 1}${game.chapter ? ` (chapitre ${game.chapter})` : ""}`
    : "aucune partie en cours";
  return `${done}/${CHAPTERS.length} chapitre(s), ${legs} legs — ${partie}`;
};
